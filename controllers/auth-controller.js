const { logger } = require("../Logs/logger.js");
const authService = require("../services/auth-service.js");
const { generateAccessToken } = require("../utils/jwt.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")


const emailBasedInvite = async (req, res) => {
  try {
    const { name, email, role, schoolId } = req.body

    const reply = await authService.inviteUser({ name, email, role, schoolId, user: req.user });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "You are unauthorized to invite this entity");
    }
    else if (reply.code == 409) {
      return handleErrorResponse(res, 409, "This user currently has a valid invitation, try again later");
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    return handleInternalServerError(res);
  }
};

const emailBasedSignup = async (req, res) => {
  try {
    const token = req.params.token;

    const { name, email, password } = req.body

    const reply = await authService.createInvitedUser({ name, email, password, token });

    if (reply.code == 200) {
      return handleSuccessResponse(res, 200, reply.data);
    }
    else if (reply.code == 400) {
      return handleErrorResponse(res, 400, "Access denied, your token is invalid");
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "Token expired, please request another invite");
    }
    else if (reply.code == 409) {
      return handleErrorResponse(res, 409, "Email already in use, please try another");
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    return handleInternalServerError(res);
  }
};

const signup = async (req, res) => {
  try {
    const { name, password, email, role, schoolId } = req.body

    const reply = await authService.createUser({ name, password, email, role, schoolId });

    if (reply.code == 200) {
      const user = {
        id: reply.data.id,
        name: reply.data.name,
        email: reply.data.email,
        role: reply.data.role,
        schoolId: reply.data.role
      };

      return handleSuccessResponse(res, 200, user);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "Email already in use, please try another");
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    return handleInternalServerError(res);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const reply = await authService.authenticateUser({ email, password });

    if (reply.code == 200) {
      const accessToken = generateAccessToken({
        email: reply.data.email,
        userId: reply.data.id,
      });

      const user = {
        id: reply.data.id,
        name: reply.data.name,
        email: reply.data.email,
        role: reply.data.role,
        schoolId: reply.data.school_id || '',
        accessToken: accessToken,
      };

      const cookieDetails = {
        name: "authcookie",
        accessToken: accessToken,
        options: { maxAge: (1000 * 60 * 60), httpOnly: true }
      };

      return handleSuccessResponse(res, 200, user, cookieDetails)
    }
    else if (reply.code == 404) {
      return handleErrorResponse(res, 404, "Invalid email");
    }
    else if (reply.code == 409) {
      logger.error("Incorrect password");
      return handleErrorResponse(res, 409, "Incorrect password");
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

const createSchoolProfile = async (req, res) => {
  try {
    const { schoolOwnerEmail, name, numberOfTeachers, studentsPopulation, courses } = req.body

    const reply = await authService.createSchoolProfile({ schoolOwnerEmail, name, numberOfTeachers, studentsPopulation, courses });

    if (reply.code == 200) {
      const school = {
        name: reply.data.name,
        numberOfTeachers: reply.data.numberOfTeachers,
        studentsPopulation: reply.data.studentsPopulation,
        courses: reply.data.courses,
        createdBy: reply.data.createdBy,
      };

      return handleSuccessResponse(res, 200, school);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "School name already in use, please try another");
    }
    else if (reply.code == 404) {
      return handleErrorResponse(res, 404, "Invalid email");
    }
    else {
      return handleInternalServerError(res);
    }
  }
  catch (error) {
    return handleInternalServerError(res);
  }
};

const sendInviteToTeacher = async (req, res) => {
  try {
    const { schoolOwnerEmail, invites } = req.body;

    const reply = await authService.sendInviteToTeacher({ schoolOwnerEmail, invites });

    if (reply.code == 200) {
      const invites = reply.data;

      return handleSuccessResponse(res, 200, invites);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "Invalid School");
    }
    else if (reply.code == 404) {
      return handleErrorResponse(res, 404, "Invalid email");
    }
    else if (reply.code == 409) {
      return handleErrorResponse(res, 409, "Invites exceed the number of teachers");
    }
    else {
      return handleInternalServerError(res);
    }
  } catch (error) {
    return handleInternalServerError(res);
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const reply = await authService.sendOTP({ email });

    if (reply.code == 200) {
      const user = {
        id: reply.data.id,
        email: reply.data.email,
      };

      return handleSuccessResponse(res, 200, user);
    }
    else if (reply.code == 404) {
      return handleErrorResponse(res, 404, "Invalid email");
    }
    else {
      return handleInternalServerError(res);
    }
  } catch (error) {
    return handleInternalServerError(res);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { userId, OTP } = req.body;

    const reply = await authService.verifyOTP({ userId, OTP });

    if (reply.code == 200) {
      const user = {
        id: reply.data.userId,
      };

      return handleSuccessResponse(res, 200, user);
    }
    else if (reply.code == 400) {
      return handleErrorResponse(res, 400, "OTP You Entered Is Incorrect");
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "OTP You Entered Is Expired");
    }
    else {
      return handleInternalServerError(res);
    }
  } catch (error) {
    return handleInternalServerError(res);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const reply = await authService.resetPassword({ userId, newPassword });
    if (reply.code == 200) {
      const result = { message: "Password reset successfully" }
      return handleSuccessResponse(res, 200, result);
    }
    else if (reply.code == 403) {
      return handleErrorResponse(res, 403, "User needs Verification.");
    }
    else if (reply.code == 404) {
      return handleErrorResponse(res, 404, "User does not exists.");
    }
    else {
      return handleInternalServerError(res);
    }
  } catch (error) {
    return handleInternalServerError(res);
  }
};

const logout = async (req, res) => {
  try {
    if (req.cookies.authcookie) {
      return res
        .clearCookie("authcookie")
        .status(200)
        .json({ message: "Successfully logged out" });
    }
    return res.status(200).json({
      status: "success",
      message: "User is already logged out",
    });
  } catch (error) {
    return handleInternalServerError(res);
  }
};

module.exports = {
  emailBasedInvite,
  emailBasedSignup,
  signup,
  login,
  createSchoolProfile,
  sendInviteToTeacher,
  sendOTP,
  verifyOTP,
  resetPassword,
  logout,
};
