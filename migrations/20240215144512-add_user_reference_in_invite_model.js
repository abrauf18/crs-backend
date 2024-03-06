'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Invites', 'createdBy', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "Users", 
        key: "id", 
        onDelete: "CASCADE",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Invites', 'createdBy', {
      type: Sequelize.UUID,
    });
  }
};
