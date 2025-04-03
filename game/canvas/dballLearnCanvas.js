const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

function getFontPath(fontName) {
    return path.join(__dirname, "../../fonts", fontName);
}

async function createLearnImage(data) {
    try {
        // Register fonts
        registerFont(getFontPath("Saiyan-Sans.ttf"), { family: "Saiyan" });
        registerFont(getFontPath("Arial.ttf"), { family: "Arial" });
        registerFont(getFontPath("BeVietnamPro-Bold.ttf"), { family: "BeVietnamPro" });

        // Canvas dimensions - 9:16 ratio
        const canvasWidth = 900;
        const canvasHeight = 1800; // Better for more skill display

        // Create canvas
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Planet-specific themes
        const PLANET_THEMES = {
            EARTH: {
                primary: "#1E7B1E", // Earth green
                secondary: "#6AB06A",
                accent: "#0A3D0A",
                aura: "#5EFF5E"
            },
            NAMEK: {
                primary: "#1E507B", // Namek blue
                secondary: "#6A90B0",
                accent: "#0A283D",
                aura: "#5EBAFF"
            },
            SAIYAN: {
                primary: "#7B1E1E", // Saiyan red
                secondary: "#B06A6A",
                accent: "#3D0A0A",
                aura: "#FF5E5E"
            }
        };

        // Get theme colors based on planet, default to EARTH if not found
        const planetKey = data.raceName.toUpperCase().replace(/\s+/g, '_');
        const planetTheme = PLANET_THEMES[planetKey] || PLANET_THEMES.EARTH;

        // Draw main background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw dynamic energy waves
        const waveCount = 5;
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < waveCount; i++) {
            const gradient = ctx.createRadialGradient(
                canvasWidth / 2, canvasHeight * 0.3, 50,
                canvasWidth / 2, canvasHeight * 0.3, 800 + i * 100
            );
            gradient.addColorStop(0, planetTheme.aura);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(canvasWidth / 2, canvasHeight * 0.3, 800 + i * 100, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw stars in the background (more visible against black)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            const radius = Math.random() * 2 + (Math.random() < 0.1 ? 2 : 0); // Some stars larger
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw header decorative lines
        const headerHeight = 200;
        ctx.lineWidth = 4;
        ctx.strokeStyle = planetTheme.secondary;

        // Top header bar with gradient
        const headerGradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
        headerGradient.addColorStop(0, 'transparent');
        headerGradient.addColorStop(0.1, planetTheme.accent);
        headerGradient.addColorStop(0.5, planetTheme.primary);
        headerGradient.addColorStop(0.9, planetTheme.accent);
        headerGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, canvasWidth, headerHeight);

        // Dragon Ball Z logo/title effect
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 15;
        ctx.font = '75px Saiyan';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('DRAGON BALL Z', canvasWidth / 2, 80);

        ctx.shadowBlur = 10;
        ctx.font = '45px Saiyan';
        ctx.fillText('MASTER SKILLS', canvasWidth / 2, 130);
        ctx.shadowBlur = 0;

        // Planet name with themed color
        ctx.font = '32px BeVietnamPro';
        ctx.fillStyle = planetTheme.secondary;
        ctx.fillText(`Planet: ${data.raceName}`, canvasWidth / 2, 180);

        // Draw Dragon Balls decorative elements
        const dragonBallRadius = 20;
        for (let i = 0; i < 7; i++) {
            const x = 50 + i * 30;
            ctx.beginPath();
            ctx.arc(x, 180, dragonBallRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FF9900';
            ctx.fill();
            ctx.strokeStyle = '#FF6600';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Add stars inside dragon balls
            ctx.fillStyle = '#FF3300';
            ctx.font = '14px BeVietnamPro';
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), x, 185);
        }

        // Draw the same on the right side
        for (let i = 0; i < 7; i++) {
            const x = canvasWidth - 50 - i * 30;
            ctx.beginPath();
            ctx.arc(x, 180, dragonBallRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FF9900';
            ctx.fill();
            ctx.strokeStyle = '#FF6600';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#FF3300';
            ctx.font = '14px BeVietnamPro';
            ctx.textAlign = 'center';
            ctx.fillText((7 - i).toString(), x, 185);
        }
        const centerX = canvasWidth / 2;
        const centerY = 320;
        const masterCircleRadius = 120;
        const auraRadius = 130;
        
        // Master avatar Imgur URLs
        const MASTER_AVATARS = {
            kame: "https://imgur.com/AliJCyI.png",  // Kame/Roshi
            piccolo: "https://imgur.com/3ebFXjq.png",  // Piccolo
            goku: "https://imgur.com/X1MeDUV.png",  // Goku/Kakarot
            default: "https://i.imgur.com/nJ3LTFH.png"  // Default master
        };
        
        // Draw aura gradient around master
        const auraGradient = ctx.createRadialGradient(
            centerX, centerY, auraRadius * 0.7,
            centerX, centerY, auraRadius * 1.5
        );
        auraGradient.addColorStop(0, planetTheme.aura);
        auraGradient.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, auraRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = auraGradient;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Determine which master avatar to use
        let masterImageUrl = MASTER_AVATARS.default;
        const masterLower = data.master.toLowerCase();
        if (masterLower.includes("kame") || masterLower.includes("roshi")) {
            masterImageUrl = MASTER_AVATARS.kame;
        } else if (masterLower.includes("piccolo")) {
            masterImageUrl = MASTER_AVATARS.piccolo;
        } else if (masterLower.includes("goku") || masterLower.includes("kakarot")) {
            masterImageUrl = MASTER_AVATARS.goku;
        }
        
        // Load and draw master avatar in a circle
        try {
            const masterImage = await loadImage(masterImageUrl);
            
            // Create clip for circular avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, masterCircleRadius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // Fill with dark background first
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(centerX - masterCircleRadius, centerY - masterCircleRadius, masterCircleRadius * 2, masterCircleRadius * 2);
            
            // Draw master image (centered in circle)
            const size = masterCircleRadius * 2;
            ctx.drawImage(masterImage, centerX - masterCircleRadius, centerY - masterCircleRadius, size, size);
            ctx.restore();
            
            // Draw circle border
            ctx.beginPath();
            ctx.arc(centerX, centerY, masterCircleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = planetTheme.secondary;
            ctx.lineWidth = 5;
            ctx.stroke();
        } catch (error) {
            console.error("Error loading master avatar:", error);
            
            // Fallback to drawing the circle with symbol if image fails to load
            ctx.beginPath();
            ctx.arc(centerX, centerY, masterCircleRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fill();
            ctx.strokeStyle = planetTheme.secondary;
            ctx.lineWidth = 5;
            ctx.stroke();
            
            // Draw fallback symbol
            let masterSymbol = "⚡";
            if (masterLower.includes("kame") || masterLower.includes("roshi")) {
                masterSymbol = "🐢";
            } else if (masterLower.includes("piccolo")) {
                masterSymbol = "👹";
            } else if (masterLower.includes("goku") || masterLower.includes("kakarot")) {
                masterSymbol = "🔥";
            }
            
            ctx.font = '80px BeVietnamPro';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(masterSymbol, centerX, centerY);
            ctx.textBaseline = 'alphabetic';
        }
  
        ctx.beginPath();
        ctx.arc(centerX, centerY, masterCircleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = planetTheme.secondary;
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.shadowColor = planetTheme.aura;
        ctx.shadowBlur = 15;
        ctx.font = '42px BeVietnamPro';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(data.master, centerX, centerY + masterCircleRadius + 50);

        ctx.shadowBlur = 5;
        ctx.font = '24px Arial';
        ctx.fillText(data.masterDescription, centerX, centerY + masterCircleRadius + 90);
        ctx.shadowBlur = 0;

        // Draw player info panel with stylish design
        const infoY = centerY + masterCircleRadius + 120;
        const infoHeight = 100;

        // Draw player info background with gradient
        const infoGradient = ctx.createLinearGradient(0, infoY, canvasWidth, infoY);
        infoGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        infoGradient.addColorStop(0.5, `rgba(${parseInt(planetTheme.primary.slice(1, 3), 16)}, ${parseInt(planetTheme.primary.slice(3, 5), 16)}, ${parseInt(planetTheme.primary.slice(5, 7), 16)}, 0.4)`);
        infoGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

        ctx.fillStyle = infoGradient;
        ctx.fillRect(20, infoY, canvasWidth - 40, infoHeight);

        // Add border to player info
        ctx.strokeStyle = planetTheme.secondary;
        ctx.lineWidth = 3;
        ctx.strokeRect(20, infoY, canvasWidth - 40, infoHeight);

        // Draw player name and power with icons
        ctx.font = '30px BeVietnamPro';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`👤 Player: ${data.playerName}`, 40, infoY + 40);

        // Power with animation effect (dots)
        ctx.fillText(`💪 Power: ${data.playerPower.toLocaleString()}`, 40, infoY + 80);

        // Draw skills section header
        const skillsHeaderY = infoY + infoHeight + 30;

        ctx.fillStyle = planetTheme.primary;
        ctx.fillRect(0, skillsHeaderY, canvasWidth, 50);

        ctx.font = '32px BeVietnamPro';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('AVAILABLE SKILLS', centerX, skillsHeaderY + 35);

        // Draw skills with improved styling
        const skillStartY = skillsHeaderY + 70;
        const skillHeight = 130;
        const skillGap = 10;
        const skillWidth = canvasWidth - 40;

        ctx.textAlign = 'left';

        for (let i = 0; i < data.skills.length; i++) {
            const skill = data.skills[i];
            const y = skillStartY + i * (skillHeight + skillGap);
            
            // Đã loại bỏ điều kiện if (y + skillHeight > canvasHeight - 100) break;
            
            // Draw skill panel with glass-like effect
            ctx.fillStyle = skill.isLearned ?
                `rgba(0, 100, 0, ${i % 2 === 0 ? 0.7 : 0.8})` :
                skill.canLearn ?
                    `rgba(40, 40, 100, ${i % 2 === 0 ? 0.7 : 0.8})` :
                    `rgba(100, 20, 20, ${i % 2 === 0 ? 0.7 : 0.8})`;

            // Rounded rectangle for skill background
            roundRect(ctx, 20, y, skillWidth, skillHeight, 10);
            

            // Skill header (number and name)
            const headerGrad = ctx.createLinearGradient(20, y, skillWidth + 20, y);
            headerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
            headerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

            ctx.fillStyle = headerGrad;
            roundRect(ctx, 20, y, skillWidth, 40, { tl: 10, tr: 10, bl: 0, br: 0 });

            // Skill number with circle background
            ctx.beginPath();
            ctx.arc(45, y + 20, 18, 0, Math.PI * 2);
            ctx.fillStyle = skill.isLearned ? '#00CC00' : skill.canLearn ? '#0088FF' : '#CC0000';
            ctx.fill();

            ctx.font = '20px BeVietnamPro';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, 45, y + 27);
            ctx.textAlign = 'left';

            // Draw skill name with glow effect based on status
            ctx.shadowColor = skill.isLearned ? '#00FF00' : skill.canLearn ? '#00AAFF' : '#FF4444';
            ctx.shadowBlur = 10;
            ctx.font = '26px BeVietnamPro';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(skill.name, 75, y + 27);
            ctx.shadowBlur = 0;

            // Status indicator right-aligned
            ctx.textAlign = 'right';
            ctx.font = '22px BeVietnamPro';
            if (skill.isLearned) {
                ctx.fillStyle = '#00FF00';
                ctx.fillText('✅ LEARNED', canvasWidth - 40, y + 27);
            } else if (skill.canLearn) {
                ctx.fillStyle = '#FFFF00';
                ctx.fillText('⭐ AVAILABLE', canvasWidth - 40, y + 27);
            } else {
                ctx.fillStyle = '#FF6666';
                ctx.fillText('🔒 LOCKED', canvasWidth - 40, y + 27);
            }
            ctx.textAlign = 'left';

            // Draw skill description
            ctx.font = '20px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(skill.description, 40, y + 70);

            // Draw power required with icon
            ctx.fillStyle = skill.canLearn ? '#00FF00' : '#FF6666';
            ctx.font = '20px BeVietnamPro';
            ctx.fillText(`💪 Required Power: ${skill.powerRequired.toLocaleString()}`, 40, y + 100);

            // Draw Ki cost/damage with themed colors
            let kiInfo = skill.kiCost < 0
                ? `+${Math.abs(Math.floor(data.playerKi * skill.kiCost)).toLocaleString()} Ki`
                : `-${Math.floor(data.playerKi * skill.kiCost).toLocaleString()} Ki`;

            if (skill.powerScale > 0) {
                const damage = Math.floor(data.playerDamage * skill.powerScale).toLocaleString();
                ctx.fillStyle = '#80FFFF';
                ctx.fillText(`⚡ Damage: ${damage} | ✨ ${kiInfo}`, 40, y + 130);
            } else {
                ctx.fillStyle = '#80FFFF';
                ctx.fillText(`🔮 Effect Skill | ✨ ${kiInfo}`, 40, y + 130);
            }

            // Add small icon showing skill type
            const iconSize = 50;
            const skillType = skill.powerScale > 0 ? "attack" : "support";
            ctx.fillStyle = skillType === "attack" ? '#FF6666' : '#66FF66';
            ctx.beginPath();
            ctx.arc(canvasWidth - 60, y + 100, iconSize / 2, 0, Math.PI * 2);
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '30px BeVietnamPro';
            ctx.fillText(skillType === "attack" ? "⚔️" : "🛡️", canvasWidth - 60, y + 110);
            ctx.textAlign = 'left';
        }

        // Draw footer with dragon theme
        const lastSkillBottomY = skillStartY + data.skills.length * (skillHeight + skillGap);
        const footerY = Math.max(lastSkillBottomY + 30, canvasHeight - 100);
        

        // Dragon-themed footer gradient
        const footerGradient = ctx.createLinearGradient(0, footerY, 0, footerY + 100);
        footerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        footerGradient.addColorStop(1, planetTheme.accent);

        ctx.fillStyle = footerGradient;
        ctx.fillRect(0, footerY, canvasWidth, 100);

        // Footer text
        ctx.font = '28px BeVietnamPro';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('Dùng: .dball learn <số thứ tự> để học kỹ năng', canvasWidth / 2, footerY + 55);
        
        // Save canvas to image file
        const dir = path.join(__dirname, "cache");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const imagePath = path.join(dir, `learn_${data.playerID}_${Date.now()}.jpg`);
        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createJPEGStream({ quality: 0.95 });
        stream.pipe(out);

        return new Promise((resolve, reject) => {
            out.on('finish', () => resolve(imagePath));
            out.on('error', reject);
        });
    } catch (error) {
        console.error("Error creating learn image:", error);
        return null;
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    ctx.fill();
}

module.exports = createLearnImage;