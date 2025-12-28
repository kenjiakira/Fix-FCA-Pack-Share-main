const express = require('express');
const appStateController = require('./appstate.controller');

const router = express.Router();

router.post('/', (req, res, next) => appStateController.update(req, res, next));

module.exports = router;

