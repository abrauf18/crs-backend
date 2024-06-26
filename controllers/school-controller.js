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
        role: "school",
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
      limit: 4,
    });

    const getSchoolTickets = await Model.Ticket.findAll({
      attributes: [
        "id",
        // [Sequelize.literal('"User"."name"'), "name"],
        "complaint_type",
        "message",
        "status",
        "submitted_by",
        [Sequelize.col("Ticket.createdAt"), "Date"],
      ],
      include: [
        {
          model: Model.User,

          where: {
            school_id: schoolId,
            role: "admin",
          },
        },
      ],
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

const createTicket = async (req, res) => {
  try {
    const { schoolId, complaintType, message } = req.body;

    if(!schoolId || !complaintType || !message){
      return successResponse(res, 400, "Missing required Fields");
    }

    const ticket = await Model.Ticket.create({
      complaint_type: complaintType,
      message,
      submitted_by: schoolId,
      status: "active",
    });

    return successResponse(res, 200, "Ticket created successfully", ticket);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const updateTicket = async (req, res) => {
  try {
    
    const { complaintType, message, status ,ticketId} = req.body;

    if(!ticketId){
      return successResponse(res, 400, "Missing required Fields");
    }


    const ticket = await Model.Ticket.findByPk(ticketId);

    if (!ticket) {
      return failureResponse(res, 404, "Ticket not found");
    }

    ticket.complaint_type = complaintType || ticket.complaint_type;
    ticket.message = message || ticket.message;
    ticket.status = status || ticket.status;

    await ticket.save();

    return successResponse(res, 200, "Ticket updated successfully", ticket);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.query;

    if(!ticketId){
      return successResponse(res, 400, "Missing required Fields");
    }
    const ticket = await Model.Ticket.findByPk(ticketId);

    if (!ticket) {
      return failureResponse(res, 404, "Ticket not found");
    }

    await ticket.destroy();

    return successResponse(res, 200, "Ticket deleted successfully");
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};

const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.query;

    const ticket = await Model.Ticket.findOne({
      where: {
        id: ticketId,
      },
      include: [
        {
          model: Model.User,
          attributes: ['name'],
        },
      ],
    });

    if (!ticket) {
      return failureResponse(res, 404, "Ticket not found");
    }

    return successResponse(res, 200, "Ticket retrieved successfully", ticket);
  } catch (error) {
    return failureResponse(res, 500, error.message);
  }
};



module.exports = {
  createSchool,
  schoolDashboard,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketById
};
