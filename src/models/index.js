const sequelize = require('../config/database');
const User = require('./User');
const Resume = require('./Resume');

// Define Associations
User.hasMany(Resume, { foreignKey: 'userId', onDelete: 'CASCADE' });
Resume.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Resume,
    sequelize
};
