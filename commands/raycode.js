const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const fontsDir = path.join(__dirname, '..', 'fonts');
registerFont(path.join(fontsDir, 'ChakraPetch-Bold.ttf'), { family: 'ChakraPetch Bold' });
registerFont(path.join(fontsDir, 'JetBrainsMono-Regular.ttf'), { family: 'JetBrainsMono-Regular' });
registerFont(path.join(fontsDir, 'JetBrainsMono-Bold.ttf'), { family: 'JetBrainsMono' });
registerFont(path.join(fontsDir, 'BeVietnamPro-Medium.ttf'), { family: 'BeVietnamPro Medium' });
registerFont(path.join(fontsDir, 'BeVietnamPro-Bold.ttf'), { family: 'BeVietnamPro Bold' });

module.exports = {
    name: "raycode",
    info: "Tạo ảnh đẹp từ code với nhiều theme khác nhau",
    dev: "HNT",
    category: "Tiện Ích",
    usedby: 0,
    onPrefix: true,
    dmUser: true,
    usages: "[theme] hoặc reply message chứa code\n- Themes: candy, breeze, midnight, sunset, oceanic, matrix, jam, nord, zen, monochrome",
    cooldowns: 5,

    themes: {
        "candy": {
            background: "#c9437d",
            foreground: "#ffffff",
            accent: "#ff7ab2",
            codeBg: "rgba(201, 67, 125, 0.3)",
            gradientFrom: "#c9437d",
            gradientTo: "#b82b66"
        },
        "breeze": {
            background: "#0099ff",
            foreground: "#ffffff",
            accent: "#71c6ff",
            codeBg: "rgba(0, 153, 255, 0.2)",
            gradientFrom: "#0099ff",
            gradientTo: "#0077cc"
        },
        "midnight": {
            background: "#1f1f1f",
            foreground: "#ffffff",
            accent: "#5865f2",
            codeBg: "rgba(31, 31, 31, 0.7)",
            gradientFrom: "#1f1f1f",
            gradientTo: "#121212"
        },
        "sunset": {
            background: "#ff5722",
            foreground: "#ffffff",
            accent: "#ffb74d",
            codeBg: "rgba(255, 87, 34, 0.2)",
            gradientFrom: "#ff5722",
            gradientTo: "#e64a19"
        },
        "oceanic": {
            background: "#16697a",
            foreground: "#ffffff",
            accent: "#82c0cc",
            codeBg: "rgba(22, 105, 122, 0.3)",
            gradientFrom: "#16697a",
            gradientTo: "#0e4f5d"
        },
        "matrix": {
            background: "#000000",
            foreground: "#00ff00",
            accent: "#88ff88",
            codeBg: "rgba(0, 0, 0, 0.85)",
            gradientFrom: "#000000",
            gradientTo: "#0a1a0a"
        },
        "jam": {
            background: "#590d82",
            foreground: "#ffffff",
            accent: "#a45ee5",
            codeBg: "rgba(89, 13, 130, 0.3)",
            gradientFrom: "#590d82",
            gradientTo: "#3d0a58"
        },
        "nord": {
            background: "#2e3440",
            foreground: "#eceff4",
            accent: "#88c0d0",
            codeBg: "rgba(46, 52, 64, 0.7)",
            gradientFrom: "#2e3440",
            gradientTo: "#232830"
        },
        "zen": {
            background: "#f5f5f5",
            foreground: "#333333",
            accent: "#5da271",
            codeBg: "rgba(245, 245, 245, 0.6)",
            gradientFrom: "#f5f5f5",
            gradientTo: "#e0e0e0"
        },
        "monochrome": {
            background: "#ffffff",
            foreground: "#000000",
            accent: "#666666",
            codeBg: "rgba(255, 255, 255, 0.7)",
            gradientFrom: "#ffffff",
            gradientTo: "#f0f0f0"
        }
    },
    syntaxRules: {
        keywords: {
            pattern: /\b(function|return|if|else|for|while|break|continue|var|let|const|class|import|export|try|catch|switch|case|default|throw|new|this|typeof|instanceof|in|of|async|await|null|undefined|true|false)\b/g,
            color: "#FF79C6"
        },
        strings: {
            pattern: /(['"`])(.*?)\1/g,
            color: "#F1FA8C"
        },
        numbers: {
            pattern: /\b(\d+(\.\d+)?)\b/g,
            color: "#BD93F9"
        },
        comments: {
            pattern: /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm,
            color: "#6272A4"
        },
        functions: {
            pattern: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            color: "#50FA7B"
        },
        properties: {
            pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            color: "#8BE9FD"
        },
        brackets: {
            pattern: /[[\]{}()]/g,
            color: "#F8F8F2"
        },
        operators: {
            pattern: /[+\-*/%=&|^<>!?:]+/g,
            color: "#FF9580"
        }
    },

    hexToRgba(hex, alpha = 1) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    enhanceColor(hex) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        const factor = 1.2;

        r = Math.min(255, Math.floor(r * factor));
        g = Math.min(255, Math.floor(g * factor));
        b = Math.min(255, Math.floor(b * factor));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },

    detectLanguage(code) {

        if (code.includes('<?php')) return 'php';
        if (code.includes('import') && code.includes('from')) return 'python';
        if (code.includes('function') || code.includes('var') || code.includes('const')) return 'javascript';
        if (code.includes('class') && code.includes('public')) return 'java';
        if (code.includes('#include')) return 'cpp';
        return 'text';
    },


    applySyntaxHighlighting(text, theme) {

        const tokens = [{ text: text, color: theme.foreground }];


        Object.values(this.syntaxRules).forEach(rule => {
            const newTokens = [];


            tokens.forEach(token => {

                if (token.color !== theme.foreground) {
                    newTokens.push(token);
                    return;
                }

                let lastIndex = 0;
                let match;


                rule.pattern.lastIndex = 0;


                while ((match = rule.pattern.exec(token.text)) !== null) {

                    if (match.index > lastIndex) {
                        newTokens.push({
                            text: token.text.substring(lastIndex, match.index),
                            color: theme.foreground
                        });
                    }


                    newTokens.push({
                        text: match[0],
                        color: rule.color
                    });

                    lastIndex = match.index + match[0].length;
                }


                if (lastIndex < token.text.length) {
                    newTokens.push({
                        text: token.text.substring(lastIndex),
                        color: theme.foreground
                    });
                }
            });


            if (newTokens.length > 0) {
                tokens.length = 0;
                tokens.push(...newTokens);
            }
        });

        return tokens;
    },


    drawSyntaxHighlightedLine(ctx, line, x, y, theme) {
        const tokens = this.applySyntaxHighlighting(line, theme);
        let currentX = x;

        tokens.forEach(token => {
            ctx.fillStyle = token.color;
            ctx.fillText(token.text, currentX, y);
            currentX += ctx.measureText(token.text).width;
        });
    },

    drawTextWithShadow(ctx, text, x, y, color, shadowColor = "rgba(0,0,0,0.5)", shadowBlur = 3, shadowOffsetX = 2, shadowOffsetY = 2) {
        ctx.save();
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    drawGradientText(ctx, text, x, y, gradient) {
        ctx.save();
        ctx.font = ctx.font;
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID, type } = event;

        try {
            const cachePath = path.join(__dirname, 'cache');
            if (!fs.existsSync(cachePath)) {
                fs.mkdirSync(cachePath, { recursive: true });
            }

            let code, themeName;

            themeName = target[0]?.toLowerCase() || "midnight";
            if (!this.themes[themeName]) {
                themeName = "midnight";
            }

            if (type === "message_reply") {
                code = event.messageReply.body;
            } else {
                code = target.slice(1).join(" ");
            }

            if (!code || code.trim().length === 0) {
                return api.sendMessage({
                    body: "⚠️ Vui lòng cung cấp mã nguồn để tạo ảnh!\n" +
                        "Cách dùng:\n" +
                        "1. Reply tin nhắn chứa code + raycode [theme]\n" +
                        "2. raycode [theme] [code]\n\n" +
                        "Themes: candy, breeze, midnight, sunset, oceanic, matrix, jam, nord, zen, monochrome"
                }, threadID, messageID);
            }

            const loadingMessage = await api.sendMessage("⏳ Đang tạo ảnh từ code...", threadID);

            const outputPath = await this.createCodeImage(code, themeName);

            api.sendMessage({
                body: `🎨 Code Image with ${themeName} theme`,
                attachment: fs.createReadStream(outputPath)
            }, threadID, () => {
                fs.unlinkSync(outputPath);
                api.unsendMessage(loadingMessage.messageID);
            }, messageID);

        } catch (error) {
            console.error("RayCode Error:", error);
            return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, threadID, messageID);
        }
    },

    async createCodeImage(code, themeName) {
        const theme = this.themes[themeName];


        const padding = 60;
        const codeLineHeight = 24;
        const fontSize = 15;
        const headerHeight = 50;
        const footerHeight = 40;
        const maxCharsPerLine = 100;
        const lineNumberWidth = 40;
        const borderRadius = 12;

        const processedLines = [];
        code.split('\n').forEach(line => {
            if (line.length > maxCharsPerLine) {

                const breakPoints = [' ', ',', ';', '{', '}', '(', ')', '[', ']'];
                let currentIndex = 0;

                while (currentIndex < line.length) {
                    let cutPoint = Math.min(currentIndex + maxCharsPerLine, line.length);


                    if (cutPoint < line.length) {

                        for (let i = cutPoint; i > currentIndex + maxCharsPerLine / 2; i--) {
                            if (breakPoints.includes(line[i])) {
                                cutPoint = i + 1;
                                break;
                            }
                        }
                    }


                    let segment = line.substring(currentIndex, cutPoint);


                    if (currentIndex > 0) {
                        segment = "    " + segment;
                    }

                    processedLines.push(segment);
                    currentIndex = cutPoint;
                }
            } else {
                processedLines.push(line);
            }
        });

        const lines = processedLines;


        const maxLineLength = Math.max(...lines.map(line => line.length));


        let dynamicFontSize = fontSize;
        if (maxLineLength > 120) {
            dynamicFontSize = 13;
        } else if (maxLineLength > 80) {
            dynamicFontSize = 14;
        }


        const hasLongLines = lines.some(line => line.length > maxCharsPerLine);


        const lineWidthMultiplier = 7.5;
        const maxWidth = 900;

        let width = Math.min(maxWidth, Math.max(600, maxLineLength * lineWidthMultiplier + padding * 2));
        const height = Math.max(300, lines.length * codeLineHeight + headerHeight + footerHeight + padding);


        const aspectRatio = width / height;
        if (aspectRatio > 2) {
            width = height * 2;
        } else if (aspectRatio < 1) {
            width = Math.max(width, height * 1);
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const language = this.detectLanguage(code);

        const mainGradient = ctx.createLinearGradient(0, 0, width, height);
        mainGradient.addColorStop(0, theme.gradientFrom || theme.background);
        mainGradient.addColorStop(1, theme.gradientTo || this.adjustColor(theme.background, -30));

        ctx.fillStyle = mainGradient;
        ctx.fillRect(0, 0, width, height);

        const radialGradient = ctx.createRadialGradient(
            width * 0.8, height * 0.2, width * 0.1,
            width * 0.8, height * 0.2, width * 0.6
        );
        radialGradient.addColorStop(0, this.hexToRgba(this.adjustColor(theme.background, 40), 0.3));
        radialGradient.addColorStop(1, this.hexToRgba(theme.background, 0));

        ctx.fillStyle = radialGradient;
        ctx.fillRect(0, 0, width, height);

        const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
        headerGradient.addColorStop(0, this.adjustColor(theme.background, -10));
        headerGradient.addColorStop(1, this.adjustColor(theme.background, -30));

        ctx.fillStyle = headerGradient;
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(width - borderRadius, 0);
        ctx.arcTo(width, 0, width, borderRadius, borderRadius);
        ctx.lineTo(width, headerHeight - borderRadius);
        ctx.arcTo(width, headerHeight, width - borderRadius, headerHeight, borderRadius);
        ctx.lineTo(borderRadius, headerHeight);
        ctx.arcTo(0, headerHeight, 0, headerHeight - borderRadius, borderRadius);
        ctx.lineTo(0, borderRadius);
        ctx.arcTo(0, 0, borderRadius, 0, borderRadius);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        const codeAreaX = padding - lineNumberWidth - 10;
        const codeAreaY = headerHeight + 5;
        const codeAreaWidth = width - (padding * 2) + lineNumberWidth + 20;
        const codeAreaHeight = height - headerHeight - footerHeight - 10;

        ctx.clearRect(codeAreaX, codeAreaY, codeAreaWidth, codeAreaHeight);

        const codeGradient = ctx.createLinearGradient(
            codeAreaX, codeAreaY, 
            codeAreaX + codeAreaWidth, codeAreaY + codeAreaHeight
        );
        codeGradient.addColorStop(0, theme.codeBg || this.hexToRgba(theme.background, 0.5));
        codeGradient.addColorStop(0.5, this.hexToRgba(this.adjustColor(theme.background, -10), 0.55));
        codeGradient.addColorStop(1, this.hexToRgba(this.adjustColor(theme.background, -20), 0.6));

        ctx.fillStyle = codeGradient;
        ctx.beginPath();
        ctx.moveTo(codeAreaX + borderRadius, codeAreaY);
        ctx.lineTo(codeAreaX + codeAreaWidth - borderRadius, codeAreaY);
        ctx.arcTo(codeAreaX + codeAreaWidth, codeAreaY, codeAreaX + codeAreaWidth, codeAreaY + borderRadius, borderRadius);
        ctx.lineTo(codeAreaX + codeAreaWidth, codeAreaY + codeAreaHeight - borderRadius);
        ctx.arcTo(codeAreaX + codeAreaWidth, codeAreaY + codeAreaHeight, codeAreaX + codeAreaWidth - borderRadius, codeAreaY + codeAreaHeight, borderRadius);
        ctx.lineTo(codeAreaX + borderRadius, codeAreaY + codeAreaHeight);
        ctx.arcTo(codeAreaX, codeAreaY + codeAreaHeight, codeAreaX, codeAreaY + codeAreaHeight - borderRadius, borderRadius);
        ctx.lineTo(codeAreaX, codeAreaY + borderRadius);
        ctx.arcTo(codeAreaX, codeAreaY, codeAreaX + borderRadius, codeAreaY, borderRadius);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = this.hexToRgba(this.adjustColor(theme.background, 40), 0.6);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const titleGradient = ctx.createLinearGradient(
            width / 2 - 150, headerHeight / 2,
            width / 2 + 150, headerHeight / 2
        );
        titleGradient.addColorStop(0, this.adjustColor(theme.foreground, -10));
        titleGradient.addColorStop(0.5, theme.foreground);
        titleGradient.addColorStop(1, this.adjustColor(theme.foreground, -10));

        ctx.font = `bold ${dynamicFontSize+2}px "ChakraPetch Bold"`;
        this.drawTextWithShadow(
            ctx,
            `${language.toUpperCase()} Code • ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme`,
            width / 2 - 150,
            headerHeight / 2 + 5,
            titleGradient,
            'rgba(0,0,0,0.4)',
            2,
            1,
            1
        );

        const buttonColors = [
            ["#FF5F56", "#FF3830"],
            ["#FFBD2E", "#FFAC00"],
            ["#27C93F", "#1AAB2F"]
        ];

        for (let i = 0; i < 3; i++) {
            const buttonGradient = ctx.createLinearGradient(
                20 + i * 25, headerHeight / 2 - 8,
                20 + i * 25, headerHeight / 2 + 8
            );
            buttonGradient.addColorStop(0, buttonColors[i][0]);
            buttonGradient.addColorStop(1, buttonColors[i][1]);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = buttonGradient;
            ctx.beginPath();
            ctx.arc(20 + i * 25, headerHeight / 2, 8, 0, Math.PI * 2);
            ctx.fill();

            const highlightGradient = ctx.createRadialGradient(
                20 + i * 25, headerHeight / 2 - 3, 1,
                20 + i * 25, headerHeight / 2 - 3, 6
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = highlightGradient;
            ctx.beginPath();
            ctx.arc(20 + i * 25, headerHeight / 2 - 1, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = 'transparent';
        }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        const dividerGradient = ctx.createLinearGradient(
            padding - 40, headerHeight + 10,
            width - padding + 20, headerHeight + 10
        );
        dividerGradient.addColorStop(0, this.hexToRgba(this.adjustColor(theme.background, -30), 0.3));
        dividerGradient.addColorStop(0.5, this.hexToRgba(theme.accent, 0.5));
        dividerGradient.addColorStop(1, this.hexToRgba(this.adjustColor(theme.background, -30), 0.3));

        ctx.strokeStyle = dividerGradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding - 40, headerHeight + 10);
        ctx.lineTo(width - padding + 20, headerHeight + 10);
        ctx.stroke();

        ctx.shadowColor = 'transparent';

        const lineNumberGradient = ctx.createLinearGradient(
            padding - lineNumberWidth, headerHeight,
            padding, headerHeight + codeAreaHeight/2
        );
        lineNumberGradient.addColorStop(0, this.hexToRgba(this.adjustColor(theme.background, -25), 0.9));
        lineNumberGradient.addColorStop(1, this.hexToRgba(this.adjustColor(theme.background, -15), 0.8));

        ctx.fillStyle = lineNumberGradient;
        ctx.beginPath();
        ctx.moveTo(codeAreaX + borderRadius, codeAreaY);
        ctx.lineTo(padding, codeAreaY);
        ctx.lineTo(padding, codeAreaY + codeAreaHeight);
        ctx.lineTo(codeAreaX + borderRadius, codeAreaY + codeAreaHeight);
        ctx.arcTo(codeAreaX, codeAreaY + codeAreaHeight, codeAreaX, codeAreaY + codeAreaHeight - borderRadius, borderRadius);
        ctx.lineTo(codeAreaX, codeAreaY + borderRadius);
        ctx.arcTo(codeAreaX, codeAreaY, codeAreaX + borderRadius, codeAreaY, borderRadius);
        ctx.closePath();
        ctx.fill();

        lines.forEach((line, index) => {
            ctx.font = `bold ${fontSize}px "BeVietnamPro Bold"`;

            const lineNumberTextGradient = ctx.createLinearGradient(
                padding - lineNumberWidth + 5, 0,
                padding - 5, 0
            );
            lineNumberTextGradient.addColorStop(0, this.adjustColor(theme.accent, -20));
            lineNumberTextGradient.addColorStop(1, this.enhanceColor(theme.accent));

            ctx.fillStyle = lineNumberTextGradient;
            ctx.textAlign = "right";
            ctx.fillText(
                `${index + 1}`, 
                padding - 8, 
                headerHeight + 30 + index * codeLineHeight
            );
            ctx.textAlign = "left";

            ctx.font = `${fontSize}px "JetBrainsMono"`;

            const tokens = this.applySyntaxHighlighting(line, theme);
            let currentX = padding;

            tokens.forEach(token => {
                const enhancedColor = token.color === theme.foreground ? 
                    theme.foreground : this.enhanceColor(token.color);

                this.drawTextWithShadow(
                    ctx,
                    token.text,
                    currentX,
                    headerHeight + 30 + index * codeLineHeight,
                    enhancedColor,
                    'rgba(0,0,0,0.3)',
                    1,
                    0.5,
                    0.5
                );

                currentX += ctx.measureText(token.text).width;
            });
        });

        const footerGradient = ctx.createLinearGradient(0, height - footerHeight, 0, height);
        footerGradient.addColorStop(0, this.adjustColor(theme.background, -15));
        footerGradient.addColorStop(1, this.adjustColor(theme.background, -35));

        ctx.fillStyle = footerGradient;
        ctx.beginPath();
        ctx.moveTo(0, height - footerHeight);
        ctx.lineTo(width - borderRadius, height - footerHeight);
        ctx.arcTo(width, height - footerHeight, width, height - footerHeight + borderRadius, borderRadius);
        ctx.lineTo(width, height - borderRadius);
        ctx.arcTo(width, height, width - borderRadius, height, borderRadius);
        ctx.lineTo(borderRadius, height);
        ctx.arcTo(0, height, 0, height - borderRadius, borderRadius);
        ctx.lineTo(0, height - footerHeight + borderRadius);
        ctx.arcTo(0, height - footerHeight, borderRadius, height - footerHeight, borderRadius);
        ctx.closePath();
        ctx.fill();

        ctx.font = `bold ${dynamicFontSize - 1}px "BeVietnamPro Medium"`;

        const watermarkGradient = ctx.createLinearGradient(
            width - 350, height - 15,
            width - 20, height - 15
        );
        watermarkGradient.addColorStop(0, this.adjustColor(theme.foreground, -30));
        watermarkGradient.addColorStop(1, this.enhanceColor(this.adjustColor(theme.foreground, -10)));

        this.drawTextWithShadow(
            ctx,
            '✨ Created with raycode • ' + new Date().toLocaleDateString(),
            width - 320,
            height - 15,
            watermarkGradient,
            'rgba(0,0,0,0.3)',
            1,
            0.5,
            0.5
        );

        const highlightSize = 200;

        const highlightTopLeft = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, highlightSize
        );
        highlightTopLeft.addColorStop(0, this.hexToRgba(this.adjustColor(theme.accent, 30), 0.15));
        highlightTopLeft.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = highlightTopLeft;
        ctx.fillRect(0, 0, highlightSize, highlightSize);

        const highlightBottomRight = ctx.createRadialGradient(
            width, height, 0,
            width, height, highlightSize
        );
        highlightBottomRight.addColorStop(0, this.hexToRgba(this.adjustColor(theme.accent, 30), 0.1));
        highlightBottomRight.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = highlightBottomRight;
        ctx.fillRect(width - highlightSize, height - highlightSize, highlightSize, highlightSize);

        if (hasLongLines) {
            const scrollbarY = height - footerHeight - 12;
            const scrollbarWidth = width - padding * 2;
            const scrollbarHeight = 8;

            const scrollbarGradient = ctx.createLinearGradient(
                padding, scrollbarY, 
                padding + scrollbarWidth, scrollbarY
            );
            scrollbarGradient.addColorStop(0, this.hexToRgba(this.adjustColor(theme.background, -10), 0.6));
            scrollbarGradient.addColorStop(1, this.hexToRgba(this.adjustColor(theme.background, -15), 0.6));

            ctx.fillStyle = scrollbarGradient;
            ctx.beginPath();
            ctx.moveTo(padding, scrollbarY);
            ctx.arcTo(padding + scrollbarWidth, scrollbarY, padding + scrollbarWidth, scrollbarY + scrollbarHeight, scrollbarHeight/2);
            ctx.arcTo(padding + scrollbarWidth, scrollbarY + scrollbarHeight, padding, scrollbarY + scrollbarHeight, scrollbarHeight/2);
            ctx.arcTo(padding, scrollbarY + scrollbarHeight, padding, scrollbarY, scrollbarHeight/2);
            ctx.arcTo(padding, scrollbarY, padding + scrollbarWidth, scrollbarY, scrollbarHeight/2);
            ctx.fill();

            const thumbWidth = Math.max(40, scrollbarWidth * 0.7);
            const thumbGradient = ctx.createLinearGradient(
                padding, scrollbarY, 
                padding + thumbWidth, scrollbarY
            );
            thumbGradient.addColorStop(0, this.hexToRgba(this.enhanceColor(theme.accent), 0.7));
            thumbGradient.addColorStop(1, this.hexToRgba(theme.accent, 0.7));

            ctx.fillStyle = thumbGradient;
            ctx.beginPath();
            ctx.moveTo(padding, scrollbarY);
            ctx.arcTo(padding + thumbWidth, scrollbarY, padding + thumbWidth, scrollbarY + scrollbarHeight, scrollbarHeight/2);
            ctx.arcTo(padding + thumbWidth, scrollbarY + scrollbarHeight, padding, scrollbarY + scrollbarHeight, scrollbarHeight/2);
            ctx.arcTo(padding, scrollbarY + scrollbarHeight, padding, scrollbarY, scrollbarHeight/2);
            ctx.arcTo(padding, scrollbarY, padding + thumbWidth, scrollbarY, scrollbarHeight/2);
            ctx.fill();

            ctx.fillStyle = this.enhanceColor(theme.accent);
            ctx.font = `bold ${dynamicFontSize}px "BeVietnamPro Bold"`;

            this.drawTextWithShadow(
                ctx, 
                "»»»", 
                width - padding - 40, 
                scrollbarY - 5,
                this.enhanceColor(theme.accent),
                'rgba(0,0,0,0.3)',
                1,
                0.5,
                0.5
            );
        }

        const outputPath = path.join(__dirname, 'cache', `raycode_${Date.now()}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        return outputPath;
    },


    adjustColor(hex, percent) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        r = Math.max(0, Math.min(255, r + percent));
        g = Math.max(0, Math.min(255, g + percent));
        b = Math.max(0, Math.min(255, b + percent));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
};