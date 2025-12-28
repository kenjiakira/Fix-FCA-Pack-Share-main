const express = require('express');
const threadsController = require('./threads.controller');

const router = express.Router();

router.get('/', (req, res, next) => threadsController.findAll(req, res, next));
router.get('/:threadID', (req, res, next) => threadsController.findOne(req, res, next));

module.exports = router;

