const dashboardService = require("../services/dashboard-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const getTeacherDashboardClassroomsOverview = async (req, res) => {
    try {
        const { teacherid } = req.headers;
        const reply = await dashboardService.getTeacherDashboardClassroomsOverview({ teacherId: teacherid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getTeacherDashboardStandardsOverview = async (req, res) => {
    try {
        const { teacherid } = req.headers;
        const reply = await dashboardService.getTeacherDashboardStandardsOverview({ teacherId: teacherid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const deleteClassCourse = async (req, res) => {
    try {
        const { classroomcourseid } = req.headers;
        const reply = await dashboardService.deleteClassCourse({ classroomCourseId: classroomcourseid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        if (reply.code == 404) {
            return handleErrorResponse(res, 404, 'Relation between standard and class Not found');
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

module.exports = {
    getTeacherDashboardClassroomsOverview,
    getTeacherDashboardStandardsOverview,
    deleteClassCourse
};
