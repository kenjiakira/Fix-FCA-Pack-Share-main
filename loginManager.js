const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const credentialManager = require('./utils/credentialManager');
const security = require('./utils/security');

class LoginManager {
    constructor() {
        this.appstatePath = './appstate.json';
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async askForInput(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    async login(encryptedCredentials) {
        const { email, password } = credentialManager.getCredentials();
        console.log("Attempting login with:", security.maskCredentials(email));

        let browser = null;
        try {
            console.log("Launching browser...");
            browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: [
                    '--window-size=1280,800',
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });

            const page = await browser.newPage();
            
            page.on('console', msg => console.log('PAGE LOG:', msg.text()));
            page.on('error', err => console.error('PAGE ERROR:', err));
            page.on('pageerror', err => console.error('PAGE ERROR:', err));

            console.log("Loading Facebook login page...");
            await page.goto('https://www.facebook.com/', {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            console.log("Waiting for login form...");
            await page.waitForSelector('input[name="email"]', {visible: true})
                .then(() => console.log("Found email input"))
                .catch(() => console.log("Email input not found"));
            
            await page.waitForSelector('input[name="pass"]', {visible: true})
                .then(() => console.log("Found password input"))
                .catch(() => console.log("Password input not found"));

            console.log("Entering credentials...");
            await page.type('input[name="email"]', email, {delay: 100});
            await page.type('input[name="pass"]', password, {delay: 100});

            console.log("Clicking login button...");
            await Promise.all([
                page.click('button[name="login"]'),
                page.waitForNavigation({waitUntil: 'networkidle0'})
            ]).catch(e => console.log("Navigation error:", e.message));

            console.log("Checking for security checkpoints...");
            const currentUrl = await page.url();
            console.log("Current URL:", currentUrl);

            if (currentUrl.includes('checkpoint')) {
                console.log("Security checkpoint detected");
                
                const approveButton = await page.$('button[value="This was me"]');
                if (approveButton) {
                    console.log("Clicking 'This was me'...");
                    await approveButton.click();
                    await page.waitForNavigation({waitUntil: 'networkidle0'});
                }

                const continueButton = await page.$('button[value="Continue"]');
                if (continueButton) {
                    console.log("Clicking 'Continue'...");
                    await continueButton.click();
                    await page.waitForNavigation({waitUntil: 'networkidle0'});
                }
            }

            console.log("Waiting for successful login...");
            await page.waitForFunction(() => {
                return document.cookie.includes('c_user');
            }, {timeout: 60000});

            // Get cookies
            console.log("Extracting cookies...");
            const cookies = await page.cookies();
            
            if (!cookies.some(cookie => cookie.name === 'c_user')) {
                throw new Error('Could not get c_user cookie');
            }

            const appstate = cookies.map(cookie => ({
                key: cookie.name,
                value: cookie.value,
                domain: "facebook.com",
                path: cookie.path,
                hostOnly: false,
                creation: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            }));

            console.log("Writing appstate to file...");
            fs.writeFileSync(this.appstatePath, JSON.stringify(appstate, null, 4));
            console.log("Appstate saved successfully!");

            if (!cookies.some(cookie => cookie.name === 'c_user')) {
                await page.screenshot({path: 'login-failed.png'});
                console.log("Login failed - screenshot saved as login-failed.png");
            }

            await browser.close();
            this.rl.close();
            return true;

        } catch (error) {
            console.error("Login error:", error.message);
            if (page) {
                await page.screenshot({path: 'error-screenshot.png'});
                console.log("Error screenshot saved as error-screenshot.png");
            }
            if (browser) await browser.close();
            this.rl.close();
            throw error;
        }
    }

    checkAppstateValid() {
        try {
            const appstate = JSON.parse(fs.readFileSync(this.appstatePath));
            return appstate.some(cookie => 
                cookie.key === 'c_user' && 
                new Date(cookie.lastAccessed) > new Date(Date.now() - 86400000)
            );
        } catch {
            return false;
        }
    }
}

module.exports = new LoginManager();
