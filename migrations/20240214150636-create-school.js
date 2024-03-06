'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Schools', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      teacherCount: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      studentCount: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      courses: {
        allowNull: false,
        type: Sequelize.ARRAY((Sequelize.STRING))
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.UUID
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Schools');
  }
};