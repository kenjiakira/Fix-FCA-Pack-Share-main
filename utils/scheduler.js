const cron = require('node-cron');

function scheduleCron(expression, callback) {
    return cron.schedule(expression, () => {
        Promise.resolve(callback()).catch((err) =>
            console.error('[scheduler]', err)
        );
    });
}

module.exports = { scheduleCron };
