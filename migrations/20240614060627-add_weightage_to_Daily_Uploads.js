'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DailyUploads', 'weightage', {
      allowNull: false,
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DailyUploads', 'weightage');
  }
};
