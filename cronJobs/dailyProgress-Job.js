const cron = require('node-cron');
const { Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { CLASSROOM_STATUS } = require('../utils/enumTypes.js');
// @ts-ignore
const { User, ClassroomStudent, Classroom, ClassroomCourses, Standard, DailyUpload, Resource, Video, Question, VideoQuestionAnswer, AssessmentResourcesDetail, AssessmentAnswer, DailyProgress } = require('../models/index.js');

const getDailyProgressOfStudent = async ({ studentId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const data = await ClassroomStudent.findOne({
            where: {
                studentId: studentId
            },
            required: true,
            attributes: [ "id" ],
            include: [ 
                {
                    model: Classroom,
                    as: 'classroom',
                    where: { status: CLASSROOM_STATUS.ACTIVE },
                    attributes: [ "id", "name" ],
                    include: [{
                        model: ClassroomCourses,
                        as: 'classroomCourses',
                        attributes: [ "id" ],
                        include: [{
                            model: Standard,
                            as: 'standard',
                            attributes: [ "id", "name" ],
                            include: [{ 
                                model: DailyUpload, 
                                as: 'dailyUploads',
                                attributes: ['id', 'accessDate', 'weightage'],
                                where: {
                                    weightage: {
                                        [Op.gt]: 0
                                    }
                                },
                                required: true,
                                separate: true,
                                include: [{
                                    model: Resource,
                                    as: 'resource',
                                    attributes: ['id', 'name', 'type', 'topic', 'url'],
                                    include: [
                                        {
                                            model: Video,
                                            as: 'video',
                                            attributes: ['id'],
                                            include: [{
                                                separate: true,
                                                model: Question,
                                                as: 'questions',
                                                required: false,
                                                attributes: ['id', 'totalMarks'],
                                                include: [{
                                                    separate: true,
                                                    model: VideoQuestionAnswer,
                                                    as: 'answers',
                                                    where: { userId: studentId },
                                                    required: false,
                                                    attributes: ['obtainedMarks']
                                                }]
                                            }]
                                        },
                                        {
                                            model: AssessmentResourcesDetail,
                                            as: 'AssessmentResourcesDetail',
                                            attributes: ['id', 'totalMarks', 'deadline'],
                                            include: [{
                                                separate: true,
                                                model: AssessmentAnswer,
                                                as: 'assessmentAnswers',
                                                where: { userId: studentId },
                                                attributes: ['obtainedMarks', 'answerURL'],
                                                required: false,
                                            }]
                                        }
                                    ]
                                }]
                            }]
                        }],
                    }],
                }
            ],
        });

        // Current date for comparison
        const today = new Date();
        const result = await data?.get({plain: true});

        if (!result || !result.classroom || !result.classroom.classroomCourses) {
            return {
                code: 200,
                data: [],
            };
        }

        const transformedData = data?.classroom?.classroomCourses?.map(course => {
            const standard = course?.standard;
            let totalWeightage = 0;
            let obtainedWeightage = 0;
    
            standard?.dailyUploads?.forEach(upload => {
                let totalObtainedMarks = 0;
                let totalPossibleMarks = 0;
                const accessDate = new Date(upload.accessDate);
    
                // Only consider uploads with accessDate < today
                if (accessDate < today) {
                    totalWeightage += upload.weightage;
    
                    // Process resource's video questions
                    if (upload.resource.video) {
                        totalPossibleMarks = upload.resource.video?.questions?.reduce((total, question) => {
                            return total + question.totalMarks;
                        }, 0);
                        upload.resource.video.questions.forEach(question => {
                            question?.answers?.forEach(answer => {
                                totalObtainedMarks += answer.obtainedMarks === -1 ? 0 : answer.obtainedMarks;
                            });
                        });
                    }
    
                    // Process resource's assessment answers
                    if (upload.resource.AssessmentResourcesDetail) {
                        upload.resource.AssessmentResourcesDetail.assessmentAnswers.forEach(answer => {
                            totalObtainedMarks += answer?.obtainedMarks === -1 ? 0 : answer?.obtainedMarks;
                        });
                        totalPossibleMarks += upload.resource.AssessmentResourcesDetail?.totalMarks || 0;
                    }
                    obtainedWeightage += totalPossibleMarks > 0 ? (totalObtainedMarks / totalPossibleMarks) * upload.weightage : upload.weightage;
                }
            })
            return {
                standardId: standard.id,
                standardName: standard.name,
                totalWeightage: totalWeightage,
                obtainedWeightage: obtainedWeightage
            };
        })?.filter(entry => entry.totalWeightage > 0);

        // Calculate average total weightage
        const totalTotalWeightage = transformedData?.reduce((total, entry) => {
            return total + entry.totalWeightage;
        }, 0);
        const averageTotalWeightage = transformedData?.length > 0 ? totalTotalWeightage / transformedData.length : 0;
        
        // Calculate average obtained weightage
        const totalObtainedWeightage = transformedData?.reduce((total, entry) => {
            return total + entry.obtainedWeightage;
        }, 0);
        const averageObtainedWeightage = transformedData?.length > 0 ? totalObtainedWeightage / transformedData.length : 0;
        const formattedDate = today.toISOString().split('T')[0];
        return {
            code: 200,
            data: {
                totalWeightage: averageTotalWeightage,
                obtainedWeightage: averageObtainedWeightage,
                classroomStudentId: data.id,
                date: formattedDate
            }
        };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the saved videos');
        return { code: 500 };
    }
}


const calculateAndStoreAveragesForAllStudents = async () => {
    try {
        const students = await User.findAll({
            where: { role: 'student' }, 
            attributes: ['id'],
            include: [{
                model: ClassroomStudent,
                required: true,
                include: [ 
                    {
                        model: Classroom,
                        as: 'classroom',
                        where: { status: CLASSROOM_STATUS.ACTIVE },
                        required: true,
                    }
                ]
            }]
        });

        const tasks = students.map(async (student) => {
            const result = await getDailyProgressOfStudent({ studentId: student.id });

            if (result.code === 200) {
                const data = result.data;
                // @ts-ignore
                if (!data || !data.classroomStudentId || data.classroomStudentId === '') {
                    return Promise.reject('Missing classroomStudentId, i.e. Not enrolled in any classroom');
                }
                await DailyProgress.create({ ...data });
            }
        });

        await Promise.all(tasks);
    } catch (error) {
        console.error('Error in calculating averages:', error);
    }
};


// Disabled: Student functionality has been removed from the system
// cron.schedule('0 0 * * *', calculateAndStoreAveragesForAllStudents);
