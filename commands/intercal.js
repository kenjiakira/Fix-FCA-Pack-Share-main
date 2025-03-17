module.exports = {
    name: "intercal",
    info: "INTERCAL Code Executor",
    category: "Tiện Ích",
    usages: ".intercal [code]",
    cooldowns: 5,
    dev: "HNT",
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🔀 INTERCAL CODE EXECUTOR\n" +
                "━━━━━━━━━━━━━━━━━━━\n\n" +
                "Cách dùng: .intercal [code]\n\n" +
                "Ví dụ:\n" +
                ".intercal DO ,1 <- #13\n" +
                "        DO ,1 SUB #1 <- #238\n" +
                "        DO ,1 SUB #2 <- #108\n" +
                "        PLEASE READ OUT ,1\n" +
                "        PLEASE GIVE UP\n\n" +
                "💡 Lưu ý: INTERCAL là ngôn ngữ hỗn loạn nhất!", 
                threadID
            );
        }

        const code = target.join(" ");
        
        try {
            const result = executeIntercal(code);
            return api.sendMessage(
                "🔀 INTERCAL OUTPUT\n" +
                "━━━━━━━━━━━━━━━━━━━\n\n" +
                `📥 Code:\n${code}\n\n` +
                `📤 Output:\n${result}`,
                threadID
            );
        } catch (error) {
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\n` +
                "💡 Kiểm tra lại cú pháp INTERCAL!",
                threadID
            );
        }
    }
};

function executeIntercal(code) {
    // Cơ bản của INTERCAL interpreter
    let memory = new Array(65536).fill(0);
    let output = "";
    
    // Tách code thành từng dòng
    const lines = code.split('\n').map(line => line.trim());
    
    // Xử lý từng dòng lệnh INTERCAL
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Bỏ qua dòng trống
        if (!line) continue;
        
        // Kiểm tra từ khóa PLEASE/DO
        if (!line.startsWith('PLEASE') && !line.startsWith('DO')) {
            throw new Error('INTERCAL cần từ khóa PLEASE hoặc DO!');
        }

        // Phân tích cú pháp dòng lệnh
        if (line.includes('<-')) {
            // Xử lý phép gán
            const [dest, value] = line.split('<-').map(x => x.trim());
            const destAddr = parseIntercalAddress(dest);
            const val = parseIntercalValue(value);
            memory[destAddr] = val;
        } else if (line.includes('READ OUT')) {
            // Xử lý lệnh xuất
            const addr = parseIntercalAddress(line.split('READ OUT')[1].trim());
            output += String.fromCharCode(memory[addr]);
        } else if (line.includes('GIVE UP')) {
            // Kết thúc chương trình
            break;
        }
    }
    
    return output || "Không có output";
}

function parseIntercalAddress(expr) {
    // Phân tích địa chỉ INTERCAL
    if (expr.startsWith(',')) {
        return parseInt(expr.slice(1)) || 0;
    }
    return 0;
}

function parseIntercalValue(expr) {
    // Phân tích giá trị INTERCAL
    if (expr.startsWith('#')) {
        return parseInt(expr.slice(1)) || 0;
    }
    return 0;
}

function interceptMessage(msg) {
    // INTERCAL thường có 1/5 cơ hội từ chối thực thi
    if (Math.random() < 0.2) {
        throw new Error("PROGRAMMER IS INSUFFICIENTLY POLITE");
    }
    return msg;
}
