const fs = require('fs');
const path = require('path');

class WorkCountTracker {
    constructor() {
        this.path = path.join(__dirname, '../database/json/family/work_counts.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (!fs.existsSync(this.path)) {
                fs.writeFileSync(this.path, JSON.stringify({}, null, 2), 'utf8');
                return {};
            }
            
            const rawData = fs.readFileSync(this.path, 'utf8');
            return JSON.parse(rawData || '{}');
        } catch (error) {
            console.error('Error loading work count data:', error);
            return {};
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving work count data:', error);
            return false;
        }
    }

    getCount(userId) {
        this.data = this.loadData();
        return this.data[userId] || 0;
    }

    incrementCount(userId) {
        this.data = this.loadData();
        
        this.data[userId] = (this.data[userId] || 0) + 1;
        
        const saved = this.saveData();
        if (!saved) {
            console.error(`Failed to save work count for user ${userId}`);
        }
        
        return this.data[userId];
    }

    setCount(userId, count) {
        this.data[userId] = count;
        return this.saveData();
    }
}

module.exports = WorkCountTracker;
