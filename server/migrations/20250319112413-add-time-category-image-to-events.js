module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adding the `time`, `category`, and `image` columns to the Events table
    await queryInterface.addColumn('Events', 'time', {
      type: Sequelize.TIME,
      allowNull: false,  // Make the time field required
    });

    await queryInterface.addColumn('Events', 'category', {
      type: Sequelize.STRING,
      allowNull: false,  // Make the category field required
    });

    await queryInterface.addColumn('Events', 'image', {
      type: Sequelize.STRING,
      allowNull: true,  // Make the image field optional
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Removing the `time`, `category`, and `image` columns if the migration is rolled back
    await queryInterface.removeColumn('Events', 'time');
    await queryInterface.removeColumn('Events', 'category');
    await queryInterface.removeColumn('Events', 'image');
  }
};
