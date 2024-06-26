const schoolService = require("../services/school-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")
const {logger} = require("../Logs/logger.js");

const getSchoolProfile = async (req, res) => {
  try {
    const reply = await schoolService.getSchoolProfile({ user: req.user });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    return handleInternalServerError(res);
  }
};

const updateSchoolAndUserProfile = async (req, res) => {
  try {
    const { image, username, email, password, schoolName, numOfClasses, classesStart, classesEnd } = req.body

    const reply = await schoolService.updateSchoolAndUserProfile({ user: req.user, image, username, email, password, schoolName, numOfClasses, classesStart, classesEnd });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "School with this email already exists, pleasy try another one");
    }
    else if (reply.code == 409) {
      return handleErrorResponse(res, 409, "User with this email already exists, pleasy try another one");
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    return handleInternalServerError(res);
  }
};

const getAllSchools = async (req, res) => {
  try {
    const reply = await schoolService.getAllSchools();

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    return handleInternalServerError(res);
  }
};

module.exports = {
  getSchoolProfile,
  updateSchoolAndUserProfile,
  getAllSchools,
};
