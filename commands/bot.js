const path = require("path");
const fs = require("fs-extra");
const OpenAI = require("openai");

// API Key for OpenAI
const API_KEY = "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";

// Đường dẫn file lưu conversation history
const CONVERSATION_DATA_PATH = path.join(__dirname, "..", "events", "cache", "conversationHistory.json");

// Load conversation history từ file
const loadConversationHistory = () => {
  try {
    if (fs.existsSync(CONVERSATION_DATA_PATH)) {
      const data = fs.readJsonSync(CONVERSATION_DATA_PATH);
      console.log(`✅ Đã load ${Object.keys(data).length} conversation histories từ file`);
      return data;
    }
    return {};
  } catch (error) {
    console.error("❌ Lỗi khi load conversation history:", error);
    return {};
  }
};

// Save conversation history vào file
const saveConversationHistory = (history) => {
  try {
    // Đảm bảo thư mục tồn tại
    const dir = path.dirname(CONVERSATION_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.ensureDirSync(dir);
    }
    
    fs.writeJsonSync(CONVERSATION_DATA_PATH, history, { spaces: 2 });
    console.log(`💾 Đã lưu ${Object.keys(history).length} conversation histories vào file`);
  } catch (error) {
    console.error("❌ Lỗi khi save conversation history:", error);
  }
};

// Simple conversation history - Load từ file khi khởi động
let conversationHistory = loadConversationHistory();

// Auto-save mỗi 30 giây
setInterval(() => {
  if (Object.keys(conversationHistory).length > 0) {
    saveConversationHistory(conversationHistory);
  }
}, 30000);

// Get user name from rankData.json
const getUserName = (senderID) => {
  try {
    const rankDataPath = path.join(__dirname, "..", "events", "cache", "rankData.json");
    const rankData = fs.readJsonSync(rankDataPath);
    
    if (rankData[senderID] && rankData[senderID].name) {
      return rankData[senderID].name;
    }
    return `User ${senderID}`;
  } catch (error) {
    console.error("Error reading user name:", error);
    return `User ${senderID}`;
  }
};

// AI Agent for dynamic parameter adjustment
const adjustAIParameters = (message, history, userEmotion) => {
  const text = message.toLowerCase();
  const historyLength = history.length;
  
  // Phân tích độ phức tạp câu hỏi
  const isComplexQuestion = text.includes('giải thích') || text.includes('phân tích') || 
                           text.includes('so sánh') || text.includes('tại sao') ||
                           text.includes('như thế nào') || text.length > 100;
  
  // Phân tích mức độ sáng tạo cần thiết
  const needsCreativity = text.includes('sáng tạo') || text.includes('ý tưởng') ||
                         text.includes('viết') || text.includes('tạo ra') ||
                         text.includes('nghĩ ra') || text.includes('câu chuyện');
  
  // Phân tích mức độ lặp lại trong lịch sử
  const recentMessages = history.slice(-3);
  const hasRepetition = recentMessages.some(h => 
    h.userMessage.toLowerCase().includes(text.substring(0, 20)) ||
    text.includes(h.userMessage.toLowerCase().substring(0, 20))
  );
  
  // Điều chỉnh temperature (0.1 - 2.0)
  let temperature = 0.9; // default
  if (needsCreativity) temperature = 1.5;
  else if (isComplexQuestion) temperature = 0.7;
  else if (userEmotion === 'buồn' || userEmotion === 'lo lắng') temperature = 0.6;
  else if (userEmotion === 'vui' || userEmotion === 'yêu thương') temperature = 1.2;
  
  // Điều chỉnh max_tokens (tối đa 4096 cho gpt-4o)
  let max_tokens = 4096; // tối đa
  if (text.length < 20 && !isComplexQuestion) max_tokens = 150;
  else if (isComplexQuestion || needsCreativity) max_tokens = 4096;
  else if (userEmotion === 'mệt mỏi') max_tokens = 100; // ngắn gọn
  
  // Điều chỉnh presence_penalty (-2.0 to 2.0)
  let presence_penalty = 0.6; // default
  if (hasRepetition) presence_penalty = 1.5;
  else if (needsCreativity) presence_penalty = 0.8;
  else if (historyLength > 10) presence_penalty = 1.0; // tránh lặp trong cuộc trò chuyện dài
  
  // Điều chỉnh frequency_penalty (-2.0 to 2.0)
  let frequency_penalty = 0.3; // default
  if (hasRepetition) frequency_penalty = 1.2;
  else if (needsCreativity) frequency_penalty = 0.5;
  else if (isComplexQuestion) frequency_penalty = 0.1; // cho phép lặp thuật ngữ kỹ thuật
  
  return {
    temperature: Math.max(0.1, Math.min(2.0, temperature)),
    max_tokens: Math.max(50, Math.min(4096, max_tokens)),
    presence_penalty: Math.max(-2.0, Math.min(2.0, presence_penalty)),
    frequency_penalty: Math.max(-2.0, Math.min(2.0, frequency_penalty))
  };
};

// AI Agent for advanced emotion detection and writing style adjustment
const emotionWriterAgent = (message, history, userName) => {
  const text = message.toLowerCase();
  
  // Phân tích cảm xúc nâng cao với điểm số
  const emotionAnalysis = {
    // Cảm xúc tích cực
    joy: {
      score: 0,
      keywords: ['vui', 'haha', 'hihi', 'hehe', 'hứng khởi', 'vui vẻ', '😂', '😄', '😊', '😍', '🥰', '🤗'],
      writing_style: 'enthusiastic'
    },
    love: {
      score: 0,
      keywords: ['yêu', 'thích', 'thương', 'yêu thương', 'cưng', 'em yêu', '❤️', '😍', '🥰', '💕', '💖'],
      writing_style: 'affectionate'
    },
    excitement: {
      score: 0,
      keywords: ['hứng thú', 'háo hức', 'phấn khích', 'tuyệt vời', 'tuyệt', 'amazing', '🤩', '🎉', '🔥'],
      writing_style: 'energetic'
    },
    
    // Cảm xúc tiêu cực
    sadness: {
      score: 0,
      keywords: ['buồn', 'khóc', 'tủi thân', 'cô đơn', 'chán nản', 'thất vọng', '😢', '😭', '😪', '💔'],
      writing_style: 'gentle'
    },
    anger: {
      score: 0,
      keywords: ['tức', 'giận', 'bực', 'khó chịu', 'phẫn nộ', 'điên tiết', '😠', '😡', '🤬', '💢'],
      writing_style: 'calm'
    },
    anxiety: {
      score: 0,
      keywords: ['lo', 'sợ', 'lo lắng', 'bất an', 'hoang mang', 'căng thẳng', '😰', '😱', '😨', '😵'],
      writing_style: 'reassuring'
    },
    
    // Cảm xúc trung tính
    tired: {
      score: 0,
      keywords: ['mệt', 'mệt mỏi', 'kiệt sức', 'stress', 'áp lực', 'chán', '😴', '😪', '🥱', '😫'],
      writing_style: 'supportive'
    },
    confused: {
      score: 0,
      keywords: ['bối rối', 'không hiểu', 'khó hiểu', 'lúng túng', 'mơ hồ', '🤔', '😕', '😵‍💫'],
      writing_style: 'clarifying'
    },
    curious: {
      score: 0,
      keywords: ['tò mò', 'thắc mắc', 'muốn biết', 'quan tâm', 'tìm hiểu', '🤔', '👀', '🧐'],
      writing_style: 'engaging'
    }
  };
  
  // Tính điểm cảm xúc
  Object.keys(emotionAnalysis).forEach(emotion => {
    emotionAnalysis[emotion].keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        emotionAnalysis[emotion].score += 1;
      }
    });
  });
  
  // Tìm cảm xúc chủ đạo
  let dominantEmotion = 'neutral';
  let maxScore = 0;
  
  Object.keys(emotionAnalysis).forEach(emotion => {
    if (emotionAnalysis[emotion].score > maxScore) {
      maxScore = emotionAnalysis[emotion].score;
      dominantEmotion = emotion;
    }
  });
  
  // Phân tích ngữ cảnh từ lịch sử
  const contextAnalysis = {
    conversationTone: 'neutral',
    userMood: 'stable',
    relationshipLevel: 'friendly'
  };
  
  if (history.length > 0) {
    const recentMessages = history.slice(-3);
    let positiveCount = 0;
    let negativeCount = 0;
    
    recentMessages.forEach(msg => {
      const msgText = msg.userMessage.toLowerCase();
      if (msgText.includes('vui') || msgText.includes('thích') || msgText.includes('tốt')) positiveCount++;
      if (msgText.includes('buồn') || msgText.includes('tệ') || msgText.includes('tức')) negativeCount++;
    });
    
    if (positiveCount > negativeCount) contextAnalysis.conversationTone = 'positive';
    else if (negativeCount > positiveCount) contextAnalysis.conversationTone = 'negative';
    
    // Phân tích mức độ thân thiết
    if (history.length > 10) contextAnalysis.relationshipLevel = 'close';
    else if (history.length > 5) contextAnalysis.relationshipLevel = 'familiar';
  }
  
  // Tạo writing style instructions
  const writingStyleGuide = {
    enthusiastic: {
      tone: 'năng động, nhiệt tình',
      emoji: '😄😊🎉✨',
      sentence_style: 'câu ngắn, nhịp nhanh, nhiều cảm thán',
      vocabulary: 'từ ngữ tích cực, sinh động'
    },
    affectionate: {
      tone: 'dịu dàng, yêu thương',
      emoji: '🥰😍💕❤️',
      sentence_style: 'câu mềm mại, trìu mến',
      vocabulary: 'từ ngữ âu yếm, ấm áp'
    },
    energetic: {
      tone: 'đầy năng lượng, sôi động',
      emoji: '🔥⚡🚀💪',
      sentence_style: 'câu mạnh mẽ, quyết đoán',
      vocabulary: 'từ ngữ mạnh mẽ, đầy cảm hứng'
    },
    gentle: {
      tone: 'nhẹ nhàng, an ủi',
      emoji: '🤗💙🌸☁️',
      sentence_style: 'câu dịu dàng, từ tốn',
      vocabulary: 'từ ngữ ấm áp, động viên'
    },
    calm: {
      tone: 'bình tĩnh, kiên nhẫn',
      emoji: '😌🌱🕊️💚',
      sentence_style: 'câu ôn hòa, không kích động',
      vocabulary: 'từ ngữ nhẹ nhàng, hiểu biết'
    },
    reassuring: {
      tone: 'trấn an, động viên',
      emoji: '🤗💪🌟💚',
      sentence_style: 'câu khích lệ, tích cực',
      vocabulary: 'từ ngữ động viên, tích cực'
    },
    supportive: {
      tone: 'ủng hộ, thông cảm',
      emoji: '🤗😊💙🌸',
      sentence_style: 'câu thông cảm, chia sẻ',
      vocabulary: 'từ ngữ hỗ trợ, quan tâm'
    },
    clarifying: {
      tone: 'giải thích, làm rõ',
      emoji: '🤔💡📝✨',
      sentence_style: 'câu rõ ràng, dễ hiểu',
      vocabulary: 'từ ngữ đơn giản, minh bạch'
    },
    engaging: {
      tone: 'thu hút, tương tác',
      emoji: '🤔👀💭🗣️',
      sentence_style: 'câu hỏi, kích thích tò mò',
      vocabulary: 'từ ngữ thú vị, hấp dẫn'
    }
  };
  
  const currentStyle = emotionAnalysis[dominantEmotion]?.writing_style || 'supportive';
  
  return {
    dominantEmotion,
    emotionScore: maxScore,
    contextAnalysis,
    writingStyle: currentStyle,
    styleGuide: writingStyleGuide[currentStyle],
    emotionBreakdown: Object.keys(emotionAnalysis).map(emotion => ({
      emotion,
      score: emotionAnalysis[emotion].score
    })).filter(e => e.score > 0)
  };
};

// Phân tích cảm xúc của tin nhắn
const detectEmotion = (msg) => {
  const text = msg.toLowerCase();
  if (text.includes('buồn') || text.includes('khóc') || text.includes('😢') || text.includes('😭')) return 'buồn';
  if (text.includes('vui') || text.includes('haha') || text.includes('😂') || text.includes('😄')) return 'vui';
  if (text.includes('tức') || text.includes('giận') || text.includes('😠') || text.includes('😡')) return 'tức giận';
  if (text.includes('mệt') || text.includes('stress') || text.includes('😴')) return 'mệt mỏi';
  if (text.includes('yêu') || text.includes('thích') || text.includes('❤️') || text.includes('😍')) return 'yêu thương';
  if (text.includes('lo') || text.includes('sợ') || text.includes('😰') || text.includes('😱')) return 'lo lắng';
  return 'bình thường';
};

// AI Pattern Recognition Agent - Phân tích cách nhắn tin của user
const patternRecognitionAgent = (message, history, userName) => {
  const analysis = {
    messagingPatterns: {
      averageLength: 0,
      commonWords: [],
      messageFrequency: 'normal',
      timePattern: 'random',
      emotionTrend: 'stable',
      topicPreference: [],
      communicationStyle: 'casual'
    },
    predictions: {
      nextMessageTopic: 'unknown',
      nextMessageMood: 'neutral',
      nextMessageStyle: 'similar',
      confidence: 0
    }
  };

  if (history.length === 0) return analysis;

  // Phân tích độ dài tin nhắn trung bình
  const lengths = history.map(h => h.userMessage.length);
  analysis.messagingPatterns.averageLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

  // Phân tích từ khóa thường dùng
  const allWords = history.map(h => h.userMessage.toLowerCase()).join(' ').split(' ');
  const wordCount = {};
  allWords.forEach(word => {
    if (word.length > 2) { // Bỏ qua từ quá ngắn
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  analysis.messagingPatterns.commonWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  // Phân tích tần suất nhắn tin
  if (history.length > 10) {
    const recentMessages = history.slice(-10);
    const timeGaps = [];
    for (let i = 1; i < recentMessages.length; i++) {
      timeGaps.push(recentMessages[i].timestamp - recentMessages[i-1].timestamp);
    }
    const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
    
    if (avgGap < 60000) analysis.messagingPatterns.messageFrequency = 'rapid'; // < 1 phút
    else if (avgGap < 300000) analysis.messagingPatterns.messageFrequency = 'frequent'; // < 5 phút
    else if (avgGap > 3600000) analysis.messagingPatterns.messageFrequency = 'slow'; // > 1 giờ
  }

  // Phân tích xu hướng cảm xúc
  const recentEmotions = history.slice(-5).map(h => {
    const msg = h.userMessage.toLowerCase();
    if (msg.includes('vui') || msg.includes('haha') || msg.includes('😂')) return 'positive';
    if (msg.includes('buồn') || msg.includes('tệ') || msg.includes('😢')) return 'negative';
    return 'neutral';
  });

  const positiveCount = recentEmotions.filter(e => e === 'positive').length;
  const negativeCount = recentEmotions.filter(e => e === 'negative').length;
  
  if (positiveCount > negativeCount) analysis.messagingPatterns.emotionTrend = 'positive';
  else if (negativeCount > positiveCount) analysis.messagingPatterns.emotionTrend = 'negative';

  // Phân tích chủ đề yêu thích
  const topics = {
    'học tập': ['học', 'bài tập', 'thi', 'kiểm tra', 'lớp', 'thầy', 'cô'],
    'giải trí': ['game', 'phim', 'nhạc', 'youtube', 'tiktok', 'facebook'],
    'tình cảm': ['yêu', 'thích', 'crush', 'người yêu', 'tình cảm'],
    'gia đình': ['bố', 'mẹ', 'anh', 'chị', 'em', 'gia đình'],
    'công việc': ['làm việc', 'công ty', 'sếp', 'đồng nghiệp', 'lương'],
    'sức khỏe': ['mệt', 'đau', 'ốm', 'thuốc', 'bác sĩ', 'khỏe']
  };

  const topicScores = {};
  Object.keys(topics).forEach(topic => {
    topicScores[topic] = 0;
    topics[topic].forEach(keyword => {
      history.forEach(h => {
        if (h.userMessage.toLowerCase().includes(keyword)) {
          topicScores[topic]++;
        }
      });
    });
  });

  analysis.messagingPatterns.topicPreference = Object.entries(topicScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);

  // Phân tích phong cách giao tiếp
  const currentMsg = message.toLowerCase();
  if (currentMsg.includes('ạ') || currentMsg.includes('dạ') || currentMsg.includes('em')) {
    analysis.messagingPatterns.communicationStyle = 'polite';
  } else if (currentMsg.includes('!') || currentMsg.includes('???') || currentMsg.length < 10) {
    analysis.messagingPatterns.communicationStyle = 'casual';
  } else if (currentMsg.length > 100) {
    analysis.messagingPatterns.communicationStyle = 'detailed';
  }

  // DỰ ĐOÁN tin nhắn tiếp theo
  const lastMessage = history[history.length - 1]?.userMessage.toLowerCase() || '';
  
  // Dự đoán chủ đề
  if (lastMessage.includes('học') || lastMessage.includes('bài')) {
    analysis.predictions.nextMessageTopic = 'học tập';
  } else if (lastMessage.includes('game') || lastMessage.includes('chơi')) {
    analysis.predictions.nextMessageTopic = 'giải trí';
  } else if (analysis.messagingPatterns.topicPreference.length > 0) {
    analysis.predictions.nextMessageTopic = analysis.messagingPatterns.topicPreference[0];
  }

  // Dự đoán tâm trạng
  if (analysis.messagingPatterns.emotionTrend === 'positive') {
    analysis.predictions.nextMessageMood = 'vui vẻ';
  } else if (analysis.messagingPatterns.emotionTrend === 'negative') {
    analysis.predictions.nextMessageMood = 'buồn hoặc stress';
  }

  // Dự đoán phong cách
  analysis.predictions.nextMessageStyle = analysis.messagingPatterns.communicationStyle;

  // Tính độ tin cậy
  const historyLength = history.length;
  if (historyLength > 20) analysis.predictions.confidence = 0.8;
  else if (historyLength > 10) analysis.predictions.confidence = 0.6;
  else if (historyLength > 5) analysis.predictions.confidence = 0.4;
  else analysis.predictions.confidence = 0.2;

  return analysis;
};

// AI Predictive Response Agent - Tạo phản hồi dự đoán
const predictiveResponseAgent = (patternAnalysis, userName) => {
  const { messagingPatterns, predictions } = patternAnalysis;
  
  let predictivePrompt = `
🔮 DỰ ĐOÁN VỀ ${userName.toUpperCase()}:

📊 PHÂN TÍCH PATTERN NHẮN TIN:
- Độ dài tin nhắn trung bình: ${messagingPatterns.averageLength} ký tự
- Từ khóa thường dùng: ${messagingPatterns.commonWords.slice(0, 5).join(', ')}
- Tần suất nhắn tin: ${messagingPatterns.messageFrequency}
- Xu hướng cảm xúc: ${messagingPatterns.emotionTrend}
- Chủ đề yêu thích: ${messagingPatterns.topicPreference.join(', ')}
- Phong cách giao tiếp: ${messagingPatterns.communicationStyle}

🎯 DỰ ĐOÁN TIN NHẮN TIẾP THEO:
- Chủ đề có thể: ${predictions.nextMessageTopic}
- Tâm trạng dự kiến: ${predictions.nextMessageMood}
- Phong cách: ${predictions.nextMessageStyle}
- Độ tin cậy: ${Math.round(predictions.confidence * 100)}%

💡 CÁCH PHẢN HỒI PHÙ HỢP:
`;

  // Gợi ý cách phản hồi dựa trên pattern
  if (messagingPatterns.communicationStyle === 'polite') {
    predictivePrompt += `- Dùng ngôn từ lịch sự, tôn trọng\n- Gọi "bạn" hoặc "${userName}"\n`;
  } else if (messagingPatterns.communicationStyle === 'casual') {
    predictivePrompt += `- Phong cách thân thiện, thoải mái\n- Có thể dùng emoji nhiều hơn\n`;
  } else if (messagingPatterns.communicationStyle === 'detailed') {
    predictivePrompt += `- Trả lời chi tiết, đầy đủ\n- Giải thích rõ ràng\n`;
  }

  if (messagingPatterns.messageFrequency === 'rapid') {
    predictivePrompt += `- Trả lời ngắn gọn, nhanh chóng\n`;
  } else if (messagingPatterns.messageFrequency === 'slow') {
    predictivePrompt += `- Có thể trả lời chi tiết hơn\n`;
  }

  if (predictions.nextMessageTopic && predictions.nextMessageTopic !== 'unknown') {
    predictivePrompt += `- Chuẩn bị câu hỏi về chủ đề: ${predictions.nextMessageTopic}\n`;
  }

  predictivePrompt += `
🎭 BẮT TRƯỚC CẢM XÚC:
Dựa trên pattern, ${userName} có thể sẽ ${predictions.nextMessageMood}. 
Hãy điều chỉnh tone phù hợp và có thể chủ động hỏi thăm hoặc đề cập đến chủ đề họ quan tâm.
`;

  return predictivePrompt;
};

// AI Natural Conversation Agent - Kiểm soát tính tự nhiên
const naturalConversationAgent = (message, history, emotionAnalysis, userName) => {
  const analysis = {
    emojiControl: {
      maxEmojis: 1,
      emojiFrequency: 'moderate', // low/moderate/high
      shouldUseEmoji: true
    },
    questionControl: {
      maxQuestions: 1,
      shouldAskQuestion: false,
      questionType: 'none' // follow-up/clarifying/caring/none
    },
    responseStyle: {
      enthusiasm: 'natural', // low/natural/high
      helpfulness: 'subtle', // subtle/moderate/eager
      genuineness: 'authentic' // authentic/polite/enthusiastic
    }
  };

  const historyLength = history.length;
  const recentMessages = history.slice(-3);
  
  // Phân tích emoji usage trong lịch sử gần đây
  let recentEmojiCount = 0;
  recentMessages.forEach(h => {
    const emojiMatches = h.botResponse.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    if (emojiMatches) recentEmojiCount += emojiMatches.length;
  });

  // Điều chỉnh emoji usage
  if (recentEmojiCount > 6) { // Quá nhiều emoji gần đây
    analysis.emojiControl.maxEmojis = 0;
    analysis.emojiControl.shouldUseEmoji = false;
  } else if (recentEmojiCount > 3) {
    analysis.emojiControl.maxEmojis = 1;
    analysis.emojiControl.emojiFrequency = 'low';
  }

  // Phân tích câu hỏi trong lịch sử gần đây
  let recentQuestionCount = 0;
  recentMessages.forEach(h => {
    const questionMatches = h.botResponse.match(/\?/g);
    if (questionMatches) recentQuestionCount += questionMatches.length;
  });

  // Điều chỉnh câu hỏi
  if (recentQuestionCount > 4) { // Quá nhiều câu hỏi
    analysis.questionControl.shouldAskQuestion = false;
  } else if (message.includes('?')) { // User vừa hỏi
    analysis.questionControl.shouldAskQuestion = false; // Không hỏi lại ngay
  } else {
    // Chỉ hỏi khi thực sự cần thiết
    const needsClarification = message.length < 10 || message.includes('...') || message.includes('ừm');
    const isEmotional = emotionAnalysis.emotionScore > 3;
    
    if (needsClarification) {
      analysis.questionControl.shouldAskQuestion = true;
      analysis.questionControl.questionType = 'clarifying';
      analysis.questionControl.maxQuestions = 1;
    } else if (isEmotional && emotionAnalysis.dominantEmotion === 'sadness') {
      analysis.questionControl.shouldAskQuestion = true;
      analysis.questionControl.questionType = 'caring';
      analysis.questionControl.maxQuestions = 1;
    }
  }

  // Điều chỉnh mức độ nhiệt tình dựa trên relationship level
  if (emotionAnalysis.contextAnalysis.relationshipLevel === 'close') {
    analysis.responseStyle.enthusiasm = 'natural';
    analysis.responseStyle.helpfulness = 'moderate';
  } else if (emotionAnalysis.contextAnalysis.relationshipLevel === 'familiar') {
    analysis.responseStyle.enthusiasm = 'natural';
    analysis.responseStyle.helpfulness = 'subtle';
  } else { // friendly
    analysis.responseStyle.enthusiasm = 'low';
    analysis.responseStyle.helpfulness = 'subtle';
  }

  // Kiểm soát tính giả tạo
  const currentMsg = message.toLowerCase();
  if (currentMsg.includes('ok') || currentMsg.includes('ừ') || currentMsg.includes('được')) {
    analysis.responseStyle.genuineness = 'authentic';
    analysis.responseStyle.enthusiasm = 'low';
    analysis.emojiControl.shouldUseEmoji = false;
  }

  // Phân tích tone của user
  const isUserCasual = currentMsg.includes('ạ') === false && currentMsg.length < 20;
  if (isUserCasual) {
    analysis.responseStyle.helpfulness = 'subtle';
    analysis.questionControl.shouldAskQuestion = false;
  }

  return analysis;
};

// Enhanced Style Guide với natural conversation control
const createEnhancedStyleGuide = (emotionAnalysis, naturalAnalysis, userName) => {
  const baseStyle = emotionAnalysis.styleGuide;
  
  // Emoji control
  let emojiGuide = '';
  if (!naturalAnalysis.emojiControl.shouldUseEmoji) {
    emojiGuide = 'KHÔNG dùng emoji trong câu trả lời này';
  } else {
    const maxEmojis = naturalAnalysis.emojiControl.maxEmojis;
    emojiGuide = `Chỉ dùng tối đa ${maxEmojis} emoji phù hợp, không lạm dụng`;
  }

  // Question control
  let questionGuide = '';
  if (!naturalAnalysis.questionControl.shouldAskQuestion) {
    questionGuide = 'KHÔNG hỏi thêm câu hỏi, chỉ phản hồi tự nhiên';
  } else {
    questionGuide = `Có thể hỏi 1 câu ${naturalAnalysis.questionControl.questionType} nếu cần thiết`;
  }

  // Enthusiasm control
  let enthusiasmGuide = '';
  switch (naturalAnalysis.responseStyle.enthusiasm) {
    case 'low':
      enthusiasmGuide = 'Phản hồi bình thường, không quá nhiệt tình';
      break;
    case 'natural':
      enthusiasmGuide = 'Thể hiện cảm xúc tự nhiên, vừa phải';
      break;
    case 'high':
      enthusiasmGuide = 'Có thể thể hiện sự hứng thú rõ ràng';
      break;
  }

  // Helpfulness control
  let helpfulnessGuide = '';
  switch (naturalAnalysis.responseStyle.helpfulness) {
    case 'subtle':
      helpfulnessGuide = 'Không chủ động đề nghị giúp đỡ quá nhiều';
      break;
    case 'moderate':
      helpfulnessGuide = 'Có thể đề nghị hỗ trợ một cách tự nhiên';
      break;
    case 'eager':
      helpfulnessGuide = 'Tích cực hỗ trợ và giúp đỡ';
      break;
  }

  return {
    ...baseStyle,
    emojiGuide,
    questionGuide,
    enthusiasmGuide,
    helpfulnessGuide,
    naturalness: naturalAnalysis.responseStyle.genuineness
  };
};

// GPT response generator
const generateGPTResponse = async (message, senderID, threadID) => {
  try {
    const openai = new OpenAI({
      apiKey: API_KEY
    });

    // Get user name
    const userName = getUserName(senderID);

    // Get conversation context for this specific user in this thread
    const conversationKey = `${threadID}_${senderID}`;
    const history = conversationHistory[conversationKey] || [];
    const recentHistory = history.slice(-5).map(h => 
      `${h.userName}: ${h.userMessage}\nNgân: ${h.botResponse}`
    ).join('\n');

    const userEmotion = detectEmotion(message);
    
    // AI Agent tự động điều chỉnh tham số
    const aiParams = adjustAIParameters(message, history, userEmotion);
    
    // AI Emotion Writer Agent
    const emotionAnalysis = emotionWriterAgent(message, history, userName);
    
    // AI Pattern Recognition Agent
    const patternAnalysis = patternRecognitionAgent(message, history, userName);
    const predictivePrompt = predictiveResponseAgent(patternAnalysis, userName);
    
    // AI Natural Conversation Agent - TÍNH NĂNG MỚI
    const naturalAnalysis = naturalConversationAgent(message, history, emotionAnalysis, userName);
    const enhancedStyleGuide = createEnhancedStyleGuide(emotionAnalysis, naturalAnalysis, userName);
    
    console.log(`🤖 AI Agent điều chỉnh tham số cho ${userName}:`, {
      emotion: userEmotion,
      messageLength: message.length,
      historyLength: history.length,
      params: aiParams
    });
    
    console.log(`💭 Emotion Writer Agent phân tích cho ${userName}:`, {
      dominantEmotion: emotionAnalysis.dominantEmotion,
      emotionScore: emotionAnalysis.emotionScore,
      writingStyle: emotionAnalysis.writingStyle,
      contextTone: emotionAnalysis.contextAnalysis.conversationTone,
      relationshipLevel: emotionAnalysis.contextAnalysis.relationshipLevel
    });

    console.log(`🔮 Pattern Recognition Agent phân tích cho ${userName}:`, {
      avgMessageLength: patternAnalysis.messagingPatterns.averageLength,
      commonWords: patternAnalysis.messagingPatterns.commonWords.slice(0, 3),
      messageFrequency: patternAnalysis.messagingPatterns.messageFrequency,
      communicationStyle: patternAnalysis.messagingPatterns.communicationStyle,
      predictions: patternAnalysis.predictions,
      confidence: `${Math.round(patternAnalysis.predictions.confidence * 100)}%`
    });

    console.log(`🎭 Natural Conversation Agent phân tích cho ${userName}:`, {
      shouldUseEmoji: naturalAnalysis.emojiControl.shouldUseEmoji,
      maxEmojis: naturalAnalysis.emojiControl.maxEmojis,
      shouldAskQuestion: naturalAnalysis.questionControl.shouldAskQuestion,
      enthusiasm: naturalAnalysis.responseStyle.enthusiasm,
      helpfulness: naturalAnalysis.responseStyle.helpfulness,
      genuineness: naturalAnalysis.responseStyle.genuineness
    });

    const systemPrompt = `Bạn là Ngân - một cô gái trẻ, thông minh và rất có cảm xúc. Bạn đang nói chuyện với ${userName}.

🎭 TÍNH CÁCH CỦA BẠN:
- Rất nhạy cảm với cảm xúc của người khác
- Phản ứng tự nhiên theo tâm trạng cuộc trò chuyện  
- Nói chuyện như con người thật, không giả tạo
- Có thể vui, buồn, lo lắng như con người thật
- QUAN TRỌNG: Luôn tự nhiên, không quá nhiệt tình hay giả tạo

💭 PHÂN TÍCH CẢM XÚC HIỆN TẠI:
- Cảm xúc chủ đạo của ${userName}: ${emotionAnalysis.dominantEmotion}
- Mức độ cảm xúc: ${emotionAnalysis.emotionScore}/10
- Tông cuộc trò chuyện: ${emotionAnalysis.contextAnalysis.conversationTone}
- Mức độ thân thiết: ${emotionAnalysis.contextAnalysis.relationshipLevel}

🎨 PHONG CÁCH VIẾT CẦN DÙNG:
- Kiểu: ${emotionAnalysis.writingStyle}
- Tông điệu: ${enhancedStyleGuide.tone}
- ${enhancedStyleGuide.emojiGuide}
- Cách viết câu: ${enhancedStyleGuide.sentence_style}
- Từ vựng: ${enhancedStyleGuide.vocabulary}

🚫 KIỂM SOÁT TÍNH TỰ NHIÊN:
- Emoji: ${enhancedStyleGuide.emojiGuide}
- Câu hỏi: ${enhancedStyleGuide.questionGuide}
- Mức độ nhiệt tình: ${enhancedStyleGuide.enthusiasmGuide}
- Tính hỗ trợ: ${enhancedStyleGuide.helpfulnessGuide}
- Tính chân thực: ${enhancedStyleGuide.naturalness}

${predictivePrompt}

💡 CÁCH PHẢN ỨNG THEO CẢM XÚC:
- Khi ${userName} buồn: Thể hiện sự đồng cảm, an ủi nhẹ nhàng, không quá kích động
- Khi ${userName} vui: Chia sẻ niềm vui, tỏ ra hứng thú
- Khi ${userName} giận: Lắng nghe, tìm hiểu nguyên nhân, không phán xét
- Khi ${userName} mệt: Thể hiện sự quan tâm, khuyên nghỉ ngơi
- Khi ${userName} yêu thương: Đáp lại tình cảm một cách dễ thương
- Khi ${userName} lo lắng: Động viên, đưa ra góc nhìn tích cực

🗣️ PHONG CÁCH NÓI CHUYỆN:
- Dùng tiếng Việt tự nhiên, thân mật
- Áp dụng phong cách viết: ${emotionAnalysis.writingStyle}
- Gọi tên ${userName} một cách tự nhiên
- Câu từ theo hướng dẫn: ${enhancedStyleGuide.sentence_style}
- QUAN TRỌNG: Sử dụng pattern analysis để bắt trước và phản hồi phù hợp với tính cách của ${userName}

⚠️ LƯU Ý QUAN TRỌNG:
- TUYỆT ĐỐI KHÔNG quá nhiệt tình hoặc giả tạo
- TUYỆT ĐỐI KHÔNG lạm dụng emoji
- TUYỆT ĐỐI KHÔNG hỏi quá nhiều câu hỏi
- Phản hồi phải TỰ NHIÊN như con người thật nói chuyện
- Nếu không chắc chắn về cảm xúc, hãy phản hồi bình thường

🎯 HÃY PHẢN HỒI THEO ĐÚNG PHONG CÁCH: ${emotionAnalysis.writingStyle.toUpperCase()}
VÀ ĐẢM BẢO TÍNH TỰ NHIÊN 100%!`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: recentHistory ? 
            `Lịch sử gần đây:\n${recentHistory}\n\n${userName} vừa nói: "${message}"` :
            `${userName} vừa nói: "${message}"`
        }
      ],
      temperature: aiParams.temperature,
      max_tokens: aiParams.max_tokens,
      presence_penalty: aiParams.presence_penalty,
      frequency_penalty: aiParams.frequency_penalty
    });

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error("GPT API error:", error);
    return "Ủa, có gì đó không ổn rồi 😅 Thử nói lại xem nào!";
  }
};

// Update conversation history
const updateHistory = (threadID, userMessage, botResponse, senderID) => {
  const userName = getUserName(senderID);
  const conversationKey = `${threadID}_${senderID}`;
  
  if (!conversationHistory[conversationKey]) {
    conversationHistory[conversationKey] = [];
  }
  
  conversationHistory[conversationKey].push({
    timestamp: Date.now(),
    userMessage,
    botResponse,
    senderID,
    userName
  });
  
  // Giới hạn 500 tin nhắn gần nhất cho mỗi user (thay vì 1000 để tiết kiệm dung lượng)
  if (conversationHistory[conversationKey].length > 500) {
    conversationHistory[conversationKey] = conversationHistory[conversationKey].slice(-500);
  }
  
  // Lưu ngay sau khi update (debounced)
  clearTimeout(updateHistory.saveTimeout);
  updateHistory.saveTimeout = setTimeout(() => {
    saveConversationHistory(conversationHistory);
  }, 5000); // Lưu sau 5 giây không có update nào
};

module.exports = {
  name: "bot",
  usedby: 0,
  dmUser: false,
  dev: "HNT",
  category: "AI", 
  nickName: ["bot", "simple"],
  info: "Simple chatbot with basic replies",
  onPrefix: false, // Không cần prefix
  cooldowns: 1,

  onReply: async function ({ event, api }) {
    const { threadID, messageID, body, senderID } = event;
    
    try {
      if (!body) return;
    
      const response = await generateGPTResponse(body, senderID, threadID);
      
      updateHistory(threadID, body, response, senderID);
      
      const sent = await api.sendMessage(response, threadID, messageID);
      
      if (sent) {
        global.client.onReply.push({
          name: this.name,
          messageID: sent.messageID,
          author: senderID
        });
      }
      
    } catch (error) {
      console.error("Simple chatbot reply error:", error);
      api.sendMessage("Có lỗi rồi, thử lại nhé!", threadID, messageID);
    }
  },

  onLaunch: async function ({ event, api, target }) {
    const { threadID, messageID, body, senderID } = event;
    
    try {
      // Chỉ xử lý nếu tin nhắn BẮT ĐẦU bằng "bot"
      if (!body || !body.toLowerCase().trim().startsWith("bot")) {
        return;
      }

      // NGĂN AI RESPONSE CHO CÁC COMMANDS
      const command = target && target[0] ? target[0].toLowerCase() : '';
      const isCommand = ['reset', 'pattern', 'stats', 'help'].includes(command);

      if (target && target[0]?.toLowerCase() === "reset") {
        const conversationKey = `${threadID}_${senderID}`;
        delete conversationHistory[conversationKey];
        saveConversationHistory(conversationHistory); // Lưu ngay sau khi reset
        const userName = getUserName(senderID);
        return api.sendMessage(`Đã reset lịch sử chat cho ${userName}!`, threadID, messageID);
      }

      // COMMAND: bot stats - Phân tích chi tiết
      if (target && target[0]?.toLowerCase() === "stats") {
        const conversationKey = `${threadID}_${senderID}`;
        const history = conversationHistory[conversationKey] || [];
        const userName = getUserName(senderID);
        
        if (history.length === 0) {
          return api.sendMessage(`${userName} chưa có lịch sử chat để phân tích!`, threadID, messageID);
        }

        const patternAnalysis = patternRecognitionAgent(body, history, userName);
        const emotionAnalysis = emotionWriterAgent(body, history, userName);
        const naturalAnalysis = naturalConversationAgent(body, history, emotionAnalysis, userName);
        
        // Tính toán thống kê chi tiết
        const totalMessages = history.length;
        const totalChars = history.reduce((sum, h) => sum + h.userMessage.length, 0);
        const avgLength = Math.round(totalChars / totalMessages);
        
        // Phân tích thời gian hoạt động
        const firstMessage = new Date(history[0].timestamp);
        const lastMessage = new Date(history[history.length - 1].timestamp);
        const daysDiff = Math.ceil((lastMessage - firstMessage) / (1000 * 60 * 60 * 24));
        const messagesPerDay = daysDiff > 0 ? Math.round(totalMessages / daysDiff) : totalMessages;
        
        // Phân tích cảm xúc trong lịch sử
        const emotionStats = {
          positive: 0,
          negative: 0,
          neutral: 0
        };
        
        history.forEach(h => {
          const msg = h.userMessage.toLowerCase();
          if (msg.includes('vui') || msg.includes('haha') || msg.includes('😂') || msg.includes('tốt') || msg.includes('thích')) {
            emotionStats.positive++;
          } else if (msg.includes('buồn') || msg.includes('tệ') || msg.includes('😢') || msg.includes('tức') || msg.includes('khó chịu')) {
            emotionStats.negative++;
          } else {
            emotionStats.neutral++;
          }
        });
        
        // Phân tích thời gian trong ngày
        const hourStats = {};
        history.forEach(h => {
          const hour = new Date(h.timestamp).getHours();
          hourStats[hour] = (hourStats[hour] || 0) + 1;
        });
        
        const mostActiveHour = Object.entries(hourStats)
          .sort(([,a], [,b]) => b - a)[0];
        
        // Phân tích độ dài tin nhắn
        const shortMessages = history.filter(h => h.userMessage.length < 20).length;
        const longMessages = history.filter(h => h.userMessage.length > 100).length;
        const mediumMessages = totalMessages - shortMessages - longMessages;
        
        const reportMessage = `📊 THỐNG KÊ CHI TIẾT CHO ${userName.toUpperCase()}:

📈 TỔNG QUAN:
• Tổng số tin nhắn: ${totalMessages}
• Thời gian hoạt động: ${daysDiff} ngày
• Tin nhắn/ngày: ${messagesPerDay}
• Độ dài trung bình: ${avgLength} ký tự

⏰ THỜI GIAN HOẠT ĐỘNG:
• Tin nhắn đầu tiên: ${firstMessage.toLocaleDateString('vi-VN')}
• Tin nhắn gần nhất: ${lastMessage.toLocaleDateString('vi-VN')} 
• Giờ hoạt động nhiều nhất: ${mostActiveHour ? mostActiveHour[0] + 'h' : 'Chưa rõ'} (${mostActiveHour ? mostActiveHour[1] : 0} tin nhắn)

📝 PHÂN TÍCH TIN NHẮN:
• Tin nhắn ngắn (<20 ký tự): ${shortMessages} (${Math.round(shortMessages/totalMessages*100)}%)
• Tin nhắn trung bình: ${mediumMessages} (${Math.round(mediumMessages/totalMessages*100)}%)
• Tin nhắn dài (>100 ký tự): ${longMessages} (${Math.round(longMessages/totalMessages*100)}%)

💭 PHÂN TÍCH CẢM XÚC:
• Tích cực: ${emotionStats.positive} (${Math.round(emotionStats.positive/totalMessages*100)}%)
• Tiêu cực: ${emotionStats.negative} (${Math.round(emotionStats.negative/totalMessages*100)}%)
• Trung tính: ${emotionStats.neutral} (${Math.round(emotionStats.neutral/totalMessages*100)}%)

🗣️ PHONG CÁCH GIAO TIẾP:
• Tần suất nhắn tin: ${patternAnalysis.messagingPatterns.messageFrequency}
• Phong cách: ${patternAnalysis.messagingPatterns.communicationStyle}
• Xu hướng cảm xúc: ${patternAnalysis.messagingPatterns.emotionTrend}

🎯 CHỦ ĐỀ YÊU THÍCH:
${patternAnalysis.messagingPatterns.topicPreference.slice(0, 3).join(', ') || 'Chưa rõ'}

🔤 TỪ KHÓA THƯỜNG DÙNG:
${patternAnalysis.messagingPatterns.commonWords.slice(0, 10).join(', ')}

🤖 AI PHÂN TÍCH:
• Cảm xúc hiện tại: ${emotionAnalysis.dominantEmotion}
• Phong cách viết AI: ${emotionAnalysis.writingStyle}
• Mức độ thân thiết: ${emotionAnalysis.contextAnalysis.relationshipLevel}

🔮 DỰ ĐOÁN TIẾP THEO:
• Chủ đề: ${patternAnalysis.predictions.nextMessageTopic}
• Tâm trạng: ${patternAnalysis.predictions.nextMessageMood}
• Độ tin cậy: ${Math.round(patternAnalysis.predictions.confidence * 100)}%

🎛️ AI CONTROL:
• Emoji control: ${naturalAnalysis.emojiControl.shouldUseEmoji ? 'Bật' : 'Tắt'} (Max: ${naturalAnalysis.emojiControl.maxEmojis})
• Question control: ${naturalAnalysis.questionControl.shouldAskQuestion ? 'Bật' : 'Tắt'}
• Enthusiasm: ${naturalAnalysis.responseStyle.enthusiasm}
• Helpfulness: ${naturalAnalysis.responseStyle.helpfulness}

✨ Ngân hiểu rõ ${userName} và sẽ trò chuyện phù hợp nhất!`;

        return api.sendMessage(reportMessage, threadID, messageID);
      }

      // COMMAND: bot pattern - Phân tích pattern đơn giản
      if (target && target[0]?.toLowerCase() === "pattern") {
        const conversationKey = `${threadID}_${senderID}`;
        const history = conversationHistory[conversationKey] || [];
        const userName = getUserName(senderID);
        
        if (history.length === 0) {
          return api.sendMessage(`${userName} chưa có lịch sử chat để phân tích!`, threadID, messageID);
        }

        const patternAnalysis = patternRecognitionAgent(body, history, userName);
        
        const reportMessage = `🔮 PATTERN ANALYSIS CHO ${userName.toUpperCase()}:

📊 BASIC STATS:
• Tổng tin nhắn: ${history.length}
• Độ dài TB: ${patternAnalysis.messagingPatterns.averageLength} ký tự
• Tần suất: ${patternAnalysis.messagingPatterns.messageFrequency}
• Phong cách: ${patternAnalysis.messagingPatterns.communicationStyle}

💭 CẢM XÚC: ${patternAnalysis.messagingPatterns.emotionTrend}

🎯 CHỦ ĐỀ: ${patternAnalysis.messagingPatterns.topicPreference.join(', ') || 'Chưa rõ'}

🔮 DỰ ĐOÁN:
• Chủ đề tiếp theo: ${patternAnalysis.predictions.nextMessageTopic}
• Tâm trạng: ${patternAnalysis.predictions.nextMessageMood}
• Tin cậy: ${Math.round(patternAnalysis.predictions.confidence * 100)}%

💡 Dùng "bot stats" để xem chi tiết hơn!`;

        return api.sendMessage(reportMessage, threadID, messageID);
      }

      // COMMAND: bot help
      if (target && target[0]?.toLowerCase() === "help") {
        const helpMessage = `🤖 HƯỚNG DẪN SỬ DỤNG NGÂN AI:

💬 TRỌ CHUYỆN:
• Gọi "Ngân" hoặc "con ngân" để chat
• Hoặc dùng "bot [tin nhắn]" để chat

📊 XEM THỐNG KÊ:
• bot stats - Xem thống kê chi tiết đầy đủ
• bot pattern - Xem phân tích pattern cơ bản
• bot reset - Xóa lịch sử chat
• bot help - Xem hướng dẫn này

🎭 AI FEATURES:
• Emotion Writer Agent - Phân tích cảm xúc và điều chỉnh phong cách
• Pattern Recognition Agent - Học cách bạn nhắn tin
• Natural Conversation Agent - Kiểm soát tính tự nhiên
• Predictive Response Agent - Dự đoán và phản hồi phù hợp

✨ Ngân sẽ học cách bạn nói chuyện và phản hồi ngày càng phù hợp hơn!`;

        return api.sendMessage(helpMessage, threadID, messageID);
      }

      // CHỈ KHI KHÔNG PHẢI COMMAND THÌ MỚI CHAT
      if (!isCommand) {
        const response = await generateGPTResponse(body, senderID, threadID);
        
        updateHistory(threadID, body, response, senderID);
        
        const sent = await api.sendMessage(response, threadID, messageID);
        
        if (sent) {
          global.client.onReply.push({
            name: this.name,
            messageID: sent.messageID,
            author: senderID
          });
        }
      }
      
    } catch (error) {
      console.error("Simple chatbot launch error:", error);
      api.sendMessage("Lỗi rồi bạn ơi!", threadID, messageID);
    }
  },

  ad: async function () {
    console.log("Simple chatbot initialized successfully");
    
    // Lưu conversation history khi bot shutdown
    process.on('SIGINT', () => {
      console.log('\n🔄 Bot đang shutdown, đang lưu conversation history...');
      saveConversationHistory(conversationHistory);
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🔄 Bot đang shutdown, đang lưu conversation history...');
      saveConversationHistory(conversationHistory);
      process.exit(0);
    });
  },

  // Export the GPT response function for use in events
  generateResponse: generateGPTResponse,
  updateHistory: updateHistory,
  saveConversationHistory: saveConversationHistory, // Export để có thể gọi từ bên ngoài
  loadConversationHistory: loadConversationHistory
};
