const vipService = require('./vipService');
const { defaultBenefits } = require('./vipConfig');

const fs = require('fs');
const path = require('path');

function checkAndRemoveExpiredVIP() {
    return vipService.checkAndRemoveExpiredVIP();
}

function getVIPBenefits(userId) {
    return vipService.getVIPBenefits(userId);
}

setInterval(checkAndRemoveExpiredVIP, 60 * 60 * 1000);

module.exports = { checkAndRemoveExpiredVIP, getVIPBenefits, defaultBenefits };
