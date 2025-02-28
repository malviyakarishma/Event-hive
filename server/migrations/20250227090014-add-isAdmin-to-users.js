'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add the isAdmin column to the Users table
     */
    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,  // Default to false for regular users
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove the isAdmin column from the Users table
     */
    await queryInterface.removeColumn('Users', 'isAdmin');
  }
};
