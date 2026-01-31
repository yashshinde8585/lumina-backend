const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET is not defined in environment variables.');
    } else {
        logger.warn('⚠️  JWT_SECRET is not defined. Using insecure default for development.');
    }
}
// Always have a fallback for dev if env is missing
const FINAL_JWT_SECRET = JWT_SECRET || 'dev_secret_fallback_123';



exports.signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            FINAL_JWT_SECRET,
            { expiresIn: '14d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email
        });
    } catch (error) {
        next(error);
    }
};

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvwxy1234567890abcdefghijklm'; // Pre-computed dummy hash

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });

        // Timing Attack Mitigation: Always perform a comparison
        const targetHash = user ? user.password : DUMMY_HASH;
        const isMatch = await bcrypt.compare(password, targetHash);

        if (!user || !isMatch) {
            return res.status(401).json({ message: 'Auth failed: Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            FINAL_JWT_SECRET,
            { expiresIn: '14d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user.id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

exports.googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create a new user if one doesn't exist
            // Generate a random password since the user is logging in via Google
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                email,
                name,
                password: hashedPassword
            });
        }

        // We no longer update googleId or avatar on existing users

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            FINAL_JWT_SECRET,
            { expiresIn: '14d' }
        );


        const responseData = {
            token,
            userId: user.id,
            name: user.name,
            email: user.email
        };

        // Store the full response JSON in the database is REDUNDANT and INSECURE.
        // Removed as per production readiness review.
        // user.authResponse = responseData;
        // await user.save();

        res.status(200).json(responseData);

    } catch (error) {
        next(error);
    }
};

exports.getBoard = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userData.userId, {
            attributes: ['jobBoardData']
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.jobBoardData || []);
    } catch (error) {
        next(error);
    }
};

exports.updateBoard = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userData.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.jobBoardData = req.body.boardData;
        await user.save();
        res.status(200).json({ message: 'Board updated successfully' });
    } catch (error) {
        next(error);
    }
};
