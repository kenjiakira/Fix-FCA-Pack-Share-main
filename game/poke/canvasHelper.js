const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports = {
    createWinnerImage: async function(winnerPokemonImage, winnerName, pokemonName, expGained, remainingHp) {
        try {
            console.log("Loading Pokemon fonts...");
            
            const pokeSolidPath = path.join(__dirname, '../fonts/Pokemon_Solid.ttf');
            const pokeHollowPath = path.join(__dirname, '../fonts/Pokemon_Hollow.ttf');
            
            if (!fs.existsSync(pokeSolidPath)) {
              console.log(`Font not found at path: ${pokeSolidPath}`);
            }
            
            if (!fs.existsSync(pokeHollowPath)) {
              console.log(`Font not found at path: ${pokeHollowPath}`);
            }
            
            registerFont(pokeSolidPath, { family: 'Pokemon Solid' });
            console.log("✓ Pokemon Solid font loaded successfully");
            
            registerFont(pokeHollowPath, { family: 'Pokemon Hollow' });
            console.log("✓ Pokemon Hollow font loaded successfully");
            
            console.log("All Pokemon fonts loaded successfully!");

            const [pokemonImg, bgImage] = await Promise.all([
                loadImage(winnerPokemonImage),
                loadImage(path.join(__dirname, '../commands/cache/pokemon/winner.png'))
            ]);

            const canvas = createCanvas(1280, 720);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

            const gradient = ctx.createRadialGradient(
                canvas.width/2, canvas.height/2, 0,
                canvas.width/2, canvas.height/2, canvas.width/2
            );
            gradient.addColorStop(0, 'rgba(255,215,0,0.3)');
            gradient.addColorStop(1, 'rgba(255,215,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
   
            const pokemonSize = 400;
            ctx.save();
            ctx.shadowColor = 'rgba(255,215,0,0.8)';
            ctx.shadowBlur = 30;
            ctx.drawImage(
                pokemonImg, 
                (canvas.width - pokemonSize)/2,
                100,
                pokemonSize,
                pokemonSize
            );
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.font = '80px "Pokemon Solid", Impact';
            
            ctx.shadowColor = 'rgba(255,215,0,0.8)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#FFD700';
            ctx.fillText('VICTORY!', canvas.width/2, 80);

            ctx.font = '40px "Pokemon Solid", Impact';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;

            const infoY = 580;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${winnerName} - ${pokemonName}`, canvas.width/2, infoY);

            ctx.font = '30px "Pokemon Solid", Impact';
            ctx.fillStyle = '#90EE90';
            ctx.fillText(`EXP Gained: +${expGained}`, canvas.width/2, infoY + 50);
            ctx.fillStyle = '#FF69B4';
            ctx.fillText(`Remaining HP: ${remainingHp}`, canvas.width/2, infoY + 90);

            for (let i = 0; i < 100; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 4;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,215,0,${Math.random() * 0.7})`;
                ctx.fill();
            }

            const outputPath = path.join(tempDir, 'winner.png');
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            await new Promise((resolve, reject) => {
                out.on('finish', resolve);
                out.on('error', reject);
            });

            return fs.createReadStream(outputPath);
        } catch (error) {
            console.error('Error creating winner image:', error);
            throw error;
        }
    },
    createBattleImage: async function(pokemon1Image, pokemon2Image, player1Name, player2Name, pokemon1Name, pokemon2Name) {
        try {
            const tempDir = path.join(__dirname, './cache');
            
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
    
            try {
                registerFont(path.join(__dirname, './fonts/Pokemon_Solid.ttf'), { family: 'Pokemon Solid' });
                registerFont(path.join(__dirname, './fonts/Pokemon_Hollow.ttf'), { family: 'Pokemon Hollow' });
            } catch (error) {
                console.log('Font loading failed, using fallback fonts');
            }
    
            const [img1, img2, bgImage] = await Promise.all([
                loadImage(pokemon1Image),
                loadImage(pokemon2Image),
                loadImage(path.join(__dirname, './cache/pokemon/battle_bg.png'))
            ]);
    
            const canvas = createCanvas(1280, 720);
            const ctx = canvas.getContext('2d');
    
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(255,0,0,0.2)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, 'rgba(0,0,255,0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    
            const pokemonSize = 300;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 20;
            ctx.drawImage(img1, 100, 200, pokemonSize, pokemonSize);
            ctx.restore();
    
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 20;
            ctx.drawImage(img2, canvas.width - pokemonSize - 100, 200, pokemonSize, pokemonSize);
            ctx.restore();
    
            ctx.textAlign = 'center';
            
            const drawEnhancedText = (text, x, y) => {
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                const textGradient = ctx.createLinearGradient(x - 100, y, x + 100, y);
                textGradient.addColorStop(0, '#ffd700');
                textGradient.addColorStop(0.5, '#ffffff'); 
                textGradient.addColorStop(1, '#ffd700');

                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 8;
                ctx.strokeText(text, x, y);
                
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#444444';
                ctx.strokeText(text, x, y);
                
                ctx.fillStyle = textGradient;
                ctx.fillText(text, x, y);
                
                ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
                ctx.shadowBlur = 5;
                ctx.fillText(text, x, y);
            };
    
            ctx.font = '45px "Pokemon Solid", Impact, Arial Black';
            
            drawEnhancedText(`${player1Name} - ${pokemon1Name}`, 250, 550);
            drawEnhancedText(`${player2Name} - ${pokemon2Name}`, canvas.width - 250, 550);
    
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = Math.random() * 3;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
                ctx.fill();
            }
    
            const outputPath = path.join(tempDir, 'battle.png');
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
    
            await new Promise((resolve, reject) => {
                out.on('finish', resolve);
                out.on('error', reject);
            });
    
            return fs.createReadStream(outputPath);
        } catch (error) {
            console.error('Error creating battle image:', error);
            throw error;
        }
    }
};
