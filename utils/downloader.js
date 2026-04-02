const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ZM_API } = require('./api');

class Downloader {
    static async getMediaInfo(url) {
        const response = await axios({
            method: 'POST',
            url: `${ZM_API.BASE_URL}/social/autolink`,
            headers: {
                'Content-Type': 'application/json',
                'apikey': ZM_API.KEY
            },
            data: { url }
        });

        if (!response.data || response.data.error) {
            throw new Error('Không thể tải nội dung');
        }

        return response.data;
    }

    static async downloadMedia(media, prefix = 'download') {
        const mediaRes = await axios({
            method: 'GET',
            url: media.url,
            responseType: 'arraybuffer',
            timeout: 60000
        });

        const ext = media.extension || (media.type === 'video' ? 'mp4' : 'jpg');
        const tempPath = path.join(__dirname, '../database/cache', `${prefix}_${Date.now()}.${ext}`);

        if (!fs.existsSync(path.dirname(tempPath))) {
            fs.mkdirSync(path.dirname(tempPath), { recursive: true });
        }

        fs.writeFileSync(tempPath, Buffer.from(mediaRes.data));
        return {
            path: tempPath,
            type: media.type,
            quality: media.quality
        };
    }

    static async downloadMultipleMedia(medias, prefix = 'download', maxFiles = 10) {
        if (!Array.isArray(medias)) return [];
        
        const downloads = [];
        const sortedMedias = this.sortMediaByQuality(medias);
        
        for (const media of sortedMedias) {
            if (downloads.length >= maxFiles) break;
            try {
                const download = await this.downloadMedia(media, prefix);
                downloads.push(download);
            } catch (error) {
                console.error(`Failed to download media: ${error.message}`);
                continue;
            }
        }
        
        return downloads;
    }


    static sortMediaByQuality(medias) {
        if (!Array.isArray(medias)) return [];
        const qualityOrder = [
            'hd_no_watermark',
            'no_watermark',
            'without_watermark',
            'hd_without_watermark',
            'origin',
            'hd',
            'HD',
            'sd',
            'SD',
            'watermark',
            'play_wm',
            'wm'
        ];
        return [...medias].sort((a, b) => {
            const ar = qualityOrder.indexOf(a.quality);
            const br = qualityOrder.indexOf(b.quality);
            const av = ar === -1 ? 999 : ar;
            const bv = br === -1 ? 999 : br;
            return av - bv;
        });
    }
}

module.exports = Downloader;
