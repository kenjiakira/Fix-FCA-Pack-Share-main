class MarketAlgorithms {
    static generateInitialPrice(basePrice) {
        const variance = 0.1; // 10% variance
        const randomFactor = 1 + (Math.random() * variance * 2 - variance);
        return Math.floor(basePrice * randomFactor);
    }

    static generateMarketDepth(currentPrice, isBids) {
        const levels = [];
        const numLevels = 5;
        const maxPriceChange = 0.05; 
        const maxVolumeVariance = 0.3; // 30% volume variance

        for (let i = 0; i < numLevels; i++) {
            const priceOffset = (isBids ? -1 : 1) * (i + 1) * (maxPriceChange / numLevels);
            const levelPrice = Math.floor(currentPrice * (1 + priceOffset));
            
            const baseVolume = Math.floor(Math.random() * 10000) + 1000;
            const volumeVariance = 1 + (Math.random() * maxVolumeVariance * 2 - maxVolumeVariance);
            const volume = Math.floor(baseVolume * volumeVariance);

            levels.push({
                price: levelPrice,
                volume: volume
            });
        }

        return levels;
    }

    static analyzeMarket(stocks) {
        const gainers = [];
        const losers = [];
        let totalVolume = 0;
        let totalValue = 0;

        Object.entries(stocks).forEach(([symbol, data]) => {
            totalVolume += data.volume;
            totalValue += data.price * data.volume;

            if (data.change > 0) {
                gainers.push({ symbol, change: data.change });
            } else if (data.change < 0) {
                losers.push({ symbol, change: data.change });
            }
        });

        gainers.sort((a, b) => b.change - a.change);
        losers.sort((a, b) => a.change - b.change);

        const marketSentiment = this.calculateMarketSentiment(gainers, losers);

        return {
            topGainers: gainers.slice(0, 3),
            topLosers: losers.slice(0, 3),
            totalVolume,
            totalValue,
            marketSentiment
        };
    }

    static calculateMarketSentiment(gainers, losers) {
        if (gainers.length === 0 && losers.length === 0) return 'Neutral';

        const totalStocks = gainers.length + losers.length;
        const gainerPercentage = (gainers.length / totalStocks) * 100;

        if (gainerPercentage >= 70) return 'Very Bullish';
        if (gainerPercentage >= 60) return 'Bullish';
        if (gainerPercentage >= 40) return 'Neutral';
        if (gainerPercentage >= 30) return 'Bearish';
        return 'Very Bearish';
    }
}

module.exports = MarketAlgorithms;
