const { randomInt } = require("crypto");

const HISTORY_LEN = 12;
const fomoHistory = new Map();

function getHistory(threadID) {
    if (!fomoHistory.has(threadID)) fomoHistory.set(threadID, []);
    return fomoHistory.get(threadID);
}

function pushOutcome(threadID, playerWon) {
    const h = getHistory(threadID);
    h.push(playerWon);
    if (h.length > HISTORY_LEN) h.shift();
}

function houseStreak(threadID) {
    const h = getHistory(threadID);
    let s = 0;
    for (let i = h.length - 1; i >= 0 && !h[i]; i--) s++;
    return s;
}

function playerStreak(threadID) {
    const h = getHistory(threadID);
    let s = 0;
    for (let i = h.length - 1; i >= 0 && h[i]; i--) s++;
    return s;
}

const XIU_SETS = [[1,1,2],[1,1,3],[1,2,2],[1,2,3],[1,3,3],[2,2,2],[1,1,4],[1,2,4],[2,2,3],[1,3,4],[2,3,3],[1,1,5],[1,2,5],[1,3,5],[2,2,4],[1,4,4],[2,3,4],[3,3,3],[2,2,5],[1,4,5],[2,3,5],[3,3,4],[1,1,6],[1,2,6],[1,3,6],[2,2,6],[1,4,6],[2,3,6],[3,4,4]];
const TAI_SETS = [[3,4,4],[2,4,5],[3,3,5],[1,4,6],[2,4,6],[3,4,5],[4,4,4],[1,5,6],[2,5,5],[3,5,5],[4,4,5],[1,6,6],[2,5,6],[3,5,6],[4,5,5],[5,5,5],[2,6,6],[3,6,6],[4,5,6],[4,6,6],[5,5,6],[5,6,6],[6,6,6]];

const CHANLE_ICONS = { W: "⚪", R: "🔴" };
const CHANLE_PATTERNS = {
    "chẵn": [
        [CHANLE_ICONS.W, CHANLE_ICONS.W, CHANLE_ICONS.R, CHANLE_ICONS.R],
        [CHANLE_ICONS.W, CHANLE_ICONS.W, CHANLE_ICONS.W, CHANLE_ICONS.W]
    ],
    "lẻ": [
        [CHANLE_ICONS.W, CHANLE_ICONS.R, CHANLE_ICONS.R, CHANLE_ICONS.R],
        [CHANLE_ICONS.W, CHANLE_ICONS.W, CHANLE_ICONS.W, CHANLE_ICONS.R],
        [CHANLE_ICONS.R, CHANLE_ICONS.R, CHANLE_ICONS.R, CHANLE_ICONS.R]
    ]
};
function generateLosingChanLe(playerChoice) {
    const result = playerChoice === "chẵn" ? "lẻ" : "chẵn";
    const patternPool = CHANLE_PATTERNS[result];
    const pattern = pick(patternPool);
    const isSpecial = pattern.every(c => c === CHANLE_ICONS.W) || pattern.every(c => c === CHANLE_ICONS.R);
    return { pattern, result, isSpecial };
}

function pick(arr) {
    return arr[randomInt(0, arr.length)];
}

function generateLosingDice(playerChoice) {
    const useTriple = Math.random() < 0.25;
    if (useTriple) {
        const n = randomInt(1, 7);
        return { dice1: n, dice2: n, dice3: n, total: n * 3, result: n * 3 >= 11 ? "tài" : "xỉu" };
    }
    if (playerChoice === "tài") {
        const [a, b, c] = pick(XIU_SETS);
        return { dice1: a, dice2: b, dice3: c, total: a + b + c, result: "xỉu" };
    }
    const [a, b, c] = pick(TAI_SETS);
    return { dice1: a, dice2: b, dice3: c, total: a + b + c, result: "tài" };
}

function getRigChance(betAmount, quy, threadID) {
    const payout = betAmount * 2;
    const effectiveQuy = Math.max(quy, 5000);

    if (payout <= 0 || betAmount < Math.max(10000, effectiveQuy * 0.005)) return 0;

    let chance = 0.10;

    if (payout > effectiveQuy * 0.2) chance += 0.45;
    else if (payout > effectiveQuy * 0.1) chance += 0.25;
    if (quy < 150000) chance += 0.15;
    else if (quy < 300000) chance += 0.08;

    const hStreak = houseStreak(threadID);
    const pStreak = playerStreak(threadID);

    if (hStreak >= 3) chance *= 0.5;
    else if (hStreak >= 2) chance *= 0.75;
    if (pStreak >= 2) chance *= 1.35;
    else if (pStreak >= 1) chance *= 1.15;

    return Math.min(0.92, Math.max(0, chance));
}

function getOutcome(betAmount, playerChoice, quy, threadID) {
    const rigChance = getRigChance(betAmount, quy, threadID || "");
    const rig = Math.random() < rigChance;

    if (rig) {
        const o = generateLosingDice(playerChoice);
        return { ...o, rigged: true };
    }
    return null;
}

function getOutcomeChanLe(betAmount, playerChoice, quy, threadID) {
    const rigChance = getRigChance(betAmount, quy, threadID || "");
    const rig = Math.random() < rigChance;
    if (rig) {
        const o = generateLosingChanLe(playerChoice);
        return { ...o, rigged: true };
    }
    return null;
}

function recordOutcome(threadID, playerWon) {
    if (threadID != null) pushOutcome(String(threadID), !!playerWon);
}

module.exports = {
    getOutcome,
    getOutcomeChanLe,
    recordOutcome,
    getRigChance,
    houseStreak,
    playerStreak
};
