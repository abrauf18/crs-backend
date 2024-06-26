const Model = require("../models");
const { logger } = require("../Logs/logger.js");
const { successResponse, failureResponse } = require("../utils/response.js");
const { Op, Sequelize } = require("sequelize");
const school = require("../models/school");

const createSchool = async (req, res) => {
  const transaction = await Model.sequelize.transaction();
  try {
    const { name, email, password, schoolName } = req.body;

    const existingUser = await Model.User.findOne({
      where: {
        email: email,
      },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      return successResponse(res, 200, "User already exists");
    }

    const school = await Model.School.create(
      {
        name: schoolName,
      },
      { transaction }
    );

    const user = await Model.User.create(
      {
        name: name,
        email: email,
        password: password,
        school_id: school.id,
        role: "admin",
      },
      { transaction }
    );

    await transaction.commit();

    return successResponse(res, 200, "User and School created successfully");
  } catch (error) {
    await transaction.rollback();
    return failureResponse(res, 500, error.message);
  }
};

const schoolDashboard = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return successResponse(res, 400, "Missing Required Fields");
    }

    const totalStudentCount = await Model.User.count({
      where: {
        school_id: schoolId,
      },
    });

    const totalClassroomCount = await Model.Classroom.count({
      include: [
        {
          model: Model.User,
          where: {
            school_id: schoolId,
          },
        },
      ],
    });

    const getSchoolTeacher = await Model.User.findAll({
      where: {
        school_id: schoolId,
        role: "teacher",
      },
    });

    const getSchoolTickets = await Model.Ticket.findAll({
      attributes: [
        "id",
        // [Sequelize.literal('"User"."name"'), "name"],
        "complaint_type",
        "message",
        "status",
        "submitted_by",
        [Sequelize.col('createdAt'), 'Date'],
      ],
      // include: [
      //   {
      //     model: Model.User,
          
      //     where: {
      //       school_id: schoolId,
      //       role: "admin",
      //     },
      //   },
      // ],
      where: {
        submitted_by: schoolId,
        
      },
    });

    const response = {
      totalStudent: totalStudentCount,
      totalClassroom: totalClassroomCount,
      getSchoolTeacher: getSchoolTeacher,
      getSchoolTickets: getSchoolTickets,
    };

    return successResponse(
      res,
      200,
      "User and School created successfully",
      response
    );
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

module.exports = {
  createSchool,
  schoolDashboard,
};
