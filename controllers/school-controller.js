const Model = require("../models");
const { logger } = require("../Logs/logger.js");
const { successResponse, failureResponse } = require("../utils/response.js");
const { Op, Sequelize, where } = require("sequelize");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");
const school = require("../models/school");



const createSchool = async (req, res) => {
  const transaction = await Model.sequelize.transaction();
  try {
    const { name, email, password, schoolName } = req.body;

    const existingUser = await Model.User.findOne({
      where: {
        email: email,
      },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      return successResponse(res, 200, "User already exists");
    }

    const school = await Model.School.create(
      {
        name: schoolName,
      },
      { transaction }
    );

    const user = await Model.User.create(
      {
        name: name,
        email: email,
        password: password,
        school_id: school.id,
        role: "school",
      },
      { transaction }
    );

    await transaction.commit();

    return successResponse(res, 200, "User and School created successfully");
  } catch (error) {
    await transaction.rollback();
    return failureResponse(res, 500, error.message);
  }
};

const schoolDashboard = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return successResponse(res, 400, "Missing Required Fields");
    }

    const totalStudentCount = await Model.User.count({
      where: {
        school_id: schoolId,
      },
    });

    const totalClassroomCount = await Model.Classroom.count({
      include: [
        {
          model: Model.User,
          where: {
            school_id: schoolId,
          },
        },
      ],
    });

    const getSchoolTeacher = await Model.User.findAll({
      attributes: ["id", "name", "email", "role", "image"],
      where: {
        school_id: schoolId,
        role: "teacher",
      },
      // limit: 4,
    });

    const getSchoolTickets = await Model.Ticket.findAll({
      attributes: [
        "id",
        // [Sequelize.literal('"User"."name"'), "name"],
        "complaint_type",
        "message",
        "status",
        "submitted_by",
        [Sequelize.col("Ticket.createdAt"), "Date"],
      ],
      include: [
        {
          model: Model.User,
          where: {
            school_id: schoolId,
            role: "admin",
          },
        },
      ],
    });

    const data = await Model.Classroom.findAll({
      where: { status: CLASSROOM_STATUS.ACTIVE, schoolId: schoolId },
      attributes: ["id", "name"],
      include: [
        {
          model: Model.ClassroomCourses,
          as: "classroomCourses",
          attributes: ["id"],
          include: [
            {
              model: Model.Standard,
              as: "standard",
              attributes: ["id", "name"],
              include: [
                {
                  model: Model.DailyUpload,
                  as: "dailyUploads",
                  attributes: ["id", "accessDate", "weightage"],
                  where: {
                    accessDate: {
                      [Op.lt]: new Date(), // Only consider uploads with access date in the past
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          model: Model.ClassroomStudent,
          as: "classroomStudents",
          attributes: ["id", "classroomId", "studentId"],
          include: [
            {
              model: Model.User,
              as: "student",
              attributes: ["id", "name", "email", "image"],
              include: [
                {
                  model: Model.AssessmentAnswer,
                  attributes: ["id", "userId", "standardId", "obtainedMarks"],
                  separate: true,
                  required: false,
                  include: [
                    {
                      model: Model.AssessmentResourcesDetail,
                      as: "assessmentResourcesDetail",
                      attributes: [
                        "id",
                        "totalMarks",
                        "deadline",
                        "resourceId",
                      ],
                      include: [
                        {
                          model: Model.Resource,
                          as: "resource",
                          attributes: ["id", "name", "type", "topic", "url"],
                          include: [
                            {
                              model: Model.DailyUpload,
                              as: "DailyUpload",
                              attributes: [
                                "weightage",
                                "accessDate",
                                "standardId",
                                "resourceId",
                              ],
                              where: {
                                accessDate: {
                                  [Op.lt]: new Date(), // Only consider uploads with access date in the past
                                },
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  model: Model.VideoQuestionAnswer,
                  attributes: ["id", "userId", "obtainedMarks"],
                  separate: true,
                  required: false,
                  include: [
                    {
                      model: Model.Question,
                      as: "question",
                      attributes: ["id", "totalMarks"],
                      include: [
                        {
                          model: Model.Video,
                          as: "video",
                          attributes: ["id", "resourceId"],
                          include: [
                            {
                              model: Model.Resource,
                              as: "resource",
                              attributes: [
                                "id",
                                "name",
                                "type",
                                "topic",
                                "url",
                              ],
                              include: [
                                {
                                  model: Model.DailyUpload,
                                  as: "DailyUpload",
                                  attributes: [
                                    "weightage",
                                    "accessDate",
                                    "standardId",
                                    "resourceId",
                                  ],
                                  where: {
                                    accessDate: {
                                      [Op.lt]: new Date(), // Only consider uploads with access date in the past
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    let totalClassroomWeightage = 0;
    let totalObtainedWeightage = 0;
    const classroomsData = {};

    data?.forEach((classItem) => {
      const standardsData = {};

      let totalClassroomWeightage = 0;
      let totalObtainedWeightage = 0;

      // Calculate total weightage for each standard in the class
      classItem.classroomCourses?.forEach((course) => {
        const standard = course.standard;
        if (standard) {
          const standardId = standard.id;
          const standardName = standard.name;

          let currentTotalWeightage = 0;
          let obtainedWeightageSum = 0;
          let totalObtainedMarks = 0; // Initialize total obtained marks for the standard

          // Sum up weightage from dailyUploads that have passed access date
          course.standard?.dailyUploads?.forEach((upload) => {
            if (new Date(upload.accessDate) < new Date()) {
              currentTotalWeightage += upload.weightage;
            }
          });

          // Sum obtained weightage and obtained marks for all students in this standard
          classItem.classroomStudents?.forEach((student) => {
            const studentVideoAnswers =
              student.student?.VideoQuestionAnswers || [];
            const studentAssessmentAnswers =
              student.student?.AssessmentAnswers || [];

            // Sum obtained weightage and obtained marks for VideoQuestionAnswers
            studentVideoAnswers.forEach((answer) => {
              const videoQuestion = answer.question;
              let obtainedMarks = answer.obtainedMarks;
              if (obtainedMarks < 0) {
                obtainedMarks = 0; // Consider obtained marks as 0 if less than 0
              }
              if (
                videoQuestion?.video?.resource?.DailyUpload?.accessDate &&
                new Date(videoQuestion.video.resource.DailyUpload.accessDate) <
                  new Date()
              ) {
                const obtainedWeightage =
                  (obtainedMarks / videoQuestion.totalMarks) *
                  videoQuestion.video.resource.DailyUpload.weightage;
                obtainedWeightageSum += obtainedWeightage;
                totalObtainedMarks += obtainedMarks; // Add to total obtained marks
              }
            });

            // Sum obtained weightage and obtained marks for AssessmentAnswers
            studentAssessmentAnswers.forEach((answer) => {
              const assessmentResource = answer.assessmentResourcesDetail;
              let obtainedMarks = answer.obtainedMarks;
              if (obtainedMarks < 0) {
                obtainedMarks = 0; // Consider obtained marks as 0 if less than 0
              }
              if (
                assessmentResource?.resource?.DailyUpload?.accessDate &&
                new Date(assessmentResource.resource.DailyUpload.accessDate) <
                  new Date()
              ) {
                const obtainedWeightage =
                  (obtainedMarks / assessmentResource.totalMarks) *
                  assessmentResource.resource.DailyUpload.weightage;
                obtainedWeightageSum += obtainedWeightage;
                totalObtainedMarks += obtainedMarks; // Add to total obtained marks
              }
            });
          });

          // Calculate average obtained weightage per student, including those who haven't answered
          const totalStudentsInClass = classItem.classroomStudents.length;
          const averageObtainedWeightage =
            totalStudentsInClass > 0
              ? obtainedWeightageSum / totalStudentsInClass
              : 0;

          // Store data for the standard
          standardsData[standardId] = {
            totalWeightage: currentTotalWeightage,
            obtainedWeightage: averageObtainedWeightage,
            totalObtainedMarks: totalObtainedMarks, // Store total obtained marks for the standard
          };

          // Accumulate total weightage for the class
          totalClassroomWeightage += currentTotalWeightage;
          totalObtainedWeightage += averageObtainedWeightage;
        }
      });

      // Calculate performance metrics for the class
      const totalStandardsInClass = Object.keys(standardsData).length;
      const classTotalWeightage =
        totalStandardsInClass > 0
          ? totalClassroomWeightage / totalStandardsInClass
          : 0;
      const classObtainedWeightage =
        totalStandardsInClass > 0
          ? totalObtainedWeightage / totalStandardsInClass
          : 0;

      classroomsData[classItem.id] = {
        totalWeightage: classTotalWeightage,
        obtainedWeightage: classObtainedWeightage,
        standards: standardsData,
      };

      // Reset total weightages for the next class
      totalClassroomWeightage = 0;
      totalObtainedWeightage = 0;
    });

    // Calculate overall school performance metrics
    const totalClasses = Object.keys(classroomsData).length;
    let totalSchoolWeightage = 0;
    let totalSchoolObtainedWeightage = 0;

    // Sum up total weightage and obtained weightage for all classes
    Object.values(classroomsData).forEach((classData) => {
      totalSchoolWeightage += classData.totalWeightage;
      totalSchoolObtainedWeightage += classData.obtainedWeightage;
      console.log(totalSchoolWeightage, totalSchoolObtainedWeightage);
    });

    // Calculate school performance metrics
    const schoolTotalWeightage =
      totalClasses > 0 ? totalSchoolWeightage / totalClasses : 0;
    const schoolObtainedWeightage =
      totalClasses > 0 ? totalSchoolObtainedWeightage / totalClasses : 0;

    const response = {
      totalStudent: totalStudentCount,
      totalClassroom: totalClassroomCount,
      getSchoolTeacher: getSchoolTeacher,
      getSchoolTickets: getSchoolTickets,
      overAllPerformance: classroomsData,
      totalWeightage: schoolTotalWeightage,
      obtainedWeightage: schoolObtainedWeightage,
    };

    return successResponse(
      res,
      200,
      "User and School created successfully",
      response
    );
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const createTicket = async (req, res) => {
  try {
    const { schoolId, complaintType, message } = req.body;

    if (!schoolId || !complaintType || !message) {
      return successResponse(res, 400, "Missing required Fields");
    }

    const ticket = await Model.Ticket.create({
      complaint_type: complaintType,
      message,
      submitted_by: schoolId,
      status: "active",
    });

    return successResponse(res, 200, "Ticket created successfully", ticket);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const updateTicket = async (req, res) => {
  try {
    const { complaintType, message, status, ticketId } = req.body;

    if (!ticketId) {
      return successResponse(res, 400, "Missing required Fields");
    }

    const ticket = await Model.Ticket.findByPk(ticketId);

    if (!ticket) {
      return failureResponse(res, 404, "Ticket not found");
    }

    ticket.complaint_type = complaintType || ticket.complaint_type;
    ticket.message = message || ticket.message;
    ticket.status = status || ticket.status;

    await ticket.save();

    return successResponse(res, 200, "Ticket updated successfully", ticket);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.query;

    if (!ticketId) {
      return successResponse(res, 400, "Missing required Fields");
    }
    const ticket = await Model.Ticket.findByPk(ticketId);

    if (!ticket) {
      return failureResponse(res, 404, "Ticket not found");
    }

    await ticket.destroy();

    return successResponse(res, 200, "Ticket deleted successfully");
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.query;

    const ticket = await Model.Ticket.findOne({
      where: {
        id: ticketId,
      },
      include: [
        {
          model: Model.User,
          attributes: ["name"],
        },
      ],
    });

    if (!ticket) {
      return failureResponse(res, 404, "Ticket not found");
    }

    return successResponse(res, 200, "Ticket retrieved successfully", ticket);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const listTickets = async (req, res) => {
  try {
    const { schoolId } = req.query;

    const tickets = await Model.Ticket.findAll({
      where: {
        submitted_by: schoolId,
      },
      include: [
        {
          model: Model.User,
          attributes: ["name"],
        },
      ],
    });

    return successResponse(res, 200, "Tickets retrieved successfully", tickets);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const listTeacher = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let { schoolId } = req.query;

    let filterCriteria = {};

    if (schoolId) {
      filterCriteria.school_id = schoolId;
    }

    const offset = (page - 1) * limit;

    // Total data in database count
    const totalRecords = await Model.User.count({
      where: { role: "teacher" },
    });

    // Apply search filter
    if (req.query.search) {
      const searchCriteria = {
        [Op.iLike]: `%${req.query.search}%`,
      };
      filterCriteria = {
        ...filterCriteria,
        [Op.or]: [{ name: searchCriteria }, { email: searchCriteria }],
      };
    }

    // Total count with filtrations
    const totalCount = await Model.User.count({ where: filterCriteria });

    // Apply Filter on limit
    if (limit === -1) {
      limit = totalRecords;
    }

    const teachers = await Model.Classroom.findAll({
      attributes: [
        [
          Sequelize.fn("COUNT", Sequelize.col("Classroom.id")),
          "classroomCount",
        ],
      ],
      include: [
        {
          model: Model.User,
          attributes: ["id", "name", "email"],
          where: filterCriteria,
        },
      ],
      group: ["User.id"],
      limit: limit,
      offset: offset,
    });

    const totalPages = Math.ceil(totalCount / limit);

    const pagination = {
      totalRecords,
      currentPage: page,
      limit: limit,
      totalCount: totalCount,
      totalPages: totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    const response = {
      teachers,
      pagination,
    };
    return successResponse(res, 200, "Teachers fetched successfully", response);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const getTeacher = async (req, res) => {
  try {
    let { teacherId } = req.query;

    if (!teacherId) {
      return successResponse(res, 400, "Missing Required Fields");
    }

    const teachers = await Model.Classroom.findAll({
      include: [
        {
          model: Model.ClassroomCourses,
          attributes: ["standardId"],
          as: "classroomCourses",
        },
        {
          model: Model.User,
          attributes: ["id", "name", "email", "image"],
          where: {
            id: teacherId,
          },
        },
      ],
    });

    return successResponse(res, 200, "Teachers fetched successfully", teachers);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const deleteTeacher = async (req, res) => {
  try {
    let { teacherId } = req.query;

    if (!teacherId) {
      return successResponse(res, 400, "Missing Required Fields");
    }

    const deletedCount = await Model.User.destroy({
      where: {
        id: teacherId,
      },
    });

    if (deletedCount === 0) {
      return successResponse(res, 404, "Teacher not found");
    }

    return successResponse(res, 200, "Teacher deleted successfully", {
      deletedCount,
    });
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const inviteTeacher = async (req, res) => {
  try {
    let { teacherId } = req.query;

    if (!teacherId) {
      return successResponse(res, 400, "Missing Required Fields");
    }

    return successResponse(res, 200, "Email has been send  successfully");
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const getSchoolCourses = async (req, res) => {
  try {
    let { schoolId } = req.query;

    const course = await Model.Classroom.findAll({
      attributes: ["id"],
      include: [
        {
          model: Model.ClassroomCourses,
          as: "classroomCourses",
          attributes: ["standardId"],
          include: [
            {
              model: Model.Standard,
              as: "standard",
            },
          ],
        },
      ],
      where: {
        schoolId: schoolId,
      },
    });

    const standardsSet = new Map();

    course.forEach((classItem) => {
      classItem.classroomCourses.forEach((course) => {
        const standard = course.standard;
        if (standard && !standardsSet.has(standard.id)) {
          standardsSet.set(standard.id, standard);
        }
      });
    });

    const transformedData = {
      standards: Array.from(standardsSet.values()),
    };

    return successResponse(
      res,
      200,
      "Data fetch successfully",
      transformedData
    );
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const getResourceDetail = async (req, res) => {
  try {
    let { standardId, resourceType, search } = req.query;

    // Dynamically construct the include array based on resourceType
    let resourceInclude = [];
    const resourceFilter = {};

     // Ensure 'search' is an array if provided
     if (search) {
      if (typeof search === 'string') {
        search = [search];
      }
      // Wrap each search term with wildcards for partial matching
      const searchTerms = search.map(term => `%${term}%`);
      resourceFilter.name = { [Op.iLike]: { [Op.any]: searchTerms } };
    }

    if (resourceType === "video") {
      resourceInclude.push({
        model: Model.Video,
        as: "video",
        required: true,
      });
    } else if (resourceType === "assessment") {
      resourceInclude.push({
        model: Model.AssessmentResourcesDetail,
        as: "AssessmentResourcesDetail",
        required: true,
      });
    } else {
      resourceInclude.push(
        {
          model: Model.Video,
          as: "video",
          required: true,
        },
        {
          model: Model.AssessmentResourcesDetail,
          as: "AssessmentResourcesDetail",
          required: true,
        }
      );
    }

    const courseDetail = await Model.Standard.findAll({
      attributes: ["id"],
      include: [
        {
          model: Model.DailyUpload,
          as: "dailyUploads",
          attributes: ["id"],
          include: [
            {
              model: Model.Resource,
              as: "resource",
              required: true,
              attributes: ["id", "name", "url", "type", "topic", "status"],
              where: resourceFilter,
              include: resourceInclude,
            },
          ],
          required: true,
        },
      ],
      where: {
        id: standardId,
      },
    });

    return successResponse(res, 200, "Data fetched successfully", courseDetail);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};




module.exports = {
  createSchool,
  schoolDashboard,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketById,
  listTickets,
  listTeacher,
  getTeacher,
  deleteTeacher,
  inviteTeacher,
  getSchoolCourses,
  getResourceDetail,

};
