const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Colors for portfolio visualization
const COLORS = {
  profitable: '#4ade80',     // Green for profits
  loss: '#f87171',           // Red for losses
  border: '#475569',         // Border color
  background: '#0f172a',     // Dark background
  cardBg: '#1e293b',         // Card background
  text: '#f8fafc',           // Main text
  subtext: '#cbd5e1',        // Secondary text
  accent: '#60a5fa',         // Accent color
  header: '#334155',         // Header background
  chartLine: '#38bdf8',      // Chart line color
  chartFill: 'rgba(56, 189, 248, 0.2)', // Chart fill color
  up: '#22c55e',             // Up trend
  down: '#ef4444',           // Down trend
  stable: '#3b82f6'          // Stable trend
};

/**
 * Creates a portfolio overview visualization
 * @param {Object} userData - User's portfolio and trading data
 * @param {Object} marketData - Current market data with stocks
 * @returns {Promise<string>} Path to the generated image
 */
async function createPortfolioCheckCanvas(userData, marketData, userName = "Investor") {
  // Calculate portfolio metrics
  const portfolioMetrics = calculatePortfolioMetrics(userData, marketData);
  const { holdings, totalValue, totalProfit, profitPercent, isEmpty } = portfolioMetrics;
  
  // Canvas dimensions
  const width = 1100;
  const headerHeight = 100;
  const summaryHeight = 120;
  
  // Calculate height based on the number of holdings
  const holdingsPerRow = 2;
  const holdingHeight = 260;
  const holdingRows = Math.ceil(holdings.length / holdingsPerRow);
  const holdingsHeight = isEmpty ? 200 : holdingRows * holdingHeight;
  
  // Total height
  const height = headerHeight + summaryHeight + holdingsHeight + 60;
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
  
  // Draw header
  drawHeader(ctx, width, headerHeight, userName);
  
  // Draw portfolio summary
  drawPortfolioSummary(ctx, width, headerHeight, summaryHeight, portfolioMetrics);
  
  // Draw holdings or empty state
  if (isEmpty) {
    drawEmptyPortfolio(ctx, width, headerHeight + summaryHeight, 200);
  } else {
    drawHoldings(ctx, holdings, width, headerHeight + summaryHeight, holdingsHeight);
  }
  
  // Save the canvas to an image file
  const tempDir = path.join(__dirname, '../../commands/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, `portfolio_${Date.now()}.png`);
  const out = fs.createWriteStream(filePath);
  const stream = canvas.createPNGStream();

  return new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on('finish', () => resolve(filePath));
    out.on('error', reject);
  });
}

/**
 * Calculate metrics for the portfolio
 */
function calculatePortfolioMetrics(userData, marketData) {
  if (!userData.portfolio || Object.keys(userData.portfolio).length === 0) {
    return {
      holdings: [],
      totalValue: 0,
      totalProfit: 0,
      profitPercent: 0,
      cash: userData.cash || 0,
      isEmpty: true
    };
  }

  let totalValue = 0;
  let totalInvested = 0;
  const holdings = [];

  // Process each holding
  for (const [symbol, holding] of Object.entries(userData.portfolio)) {
    const stock = marketData.stocks[symbol];
    if (!stock || holding.shares <= 0) continue;
    
    const currentValue = stock.price * holding.shares;
    const profit = currentValue - holding.totalInvested;
    const profitPercent = (profit / holding.totalInvested) * 100;
    
    totalValue += currentValue;
    totalInvested += holding.totalInvested;
    
    // Add to holdings array
    holdings.push({
      symbol,
      name: stock.name || symbol,
      shares: holding.shares,
      currentPrice: stock.price,
      avgBuyPrice: holding.avgBuyPrice,
      currentValue,
      profit,
      profitPercent,
      trend: stock.trend,
      sector: stock.sector,
      // Add history if available for mini-charts
      history: stock.history || []
    });
  }
  
  // Sort by value (descending)
  holdings.sort((a, b) => b.currentValue - a.currentValue);
  
  const totalProfit = totalValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  
  return {
    holdings,
    totalValue,
    totalInvested,
    totalProfit,
    profitPercent,
    cash: userData.cash || 0,
    isEmpty: holdings.length === 0
  };
}

/**
 * Draw the header section
 */
function drawHeader(ctx, width, height, userName) {
  // Background
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, width, height);
  
  // Gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // User name and title
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 32px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(`${userName}'s Portfolio`, 40, 55);
  
  // Current date
  const now = new Date();
  ctx.font = '16px BeVietnamPro';
  ctx.textAlign = 'right';
  ctx.fillText(`cập nhật lần cuối: ${now.toLocaleString()}`, width - 40, 55);
}

/**
 * Draw the portfolio summary section
 */
function drawPortfolioSummary(ctx, width, startY, height, metrics) {
  const y = startY;
  
  // Background with slight transparency
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.fillRect(0, y, width, height);
  
  // Draw total value
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText('Total Portfolio Value:', 40, y + 40);
  
  ctx.font = 'bold 30px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(`$${formatNumber(metrics.totalValue + metrics.cash)}`, 40, y + 80);
  
  // Draw cash balance
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(`tiền mặt: $${formatNumber(metrics.cash)}`, 300, y + 40);
  ctx.fillText(`đầu tư: $${formatNumber(metrics.totalValue)}`, 300, y + 70);
  
  // Draw profit/loss
  const profitColor = metrics.totalProfit >= 0 ? COLORS.profitable : COLORS.loss;
  ctx.fillStyle = profitColor;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'right';
  
  const profitSign = metrics.totalProfit >= 0 ? '+' : '';
  ctx.fillText(`${profitSign}$${formatNumber(metrics.totalProfit)} (${metrics.profitPercent.toFixed(2)}%)`, width - 40, y + 60);
  
  // Draw profit indicator
  const indicatorText = metrics.totalProfit >= 0 ? '▲ PROFIT' : '▼ LOSS';
  ctx.fillText(indicatorText, width - 40, y + 30);
}

/**
 * Draw empty portfolio state
 */
function drawEmptyPortfolio(ctx, width, startY, height) {
  const y = startY;
  
  // Semi-transparent background
  ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
  ctx.fillRect(0, y, width, height);
  
  // Draw empty state message
  ctx.fillStyle = COLORS.subtext;
  ctx.font = '24px BeVietnamPro';
  ctx.textAlign = 'center';
  ctx.fillText('No stocks in portfolio', width / 2, y + 80);
  
  ctx.font = '18px BeVietnamPro';
  ctx.fillText('Sử dụng ".trade buy [symbol] [quantity]" để bắt đầu đầu tư', width / 2, y + 120);
}

/**
 * Draw stock holdings
 */
function drawHoldings(ctx, holdings, width, startY, height) {
  const y = startY;
  const holdingsPerRow = 2;
  const cardWidth = width / holdingsPerRow;
  const cardHeight = 260;
  const padding = 15;
  
  holdings.forEach((holding, index) => {
    const row = Math.floor(index / holdingsPerRow);
    const col = index % holdingsPerRow;
    
    const cardX = col * cardWidth + padding;
    const cardY = y + row * cardHeight + padding;
    const cardW = cardWidth - (padding * 2);
    const cardH = cardHeight - (padding * 2);
    
    drawHoldingCard(ctx, holding, cardX, cardY, cardW, cardH);
  });
}

/**
 * Draw individual stock holding card
 */
function drawHoldingCard(ctx, holding, x, y, width, height) {
  // Card background
  ctx.fillStyle = COLORS.cardBg;
  ctx.fillRect(x, y, width, height);
  
  // Add a colored border based on profit/loss
  const borderColor = holding.profit >= 0 ? COLORS.profitable : COLORS.loss;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
  
  // Stock symbol and name
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(holding.symbol, x + 20, y + 35);
  
  ctx.font = '16px BeVietnamPro';
  ctx.fillText(holding.name, x + 20, y + 60);
  
  // Current price and shares
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px BeVietnamPro';
  ctx.fillText(`$${formatNumber(holding.currentPrice)}`, x + 20, y + 95);
  
  ctx.font = '16px BeVietnamPro';
  ctx.fillText(`${holding.shares} cổ phiếu`, x + 20, y + 120);
  
  // Average cost
  ctx.fillStyle = COLORS.subtext;
  ctx.font = '16px BeVietnamPro';
  ctx.fillText(`Chi phí trung bình: $${formatNumber(holding.avgBuyPrice)}`, x + 20, y + 145);
  
  // Current value
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 18px BeVietnamPro';
  ctx.fillText(`Giá trị: $${formatNumber(holding.currentValue)}`, x + 20, y + 175);
  
  // Profit/loss
  const profitColor = holding.profit >= 0 ? COLORS.profitable : COLORS.loss;
  ctx.fillStyle = profitColor;
  ctx.font = 'bold 18px BeVietnamPro';
  
  const profitSign = holding.profit >= 0 ? '+' : '';
  ctx.fillText(`${profitSign}$${formatNumber(holding.profit)} (${holding.profitPercent.toFixed(2)}%)`, x + 20, y + 205);
  
  // Draw trend indicator
  const trendIcon = holding.trend === 'up' ? '📈' : 
                   holding.trend === 'down' ? '📉' : '📊';
  const trendColor = holding.trend === 'up' ? COLORS.up : 
                    holding.trend === 'down' ? COLORS.down : 
                    COLORS.stable;
                    
  ctx.fillStyle = trendColor;
  ctx.font = '16px BeVietnamPro';
  ctx.textAlign = 'right';
  ctx.fillText(`${trendIcon} ${holding.trend.toUpperCase()}`, x + width - 20, y + 35);
  
  ctx.fillStyle = COLORS.subtext;
  ctx.fillText(holding.sector || 'N/A', x + width - 20, y + 60);
  
  // Draw mini chart if we have history
  if (holding.history && holding.history.length > 1) {
    const chartX = x + width - 180;
    const chartY = y + 90;
    const chartWidth = 160;
    const chartHeight = 80;
    
    drawMiniChart(
      ctx, 
      holding.history, 
      chartX, 
      chartY, 
      chartWidth, 
      chartHeight, 
      holding.profit >= 0 ? COLORS.profitable : COLORS.loss
    );
  }
}

/**
 * Draw mini chart for stock price history
 */
function drawMiniChart(ctx, history, x, y, width, height, color) {
  if (history.length < 2) return;
  
  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const range = maxPrice - minPrice || 1; // Avoid division by zero
  
  // Draw chart outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  
  // Draw price line
  ctx.beginPath();
  history.forEach((point, i) => {
    const pointX = x + (i / (history.length - 1)) * width;
    const pointY = y + height - ((point.price - minPrice) / range) * height;
    
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  });
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Fill area under line
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  
  // Semi-transparent fill
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, `${color}30`); // 19% opacity
  gradient.addColorStop(1, `${color}05`); // 2% opacity
  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Format numbers for display
 */
function formatNumber(number) {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

module.exports = { createPortfolioCheckCanvas };