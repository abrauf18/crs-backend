const authService = require("../services/auth.js");
const { generateAccessToken } = require("../utils/jwt");


const handleInternalServerError = (res) => {
  res.status(500).json({
    status: "error",
    message: "Internal Server Error: sorry for the inconvenience, please try again later.",
  });
}

const signup = async (req, res) => {
  try {
    const { name, password, email, role } = req.body

    const reply = await authService.createUser({ name, password, email, role });

    if (reply.code == 200) {
      res.status(200).json({
        status: "success",
        result: {
          user: {
            id: reply.data.id,
            name: reply.data.name,
            email: reply.data.email,
            role: reply.data.role,
          },
        },
      });
    }
    else if (reply.code == 403) {
      res.status(403).json({
        status: "error",
        message: "Email already in use, please try another"
      });
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

      res
        .status(200)
        .cookie("authcookie", accessToken, { maxAge: 900000, httpOnly: true })
        .json({
          status: "success",
          result: {
            accessToken,
            user: {
              id: reply.data.id,
              name: reply.data.name,
              email: reply.data.email,
              role: reply.data.role,
            },
          },
        });
    }
    else if (reply.code == 404) {
      return res
        .status(404)
        .json({ status: "error", message: "Invalid email" });
    }
    else if (reply.code == 409) {
      return res
        .status(409)
        .json({ status: "error", message: "Incorrect password" });
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
      res.status(200).json({
        status: "success",
        result: {
          school: {
            name: reply.data.name,
            numberOfTeachers: reply.data.numberOfTeachers,
            studentsPopulation: reply.data.studentsPopulation,
            courses: reply.data.courses,
            createdBy: reply.data.createdBy,
          },
        },
      });
    }
    else if (reply.code == 403) {
      res.status(403).json({
        status: "error",
        message: "School already in use, please try another"
      });
    }
    else if (reply.code == 404) {
      res.status(404).json({
        status: "error",
        message: "Invalid email"
      });
    }
    else {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  }
  catch (error) {
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const sendInviteToTeacher = async (req, res) => {
  try {
    const { schoolOwnerEmail, invites } = req.body;

    const reply = await authService.sendInviteToTeacher({ schoolOwnerEmail, invites });

    if (reply.code == 200) {
      res.status(200).json({
        status: "success",
        result: {
          invites: reply.data
        },
      });
    }
    else if (reply.code == 403) {
      res.status(403).json({
        status: "error",
        message: "Invalid School"
      });
    }
    else if (reply.code == 404) {
      res.status(404).json({
        status: "error",
        message: "Invalid email"
      });
    }
    else {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const reply = await authService.sendOTP({ email });

    if (reply.code == 200) {
      res.status(200).json({
        status: "success",
        result: {
          message: "OTP sent successfully to your email",
          user: {
            id: reply.data.id,
            email: reply.data.email,
          },
        },
      });
    }
    else {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error while making request. Please try again.",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { userId, OTP } = req.body;

    const reply = await authService.verifyOTP({ userId, OTP });

    if (reply.code == 200) {
      res.status(200).json({
        status: "success",
        result: {
          message: "OTP Verified Successfully",
          user: {
            id: reply.data.userId,
          },
        },
      });
    }
    else if (reply.code == 400) {
      res.status(400).json({
        status: "error",
        message: "Incorrect User or OTP you entered is incorrect",
      });
    }
    else {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error while making request. Please try again.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const reply = await authService.resetPassword({ userId, newPassword });

    if (reply.code == 200) {
      res.status(200).json({
        status: "success",
        result: { message: "Password reset successfully" },
      });
    }
    else if (reply.code == 404) {
      return res.status(404).json({ 
        status: "error", 
        message: "User doesn't exists." 
      });
    }
    else {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error resetting password. Please try again.",
    });
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
    res.status(500).json({
      status: "error",
      message: "Error logging out, please try again later.",
    });
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
