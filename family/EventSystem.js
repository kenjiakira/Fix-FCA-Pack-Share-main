class EventSystem {
    constructor() {
        this.events = {
            accident: [
                { type: 'accident', name: 'Tai nạn giao thông', description: 'Không may gặp tai nạn giao thông nhẹ', healthLoss: -20, moneyLoss: 5000000 },
                { type: 'accident', name: 'Ngã cầu thang', description: 'Bị trượt ngã cầu thang', healthLoss: -15, moneyLoss: 2000000 },
                { type: 'accident', name: 'Ngộ độc thực phẩm', description: 'Bị ngộ độc do ăn đồ ăn không đảm bảo', healthLoss: -25, moneyLoss: 3000000 }
            ],
            illness: [
                { type: 'illness', name: 'Cảm cúm', description: 'Bị cảm cúm mùa', healthLoss: -10, moneyLoss: 1000000 },
                { type: 'illness', name: 'Sốt xuất huyết', description: 'Mắc sốt xuất huyết', healthLoss: -30, moneyLoss: 8000000 },
                { type: 'illness', name: 'COVID-19', description: 'Nhiễm COVID-19', healthLoss: -35, moneyLoss: 10000000 }
            ],
            fortune: [
                { type: 'fortune', name: 'Trúng vé số', description: 'May mắn trúng vé số', moneyGain: 50000000, happinessGain: 20 },
                { type: 'fortune', name: 'Được thăng chức', description: 'Được công ty thăng chức', moneyGain: 20000000, happinessGain: 15 },
                { type: 'fortune', name: 'Được thưởng', description: 'Được thưởng do thành tích tốt', moneyGain: 10000000, happinessGain: 10 }
            ],
            disaster: [
                { type: 'disaster', name: 'Mất trộm', description: 'Bị kẻ gian đột nhập nhà', moneyLoss: 15000000, happinessLoss: -15 },
                { type: 'disaster', name: 'Hỏa hoạn', description: 'Xảy ra hỏa hoạn trong nhà', moneyLoss: 30000000, happinessLoss: -20 },
                { type: 'disaster', name: 'Lũ lụt', description: 'Nhà bị ngập do mưa lớn', moneyLoss: 20000000, happinessLoss: -10 }
            ]
        };

        // Store last event times for each activity type
        this.lastEventTimes = {};
        
        // Event chance for different activities (%)
        this.eventChances = {
            work: 5,      // 5% chance when working
            travel: 10,   // 10% chance during travel
            love: 3,      // 3% chance during intimate time
            daily: 8      // 8% chance during daily activities
        };
    }

    shouldTriggerEvent(userId, activityType) {
        // Check if enough time has passed since last event for this activity
        const lastTime = this.lastEventTimes[`${userId}_${activityType}`] || 0;
        const cooldown = 3600000; // 1 hour cooldown between events
        
        if (Date.now() - lastTime < cooldown) {
            return false;
        }

        // Random chance based on activity type
        const chance = this.eventChances[activityType] || 5;
        return Math.random() * 100 < chance;
    }

    getRandomEvent() {
        const eventTypes = Object.keys(this.events);
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const events = this.events[randomType];
        return events[Math.floor(Math.random() * events.length)];
    }

    processEvent(userId, activityType) {
        if (!this.shouldTriggerEvent(userId, activityType)) {
            return null;
        }

        const event = this.getRandomEvent();
        this.lastEventTimes[`${userId}_${activityType}`] = Date.now();

        // Apply insurance benefits if applicable
        const hasInsurance = this.hasInsurance(userId, event.type);
        return this.calculateEventImpact(event, hasInsurance);
    }

    hasInsurance(userId, type) {
        // TODO: Implement insurance check logic
        return false;
    }

    calculateEventImpact(event, hasInsurance) {
        let impact = { ...event };
        
        if (hasInsurance) {
            if (impact.moneyLoss) impact.moneyLoss *= 0.3; // 70% covered by insurance
            if (impact.healthLoss) impact.healthLoss *= 0.5; // 50% health impact reduction
        }
        
        return impact;
    }
}

module.exports = EventSystem;
