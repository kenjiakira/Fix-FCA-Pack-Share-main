module.exports = {
    name: "study",
    info: "Tìm kiếm tài liệu học tập",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    usages: "study <category> [topic]",
    cooldowns: 10,

    onLaunch: async function ({ api, event, target }) {
        const { threadID, messageID } = event;
        
        const categories = {
            programming: ["python", "javascript", "java", "cpp", "ruby", "php"],
            dataScience: ["machine_learning", "data_analysis", "statistics", "ai"],
            languages: ["english", "japanese", "korean", "chinese"],
            design: ["ui_ux", "graphic_design", "web_design", "3d_modeling"],
            business: ["marketing", "finance", "management", "entrepreneurship"]
        };

        const resources = {
           
            python: [
                {
                    title: "Codecademy Python Course",
                    url: "https://www.codecademy.com/learn/learn-python-3",
                    rating: 4.8,
                    type: "Interactive"
                },
                "2. [Học Python tại W3Schools](https://www.w3schools.com/python/)",
                "3. [Khóa học Python miễn phí tại Coursera](https://www.coursera.org/courses?query=python)",
                "4. [Học Python với FreeCodeCamp](https://www.freecodecamp.org/learn/scientific-computing-with-python/)",
                "5. [Học Python qua YouTube](https://www.youtube.com/results?search_query=python+tutorial)"
            ],
            javascript: [   
                "1. [Học JavaScript tại W3Schools](https://www.w3schools.com/js/)",
                "2. [JavaScript for Beginners tại freeCodeCamp](https://www.freecodecamp.org/news/javascript-for-beginners/)",
                "3. [Học JavaScript tại MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)",
                "4. [Học JavaScript qua YouTube](https://www.youtube.com/results?search_query=learn+javascript+for+beginners)",
                "5. [Khóa học JavaScript miễn phí tại Coursera](https://www.coursera.org/courses?query=javascript)"
            ],
            java: [
                "1. [Học Java tại W3Schools](https://www.w3schools.com/java/)",
                "2. [Khóa học Java miễn phí tại Coursera](https://www.coursera.org/courses?query=java)",
                "3. [Học Java tại Udemy](https://www.udemy.com/topic/java/)",
                "4. [Java Programming với FreeCodeCamp](https://www.freecodecamp.org/news/learn-java-for-beginners/)"
            ],
            "machine learning": [
                "1. [Học Machine Learning tại Coursera](https://www.coursera.org/learn/machine-learning)",
                "2. [Machine Learning miễn phí với Google](https://developers.google.com/machine-learning/crash-course)",
                "3. [Học Machine Learning tại edX](https://www.edx.org/learn/machine-learning)",
                "4. [Khóa học Machine Learning miễn phí tại Udemy](https://www.udemy.com/topic/machine-learning/)"
            ],
            "data science": [
                "1. [Học Data Science tại Coursera](https://www.coursera.org/browse/data-science)",
                "2. [Học Data Science tại freeCodeCamp](https://www.freecodecamp.org/learn/data-analysis-with-python/)",
                "3. [Data Science with Python tại edX](https://www.edx.org/learn/data-science)",
                "4. [Tài liệu học Data Science với Kaggle](https://www.kaggle.com/learn/overview)"
            ],
            design: [
                "1. [Học thiết kế đồ họa tại Udemy](https://www.udemy.com/topic/graphic-design/)",
                "2. [Khóa học thiết kế đồ họa miễn phí tại Coursera](https://www.coursera.org/courses?query=graphic%20design)",
                "3. [Tài liệu học thiết kế với Canva Design School](https://www.canva.com/learn/design-school/)",
                "4. [Học thiết kế tại Skillshare](https://www.skillshare.com/browse/graphic-design)"
            ],
            english: [
                "1. [Học tiếng Anh với BBC Learning English](https://www.bbc.co.uk/learningenglish)",
                "2. [Học tiếng Anh miễn phí tại Duolingo](https://www.duolingo.com/)",
                "3. [Học tiếng Anh qua podcast với EnglishClass101](https://www.englishclass101.com/)",
                "4. [Học tiếng Anh tại Memrise](https://www.memrise.com/)",
                "5. [Học tiếng Anh qua YouTube](https://www.youtube.com/results?search_query=learn+english)"
            ],
            "web development": [
                "1. [Học Web Development tại freeCodeCamp](https://www.freecodecamp.org/learn/)",
                "2. [Học Web Development tại MDN](https://developer.mozilla.org/en-US/docs/Learn)",
                "3. [Khóa học Web Development miễn phí tại Coursera](https://www.coursera.org/courses?query=web%20development)",
                "4. [Học Web Development tại Udemy](https://www.udemy.com/topic/web-development/)"
            ]
        };

        if (!target[0]) {
            return api.sendMessage(getHelpMessage(categories), threadID, messageID);
        }

        const [category, topic] = target;
        
        if (!categories[category]) {
            return api.sendMessage(
                `Danh mục không hợp lệ. Các danh mục hiện có:\n${Object.keys(categories).join(", ")}`,
                threadID, 
                messageID
            );
        }

        if (!topic) {
            return api.sendMessage(
                `Các chủ đề trong ${category}:\n${categories[category].join(", ")}`,
                threadID,
                messageID
            );
        }

        const topicResources = resources[topic];
        if (!topicResources) {
            const suggestions = findSimilarTopics(topic, Object.keys(resources));
            return api.sendMessage(
                `Không tìm thấy tài liệu cho "${topic}"\nCó thể bạn muốn tìm: ${suggestions.join(", ")}`,
                threadID,
                messageID
            );
        }

        const response = formatResourceList(topic, topicResources);
        return api.sendMessage(response, threadID, messageID);
    }
};

function getHelpMessage(categories) {
    return `Hướng dẫn sử dụng lệnh study:
1. Xem danh mục: study <tên danh mục>
2. Xem tài liệu: study <danh mục> <chủ đề>

Danh mục hiện có:
${Object.entries(categories)
    .map(([cat, topics]) => `${cat}: ${topics.join(", ")}`)
    .join("\n")}`;
}

function formatResourceList(topic, resources) {
    return `📚 Tài liệu học ${topic}:\n${resources
        .map(r => `- ${r.title} (${r.rating}⭐)\n  ${r.url}\n  Loại: ${r.type}`)
        .join("\n\n")}`;
}

function findSimilarTopics(search, topics) {
    return topics.filter(t => 
        t.includes(search) || search.includes(t)
    ).slice(0, 3);
}
