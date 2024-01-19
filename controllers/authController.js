const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../utils/jwt");
const sendEmail = require("../utils/email.js");
const User = require("../models/User");
const School = require("../models/School");
const Invite = require("../models/Invite");
const { findSchoolById } = require("./schoolController.js");

const signup = async (req, res) => {
  const { name, password, email, role } = req.body;
  console.log(req.body);

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      name,
      email,
      role,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken({
      name,
      email,
      id: user.id,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    console.log(user);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      email: user.email,
      id: user.id,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createSchoolProfile = async (req, res) => {
  try {
    const { name, numberOfTeachers, studentsPopulation, courses } = req.body;

    // const userId = req.user.id;
    const userId = 1;

    const school = await School.create({
      name,
      numberOfTeachers,
      studentsPopulation,
      courses,
      createdBy: userId,
    });

    res.status(201).json({ school });
  } catch (error) {
    console.error("Error creating school profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendInviteToTeacher = async (req, res) => {
  console.log(req);
  try {
    const { invites } = req.body;

    // const createdBy = req.user.id;
    const createdBy = 1;
    await Invite.destroy({
      where: {
        id: 4,
      },
    });

    const school = await findSchoolById(createdBy);
    console.log(school);

    invites.map(async (invite) => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to CRS</h2>
          <p>Dear ${invite.name},</p>
          <p>You got inviattion from school <b> ${school.name}</b></p>
        <p>We are thrilled to have you join our platform!</p>

        <p>Best regards,<br>CRS</p>

        </div> `;
      await sendEmail({
        from: `${invite.name}>`,
        email: invite.email,
        subject: "Invitation from School",
        message: "",
        html,
      });
    });
    // Create invites for each teacher
    const createdInvites = await Invite.bulkCreate(
      invites.map((invite) => ({ ...invite, createdBy }))
    );

    res.status(201).json({ invites: school });
  } catch (error) {
    console.error("Error sending invites:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  login,
  createSchoolProfile,
  sendInviteToTeacher,
};
