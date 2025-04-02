const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const Chart = require('chart.js/auto');

// Register fonts
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Bold.ttf'), { family: 'BeVietnam Bold' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Medium.ttf'), { family: 'BeVietnam Medium' });
registerFont(path.join(__dirname, '../../fonts/BeVietnamPro-Regular.ttf'), { family: 'BeVietnam' });

/**
 * Helper function to format numbers with commas
 */
function formatNumber(num, decimals = 0) {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Create a stream from buffer
 */
async function bufferToStream(buffer) {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `market_${Date.now()}.png`);
  
  fs.writeFileSync(tempFilePath, buffer);
  
  const stream = fs.createReadStream(tempFilePath);
  
  stream.on('end', () => {
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error('Error cleaning up temp file:', err);
    }
  });
  
  return stream;
}

/**
 * Create market canvas
 */
async function createMarketCanvas(data) {
  // Canvas dimensions
  const width = 1200;
  const height = 1600;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f2027');
  gradient.addColorStop(0.5, '#203a43');
  gradient.addColorStop(1, '#2c5364');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle pattern
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 2 + 1;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 80 + 40;
    const opacity = Math.random() * 0.03 + 0.01;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
    ctx.fill();
  }
  
  ctx.globalAlpha = 1;
  
  // Draw header
  drawHeader(ctx, width, data.trend);
  
  // Draw price card
  drawPriceCard(ctx, 50, 180, 1100, 300, data);
  
  // Draw market metrics
  drawMarketMetrics(ctx, 50, 520, 1100, 280, data);
  
  // Draw user portfolio
  drawUserPortfolio(ctx, 50, 840, 1100, 380, data);
  
  // Draw historical chart
  if (data.priceHistory && data.priceHistory.length > 1) {
    await drawPriceChart(ctx, 50, 1260, 1100, 300, data.priceHistory);
  }
  
  // Draw footer
  drawFooter(ctx, width, height);
  
  return canvas.toBuffer();
}

/**
 * Draw header section
 */
function drawHeader(ctx, width, trend) {
  // Header background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, 140, [0, 0, 20, 20]);
  ctx.fill();
  
  // Logo and title
  ctx.font = '60px "BeVietnam Bold"';
  
  // Add glow effect
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText('MAINNET', width / 2, 70);
  
  ctx.shadowBlur = 0;
  ctx.font = '36px "BeVietnam Medium"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CRYPTO MARKET', width / 2, 110);
  
  // Add trend icon
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '📊';
  ctx.font = '50px Arial';
  ctx.fillText(trendIcon, width - 80, 75);
  
  // Add left side icon
  ctx.font = '50px Arial';
  ctx.fillText('💎', 80, 75);
  
  // Add decorative line
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, 130);
  ctx.lineTo(width * 0.8, 130);
  ctx.stroke();
}

/**
 * Draw price card section
 */
function drawPriceCard(ctx, x, y, width, height, data) {
  // Card background with glass effect
  const cardGradient = ctx.createLinearGradient(x, y, x, y + height);
  cardGradient.addColorStop(0, 'rgba(20, 33, 61, 0.9)');
  cardGradient.addColorStop(1, 'rgba(15, 52, 96, 0.9)');
  
  ctx.fillStyle = cardGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  
  // Card border
  ctx.strokeStyle = '#7db1f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.stroke();
  
  // Card shine effect
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, width - 20, height / 4, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Current price
  ctx.font = '28px "BeVietnam Medium"';
  ctx.fillStyle = '#7db1f0';
  ctx.textAlign = 'left';
  ctx.fillText('Giá hiện tại', x + 40, y + 50);
  
  ctx.font = '60px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${formatNumber(data.price || 0, 2)} $`, x + 40, y + 120);
  
  // MC symbol
  ctx.font = '60px "BeVietnam Bold"';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.fillText('MC', x + width - 40, y + 120);
  
  // Price change
  const changeColor = data.changePercent >= 0 ? '#4ecca3' : '#e94560';
  const changeSymbol = data.changePercent >= 0 ? '▲' : '▼';
  
  ctx.font = '28px "BeVietnam Bold"';
  ctx.fillStyle = changeColor;
  ctx.textAlign = 'left';
  ctx.fillText(
    `${changeSymbol} ${formatNumber(Math.abs(data.changePercent), 2)}%`, 
    x + 40, 
    y + 180
  );
  
  // 24h label
  ctx.font = '24px "BeVietnam Medium"';
  ctx.fillStyle = '#b0c4de';
  ctx.textAlign = 'left';
  ctx.fillText('24h', x + 240, y + 180);
  
  // Current time
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const dateStr = now.toLocaleDateString();
  
  ctx.font = '20px "BeVietnam"';
  ctx.fillStyle = '#b0c4de';
  ctx.textAlign = 'right';
  ctx.fillText(`Cập nhật lần cuối: ${timeStr} - ${dateStr}`, x + width - 40, y + 180);
  
  // Price history indicators
  const priceHistoryX = x + 40;
  const priceHistoryY = y + 240;
  const indicatorWidth = (width - 80) / 7;
  
  ctx.font = '18px "BeVietnam Medium"';
  ctx.fillStyle = '#b0c4de';
  ctx.textAlign = 'left';
  ctx.fillText('7-Day Price Trend:', priceHistoryX, priceHistoryY);
  
  if (data.priceHistory && data.priceHistory.length > 1) {
    const history = data.priceHistory.slice(0, 7).reverse();
    const maxPrice = Math.max(...history.map(h => h.price)) * 1.1;
    const minPrice = Math.min(...history.map(h => h.price)) * 0.9;
    const priceRange = maxPrice - minPrice;
    
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];
      
      if (!current || !next) continue;
      
      const startX = priceHistoryX + i * indicatorWidth;
      const startY = priceHistoryY + 40 - ((current.price - minPrice) / priceRange * 40);
      const endX = priceHistoryX + (i + 1) * indicatorWidth;
      const endY = priceHistoryY + 40 - ((next.price - minPrice) / priceRange * 40);
      
      const lineColor = next.price >= current.price ? '#4ecca3' : '#e94560';
      
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Draw point
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      if (i === history.length - 2) {
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Draw market metrics section
 */
function drawMarketMetrics(ctx, x, y, width, height, data) {
  // Section background
  const metricsGradient = ctx.createLinearGradient(x, y, x, y + height);
  metricsGradient.addColorStop(0, 'rgba(20, 33, 61, 0.9)');
  metricsGradient.addColorStop(1, 'rgba(15, 52, 96, 0.9)');
  
  ctx.fillStyle = metricsGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = '#7db1f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.stroke();
  
  // Section title
  ctx.font = '28px "BeVietnam Bold"';
  ctx.fillStyle = '#7db1f0';
  ctx.textAlign = 'left';
  ctx.fillText('SỐ LIỆU THỊ TRƯỜNG', x + 40, y + 50);
  
  // Separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 70);
  ctx.lineTo(x + width - 40, y + 70);
  ctx.stroke();
  
  // Supply and demand ratio
  const ratio = data.supply_demand_ratio || 1;
  let ratioDesc, ratioColor;
  
  if (ratio > 1.2) {
    ratioDesc = 'Cung cao/Cầu thấp';
    ratioColor = '#e94560';
  } else if (ratio > 0.8) {
    ratioDesc = 'Cung/Cầu cân bằng';
    ratioColor = '#ffd700';
  } else {
    ratioDesc = 'Cung thấp / Cầu cao';
    ratioColor = '#4ecca3';
  }
  
  // Draw ratio gauge
  const gaugeX = x + 200;
  const gaugeY = y + 140;
  const gaugeRadius = 80;
  
  // Gauge background
  ctx.beginPath();
  ctx.arc(gaugeX, gaugeY, gaugeRadius, Math.PI, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.stroke();
  
  // Gauge value
  const normalizedRatio = Math.max(0, Math.min(2, ratio)) / 2; // normalize to 0-1
  ctx.beginPath();
  ctx.arc(gaugeX, gaugeY, gaugeRadius, Math.PI, Math.PI * (1 + normalizedRatio));
  ctx.lineWidth = 10;
  ctx.strokeStyle = ratioColor;
  ctx.stroke();
  
  // Gauge label
  ctx.font = '22px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('Cung/Cầu', gaugeX, gaugeY - 30);
  
  ctx.font = '28px "BeVietnam Bold"';
  ctx.fillStyle = ratioColor;
  ctx.fillText(formatNumber(ratio, 2), gaugeX, gaugeY + 10);
  
  ctx.font = '18px "BeVietnam"';
  ctx.fillStyle = '#b0c4de';
  ctx.fillText(ratioDesc, gaugeX, gaugeY + 40);
  
  // Total supply
  ctx.font = '22px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('Tổng cung', gaugeX + 350, gaugeY - 30);
  
  ctx.font = '36px "BeVietnam Bold"';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(formatNumber(data.totalSupply || 0), gaugeX + 350, gaugeY + 10);
  
  ctx.font = '18px "BeVietnam"';
  ctx.fillStyle = '#b0c4de';
  ctx.fillText('MC', gaugeX + 350, gaugeY + 40);
  
  // Market sentiment
  ctx.font = '22px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('Tâm lý thị trường', gaugeX + 700, gaugeY - 30);
  
  // Sentiment icon and text
  let sentimentIcon, sentimentColor;
  const sentiment = data.sentiment || 0;
  
  if (sentiment > 0.5) {
    sentimentIcon = '🌟';
    sentimentColor = '#4ecca3';
  } else if (sentiment > 0.2) {
    sentimentIcon = '🔆';
    sentimentColor = '#ffd700';
  } else if (sentiment > -0.2) {
    sentimentIcon = '⚖️';
    sentimentColor = '#ffffff';
  } else if (sentiment > -0.5) {
    sentimentIcon = '🌧️';
    sentimentColor = '#7db1f0';
  } else {
    sentimentIcon = '⛈️';
    sentimentColor = '#e94560';
  }
  
  ctx.font = '40px "BeVietnam Bold"';
  ctx.fillText(sentimentIcon, gaugeX + 700, gaugeY + 10);
  
  ctx.font = '22px "BeVietnam Bold"';
  ctx.fillStyle = sentimentColor;
  ctx.fillText(data.sentimentMsg || '', gaugeX + 700, gaugeY + 60);
}

/**
 * Draw user portfolio section
 */
function drawUserPortfolio(ctx, x, y, width, height, data) {
  // Section background
  const portfolioGradient = ctx.createLinearGradient(x, y, x, y + height);
  portfolioGradient.addColorStop(0, 'rgba(20, 33, 61, 0.9)');
  portfolioGradient.addColorStop(1, 'rgba(15, 52, 96, 0.9)');
  
  ctx.fillStyle = portfolioGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = '#7db1f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.stroke();
  
  // Section title
  ctx.font = '28px "BeVietnam Bold"';
  ctx.fillStyle = '#7db1f0';
  ctx.textAlign = 'left';
  ctx.fillText('DANH MỤC CỦA BẠN', x + 40, y + 50);
  
  // Separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 70);
  ctx.lineTo(x + width - 40, y + 70);
  ctx.stroke();
  
  // Your MC balance
  ctx.font = '24px "BeVietnam Medium"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('Số dư MC của bạn', x + 40, y + 120);
  
  ctx.font = '48px "BeVietnam Bold"';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(formatNumber(data.userCoins || 0, 2), x + 40, y + 180);
  
  // Value in dollars
  ctx.font = '24px "BeVietnam Medium"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('Giá trị USD', x + 40, y + 230);
  
  const valueInDollars = (data.userCoins || 0) * (data.price || 0);
  ctx.font = '36px "BeVietnam Bold"';
  ctx.fillStyle = '#4ecca3';
  ctx.fillText(`$ ${formatNumber(valueInDollars, 2)}`, x + 40, y + 280);
  
  // Holdings percentage
  ctx.font = '24px "BeVietnam Medium"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('Thị phần', x + 550, y + 120);
  
  // Draw holding percentage circle
  const circleX = x + 600;
  const circleY = y + 220;
  const circleRadius = 100;
  
  // Circle background
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();
  
  // Circle border
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7db1f0';
  ctx.stroke();
  
  // Circle progress
  const holdingPercent = data.holdingPercent || 0;
  const angle = (holdingPercent / 100) * Math.PI * 2;
  
  ctx.beginPath();
  ctx.moveTo(circleX, circleY);
  ctx.arc(circleX, circleY, circleRadius, -Math.PI / 2, -Math.PI / 2 + angle);
  ctx.closePath();
  
  let holdingColor;
  if (holdingPercent > 5) holdingColor = '#ffd700';
  else if (holdingPercent > 1) holdingColor = '#4ecca3';
  else holdingColor = '#7db1f0';
  
  ctx.fillStyle = holdingColor;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Circle text
  ctx.font = '48px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${formatNumber(holdingPercent, 2)}%`, circleX, circleY);
  
  ctx.font = '20px "BeVietnam"';
  ctx.fillStyle = '#b0c4de';
  ctx.fillText('of total supply', circleX, circleY + 35);
  
  // Whale warning if applicable
  if (holdingPercent > 3) {
    ctx.fillStyle = 'rgba(233, 69, 96, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + 800, y + 120, 280, 100, 15);
    ctx.fill();
    
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '24px "BeVietnam Bold"';
    ctx.fillStyle = '#e94560';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ CẢNH BÁO WHALE', x + 940, y + 160);
    
    ctx.font = '18px "BeVietnam"';
    ctx.fillText('Giao dịch của bạn có thể tác động đến giá', x + 940, y + 190);
  }
  
  // Trade buttons
  drawTradeButton(ctx, x + 800, y + 240, 130, 50, 'BUY', '#4ecca3');
  drawTradeButton(ctx, x + 950, y + 240, 130, 50, 'SELL', '#e94560');
  
  // Button instructions
  ctx.font = '16px "BeVietnam"';
  ctx.fillStyle = '#b0c4de';
  ctx.textAlign = 'center';
  ctx.fillText('.coin buy [amount]', x + 865, y + 320);
  ctx.fillText('.coin sell [amount]', x + 1015, y + 320);
}

/**
 * Draw a trade button
 */
function drawTradeButton(ctx, x, y, width, height, text, color) {
  // Button background
  const buttonGradient = ctx.createLinearGradient(x, y, x, y + height);
  buttonGradient.addColorStop(0, color);
  buttonGradient.addColorStop(1, adjustColor(color, -30));
  
  ctx.fillStyle = buttonGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.fill();
  
  // Button text
  ctx.font = '24px "BeVietnam Bold"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.textBaseline = 'alphabetic';
  
  // Button shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;
  ctx.strokeStyle = adjustColor(color, -50);
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Adjust color brightness
 */
function adjustColor(color, amount) {
  return color;
}

/**
 * Draw price history chart
 */
async function drawPriceChart(ctx, x, y, width, height, priceHistory) {
  // Chart section background
  const chartGradient = ctx.createLinearGradient(x, y, x, y + height);
  chartGradient.addColorStop(0, 'rgba(20, 33, 61, 0.9)');
  chartGradient.addColorStop(1, 'rgba(15, 52, 96, 0.9)');
  
  ctx.fillStyle = chartGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = '#7db1f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 20);
  ctx.stroke();
  
  // Section title
  ctx.font = '28px "BeVietnam Bold"';
  ctx.fillStyle = '#7db1f0';
  ctx.textAlign = 'left';
  ctx.fillText('LỊCH SỬ GIÁ', x + 40, y + 50);
  
  // Separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 40, y + 70);
  ctx.lineTo(x + width - 40, y + 70);
  ctx.stroke();
  
  // Draw simple line chart (since we can't use Chart.js in this environment)
  const chartArea = {
    x: x + 40,
    y: y + 90,
    width: width - 80,
    height: height - 140
  };
  
  const history = priceHistory.slice().reverse();
  
  if (history.length > 1) {
    const prices = history.map(h => h.price);
    const times = history.map(h => new Date(h.time));
    
    const maxPrice = Math.max(...prices) * 1.05;
    const minPrice = Math.min(...prices) * 0.95;
    const priceRange = maxPrice - minPrice;
    
    // Draw axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    
    // Horizontal grid lines (price)
    for (let i = 0; i <= 5; i++) {
      const gridY = chartArea.y + i * (chartArea.height / 5);
      const gridPrice = maxPrice - (i / 5) * priceRange;
      
      ctx.beginPath();
      ctx.moveTo(chartArea.x, gridY);
      ctx.lineTo(chartArea.x + chartArea.width, gridY);
      ctx.stroke();
      
      // Price labels
      ctx.font = '16px "BeVietnam"';
      ctx.fillStyle = '#b0c4de';
      ctx.textAlign = 'right';
      ctx.fillText(`$${formatNumber(gridPrice, 2)}`, chartArea.x - 10, gridY + 5);
    }
    
    // Draw price line
    ctx.beginPath();
    for (let i = 0; i < history.length; i++) {
      const pointX = chartArea.x + (i / (history.length - 1)) * chartArea.width;
      const pointY = chartArea.y + chartArea.height - ((history[i].price - minPrice) / priceRange * chartArea.height);
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    
    // Create gradient for line
    const lineGradient = ctx.createLinearGradient(0, chartArea.y, 0, chartArea.y + chartArea.height);
    lineGradient.addColorStop(0, '#4ecca3');
    lineGradient.addColorStop(1, '#7db1f0');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw points
    for (let i = 0; i < history.length; i++) {
      const pointX = chartArea.x + (i / (history.length - 1)) * chartArea.width;
      const pointY = chartArea.y + chartArea.height - ((history[i].price - minPrice) / priceRange * chartArea.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Time labels for some points
      if (i === 0 || i === history.length - 1 || i % Math.ceil(history.length / 4) === 0) {
        const dateLabel = times[i].toLocaleDateString();
        
        ctx.font = '14px "BeVietnam"';
        ctx.fillStyle = '#b0c4de';
        ctx.textAlign = 'center';
        ctx.fillText(dateLabel, pointX, chartArea.y + chartArea.height + 25);
      }
    }
    
    // Fill area under the line
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);
    
    for (let i = 0; i < history.length; i++) {
      const pointX = chartArea.x + (i / (history.length - 1)) * chartArea.width;
      const pointY = chartArea.y + chartArea.height - ((history[i].price - minPrice) / priceRange * chartArea.height);
      ctx.lineTo(pointX, pointY);
    }
    
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.closePath();
    
    const areaGradient = ctx.createLinearGradient(0, chartArea.y, 0, chartArea.y + chartArea.height);
    areaGradient.addColorStop(0, 'rgba(77, 236, 163, 0.2)');
    areaGradient.addColorStop(1, 'rgba(77, 236, 163, 0)');
    
    ctx.fillStyle = areaGradient;
    ctx.fill();
  }
}

/**
 * Draw footer section
 */
function drawFooter(ctx, width, height) {
  // Footer background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(0, height - 60, width, 60, [20, 20, 0, 0]);
  ctx.fill();
  
  // Footer text
  ctx.font = '18px "BeVietnam"';
  ctx.fillStyle = '#b0c4de';
  ctx.textAlign = 'center';
  ctx.fillText('AKI MAINNET COIN • PHÂN TÍCH THỊ TRƯỜNG • AN TOÀN • PHI TẬP TRUNG', width / 2, height - 25);
}

module.exports = {
  createMarketCanvas,
  bufferToStream
};