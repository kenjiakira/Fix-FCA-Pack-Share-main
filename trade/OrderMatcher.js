const EventEmitter = require('events');

class OrderMatcher {
    constructor(orderBook) {
        this.orderBook = orderBook;
    }

    // Match orders based on price-time-size priority
    async matchOrders(symbol) {
        const book = this.orderBook.books[symbol];
        if (!book) return [];

        const matches = [];
        let matchFound = true;

        while (matchFound && book.bids.length > 0 && book.asks.length > 0) {
            matchFound = false;
            const bestBid = book.bids[0];
            const bestAsk = book.asks[0];

            // Check if orders can be matched
            if (bestBid.price >= bestAsk.price) {
                // Determine execution price (price-time priority)
                const executionPrice = bestAsk.timestamp < bestBid.timestamp ? 
                    bestAsk.price : bestBid.price;

                // Determine match quantity (size priority)
                const matchQuantity = this.determineMatchQuantity(bestBid, bestAsk);

                if (matchQuantity > 0) {
                    matches.push({
                        buyOrder: bestBid,
                        sellOrder: bestAsk,
                        price: executionPrice,
                        quantity: matchQuantity
                    });

                    // Update remaining quantities
                    bestBid.remainingQuantity -= matchQuantity;
                    bestAsk.remainingQuantity -= matchQuantity;

                    // Remove filled orders
                    if (bestBid.remainingQuantity === 0) book.bids.shift();
                    if (bestAsk.remainingQuantity === 0) book.asks.shift();

                    matchFound = true;
                }
            }
        }

        return matches;
    }

    // Execute matches with rollback support
    async executeMatches(matches) {
        const results = [];
        const originalStates = new Map();

        try {
            for (const match of matches) {
                const { buyOrder, sellOrder, price, quantity } = match;

                // Save original states for rollback
                originalStates.set(buyOrder.orderId, {
                    remainingQuantity: buyOrder.remainingQuantity,
                    filledQuantity: buyOrder.filledQuantity,
                    status: buyOrder.status
                });
                originalStates.set(sellOrder.orderId, {
                    remainingQuantity: sellOrder.remainingQuantity,
                    filledQuantity: sellOrder.filledQuantity,
                    status: sellOrder.status
                });

                try {
                    // Process fills for both orders
                    const buyFill = await this.processPartialFill(buyOrder, quantity, price);
                    const sellFill = await this.processPartialFill(sellOrder, quantity, price);

                    // Log match details
                    console.log(`Executing match: ${buyOrder.symbol}`);
                    console.log(`Buy Order: ${buyOrder.orderId}, Sell Order: ${sellOrder.orderId}`);
                    console.log(`Quantity: ${quantity}, Price: ${price}`);

                    const result = {
                        buyOrderId: buyOrder.orderId,
                        sellOrderId: sellOrder.orderId,
                        price,
                        quantity,
                        buyFill,
                        sellFill,
                        timestamp: Date.now(),
                        symbol: buyOrder.symbol
                    };

                    results.push(result);

                    // Emit match event for portfolio updates
                    this.orderBook.emit('match', result);

                } catch (error) {
                    console.error('Error processing match:', error);
                    // Rollback this match
                    this.rollbackOrder(buyOrder, originalStates.get(buyOrder.orderId));
                    this.rollbackOrder(sellOrder, originalStates.get(sellOrder.orderId));
                    throw error;
                }
            }

            return results;

        } catch (error) {
            console.error('Error executing matches:', error);
            // Rollback all matches
            for (const [orderId, originalState] of originalStates) {
                const order = this.orderBook.orders.get(orderId);
                if (order) {
                    this.rollbackOrder(order, originalState);
                }
            }
            throw error;
        }
    }

    // Rollback an order to its original state
    rollbackOrder(order, originalState) {
        order.remainingQuantity = originalState.remainingQuantity;
        order.filledQuantity = originalState.filledQuantity;
        order.status = originalState.status;
        console.log(`Rolled back order ${order.orderId} to original state`);
    }

    // Process partial fills
    async processPartialFill(order, matchQuantity, matchPrice) {
        const fill = {
            quantity: matchQuantity,
            price: matchPrice,
            timestamp: Date.now()
        };

        if (!order.fills) order.fills = [];
        order.fills.push(fill);

        order.filledQuantity = (order.filledQuantity || 0) + matchQuantity;
        order.remainingQuantity -= matchQuantity;

        // Update order status
        if (order.remainingQuantity === 0) {
            order.status = 'filled';
        } else {
            order.status = 'partially_filled';
        }

        // Log fill details
        console.log(`Processed fill for order ${order.orderId}`);
        console.log(`Quantity: ${matchQuantity}, Price: ${matchPrice}`);
        console.log(`Remaining: ${order.remainingQuantity}, Filled: ${order.filledQuantity}`);

        return fill;
    }

    // Determine match quantity based on order sizes
    determineMatchQuantity(buyOrder, sellOrder) {
        // Basic quantity match
        const baseQuantity = Math.min(
            buyOrder.remainingQuantity,
            sellOrder.remainingQuantity
        );

        // Apply size priority rules
        if (buyOrder.quantity >= sellOrder.quantity) {
            // Prefer to fill larger orders first
            return baseQuantity;
        } else {
            // For smaller orders, try to match exact quantities
            return Math.min(baseQuantity, buyOrder.quantity);
        }
    }

    // Check if orders can be matched
    canMatch(buyOrder, sellOrder) {
        return (
            buyOrder.price >= sellOrder.price &&
            buyOrder.remainingQuantity > 0 &&
            sellOrder.remainingQuantity > 0 &&
            buyOrder.symbol === sellOrder.symbol
        );
    }

    // Calculate fill price based on price-time priority
    calculateFillPrice(buyOrder, sellOrder) {
        // Price-time priority: earlier order sets the price
        return buyOrder.timestamp < sellOrder.timestamp ? 
            buyOrder.price : sellOrder.price;
    }

    // Get potential matches for an order
    getPotentialMatches(order) {
        const book = this.orderBook.books[order.symbol];
        if (!book) return [];

        const oppositeSide = order.side === 'buy' ? 'asks' : 'bids';
        return book[oppositeSide].filter(o => this.canMatch(
            order.side === 'buy' ? order : o,
            order.side === 'buy' ? o : order
        ));
    }

    // Find best execution path for an order
    findBestExecution(order) {
        const potentialMatches = this.getPotentialMatches(order);
        if (potentialMatches.length === 0) return null;

        // Sort matches by price and time priority
        potentialMatches.sort((a, b) => {
            if (order.side === 'buy') {
                // For buy orders: lowest price first
                if (a.price !== b.price) return a.price - b.price;
            } else {
                // For sell orders: highest price first
                if (a.price !== b.price) return b.price - a.price;
            }
            // Then by time priority
            return a.timestamp - b.timestamp;
        });

        return this.calculateOptimalMatchSize(order, potentialMatches);
    }

    // Calculate optimal match size
    calculateOptimalMatchSize(order, potentialMatches) {
        let remainingQuantity = order.quantity;
        const matches = [];

        for (const match of potentialMatches) {
            if (remainingQuantity <= 0) break;

            const matchQuantity = Math.min(
                remainingQuantity,
                match.remainingQuantity
            );

            if (matchQuantity > 0) {
                matches.push({
                    order: match,
                    quantity: matchQuantity,
                    price: this.calculateFillPrice(
                        order.side === 'buy' ? order : match,
                        order.side === 'buy' ? match : order
                    )
                });
                remainingQuantity -= matchQuantity;
            }
        }

        return matches;
    }
}

module.exports = OrderMatcher;
