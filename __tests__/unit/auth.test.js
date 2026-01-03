const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../src/models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn()
}));

jest.mock('../../src/config/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}));

const User = require('../../src/models/User');
const authController = require('../../src/controllers/authController');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('signup', () => {
        it('should create a new user and return token', async () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com'
            });

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'User created successfully',
                    token: expect.any(String),
                    userId: 'user-123'
                })
            );
        });

        it('should return 409 if user already exists', async () => {
            req.body = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue({ email: 'existing@example.com' });

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
        });

        it('should return 400 if required fields are missing', async () => {
            req.body = { email: 'test@example.com' }; // Missing name and password

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
        });
    });

    describe('login', () => {
        it('should return token for valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);

            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue({
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Login successful',
                    token: expect.any(String),
                    userId: 'user-123',
                    name: 'Test User'
                })
            );
        });

        it('should return 401 for invalid password', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);

            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            User.findOne.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                password: hashedPassword
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Auth failed: Invalid password' });
        });

        it('should return 401 for non-existent user', async () => {
            req.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(null);

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Auth failed: User not found' });
        });
    });
});
