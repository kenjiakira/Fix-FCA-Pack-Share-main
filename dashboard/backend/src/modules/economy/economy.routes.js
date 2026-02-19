const express = require('express');
const economyController = require('./economy.controller');

const router = express.Router();

router.get('/', (req, res, next) => economyController.getOverview(req, res, next));
router.post('/balance', (req, res, next) => economyController.updateBalance(req, res, next));
router.post('/transfer', (req, res, next) => economyController.transferBalance(req, res, next));
router.get('/balance/:uid', (req, res, next) => economyController.getUserBalance(req, res, next));
router.post('/quy', (req, res, next) => economyController.updateQuy(req, res, next));
router.get('/quy', (req, res, next) => economyController.getQuy(req, res, next));

module.exports = router;

