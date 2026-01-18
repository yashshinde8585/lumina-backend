const { Sequelize } = require('sequelize');
const path = require('path');

// Determine if running in Production environment
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
    // HOSTED: Use PostgreSQL Connection String (Render)
    if (!process.env.DATABASE_URL) {
        console.warn("⚠️  WARNING: DATABASE_URL is missing in Production! Falling back to SQLite temporary DB.");
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(__dirname, '../../database.sqlite'),
            logging: false
        });
    } else {
        sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false // Required for Render's self-signed certs
                }
            },
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });
    }
} else {
    // LOCAL: Keep using SQLite for easy development
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../database.sqlite'),
        logging: false
    });
}

module.exports = sequelize;
