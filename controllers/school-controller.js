const Model = require("../models");
const { logger } = require("../Logs/logger.js");
const { successResponse, failureResponse } = require("../utils/response.js");
const { where } = require("sequelize");

const createSchool = async (req, res) => {
  const transaction = await Model.sequelize.transaction();
  try {
    const { name, email, password, schoolName } = req.body;

    const existingUser = await Model.User.findOne({
      where: {
        email: email,
      },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return successResponse(
        res,
        200,
        "User already exists"
      );
    }

    const school = await Model.School.create({
      name: schoolName,
    }, { transaction });

    const user = await Model.User.create({
      name: name,
      email: email,
      password: password,
      school_id: school.id, 
      role:"admin",
    }, { transaction });

    await transaction.commit();

    return successResponse(
      res,
      200,
      "User and School created successfully"
    );
  } catch (error) {
    await transaction.rollback();
    return failureResponse(res, 500, error.message);
  }
};


module.exports = {
  createSchool,
};
