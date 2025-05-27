const fs = require('fs');
const path = require('path');
const { DESTINATIONS, COOLDOWN } = require('../config/family/travelConfig');

class TravelSystem {
    constructor() {
        this.path = path.join(__dirname, '../../database/json/family/travel.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (!fs.existsSync(this.path)) {
                fs.writeFileSync(this.path, '{}');
                return {};
            }
            return JSON.parse(fs.readFileSync(this.path));
        } catch (error) {
            console.error('Error loading travel data:', error);
            return {};
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving travel data:', error);
            return false;
        }
    }

    calculateTravelCost(userID, destination, familySize) {
        const dest = DESTINATIONS[destination];
        if (!dest) return null;

        const { single, couple, perChild } = dest.priceMultipliers;
        const basePrice = dest.basePrice;

        if (familySize.type === 'single') {
            return Math.floor(basePrice * single);
        }

        const couplePrice = basePrice * couple;
        const childrenCost = basePrice * perChild * familySize.children;
        return Math.floor(couplePrice + childrenCost);
    }

    canTravel(userID) {
        const userData = this.data[userID];
        if (!userData) return true;

        const now = Date.now();
        if (userData.onTrip) {
            const tripEnds = userData.tripStarted + (userData.duration * 24 * 60 * 60 * 1000);
            if (now < tripEnds) {
                const remainingHours = Math.ceil((tripEnds - now) / (1000 * 60 * 60));
                return { 
                    canTravel: false, 
                    reason: 'onTrip',
                    remainingTime: remainingHours,
                    destination: userData.currentDestination
                };
            }
        }

        if (userData.lastTrip) {
            const cooldownEnds = userData.lastTrip + COOLDOWN;
            if (now < cooldownEnds) {
                const remainingHours = Math.ceil((cooldownEnds - now) / (1000 * 60 * 60));
                return { 
                    canTravel: false, 
                    reason: 'cooldown',
                    remainingTime: remainingHours
                };
            }
        }

        return { canTravel: true };
    }

    startTravel(userID, destination) {
        const dest = DESTINATIONS[destination];
        if (!dest) throw new Error("Điểm đến không hợp lệ!");

        if (!this.data[userID]) {
            this.data[userID] = {};
        }

        const userData = this.data[userID];
        userData.onTrip = true;
        userData.tripStarted = Date.now();
        userData.currentDestination = destination;
        userData.duration = parseInt(dest.duration);

        this.saveData();
        return dest;
    }

    endTravel(userID) {
        const userData = this.data[userID];
        if (!userData || !userData.onTrip) {
            throw new Error("Không có chuyến đi nào đang diễn ra!");
        }

        const dest = DESTINATIONS[userData.currentDestination];
        userData.onTrip = false;
        userData.lastTrip = Date.now();
        userData.currentDestination = null;
        
        this.saveData();
        return dest.happiness;
    }

    getTravelStatus(userID) {
        const userData = this.data[userID];
        if (!userData || !userData.onTrip) return null;

        const dest = DESTINATIONS[userData.currentDestination];
        const now = Date.now();
        const tripEnds = userData.tripStarted + (userData.duration * 24 * 60 * 60 * 1000);
        const remainingHours = Math.ceil((tripEnds - now) / (1000 * 60 * 60));

        return {
            destination: dest,
            remainingHours,
            started: userData.tripStarted
        };
    }

    getDestinationInfo(destination) {
        return DESTINATIONS[destination];
    }

    getAllDestinations() {
        return DESTINATIONS;
    }
}

module.exports = TravelSystem;
