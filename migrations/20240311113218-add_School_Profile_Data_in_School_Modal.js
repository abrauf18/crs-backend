'use strict';
const {logger} = require("../Logs/logger.js");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {

      await queryInterface.addColumn(
        'Schools',
        'numOfClasses',
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false 
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'Schools', 
        'classesStart', {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false 
      }, 
      { transaction });

      await queryInterface.addColumn(
        'Schools', 
        'classesEnd', {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false 
      }, 
      { transaction });

      await transaction.commit();

    } catch (err) {
      logger.error(err.message);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      await queryInterface.removeColumn('Schools', 'numOfClasses', { transaction });
      await queryInterface.removeColumn('Schools', 'classesStart', { transaction });
      await queryInterface.removeColumn('Schools', 'classesEnd', { transaction });

      await transaction.commit();
    
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
