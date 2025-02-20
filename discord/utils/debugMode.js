function isDebugMode() {
    return process.env.NODE_ENV === 'development' || !!process.env.DEBUG;
}

function handleDebugExit() {
    if (isDebugMode()) {

        process.kill(process.pid, 'SIGTERM');
        return true;
    }
    return false;
}

module.exports = {
    isDebugMode,
    handleDebugExit
};
