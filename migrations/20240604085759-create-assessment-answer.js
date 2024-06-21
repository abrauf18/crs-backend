'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AssessmentAnswers', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      userId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assessmentResourcesDetailId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'AssessmentResourcesDetails',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      standardId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Standards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      questionNumber: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER
      },
      obtainedMarks: {
        allowNull: false,
        defaultValue: -1,
        type: Sequelize.INTEGER
      },
      answerURL: {
        allowNull: false,
        defaultValue: "",
        type: Sequelize.STRING
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
    await queryInterface.dropTable('AssessmentAnswers');
  }
};