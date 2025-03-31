'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get current table structure
    let tableExists = true;
    let tableDescription;
    
    try {
      tableDescription = await queryInterface.describeTable('Events');
    } catch (error) {
      tableExists = false;
      console.log('Events table does not exist yet');
    }
    
    if (tableExists) {
      // Add columns only if they don't exist
      
      if (!tableDescription.price) {
        await queryInterface.addColumn('Events', 'price', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00
        });
      }
      
      if (!tableDescription.isPaid) {
        await queryInterface.addColumn('Events', 'isPaid', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
      
      // Continue with other columns...
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Down migration code...
  }
};