'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VideoTrackings', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      videoId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Videos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      studentId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
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
      saved: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      last_seen_time: {
        allowNull: false,
        defaultValue: '00:00:00',
        type: Sequelize.STRING
      },
      watchedCompletely: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('VideoTrackings');
  }
};