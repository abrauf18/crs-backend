'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add a new column for the array of strings
    await queryInterface.addColumn('DailyUploads', 'newTopicName', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    });

    // Step 2: Convert existing topicName strings to arrays and transfer to new column
    await queryInterface.sequelize.query(`
      UPDATE "DailyUploads"
      SET "newTopicName" = ARRAY[ "topicName" ]::text[]
      WHERE "topicName" IS NOT NULL;
    `);

    // Step 3: Remove the old column
    await queryInterface.removeColumn('DailyUploads', 'topicName');

    // Step 4: Rename the new column to the original column name
    await queryInterface.renameColumn('DailyUploads', 'newTopicName', 'topicName');
  },

  down: async (queryInterface, Sequelize) => {
    // Step 1: Add a new column for the string
    await queryInterface.addColumn('DailyUploads', 'newTopicName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });

    // Step 2: Convert existing topicName arrays back to strings and transfer to new column
    await queryInterface.sequelize.query(`
      UPDATE "DailyUploads"
      SET "newTopicName" = "topicName"[1]
      WHERE "topicName" IS NOT NULL;
    `);

    // Step 3: Remove the old column
    await queryInterface.removeColumn('DailyUploads', 'topicName');

    // Step 4: Rename the new column to the original column name
    await queryInterface.renameColumn('DailyUploads', 'newTopicName', 'topicName');
  }
};