// In your seeders file (e.g., seeders/20240630123456-create-admin-user.js)

'use strict';
const ROLES = require('../models/roles');
// @ts-ignore
const { User } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    return User.create({
      name: 'CRS Admin',
      email: 'admin@crsci.org',
      password: '1@Password',
      role: ROLES.ADMIN,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the admin user if needed
    return User.destroy({
      where: {
        email: 'admin@crs.com',
      },
    });
  }
};
