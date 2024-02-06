const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const sendEmail = require("../utils/email.js");
const { generateAccessToken, generateForgotPasswordToken } = require("../utils/jwt");
const { User, School, Invite, ForgotPasswordRequest } = require("../models");

const signup = async (req, res) => {
  try {
    const { name, password, email, role } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      name,
      email,
      role,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken({
      email: user.email,
      userID: user.id,
    });

    res
      .status(200)
      .cookie("authcookie", accessToken, { maxAge: 900000, httpOnly: true })
      .json({
        status: "success",
        result: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const user = req.user;

    const accessToken = generateAccessToken({
      email: user.email,
      userID: user.id,
    });

    res
      .status(200)
      .cookie("authcookie", accessToken, { maxAge: 900000, httpOnly: true })
      .json({
        status: "success",
        result: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const createSchoolProfile = async (req, res) => {
  try {
    const { name, numberOfTeachers, studentsPopulation, courses } = req.body;

    const userId = req.user.id;

    const school = await School.create({
      name,
      numberOfTeachers,
      studentsPopulation,
      courses,
      createdBy: userId,
    });

    res.status(200).json({ status: "success", result: { school } });
  } catch (error) {
    console.error("Error creating school profile:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const sendInviteToTeacher = async (req, res) => {
  try {
    const { invites } = req.body;

    invites.map(async (invite) => {
      const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to ${req.school.name}</h2>
        <p>Dear ${invite.name},</p>
        <p>You have received an invitation to join ${req.school.name} as a teacher.</p>
        <p>We are excited to welcome you to our educational platform!</p>
        <p>Please follow the instructions below to complete your registration:</p>
        
        <ol>
            <li>Click on the following link to set up your account: [Registration Link]</li>
            <li>Create the password and use those credentials to login to your account.</li>
            <li>Explore the features and resources available on ${req.school.name}.</li>
        </ol>

        <p>If you have any questions or need assistance, feel free to contact us.</p>

        <p>Best regards,<br>${req.school.name} Team</p>
    </div>`;
      await sendEmail({
        from: req.school.name,
        email: invite.email,
        subject: "Invitation from School",
        message: "",
        html,
      });
    });

    const createdInvites = await Invite.bulkCreate(
      invites.map((invite) => ({ name: invite.name, email: invite.email, createdBy: req.user.id }))
    );

    res
      .status(201)
      .json({ status: "success", result: { invites: createdInvites } });
  } catch (error) {
    console.error("Error sending invites:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const sendOTP = async (req, res) => {
  try {
    let OTP;
    let isOTPUsed;

    const existingRequest = await ForgotPasswordRequest.findOne({
      where: { userId: req.user.id },
    });

    if (existingRequest) {
      await existingRequest.destroy();
    }

    do {
      OTP = otpGenerator.generate(4, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      isOTPUsed = await ForgotPasswordRequest.findOne({
        where: { otp: OTP },
      });

      if (isOTPUsed) {
        console.log("OTP already registered, generating a new one.");
      }
    } while (isOTPUsed);

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Reset Password Request</h2>
      <p>Dear ${req.user.name},</p>
      <p>We received a request to reset your password for your account at CRS.</p>
      <p>Your One-Time Password (OTP) for password reset is: <b>${OTP}</b></p>
      <p>Please use this OTP to verify your identity and reset your password.</p>

      <p>If you didn't request a password reset, please ignore this email.</p>

      <p>Best regards,<br>CRS</p>
    </div>`;

    await sendEmail({
      from: `${req.user.name}>`,
      email: req.user.email,
      subject: "Reset Password Request",
      message: "",
      html,
    });

    await ForgotPasswordRequest.create({
      userId: req.user.id,
      otp: OTP,
    });

    const accessToken = generateForgotPasswordToken({
      email: req.user.email,
      userID: req.user.id,
    });

    res
      .status(200)
      .cookie("validationCookie", accessToken, { maxAge: 900000, httpOnly: true })
      .json({
        status: "success",
        result: {
          message: "OTP sent successfully to your email",
          user: {
            id: req.user.id,
            email: req.user.email,
          },
        },
      });
  } catch (error) {
    console.error("Error while fulfilling request:", error);
    res.status(500).json({
      status: "error",
      message: "Error while making request. Please try again.",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { OTP } = req.body;

    const forgotRequest = await ForgotPasswordRequest.findOne({
      where: { 
        userId: req.userID,
        otp: OTP.toString()
      },
    });

    if (!forgotRequest) {
      return res
        .status(400)
        .json({ status: "error", message: "The OTP you entered is incorrect" });
    }

    // Remove record, after successful verification
    if (forgotRequest) {
      await forgotRequest.destroy();
    }

    res.status(200).json({
      status: "success",
      result: {
        message: "OTP Verified Successfully",
        user: {
          id: forgotRequest.userId,
        },
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    console.log("new password: ",  newPassword);

    const user = await User.findByPk(req.userID);

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "User doesn't exists." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      status: "success",
      result: { message: "Password reset successfully" },
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      status: "error",
      message: "Error resetting password. Please try again.",
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
};
