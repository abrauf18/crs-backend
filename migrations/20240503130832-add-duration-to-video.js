'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Videos', 'duration', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '00:00:00',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Videos', 'duration');
  }
};
