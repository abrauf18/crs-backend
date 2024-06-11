const studentService = require("../services/student-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const getStudentCurrentStandards = async (req, res) => {
    try {
        const { studentid } = req.headers;
        const reply = await studentService.getStudentCurrentStandards({ studentId: studentid });

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
};

const getStudentVideo = async (req, res) => {
    try {
        const { videoid, studentid } = req.headers;
        const reply = await studentService.getStudentVideo({ videoId: videoid, studentId: studentid});

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

const storeStudentVideo = async (req, res) => {
    try {
        const { videoId, last_seen_time, studentId } = req.body;
        const reply = await studentService.storeStudentVideo({ videoId, studentId, last_seen_time });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, 'Invalid last_seen_time');
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

const getStudentStandard = async (req, res) => {
    try {
        const { standardid, studentid } = req.headers;
        const reply = await studentService.getStudentStandard({ standardId: standardid, studentId: studentid});

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

const UpdateStudentVideoCompleted = async (req, res) => {
    try {
        const { videoId, studentId, watchedCompletely, last_seen_time } = req.body;
        const reply = await studentService.UpdateStudentVideoCompleted({ videoId, studentId, watchedCompletely, last_seen_time });

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

const UpdateStudentVideoLastSeenTime = async (req, res) => {
    try {
        const { videoId, studentId, last_seen_time } = req.body;
        const reply = await studentService.UpdateStudentVideoLastSeenTime({ videoId, studentId, last_seen_time });

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

const SaveOrRemoveVideo = async (req, res) => {
    try {
        const { videoId, studentId, save } = req.body;
        const reply = await studentService.SaveOrRemoveVideo({ videoId, studentId, save });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const getSavedVideos = async (req, res) => {
    try {
        const { studentid } = req.headers;
        const reply = await studentService.getSavedVideos({ studentId: studentid });

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

const getStandardsResourcesAndCount = async (req, res) => {
    try {
        const { studentid, page=1, limit=10, orderby='id', sortby='asc' } = req.headers;
        const reply = await studentService.getStandardsResourcesAndCount({ studentId: studentid, page, limit, orderBy: orderby, sortBy: sortby });

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
const getStudentProfileVideoResults = async (req, res) => {
    try {
        const { studentid, standardid } = req.headers;
        const reply = await studentService.getStudentProfileVideoResults({ studentId: studentid, standardId: standardid});

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
    getStudentCurrentStandards,
    getStudentVideo,
    storeStudentVideo,
    getStudentStandard,
    UpdateStudentVideoCompleted,
    UpdateStudentVideoLastSeenTime,
    SaveOrRemoveVideo,
    getSavedVideos,
    getStandardsResourcesAndCount,
    getStudentProfileVideoResults
};
