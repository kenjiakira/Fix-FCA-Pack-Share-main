const express = require('express');
const economyController = require('./economy.controller');

const router = express.Router();

router.get('/', (req, res, next) => economyController.getOverview(req, res, next));

module.exports = router;

