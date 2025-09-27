const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

class GroupController {
  constructor() {
    this.threadsPath = path.join(__dirname, '../../../database/threads.json');
  }

  // Lấy danh sách tất cả nhóm
  async getAllGroups(req, res) {
    try {
      console.log('Getting groups from:', this.threadsPath);
      
      if (!fs.existsSync(this.threadsPath)) {
        console.error('Threads file not found:', this.threadsPath);
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'No threads file found'
        });
      }

      const threadsData = JSON.parse(fs.readFileSync(this.threadsPath, 'utf8'));
      console.log('Found', Object.keys(threadsData).length, 'threads in database');
      
      const groups = [];

      for (const [threadId, threadData] of Object.entries(threadsData)) {
        // Skip if no members (likely not a group)
        if (!threadData.members || threadData.members.length === 0) {
          continue;
        }

        // Xử lý adminIDs từ cấu trúc {id: string}[]
        const adminCount = threadData.adminIDs ? threadData.adminIDs.length : 0;
        
        const group = {
          id: threadId,
          name: threadData.name || threadData.threadName || `Nhóm ${threadId}`,
          memberCount: threadData.members ? threadData.members.length : 0,
          adminCount: adminCount,
          messageCount: threadData.messageCount ? Object.values(threadData.messageCount).reduce((a, b) => a + b, 0) : 0,
          createdAt: threadData.createdAt || new Date().toISOString(),
          lastActivity: threadData.lastActivity ? new Date(threadData.lastActivity).toISOString() : new Date().toISOString(),
          isActive: threadData.isActive !== false,
          settings: threadData.settings || {}
        };
        groups.push(group);
      }

      console.log('Processed', groups.length, 'groups');

      res.json({
        success: true,
        data: groups,
        total: groups.length
      });
    } catch (error) {
      console.error('Error getting groups:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể lấy danh sách nhóm',
        details: error.message
      });
    }
  }

  // Lấy thông tin chi tiết một nhóm
  async getGroupById(req, res) {
    try {
      const { threadId } = req.params;
      
      if (!fs.existsSync(this.threadsPath)) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy dữ liệu nhóm'
        });
      }

      const threadsData = JSON.parse(fs.readFileSync(this.threadsPath, 'utf8'));
      
      if (!threadsData[threadId]) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy nhóm'
        });
      }

      const threadData = threadsData[threadId];
      
      // Xử lý adminIDs từ cấu trúc {id: string}[]
      const admins = threadData.adminIDs ? threadData.adminIDs.map(admin => admin.id) : [];
      const adminCount = admins.length;
      
      const group = {
        id: threadId,
        name: threadData.name || threadData.threadName || `Nhóm ${threadId}`,
        members: threadData.members || [],
        admins: admins,
        messageCount: threadData.messageCount || {},
        totalMessages: threadData.messageCount ? Object.values(threadData.messageCount).reduce((a, b) => a + b, 0) : 0,
        memberCount: threadData.members ? threadData.members.length : 0,
        adminCount: adminCount,
        createdAt: threadData.createdAt || new Date().toISOString(),
        lastActivity: threadData.lastActivity ? new Date(threadData.lastActivity).toISOString() : new Date().toISOString(),
        isActive: threadData.isActive !== false,
        settings: threadData.settings || {},
        statistics: {
          topMembers: this.getTopMembers(threadData.messageCount || {}),
          activityLevel: this.calculateActivityLevel(threadData.messageCount || {}),
          growthRate: this.calculateGrowthRate(threadData)
        }
      };

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      console.error('Error getting group:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể lấy thông tin nhóm',
        details: error.message
      });
    }
  }

  // Cập nhật thông tin nhóm
  async updateGroup(req, res) {
    try {
      const { threadId } = req.params;
      const updateData = req.body;
      
      const threadsData = JSON.parse(fs.readFileSync(this.threadsPath, 'utf8'));
      
      if (!threadsData[threadId]) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy nhóm'
        });
      }

      // Cập nhật thông tin nhóm
      if (updateData.name) {
        threadsData[threadId].name = updateData.name;
      }
      
      if (updateData.settings) {
        threadsData[threadId].settings = {
          ...threadsData[threadId].settings,
          ...updateData.settings
        };
      }

      if (updateData.isActive !== undefined) {
        threadsData[threadId].isActive = updateData.isActive;
      }

      // Lưu file
      fs.writeFileSync(this.threadsPath, JSON.stringify(threadsData, null, 2));

      res.json({
        success: true,
        message: 'Cập nhật nhóm thành công',
        data: threadsData[threadId]
      });
    } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể cập nhật nhóm'
      });
    }
  }

  // Xóa nhóm
  async deleteGroup(req, res) {
    try {
      const { threadId } = req.params;
      
      const threadsData = JSON.parse(fs.readFileSync(this.threadsPath, 'utf8'));
      
      if (!threadsData[threadId]) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy nhóm'
        });
      }

      // Xóa nhóm
      delete threadsData[threadId];

      // Lưu file
      fs.writeFileSync(this.threadsPath, JSON.stringify(threadsData, null, 2));

      res.json({
        success: true,
        message: 'Xóa nhóm thành công'
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể xóa nhóm'
      });
    }
  }

  // Quản lý Admin nhóm
  async manageGroupAdmins(req, res) {
    try {
      const { threadId } = req.params;
      const { action, userId } = req.body;
      
      const threadsData = JSON.parse(fs.readFileSync(this.threadsPath, 'utf8'));
      
      if (!threadsData[threadId]) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy nhóm'
        });
      }

      const threadData = threadsData[threadId];

      // Đảm bảo adminIDs tồn tại
      if (!threadData.adminIDs) {
        threadData.adminIDs = [];
      }

      switch (action) {
        case 'add_admin':
          // Kiểm tra xem admin đã tồn tại chưa
          const existingAdmin = threadData.adminIDs.find(admin => admin.id === userId);
          if (!existingAdmin) {
            threadData.adminIDs.push({ id: userId });
          }
          break;
          
        case 'remove_admin':
          threadData.adminIDs = threadData.adminIDs.filter(admin => admin.id !== userId);
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Hành động không hợp lệ'
          });
      }

      // Lưu file
      fs.writeFileSync(this.threadsPath, JSON.stringify(threadsData, null, 2));

      res.json({
        success: true,
        message: 'Quản lý Admin thành công',
        data: {
          admins: threadData.adminIDs.map(admin => admin.id)
        }
      });
    } catch (error) {
      console.error('Error managing group admins:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể quản lý Admin nhóm'
      });
    }
  }

  // Lấy thống kê nhóm
  async getGroupStats(req, res) {
    try {
      if (!fs.existsSync(this.threadsPath)) {
        console.error('Threads file not found:', this.threadsPath);
        return res.json({
          success: true,
          data: {
            totalGroups: 0,
            activeGroups: 0,
            totalMembers: 0,
            totalAdmins: 0,
            totalMessages: 0,
            averageMembersPerGroup: 0,
            topGroups: []
          }
        });
      }

      const threadsData = JSON.parse(fs.readFileSync(this.threadsPath, 'utf8'));
      
      const stats = {
        totalGroups: 0,
        activeGroups: 0,
        totalMembers: 0,
        totalAdmins: 0,
        totalMessages: 0,
        averageMembersPerGroup: 0,
        topGroups: []
      };

      // Filter only groups with members
      const groupsWithMembers = Object.entries(threadsData).filter(([id, data]) => 
        data.members && data.members.length > 0
      );

      stats.totalGroups = groupsWithMembers.length;
      stats.activeGroups = groupsWithMembers.filter(([id, group]) => group.isActive !== false).length;
      stats.totalMembers = groupsWithMembers.reduce((total, [id, group]) => {
        return total + (group.members ? group.members.length : 0);
      }, 0);
      stats.totalAdmins = groupsWithMembers.reduce((total, [id, group]) => {
        return total + (group.adminIDs ? group.adminIDs.length : 0);
      }, 0);
      stats.totalMessages = groupsWithMembers.reduce((total, [id, group]) => {
        return total + (group.messageCount ? Object.values(group.messageCount).reduce((a, b) => a + b, 0) : 0);
      }, 0);

      // Tính trung bình thành viên mỗi nhóm
      if (stats.totalGroups > 0) {
        stats.averageMembersPerGroup = Math.round(stats.totalMembers / stats.totalGroups);
      }

      // Lấy top 10 nhóm có nhiều thành viên nhất
      const groupsWithMemberCount = groupsWithMembers.map(([id, data]) => ({
        id,
        name: data.name || data.threadName || `Nhóm ${id}`,
        memberCount: data.members ? data.members.length : 0,
        messageCount: data.messageCount ? Object.values(data.messageCount).reduce((a, b) => a + b, 0) : 0
      }));

      stats.topGroups = groupsWithMemberCount
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, 10);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting group stats:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể lấy thống kê nhóm',
        details: error.message
      });
    }
  }

  // Helper methods
  getTopMembers(messageCount, limit = 10) {
    return Object.entries(messageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }));
  }

  calculateActivityLevel(messageCount) {
    const totalMessages = Object.values(messageCount).reduce((a, b) => a + b, 0);
    const memberCount = Object.keys(messageCount).length;
    
    if (memberCount === 0) return 'Thấp';
    
    const avgMessagesPerMember = totalMessages / memberCount;
    
    if (avgMessagesPerMember > 100) return 'Cao';
    if (avgMessagesPerMember > 50) return 'Trung bình';
    return 'Thấp';
  }

  calculateGrowthRate(threadData) {
    // Logic tính tỷ lệ tăng trưởng có thể được thêm ở đây
    return 'Stable';
  }
}

const groupController = new GroupController();

// Routes
router.get('/', groupController.getAllGroups.bind(groupController));
router.get('/stats', groupController.getGroupStats.bind(groupController));
router.get('/:threadId', groupController.getGroupById.bind(groupController));
router.put('/:threadId', groupController.updateGroup.bind(groupController));
router.delete('/:threadId', groupController.deleteGroup.bind(groupController));
router.post('/:threadId/admins', groupController.manageGroupAdmins.bind(groupController));

module.exports = router;
