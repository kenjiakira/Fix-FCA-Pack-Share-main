const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Lấy danh sách tất cả nhóm
router.get('/', groupController.getAllGroups);

// Lấy thống kê nhóm
router.get('/stats', groupController.getGroupStats);

// Lấy thông tin chi tiết một nhóm
router.get('/:threadId', groupController.getGroupById);

// Cập nhật thông tin nhóm
router.put('/:threadId', groupController.updateGroup);

// Xóa nhóm
router.delete('/:threadId', groupController.deleteGroup);

// Quản lý thành viên nhóm
router.post('/:threadId/members', groupController.manageGroupMembers);

module.exports = router;
