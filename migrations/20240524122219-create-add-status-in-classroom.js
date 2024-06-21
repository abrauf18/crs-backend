'use strict';
const { CLASSROOM_STATUS } = require('../utils/enumTypes');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Classrooms', 'status', {
      type: Sequelize.ENUM(CLASSROOM_STATUS.ACTIVE, CLASSROOM_STATUS.INACTIVE),
      defaultValue: CLASSROOM_STATUS.ACTIVE,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Classrooms', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Classrooms_status";');
  }
};