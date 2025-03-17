module.exports = {
    name: "brainfuck",
    info: "Brainfuck",
    category: "Tiện Ích",
    usages: ".brainfuck encode/decode/toook/frook/minify/art [input]",
    cooldowns: 5,
    dev: "HNT",
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID } = event;

        if (!target[0]) {
            return api.sendMessage(
                "🧠 BRAINFUCK ENCODER/DECODER\n" +
                "━━━━━━━━━━━━━━━━━━━\n\n" +
                "Cách dùng:\n" +
                "1. Mã hóa: .brainfuck encode [text]\n" +
                "2. Giải mã: .brainfuck decode [code]\n" +
                "3. Chuyển đổi: .brainfuck toook [code] (Brainfuck → Ook!)\n" +
                "4. Chuyển đổi: .brainfuck frook [code] (Ook! → Brainfuck)\n" +
                "5. Tối ưu: .brainfuck minify [code]\n" +
                "6. ASCII Art: .brainfuck art [text]\n\n" +
                "Ví dụ:\n" +
                ".brainfuck encode Hello\n" +
                ".brainfuck art Cat\n" +
                ".brainfuck minify +++++[>+++++<-]", 
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
            switch(mode) {
                case "encode":
                    result = textToBrainfuck(input);
                    break;
                case "decode":
                    result = brainfuckToText(input);
                    break;
                case "toook":
                    result = brainfuckToOok(input);
                    break;
                case "frook":
                    result = ookToBrainfuck(input);
                    break;
                case "minify":
                    result = minifyBrainfuck(input);
                    break;
                case "art":
                    result = textToAsciiArt(input);
                    break;
                default:
                    return api.sendMessage("❌ Mode không hợp lệ!", threadID);
            }

            return api.sendMessage(
                `${result}`,
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

function textToBrainfuck(text) {
    let output = "";
    let memory = Array(30000).fill(0);
    let pointer = 0;

    for (let char of text) {
        const targetValue = char.charCodeAt(0);
        
        // Tối ưu hóa để tạo mã ngắn hơn
        const sqrt = Math.floor(Math.sqrt(targetValue));
        output += "+".repeat(sqrt) + "[>" + "+".repeat(sqrt) + "<-]>";
        
        // Điều chỉnh để đạt giá trị chính xác
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
            case '>':
                pointer = (pointer + 1) % 30000;
                break;
            case '<':
                pointer = pointer - 1 < 0 ? 29999 : pointer - 1;
                break;
            case '+':
                memory[pointer] = (memory[pointer] + 1) % 256;
                break;
            case '-':
                memory[pointer] = memory[pointer] - 1 < 0 ? 255 : memory[pointer] - 1;
                break;
            case '.':
                output += String.fromCharCode(memory[pointer]);
                break;
            case ',':
                throw new Error("Input operation không được hỗ trợ");
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

function brainfuckToOok(code) {
    return code.split('').map(char => brainfuckToOokMap[char] || '').join('').trim();
}

function ookToBrainfuck(code) {
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

    let tokens = code.match(/Ook[.?!]\s+Ook[.?!]/g);
    if (!tokens) {
        throw new Error("Mã Ook! không hợp lệ!");
    }
    
    return tokens.map(token => 
        ookToBrainfuckMap[token.replace(/\s+/g, ' ').trim()] || ''
    ).join('');
}

function minifyBrainfuck(code) {
    // Loại bỏ tất cả các ký tự không phải brainfuck
    code = code.replace(/[^><\+\-\[\]\.,]/g, '');
    
    // Tối ưu các lệnh lặp
    let optimized = code;
    const patterns = [
        [/\+-/g, ''],
        [/-\+/g, ''],
        [/<>/g, ''],
        [/></g, ''],
        [/\[\+\]/g, ''],
        [/\[-\]/g, '']
    ];
    
    patterns.forEach(([pattern, replacement]) => {
        let lastLength;
        do {
            lastLength = optimized.length;
            optimized = optimized.replace(pattern, replacement);
        } while (optimized.length !== lastLength);
    });
    
    return optimized;
}

function textToAsciiArt(text) {
    const artMap = {
        'a': '╔═══╗\n║╔═╗║\n║║║║║\n║╚═╝║\n║╔═╗║\n╚╝─╚╝',
        'b': '╔══╗\n║╔╗║\n║╚╝╚╗\n║╔═╗║\n║╚═╝║\n╚═══╝',
        'c': '╔═══╗\n║╔══╝\n║║\n║║\n║╚══╗\n╚═══╝',
        // Thêm các chữ cái khác tương tự...
    };
    
    let result = '';
    for (let char of text.toLowerCase()) {
        if (artMap[char]) {
            result += artMap[char] + '\n\n';
        }
    }
    return result || 'Không thể tạo ASCII art cho văn bản này!';
}
