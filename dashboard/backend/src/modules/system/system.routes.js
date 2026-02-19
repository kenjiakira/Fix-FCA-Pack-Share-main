const express = require('express');
const systemController = require('./system.controller');

const router = express.Router();

router.get('/status', (req, res, next) => systemController.getStatus(req, res, next));
router.get('/info', (req, res, next) => systemController.getSystemInfo(req, res, next));

module.exports = router;

