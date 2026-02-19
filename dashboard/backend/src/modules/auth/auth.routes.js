const express = require('express');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/verify', (req, res, next) => authController.verify(req, res, next));

module.exports = router;

