const express = require('express');
const permissionsController = require('./permissions.controller');

const router = express.Router();

router.get('/', (req, res, next) => permissionsController.getPermissions(req, res, next));
router.get('/config', (req, res, next) => permissionsController.getFullConfig(req, res, next));
router.post('/add', (req, res, next) => permissionsController.addPermission(req, res, next));
router.post('/remove', (req, res, next) => permissionsController.removePermission(req, res, next));

module.exports = router;

