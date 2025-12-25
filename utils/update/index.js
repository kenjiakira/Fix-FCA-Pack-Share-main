const fileTracker = require('./fileTracker');
const versionManager = require('./versionManager');
const copyManager = require('./copyManager');

module.exports = {
    ...fileTracker,
    ...versionManager,
    ...copyManager
};
