const net = require('net');

module.exports = {
    name: "portscan",
    info: "Quét cổng mở của server",
    usages: "portscan [host]",
    usedby: 0,
    onPrefix: true,
    dev: "HNT",
    cooldowns: 15,
    dmUser: false,

    onLaunch: async function({api, event, target}) {
        const host = target[0];
        const commonPorts = [21, 22, 80, 443, 3306, 8080];
        
        if (!host) return api.sendMessage("❌ Vui lòng nhập địa chỉ host!", event.threadID);
        
        const msg = await api.sendMessage("⏳ Đang quét cổng...", event.threadID);
        
        let results = `🔍 KẾT QUẢ QUÉT CỔNG ${host}:\n\n`;
        
        for (const port of commonPorts) {
            try {
                const socket = new net.Socket();
                const status = await new Promise((resolve) => {
                    socket.connect(port, host)
                        .on('connect', () => {
                            socket.destroy();
                            resolve('🟢 Mở');
                        })
                        .on('error', () => resolve('🔴 Đóng'));
                });
                results += `Cổng ${port}: ${status}\n`;
            } catch(e) {
                results += `Cổng ${port}: ❌ Lỗi\n`;
            }
        }
        
        return api.sendMessage(results, event.threadID, () => api.unsendMessage(msg.messageID));
    }
};
