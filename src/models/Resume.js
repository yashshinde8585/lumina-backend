const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Resume = sequelize.define('Resume', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'My Resume'
    },
    content: {
        type: DataTypes.JSON,
        allowNull: false
    },
    template: {
        type: DataTypes.STRING,
        defaultValue: 'modern'
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    publicId: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        }
    ]
});

// Associations are handled in src/models/index.js
module.exports = Resume;
