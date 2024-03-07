'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('Users', 'image', { 
      type: Sequelize.STRING,
      defaultValue: 'https://crs-data-storage-bucket.s3.ap-southeast-2.amazonaws.com/ProfilePictures/defaultImage.JPG',
      allowNull: false 
    });
  },

  async down (queryInterface, Sequelize) {
    queryInterface.removeColumn('Users', 'image');
  }
};
