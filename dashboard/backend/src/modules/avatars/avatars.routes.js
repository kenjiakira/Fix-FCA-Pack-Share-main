const express = require('express');
const avatarsController = require('./avatars.controller');

const router = express.Router();

router.get('/:userId', (req, res, next) => avatarsController.getAvatar(req, res, next));

module.exports = router;

