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


const updateSchoolProfile = async (req, res) => {
  try {
    const { name, numOfClasses, classesStart, classesEnd } = req.body

    const reply = await schoolService.updateSchoolProfile({ user: req.user, name, numOfClasses, classesStart, classesEnd });

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
    console.log(error);
    return handleInternalServerError(res);
  }
};

module.exports = {
  getSchoolProfile,
  updateSchoolProfile,
};
