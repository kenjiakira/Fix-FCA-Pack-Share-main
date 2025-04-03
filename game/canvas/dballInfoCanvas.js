const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
const axios = require('axios');
const crypto = require('crypto');

// Character images by race
const CHARACTER_IMAGES = {
    EARTH: [
        { url: 'https://imgur.com/4fXQW6a.png', name: 'Krillin' },
        { url: 'https://imgur.com/I9uO7T2.png', name: 'Yamcha' },
        { url: 'https://imgur.com/ILKyDup.png', name: 'Tien' },
        { url: 'https://imgur.com/qOPOHXd.png', name: 'Master Roshi' },
        { url: 'https://imgur.com/fB1Vpp2.png', name: 'Videl' },
        { url: 'https://imgur.com/3VMLtMR.png', name: 'Android 18' },
        { url: 'https://imgur.com/L2mHwC7.png', name: 'Android 17' }
    ],
    NAMEK: [
        { url: 'https://imgur.com/vfmtrQZ.png', name: 'Piccolo' },
        { url: 'https://imgur.com/rpsAixj.png', name: 'Nail' },
        { url: 'https://imgur.com/eLmIFmd.png', name: 'Dende' },
        { url: 'https://imgur.com/8irQGqJ.png', name: 'Elder Guru' },
        { url: 'https://imgur.com/hsJBuop.png', name: 'Namekian Warrior' }
    ],
    SAIYAN: [
        { url: 'https://imgur.com/JyAPj1T.png', name: 'Goku' },
        { url: 'https://imgur.com/oFJKe8y.png', name: 'Vegeta' },
        { url: 'https://imgur.com/Si6udy9.png', name: 'Gohan' },
        { url: 'https://imgur.com/DIIAFea.png', name: 'Future Trunks' },
        { url: 'https://i.imgur.com/xm80bQF.png', name: 'Kid Trunks' },
        { url: 'https://i.imgur.com/FRcHmZn.png', name: 'Goten' },
        { url: 'https://i.imgur.com/UkAj2QZ.png', name: 'Bardock' },
        { url: 'https://i.imgur.com/7eL7qzX.png', name: 'Nappa' }
    ]
};

// Evolution auras by race
const EVOLUTION_AURAS = {
    EARTH: [
        { color: '#FFFFFF', glow: '#87CEEB' },     // Basic
        { color: '#FF5722', glow: '#FF9800' },     // Unlocked Potential
        { color: '#4CAF50', glow: '#8BC34A' },     // Full Power
        { color: '#2196F3', glow: '#03A9F4' },     // Mystic
        { color: '#9C27B0', glow: '#E1BEE7' }      // Ultimate
    ],
    NAMEK: [
        { color: '#FFFFFF', glow: '#B2EBF2' },     // Basic
        { color: '#4CAF50', glow: '#81C784' },     // Warrior
        { color: '#FFC107', glow: '#FFECB3' },     // Super Namekian
        { color: '#9C27B0', glow: '#CE93D8' },     // Giant Form
        { color: '#2196F3', glow: '#90CAF9' }      // Dragon Clan
    ],
    SAIYAN: [
        { color: '#FFFFFF', glow: '#E0E0E0' },     // Basic
        { color: '#FFC107', glow: '#FFECB3' },     // Super Saiyan
        { color: '#F57C00', glow: '#FFB74D' },     // Super Saiyan 2
        { color: '#F44336', glow: '#FFCDD2' },     // Super Saiyan 3
        { color: '#2196F3', glow: '#90CAF9' }      // Super Saiyan Blue
    ]
};

// Background themes by planet
const PLANET_THEMES = {
    EARTH: {
        bg: 'https://imgur.com/KC7AzfT.jpg',
        color: '#4CAF50',
        accent: '#8BC34A'
    },
    NAMEK: {
        bg: 'https://imgur.com/g4WSUBV.jpg',
        color: '#2196F3',
        accent: '#03A9F4'
    },
    SAIYAN: {
        bg: 'https://imgur.com/iL3v6y5.jpg',
        color: '#F44336',
        accent: '#FF9800'
    }
};

// Item icons for equipped items
const ITEM_ICONS = {
    'armor': 'https://i.imgur.com/xjtPCx7.png',
    'scouter': 'https://i.imgur.com/3GxYmvx.png',
    'radar': 'https://i.imgur.com/wJwp8C7.png',
    'gravity': 'https://i.imgur.com/9vNnRKM.png',
    'tournament_belt': 'https://i.imgur.com/JK0oej2.png',
    'cell_medal': 'https://i.imgur.com/AACDCAQ.png',
    'universe_medal': 'https://i.imgur.com/3gftnr7.png'
};

// Dragon Ball images
const DRAGON_BALL_IMAGE = 'https://i.imgur.com/UJAkgit.png';

/**
 * Create character info canvas for a player
 * @param {Object} playerData - Player's data and stats
 * @returns {Promise<string>} - Path to the created image
 */
async function createInfoCanvas(playerData) {
    try {
        // Ensure directories exist
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // Register fonts
        const fontPath = path.join(__dirname, '../../fonts/Saiyan-Sans.ttf');
        Canvas.registerFont(fontPath, { family: 'Saiyan Sans' });
        
        const beVietnamProPath = path.join(__dirname, '../../fonts/BeVietnamPro-SemiBold.ttf');
        if (fs.existsSync(beVietnamProPath)) {
            Canvas.registerFont(beVietnamProPath, { family: 'BeVietnamPro', weight: 'semibold' });
        } else {
            Canvas.registerFont(path.join(__dirname, '../../fonts/Arial.ttf'), { family: 'Arial' });
        }

        // Create canvas with 16:9 aspect ratio
        const canvas = Canvas.createCanvas(1280, 720);
        const ctx = canvas.getContext('2d');

        // Set up player's race and theme
        const raceName = playerData.planet || 'EARTH';
        const theme = PLANET_THEMES[raceName] || PLANET_THEMES.EARTH;

        // Draw background
        await drawBackground(ctx, canvas.width, canvas.height, theme.bg);
        
        // Determine character image based on player ID (consistent for same player)
        const characterSet = CHARACTER_IMAGES[raceName] || CHARACTER_IMAGES.EARTH;
        const characterIndex = getPlayerCharacterIndex(playerData.id, characterSet.length);
        const character = characterSet[characterIndex];
        
        // Draw character image with aura
        await drawCharacterWithAura(ctx, canvas.width, canvas.height, character, playerData, raceName);
        
        // Draw stats panel
        drawStatsPanel(ctx, canvas.width, canvas.height, playerData, theme, raceName);
        
        // Draw decorative elements
        drawDecorativeElements(ctx, canvas.width, canvas.height, theme);

        // Save image
        const outputPath = path.join(__dirname, 'cache', `${playerData.id}_info.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    } catch (error) {
        console.error('Error creating info canvas:', error);
        return null;
    }
}

/**
 * Hash player ID to get consistent character selection
 * @param {string} playerId - Player's unique ID
 * @param {number} max - Maximum number of characters
 * @returns {number} - Consistent index for this player
 */
function getPlayerCharacterIndex(playerId, max) {
    if (!playerId) return 0;
    
    const hash = crypto.createHash('md5').update(playerId).digest('hex');
    const numericValue = parseInt(hash.substring(0, 8), 16);
    return numericValue % max;
}

/**
 * Draw background image
 */
async function drawBackground(ctx, width, height, backgroundUrl) {
    try {
        const response = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
        const img = await Canvas.loadImage(Buffer.from(response.data));
        
        // Draw background with proper scaling to cover entire canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Add dark overlay for better readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle radial gradient
        const gradient = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    } catch (error) {
        console.error('Error loading background image:', error);
        // Fallback background
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, width, height);
        
        // Add some stars
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Draw character with appropriate aura based on evolution
 */
async function drawCharacterWithAura(ctx, width, height, character, playerData, raceName) {
    try {
        // Character image positioning
        const characterWidth = width * 0.45;
        const characterHeight = height * 0.85;
        const characterX = width * 0.07;
        const characterY = height * 0.15;
        
        // Character image
        const response = await axios.get(character.url, { responseType: 'arraybuffer' });
        const img = await Canvas.loadImage(Buffer.from(response.data));
        
        // Get evolution level
        const evolveLevel = playerData.evolution?.level || 0;
        const auraColors = EVOLUTION_AURAS[raceName] || EVOLUTION_AURAS.EARTH;
        const aura = auraColors[Math.min(evolveLevel, auraColors.length - 1)];
        
        // Draw aura if player has evolution
        if (evolveLevel > 0) {
            // Save context for aura effects
            ctx.save();
            
            // Draw outer glow
            ctx.shadowColor = aura.glow;
            ctx.shadowBlur = 40;
            ctx.fillStyle = 'rgba(255, 255, 255, 0)';
            
            // Create pulsing aura effect
            const now = Date.now();
            const pulseSize = Math.sin(now / 500) * 15 + 30; // Pulsing between 15-45
            
            // Draw aura shape
            ctx.beginPath();
            ctx.ellipse(
                characterX + characterWidth/2, 
                characterY + characterHeight * 0.6, 
                characterWidth * 0.6, 
                characterHeight * 0.7, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Inner aura
            ctx.shadowColor = aura.color;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.ellipse(
                characterX + characterWidth/2, 
                characterY + characterHeight * 0.6, 
                characterWidth * 0.4, 
                characterHeight * 0.55, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Electric effects for high-level evolutions
            if (evolveLevel >= 2) {
                ctx.strokeStyle = aura.color;
                ctx.lineWidth = 3;
                
                const centerX = characterX + characterWidth/2;
                const centerY = characterY + characterHeight * 0.6;
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const length = characterWidth * (0.3 + Math.random() * 0.3);
                    
                    // Start point
                    const startX = centerX + Math.cos(angle) * characterWidth * 0.2;
                    const startY = centerY + Math.sin(angle) * characterHeight * 0.25;
                    
                    // End point
                    const endX = centerX + Math.cos(angle) * length;
                    const endY = centerY + Math.sin(angle) * length * 0.8;
                    
                    // Draw lightning
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    
                    // Add some random zigzag
                    const segments = 3 + Math.floor(Math.random() * 3);
                    for (let j = 1; j < segments; j++) {
                        const t = j / segments;
                        const x = startX + (endX - startX) * t;
                        const y = startY + (endY - startY) * t;
                        const offset = length * 0.1 * (Math.random() - 0.5);
                        ctx.lineTo(x + offset, y + offset);
                    }
                    
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
        
        // Draw character image
        ctx.drawImage(img, characterX, characterY, characterWidth, characterHeight);
        
        // Add character nameplate
        const plateHeight = 40;
        const plateY = characterY + characterHeight - plateHeight;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(characterX, plateY, characterWidth, plateHeight);
        
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 2;
        ctx.strokeRect(characterX, plateY, characterWidth, plateHeight);
        
        // Draw character name
        ctx.font = '24px "BeVietnamPro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`${playerData.name} (${character.name})`, characterX + characterWidth/2, plateY + 28);
        
    } catch (error) {
        console.error('Error drawing character:', error);
        
        // Fallback character silhouette
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(width * 0.25, height * 0.5, width * 0.15, height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px "BeVietnamPro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(playerData.name, width * 0.25, height * 0.85);
    }
}

/**
 * Draw stats panel with player information
 */
function drawStatsPanel(ctx, width, height, playerData, theme, raceName) {
    // Panel dimensions
    const panelX = width * 0.55;
    const panelY = height * 0.1;
    const panelWidth = width * 0.38;
    const panelHeight = height * 0.8;
    
    // Draw main panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = theme.color;
    ctx.lineWidth = 3;
    
    // Rounded rectangle
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 15);
    ctx.fill();
    ctx.stroke();
    
    // Draw header
    ctx.fillStyle = theme.color;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, 60, [15, 15, 0, 0]);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "BeVietnamPro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THÔNG TIN NHÂN VẬT', panelX + panelWidth/2, panelY + 40);
    
    // Draw content
    const contentX = panelX + 20;
    let contentY = panelY + 90;
    const lineHeight = 36;
    
    ctx.font = 'bold 24px "BeVietnamPro", sans-serif';
    ctx.textAlign = 'left';
    
    // Basic stats section
    ctx.fillStyle = '#FFC107';
    ctx.fillText('🌟 THÔNG TIN CƠ BẢN', contentX, contentY);
    contentY += 10;
    
    // Horizontal line
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(contentX, contentY + 10);
    ctx.lineTo(panelX + panelWidth - 20, contentY + 10);
    ctx.stroke();
    contentY += 40;
    
    // Statistics
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px "BeVietnamPro", sans-serif';
    
    ctx.fillText(`👤 Tên: ${playerData.name}`, contentX, contentY);
    contentY += lineHeight;
    
    ctx.fillText(`🌍 Tộc Người: ${raceName}`, contentX, contentY);
    contentY += lineHeight;
    
    // Power bar - special treatment for very large numbers
    drawStatBar(ctx, contentX, contentY, panelWidth - 40, 
        '💪 Sức mạnh', playerData.stats.power, 100000000000, theme.color, theme.accent);
    contentY += lineHeight + 15;
    
    // Damage bar
    drawStatBar(ctx, contentX, contentY, panelWidth - 40, 
        '⚔️ Sức đánh', playerData.stats.damage, 50000000, theme.color, theme.accent);
    contentY += lineHeight + 15;
    
    // Ki bar
    drawStatBar(ctx, contentX, contentY, panelWidth - 40, 
        '✨ Ki', playerData.stats.currentKi || playerData.stats.ki, playerData.stats.ki, theme.color, theme.accent);
    contentY += lineHeight + 15;
    
    // HP bar
    drawStatBar(ctx, contentX, contentY, panelWidth - 40, 
        '❤️ HP', playerData.stats.currentHealth || playerData.stats.health, playerData.stats.health, theme.color, theme.accent);
    contentY += lineHeight + 15;
    
    // Zeni and EXP
    ctx.fillText(`💰 Zeni: ${(playerData.stats.zeni || 0).toLocaleString()}`, contentX, contentY);
    contentY += lineHeight;
    
    ctx.fillText(`📊 EXP: ${playerData.stats.exp.toLocaleString()}`, contentX, contentY);
    contentY += lineHeight + 10;
    
    // Evolution information
    if (playerData.evolution) {
        ctx.fillStyle = '#FFC107';
        ctx.font = 'bold 24px "BeVietnamPro", sans-serif';
        ctx.fillText('🌟 TIẾN HÓA', contentX, contentY);
        contentY += 10;
        
        ctx.strokeStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(contentX, contentY + 10);
        ctx.lineTo(panelX + panelWidth - 20, contentY + 10);
        ctx.stroke();
        contentY += 40;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '22px "BeVietnamPro", sans-serif';
        ctx.fillText(`${playerData.evolution.name}`, contentX, contentY);
        contentY += lineHeight * 0.7;
        
        ctx.font = '18px "BeVietnamPro", sans-serif';
        ctx.fillText(`📝 ${playerData.evolution.description || 'Tiến hóa cao cấp'}`, contentX, contentY);
        contentY += lineHeight + 10;
    }
    
    // Skills/Equipment - use remaining space adaptively
    const remainingSpace = panelY + panelHeight - contentY - 20;
    
    // Check if we have skills to show
    if (playerData.skills?.length > 0) {
        const skillsHeight = Math.min(remainingSpace * 0.5, playerData.skills.length * lineHeight + 40);
        
        // Skills header
        ctx.fillStyle = '#FFC107';
        ctx.font = 'bold 24px "BeVietnamPro", sans-serif';
        ctx.fillText('⚡ KỸ NĂNG', contentX, contentY);
        contentY += 10;
        
        ctx.strokeStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(contentX, contentY + 10);
        ctx.lineTo(panelX + panelWidth - 20, contentY + 10);
        ctx.stroke();
        contentY += 40;
        
        // Skills list
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px "BeVietnamPro", sans-serif';
        
        // Limit number of skills shown based on space
        const maxSkills = Math.floor((skillsHeight - 40) / lineHeight);
        const skillsToShow = playerData.skills.slice(0, maxSkills);
        
        skillsToShow.forEach(skill => {
            const [master, skillName] = skill.split(":");
            ctx.fillText(`• ${skillName.replace(/_/g, " ")}`, contentX, contentY);
            contentY += lineHeight * 0.8;
        });
        
        if (playerData.skills.length > maxSkills) {
            ctx.fillText(`... và ${playerData.skills.length - maxSkills} kỹ năng khác`, contentX, contentY);
            contentY += lineHeight * 0.8;
        }
        
        contentY += 10;
    }
    
    // Draw Dragon Ball collection if player has any
    if (playerData.inventory?.dragonBalls?.length > 0) {
        drawDragonBalls(ctx, contentX, contentY, panelWidth - 40, playerData.inventory.dragonBalls);
    }
}

/**
 * Draw a stat bar with label, value, and visual meter
 */
function drawStatBar(ctx, x, y, width, label, value, maxValue, color1, color2) {
    // Label and value
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "BeVietnamPro", sans-serif';
    ctx.fillText(`${label}: ${value.toLocaleString()}${maxValue !== value ? '/' + maxValue.toLocaleString() : ''}`, x, y);
    
    // Background bar
    const barY = y + 10;
    const barHeight = 10;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x, barY, width, barHeight, 5);
    ctx.fill();
    
    // Calculate fill percentage
    const fillPercent = Math.min(value / maxValue, 1);
    const fillWidth = width * fillPercent;
    
    // Fill bar
    const gradient = ctx.createLinearGradient(x, barY, x + fillWidth, barY);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, barY, fillWidth, barHeight, 5);
    ctx.fill();
}

/**
 * Draw Dragon Balls collection
 */
async function drawDragonBalls(ctx, x, y, width, dragonBalls) {
    // Group dragon balls by planet
    const ballsByPlanet = {};
    dragonBalls.forEach(ball => {
        if (!ballsByPlanet[ball.planet]) {
            ballsByPlanet[ball.planet] = [];
        }
        ballsByPlanet[ball.planet].push(ball.star);
    });
    
    // Title
    ctx.fillStyle = '#FFC107';
    ctx.font = 'bold 24px "BeVietnamPro", sans-serif';
    ctx.fillText('🔮 NGỌC RỒNG', x, y);
    y += 10;
    
    ctx.strokeStyle = '#FFC107';
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x + width, y + 10);
    ctx.stroke();
    y += 40;
    
    // Draw balls for each planet
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "BeVietnamPro", sans-serif';
    
    try {
        // Load dragon ball image once
        const response = await axios.get(DRAGON_BALL_IMAGE, { responseType: 'arraybuffer' });
        const ballImage = await Canvas.loadImage(Buffer.from(response.data));
        
        let planetY = y;
        for (const [planet, stars] of Object.entries(ballsByPlanet)) {
            ctx.fillText(`${planet}:`, x, planetY);
            planetY += 25;
            
            // Sort stars
            stars.sort((a, b) => a - b);
            
            const ballSize = 30;
            const spacing = 40;
            
            // Draw collected balls
            for (let i = 0; i < stars.length; i++) {
                const ballX = x + (i % 4) * spacing;
                const ballY = planetY + Math.floor(i / 4) * spacing;
                
                // Draw ball
                ctx.drawImage(ballImage, ballX, ballY, ballSize, ballSize);
                
                // Draw star count
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 16px "BeVietnamPro", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(stars[i].toString(), ballX + ballSize/2, ballY + ballSize/2 + 5);
                ctx.textAlign = 'left';
            }
            
            planetY += Math.ceil(stars.length / 4) * spacing + 10;
            
            // Check if all 7 balls collected
            if (stars.length === 7) {
                ctx.fillStyle = '#FFC107';
                ctx.font = '18px "BeVietnamPro", sans-serif';
                ctx.fillText('🐉 Đủ 7 viên! Dùng .dball wish', x, planetY);
                planetY += 25;
            }
            
            ctx.fillStyle = '#FFFFFF';
        }
    } catch (error) {
        console.error('Error drawing dragon balls:', error);
        ctx.fillText('🔮 Ngọc Rồng: ' + dragonBalls.length + ' viên', x, y);
    }
}

/**
 * Draw decorative elements
 */
function drawDecorativeElements(ctx, width, height, theme) {
    // Draw corner decorations
    const cornerSize = 50;
    ctx.strokeStyle = theme.color;
    ctx.lineWidth = 3;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(0, 0);
    ctx.lineTo(cornerSize, 0);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(0, height - cornerSize);
    ctx.lineTo(0, height);
    ctx.lineTo(cornerSize, height);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(width - cornerSize, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height - cornerSize);
    ctx.stroke();
    
    // Draw DBZ game info at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, height - 30, width, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px "BeVietnamPro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DRAGON BALL Z RPG GAME • Sử dụng .dball để chơi game', width/2, height - 10);
    
    // Reset text alignment for future operations
    ctx.textAlign = 'left';
}

module.exports = createInfoCanvas;