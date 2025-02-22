const { spawn } = require('child_process');
const path = require('path');

function spawnNewProcess() {
    const mainScriptPath = path.join(__dirname, '../../main.js');
    
    const newProcess = spawn('node', [mainScriptPath], {
        detached: true,
        stdio: 'inherit'
    });

    newProcess.unref();
    return newProcess;
}

module.exports = {
    spawnNewProcess
};
