const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const VNE_CONFIG = {
    name: 'VnExpress',
    url: 'https://vnexpress.net/tin-tuc-24h',
    color: 0x1261C9,
    icon: 'https://s.vnecdn.net/vnexpress/i/v20/logos/vne_logo.svg'
};

module.exports = {
    name: 'news',
    description: 'Xem tin tức từ VnExpress',
    usage: 'news',
    cooldown: 30,

    async execute(message) {
        try {
            const loadingMsg = await message.reply('⏳ Đang tải tin tức...');
            const news = await this.fetchNews();
            
            if (!news.length) {
                await loadingMsg.delete();
                return message.reply('❌ Không thể tải tin tức! Vui lòng thử lại sau.');
            }

            const embed = this.createNewsEmbed(news[0], 0, news.length);
            const row = this.createNewsButtons();

            const response = await message.reply({ embeds: [embed], components: [row] });
            await loadingMsg.delete();

            let currentPage = 0;
            const collector = response.createMessageComponentCollector({ time: 300000 });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({
                        content: '❌ Chỉ người yêu cầu mới có thể sử dụng nút này!',
                        ephemeral: true
                    });
                }

                switch (interaction.customId) {
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(news.length - 1, currentPage + 1);
                        break;
                    case 'refresh':
                        const freshNews = await this.fetchNews();
                        if (freshNews.length) {
                            news.length = 0;
                            news.push(...freshNews);
                            currentPage = 0;
                        }
                        break;
                }

                await interaction.update({ 
                    embeds: [this.createNewsEmbed(news[currentPage], currentPage, news.length)]
                });
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('[NEWS] Error:', error);
            message.reply('❌ Đã xảy ra lỗi khi tải tin tức!');
        }
    },

    async fetchNews() {
        const response = await axios.get(VNE_CONFIG.url);
        const $ = cheerio.load(response.data);
        const news = [];

        $('.item-news').each((i, el) => {
            if (i < 10) {
                const title = $(el).find('.title-news a').text().trim();
                const description = $(el).find('.description a').text().trim();
                const link = $(el).find('.title-news a').attr('href');
                const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
                const time = $(el).find('.time-count span').attr('datetime');
                
                if (title && description) {
                    news.push({ title, description, link, image, time });
                }
            }
        });

        return news;
    },

    createNewsEmbed(article, page, total) {
        return new EmbedBuilder()
            .setColor(VNE_CONFIG.color)
            .setTitle(article.title)
            .setURL(article.link)
            .setDescription([
                article.description,
                '',
                `⏰ Thời gian: ${article.time || 'Không xác định'}`
            ].join('\n'))
            .setThumbnail(VNE_CONFIG.icon)
            .setImage(article.image)
            .setFooter({
                text: `${VNE_CONFIG.name} • Tin ${page + 1}/${total}`,
                iconURL: VNE_CONFIG.icon
            })
            .setTimestamp();
    },

    createNewsButtons() {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('Trước')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⬅️'),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Sau')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➡️'),
            new ButtonBuilder()
                .setCustomId('refresh')
                .setLabel('Làm mới')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔄')
        );
    }
};
