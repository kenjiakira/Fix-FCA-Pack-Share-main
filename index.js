const { spawn } = require("child_process");
const gradient = require("gradient-string");
const chalk = require("chalk");
const boldText = (text) => chalk.bold(text)
console.error(boldText(gradient.cristal("Starting....")));

function startBotProcess(script) {
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", script], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        console.log(`${script} Quá trình thoát bằng mã: ${codeExit}`);
        if (codeExit !== 0) {
            setTimeout(() => startBotProcess(script), 3001);
        }
    });

    child.on("error", (error) => {
        console.error(`Đã xảy ra lỗi khi bắt đầu ${script} quá trình: ${error}`);
    });
}

startBotProcess("main.js");