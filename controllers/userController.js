const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllUsers,
};
