const School = require("../models/School");

const findSchoolById = async (schoolId) => {
  try {
    const school = await School.findByPk(schoolId);

    if (!school) {
      return null;
    }

    return school;
  } catch (error) {
    console.error("Error finding school by ID:", error);
    throw error;
  }
};

module.exports = { findSchoolById };
