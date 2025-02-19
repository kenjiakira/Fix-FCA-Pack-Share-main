const { EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    name: 'uptime',
    description: 'Xem thông tin hoạt động của bot',
    usage: 'uptime',
    cooldown: 10,
    
    execute: async function(message) {
        try {
            const totalSeconds = process.uptime();
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);

            const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            const totalMemory = os.totalmem() / 1024 / 1024;
            const freeMemory = os.freemem() / 1024 / 1024;
            const memoryUsage = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);

            const cpus = os.cpus();
            const cpuModel = cpus[0].model;
            const cpuSpeed = (cpus[0].speed / 1000).toFixed(2);
            const cpuCount = cpus.length;

            const platform = os.platform();
            const architecture = os.arch();
            const nodeVersion = process.version;

            const guildCount = message.client.guilds.cache.size;
            const channelCount = message.client.channels.cache.size;
            const userCount = message.client.users.cache.size;
            const ping = message.client.ws.ping;

            // Create progress bars
            const createProgressBar = (percent) => {
                const completed = Math.round(percent / 10);
                const remaining = 10 - completed;
                return '█'.repeat(completed) + '░'.repeat(remaining);
            };

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('📊 Thông tin hệ thống')
                .setDescription(`🤖 Bot đã hoạt động được:\n**${days}d ${hours}h ${minutes}m ${seconds}s**`)
                .addFields([
                    {
                        name: '💻 Thông tin Server',
                        value: [
                            `🔧 CPU: ${cpuModel}`,
                            `⚡ Tốc độ: ${cpuSpeed}GHz x ${cpuCount} cores`,
                            `💿 RAM: ${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`,
                            `📊 Mức sử dụng RAM: ${memoryUsage}%`,
                            `${createProgressBar(parseFloat(memoryUsage))} `,
                            `🖥️ Hệ điều hành: ${platform} (${architecture})`,
                            `📦 Node.js: ${nodeVersion}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🤖 Thông tin Bot',
                        value: [
                            `🌐 Servers: ${guildCount.toLocaleString()}`,
                            `📝 Kênh: ${channelCount.toLocaleString()}`,
                            `👥 Người dùng: ${userCount.toLocaleString()}`,
                            `📡 Ping: ${ping}ms`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ text: 'Bot Status Monitor • Cập nhật mỗi 10 giây' })
                .setTimestamp();

            const msg = await message.reply({ embeds: [embed] });

            let updates = 0;
            const interval = setInterval(async () => {
                updates++;
                if (updates >= 6) { 
                    clearInterval(interval);
                    return;
                }

                const newTotalSeconds = process.uptime();
                const newDays = Math.floor(newTotalSeconds / 86400);
                const newHours = Math.floor((newTotalSeconds % 86400) / 3600);
                const newMinutes = Math.floor((newTotalSeconds % 3600) / 60);
                const newSeconds = Math.floor(newTotalSeconds % 60);
                const newPing = message.client.ws.ping;

                embed.setDescription(`🤖 Bot đã hoạt động được:\n**${newDays}d ${newHours}h ${newMinutes}m ${newSeconds}s**`)
                    .setTimestamp();

                const fields = embed.data.fields;
                fields[1].value = fields[1].value.replace(/Ping: \d+ms/, `Ping: ${newPing}ms`);

                await msg.edit({ embeds: [embed] }).catch(() => clearInterval(interval));
            }, 10000);

        } catch (error) {
            console.error('[DISCORD] Uptime command error:', error);
            return message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
        }
    }
};
