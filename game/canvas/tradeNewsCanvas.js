const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');


const COLORS = {
  veryGood: '#22c55e', 
  good: '#4ade80',     
  neutral: '#60a5fa',  
  bad: '#f97316',      
  veryBad: '#ef4444',  
  background: '#0f172a',
  text: '#f8fafc',
  lightText: '#cbd5e1',
  border: '#334155',
  header: '#1e293b',
  subheader: '#334155',
  card: '#1e293b'
};


const IMPACT_ICONS = {
  veryGood: '🔥',
  good: '📈',
  neutral: '📊',
  bad: '📉',
  veryBad: '⚠️'
};

/**
 * Creates a visually appealing financial news canvas
 * @param {Array} newsData - Array of news items
 * @param {Object} marketData - Market data to show stock prices
 * @returns {Promise<string>} Path to the generated image
 */
async function createNewsCanvas(newsData, marketData) {
  
  const width = 1000;
  const headerHeight = 80;
  const footerHeight = 50;
  
  
  const newsItemHeight = 160;
  const maxNewsToShow = Math.min(6, newsData.length);
  const newsHeight = maxNewsToShow * newsItemHeight;
  
  
  const tickerHeight = 60;
  
  
  const height = headerHeight + tickerHeight + newsHeight + footerHeight;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
  
  
  drawHeader(ctx, width, headerHeight);
  
  
  drawTickerTape(ctx, marketData.stocks, headerHeight, width, tickerHeight);
  
  
  const newsStartY = headerHeight + tickerHeight;
  await drawNewsItems(ctx, newsData.slice(0, maxNewsToShow), marketData.stocks, newsStartY, width, newsItemHeight);
  
  
  drawFooter(ctx, width, height - footerHeight, footerHeight);
  
  
  const tempDir = path.join(__dirname, '../../commands/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, `market_news_${Date.now()}.png`);
  const out = fs.createWriteStream(filePath);
  const stream = canvas.createPNGStream();

  return new Promise((resolve, reject) => {
    stream.pipe(out);
    out.on('finish', () => resolve(filePath));
    out.on('error', reject);
  });
}

/**
 * Draws the header section
 */
function drawHeader(ctx, width, height) {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, width, height);
  
  
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 36px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText('📰 MARKET NEWS', 30, 50);
  
  
  ctx.font = '18px BeVietnamPro';
  ctx.textAlign = 'right';
  ctx.fillText(`${new Date().toLocaleDateString()} | AKI TRADING`, width - 30, 50);
}

/**
 * Draws a scrolling ticker tape with stock prices
 */
function drawTickerTape(ctx, stocks, y, width, height) {
  
  ctx.fillStyle = COLORS.subheader;
  ctx.fillRect(0, y, width, height);
  
  
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, 'rgba(30, 41, 59, 0.8)');
  gradient.addColorStop(1, 'rgba(30, 41, 59, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, width, height);
  
  
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px BeVietnamPro';
  ctx.textAlign = 'left';
  ctx.fillText('LIVE MARKET', 15, y + 25);
  
  
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, y + 10);
  ctx.lineTo(120, y + height - 10);
  ctx.stroke();
  
  
  const tickerStartX = 140;
  const tickerWidth = 140; 
  const tickersPerRow = Math.floor((width - tickerStartX) / tickerWidth);
  
  
  let count = 0;
  Object.entries(stocks).forEach(([symbol, stock], index) => {
    if (count >= tickersPerRow) return;
    
    const x = tickerStartX + (count * tickerWidth);
    const yPos = y + 25; 
    
    
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px BeVietnamPro';
    ctx.textAlign = 'left';
    ctx.fillText(symbol, x, yPos);
    
    
    ctx.font = '16px Arial';
    ctx.fillText(`$${stock.price.toFixed(2)}`, x, yPos + 25);
    
    
    const trendChar = stock.trend === 'up' ? '▲' : 
                     stock.trend === 'down' ? '▼' : '■';
    ctx.fillStyle = stock.trend === 'up' ? COLORS.veryGood : 
                   stock.trend === 'down' ? COLORS.veryBad : 
                   COLORS.neutral;
    ctx.fillText(trendChar, x + 85, yPos + 25);
    
    count++;
  });
}

/**
 * Draws individual news items
 */
async function drawNewsItems(ctx, news, stocks, startY, width, itemHeight) {
  for (let i = 0; i < news.length; i++) {
    const y = startY + (i * itemHeight);
    const newsItem = news[i];
    
    
    ctx.fillStyle = i % 2 === 0 ? COLORS.card : COLORS.background;
    ctx.fillRect(0, y, width, itemHeight);
    
    
    const impactColor = COLORS[newsItem.impact] || COLORS.neutral;
    ctx.fillStyle = impactColor;
    ctx.fillRect(0, y + 10, 10, itemHeight - 20);
    
    
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 22px BeVietnamPro';
    ctx.textAlign = 'left';
    
    
    const stock = stocks[newsItem.symbol];
    let stockPrice = stock ? `$${stock.price.toFixed(2)}` : '';
    let stockTrend = stock ? stock.trend : 'neutral';
    
    
    const headline = newsItem.headline;
    const maxWidth = width - 60;
    wrapText(ctx, headline, 30, y + 40, maxWidth, 30);
    
    
    const impactText = `Impact: ${capitalizeFirstLetter(newsItem.impact)}`;
    ctx.font = '16px Arial';
    ctx.fillStyle = impactColor;
    ctx.fillText(`${IMPACT_ICONS[newsItem.impact] || '📊'} ${impactText}`, 30, y + 100);
    
    
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Biểu tượng: ${newsItem.symbol}`, 30, y + 130);
    
    
    if (stockPrice) {
      const trendChar = stockTrend === 'up' ? '▲' : 
                       stockTrend === 'down' ? '▼' : '■';
      ctx.fillText(`Price: ${stockPrice} ${trendChar}`, 200, y + 130);
      
      ctx.fillStyle = stockTrend === 'up' ? COLORS.veryGood : 
                     stockTrend === 'down' ? COLORS.veryBad : 
                     COLORS.neutral;
      ctx.fillText(trendChar, 200 + ctx.measureText(`Price: ${stockPrice} `).width, y + 130);
    }
    
    
    const date = new Date(newsItem.timestamp).toLocaleString();
    ctx.fillStyle = COLORS.lightText;
    ctx.textAlign = 'right';
    ctx.fillText(date, width - 30, y + 130);
  }
}

/**
 * Draw footer with attributions
 */
function drawFooter(ctx, width, y, height) {
  
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, y, width, height);
  
  
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px BeVietnamPro';
  ctx.textAlign = 'center';
  ctx.fillText('AKI Trading System | Financial News Report | Data for informational purposes only', width/2, y + 30);
}

/**
 * Helper to wrap text within a given width
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      
      if (lineCount >= 2) {
        
        if (n < words.length - 1) {
          line = line.trim() + '...';
        }
        ctx.fillText(line, x, y);
        break;
      }
    } else {
      line = testLine;
    }
  }
  
  
  if (lineCount < 2) {
    ctx.fillText(line, x, y);
  }
}

/**
 * Helper to capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = { createNewsCanvas };