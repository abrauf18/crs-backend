'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VideoQuestionAnswers', {
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
      questionId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      answer: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: ''
      },
      obtainedMarks: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: -1
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
    await queryInterface.dropTable('VideoQuestionAnswers');
  }
};