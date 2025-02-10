class MarketAlgorithms {
    static generateMarketDepth(price, isBid) {
        const levels = 5;
        const depth = [];
        let basePrice = price;
        
        for (let i = 0; i < levels; i++) {
            const priceChange = (isBid ? -1 : 1) * (i + 1) * 0.1;
            const levelPrice = Math.floor(basePrice * (1 + priceChange));
            const volume = Math.floor(Math.random() * 5000) + 1000;
            depth.push({
                price: levelPrice,
                volume: volume
            });
        }
        return depth;
    }

    static calculatePriceChange(currentPrice, prevChange) {
        const baseChange = (Math.random() - 0.5) * 2;
        const momentum = prevChange > 0 ? 0.6 : 0.4;
        return baseChange * (Math.random() < momentum ? 1 : -1);
    }

    static calculateVolume(currentVolume) {
        return Math.floor(currentVolume * (0.8 + Math.random() * 0.4));
    }

    static generateInitialPrice(basePrice) {
        const randomChange = (Math.random() - 0.5) * 4;
        return Math.floor(basePrice * (1 + randomChange / 100));
    }

    static generateRandomHistory(currentPrice, count = 20) {
        const history = [];
        for (let i = 0; i < count; i++) {
            const time = Date.now() - (i * 5 * 60 * 1000);
            const randomChange = (Math.random() - 0.5) * 2;
            history.unshift({
                price: currentPrice * (1 + randomChange / 100),
                timestamp: time
            });
        }
        return history;
    }

    static analyzeMarket(stocks) {
        const stockEntries = Object.entries(stocks);
        return {
            topGainers: stockEntries
                .filter(([_, data]) => data.change > 0)
                .sort((a, b) => b[1].change - a[1].change)
                .slice(0, 3),
            topLosers: stockEntries
                .filter(([_, data]) => data.change < 0)
                .sort((a, b) => a[1].change - b[1].change)
                .slice(0, 3)
        };
    }
}

module.exports = MarketAlgorithms;
