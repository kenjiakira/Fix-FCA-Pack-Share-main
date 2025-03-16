module.exports = {
    name: "ook",
    info: "Ook!",
    category: "Tiện ích",
    usages: ".ook encode [text] | .ook decode [code]",
    cooldowns: 5,
    dev: "HNT",
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🐒 OOK! ENCODER/DECODER\n" +
                "━━━━━━━━━━━━━━━━━━━\n\n" +
                "Cách dùng:\n" +
                "1. Mã hóa: .ook encode [text]\n" +
                "2. Giải mã: .ook decode [code]\n\n" +
                "Ví dụ:\n" +
                ".ook encode Hello\n" +
                ".ook decode Ook. Ook? Ook. Ook.", 
                threadID
            );
        }

        const mode = target[0].toLowerCase();
        const input = target.slice(1).join(" ");

        if (!input) {
            return api.sendMessage("❌ Vui lòng nhập nội dung cần xử lý!", threadID);
        }

        try {
            let result;
            if (mode === "encode") {
                result = textToOok(input);
            } else if (mode === "decode") {
                result = ookToText(input);
            } else {
                return api.sendMessage("❌ Mode không hợp lệ! Sử dụng 'encode' hoặc 'decode'", threadID);
            }

            return api.sendMessage(
                `🐒 OOK! ${mode.toUpperCase()}\n` +
                "━━━━━━━━━━━━━━━━━━━\n\n" +
                `📥 Input: ${input}\n\n` +
                `📤 Output: ${result}`,
                threadID
            );
        } catch (error) {
            return api.sendMessage(
                `❌ Lỗi: ${error.message}\n` +
                "💡 Vui lòng kiểm tra lại cú pháp!",
                threadID
            );
        }
    }
};

// Ook! to Brainfuck conversion map
const ookToBrainfuckMap = {
    'Ook. Ook?': '>',
    'Ook? Ook.': '<',
    'Ook. Ook.': '+',
    'Ook! Ook!': '-',
    'Ook! Ook.': '.',
    'Ook. Ook!': ',',
    'Ook! Ook?': '[',
    'Ook? Ook!': ']'
};

// Brainfuck to Ook! conversion map
const brainfuckToOokMap = {
    '>': 'Ook. Ook? ',
    '<': 'Ook? Ook. ',
    '+': 'Ook. Ook. ',
    '-': 'Ook! Ook! ',
    '.': 'Ook! Ook. ',
    ',': 'Ook. Ook! ',
    '[': 'Ook! Ook? ',
    ']': 'Ook? Ook! '
};

function textToOok(text) {
    // Convert text to Brainfuck first
    let brainfuck = textToBrainfuck(text);
    
    // Then convert Brainfuck to Ook!
    return brainfuck.split('').map(char => brainfuckToOokMap[char] || '').join('').trim();
}

function ookToText(code) {
    // Convert Ook! to Brainfuck
    let brainfuck = ookToBrainfuck(code);
    // Then convert Brainfuck to text
    return brainfuckToText(brainfuck);
}

function ookToBrainfuck(ookCode) {
    let brainfuck = '';
    let tokens = ookCode.match(/Ook[.?!]\s+Ook[.?!]/g);
    
    if (!tokens) {
        throw new Error("Mã Ook! không hợp lệ!");
    }
    
    tokens.forEach(token => {
        let bf = ookToBrainfuckMap[token.replace(/\s+/g, ' ').trim()];
        if (bf) {
            brainfuck += bf;
        }
    });
    
    return brainfuck;
}

function textToBrainfuck(text) {
    let output = "";
    
    for (let char of text) {
        const targetValue = char.charCodeAt(0);
        const sqrt = Math.floor(Math.sqrt(targetValue));
        output += "+".repeat(sqrt) + "[>" + "+".repeat(sqrt) + "<-]>";
        
        const remaining = targetValue - (sqrt * sqrt);
        if (remaining > 0) {
            output += "+".repeat(remaining);
        } else if (remaining < 0) {
            output += "-".repeat(Math.abs(remaining));
        }
        
        output += "." + "<";
    }
    
    return output;
}

function brainfuckToText(code) {
    let output = "";
    let memory = Array(30000).fill(0);
    let pointer = 0;
    let bracketStack = [];
    let i = 0;

    while (i < code.length) {
        switch (code[i]) {
            case '>': pointer = (pointer + 1) % 30000; break;
            case '<': pointer = pointer - 1 < 0 ? 29999 : pointer - 1; break;
            case '+': memory[pointer] = (memory[pointer] + 1) % 256; break;
            case '-': memory[pointer] = memory[pointer] - 1 < 0 ? 255 : memory[pointer] - 1; break;
            case '.': output += String.fromCharCode(memory[pointer]); break;
            case ',': throw new Error("Input operation không được hỗ trợ");
            case '[':
                if (memory[pointer] === 0) {
                    let count = 1;
                    while (count > 0) {
                        i++;
                        if (i >= code.length) throw new Error("Thiếu dấu đóng ngoặc ]");
                        if (code[i] === '[') count++;
                        if (code[i] === ']') count--;
                    }
                } else {
                    bracketStack.push(i);
                }
                break;
            case ']':
                if (bracketStack.length === 0) {
                    throw new Error("Dấu đóng ngoặc ] không khớp");
                }
                if (memory[pointer] !== 0) {
                    i = bracketStack[bracketStack.length - 1];
                } else {
                    bracketStack.pop();
                }
                break;
        }
        i++;
    }

    if (bracketStack.length > 0) {
        throw new Error("Thiếu dấu đóng ngoặc ]");
    }

    return output;
}
