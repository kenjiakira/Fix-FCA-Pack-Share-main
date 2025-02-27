const { getBalance, updateBalance } = require('../utils/currencies');

class OrderProcessor {
    constructor(orderBook, orderManager, orderMatcher) {
        this.orderBook = orderBook;
        this.orderManager = orderManager;
        this.orderMatcher = orderMatcher;
    }

    async processOrder(order) {
        if (order.side === 'buy') {
            return await this.processBuyOrder(order);
        } else {
            return await this.processSellOrder(order);
        }
    }

    async processBuyOrder(buyOrder) {
        const matchingSellOrders = await this.findMatchingSellOrders(buyOrder);
        
        if (matchingSellOrders.length > 0) {
            
            return await this.executeMatchedOrders(buyOrder, matchingSellOrders);
        } else {
            // 3. Không có lệnh khớp -> Mua từ hệ thống
            return await this.executeSystemBuy(buyOrder);
        }
    }

    async processSellOrder(sellOrder) {
        // 1. Đặt lệnh vào OrderBook
        await this.orderManager.placeOrder(sellOrder);
        
        // 2. Tìm lệnh mua khớp
        const matchingBuyOrders = await this.findMatchingBuyOrders(sellOrder);
        
        if (matchingBuyOrders.length > 0) {
            // 3. Khớp lệnh nếu có
            return await this.executeMatchedOrders(matchingBuyOrders[0], [sellOrder]);
        } else {
            // 4. Chờ khớp lệnh
            return {
                orderId: sellOrder.orderId,
                status: 'pending',
                message: 'Lệnh bán đã được đặt, đang chờ khớp lệnh'
            };
        }
    }

    async findMatchingSellOrders(buyOrder) {
        const orderBook = await this.orderBook.getOrderBook(buyOrder.symbol);
        return orderBook.asks
            .filter(order => order.price <= buyOrder.price)
            .sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
    }

    async findMatchingBuyOrders(sellOrder) {
        const orderBook = await this.orderBook.getOrderBook(sellOrder.symbol);
        return orderBook.bids
            .filter(order => order.price >= sellOrder.price)
            .sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    }

    async executeMatchedOrders(buyOrder, sellOrders) {
        let remainingQuantity = buyOrder.quantity;
        const trades = [];

        for (const sellOrder of sellOrders) {
            if (remainingQuantity <= 0) break;

            const tradeQuantity = Math.min(remainingQuantity, sellOrder.remainingQuantity);
            const tradePrice = sellOrder.price;

            const trade = await this.orderMatcher.executeTrade({
                buyOrder,
                sellOrder,
                quantity: tradeQuantity,
                price: tradePrice
            });

            trades.push(trade);
            remainingQuantity -= tradeQuantity;
        }

        return {
            orderId: buyOrder.orderId,
            status: 'filled',
            trades
        };
    }

    async executeSystemBuy(buyOrder) {
        // Verify balance
        const balance = await getBalance(buyOrder.userId);
        const totalWithFees = buyOrder.totalWithFees;

        if (balance < totalWithFees) {
            throw new Error(`Không đủ tiền! Cần ${totalWithFees.toLocaleString('vi-VN')} Xu`);
        }

        // Execute system trade
        await updateBalance(buyOrder.userId, -totalWithFees);

        return {
            orderId: buyOrder.orderId,
            status: 'filled',
            trades: [{
                quantity: buyOrder.quantity,
                price: buyOrder.price,
                seller: 'SYSTEM'
            }]
        };
    }
}

module.exports = OrderProcessor;
