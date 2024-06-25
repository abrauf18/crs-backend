'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('School', 'created');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'school_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true, // Adjust this based on your requirements
    });
  }
};
