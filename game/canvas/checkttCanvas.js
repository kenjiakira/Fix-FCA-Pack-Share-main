const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

/**
 * Create a beautiful visualization of group interaction statistics
 * @param {Array} memberStats - Array of member statistics objects
 * @param {String} threadID - ID of the thread
 * @param {String} threadName - Name of the thread/group
 * @param {String} senderID - ID of the command sender
 * @param {Object} userAvatars - Mapping of user IDs to avatar paths
 * @returns {Promise<String>} - Path to the generated image
 */
async function createCheckTTCanvas(memberStats, threadID, threadName, senderID, userAvatars = {}) {
    try {
        // Canvas dimensions
        const width = 800;
        const height = Math.min(1200, 200 + (memberStats.length * 90) + 150); // Adjust height based on number of members
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Create stunning gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0d47a1");  // Deep blue
        gradient.addColorStop(0.5, "#303f9f"); // Indigo
        gradient.addColorStop(1, "#1a237e");  // Dark blue
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add decorative stars/particles for elegant look
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add subtle grid pattern
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const offset = i * 100;
            ctx.beginPath();
            ctx.moveTo(0, offset);
            ctx.lineTo(width, offset);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(offset, 0);
            ctx.lineTo(offset, height);
            ctx.stroke();
        }

        // Header section with gradient
        const headerGradient = ctx.createLinearGradient(0, 0, width, 150);
        headerGradient.addColorStop(0, "rgba(26, 35, 126, 0.9)");  // Dark blue
        headerGradient.addColorStop(1, "rgba(40, 53, 147, 0.9)");  // Indigo
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, width, 150);

        // Add golden decorative corners
        const cornerSize = 40;
        const drawCorner = (x, y, flipX, flipY) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            ctx.strokeStyle = "#64b5f6";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(cornerSize, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, cornerSize);
            ctx.stroke();
            ctx.restore();
        };

        drawCorner(50, 50, false, false);
        drawCorner(width - 50, 50, true, false);
        drawCorner(50, height - 50, false, true);
        drawCorner(width - 50, height - 50, true, true);

        // Title with glow effect
        ctx.shadowColor = "rgba(33, 150, 243, 0.7)";
        ctx.shadowBlur = 15;
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("THỐNG KÊ TƯƠNG TÁC NHÓM", width / 2, 70);
        
        // Group name with shadow
        ctx.font = "italic 24px Arial";
        ctx.shadowBlur = 8;
        
        // Truncate group name if too long
        let displayName = threadName || "Nhóm Chat";
        if (ctx.measureText(displayName).width > width - 100) {
            while (ctx.measureText(displayName + '...').width > width - 100 && displayName.length > 0) {
                displayName = displayName.slice(0, -1);
            }
            displayName += '...';
        }
        
        ctx.fillText(displayName, width / 2, 110);
        ctx.shadowBlur = 0;

        // Draw decorative line
        const lineGradient = ctx.createLinearGradient(100, 135, width - 100, 135);
        lineGradient.addColorStop(0, "rgba(100, 181, 246, 0.2)");
        lineGradient.addColorStop(0.5, "rgba(100, 181, 246, 1)");
        lineGradient.addColorStop(1, "rgba(100, 181, 246, 0.2)");
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(100, 135);
        ctx.lineTo(width - 100, 135);
        ctx.stroke();

        // Column headers
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Thứ hạng", 60, 180);
        ctx.fillText("Thành viên", 220, 180);
        ctx.textAlign = "right";
        ctx.fillText("Tin nhắn", width - 60, 180);
        
        // Draw thin line under headers
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.moveTo(50, 190);
        ctx.lineTo(width - 50, 190);
        ctx.stroke();

        // List entries
        let startY = 220;
        const rowHeight = 80;
        const maxEntriesToShow = Math.min(memberStats.length, 15); // Limit entries to avoid overly large image

        // Define rank colors
        const rankColors = [
            "#FFD700", // Gold
            "#C0C0C0", // Silver
            "#CD7F32", // Bronze
            "rgba(255, 255, 255, 0.7)" // Others
        ];

        for (let i = 0; i < maxEntriesToShow; i++) {
            const member = memberStats[i];
            
            // Card background with gradient
            const cardGradient = ctx.createLinearGradient(50, startY - 15, width - 50, startY + 45);
            
            if (i < 3) {
                cardGradient.addColorStop(0, `rgba(${i === 0 ? '255, 215, 0' : i === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.2)`);
                cardGradient.addColorStop(1, `rgba(${i === 0 ? '255, 215, 0' : i === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.05)`);
            } else {
                cardGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
                cardGradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");
            }
            
            ctx.fillStyle = cardGradient;
            ctx.fillRect(50, startY - 15, width - 100, rowHeight);

            // Highlight current user
            if (member.userID === senderID) {
                ctx.save();
                ctx.shadowColor = "#64b5f6";
                ctx.shadowBlur = 10;
                ctx.strokeStyle = "#64b5f6";
                ctx.lineWidth = 2;
                ctx.strokeRect(50, startY - 15, width - 100, rowHeight);
                ctx.restore();
            } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 1;
                ctx.strokeRect(50, startY - 15, width - 100, rowHeight);
            }

            // Rank circle with 3D effect
            ctx.beginPath();
            ctx.arc(90, startY + 25, 25, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(90, startY + 25, 25, 0, Math.PI * 2);
            
            const circleGradient = ctx.createRadialGradient(
                85, startY + 20, 5,
                90, startY + 25, 25
            );
            
            if (i < 3) {
                const baseColor = i === 0 ? [255, 215, 0] : i === 1 ? [192, 192, 192] : [205, 127, 50];
                circleGradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 1)`);
                circleGradient.addColorStop(0.7, `rgba(${baseColor[0]*0.8}, ${baseColor[1]*0.8}, ${baseColor[2]*0.8}, 1)`);
                circleGradient.addColorStop(1, `rgba(${baseColor[0]*0.6}, ${baseColor[1]*0.6}, ${baseColor[2]*0.6}, 1)`);
            } else {
                circleGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
                circleGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
            }
            
            ctx.fillStyle = circleGradient;
            ctx.fill();
            
            // Add rank number
            const medals = ["🥇", "🥈", "🥉"];
            ctx.fillStyle = i < 3 ? "#000000" : "#FFFFFF";
            ctx.font = i < 3 ? 'bold 26px Arial' : 'bold 22px Arial';
            ctx.textAlign = 'center';
            
            if (i < 3) {
                ctx.fillText(medals[i], 90, startY + 35);
            } else {
                ctx.fillText((i + 1).toString(), 90, startY + 33);
            }

            // Try to draw user avatar
            try {
                let avatar;
                
                // Try to load user avatar
                if (userAvatars[member.userID]) {
                    try {
                        avatar = await loadImage(userAvatars[member.userID]);
                    } catch (avatarError) {
                        console.error(`Error loading avatar for ${member.userID}:`, avatarError);
                        // Use default avatar if can't load
                        const defaultAvatarPath = path.join(__dirname, '../../commands/cache/avatar.jpg');
                        if (fs.existsSync(defaultAvatarPath)) {
                            avatar = await loadImage(defaultAvatarPath);
                        }
                    }
                } else {
                    // Use default avatar if no avatar in userAvatars
                    const defaultAvatarPath = path.join(__dirname, '../../commands/cache/avatar.jpg');
                    if (fs.existsSync(defaultAvatarPath)) {
                        avatar = await loadImage(defaultAvatarPath);
                    }
                }
                
                // Draw avatar if available
                if (avatar) {
                    ctx.save();
                    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    // Create circular clip for avatar
                    ctx.beginPath();
                    ctx.arc(150, startY + 25, 25, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    
                    // Draw user avatar
                    ctx.drawImage(avatar, 125, startY, 50, 50);
                    ctx.restore();
                    
                    // Draw border around avatar
                    ctx.strokeStyle = i < 3 ? rankColors[i] : '#64b5f6';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(150, startY + 25, 25, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } catch (error) {
                console.error(`Error processing avatar for ${member.userID}:`, error);
            }

            // Username with shadow
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 3;
            ctx.font = "bold 22px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            
            // Truncate long names
            let displayName = member.name;
            if (ctx.measureText(displayName).width > 300) {
                while (ctx.measureText(displayName + '...').width > 300 && displayName.length > 0) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '...';
            }
            
            ctx.fillText(displayName, 190, startY + 20);
            ctx.restore();

            // Display message count
            const messageGradient = ctx.createLinearGradient(width - 200, startY + 20, width - 60, startY + 20);
            
            if (i < 3) {
                // Gold, silver, bronze gradients for top 3
                if (i === 0) {
                    messageGradient.addColorStop(0, "#ffeb3b"); // Yellow
                    messageGradient.addColorStop(1, "#ffd700"); // Gold
                } else if (i === 1) {
                    messageGradient.addColorStop(0, "#e0e0e0"); // Light grey
                    messageGradient.addColorStop(1, "#c0c0c0"); // Silver
                } else {
                    messageGradient.addColorStop(0, "#d7ccc8"); // Light brown
                    messageGradient.addColorStop(1, "#cd7f32"); // Bronze
                }
            } else {
                // Blue gradient for others
                messageGradient.addColorStop(0, "#64b5f6"); // Light blue
                messageGradient.addColorStop(1, "#42a5f5"); // Blue
            }
            
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;
            ctx.font = "bold 22px Arial";
            ctx.fillStyle = messageGradient;
            ctx.textAlign = "right";
            
            // Format message count with commas
            const formattedCount = member.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            ctx.fillText(`${formattedCount} tin nhắn`, width - 70, startY + 20);
            ctx.restore();
            
            // Display level if available
            if (member.level && member.level > 1) {
                ctx.save();
                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 3;
                ctx.font = "20px Arial";
                ctx.fillStyle = "#64ffda"; // Teal color
                ctx.textAlign = "left";
                ctx.fillText(`⭐ Level ${member.level}`, 190, startY + 45);
                ctx.restore();
            }
            
            startY += rowHeight + 10;
        }

        // Show count of additional members not displayed
        if (memberStats.length > maxEntriesToShow) {
            ctx.font = "italic 20px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.textAlign = "center";
            ctx.fillText(`+ ${memberStats.length - maxEntriesToShow} thành viên khác`, width / 2, startY);
        }

        // Footer with gradient
        const footerHeight = 70;
        const footerY = height - footerHeight;
        const footerGradient = ctx.createLinearGradient(0, footerY, width, height);
        footerGradient.addColorStop(0, "rgba(25, 118, 210, 0.9)");
        footerGradient.addColorStop(1, "rgba(21, 101, 192, 0.9)");
        ctx.fillStyle = footerGradient;
        ctx.fillRect(0, footerY, width, footerHeight);

        // AKI Global branding
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("AKI GLOBAL", width / 2, height - 35);
        
        // Timestamp with gradient
        const subtitleGradient = ctx.createLinearGradient(width/2 - 150, height - 15, width/2 + 150, height - 15);
        subtitleGradient.addColorStop(0, "#64b5f6");
        subtitleGradient.addColorStop(1, "#42a5f5");
        ctx.font = "italic 18px Arial";
        ctx.fillStyle = subtitleGradient;
        ctx.fillText(`Cập nhật: ${new Date().toLocaleString("vi-VN")}`, width / 2, height - 15);

        // Save and return image
        const buffer = canvas.toBuffer("image/png");
        const tempDir = path.join(__dirname, "../../temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `checktt_${threadID}_${Date.now()}.png`);
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    } catch (error) {
        console.error("Error creating checktt image:", error);
        throw error;
    }
}

/**
 * Get user avatar image from Facebook or cache
 * @param {String} userId - User ID
 * @returns {Promise<String>} - Path to avatar image
 */
async function getAvatarPath(userId) {
    try {
        const cacheDir = path.join(__dirname, "../../commands/cache/avatars");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // Check cache first
        const avatarPath = path.join(cacheDir, `${userId}.jpg`);
        const metadataPath = path.join(cacheDir, `${userId}.meta`);
        
        if (fs.existsSync(avatarPath) && fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
            const cacheAge = Date.now() - metadata.timestamp;
            
            if (cacheAge < 24 * 60 * 60 * 1000) {
                return avatarPath; // Use cached avatar if not expired
            }
        }

        // Check if default avatar exists
        const defaultAvatarPath = path.join(__dirname, '../../commands/cache/avatar.jpg');
        const defaultAvatarExists = fs.existsSync(defaultAvatarPath);

        // Try to get avatar from Facebook Graph API
        try {
            const avatarUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            const response = await axios.get(avatarUrl, { 
                responseType: 'arraybuffer',
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                }
            });
            
            fs.writeFileSync(avatarPath, response.data);
            fs.writeFileSync(metadataPath, JSON.stringify({ timestamp: Date.now() }));
            
            return avatarPath;
        } catch (apiError) {
            console.error(`Error getting avatar for ${userId} from API:`, apiError.message);
            
            if (defaultAvatarExists) {
                return defaultAvatarPath;
            } else {
                throw new Error("Default avatar not found");
            }
        }
    } catch (error) {
        console.error(`Error in getAvatarPath for ${userId}:`, error.message);
        
        // Always return default avatar if available
        const defaultAvatarPath = path.join(__dirname, '../../commands/cache/avatar.jpg');
        if (fs.existsSync(defaultAvatarPath)) {
            return defaultAvatarPath;
        }
        return null;
    }
}

module.exports = {
    createCheckTTCanvas,
    getAvatarPath
};