const { spawn } = require("child_process");
const gradient = require("gradient-string");
const chalk = require("chalk");
const path = require('path');
const fs = require('fs');

const boldText = (text) => chalk.bold(text);
console.error(boldText(gradient.cristal("Starting....")));

const DISCORD_LOCK_FILE = path.join(__dirname, 'discord.lock');

function checkDiscordLock() {
    if (fs.existsSync(DISCORD_LOCK_FILE)) {
        const pid = fs.readFileSync(DISCORD_LOCK_FILE, 'utf8');
        try {
            process.kill(parseInt(pid), 0);
            console.log(boldText(gradient.cristal(`Discord bot already running with PID: ${pid}`)));
            return true;
        } catch(e) {
            fs.unlinkSync(DISCORD_LOCK_FILE);
        }
    }
    return false;
}

function startBotProcess(script, label) {
    console.log(boldText(gradient.cristal(`Starting ${label}...`)));
    
    if (label === 'Discord Bot' && checkDiscordLock()) {
        return;
    }

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", script], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    if (label === 'Discord Bot') {
        fs.writeFileSync(DISCORD_LOCK_FILE, child.pid.toString());
    }

    child.on("close", (codeExit) => {
        console.log(`${label} exited with code: ${codeExit}`);
        if (label === 'Discord Bot') {
            try {
                fs.unlinkSync(DISCORD_LOCK_FILE);
            } catch(e) {}
        }
        if (codeExit !== 0) {
            setTimeout(() => startBotProcess(script, label), 3000);
        }
    });

    child.on("error", (error) => {
        console.error(`Error starting ${label}: ${error}`);
        if (label === 'Discord Bot') {
            try {
                fs.unlinkSync(DISCORD_LOCK_FILE);
            } catch(e) {}
        }
    });

    return child;
}

startBotProcess("main.js", "Messenger Bot");

process.on('SIGINT', () => {
    try {
        fs.unlinkSync(DISCORD_LOCK_FILE);
    } catch(e) {}
    process.exit();
});