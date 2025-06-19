'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DailyProgresses', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      classroomStudentId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'ClassroomStudents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      obtainedWeightage: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.DECIMAL
      },
      totalWeightage: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER
      },
      date: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATEONLY
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
    await queryInterface.dropTable('DailyProgresses');
  }
};