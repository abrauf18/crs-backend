'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure that existing data does not violate the new constraint
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Temporarily allow null values to avoid constraint violations during update
      await queryInterface.changeColumn('Classrooms', 'teacherId', {
        allowNull: true,
        type: Sequelize.UUID,
      }, { transaction });

      // Ensure all rows have a valid teacherId or are set to null
      await queryInterface.sequelize.query(
        `UPDATE "Classrooms" SET "teacherId" = NULL WHERE "teacherId" IS NULL;`,
        { transaction }
      );

      // Update the column with references and constraints
      await queryInterface.changeColumn('Classrooms', 'teacherId', {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Classrooms', 'teacherId', {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }
};
