const authService = require("../services/auth.js");
const { generateAccessToken } = require("../utils/jwt");


const handleInternalServerError = (res) => {
  res.status(500).json({
    status: "error",
    message: "Internal Server Error: Unable to complete the request, please try again later.",
  });
}

const handleSuccessResponse = (res, code = 200, data, cookieDetails) => {
  try {
    if (cookieDetails) {
      res
        .status(code)
        .cookie(cookieDetails.name, cookieDetails.accessToken, cookieDetails.options)
        .json({
          status: "success",
          data: data 
        });
    }
    else {
      res.status(code).json({
        status: "success",
        data: data 
      });
    }

  } catch (error) {
    console.log(error);
    handleInternalServerError(res);
  }
}

const handleErrorResponse = (res, code = 400, message) => {
  try {
    res.status(code).json({
      status: "error",
      message: message
    });
  } catch (error) {
    console.log(error);
    handleInternalServerError(res);
  }
}

const signup = async (req, res) => {
  try {
    const { name, password, email, role } = req.body

    const reply = await authService.createUser({ name, password, email, role });

    if (reply.code == 200) {
      const user = {
        id: reply.data.id,
        name: reply.data.name,
        email: reply.data.email,
        role: reply.data.role,
      };

      handleSuccessResponse(res, 200, user);
    }
    else if (reply.code == 403) {
      handleErrorResponse(res, 403, "Email already in use, please try another");
    }
    else {
      handleInternalServerError(res);
    }
  }
  catch (error) {
    handleInternalServerError(res);
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
      };
      
      const cookieDetails = {
        name: "authcookie",
        accessToken: accessToken,
        options: { maxAge: 900000, httpOnly: true }
      };

      handleSuccessResponse(res, 200, user, cookieDetails)
    }
    else if (reply.code == 404) {
      handleErrorResponse(res, 404, "Invalid email");
    }
    else if (reply.code == 409) {
      handleErrorResponse(res, 409, "Incorrect password");
    }
    else {
      handleInternalServerError(res);
    }
  }
  catch (error) {
    handleInternalServerError(res);
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

      handleSuccessResponse(res, 200, school);
    }
    else if (reply.code == 403) {
      handleErrorResponse(res, 403, "School name already in use, please try another");
    }
    else if (reply.code == 404) {
      handleErrorResponse(res, 404, "Invalid email");
    }
    else {
      handleInternalServerError(res);
    }
  }
  catch (error) {
    handleInternalServerError(res);
  }
};

const sendInviteToTeacher = async (req, res) => {
  try {
    const { schoolOwnerEmail, invites } = req.body;

    const reply = await authService.sendInviteToTeacher({ schoolOwnerEmail, invites });

    if (reply.code == 200) {
      const invites = reply.data;

      handleSuccessResponse(res, 200, invites);
    }
    else if (reply.code == 403) {
      handleErrorResponse(res, 403, "Invalid School");
    }
    else if (reply.code == 404) {
      handleErrorResponse(res, 404, "Invalid email");
    }
    else if (reply.code == 409) {
      handleErrorResponse(res, 409, "Invites exceed the number of teachers");
    }
    else {
      handleInternalServerError(res);
    }
  } catch (error) {
    handleInternalServerError(res);
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
      
      handleSuccessResponse(res, 200, user);
    }
    else if (reply.code == 404) {
      handleErrorResponse(res, 404, "Invalid email");
    }
    else {
      handleInternalServerError(res);
    }
  } catch (error) {
    handleInternalServerError(res);
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
      
      handleSuccessResponse(res, 200, user);
    }
    else if (reply.code == 400) {
      handleErrorResponse(res, 400, "Incorrect User or OTP you entered is incorrect");
    }
    else {
      handleInternalServerError(res);
    }
  } catch (error) {
    handleInternalServerError(res);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const reply = await authService.resetPassword({ userId, newPassword });

    if (reply.code == 200) {
      const result = { message: "Password reset successfully" }
      handleSuccessResponse(res, 200, result);
    }
    else if (reply.code == 404) {
      handleErrorResponse(res, 404, "User does not exists." );
    }
    else {
      handleInternalServerError(res);
    }
  } catch (error) {
    handleInternalServerError(res);
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
    handleInternalServerError(res);
  }
};

module.exports = {
  signup,
  login,
  createSchoolProfile,
  sendInviteToTeacher,
  sendOTP,
  verifyOTP,
  resetPassword,
  logout,
};
