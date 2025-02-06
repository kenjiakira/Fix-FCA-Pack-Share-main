const axios = require('axios');
const cheerio = require('cheerio');
const { usages } = require('./setname');

module.exports = {
    name: "seo",
    usedby: 0,
    info: "Phân tích SEO chi tiết của trang web",
    onPrefix: true,
    dev: "HNT",
    usages: "seo` [url]",
    cooldowns: 15,
    dmUser: false,

    onLaunch: async function ({ api, event, target }) {
        const url = target[0];

        if (!url) {
            return api.sendMessage(
                "🔎 SEO là gì?\n" +
                "SEO (Search Engine Optimization) là tối ưu hóa công cụ tìm kiếm giúp website của bạn dễ xuất hiện trên Google.\n\n" +
                "💡 Tác dụng của lệnh này:\n" +
                "- Kiểm tra tốc độ, bảo mật, nội dung và kỹ thuật của trang web.\n" +
                "- Đưa ra gợi ý để cải thiện thứ hạng tìm kiếm.\n\n" +
                "📌 Cách dùng: `seo [url]`\n" +
                "Ví dụ: `seo https://example.com`",
                event.threadID,
                event.messageID
            );
        }

        const loadingMessage = await api.sendMessage(
            "⏳ Đang tiến hành phân tích website...\n" +
            "📊 Vui lòng đợi trong giây lát...",
            event.threadID
        );

        try {
            const pageResponse = await axios.get(url);
            const $ = cheerio.load(pageResponse.data);
            
            const seoFactors = {
                title: $('title').text(),
                description: $('meta[name="description"]').attr('content'),
                keywords: $('meta[name="keywords"]').attr('content'),
                h1Tags: $('h1').length,
                imgAltTags: $('img[alt]').length,
                totalImages: $('img').length,
                internalLinks: $('a[href^="/"]').length,
                externalLinks: $('a[href^="http"]').length,
                robotsTxt: await checkRobotsTxt(url),
                sitemap: await checkSitemap(url),
                viewport: $('meta[name="viewport"]').length > 0,
                canonical: $('link[rel="canonical"]').length > 0,
                structuredData: $('script[type="application/ld+json"]').length > 0,
                openGraph: $('meta[property^="og:"]').length > 0,
                twitter: $('meta[name^="twitter:"]').length > 0,
                https: url.startsWith('https'),
                charset: $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content'),
                language: $('html').attr('lang'),
                responsiveImages: checkResponsiveImages($),
                contentLength: pageResponse.data.length,
                headers: pageResponse.headers,
                loadTime: pageResponse.headers['x-response-time'] || 'N/A'
            };

            const sslScore = await checkSSL(url);

            const performanceData = await checkEnhancedPerformance(url);

            const mobileFriendly = await checkMobileFriendly(url);

            const securityScore = checkSecurityHeaders(pageResponse.headers);

            let totalScore = 0;
            let details = [];

            totalScore += sslScore.score;
            details.push(`🔒 SSL: ${sslScore.grade} (${sslScore.score}/20)`);

            const perfScore = Math.round(performanceData.score * 20);
            totalScore += perfScore;
            details.push(`⚡ Tốc độ: ${perfScore}/20`);

            let seoBasicsScore = 0;
            if (seoFactors.title) seoBasicsScore += 5;
            if (seoFactors.description) seoBasicsScore += 5;
            if (seoFactors.keywords) seoBasicsScore += 5;
            if (seoFactors.h1Tags > 0) seoBasicsScore += 5;
            if (seoFactors.viewport) seoBasicsScore += 5;
            if (seoFactors.canonical) seoBasicsScore += 5;
            totalScore += seoBasicsScore;
            details.push(`📝 SEO cơ bản: ${seoBasicsScore}/30`);

            let technicalScore = 0;
            if (seoFactors.robotsTxt) technicalScore += 10;
            if (seoFactors.sitemap) technicalScore += 10;
            if (mobileFriendly) technicalScore += 10;
            totalScore += technicalScore;
            details.push(`⚙️ Kỹ thuật: ${technicalScore}/30`);

            let contentScore = calculateContentScore(seoFactors);
            totalScore += contentScore;
            details.push(`📑 Nội dung: ${contentScore}/20`);

            let socialScore = calculateSocialScore(seoFactors);
            totalScore += socialScore;
            details.push(`🔗 Social Media: ${socialScore}/10`);

            details.push(`🛡️ Bảo mật: ${securityScore}/10`);
            totalScore += securityScore;

            let ranking = getRanking(totalScore);

            const report = createEnhancedReport(seoFactors, totalScore, ranking, details, performanceData);

            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(report, event.threadID, event.messageID);

        } catch (error) {
            api.unsendMessage(loadingMessage.messageID);
            return api.sendMessage(
                `❌ Lỗi khi phân tích: ${error.message}\n` +
                `💡 Hãy kiểm tra lại URL và thử lại sau.`,
                event.threadID,
                event.messageID
            );
        }
    }
};

async function checkSSL(url) {
    try {
        const response = await axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${url}&maxAge=24`);
        if (response.data.status === 'READY' && response.data.endpoints[0].grade) {
            const grade = response.data.endpoints[0].grade;
            const score = grade === 'A+' ? 20 :
                         grade === 'A' ? 18 :
                         grade === 'B' ? 15 :
                         grade === 'C' ? 10 : 5;
            return { grade, score };
        }
        return { grade: 'N/A', score: 0 };
    } catch {
        return { grade: 'Error', score: 0 };
    }
}

async function checkPerformance(url) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}`
        );
        return {
            score: response.data.lighthouseResult.categories.performance.score,
            metrics: response.data.lighthouseResult.audits
        };
    } catch {
        return { score: 0, metrics: {} };
    }
}

async function checkMobileFriendly(url) {
    try {
        const response = await axios.get(
            `https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run`,
            {
                params: { url },
                headers: { 'Content-Type': 'application/json' }
            }
        );
        return response.data.mobileFriendly;
    } catch {
        return false;
    }
}

async function checkRobotsTxt(url) {
    try {
        await axios.get(`${url}/robots.txt`);
        return true;
    } catch {
        return false;
    }
}

async function checkSitemap(url) {
    try {
        await axios.get(`${url}/sitemap.xml`);
        return true;
    } catch {
        try {
            await axios.get(`${url}/sitemap_index.xml`);
            return true;
        } catch {
            return false;
        }
    }
}

function getRanking(score) {
    if (score >= 90) return "S+ (Xuất sắc)";
    if (score >= 80) return "S (Tuyệt vời)";
    if (score >= 70) return "A (Rất tốt)";
    if (score >= 60) return "B (Tốt)";
    if (score >= 50) return "C (Trung bình)";
    return "D (Cần cải thiện)";
}

function createDetailedReport(factors, score, ranking, details) {
    let report = "🔍 BÁO CÁO PHÂN TÍCH SEO\n\n";
    
    report += `${details.join('\n')}\n\n`;
    
    report += `📊 Tổng điểm: ${score}/100\n`;
    report += `🏆 Xếp hạng: ${ranking}\n\n`;
    
    report += "🔧 CHI TIẾT KỸ THUẬT:\n";
    report += `- Title: ${factors.title ? '✅' : '❌'}\n`;
    report += `- Meta Description: ${factors.description ? '✅' : '❌'}\n`;
    report += `- Keywords: ${factors.keywords ? '✅' : '❌'}\n`;
    report += `- H1 Tags: ${factors.h1Tags}\n`;
    report += `- Ảnh có Alt: ${factors.imgAltTags}/${factors.totalImages}\n`;
    report += `- Internal Links: ${factors.internalLinks}\n`;
    report += `- External Links: ${factors.externalLinks}\n`;
    report += `- Robots.txt: ${factors.robotsTxt ? '✅' : '❌'}\n`;
    report += `- Sitemap: ${factors.sitemap ? '✅' : '❌'}\n`;
    
    report += "\n💡 ĐỀ XUẤT CẢI THIỆN:\n";
    if (!factors.description) report += "- Thêm meta description\n";
    if (!factors.keywords) report += "- Thêm meta keywords\n";
    if (factors.h1Tags === 0) report += "- Thêm thẻ H1\n";
    if (factors.imgAltTags < factors.totalImages) report += "- Bổ sung alt cho ảnh\n";
    if (!factors.robotsTxt) report += "- Tạo file robots.txt\n";
    if (!factors.sitemap) report += "- Tạo sitemap\n";
    
    return report;
}

function checkResponsiveImages($) {
    const images = $('img');
    let responsiveCount = 0;
    images.each((i, img) => {
        if ($(img).attr('srcset') || $(img).css('max-width') === '100%') {
            responsiveCount++;
        }
    });
    return responsiveCount / images.length;
}

function checkSecurityHeaders(headers) {
    let score = 0;
    const securityHeaders = {
        'strict-transport-security': 2,
        'x-content-type-options': 2,
        'x-frame-options': 2,
        'x-xss-protection': 2,
        'content-security-policy': 2
    };

    Object.keys(securityHeaders).forEach(header => {
        if (headers[header]) score += securityHeaders[header];
    });
    
    return score;
}

async function checkEnhancedPerformance(url) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile`
        );
        
        return {
            score: response.data.lighthouseResult.categories.performance.score,
            metrics: {
                firstContentfulPaint: response.data.lighthouseResult.audits['first-contentful-paint'],
                speedIndex: response.data.lighthouseResult.audits['speed-index'],
                largestContentfulPaint: response.data.lighthouseResult.audits['largest-contentful-paint'],
                timeToInteractive: response.data.lighthouseResult.audits['interactive'],
                totalBlockingTime: response.data.lighthouseResult.audits['total-blocking-time']
            }
        };
    } catch {
        return { score: 0, metrics: {} };
    }
}

function calculateContentScore(factors) {
    let score = 0;
    if (factors.contentLength > 1500) score += 5;
    if (factors.structuredData) score += 5;
    if (factors.language) score += 5;
    if (factors.responsiveImages > 0.8) score += 5;
    return score;
}

function calculateSocialScore(factors) {
    let score = 0;
    if (factors.openGraph) score += 5;
    if (factors.twitter) score += 5;
    return score;
}

function createEnhancedReport(factors, score, ranking, details, performanceData) {
    let report = "🔍 BÁO CÁO PHÂN TÍCH SEO CHI TIẾT\n\n";
    
    report += `${details.join('\n')}\n\n`;
    
    report += `📊 Tổng điểm: ${score}/100\n`;
    report += `🏆 Xếp hạng: ${ranking}\n\n`;
    
    report += "🔧 CHI TIẾT KỸ THUẬT:\n";
    report += `- Title: ${factors.title ? '✅' : '❌'}\n`;
    report += `- Meta Description: ${factors.description ? '✅' : '❌'}\n`;
    report += `- Keywords: ${factors.keywords ? '✅' : '❌'}\n`;
    report += `- H1 Tags: ${factors.h1Tags}\n`;
    report += `- Ảnh có Alt: ${factors.imgAltTags}/${factors.totalImages}\n`;
    report += `- Internal Links: ${factors.internalLinks}\n`;
    report += `- External Links: ${factors.externalLinks}\n`;
    report += `- Robots.txt: ${factors.robotsTxt ? '✅' : '❌'}\n`;
    report += `- Sitemap: ${factors.sitemap ? '✅' : '❌'}\n`;
    
    report += "\n⚡ METRICS HIỆU SUẤT:\n";
    if (performanceData.metrics) {
        report += `- First Contentful Paint: ${performanceData.metrics.firstContentfulPaint?.displayValue || 'N/A'}\n`;
        report += `- Speed Index: ${performanceData.metrics.speedIndex?.displayValue || 'N/A'}\n`;
        report += `- Time to Interactive: ${performanceData.metrics.timeToInteractive?.displayValue || 'N/A'}\n`;
    }

    report += "\n🔒 KIỂM TRA BẢO MẬT:\n";
    report += `- HTTPS: ${factors.https ? '✅' : '❌'}\n`;
    report += `- Security Headers: ${checkSecurityHeaders(factors.headers)}/10\n`;

    report += "\n🌐 SEO NÂNG CAO:\n";
    report += `- Structured Data: ${factors.structuredData ? '✅' : '❌'}\n`;
    report += `- Open Graph Tags: ${factors.openGraph ? '✅' : '❌'}\n`;
    report += `- Twitter Cards: ${factors.twitter ? '✅' : '❌'}\n`;
    report += `- Language Tag: ${factors.language || '❌'}\n`;
    
    report += "\n💡 ĐỀ XUẤT CẢI THIỆN:\n";
    if (!factors.description) report += "- Thêm meta description\n";
    if (!factors.keywords) report += "- Thêm meta keywords\n";
    if (factors.h1Tags === 0) report += "- Thêm thẻ H1\n";
    if (factors.imgAltTags < factors.totalImages) report += "- Bổ sung alt cho ảnh\n";
    if (!factors.robotsTxt) report += "- Tạo file robots.txt\n";
    if (!factors.sitemap) report += "- Tạo sitemap\n";
    if (!factors.https) report += "- Nâng cấp lên HTTPS để bảo mật website\n";
    if (!factors.structuredData) report += "- Thêm Schema Markup để tăng hiển thị rich snippets\n";
    if (!factors.openGraph) report += "- Thêm Open Graph tags để tối ưu chia sẻ mạng xã hội\n";
    if (performanceData.metrics?.largestContentfulPaint?.numericValue > 2500) {
        report += "- Tối ưu LCP bằng cách nén hình ảnh và sử dụng CDN\n";
    }
    
    return report;
}
