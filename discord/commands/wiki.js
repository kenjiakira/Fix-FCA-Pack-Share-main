const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'wiki',
    description: 'Tra cứu thông tin từ Wikipedia',
    usage: 'wiki [en/vi] <từ khóa> | wiki random',
    cooldown: 5,

    async execute(message, args) {
        try {
            if (!args.length || args[0] === 'random') {
                return this.getRandomArticle(message);
            }

            let lang = 'vi';
            let searchTerm;

            if (args[0].toLowerCase() === 'en' || args[0].toLowerCase() === 'vi') {
                lang = args[0].toLowerCase();
                searchTerm = args.slice(1).join(' ');
            } else {
                searchTerm = args.join(' ');
            }

            const loadingMsg = await message.reply('🔍 Đang tìm kiếm...');

            try {
                const data = await this.fetchWikiArticle(searchTerm, lang);
                if (!data) {
                    return loadingMsg.edit('❌ Không tìm thấy thông tin về chủ đề này!');
                }

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle(data.title)
                    .setURL(data.content_urls.desktop.page)
                    .setDescription(this.formatContent(data.extract))
                    .setFooter({
                        text: `Wikipedia ${lang.toUpperCase()} | ${message.author.tag}`,
                        iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png'
                    })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Đọc thêm')
                            .setStyle(ButtonStyle.Link)
                            .setURL(data.content_urls.desktop.page)
                            .setEmoji('📚'),
                        new ButtonBuilder()
                            .setCustomId('random_wiki')
                            .setLabel('Bài viết ngẫu nhiên')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🎲')
                    );

                await loadingMsg.edit({
                    content: null,
                    embeds: [embed],
                    components: [row]
                });

                this.setupButtonCollector(loadingMsg, message.author.id, lang);

            } catch (error) {
                console.error('[WIKI] Error:', error);
                await loadingMsg.edit('❌ Đã xảy ra lỗi khi tìm kiếm!');
            }

        } catch (error) {
            console.error('[WIKI] Error:', error);
            message.reply('❌ Đã xảy ra lỗi khi thực hiện lệnh!');
        }
    },

    async getRandomArticle(message) {
        const loadingMsg = await message.reply('🎲 Đang tìm bài viết ngẫu nhiên...');

        try {
            const data = await this.fetchRandomArticle();
            if (!data) {
                return loadingMsg.edit('❌ Không thể lấy bài viết ngẫu nhiên!');
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📚 Bài viết ngẫu nhiên: ' + data.title)
                .setURL(data.content_urls.desktop.page)
                .setDescription(this.formatContent(data.extract))
                .setFooter({
                    text: `Wikipedia | ${message.author.tag}`,
                    iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png'
                })
                .setTimestamp();

            await loadingMsg.edit({
                content: null,
                embeds: [embed],
                components: [this.createActionRow(data.content_urls.desktop.page)]
            });

        } catch (error) {
            console.error('[WIKI] Random article error:', error);
            await loadingMsg.edit('❌ Đã xảy ra lỗi khi tìm bài viết ngẫu nhiên!');
        }
    },

    setupButtonCollector(message, authorId, lang) {
        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== authorId) {
                return interaction.reply({
                    content: '❌ Chỉ người yêu cầu mới có thể sử dụng nút này!',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'random_wiki') {
                const data = await this.fetchRandomArticle(lang);
                if (!data) {
                    return interaction.reply({
                        content: '❌ Không thể tải bài viết ngẫu nhiên!',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('📚 Bài viết ngẫu nhiên: ' + data.title)
                    .setURL(data.content_urls.desktop.page)
                    .setDescription(this.formatContent(data.extract))
                    .setFooter({
                        text: `Wikipedia ${lang.toUpperCase()} | Bài viết ngẫu nhiên`,
                        iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/103px-Wikipedia-logo-v2.svg.png'
                    })
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: [this.createActionRow(data.content_urls.desktop.page)]
                });
            }
        });

        collector.on('end', () => {
            if (message.editable) {
                message.edit({ components: [] }).catch(() => {});
            }
        });
    },

    createActionRow(pageUrl) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Đọc thêm')
                    .setStyle(ButtonStyle.Link)
                    .setURL(pageUrl)
                    .setEmoji('📚'),
                new ButtonBuilder()
                    .setCustomId('random_wiki')
                    .setLabel('Bài viết ngẫu nhiên')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎲')
            );
    },

    async fetchWikiArticle(searchTerm, lang) {
        try {
            const response = await axios.get(
                `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`,
                { headers: { 'User-Agent': 'Discord Bot' } }
            );
            return response.data;
        } catch (error) {
            console.error('[WIKI] Article fetch error:', error.message);
            return null;
        }
    },

    async fetchRandomArticle(lang = 'vi') {
        try {
            const response = await axios.get(
                `https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`,
                { headers: { 'User-Agent': 'Discord Bot' } }
            );
            return response.data;
        } catch (error) {
            console.error('[WIKI] Random article fetch error:', error.message);
            return null;
        }
    },

    formatContent(content) {
        if (content.length > 2000) {
            return content.substring(0, 1997) + "...";
        }
        return content;
    }
};
