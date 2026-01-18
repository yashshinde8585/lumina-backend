const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

router.get('/health', healthCheck);
router.get('/ping', (req, res) => res.status(200).send('pong'));

module.exports = router;
