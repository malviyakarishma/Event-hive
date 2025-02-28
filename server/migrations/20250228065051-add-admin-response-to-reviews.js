'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Reviews", "admin_response", {
      type: Sequelize.TEXT,
      allowNull: true, // Allows admins to respond, but it's not mandatory
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Reviews", "admin_response");
  }
};
