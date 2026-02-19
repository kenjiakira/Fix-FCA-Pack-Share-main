const express = require('express');
const vipController = require('./vip.controller');

const router = express.Router();

router.get('/', (req, res, next) => vipController.findAll(req, res, next));
router.post('/', (req, res, next) => vipController.create(req, res, next));
router.delete('/:userId', (req, res, next) => vipController.remove(req, res, next));

module.exports = router;

