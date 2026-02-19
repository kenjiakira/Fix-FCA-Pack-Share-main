const express = require('express');
const overviewController = require('./overview.controller');

const router = express.Router();

router.get('/', (req, res, next) => overviewController.getOverview(req, res, next));

module.exports = router;

