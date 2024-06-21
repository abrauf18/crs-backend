const dashboardService = require("../services/dashboard-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const getTeacherDashboardSummaries = async (req, res) => {
    try {
        const { teacherid } = req.headers;
        const reply = await dashboardService.getTeacherDashboardSummaries({ teacherId: teacherid });

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

const getAdminDashboardSummaries = async (req, res) => {
    try {
        const reply = await dashboardService.getAdminDashboardSummaries();

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

const getStudentDashboardSummaries = async (req, res) => {
    try {
        const { studentid } = req.headers;
        const reply = await dashboardService.getStudentDashboardSummaries({ studentId: studentid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
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
    getTeacherDashboardSummaries,
    getAdminDashboardSummaries,
    getStudentDashboardSummaries
};
