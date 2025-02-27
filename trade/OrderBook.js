const EventEmitter = require('events');

class OrderBook extends EventEmitter {
    constructor() {
        super();
        this.books = {}; // Separate order book per symbol
        this.orders = new Map(); // All orders across symbols
    }

    // Initialize order book for a symbol if it doesn't exist
    initializeBook(symbol) {
        if (!this.books[symbol]) {
            this.books[symbol] = {
                bids: [], // Buy orders sorted by price (high to low)
                asks: [], // Sell orders sorted by price (low to high)
                lastTradePrice: null
            };
        }
    }

    // Add order to the book
    async addOrder(order) {
        this.initializeBook(order.symbol);
        order.remainingQuantity = order.quantity;
        order.filledQuantity = 0;
        order.status = 'open';
        order.fills = [];
        
        const originalState = { ...order };
        
        try {
            this.orders.set(order.orderId, order);
            
            const book = this.books[order.symbol];
            const side = order.side === 'buy' ? 'bids' : 'asks';
            
            const orders = book[side];
            const index = this.findInsertIndex(orders, order);
            orders.splice(index, 0, order);
            
            this.emit('orderAdded', order);
            
            await this.tryMatch(order.symbol);
            
            return order;
        } catch (error) {
         
            this.orders.delete(order.orderId);
            Object.assign(order, originalState);
            throw error;
        }
    }

    findInsertIndex(orders, newOrder) {
        const isBuy = newOrder.side === 'buy';
        
        return orders.findIndex(existingOrder => {
            if (isBuy) {
                // For buy orders: higher price first, then earlier timestamp
                if (existingOrder.price < newOrder.price) return true;
                if (existingOrder.price === newOrder.price) {
                    return existingOrder.timestamp > newOrder.timestamp;
                }
            } else {
                // For sell orders: lower price first, then earlier timestamp
                if (existingOrder.price > newOrder.price) return true;
                if (existingOrder.price === newOrder.price) {
                    return existingOrder.timestamp > newOrder.timestamp;
                }
            }
            return false;
        });
    }

    // Match orders for a symbol
    async tryMatch(symbol) {
        const book = this.books[symbol];
        if (!book) return;

        while (book.bids.length > 0 && book.asks.length > 0) {
            const bestBid = book.bids[0];
            const bestAsk = book.asks[0];

            if (bestBid.price >= bestAsk.price) {
                // Match found - execute trade
                const matchQuantity = Math.min(
                    bestBid.remainingQuantity,
                    bestAsk.remainingQuantity
                );

                const price = bestAsk.timestamp < bestBid.timestamp ? 
                    bestAsk.price : bestBid.price;

                await this.executeTrade({
                    buyOrder: bestBid,
                    sellOrder: bestAsk,
                    quantity: matchQuantity,
                    price: price,
                    symbol: symbol
                });

                // Remove filled orders
                if (bestBid.remainingQuantity === 0) book.bids.shift();
                if (bestAsk.remainingQuantity === 0) book.asks.shift();
            } else {
                break; // No more matches possible
            }
        }
    }

    // Execute a trade between two orders
    async executeTrade(trade) {
        const { buyOrder, sellOrder, quantity, price, symbol } = trade;
        const timestamp = Date.now();

        // Save original states for rollback
        const originalStates = {
            buy: {
                remainingQuantity: buyOrder.remainingQuantity,
                filledQuantity: buyOrder.filledQuantity,
                status: buyOrder.status,
                fills: [...buyOrder.fills]
            },
            sell: {
                remainingQuantity: sellOrder.remainingQuantity,
                filledQuantity: sellOrder.filledQuantity,
                status: sellOrder.status,
                fills: [...sellOrder.fills]
            }
        };

        try {
            // Update orders
            buyOrder.remainingQuantity -= quantity;
            buyOrder.filledQuantity += quantity;
            sellOrder.remainingQuantity -= quantity;
            sellOrder.filledQuantity += quantity;

            const fill = {
                quantity,
                price,
                timestamp
            };

            buyOrder.fills.push(fill);
            sellOrder.fills.push(fill);

            // Update order status
            for (const order of [buyOrder, sellOrder]) {
                if (order.remainingQuantity === 0) {
                    order.status = 'filled';
                } else {
                    order.status = 'partially_filled';
                }
            }

            // Update last trade price
            this.books[symbol].lastTradePrice = price;

            // Create trade event
            const tradeEvent = {
                symbol,
                price,
                quantity,
                buyerId: buyOrder.userId,
                sellerId: sellOrder.userId,
                buyOrderId: buyOrder.orderId,
                sellOrderId: sellOrder.orderId,
                timestamp,
                orderType: {
                    buy: buyOrder.type || 'market',
                    sell: sellOrder.type || 'market'
                }
            };

            // Log trade details
            console.log(`Trade executed: ${symbol}`);
            console.log(`Price: ${price}, Quantity: ${quantity}`);
            console.log(`Buyer: ${buyOrder.userId}, Seller: ${sellOrder.userId}`);

            // Emit events in correct order
            try {
                // First emit match event for portfolio updates
                this.emit('match', tradeEvent);

                // Then emit trade event
                this.emit('trade', tradeEvent);

                // Finally emit fill notifications
                const buyFill = {
                    orderId: buyOrder.orderId,
                    userId: buyOrder.userId,
                    symbol,
                    side: 'buy',
                    fillQuantity: quantity,
                    remainingQuantity: buyOrder.remainingQuantity,
                    price,
                    timestamp
                };

                const sellFill = {
                    orderId: sellOrder.orderId,
                    userId: sellOrder.userId,
                    symbol,
                    side: 'sell',
                    fillQuantity: quantity,
                    remainingQuantity: sellOrder.remainingQuantity,
                    price,
                    timestamp
                };

                this.emit('orderFilled', buyFill);
                this.emit('orderFilled', sellFill);

                return {
                    tradeEvent,
                    buyFill,
                    sellFill
                };

            } catch (error) {
                // Rollback on event emission error
                this.rollbackTrade(buyOrder, sellOrder, originalStates);
                throw error;
            }

        } catch (error) {
            console.error('Error executing trade:', error);
            // Rollback on execution error
            this.rollbackTrade(buyOrder, sellOrder, originalStates);
            throw error;
        }
    }

    // Rollback a trade to its original state
    rollbackTrade(buyOrder, sellOrder, originalStates) {
        console.log('Rolling back trade...');

        // Restore buy order
        buyOrder.remainingQuantity = originalStates.buy.remainingQuantity;
        buyOrder.filledQuantity = originalStates.buy.filledQuantity;
        buyOrder.status = originalStates.buy.status;
        buyOrder.fills = [...originalStates.buy.fills];

        // Restore sell order
        sellOrder.remainingQuantity = originalStates.sell.remainingQuantity;
        sellOrder.filledQuantity = originalStates.sell.filledQuantity;
        sellOrder.status = originalStates.sell.status;
        sellOrder.fills = [...originalStates.sell.fills];

        console.log('Trade rollback complete');
    }

    cancelOrder(orderId) {
        const order = this.orders.get(orderId);
        if (!order) {
            console.log(`Order ${orderId} not found in OrderBook`);
            return null;
        }

        if (order.status !== 'open' && order.status !== 'partially_filled') {
            console.log(`Order ${orderId} cannot be cancelled - status: ${order.status}`);
            return null;
        }

        try {
            const book = this.books[order.symbol];
            const side = order.side === 'buy' ? 'bids' : 'asks';
            
            const index = book[side].findIndex(o => o.orderId === orderId);
            if (index !== -1) {
                book[side].splice(index, 1);
            }

            order.status = 'cancelled';
            this.emit('orderCancelled', order);
            
            console.log(`Order ${orderId} cancelled successfully`);
            return order;
        } catch (error) {
            console.error(`Error cancelling order ${orderId}:`, error);
            return null;
        }
    }

    aggregateOrdersByPrice(orders) {
        const aggregated = new Map();
        
        for (const order of orders) {
            const price = order.price;
            if (!aggregated.has(price)) {
                aggregated.set(price, {
                    price,
                    totalQuantity: 0,
                    orderCount: 0,
                    orders: []
                });
            }
            
            const level = aggregated.get(price);
            level.totalQuantity += order.remainingQuantity;
            level.orderCount++;
            level.orders.push({
                quantity: order.remainingQuantity,
                timestamp: order.timestamp
            });
        }
        
        return Array.from(aggregated.values());
    }

    // Get order book depth for a symbol
    getOrderBook(symbol) {
        this.initializeBook(symbol);
        const book = this.books[symbol];
        
        const aggregatedBids = this.aggregateOrdersByPrice(book.bids);
        const aggregatedAsks = this.aggregateOrdersByPrice(book.asks);
        
        return {
            bids: aggregatedBids,
            asks: aggregatedAsks,
            lastTradePrice: book.lastTradePrice,
            spread: book.asks.length > 0 && book.bids.length > 0 ? 
                book.asks[0].price - book.bids[0].price : null,
            timestamp: Date.now()
        };
    }

    // Get user's open orders
    getUserOrders(userId, symbol = null) {
        const userOrders = Array.from(this.orders.values())
            .filter(order => order.userId === userId)
            .filter(order => order.status === 'open' || order.status === 'partially_filled');

        if (symbol) {
            return userOrders.filter(order => order.symbol === symbol);
        }
        
        return userOrders;
    }
}

module.exports = OrderBook;
