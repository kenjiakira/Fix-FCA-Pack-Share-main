const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    name: "seo",
    usedby: 0,
    info: "Phân tích SEO chi tiết của trang web",
    onPrefix: true,
    dev: "HNT",
    usages: "seo [url]",
    cooldowns: 15,
    dmUser: false,

    onLaunch: async function ({ api, event, target }) {
        const url = target[0];

        if (!url) {
            return api.sendMessage(
                "🔎 SEO là gì?\n" +
                "SEO (Search Engine Optimization) là tối ưu hóa công cụ tìm kiếm giúp website của bạn dễ xuất hiện trên Google.\n\n" +
                "💡 Tác dụng của lệnh này:\n" +
                "- Kiểm tra Core Web Vitals và hiệu suất\n" +
                "- Phân tích cấu trúc và nội dung\n" +
                "- Đánh giá bảo mật và tối ưu di động\n" +
                "- Đề xuất cải thiện chi tiết\n\n" +
                "📌 Cách dùng: seo [url]\n" +
                "Ví dụ: seo https://example.com",
                event.threadID,
                event.messageID
            );
        }

        const loadingMessage = await api.sendMessage(
            "⏳ Đang tiến hành phân tích website...\n" +
            "📊 Quá trình này có thể mất 30-60 giây",
            event.threadID
        );

        try {
            // Validate URL
            const validUrl = url.startsWith('http') ? url : `https://${url}`;
            if (!validUrl.match(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/)) {
                throw new Error("URL không hợp lệ");
            }

            // Fetch page with timeout and headers
            const pageResponse = await axios.get(validUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });

            const $ = cheerio.load(pageResponse.data);
            
            // Enhanced SEO Analysis
            const seoData = {
                basic: {
                    title: $('title').text().trim(),
                    description: $('meta[name="description"]').attr('content'),
                    keywords: $('meta[name="keywords"]').attr('content'),
                    viewport: $('meta[name="viewport"]').attr('content'),
                    charset: $('meta[charset]').attr('charset'),
                    language: $('html').attr('lang'),
                    canonical: $('link[rel="canonical"]').attr('href')
                },
                content: {
                    h1Tags: $('h1').length,
                    h2Tags: $('h2').length,
                    h3Tags: $('h3').length,
                    paragraphs: $('p').length,
                    wordCount: $('body').text().trim().split(/\s+/).length,
                    images: {
                        total: $('img').length,
                        withAlt: $('img[alt]').length,
                        withLazyLoad: $('img[loading="lazy"]').length
                    }
                },
                technical: {
                    robotsTxt: await checkRobotsTxt(validUrl),
                    sitemap: await checkSitemap(validUrl),
                    ssl: validUrl.startsWith('https'),
                    structuredData: $('script[type="application/ld+json"]').length > 0,
                    links: {
                        internal: $('a[href^="/"]').length,
                        external: $('a[href^="http"]').length
                    }
                },
                performance: await checkPerformance(validUrl),
                security: {
                    headers: pageResponse.headers,
                    hsts: pageResponse.headers['strict-transport-security'] ? true : false,
                    xss: pageResponse.headers['x-xss-protection'] ? true : false,
                    csp: pageResponse.headers['content-security-policy'] ? true : false
                },
                social: {
                    openGraph: $('meta[property^="og:"]').length > 0,
                    twitter: $('meta[name^="twitter:"]').length > 0
                }
            };

            // Calculate Scores
            const scores = {
                content: calculateContentScore(seoData.content),
                technical: calculateTechnicalScore(seoData.technical),
                performance: Math.round(seoData.performance.score * 100) || 0,
                security: calculateSecurityScore(seoData.security),
                social: calculateSocialScore(seoData.social)
            };

            scores.overall = Math.round(
                (scores.content * 0.3) +
                (scores.technical * 0.25) +
                (scores.performance * 0.25) +
                (scores.security * 0.1) +
                (scores.social * 0.1)
            );

            // Generate Report
            let report = "🔍 BÁO CÁO PHÂN TÍCH SEO\n\n";

            // Overall Score
            report += `📊 ĐIỂM TỔNG QUAN: ${scores.overall}/100\n`;
            report += `${getScoreEmoji(scores.overall)} Xếp hạng: ${getScoreRank(scores.overall)}\n\n`;

            // Core Web Vitals
            if (seoData.performance.metrics) {
                report += "⚡ CORE WEB VITALS:\n";
                const { metrics } = seoData.performance;
                report += `- LCP: ${(metrics.LCP/1000).toFixed(1)}s ${metrics.LCP <= 2500 ? '✅' : '⚠️'}\n`;
                report += `- FID: ${metrics.FID.toFixed(1)}ms ${metrics.FID <= 100 ? '✅' : '⚠️'}\n`;
                report += `- CLS: ${metrics.CLS.toFixed(3)} ${metrics.CLS <= 0.1 ? '✅' : '⚠️'}\n\n`;
            }

            // Detailed Scores
            report += "🎯 ĐIỂM CHI TIẾT:\n";
            report += `📝 Nội dung: ${scores.content}/100\n`;
            report += `⚙️ Kỹ thuật: ${scores.technical}/100\n`;
            report += `⚡ Hiệu suất: ${scores.performance}/100\n`;
            report += `🔒 Bảo mật: ${scores.security}/100\n`;
            report += `🔗 Social: ${scores.social}/100\n\n`;

            // Content Analysis
            report += "📑 PHÂN TÍCH NỘI DUNG:\n";
            report += `- Title (${seoData.basic.title?.length || 0} ký tự): ${seoData.basic.title ? '✅' : '❌'}\n`;
            report += `- Meta Description: ${seoData.basic.description ? '✅' : '❌'}\n`;
            report += `- Số từ: ${seoData.content.wordCount}\n`;
            report += `- Ảnh tối ưu: ${seoData.content.images.withAlt}/${seoData.content.images.total}\n\n`;

            // Technical Analysis
            report += "⚙️ PHÂN TÍCH KỸ THUẬT:\n";
            report += `- HTTPS: ${seoData.technical.ssl ? '✅' : '❌'}\n`;
            report += `- Mobile Friendly: ${seoData.basic.viewport ? '✅' : '❌'}\n`;
            report += `- Schema Markup: ${seoData.technical.structuredData ? '✅' : '❌'}\n`;
            report += `- Robots.txt: ${seoData.technical.robotsTxt ? '✅' : '❌'}\n`;
            report += `- Sitemap: ${seoData.technical.sitemap ? '✅' : '❌'}\n\n`;

            // Security
            report += "🔒 BẢO MẬT:\n";
            report += `- HTTPS: ${seoData.technical.ssl ? '✅' : '❌'}\n`;
            report += `- HSTS: ${seoData.security.hsts ? '✅' : '❌'}\n`;
            report += `- XSS Protection: ${seoData.security.xss ? '✅' : '❌'}\n`;
            report += `- Content Security: ${seoData.security.csp ? '✅' : '❌'}\n\n`;

            // Recommendations
            report += "💡 ĐỀ XUẤT CẢI THIỆN:\n";
            const recommendations = generateRecommendations(seoData, scores);
            recommendations.forEach(rec => {
                report += `${rec}\n`;
            });

            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(report, event.threadID, event.messageID);

        } catch (error) {
            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(
                `❌ Lỗi khi phân tích: ${error.message}\n` +
                `💡 Nguyên nhân có thể:\n` +
                `1. URL không hợp lệ\n` +
                `2. Website không phản hồi\n` +
                `3. Kết nối không ổn định\n` +
                `4. Website chặn truy cập\n\n` +
                `📌 Hãy kiểm tra lại URL và thử lại sau.`,
                event.threadID,
                event.messageID
            );
        }
    }
};

async function checkRobotsTxt(url) {
    try {
        await axios.head(`${url}/robots.txt`);
        return true;
    } catch {
        return false;
    }
}

async function checkSitemap(url) {
    try {
        await axios.head(`${url}/sitemap.xml`);
        return true;
    } catch {
        return false;
    }
}

async function checkPerformance(url) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile`
        );
        
        const metrics = response.data.lighthouseResult.audits;
        return {
            score: response.data.lighthouseResult.categories.performance.score,
            metrics: {
                LCP: metrics['largest-contentful-paint'].numericValue,
                FID: metrics['max-potential-fid'].numericValue,
                CLS: metrics['cumulative-layout-shift'].numericValue
            }
        };
    } catch {
        return { score: 0, metrics: null };
    }
}

function calculateContentScore(content) {
    let score = 0;

    if (content.wordCount >= 1000) score += 30;
    else if (content.wordCount >= 500) score += 20;
    else if (content.wordCount >= 300) score += 10;

    if (content.h1Tags === 1) score += 20;
    if (content.h2Tags > 0) score += 10;
    if (content.h3Tags > 0) score += 10;

    const imgAltRatio = content.images.withAlt / content.images.total;
    score += Math.round(imgAltRatio * 30);

    return Math.min(100, score);
}

function calculateTechnicalScore(technical) {
    let score = 0;
    
    if (technical.ssl) score += 20;
    if (technical.structuredData) score += 20;
    if (technical.robotsTxt) score += 20;
    if (technical.sitemap) score += 20;
    if (technical.links.internal > 0) score += 20;

    return score;
}

function calculateSecurityScore(security) {
    let score = 0;
    
    if (security.hsts) score += 25;
    if (security.xss) score += 25;
    if (security.csp) score += 25;
    if (security.headers['x-content-type-options']) score += 25;

    return score;
}

function calculateSocialScore(social) {
    let score = 0;
    
    if (social.openGraph) score += 50;
    if (social.twitter) score += 50;

    return score;
}

function getScoreEmoji(score) {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 60) return '🥉';
    return '⚠️';
}

function getScoreRank(score) {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Rất tốt';
    if (score >= 70) return 'Tốt';
    if (score >= 60) return 'Khá';
    if (score >= 50) return 'Trung bình';
    return 'Cần cải thiện';
}

function generateRecommendations(data, scores) {
    const recs = [];

    if (scores.performance < 90) {
        if (data.performance.metrics?.LCP > 2500) {
            recs.push("- Tối ưu LCP: Nén hình ảnh, sử dụng CDN");
        }
        if (data.performance.metrics?.FID > 100) {
            recs.push("- Giảm FID: Tối ưu JavaScript");
        }
        if (data.performance.metrics?.CLS > 0.1) {
            recs.push("- Cải thiện CLS: Cố định kích thước media");
        }
    }

    if (scores.content < 80) {
        if (!data.basic.description) {
            recs.push("- Thêm meta description");
        }
        if (data.content.wordCount < 500) {
            recs.push("- Tăng độ dài nội dung (>500 từ)");
        }
        if (data.content.images.withAlt < data.content.images.total) {
            recs.push("- Thêm alt text cho tất cả hình ảnh");
        }
    }

    if (scores.technical < 80) {
        if (!data.technical.structuredData) {
            recs.push("- Thêm Schema Markup");
        }
        if (!data.technical.ssl) {
            recs.push("- Nâng cấp lên HTTPS");
        }
        if (!data.technical.robotsTxt) {
            recs.push("- Tạo file robots.txt");
        }
        if (!data.technical.sitemap) {
            recs.push("- Tạo sitemap.xml");
        }
    }

    if (scores.security < 80) {
        if (!data.security.hsts) {
            recs.push("- Bật Strict Transport Security");
        }
        if (!data.security.csp) {
            recs.push("- Thêm Content Security Policy");
        }
    }

    return recs;
}
