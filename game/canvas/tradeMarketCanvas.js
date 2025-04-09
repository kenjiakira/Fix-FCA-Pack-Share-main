const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');


const COLORS = {
  up: '#4ade80',
  down: '#f87171',
  stable: '#60a5fa',
  border: '#475569',
  background: '#0f172a',
  text: '#f8fafc',
  gridLine: '#1e293b',
  header: '#334155',
  tickerUp: '#22c55e',
  tickerDown: '#ef4444',
  tickerStable: '#3b82f6'
};

async function createMarketOverviewCanvas(marketData) {

  const stockCount = Object.keys(marketData.stocks).length;
  const itemsPerRow = 3;
  const rows = Math.ceil(stockCount / itemsPerRow);


  const width = 1200;
  const headerHeight = 80;
  const tickerHeight = 60;
  const indicesHeight = 180;
  const cellHeight = 300;
  const gridHeight = Math.ceil(rows * cellHeight);
  const height = headerHeight + tickerHeight + gridHeight + indicesHeight + 60;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');


  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);


  drawHeader(ctx, width, "TỔNG QUAN THỊ TRƯỜNG", new Date(marketData.lastUpdate));


  const tickerY = headerHeight + 10;
  drawTickerTape(ctx, marketData.stocks, tickerY, width);


  const stocks = Object.entries(marketData.stocks);
  const gridY = headerHeight + tickerHeight + 20;
  drawMarketGrid(ctx, stocks, gridY, width, gridHeight);


  const indicesY = headerHeight + tickerHeight + gridHeight + 30;
  drawMarketIndices(ctx, stocks, indicesY, width);


  const tempDir = path.join(__dirname, '../../commands/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, `market_overview_${Date.now()}.png`);
  const out = fs.createWriteStream(filePath);
  const stream = canvas.createPNGStream();

  return new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on('finish', () => resolve(filePath));
    out.on('error', reject);
  });
}

function drawHeader(ctx, width, title, lastUpdate) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, width, 80);


  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 36px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(title, 30, 50);


  ctx.font = '20px BeVietnamPro';
  ctx.textAlign = 'right';
  ctx.fillText(`Cập nhật lần cuối: ${lastUpdate.toLocaleString()}`, width - 30, 50);
}

function drawTickerTape(ctx, stocks, y, width) {
  const tickerHeight = 50;


  ctx.fillStyle = '#111827';
  ctx.fillRect(0, y, width, tickerHeight);


  const stockCount = Object.keys(stocks).length;
  const maxTickersPerLine = Math.min(6, stockCount);
  const tickerWidth = width / maxTickersPerLine;

  let row = 0;
  let col = 0;


  Object.entries(stocks).forEach(([symbol, stock], index) => {

    const x = col * tickerWidth + 20;
    const yPos = y + (row * 25) + 18;


    ctx.fillStyle = stock.trend === 'up' ? COLORS.tickerUp :
      stock.trend === 'down' ? COLORS.tickerDown :
        COLORS.tickerStable;

    ctx.font = 'bold 16px BeVietnamPro';


    ctx.fillText(symbol, x, yPos);


    const symbolWidth = ctx.measureText(symbol).width;
    const priceX = x + symbolWidth + 8;


    ctx.fillStyle = COLORS.text;
    ctx.font = '16px BeVietnamPro';
    const price = stock.price.toFixed(2);
    ctx.fillText(price, priceX, yPos);


    const priceWidth = ctx.measureText(price).width;
    const indicatorX = priceX + priceWidth + 8;


    const changeChar = stock.trend === 'up' ? '▲' :
      stock.trend === 'down' ? '▼' : '■';
    ctx.fillStyle = stock.trend === 'up' ? COLORS.tickerUp :
      stock.trend === 'down' ? COLORS.tickerDown :
        COLORS.tickerStable;
    ctx.fillText(changeChar, indicatorX, yPos);


    col++;
    if (col >= maxTickersPerLine) {
      col = 0;
      row++;


      if (row > 1) return;
    }
  });
}

function drawMarketGrid(ctx, stocks, startY, width, height) {
  const columns = 3;
  const cellWidth = Math.floor(width / columns);
  const cellHeight = 300;
  const padding = 10;

  stocks.forEach(([symbol, stock], index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = col * cellWidth + padding;
    const y = startY + (row * cellHeight) + padding;


    drawStockCell(ctx, symbol, stock, x, y, cellWidth - (padding * 2), cellHeight - (padding * 2));
  });
}

function drawStockCell(ctx, symbol, stock, x, y, width, height) {

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);


  const bgColor = stock.trend === 'up' ? 'rgba(22, 163, 74, 0.1)' :
    stock.trend === 'down' ? 'rgba(220, 38, 38, 0.1)' :
      'rgba(37, 99, 235, 0.1)';
  ctx.fillStyle = bgColor;
  ctx.fillRect(x + 1, y + 1, width - 2, height - 2);


  const paddingX = 20;
  const contentX = x + paddingX;


  ctx.fillStyle = stock.trend === 'up' ? COLORS.up :
    stock.trend === 'down' ? COLORS.down :
      COLORS.stable;
  ctx.font = 'bold 24px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(symbol, contentX, y + 35);


  ctx.fillStyle = COLORS.text;
  ctx.font = '16px BeVietnamPro';
  ctx.fillText(stock.name || "Company", contentX, y + 65);


  ctx.font = 'bold 32px BeVietnamPro';
  ctx.fillText(`$${stock.price.toFixed(2)}`, contentX, y + 110);


  ctx.font = '18px BeVietnamPro';


  const trendIcon = stock.trend === 'up' ? '📈' :
    stock.trend === 'down' ? '📉' : '📊';
  const trendText = stock.trend === 'up' ? 'Uptrend' :
    stock.trend === 'down' ? 'Downtrend' : 'Stable';
  ctx.fillText(`${trendIcon} ${trendText}`, contentX, y + 145);


  ctx.fillText(`ngành: ${stock.sector || "Unknown"}`, contentX, y + 175);


  const volatilityColor = stock.volatility === 'high' ? COLORS.down :
    stock.volatility === 'low' ? COLORS.up :
      COLORS.stable;
  ctx.fillStyle = volatilityColor;
  ctx.fillText(`Biến động: ${stock.volatility || "Medium"}`, contentX, y + 205);
  ctx.fillStyle = COLORS.text;


  if (stock.history && stock.history.length > 1) {
    const chartY = y + 225;
    const chartHeight = 50;
    drawMiniChart(ctx, stock.history, contentX, chartY, width - (paddingX * 2), chartHeight, stock.trend);
  }
}

/**
 * Draws a mini price chart for each stock
 */
function drawMiniChart(ctx, history, x, y, width, height, trend) {
  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const range = maxPrice - minPrice || 1;


  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);


  if (history.length < 2) return;


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

  ctx.strokeStyle = trend === 'up' ? COLORS.up :
    trend === 'down' ? COLORS.down :
      COLORS.stable;
  ctx.lineWidth = 2;
  ctx.stroke();


  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();

  const gradientColor = trend === 'up' ? COLORS.up :
    trend === 'down' ? COLORS.down :
      COLORS.stable;
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, `${gradientColor}40`);
  gradient.addColorStop(1, `${gradientColor}10`);
  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Draws market indices at the bottom
 */
function drawMarketIndices(ctx, stocks, y, width) {
  const indexHeight = 170;


  ctx.fillStyle = '#111827';
  ctx.fillRect(0, y, width, indexHeight);


  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText("CHỈ SỐ THỊ TRƯỜNG", 30, y + 40);


  const techStocks = stocks.filter(([_, stock]) => stock.sector === 'Technology');
  const techIndex = calculateIndex(techStocks);

  const allStocks = stocks;
  const marketIndex = calculateIndex(allStocks);


  drawIndex(ctx, "TECH-100", techIndex, 40, y + 70, 500);


  drawIndex(ctx, "MARKET-ALL", marketIndex, 650, y + 70, 500);
}


function calculateIndex(stocks) {
  if (stocks.length === 0) return { value: 0, trend: 'stable', change: 0 };


  const totalValue = stocks.reduce((sum, [_, stock]) => sum + stock.price, 0);


  const trends = stocks.reduce((counts, [_, stock]) => {
    counts[stock.trend] = (counts[stock.trend] || 0) + 1;
    return counts;
  }, {});


  let trend = 'stable';
  if (trends.up > trends.down && trends.up > (trends.stable || 0)) {
    trend = 'up';
  } else if (trends.down > trends.up && trends.down > (trends.stable || 0)) {
    trend = 'down';
  }


  const change = trend === 'up' ? Math.random() * 2 :
    trend === 'down' ? -Math.random() * 2 :
      (Math.random() - 0.5) * 0.5;

  return {
    value: totalValue / stocks.length * 10,
    trend,
    change
  };
}

/**
 * Draws a market index with value and change
 */
function drawIndex(ctx, name, index, x, y, width) {

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText(name, x, y);


  ctx.font = 'bold 32px BeVietnamPro';
  ctx.fillText(index.value.toFixed(2), x, y + 40);


  const changeColor = index.trend === 'up' ? COLORS.up :
    index.trend === 'down' ? COLORS.down :
      COLORS.stable;
  const changeChar = index.trend === 'up' ? '▲' :
    index.trend === 'down' ? '▼' : '■';

  ctx.fillStyle = changeColor;
  ctx.fillText(`${changeChar} ${index.change.toFixed(2)}%`, x, y + 80);
}

module.exports = { createMarketOverviewCanvas };