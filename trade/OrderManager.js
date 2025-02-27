const EventEmitter = require('events');

class OrderQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async enqueue(task) {
        this.queue.push(task);
        if (!this.processing) {
            await this.processQueue();
        }
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        
        while (this.queue.length > 0) {
            const task = this.queue[0];
            try {
                await task();
            } catch (error) {
                console.error('Error processing order:', error);
            }
            this.queue.shift();
        }
        
        this.processing = false;
    }
}

class OrderManager extends EventEmitter {
    constructor(orderBook) {
        super();
        this.orderBook = orderBook;
        this.queue = new OrderQueue();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.orderBook.on('trade', async (trade) => {
            try {
    
                this.validateTrade(trade);

                console.log(`Processing trade: ${trade.symbol}`);
                console.log(`Buyer: ${trade.buyerId}, Seller: ${trade.sellerId}`);
                console.log(`Quantity: ${trade.quantity}, Price: ${trade.price}`);

                this.emit('trade', trade);

                this.notifyTradeParticipants(trade);
            } catch (error) {
                console.error('Error processing trade:', error);
                throw error; 
            }
        });

        this.orderBook.on('orderFilled', (fill) => {
            try {
                if (!fill.orderId || !fill.userId || !fill.symbol) {
                    throw new Error('Invalid fill data');
                }

                console.log(`Order filled: ${fill.orderId}`);
                console.log(`User: ${fill.userId}, Symbol: ${fill.symbol}`);
                console.log(`Fill quantity: ${fill.fillQuantity}`);

                this.emit('orderFilled', fill);
            } catch (error) {
                console.error('Error processing fill:', error);
            }
        });

        this.orderBook.on('orderCancelled', (order) => {
            try {
                if (!order.orderId || !order.userId) {
                    throw new Error('Invalid cancelled order data');
                }

                console.log(`Order cancelled: ${order.orderId}`);
                this.emit('orderCancelled', order);
            } catch (error) {
                console.error('Error processing cancellation:', error);
            }
        });
    }

    validateTrade(trade) {
        if (!trade.symbol) throw new Error('Trade symbol is required');
        if (!trade.buyerId) throw new Error('Buyer ID is required');
        if (!trade.sellerId) throw new Error('Seller ID is required');
        if (!trade.quantity || trade.quantity <= 0) throw new Error('Invalid trade quantity');
        if (!trade.price || trade.price <= 0) throw new Error('Invalid trade price');
        if (!trade.timestamp) throw new Error('Trade timestamp is required');
    }

    notifyTradeParticipants(trade) {
 
        this.emit('tradeNotification', {
            userId: trade.buyerId,
            type: 'buy',
            symbol: trade.symbol,
            quantity: trade.quantity,
            price: trade.price,
            timestamp: trade.timestamp
        });

        this.emit('tradeNotification', {
            userId: trade.sellerId,
            type: 'sell', 
            symbol: trade.symbol,
            quantity: trade.quantity,
            price: trade.price,
            timestamp: trade.timestamp
        });
    }

    async placeOrder(order) {
        return new Promise((resolve, reject) => {
            this.queue.enqueue(async () => {
                try {
                    this.validateOrder(order);

                    const result = await this.orderBook.addOrder(order);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async cancelOrder(orderId, userId) {
        return new Promise((resolve, reject) => {
            this.queue.enqueue(async () => {
                try {
                    const order = this.orderBook.orders.get(orderId);
                    if (!order) {
                        console.log(`Order ${orderId} not found - skipping cancellation`);
                        resolve();
                        return;
                    }

                    if (userId && order.userId !== userId) {
                        reject(new Error('Unauthorized to cancel order'));
                        return;
                    }

                    const result = await this.orderBook.cancelOrder(orderId);
                    resolve(result);
                } catch (error) {
                    console.error(`Error cancelling order ${orderId}:`, error);
     
                    if (!userId) {
                        resolve();
                    } else {
                        reject(error);
                    }
                }
            });
        });
    }

    validateOrder(order) {
        if (!order.symbol) throw new Error('Symbol is required');
        if (!order.side || !['buy', 'sell'].includes(order.side)) {
            throw new Error('Invalid order side');
        }
        if (!order.quantity || order.quantity <= 0) {
            throw new Error('Invalid quantity');
        }
        if (!order.price || order.price <= 0) {
            throw new Error('Invalid price');
        }
        if (!order.userId) throw new Error('User ID is required');
    }

    getOrderBookSnapshot(symbol) {
        return this.orderBook.getOrderBook(symbol);
    }

    getUserOrders(userId, symbol = null) {
        return this.orderBook.getUserOrders(userId, symbol);
    }

    async rollbackOrder(order) {
        return new Promise((resolve) => {
            this.queue.enqueue(async () => {
                try {
               
                    if (order.orderId) {
                        await this.cancelOrder(order.orderId);
                    }

                    this.emit('orderRollback', {
                        orderId: order.orderId,
                        userId: order.userId,
                        symbol: order.symbol,
                        reason: 'Order processing failed'
                    });

                    console.log(`Order ${order.orderId} rolled back successfully`);
                } catch (error) {
                    console.error(`Error rolling back order ${order.orderId}:`, error);
                } finally {
                    resolve();
                }
            });
        });
    }

    notifyOrderUpdate(update) {
        this.emit('orderUpdate', update);
    }

    getOrderStatus(orderId) {
        const order = this.orderBook.orders.get(orderId);
        if (!order) throw new Error('Order not found');
        
        return {
            orderId: order.orderId,
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            filledQuantity: order.filledQuantity,
            remainingQuantity: order.remainingQuantity,
            price: order.price,
            status: order.status,
            fills: order.fills,
            timestamp: order.timestamp
        };
    }

    // Get order history for a user
    getUserOrderHistory(userId, symbol = null) {
        return Array.from(this.orderBook.orders.values())
            .filter(order => order.userId === userId)
            .filter(order => !symbol || order.symbol === symbol)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
}

module.exports = OrderManager;
