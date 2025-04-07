
const npcs = [
  {
    id: "npc_trader_01",
    name: "Mĩ Anh",
    balance: 1,
    winRate: 0.55,
    minBet: 1000,
    maxBet: 100000,
    avatar: "https://imgur.com/uhb6ShO.jpg", // Anime girl with money
    lastPlayed: 0
  },
  {
    id: "npc_trader_02", 
    name: "Tấn Phú",
    balance: 1,
    winRate: 0.52,
    minBet: 5000,
    maxBet: 500000,
    avatar: "https://imgur.com/iTIj3fx.jpg", // Anime rich man
    lastPlayed: 0
  },
  {
    id: "npc_trader_03",
    name: "Trần Thị Thanh Thanh",
    balance: 1,
    winRate: 0.58,
    minBet: 500,
    maxBet: 50000,
    avatar: "https://imgur.com/pJ4yqHA.jpg", // Anime lucky girl
    lastPlayed: 0
  }
];

function getNPCs() {
  return npcs;
}

function updateNPCBalance(npcId, amount) {
  const npc = npcs.find(n => n.id === npcId);
  if (npc) {
    npc.balance += amount;
  }
}

function getRandomNPC() {
  const now = Date.now();
  const availableNPCs = npcs.filter(npc => now - npc.lastPlayed > 30000);
  
  if (availableNPCs.length === 0) return null;
  
  const npc = availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
  npc.lastPlayed = now;
  return npc;
}

function shouldNPCPlay() {
  return Math.random() < 0.3; // 30% chance for NPC to play
}

function getNPCBet(npc) {
  const betAmount = Math.floor(
    Math.random() * (npc.maxBet - npc.minBet + 1) + npc.minBet
  );
  return Math.min(betAmount, npc.balance);
}

function makeNPCChoice(npc) {
  const choices = ["tài", "xỉu"];
  return choices[Math.floor(Math.random() * choices.length)];
}

module.exports = {
  getNPCs,
  updateNPCBalance,
  getRandomNPC,
  shouldNPCPlay,
  getNPCBet,
  makeNPCChoice
};
