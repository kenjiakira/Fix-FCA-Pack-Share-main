const axios = require('axios');

module.exports = {
    name: "ruptime",
    version: "1.0.0",
    dev: "HNT",
    usedby: 2,
    info: "Theo dõi thời gian hoạt động của website/dịch vụ",
    usages: "ruptime [add/list/del] [url] [-name tên] [-interval giây]",
    cooldowns: 5,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID } = event;
        
        const API_KEY = "u1829561-e6d78700b0a4b3c3470d2b8b"; 
        const BASE_URL = "https://api.uptimerobot.com/v2";

        const sendMessage = (msg) => api.sendMessage(msg, threadID, messageID);

        try {
            const args = target;
            const cmd = args[0]?.toLowerCase();

            if (!cmd || cmd === "help") {
                return sendMessage(
                    "📝 Hướng dẫn sử dụng ruptime:\n\n" +
                    "1. Thêm monitor mới:\n" +
                    "ruptime add [url] -name [tên] -interval [giây]\n\n" +
                    "2. Xem danh sách monitors:\n" +
                    "ruptime list\n\n" +
                    "3. Xóa monitor:\n" +
                    "ruptime del [id]\n\n" +
                    "Ví dụ:\n" +
                    "ruptime add https://example.com -name Website -interval 300"
                );
            }

            switch(cmd) {
                case "list": {
                    const response = await axios.post(`${BASE_URL}/getMonitors`, {
                        api_key: API_KEY,
                        format: "json"
                    });

                    if (response.data.stat === "ok") {
                        const monitors = response.data.monitors;
                        let msg = "📊 Danh sách Monitors:\n\n";

                        monitors.forEach(m => {
                            const status = m.status === 2 ? "✅" : m.status === 9 ? "❌" : "⏸️";
                            msg += `${status} ID: ${m.id}\n`;
                            msg += `📝 Tên: ${m.friendly_name}\n`;
                            msg += `🔗 URL: ${m.url}\n`;
                            msg += `⏱️ Uptime: ${m.all_time_uptime_ratio}%\n\n`;
                        });

                        return sendMessage(msg);
                    }
                    break;
                }

                case "add": {
                    const url = args[1];
                    if (!url) return sendMessage("❌ Vui lòng nhập URL cần monitor!");

                    const nameIndex = args.indexOf("-name");
                    const intervalIndex = args.indexOf("-interval");
                    
                    const friendly_name = nameIndex > -1 ? args[nameIndex + 1] : url;
                    const interval = intervalIndex > -1 ? parseInt(args[intervalIndex + 1]) : 300;

                    const response = await axios.post(`${BASE_URL}/newMonitor`, {
                        api_key: API_KEY,
                        format: "json",
                        type: 1,
                        url: url,
                        friendly_name: friendly_name,
                        interval: interval
                    });

                    if (response.data.stat === "ok") {
                        return sendMessage(`✅ Đã thêm monitor mới:\n📝 Tên: ${friendly_name}\n🔗 URL: ${url}`);
                    }
                    break;
                }

                case "del": {
                    const id = args[1];
                    if (!id) return sendMessage("❌ Vui lòng nhập ID monitor cần xóa!");

                    const response = await axios.post(`${BASE_URL}/deleteMonitor`, {
                        api_key: API_KEY,
                        format: "json",
                        id: id
                    });

                    if (response.data.stat === "ok") {
                        return sendMessage(`✅ Đã xóa monitor có ID: ${id}`);
                    }
                    break;
                }
            }

        } catch (error) {
            console.error("UptimeRobot Error:", error.response?.data || error.message);
            return sendMessage("❌ Đã xảy ra lỗi, vui lòng thử lại sau!");
        }
    }
};
