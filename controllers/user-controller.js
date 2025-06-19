const userService = require("../services/user-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")
const { logger } = require("../Logs/logger.js");

const getUserProfile = async (req, res) => {
  try {
    const reply = await userService.getUserProfile({ user: req.user });

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
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    return handleInternalServerError(res);
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const { image, name, email, password, schoolName } = req.body

    const reply = await userService.updateUserProfile({ user: req.user, image, name, email, password, schoolName });

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
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    return handleInternalServerError(res);
  }
};

const getAllUsersProfile = async (req, res) => {
  try {
    const { page, limit, orderBy, sortBy, keyword, role } = req.query;

    const reply = await userService.getAllUsersProfile({ user: req.user, page, limit, orderBy, sortBy, keyword, role });

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

const updateAnotherUsersProfile = async (req, res) => {
  try {
    const { userId, image, name, email, role } = req.body

    const reply = await userService.updateAnotherUsersProfile({ userId, image, name, email, role });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    if (reply.code == 409) {
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

const deleteAnotherUsersProfile = async (req, res) => {
  try {
    const { userid } = req.headers;

    const reply = await userService.deleteAnotherUsersProfile({ userId: userid });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else if (reply.code == 404) {
      return handleErrorResponse(res, 404, "User not found");
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

const getAllTeachers = async (req, res) => {
  try {
    const reply = await userService.getAllTeachers({
      user: req.user
    });
    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else {
      return handleInternalServerError(res);
    }
  } catch (error) {
    logger.error(error?.message || 'An error occurred, but no error message was provided');
    return handleInternalServerError(res);
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsersProfile,
  updateAnotherUsersProfile,
  deleteAnotherUsersProfile,
  getAllTeachers,
};
