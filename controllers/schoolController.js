const schoolService = require("../services/school.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/responseHandlers.js")


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
    console.log(error);
    return handleInternalServerError(res);
  }
};

const updateSchoolAndUserProfile = async (req, res) => {
  try {
    const { image, username, email, password, schoolName, numOfClasses, classesStart, classesEnd } = req.body
    console.log(image, username, email, password, schoolName, numOfClasses, classesStart, classesEnd)

    const reply = await schoolService.updateSchoolAndUserProfile({ user: req.user, image, username, email, password, schoolName, numOfClasses, classesStart, classesEnd });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 409, "School with this email already exists, pleasy try another one");
    }
    else if (reply.code == 409) {
      return handleErrorResponse(res, 409, "User with this email already exists, pleasy try another one");
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    console.log(error);
    return handleInternalServerError(res);
  }
};

module.exports = {
  getSchoolProfile,
  updateSchoolAndUserProfile,
};
