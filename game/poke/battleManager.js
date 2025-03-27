class BattleManager {
    constructor() {
        this.activeBattles = new Map();
        this.BATTLE_TIMEOUT = 30000;
    }

    startBattle(threadID) {
        if (this.isActiveBattle(threadID)) {
            return false;
        }
        this.activeBattles.set(threadID, {
            active: true,
            timestamp: Date.now()
        });
        return true;
    }

    endBattle(threadID) {
        this.activeBattles.delete(threadID);
    }

    isActiveBattle(threadID) {
        const battle = this.activeBattles.get(threadID);
        if (!battle) return false;

        if (Date.now() - battle.timestamp > this.BATTLE_TIMEOUT) {
            this.endBattle(threadID);
            return false;
        }
        return battle.active;
    }
}

module.exports = new BattleManager();
