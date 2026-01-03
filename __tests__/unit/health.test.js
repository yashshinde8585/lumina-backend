const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../src/routes/healthRoutes');

// Mock dependencies
jest.mock('../../src/config/database', () => ({
    authenticate: jest.fn()
}));

jest.mock('../../src/config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

const sequelize = require('../../src/config/database');

describe('Health Check Endpoint', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(healthRoutes);
        jest.clearAllMocks();
    });

    it('should return 200 and healthy status when database is connected', async () => {
        sequelize.authenticate.mockResolvedValue();

        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('checks');
        expect(response.body.checks.database.status).toBe('healthy');
    });

    it('should return 503 when database connection fails', async () => {
        sequelize.authenticate.mockRejectedValue(new Error('Connection failed'));

        const response = await request(app).get('/health');

        expect(response.status).toBe(503);
        expect(response.body.status).toBe('unhealthy');
        expect(response.body.checks.database.status).toBe('unhealthy');
    });

    it('should include AI service status', async () => {
        sequelize.authenticate.mockResolvedValue();

        const response = await request(app).get('/health');

        expect(response.body.checks.aiService).toBeDefined();
        expect(response.body.checks.aiService.status).toMatch(/configured|mock-mode/);
    });

    it('should include memory usage metrics', async () => {
        sequelize.authenticate.mockResolvedValue();

        const response = await request(app).get('/health');

        expect(response.body.checks.memory).toBeDefined();
        expect(response.body.checks.memory.status).toBe('healthy');
        expect(response.body.checks.memory).toHaveProperty('heapUsed');
        expect(response.body.checks.memory).toHaveProperty('heapTotal');
    });
});
