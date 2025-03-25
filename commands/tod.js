const fs = require('fs');
const path = require('path');
const truthQuestions = [
    "Bạn đã từng thích ai trong group này chưa?",
    "Bạn đã từng nói dối về điều gì lớn nhất?",
    "Điều gì khiến bạn thấy xấu hổ nhất?",
    "Bạn đã từng làm điều gì bí mật mà chưa ai biết?",
    "Kỷ niệm đáng nhớ nhất của bạn là gì?",
    "Bạn có bí mật gì muốn chia sẻ không?",
    "Điều gì khiến bạn cảm thấy hạnh phúc nhất?",
    "Bạn thích điều gì ở bản thân mình nhất?",
    "Bạn đã từng crush ai trong group không?",
    "Điều gì khiến bạn khó chịu nhất ở người khác?",
    "Bạn có hối hận về điều gì không?",
    "Bạn đã từng làm gì khiến người khác tổn thương?",
    "Bạn có ước mơ gì chưa thực hiện được?",
    "Bạn sợ điều gì nhất?",
    "Bạn có tật xấu nào muốn sửa không?",
    "Bạn đã từng trộm gì chưa?",
    "Bạn đã từng nói xấu ai sau lưng chưa?",
    "Bạn có điều gì muốn thú nhận không?",
    "Bạn đã từng ghen tị với ai chưa?",
    "Bạn có điều gì muốn thay đổi về quá khứ không?",
    "Bạn đã từng làm gì để gây ấn tượng với người khác?",
    "Bạn có điều gì muốn xin lỗi ai không?",
    "Bạn đã từng lợi dụng ai chưa?",
    "Bạn có điều gì muốn cảm ơn ai không?",
    "Bạn đã từng phản bội ai chưa?",
    "Bạn có điều gì muốn tha thứ cho ai không?",
    "Bạn đã từng làm gì để giúp đỡ người khác?",
    "Bạn có điều gì muốn chia sẻ với mọi người không?",
    "Bạn đã từng yêu đơn phương ai chưa?",
    "Bạn có điều gì muốn giữ bí mật mãi mãi không?",
    "Bạn đã từng ước mình là người khác chưa?",
    "Bạn có điều gì muốn nói với người yêu cũ không?",
    "Bạn đã từng làm gì để vượt qua khó khăn?",
    "Bạn có điều gì muốn nhắn nhủ với bản thân trong tương lai không?",
    "Bạn đã từng làm gì để bảo vệ người mình yêu quý?",
    "Bạn có điều gì muốn nói với người mình ghét không?",
    "Bạn đã từng làm gì để thay đổi thế giới?",
    "Bạn có điều gì muốn học hỏi từ người khác không?",
    "Bạn đã từng làm gì để tạo niềm vui cho người khác?",
    "Bạn có điều gì muốn cống hiến cho xã hội không?"
];
const dareActions = [
    "Hãy nhắn tin cho crush của bạn!",
    "Đăng một status bất kỳ lên tường của bạn",
    "Gọi điện cho người bạn thân nhất",
    "Hát một bài hát trong group",
    "Thay avatar thành ảnh hài hước trong 1 giờ",
    "Nhắn tin tỏ tình với một người trong group",
    "Quay video nhảy một điệu nhảy ngắn",
    "Kể một câu chuyện cười",
    "Làm một việc mà người chọn sẽ yêu cầu",
    "Thể hiện một tài năng đặc biệt của bạn",
    "Tự sướng một kiểu ảnh ngớ ngẩn và gửi vào group",
    "Giả giọng một nhân vật nổi tiếng",
    "Đọc một đoạn rap tự chế",
    "Uống một ngụm nước mắm",
    "Ăn một miếng chanh không cần nhăn mặt",
    "Nhảy lò cò quanh phòng 3 vòng",
    "Hít đất 10 cái",
    "Kể một bí mật của người khác (nếu được cho phép)",
    "Tạo dáng như một siêu anh hùng",
    "Đọc một bài thơ tình",
    "Vẽ một bức tranh bằng chân",
    "Nói một câu tiếng Anh bất kỳ",
    "Hát một bài hát ru ngủ",
    "Nhái tiếng kêu của một con vật",
    "Tự giới thiệu bản thân bằng một giọng điệu hài hước",
    "Đội một vật dụng lên đầu và catwalk",
    "Làm một động tác yoga khó",
    "Kể một câu chuyện ma",
    "Đọc một đoạn tin tức bằng giọng MC",
    "Tự khen mình 3 câu",
    "Tự chê mình 3 câu",
    "Nhắn tin cho người yêu cũ và hỏi thăm",
    "Gọi điện cho một người lạ và hát một bài hát",
    "Đăng một video hát nhép lên story",
    "Tự tạo một thử thách cho người khác",
    "Làm một trò ảo thuật đơn giản",
    "Đọc một đoạn văn ngược",
    "Tự viết một bài hát ngắn",
    "Tự làm một món ăn đơn giản",
    "Tự tạo một câu đố vui"
];

module.exports = {
    name: "tod",
    dev: "HNT",
    category: "Games",
    info: "Chơi Truth or Dare",
    usages: "tod [truth/dare/luật]",
    cooldowns: 10,
    onPrefix: true,

    onLaunch: async function({ api, event, target }) {
        const { threadID, messageID, senderID } = event;

        if (!target[0] || target[0].toLowerCase() === "luật") {
            return api.sendMessage(
                "🎮 TRUTH OR DARE 🎮\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "Cách chơi:\n" +
                "• .tod truth - Chọn câu hỏi thật\n" +
                "• .tod dare - Chọn thử thách\n\n" +
                "Luật chơi:\n" +
                "1. Người chơi phải trả lời thật hoặc thực hiện thử thách\n" +
                "2. Không được từ chối khi đã chọn\n" +
                "3. Mỗi lượt chơi cách nhau 10 giây\n" +
                "4. Hãy tôn trọng và có văn hóa khi chơi\n\n" +
                "⚠️ Lưu ý: Đây chỉ là trò chơi giải trí, vui lòng không làm quá!",
                threadID, messageID
            );
        }

        const choice = target[0].toLowerCase();
        if (choice !== "truth" && choice !== "dare") {
            return api.sendMessage("❌ Vui lòng chọn 'truth' hoặc 'dare'!", threadID, messageID);
        }

        try {
            const userName = await getUserName(api, senderID);
            if (choice === "truth") {
                const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
                api.sendMessage(
                    "🤔 TRUTH 🤔\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `👤 Người chơi: ${userName}\n\n` +
                    `❓ Câu hỏi: ${question}\n\n` +
                    "⏳ Vui lòng trả lời trong 60 giây...",
                    threadID, messageID
                );
            } else {
                const dare = dareActions[Math.floor(Math.random() * dareActions.length)];
                api.sendMessage(
                    "😈 DARE 😈\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    `👤 Người chơi: ${userName}\n\n` +
                    `❗ Thử thách: ${dare}\n\n` +
                    "⏳ Vui lòng thực hiện trong 5 phút...",
                    threadID, messageID
                );
            }
        } catch (error) {
            console.error('Error:', error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID, messageID);
        }
    }
};

async function getUserName(api, userID) {
    try {
        const userInfo = await api.getUserInfo(userID);
        return userInfo[userID].name || "Người chơi";
    } catch {
        return "Người chơi";
    }
}
