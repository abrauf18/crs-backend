const userService = require("../services/user-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")
const {logger} = require("../Logs/logger.js");

const getUserProfile = async (req, res) => {
  try {
    const reply = await userService.getUserProfile({ user: req.user });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    logger.error(error.message);
    return handleInternalServerError(res);
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const { image, name, email, password } = req.body

    const reply = await userService.updateUserProfile({ user: req.user, image, name, email, password });

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
    logger.error(error.message);
    return handleInternalServerError(res);
  }
};

const getAllUsersProfile = async (req, res) => {
  try {

    const reply = await userService.getAllUsersProfile({user: req.user});

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    logger.error(error.message);
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
    logger.error(error.message);
    return handleInternalServerError(res);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsersProfile,
  updateAnotherUsersProfile,
};
