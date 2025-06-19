'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DailyUploads', 'topicName', {
      allowNull: false,
      defaultValue: '',
      type: Sequelize.STRING
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DailyUploads', 'topicName');
  }
};