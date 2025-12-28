const express = require('express');
const usersController = require('./users.controller');

const router = express.Router();

router.get('/', (req, res, next) => usersController.findAll(req, res, next));
router.get('/:uid', (req, res, next) => usersController.findOne(req, res, next));
router.post('/:uid/balance', (req, res, next) => usersController.updateBalance(req, res, next));

module.exports = router;

