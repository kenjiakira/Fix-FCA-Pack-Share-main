const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getBalance, updateBalance } = require('../utils/currencies');

const PROJECTS_FILE = path.join(__dirname, './json/airdrop/projects.json');
const WALLETS_FILE = path.join(__dirname, './json/airdrop/wallets.json');
const TASKS_FILE = path.join(__dirname, './json/airdrop/tasks.json');

[PROJECTS_FILE, WALLETS_FILE, TASKS_FILE].forEach(file => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
});
const USER_BADGES = {
    'early_adopter': {
        name: '🌟 Early Adopter',
        description: 'Tham gia sớm vào hệ thống Airdrop'
    },
    'big_spender': {
        name: '💸 Big Spender',
        description: 'Đã mint ít nhất 5 NFT'
    },
    'token_whale': {
        name: '🐋 Token Whale',
        description: 'Sở hữu hơn 10,000 FARM token'
    },
    'farming_streak': {
        name: '🔥 Farming Streak',
        description: 'Duy trì streak farming 7 ngày liên tục'
    },
    'all_tasks': {
        name: '✅ Task Master',
        description: 'Hoàn thành tất cả các nhiệm vụ dự án'
    },
    'all_achievements': {
        name: '🏆 Achievement Hunter',
        description: 'Mở khóa tất cả các thành tựu'
    }
};
// Cập nhật mẫu dự án với nhiều loại và chức năng hơn
const PROJECT_TEMPLATES = {
    defi: {
        type: 'DeFi',
        description: 'Các dự án tài chính phi tập trung, swap token và cung cấp thanh khoản',
        tasks: [
            { id: 'connect_wallet', name: 'Connect Wallet', difficulty: 'easy', reward: [50, 150] },
            { id: 'swap_token', name: 'Swap Token', difficulty: 'medium', reward: [100, 300] },
            { id: 'add_liquidity', name: 'Add Liquidity', difficulty: 'hard', reward: [200, 500] },
            { id: 'stake_token', name: 'Stake Token', difficulty: 'medium', reward: [100, 300] },
            { id: 'refer_friend', name: 'Refer a Friend', difficulty: 'hard', reward: [150, 400] }
        ],
        tokenPrice: [0.05, 0.2],
        growth: [0.01, 0.05], // Tăng trưởng hàng ngày 1-5%
        riskLevel: 'medium',
    },

    nft: {
        type: 'NFT',
        description: 'Thị trường NFT và các bộ sưu tập kỹ thuật số',
        tasks: [
            { id: 'connect_wallet', name: 'Connect Wallet', difficulty: 'easy', reward: [50, 100] },
            { id: 'mint_nft', name: 'Mint NFT', difficulty: 'medium', reward: [100, 250] },
            { id: 'list_nft', name: 'List NFT', difficulty: 'medium', reward: [80, 200] },
            { id: 'trade_nft', name: 'Trade NFT', difficulty: 'hard', reward: [150, 350] },
            { id: 'join_discord', name: 'Join Discord', difficulty: 'easy', reward: [30, 80] },
            { id: 'follow_twitter', name: 'Follow Twitter', difficulty: 'easy', reward: [30, 80] }
        ],
        tokenPrice: [0.1, 0.3],
        growth: [0.02, 0.08], // Tăng trưởng hàng ngày 2-8%
        riskLevel: 'high',
    },

    gamefi: {
        type: 'GameFi',
        description: 'Trò chơi blockchain cho phép kiếm token bằng cách chơi game',
        tasks: [
            { id: 'connect_wallet', name: 'Connect Wallet', difficulty: 'easy', reward: [80, 200] },
            { id: 'play_game', name: 'Play Game', difficulty: 'medium', reward: [150, 400] },
            { id: 'invite_friends', name: 'Invite Friends', difficulty: 'hard', reward: [200, 600] },
            { id: 'join_tournament', name: 'Join Tournament', difficulty: 'hard', reward: [300, 800] },
            { id: 'daily_login', name: 'Daily Login', difficulty: 'easy', reward: [50, 100] }
        ],
        tokenPrice: [0.02, 0.15],
        growth: [0.03, 0.1], // Tăng trưởng hàng ngày 3-10%
        riskLevel: 'high',
    },

    infrastructure: {
        type: 'Infrastructure',
        description: 'Hạ tầng blockchain, layer 2 và giải pháp mở rộng',
        tasks: [
            { id: 'connect_wallet', name: 'Connect Wallet', difficulty: 'easy', reward: [100, 200] },
            { id: 'test_network', name: 'Test Network', difficulty: 'medium', reward: [200, 500] },
            { id: 'run_node', name: 'Run Node', difficulty: 'hard', reward: [500, 1000] },
            { id: 'provide_feedback', name: 'Provide Feedback', difficulty: 'medium', reward: [150, 300] }
        ],
        tokenPrice: [0.2, 0.5],
        growth: [0.005, 0.02], // Tăng trưởng hàng ngày 0.5-2%
        riskLevel: 'low',
    },

    dao: {
        type: 'DAO',
        description: 'Tổ chức tự trị phi tập trung, quản trị cộng đồng',
        tasks: [
            { id: 'connect_wallet', name: 'Connect Wallet', difficulty: 'easy', reward: [70, 150] },
            { id: 'join_dao', name: 'Join DAO', difficulty: 'easy', reward: [50, 100] },
            { id: 'vote_proposal', name: 'Vote on Proposal', difficulty: 'medium', reward: [150, 300] },
            { id: 'create_proposal', name: 'Create Proposal', difficulty: 'hard', reward: [300, 700] },
            { id: 'participate_discussion', name: 'Participate in Discussion', difficulty: 'medium', reward: [100, 200] }
        ],
        tokenPrice: [0.1, 0.4],
        growth: [0.01, 0.03], // Tăng trưởng hàng ngày 1-3%
        riskLevel: 'medium',
    },

    metaverse: {
        type: 'Metaverse',
        description: 'Thế giới ảo, môi trường tương tác số và không gian ảo 3D',
        tasks: [
            { id: 'connect_wallet', name: 'Connect Wallet', difficulty: 'easy', reward: [100, 200] },
            { id: 'create_avatar', name: 'Create Avatar', difficulty: 'easy', reward: [80, 150] },
            { id: 'buy_land', name: 'Buy Virtual Land', difficulty: 'hard', reward: [300, 800] },
            { id: 'attend_event', name: 'Attend Virtual Event', difficulty: 'medium', reward: [150, 300] },
            { id: 'invite_friends', name: 'Invite Friends', difficulty: 'medium', reward: [100, 300] }
        ],
        tokenPrice: [0.05, 0.25],
        growth: [0.02, 0.07], // Tăng trưởng hàng ngày 2-7%
        riskLevel: 'high',
    }
};

let projects = {};
let wallets = {};
let tasks = {};

try {
    projects = JSON.parse(fs.readFileSync(PROJECTS_FILE)) || {};
    wallets = JSON.parse(fs.readFileSync(WALLETS_FILE)) || {};
    tasks = JSON.parse(fs.readFileSync(TASKS_FILE)) || {};
} catch (err) {
    console.error('Error loading data:', err);
}

function calculateUserBadges(wallet) {
    if (!wallet) return [];

    const badges = [];

    if (wallet.createdAt && Date.now() - wallet.createdAt < 3 * 24 * 60 * 60 * 1000) {
        badges.push('early_adopter');
    }

    if (wallet.nfts && wallet.nfts.length >= 5) {
        badges.push('big_spender');
    }

    if (wallet.tokens && wallet.tokens['FARM'] >= 10000) {
        badges.push('token_whale');
    }

    if (wallet.farming && wallet.farming.streak >= 7) {
        badges.push('farming_streak');
    }

    if (tasks[wallet.address]) {
        let completedAllTasks = true;
        Object.values(projects).forEach(project => {
            const userTasks = tasks[wallet.address][project.id] || [];
            if (userTasks.length < project.tasks.length) {
                completedAllTasks = false;
            }
        });
        if (completedAllTasks && Object.keys(projects).length > 0) {
            badges.push('all_tasks');
        }
    }

    if (wallet.quests && wallet.quests.achievements &&
        wallet.quests.achievements.length === Object.keys(ACHIEVEMENTS).length) {
        badges.push('all_achievements');
    }

    return badges;
}
function saveData() {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function generateWalletAddress() {
    return '0x' + crypto.randomBytes(20).toString('hex');
}
function generateProjectName(type) {
    const prefixes = {
        defi: ['Uni', 'Sushi', 'Pancake', 'Curve', 'Aave', 'Compound', 'Balancer', 'Alpha'],
        nft: ['Crypto', 'Pixel', 'Bored', 'Doodle', 'Azuki', 'Punk', 'Art', 'Meta'],
        gamefi: ['Axie', 'Gods', 'Illuvium', 'Sandbox', 'Decentraland', 'Crypto', 'Play', 'Meta'],
        infrastructure: ['Polygon', 'Arbi', 'Opti', 'Chain', 'Layer', 'Zk', 'Block', 'Node'],
        dao: ['Maker', 'Compound', 'Aave', 'Uniswap', 'Curve', 'Gitcoin', 'Deca', 'Gov'],
        metaverse: ['Meta', 'Sandbox', 'Decentraland', 'Verse', 'Virtual', 'Horizon', 'Reality', 'Omni']
    };

    const suffixes = {
        defi: ['Swap', 'Finance', 'Money', 'DeFi', 'Cash', 'Bank', 'Yield', 'Stake'],
        nft: ['Apes', 'Punks', 'Art', 'Pixels', 'Collection', 'Gallery', 'Verse', 'World'],
        gamefi: ['Infinity', 'Unchained', 'Realms', 'Legends', 'Quest', 'Battle', 'Heroes', 'Adventure'],
        infrastructure: ['Chain', 'Network', 'Protocol', 'Bridge', 'Scale', 'Link', 'Connect', 'Node'],
        dao: ['DAO', 'Governance', 'Protocol', 'Council', 'Community', 'Collective', 'Vote', 'Decision'],
        metaverse: ['Verse', 'World', 'Land', 'Realm', 'Universe', 'Space', 'Reality', 'Dimension']
    };

    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
    const suffix = suffixes[type][Math.floor(Math.random() * suffixes[type].length)];
    const randomId = Math.random().toString(36).substring(2, 5);

    return `${prefix}${suffix}-${randomId}`;
}
function generateTaskDescription(taskId, projectName) {
    const descriptions = {
        connect_wallet: `Kết nối ví của bạn với ${projectName} để bắt đầu tương tác với dự án.`,
        swap_token: `Thực hiện swap token trên sàn giao dịch của ${projectName}.`,
        add_liquidity: `Cung cấp thanh khoản cho cặp token trên ${projectName}.`,
        stake_token: `Stake token để nhận phần thưởng hàng ngày từ ${projectName}.`,
        mint_nft: `Mint một NFT độc quyền từ bộ sưu tập ${projectName}.`,
        list_nft: `Đăng bán NFT của bạn trên thị trường của ${projectName}.`,
        trade_nft: `Mua hoặc bán một NFT trên thị trường của ${projectName}.`,
        play_game: `Chơi game trong hệ sinh thái của ${projectName} để kiếm token.`,
        invite_friends: `Mời bạn bè tham gia vào cộng đồng của ${projectName}.`,
        test_network: `Tham gia thử nghiệm mạng lưới testnet của ${projectName}.`,
        run_node: `Vận hành node để hỗ trợ mạng lưới của ${projectName}.`,
        provide_feedback: `Cung cấp phản hồi về các tính năng của ${projectName}.`,
        join_dao: `Tham gia vào DAO của ${projectName} để tham gia quản trị.`,
        vote_proposal: `Bỏ phiếu cho một đề xuất trong DAO của ${projectName}.`,
        create_proposal: `Tạo một đề xuất mới cho cộng đồng của ${projectName}.`,
        participate_discussion: `Tham gia thảo luận trong diễn đàn của ${projectName}.`,
        create_avatar: `Tạo một avatar trong thế giới ảo của ${projectName}.`,
        buy_land: `Mua một mảnh đất ảo trong metaverse của ${projectName}.`,
        attend_event: `Tham dự một sự kiện ảo được tổ chức bởi ${projectName}.`,
        join_tournament: `Tham gia giải đấu để cạnh tranh phần thưởng từ ${projectName}.`,
        daily_login: `Đăng nhập hàng ngày vào platform của ${projectName}.`,
        refer_friend: `Giới thiệu bạn bè tham gia vào ${projectName} để nhận thưởng.`,
        follow_twitter: `Theo dõi tài khoản Twitter chính thức của ${projectName}.`,
        join_discord: `Tham gia server Discord của cộng đồng ${projectName}.`
    };

    return descriptions[taskId] || `Hoàn thành nhiệm vụ của ${projectName}.`;
}
function generateProjectTeam() {
    const roles = ['Founder', 'CTO', 'CMO', 'Lead Developer', 'Community Manager', 'Advisor'];
    const companies = ['Binance', 'Coinbase', 'Google', 'Meta', 'Microsoft', 'Amazon', 'Apple'];

    const teamSize = Math.floor(Math.random() * 3) + 3; // 3-5 thành viên
    const team = [];

    for (let i = 0; i < teamSize; i++) {
        team.push({
            role: roles[Math.floor(Math.random() * roles.length)],
            experience: `Former ${companies[Math.floor(Math.random() * companies.length)]}`,
            years: Math.floor(Math.random() * 10) + 2 // 2-12 năm kinh nghiệm
        });
    }

    return team;
}

function createProject(type) {
    const template = PROJECT_TEMPLATES[type];
    if (!template) return null;

    const projectId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const projectName = generateProjectName(type);

    // Tạo giá token ngẫu nhiên trong khoảng định trước
    const tokenPrice = Math.random() * (template.tokenPrice[1] - template.tokenPrice[0]) + template.tokenPrice[0];

    // Tạo tỷ lệ tăng trưởng hàng ngày
    const dailyGrowthRate = Math.random() * (template.growth[1] - template.growth[0]) + template.growth[0];

    // Tạo tổng cung token ngẫu nhiên dựa trên loại dự án
    let totalSupply;
    switch (template.riskLevel) {
        case 'low': totalSupply = Math.floor(Math.random() * 5000000) + 5000000; break; // 5-10M
        case 'medium': totalSupply = Math.floor(Math.random() * 20000000) + 10000000; break; // 10-30M
        case 'high': totalSupply = Math.floor(Math.random() * 50000000) + 20000000; break; // 20-70M
    }

    // Tạo nhiệm vụ với phần thưởng ngẫu nhiên
    const tasks = template.tasks.map(task => {
        const minReward = task.reward[0];
        const maxReward = task.reward[1];
        return {
            id: task.id,
            name: task.name,
            difficulty: task.difficulty,
            reward: Math.floor(Math.random() * (maxReward - minReward) + minReward),
            description: generateTaskDescription(task.id, projectName)
        };
    });

    // Tạo đội ngũ dự án
    const team = generateProjectTeam();

    // Tạo lịch sử giá
    const priceHistory = generatePriceHistory(tokenPrice, 7, dailyGrowthRate);

    // Tạo roadmap dự án
    const roadmap = generateRoadmap();

    // Tạo thông tin đầu tư
    const investment = {
        seedRound: (tokenPrice * 0.2).toFixed(3),
        privateRound: (tokenPrice * 0.6).toFixed(3),
        publicRound: tokenPrice.toFixed(3),
        investors: generateInvestors()
    };

    projects[projectId] = {
        id: projectId,
        name: projectName,
        ticker: projectName.split('-')[0],
        type: template.type,
        description: template.description,
        tasks: tasks,
        tokenPrice: tokenPrice,
        dailyGrowthRate: dailyGrowthRate,
        priceHistory: priceHistory,
        totalSupply: totalSupply,
        remainingSupply: totalSupply,
        team: team,
        roadmap: roadmap,
        investment: investment,
        riskLevel: template.riskLevel,
        communitySize: Math.floor(Math.random() * 50000) + 1000,
        createdAt: Date.now(),
        lastUpdated: Date.now()
    };

    saveData();
    return projects[projectId];
}
function generatePriceHistory(currentPrice, days, dailyGrowthRate) {
    const history = [];
    let price = currentPrice;

    for (let i = 0; i < days; i++) {
        // Đi ngược lại thời gian
        const volatility = (Math.random() - 0.5) * 0.1; // Thêm biến động -5% đến +5%
        price = price / (1 + dailyGrowthRate + volatility);
        if (price < 0.0001) price = 0.0001; // Đảm bảo giá không quá thấp

        history.unshift({
            day: days - i,
            price: price.toFixed(6),
            timestamp: Date.now() - (i + 1) * 24 * 60 * 60 * 1000
        });
    }

    // Thêm giá hiện tại
    history.push({
        day: days + 1,
        price: currentPrice.toFixed(6),
        timestamp: Date.now()
    });

    return history;
}
function generateRoadmap() {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const year = new Date().getFullYear();
    const currentQuarter = Math.floor((new Date().getMonth() / 3)) + 1;

    const roadmap = [];
    for (let i = 0; i < 4; i++) {
        const quarterIndex = (currentQuarter + i - 1) % 4;
        const yearOffset = Math.floor((currentQuarter + i - 1) / 4);
        const quarterYear = year + yearOffset;

        roadmap.push({
            period: `${quarters[quarterIndex]} ${quarterYear}`,
            milestones: generateMilestones()
        });
    }

    return roadmap;
}

// Tạo các cột mốc cho roadmap
function generateMilestones() {
    const possibleMilestones = [
        'Phát hành testnet',
        'Ra mắt mainnet',
        'Mở rộng cộng đồng',
        'Niêm yết trên CEX lớn',
        'Cập nhật giao diện người dùng',
        'Tối ưu hóa hiệu suất',
        'Mở rộng sang thị trường mới',
        'Phát hành tính năng staking',
        'Tích hợp với các dự án khác',
        'Phát hành ứng dụng di động',
        'Mở rộng đội ngũ phát triển',
        'Audit bảo mật',
        'Thêm tính năng NFT',
        'Nâng cấp hệ thống quản trị',
        'Phát hành phiên bản 2.0'
    ];

    const milestoneCount = Math.floor(Math.random() * 3) + 2; // 2-4 cột mốc
    const milestones = [];

    const shuffled = [...possibleMilestones].sort(() => 0.5 - Math.random());

    for (let i = 0; i < milestoneCount; i++) {
        milestones.push(shuffled[i]);
    }

    return milestones;
}

// Tạo danh sách nhà đầu tư
function generateInvestors() {
    const possibleInvestors = [
        'Binance Labs',
        'Coinbase Ventures',
        'a16z Crypto',
        'Paradigm',
        'Pantera Capital',
        'Polychain Capital',
        'Dragonfly Capital',
        'Multicoin Capital',
        'Galaxy Digital',
        'Alameda Research',
        'Three Arrows Capital',
        'DeFiance Capital',
        'Framework Ventures',
        'Spartan Group',
        'Hashed'
    ];

    const investorCount = Math.floor(Math.random() * 3) + 2; // 2-4 nhà đầu tư
    const investors = [];

    const shuffled = [...possibleInvestors].sort(() => 0.5 - Math.random());

    for (let i = 0; i < investorCount; i++) {
        investors.push(shuffled[i]);
    }

    return investors;
}
function calculateSafuScore(project) {
    if (!project) return 0;

    let score = 0;

    // Tiêu chí 1: Đội ngũ - tối đa 30 điểm
    const teamSize = project.team?.length || 0;
    score += Math.min(30, teamSize * 6);

    // Tiêu chí 2: Thời gian tồn tại - tối đa 20 điểm
    const ageInDays = (Date.now() - project.createdAt) / (24 * 60 * 60 * 1000);
    score += Math.min(20, ageInDays);

    // Tiêu chí 3: Cộng đồng - tối đa 15 điểm
    const communityScore = Math.min(15, project.communitySize / 5000);
    score += communityScore;

    // Tiêu chí 4: Nhà đầu tư - tối đa 20 điểm
    const investorCount = project.investment?.investors?.length || 0;
    score += Math.min(20, investorCount * 5);

    // Tiêu chí 5: Giá token và biến động - tối đa 15 điểm
    if (project.priceHistory && project.priceHistory.length > 1) {
        const latestPrice = parseFloat(project.priceHistory[project.priceHistory.length - 1].price);
        const oldestPrice = parseFloat(project.priceHistory[0].price);

        // Tính tăng trưởng trong khoảng thời gian
        const growthRate = (latestPrice - oldestPrice) / oldestPrice;

        // Điểm cho tăng trưởng ổn định (không quá nhanh hoặc quá chậm)
        if (growthRate > 0 && growthRate < 0.5) {
            score += 15;
        } else if (growthRate >= 0.5 && growthRate < 1) {
            score += 10;
        } else if (growthRate >= 1) {
            score += 5; // Tăng quá nhanh có thể là dấu hiệu không ổn định
        } else {
            score += 0; // Giảm giá
        }
    }

    return Math.min(100, Math.round(score));
}

// Thêm hàm phân tích rủi ro
function analyzeTrustAndRisk(project) {
    const safuScore = calculateSafuScore(project);

    // Phân tích tỷ lệ risk/reward
    const riskLevel = project.riskLevel || 'medium';
    const tokenPrice = project.tokenPrice || 0;

    // Đánh giá risk-reward
    let riskRewardRatio;
    switch (riskLevel) {
        case 'low':
            riskRewardRatio = tokenPrice < 0.1 ? 'Good' : (tokenPrice < 0.3 ? 'Moderate' : 'Poor');
            break;
        case 'medium':
            riskRewardRatio = tokenPrice < 0.2 ? 'Excellent' : (tokenPrice < 0.4 ? 'Good' : 'Moderate');
            break;
        case 'high':
            riskRewardRatio = tokenPrice < 0.1 ? 'Excellent' : (tokenPrice < 0.2 ? 'Good' : 'Moderate');
            break;
        default:
            riskRewardRatio = 'Unknown';
    }

    // Tính toán các cảnh báo tiềm ẩn
    const warnings = [];

    if (safuScore < 30) {
        warnings.push('⚠️ SAFU score rất thấp - rủi ro cao!');
    } else if (safuScore < 50) {
        warnings.push('⚠️ SAFU score thấp - hãy thận trọng!');
    }

    if (project.dailyGrowthRate > 0.08) {
        warnings.push('⚠️ Tốc độ tăng trưởng giá token cao bất thường!');
    }

    if (project.team?.length < 3) {
        warnings.push('⚠️ Đội ngũ nhỏ hoặc không rõ thông tin!');
    }

    const priceHistory = project.priceHistory || [];
    if (priceHistory.length > 2) {
        const recentPrices = priceHistory.slice(-3).map(p => parseFloat(p.price));
        const volatility = Math.max(...recentPrices) / Math.min(...recentPrices);

        if (volatility > 1.5) {
            warnings.push('⚠️ Giá token biến động mạnh gần đây!');
        }
    }

    return {
        safuScore,
        riskLevel,
        riskRewardRatio,
        warnings,
        recommendation: safuScore < 40 ? 'Avoid' : (safuScore < 70 ? 'Cautious' : 'Favorable')
    };
}
function connectWallet(userId) {
    if (wallets[userId]) {
        return { success: false, message: 'Bạn đã có ví kết nối rồi!' };
    }

    wallets[userId] = {
        address: generateWalletAddress(),
        tokens: {},
        staked: {},
        createdAt: Date.now()
    };

    saveData();
    return {
        success: true,
        message: `Đã tạo và kết nối ví: ${wallets[userId].address}`
    };
}

function completeTask(userId, projectId, taskId) {
    const wallet = wallets[userId];
    const project = projects[projectId];

    if (!wallet) {
        return { success: false, message: 'Bạn chưa kết nối ví!' };
    }

    if (!project) {
        return { success: false, message: 'Dự án không tồn tại!' };
    }

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) {
        return { success: false, message: 'Nhiệm vụ không tồn tại!' };
    }

    if (!tasks[userId]) tasks[userId] = {};
    if (!tasks[userId][projectId]) tasks[userId][projectId] = [];

    if (tasks[userId][projectId].includes(taskId)) {
        return { success: false, message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' };
    }

    const tokenSymbol = project.name;
    if (!wallet.tokens[tokenSymbol]) wallet.tokens[tokenSymbol] = 0;
    wallet.tokens[tokenSymbol] += task.reward;
    project.remainingSupply -= task.reward;

    tasks[userId][projectId].push(taskId);

    saveData();
    return {
        success: true,
        message: `Hoàn thành nhiệm vụ!\nNhận được ${task.reward} ${tokenSymbol}`
    };
}

function stakeTokens(userId, projectId, amount) {
    const wallet = wallets[userId];
    const project = projects[projectId];

    if (!wallet || !project) {
        return { success: false, message: 'Ví hoặc dự án không tồn tại!' };
    }

    const tokenSymbol = project.name;
    if (!wallet.tokens[tokenSymbol] || wallet.tokens[tokenSymbol] < amount) {
        return { success: false, message: 'Không đủ token để stake!' };
    }

    const safetyInfo = analyzeTrustAndRisk(project);
    const safuScore = safetyInfo.safuScore;
    let warningMessage = '';

    if (safuScore < 40) {
        warningMessage = `\n\n⚠️ CẢNH BÁO: Dự án có điểm SAFU thấp (${safuScore}/100).\nRủi ro mất vốn cao! Bạn có chắc muốn stake?`;
    } else if (safuScore < 70) {
        warningMessage = `\n\n⚠️ LƯU Ý: Dự án có điểm SAFU trung bình (${safuScore}/100).\nHãy cân nhắc rủi ro khi stake!`;
    }

    wallet.tokens[tokenSymbol] -= amount;
    if (!wallet.staked[tokenSymbol]) wallet.staked[tokenSymbol] = 0;
    wallet.staked[tokenSymbol] += amount;

    updateQuestProgress(userId, 'stake_tokens', amount);

    saveData();
    return {
        success: true,
        message: `✅ Đã stake ${amount} ${tokenSymbol}\n` +
            `💹 Giá trị cũ: $${(amount * project.tokenPrice).toFixed(2)}\n` +
            `💰 Giá trị sau stake: $${(amount * project.tokenPrice * 1.5).toFixed(2)}` +
            warningMessage
    };
}

function calculateRewards(userId) {
    const wallet = wallets[userId];
    if (!wallet) return 0;

    let totalValue = 0;
    Object.entries(wallet.tokens).forEach(([symbol, amount]) => {
        const project = Object.values(projects).find(p => p.name === symbol);
        if (project) {
            totalValue += amount * project.tokenPrice;
        }
    });

    Object.entries(wallet.staked).forEach(([symbol, amount]) => {
        const project = Object.values(projects).find(p => p.name === symbol);
        if (project) {
            totalValue += amount * project.tokenPrice * 1.5;
        }
    });

    return totalValue;
}

const FARMING_LEVELS = [
    { level: 1, requirement: 0, bonus: 0, name: "Beginner Farmer" },
    { level: 2, requirement: 500, bonus: 0.2, name: "Hobbyist Farmer" },
    { level: 3, requirement: 2000, bonus: 0.5, name: "Pro Farmer" },
    { level: 4, requirement: 10000, bonus: 0.8, name: "Master Farmer" },
    { level: 5, requirement: 50000, bonus: 1.2, name: "Legendary Farmer" }
];

const FARMING_CONFIG = {
    baseRate: 10,
    interval: 3600000,
    powerMultiplier: 1.5,
    maxPower: 100,
    streakBonus: 0.1,
    maxStreakBonus: 1.0,
    levelBonusCap: 2.0
};

const FARMING_EVENTS = [
    {
        id: "double_yield",
        name: "Double Yield",
        description: "Thu hoạch gấp đôi token trong khoảng thời gian giới hạn",
        bonus: 1.0,
        duration: 24 * 60 * 60 * 1000
    },
    {
        id: "quick_farm",
        name: "Quick Farm",
        description: "Giảm thời gian chờ giữa các lần farm xuống một nửa",
        intervalReduction: 0.5,
        duration: 12 * 60 * 60 * 1000
    },
    {
        id: "lucky_bonus",
        name: "Lucky Bonus",
        description: "Tăng tỷ lệ lucky harvest lên 20%",
        luckyChance: 0.2,
        duration: 6 * 60 * 60 * 1000
    }
];

let activeEvent = null;
let eventEndTime = 0;

function startRandomEvent() {
    if (activeEvent === null || Date.now() > eventEndTime) {
        activeEvent = FARMING_EVENTS[Math.floor(Math.random() * FARMING_EVENTS.length)];
        eventEndTime = Date.now() + activeEvent.duration;
        fs.writeFileSync(
            path.join(__dirname, './json/airdrop/event.json'),
            JSON.stringify({ activeEvent, eventEndTime })
        );
        return activeEvent;
    }
    return null;
}

function checkActiveEvent() {
    if (activeEvent === null) {
        try {
            const eventData = JSON.parse(
                fs.readFileSync(path.join(__dirname, './json/airdrop/event.json'))
            );
            activeEvent = eventData.activeEvent;
            eventEndTime = eventData.eventEndTime;
        } catch (err) { }
    }
    if (activeEvent !== null && Date.now() > eventEndTime) {
        activeEvent = null;
        eventEndTime = 0;
        fs.writeFileSync(
            path.join(__dirname, './json/airdrop/event.json'),
            JSON.stringify({ activeEvent: null, eventEndTime: 0 })
        );
    }
    return activeEvent;
}

const NFT_CONFIG = {
    mintPrice: 1000,
    rarities: ['Common', 'Rare', 'Epic', 'Legendary'],
    attributes: ['Power', 'Luck', 'Speed', 'Yield']
};

const QUESTS = {
    daily: [
        { id: 'farm_tokens', name: 'Farm Tokens', requirement: 100, reward: 50 },
        { id: 'complete_tasks', name: 'Complete Tasks', requirement: 5, reward: 100 },
        { id: 'trade_volume', name: 'Trading Volume', requirement: 1000, reward: 200 }
    ],
    weekly: [
        { id: 'stake_tokens', name: 'Stake Tokens', requirement: 5000, reward: 500 },
        { id: 'mint_nfts', name: 'Mint NFTs', requirement: 3, reward: 1000 }
    ]
};

const ACHIEVEMENTS = {
    farmer: { name: 'Master Farmer', requirement: 10000, reward: 1000 },
    trader: { name: 'Pro Trader', requirement: 100000, reward: 2000 },
    collector: { name: 'NFT Collector', requirement: 10, reward: 3000 }
};

function initUserData(userId) {
    if (!wallets[userId]) {
        wallets[userId] = {
            address: generateWalletAddress(),
            tokens: {},
            staked: {},
            nfts: [],
            farming: {
                power: 1,
                lastClaim: 0
            },
            quests: {
                daily: {},
                weekly: {},
                achievements: []
            },
            referrals: [],
            createdAt: Date.now()
        };
        saveData();
        return wallets[userId];
    }

    const wallet = wallets[userId];

    wallet.tokens = wallet.tokens || {};
    wallet.staked = wallet.staked || {};
    wallet.nfts = wallet.nfts || [];

    if (!wallet.farming) {
        wallet.farming = {
            power: 1,
            lastClaim: 0
        };
    }

    if (!wallet.quests) {
        wallet.quests = {
            daily: {},
            weekly: {},
            achievements: []
        };
    } else {
        wallet.quests.daily = wallet.quests.daily || {};
        wallet.quests.weekly = wallet.quests.weekly || {};
        wallet.quests.achievements = wallet.quests.achievements || [];
    }

    // Đảm bảo các thuộc tính khác
    wallet.referrals = wallet.referrals || [];
    wallet.createdAt = wallet.createdAt || Date.now();

    saveData();
    return wallet;
}
function calculateNFTBonus(nfts) {
    if (!nfts || nfts.length === 0) return 0;

    let totalBonus = 0;
    nfts.forEach(nft => {
        if (!nft) return;

        const rarityBonus = {
            'Common': 0.05,
            'Rare': 0.1,
            'Epic': 0.2,
            'Legendary': 0.5
        }[nft.rarity || 'Common'] || 0;

        const attributes = nft.attributes || {};
        const yieldBonus = (attributes.Yield || 0) / 200;

        totalBonus += rarityBonus + yieldBonus;
    });

    return Math.min(1.0, totalBonus);
}
function farmTokens(userId) {
    const wallet = initUserData(userId);
    if (!wallet) return { success: false, message: 'Ví không tồn tại' };

    if (!wallet.farming) {
        wallet.farming = {
            power: 1,
            lastClaim: 0,
            totalFarmed: 0,
            streak: 0,
            lastStreakDate: new Date().toDateString(),
            level: 1
        };
    }

    wallet.farming.totalFarmed = wallet.farming.totalFarmed || 0;
    wallet.farming.streak = wallet.farming.streak || 0;
    wallet.farming.lastStreakDate = wallet.farming.lastStreakDate || new Date().toDateString();
    wallet.farming.level = wallet.farming.level || 1;

    const now = Date.now();
    const timePassed = now - (wallet.farming.lastClaim || 0);

    const event = checkActiveEvent();
    const effectiveInterval = event?.intervalReduction
        ? FARMING_CONFIG.interval * (1 - event.intervalReduction)
        : FARMING_CONFIG.interval;

    if (timePassed < effectiveInterval) {
        const remainingMinutes = Math.ceil((effectiveInterval - timePassed) / 1000 / 60);
        return {
            success: false,
            message: `⏳ Vui lòng chờ thêm ${remainingMinutes} phút để farm tiếp!`
        };
    }

    const today = new Date().toDateString();
    if (today === wallet.farming.lastStreakDate) {
    } else if (new Date(wallet.farming.lastStreakDate).getTime() + 86400000 >= new Date(today).getTime()) {
        wallet.farming.streak++;
        wallet.farming.lastStreakDate = today;
    } else {
        wallet.farming.streak = 1;
        wallet.farming.lastStreakDate = today;
    }

    const power = wallet.farming.power || 1;
    const baseAmount = FARMING_CONFIG.baseRate * power;
    const nftBonus = calculateNFTBonus(wallet.nfts || []);
    const streakBonus = Math.min(
        wallet.farming.streak * FARMING_CONFIG.streakBonus,
        FARMING_CONFIG.maxStreakBonus
    );
    const currentLevel = FARMING_LEVELS.find(l => l.level === wallet.farming.level) || FARMING_LEVELS[0];
    const levelBonus = currentLevel.bonus;
    const eventBonus = event?.bonus || 0;

    const bonusMultiplier = 1 + nftBonus + streakBonus + levelBonus + eventBonus;
    const totalAmount = Math.floor(baseAmount * bonusMultiplier);

    const effectiveLuckyChance = 0.05 + (event?.luckyChance || 0);
    const isLuckyHarvest = Math.random() < effectiveLuckyChance;
    const finalAmount = isLuckyHarvest ? totalAmount * 2 : totalAmount;

    if (!wallet.tokens) wallet.tokens = {};
    if (!wallet.tokens['FARM']) wallet.tokens['FARM'] = 0;
    wallet.tokens['FARM'] += finalAmount;
    wallet.farming.lastClaim = now;
    wallet.farming.totalFarmed += finalAmount;

    for (let i = FARMING_LEVELS.length - 1; i >= 0; i--) {
        if (wallet.farming.totalFarmed >= FARMING_LEVELS[i].requirement) {
            wallet.farming.level = FARMING_LEVELS[i].level;
            break;
        }
    }

    updateQuestProgress(userId, 'farm_tokens', finalAmount);
    saveData();

    let message = isLuckyHarvest
        ? `🌟 LUCKY HARVEST! Bạn nhận được gấp đôi token! 🌟\n`
        : `🌾 FARM THÀNH CÔNG! 🌾\n`;
    message += `💰 Số token nhận được: ${finalAmount} FARM\n\n`;
    message += `📊 CHI TIẾT:\n`;
    message += `• Cơ bản: ${baseAmount} token\n`;
    if (nftBonus > 0) message += `• Bonus NFT: +${(nftBonus * 100).toFixed(0)}%\n`;
    if (streakBonus > 0) message += `• Streak (${wallet.farming.streak} ngày): +${(streakBonus * 100).toFixed(0)}%\n`;
    message += `• Cấp độ (${currentLevel.name}): +${(levelBonus * 100).toFixed(0)}%\n`;
    if (event) message += `• Sự kiện: +${(event.bonus * 100).toFixed(0)}%\n`;
    if (isLuckyHarvest) message += `• Lucky Harvest: x2\n`;

    return {
        success: true,
        message: message
    };
}
function updateQuestProgress(userId, questId, amount) {
    const wallet = initUserData(userId);
    if (!wallet) return;

    const dailyQuest = QUESTS.daily.find(q => q.id === questId);
    if (dailyQuest) {
        if (!wallet.quests.daily[questId]) wallet.quests.daily[questId] = 0;
        wallet.quests.daily[questId] += amount;

        if (wallet.quests.daily[questId] >= dailyQuest.requirement) {
            if (!wallet.tokens['FARM']) wallet.tokens['FARM'] = 0;
            wallet.tokens['FARM'] += dailyQuest.reward;
            wallet.quests.daily[questId] = 0;
        }
    }
    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
        if (!wallet.quests.achievements.includes(id)) {
            const progress = calculateProgress(wallet, id);
            if (progress >= achievement.requirement) {
                wallet.quests.achievements.push(id);
                if (!wallet.tokens['FARM']) wallet.tokens['FARM'] = 0;
                wallet.tokens['FARM'] += achievement.reward;
            }
        }
    });

    saveData();
}
function mintNFT(userId) {
    const wallet = wallets[userId];
    if (!wallet) return { success: false, message: 'Ví không tồn tại' };

    if (wallet.tokens['FARM'] < NFT_CONFIG.mintPrice) {
        return { success: false, message: 'Không đủ token FARM' };
    }

    const rarity = NFT_CONFIG.rarities[Math.floor(Math.random() * NFT_CONFIG.rarities.length)];
    const attributes = {};
    NFT_CONFIG.attributes.forEach(attr => {
        attributes[attr] = Math.floor(Math.random() * 100) + 1;
    });

    const nft = {
        id: Date.now().toString(36),
        rarity,
        attributes,
        mintedAt: Date.now()
    };

    wallet.tokens['FARM'] -= NFT_CONFIG.mintPrice;
    wallet.nfts.push(nft);

    updateQuestProgress(userId, 'mint_nfts', 1);

    saveData();
    return {
        success: true,
        message: `Mint NFT thành công: ${rarity}\nThuộc tính: ${Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}`
    };
}
function calculateProgress(wallet, achievementId) {
    if (!wallet) return 0;

    switch (achievementId) {
        case 'farmer':
            return (wallet.tokens && wallet.tokens['FARM']) || 0;

        case 'trader':
            if (!wallet.tokens) return 0;

            let totalTraded = 0;
            Object.entries(wallet.tokens).forEach(([symbol, amount]) => {
                const project = Object.values(projects).find(p => p.name === symbol);
                if (project) {
                    totalTraded += amount * project.tokenPrice;
                }
            });
            return totalTraded;

        case 'collector':
            return (wallet.nfts && wallet.nfts.length) || 0;

        default:
            return 0;
    }
}

module.exports = {
    name: "airdrop",
    dev: "HNT",
    category: "Games",
    info: "Tham gia Airdrop token",
    usages: ".airdrop",
    onPrefix: true,
    cooldowns: 0,

    onLaunch: async function ({ api, event, target = [] }) {
        const { threadID, messageID, senderID } = event;
        const action = target[0]?.toLowerCase();

        try {
            switch (action) {
                case "connect":
                case "wallet": {
                    const result = connectWallet(senderID);
                    return api.sendMessage(result.message, threadID, messageID);
                }

                case "projects":
                case "list": {
                    const filterType = target[1]?.toLowerCase();
                    const sortOption = target[2]?.toLowerCase() || 'newest';
                    const pageNumber = parseInt(target[3]) || 1;
                    const pageSize = 4;

                    let filteredProjects = Object.values(projects);

                    if (filterType) {
                        if (filterType === 'safe' || filterType === 'safu') {

                            filteredProjects = filteredProjects.filter(p => calculateSafuScore(p) >= 70);
                        }
                        else if (filterType === 'medium') {

                            filteredProjects = filteredProjects.filter(p => {
                                const score = calculateSafuScore(p);
                                return score >= 40 && score < 70;
                            });
                        }
                        else if (filterType === 'risky') {

                            filteredProjects = filteredProjects.filter(p => calculateSafuScore(p) < 40);
                        }
                        else if (PROJECT_TEMPLATES[filterType]) {

                            filteredProjects = filteredProjects.filter(p =>
                                p.type.toLowerCase() === PROJECT_TEMPLATES[filterType].type.toLowerCase()
                            );
                        }
                    }

                    switch (sortOption) {
                        case 'price':
                        case 'value':
                            filteredProjects.sort((a, b) => b.tokenPrice - a.tokenPrice);
                            break;
                        case 'safu':
                        case 'safe':
                            filteredProjects.sort((a, b) => calculateSafuScore(b) - calculateSafuScore(a));
                            break;
                        case 'growth':
                        case 'apy':
                            filteredProjects.sort((a, b) => b.dailyGrowthRate - a.dailyGrowthRate);
                            break;
                        case 'rewards':
                            filteredProjects.sort((a, b) => {
                                const aRewards = a.tasks.reduce((sum, task) => sum + task.reward, 0);
                                const bRewards = b.tasks.reduce((sum, task) => sum + task.reward, 0);
                                return bRewards - aRewards;
                            });
                            break;
                        case 'oldest':
                            filteredProjects.sort((a, b) => a.createdAt - b.createdAt);
                            break;
                        default:
                            filteredProjects.sort((a, b) => b.createdAt - a.createdAt);
                    }

                    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));

                    const validPageNumber = Math.min(Math.max(1, pageNumber), totalPages);
                    const startIndex = (validPageNumber - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const pagedProjects = filteredProjects.slice(startIndex, endIndex);

                    if (pagedProjects.length === 0) {
                        let errorMsg = "❌ Không tìm thấy dự án";
                        if (filterType) {
                            if (filterType === 'safe' || filterType === 'safu') {
                                errorMsg += " an toàn (SAFU ≥ 70)";
                            } else if (filterType === 'medium') {
                                errorMsg += " rủi ro trung bình (SAFU 40-69)";
                            } else if (filterType === 'risky') {
                                errorMsg += " rủi ro cao (SAFU < 40)";
                            } else {
                                errorMsg += ` loại ${filterType}`;
                            }
                        }

                        errorMsg += "!\n\nDùng lệnh '.airdrop refresh' để tạo dự án mới.";
                        return api.sendMessage(errorMsg, threadID, messageID);
                    }

                    let filterLabel = '';
                    if (filterType) {
                        if (filterType === 'safe' || filterType === 'safu') {
                            filterLabel = ' - 🟢 AN TOÀN';
                        } else if (filterType === 'medium') {
                            filterLabel = ' - 🟠 TRUNG BÌNH';
                        } else if (filterType === 'risky') {
                            filterLabel = ' - 🔴 RỦI RO CAO';
                        } else if (PROJECT_TEMPLATES[filterType]) {
                            filterLabel = ` - ${PROJECT_TEMPLATES[filterType].type.toUpperCase()}`;
                        }
                    }

                    const sortLabel = {
                        'price': '💰 GIÁ CAO NHẤT',
                        'value': '💰 GIÁ CAO NHẤT',
                        'safu': '🛡️ AN TOÀN NHẤT',
                        'safe': '🛡️ AN TOÀN NHẤT',
                        'growth': '📈 TĂNG TRƯỞNG NHANH',
                        'apy': '📈 TĂNG TRƯỞNG NHANH',
                        'rewards': '🎁 PHẦN THƯỞNG LỚN',
                        'oldest': '⏳ CŨ NHẤT',
                        'newest': '🆕 MỚI NHẤT'
                    }[sortOption] || '🆕 MỚI NHẤT';

                    let msg = `📋 DANH SÁCH DỰ ÁN${filterLabel}\n`;
                    msg += `━━━━━━━━━━━━━━━━━━\n`;
                    msg += `Sắp xếp: ${sortLabel} | Trang ${validPageNumber}/${totalPages}\n\n`;

                    pagedProjects.forEach((project, index) => {
                        const safuScore = calculateSafuScore(project);
                        const safuEmoji = safuScore >= 70 ? '🟢' : (safuScore >= 40 ? '🟠' : '🔴');
                        const taskCount = project.tasks.length;
                        const totalReward = project.tasks.reduce((sum, task) => sum + task.reward, 0);
                        const dailyGrowth = (project.dailyGrowthRate * 100).toFixed(1);

                        const shortId = project.id.substring(0, 6);

                        const typeEmoji = {
                            'DeFi': '💱',
                            'NFT': '🎨',
                            'GameFi': '🎮',
                            'Infrastructure': '🏗️',
                            'DAO': '👥',
                            'Metaverse': '🌐'
                        }[project.type] || '📊';

                        msg += `${index + 1}. ${typeEmoji} ${project.name} ${safuEmoji}\n`;
                        msg += `   💰 Token: $${project.tokenPrice.toFixed(4)} (+${dailyGrowth}%/ngày)\n`;
                        msg += `   📝 Nhiệm vụ: ${taskCount} (tổng ${totalReward} token)\n`;
                        msg += `   🆔 ID: ${shortId}... | Dùng: .airdrop detail ${project.id}\n\n`;
                    });

                    msg += `📱 ĐIỀU HƯỚNG\n`;

                    let navButtons = '';
                    if (validPageNumber > 1) {
                        navButtons += `◀️ Trang trước: .airdrop projects ${filterType || ''} ${sortOption} ${validPageNumber - 1}\n`;
                    }
                    if (validPageNumber < totalPages) {
                        navButtons += `▶️ Trang sau: .airdrop projects ${filterType || ''} ${sortOption} ${validPageNumber + 1}\n`;
                    }
                    if (navButtons) {
                        msg += navButtons;
                    }

                    msg += `\n🔍 LỌC DỰ ÁN\n`;
                    msg += `• Theo loại: defi, nft, gamefi, dao, infrastructure, metaverse\n`;
                    msg += `• Theo rủi ro: safe, medium, risky\n`;
                    msg += `• Ví dụ: .airdrop projects defi safu 1\n`;

                    msg += `\n📊 SẮP XẾP\n`;
                    msg += `• Mới nhất: newest\n`;
                    msg += `• Giá cao: price\n`;
                    msg += `• An toàn: safu\n`;
                    msg += `• Tăng trưởng: growth\n`;
                    msg += `• Phần thưởng: rewards\n`;
                    msg += `\n💡 GỢI Ý\n`;
                    if (pagedProjects.length > 0) {
                        const bestProject = pagedProjects.sort((a, b) => calculateSafuScore(b) - calculateSafuScore(a))[0];
                        msg += `• Xem chi tiết dự án đáng chú ý nhất: .airdrop detail ${bestProject.id}\n`;
                    }
                    msg += `• Tạo dự án mới: .airdrop refresh`;

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "detail":
                case "project": {
                    const projectId = target[1];
                    if (!projectId || !projects[projectId]) {
                        return api.sendMessage(
                            "❌ Vui lòng cung cấp ID dự án hợp lệ!\n" +
                            "Sử dụng: .airdrop detail [project_id]\n" +
                            "hoặc dùng '.airdrop projects' để xem danh sách dự án.",
                            threadID, messageID
                        );
                    }

                    const project = projects[projectId];
                    const safetyInfo = analyzeTrustAndRisk(project);
                    const safuScore = safetyInfo.safuScore;
                    const safuEmoji = safuScore >= 70 ? '🟢' : (safuScore >= 40 ? '🟠' : '🔴');

                    let msg = `🔍 CHI TIẾT DỰ ÁN\n`;
                    msg += `━━━━━━━━━━━━━━━━━━\n\n`;

                    const typeEmoji = {
                        'DeFi': '💱',
                        'NFT': '🎨',
                        'GameFi': '🎮',
                        'Infrastructure': '🏗️',
                        'DAO': '👥',
                        'Metaverse': '🌐'
                    }[project.type] || '📊';

                    msg += `📌 ${typeEmoji} ${project.name} (${project.type})\n`;
                    msg += `${safuEmoji} SAFU Score: ${safuScore}/100 (${safetyInfo.recommendation})\n`;
                    msg += `ℹ️ ${project.description}\n\n`;

                    msg += `💰 TOKEN INFO\n`;
                    msg += `• Giá hiện tại: $${project.tokenPrice.toFixed(4)}\n`;
                    msg += `• Tăng trưởng: ${(project.dailyGrowthRate * 100).toFixed(1)}% mỗi ngày\n`;
                    msg += `• Tổng cung: ${(project.totalSupply / 1000000).toFixed(1)}M tokens\n`;
                    msg += `• Còn lại: ${(project.remainingSupply / 1000000).toFixed(1)}M tokens\n`;

                    msg += `\n👥 CỘNG ĐỒNG & PHÂN TÍCH\n`;
                    msg += `• Người tham gia: ${project.communitySize.toLocaleString()}\n`;
                    msg += `• Mức độ rủi ro: ${project.riskLevel === 'low' ? 'Thấp 🟢' :
                        (project.riskLevel === 'medium' ? 'Trung bình 🟠' : 'Cao 🔴')}\n`;
                    msg += `• Tỷ lệ Risk/Reward: ${safetyInfo.riskRewardRatio}\n`;

                    if (safetyInfo.warnings.length > 0) {
                        msg += `\n⚠️ CẢNH BÁO\n`;
                        safetyInfo.warnings.forEach(warning => {
                            msg += `• ${warning}\n`;
                        });
                    }

                    msg += `\n👨‍💼 ĐỘI NGŨ (${project.team.length})\n`;
                    const keyMembers = project.team.slice(0, 2);
                    keyMembers.forEach(member => {
                        msg += `• ${member.role}: ${member.experience} (${member.years} năm)\n`;
                    });
                    if (project.team.length > 2) {
                        msg += `• ...và ${project.team.length - 2} thành viên khác\n`;
                    }

                    msg += `\n🗓️ ROADMAP\n`;
                    const currentRoadmap = project.roadmap[0];
                    msg += `• ${currentRoadmap.period}: ${currentRoadmap.milestones.join(', ')}\n`;

                    msg += `\n📝 NHIỆM VỤ\n`;

                    const easyTasks = project.tasks.filter(t => t.difficulty === 'easy');
                    const mediumTasks = project.tasks.filter(t => t.difficulty === 'medium');
                    const hardTasks = project.tasks.filter(t => t.difficulty === 'hard');

                    if (easyTasks.length > 0) {
                        msg += `• 🟢 Dễ: ${easyTasks.map(t => `${t.name} (${t.reward})`).join(', ')}\n`;
                    }
                    if (mediumTasks.length > 0) {
                        msg += `• 🟠 Trung bình: ${mediumTasks.map(t => `${t.name} (${t.reward})`).join(', ')}\n`;
                    }
                    if (hardTasks.length > 0) {
                        msg += `• 🔴 Khó: ${hardTasks.map(t => `${t.name} (${t.reward})`).join(', ')}\n`;
                    }

                    const totalReward = project.tasks.reduce((sum, task) => sum + task.reward, 0);
                    msg += `• Tổng phần thưởng: ${totalReward} ${project.name}\n`;

                    const wallet = wallets[senderID];
                    if (wallet) {
                        msg += `\n📊 TIẾN ĐỘ CỦA BẠN\n`;
                        const completedTasks = tasks[senderID]?.[projectId] || [];
                        msg += `• Hoàn thành: ${completedTasks.length}/${project.tasks.length} nhiệm vụ\n`;

                        const tokenAmount = wallet.tokens[project.name] || 0;
                        const stakedAmount = wallet.staked?.[project.name] || 0;

                        if (tokenAmount > 0 || stakedAmount > 0) {
                            msg += `• Token đang có: ${tokenAmount} ${project.name}\n`;
                            if (stakedAmount > 0) {
                                msg += `• Token đã stake: ${stakedAmount} ${project.name}\n`;
                            }

                            const value = tokenAmount * project.tokenPrice;
                            const stakedValue = stakedAmount * project.tokenPrice * 1.5;
                            const totalValue = value + stakedValue;

                            if (totalValue > 0) {
                                msg += `• Giá trị: $${totalValue.toFixed(2)}\n`;
                            }
                        } else {
                            msg += `• Bạn chưa có token nào từ dự án này\n`;
                        }
                    }

                    msg += `\n📱 HÀNH ĐỘNG\n`;
                    if (wallet) {
                        msg += `• Xem nhiệm vụ: .airdrop task ${projectId}\n`;

                        const tokenAmount = wallet.tokens[project.name] || 0;
                        if (tokenAmount > 0) {
                            msg += `• Stake token: .airdrop stake ${projectId} ${tokenAmount}\n`;
                        }
                    } else {
                        msg += `• Bạn cần kết nối ví trước: .airdrop connect\n`;
                    }

                    if (safuScore < 40) {
                        msg += `\n⚠️ CẢNH BÁO RỦI RO CAO!\nHãy cân nhắc kỹ trước khi tham gia.\n`;
                    }

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "nav":
                case "go": {
                    const direction = target[1]?.toLowerCase();

                    if (!direction) {
                        return api.sendMessage(
                            "📡 ĐIỀU HƯỚNG AIRDROP 📡\n\n" +
                            "Sử dụng:\n" +
                            ".airdrop nav next - Xem dự án tiếp theo\n" +
                            ".airdrop nav prev - Xem dự án trước đó\n" +
                            ".airdrop nav safe - Xem dự án an toàn nhất\n" +
                            ".airdrop nav risky - Xem dự án rủi ro cao nhất\n" +
                            ".airdrop nav random - Xem dự án ngẫu nhiên\n" +
                            ".airdrop nav newest - Xem dự án mới nhất\n" +
                            ".airdrop nav best - Xem dự án tốt nhất",
                            threadID, messageID
                        );
                    }

                    const allProjects = Object.values(projects);
                    if (allProjects.length === 0) {
                        return api.sendMessage(
                            "❌ Hiện không có dự án nào! Hãy dùng lệnh '.airdrop refresh' để tạo dự án mới.",
                            threadID, messageID
                        );
                    }

                    let targetProject;

                    switch (direction) {
                        case "next":
                        case "prev":
                            const projectIds = Object.keys(projects);
                            const randomIndex = Math.floor(Math.random() * projectIds.length);
                            targetProject = projects[projectIds[randomIndex]];
                            break;

                        case "safe":
                        case "safest":
                            targetProject = allProjects
                                .sort((a, b) => calculateSafuScore(b) - calculateSafuScore(a))[0];
                            break;

                        case "risky":
                        case "risk":
                            targetProject = allProjects
                                .sort((a, b) => calculateSafuScore(a) - calculateSafuScore(b))[0];
                            break;

                        case "random":
                            targetProject = allProjects[Math.floor(Math.random() * allProjects.length)];
                            break;

                        case "newest":
                        case "new":
                            targetProject = allProjects
                                .sort((a, b) => b.createdAt - a.createdAt)[0];
                            break;

                        case "best":
                            targetProject = allProjects
                                .sort((a, b) => {
                                    const scoreA = calculateSafuScore(a) * 0.7 + (a.dailyGrowthRate * 1000) * 0.3;
                                    const scoreB = calculateSafuScore(b) * 0.7 + (b.dailyGrowthRate * 1000) * 0.3;
                                    return scoreB - scoreA;
                                })[0];
                            break;

                        default:
                            return api.sendMessage(
                                "❌ Tùy chọn không hợp lệ!\n" +
                                "Sử dụng: .airdrop nav [next/prev/safe/risky/random/newest/best]",
                                threadID, messageID
                            );
                    }

                    if (targetProject) {
                        const safetyInfo = analyzeTrustAndRisk(targetProject);
                        const safuScore = safetyInfo.safuScore;
                        const safuEmoji = safuScore >= 70 ? '🟢' : (safuScore >= 40 ? '🟠' : '🔴');

                        let msg = `🧭 ĐÃ TÌM THẤY DỰ ÁN ${direction.toUpperCase()}\n`;
                        msg += `━━━━━━━━━━━━━━━━━━\n\n`;

                        msg += `📌 ${targetProject.name} (${targetProject.type}) ${safuEmoji}\n`;
                        msg += `💰 Token: $${targetProject.tokenPrice.toFixed(4)} (+${(targetProject.dailyGrowthRate * 100).toFixed(1)}%/ngày)\n`;
                        msg += `ℹ️ ${targetProject.description}\n`;
                        msg += `👥 Cộng đồng: ${targetProject.communitySize.toLocaleString()}\n`;

                        if (safetyInfo.warnings.length > 0) {
                            msg += `⚠️ ${safetyInfo.warnings[0]}\n`;
                        }

                        msg += `\n📝 NHIỆM VỤ: ${targetProject.tasks.length} nhiệm vụ\n`;
                        msg += `💸 Tổng phần thưởng: ${targetProject.tasks.reduce((sum, task) => sum + task.reward, 0)} token\n\n`;

                        msg += `📱 HÀNH ĐỘNG:\n`;
                        msg += `• Xem chi tiết: .airdrop detail ${targetProject.id}\n`;
                        msg += `• Làm nhiệm vụ: .airdrop task ${targetProject.id}\n`;
                        msg += `• Tìm dự án khác: .airdrop nav random`;

                        return api.sendMessage(msg, threadID, messageID);
                    } else {
                        return api.sendMessage(
                            "❌ Không tìm thấy dự án phù hợp!",
                            threadID, messageID
                        );
                    }
                }
                case "refresh": {
                    const projectTypes = Object.keys(PROJECT_TEMPLATES);
                    const numToCreate = Math.floor(Math.random() * 3) + 1;
                    const createdProjects = [];

                    for (let i = 0; i < numToCreate; i++) {
                        const randomType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
                        const newProject = createProject(randomType);
                        if (newProject) {
                            createdProjects.push(newProject);
                        }
                    }

                    if (createdProjects.length === 0) {
                        return api.sendMessage(
                            "❌ Không thể tạo dự án mới. Vui lòng thử lại sau!",
                            threadID, messageID
                        );
                    }

                    let msg = `🎉 ĐÃ TẠO ${createdProjects.length} DỰ ÁN MỚI!\n\n`;

                    createdProjects.forEach(project => {
                        msg += `📌 ${project.name} (${project.type})\n`;
                        msg += `ℹ️ ${project.description}\n`;
                        msg += `💰 Token: $${project.tokenPrice.toFixed(4)}\n`;
                        msg += `ID: ${project.id}\n\n`;
                    });

                    msg += `Sử dụng lệnh '.airdrop projects' để xem chi tiết!`;

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "task":
                case "do": {
                    const projectId = target[1];
                    const taskId = target[2];

                    // Nếu không có projectId, hiển thị danh sách dự án
                    if (!projectId) {
                        let msg = "📋 DANH SÁCH DỰ ÁN CÓ NHIỆM VỤ 📋\n\n";

                        const topProjects = Object.values(projects)
                            .sort((a, b) => calculateSafuScore(b) - calculateSafuScore(a))
                            .slice(0, 5);

                        if (topProjects.length === 0) {
                            return api.sendMessage(
                                "❌ Hiện không có dự án nào! Hãy dùng lệnh '.airdrop refresh' để tạo dự án mới.",
                                threadID, messageID
                            );
                        }

                        topProjects.forEach((project, index) => {
                            const safuScore = calculateSafuScore(project);
                            const safuEmoji = safuScore >= 70 ? '🟢' : (safuScore >= 40 ? '🟠' : '🔴');

                            msg += `${index + 1}. ${project.name} (${project.type})\n`;
                            msg += `   ${safuEmoji} SAFU: ${safuScore}/100\n`;
                            msg += `   💰 Token: $${project.tokenPrice.toFixed(4)}\n`;
                            msg += `   📝 ID: ${project.id}\n\n`;
                        });

                        msg += "Dùng lệnh `.airdrop task [project_id]` để xem nhiệm vụ của dự án.";
                        return api.sendMessage(msg, threadID, messageID);
                    }

                    if (!taskId) {
                        const project = projects[projectId];
                        if (!project) {
                            return api.sendMessage(
                                "❌ Dự án không tồn tại! Hãy kiểm tra lại ID.",
                                threadID, messageID
                            );
                        }

                        let msg = `📝 NHIỆM VỤ CỦA DỰ ÁN ${project.name} 📝\n\n`;

                        const wallet = wallets[senderID];
                        const completedTasks = tasks[senderID]?.[projectId] || [];

                        project.tasks.forEach((task, index) => {
                            const isCompleted = completedTasks.includes(task.id);
                            const emoji = isCompleted ? '✅' : '⬜';

                            msg += `${emoji} ${index + 1}. ${task.name} (${task.difficulty})\n`;
                            msg += `   💰 Phần thưởng: ${task.reward} ${project.name}\n`;
                            msg += `   ℹ️ ${task.description}\n`;
                            msg += `   📝 ID Nhiệm vụ: ${task.id}\n\n`;
                        });

                        msg += "Dùng lệnh `.airdrop task " + projectId + " [task_id]` để hoàn thành nhiệm vụ.";
                        return api.sendMessage(msg, threadID, messageID);
                    }

                    const result = completeTask(senderID, projectId, taskId);
                    return api.sendMessage(result.message, threadID, messageID);
                }

                case "stake": {
                    const projectId = target[1];
                    const amount = parseInt(target[2]);

                    if (!projectId || !amount) {
                        return api.sendMessage(
                            "❌ Vui lòng nhập đúng cú pháp:\n.airdrop stake [project_id] [amount]",
                            threadID, messageID
                        );
                    }

                    const result = stakeTokens(senderID, projectId, amount);
                    return api.sendMessage(result.message, threadID, messageID);
                }

                case "balance":
                case "info": {
                    const wallet = initUserData(senderID);
                    if (!wallet) {
                        return api.sendMessage(
                            "❌ Bạn chưa kết nối ví! Dùng '.airdrop connect' để tạo ví.",
                            threadID, messageID
                        );
                    }

                    const farmingLevel = wallet.farming?.level || 1;
                    const currentLevel = FARMING_LEVELS.find(l => l.level === farmingLevel) || FARMING_LEVELS[0];
                    const nextLevel = farmingLevel < 5 ?
                        FARMING_LEVELS.find(l => l.level === farmingLevel + 1) : null;

                    const now = Date.now();
                    const timePassed = now - (wallet.farming?.lastClaim || 0);
                    const canFarmNow = timePassed >= FARMING_CONFIG.interval;
                    const timeRemaining = canFarmNow ? 0 : FARMING_CONFIG.interval - timePassed;
                    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

                    const tokensValue = calculateRewards(senderID);
                    const nftCount = wallet.nfts?.length || 0;
                    const nftValue = nftCount * NFT_CONFIG.mintPrice * 0.5;
                    const totalAssetValue = tokensValue + nftValue;

                    const power = wallet.farming?.power || 1;
                    const baseAmount = FARMING_CONFIG.baseRate * power;
                    const nftBonus = calculateNFTBonus(wallet.nfts || []);
                    const levelBonus = currentLevel.bonus;
                    const streakBonus = Math.min(
                        (wallet.farming?.streak || 0) * FARMING_CONFIG.streakBonus,
                        FARMING_CONFIG.maxStreakBonus
                    );
                    const totalMultiplier = 1 + nftBonus + levelBonus + streakBonus;
                    const hourlyIncome = Math.floor(baseAmount * totalMultiplier);
                    const dailyIncome = Math.floor(hourlyIncome * 24 * 0.7);

                    const achievements = wallet.quests?.achievements || [];
                    const achievementCount = achievements.length;
                    const totalAchievements = Object.keys(ACHIEVEMENTS).length;

                    let msg = `🌟 THÔNG TIN TÀI KHOẢN AIRDROP 🌟\n`;
                    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                    msg += `👤 THÔNG TIN CHUNG\n`;
                    msg += `• Địa chỉ ví: ${wallet.address.substring(0, 8)}...${wallet.address.substring(wallet.address.length - 6)}\n`;
                    msg += `• Cấp độ: ${currentLevel.name} (${farmingLevel}/5)\n`;

                    if (nextLevel) {
                        const progress = wallet.farming?.totalFarmed || 0;
                        const percentage = Math.min(100, Math.floor((progress / nextLevel.requirement) * 100));
                        msg += `• Tiến trình lên cấp: ${percentage}% | ${progress}/${nextLevel.requirement}\n`;
                    } else {
                        msg += `• Cấp độ tối đa đạt được! 🏆\n`;
                    }

                    msg += `• Streak farming: ${wallet.farming?.streak || 0} ngày\n`;
                    msg += `• Thành tựu: ${achievementCount}/${totalAchievements}\n\n`;

                    const userBadges = calculateUserBadges(wallet);
                    if (userBadges.length > 0) {
                        msg += `🏅 HUY HIỆU\n`;
                        userBadges.forEach(badgeId => {
                            const badge = USER_BADGES[badgeId];
                            if (badge) {
                                msg += `• ${badge.name}: ${badge.description}\n`;
                            }
                        });
                        msg += `\n`;
                    }

                    msg += `💰 TÀI SẢN\n`;

                    if (wallet.tokens['FARM']) {
                        msg += `• FARM: ${wallet.tokens['FARM']} token\n`;
                    }

                    let otherTokens = Object.entries(wallet.tokens).filter(([symbol]) => symbol !== 'FARM');
                    if (otherTokens.length > 0) {
                        otherTokens.forEach(([symbol, amount]) => {
                            msg += `• ${symbol}: ${amount} token\n`;
                        });
                    }

                    let hasStakedTokens = false;
                    if (Object.keys(wallet.staked || {}).length > 0) {
                        msg += `\n📌 ĐÃ STAKE\n`;
                        Object.entries(wallet.staked).forEach(([symbol, amount]) => {
                            hasStakedTokens = true;
                            const project = Object.values(projects).find(p => p.name === symbol);
                            if (project) {
                                msg += `• ${symbol}: ${amount} token (x1.5) = $${(amount * project.tokenPrice * 1.5).toFixed(2)}\n`;
                            } else {
                                msg += `• ${symbol}: ${amount} token\n`;
                            }
                        });
                    }

                    if (!hasStakedTokens) {
                        msg += `\n💡 Chưa stake token nào! Stake để tăng giá trị x1.5 lần\n`;
                    }

                    msg += `\n🎨 NFT SỞ HỮU: ${nftCount} cái\n`;
                    if (nftCount > 0) {
                        const rarityCount = {
                            'Common': 0,
                            'Rare': 0,
                            'Epic': 0,
                            'Legendary': 0
                        };

                        wallet.nfts.forEach(nft => {
                            if (nft && nft.rarity) {
                                rarityCount[nft.rarity]++;
                            }
                        });

                        for (const [rarity, count] of Object.entries(rarityCount)) {
                            if (count > 0) {
                                msg += `• ${rarity}: ${count} cái\n`;
                            }
                        }

                        msg += `• Bonus farming: +${(nftBonus * 100).toFixed(0)}%\n`;
                    } else {
                        msg += `• Dùng lệnh '.airdrop nft mint' để tạo NFT!\n`;
                    }

                    msg += `\n💵 TỔNG GIÁ TRỊ: $${totalAssetValue.toFixed(2)}\n`;
                    msg += `• Token: $${tokensValue.toFixed(2)}\n`;
                    msg += `• NFT: $${nftValue.toFixed(2)}\n`;

                    msg += `\n📈 THU NHẬP\n`;
                    msg += `• Thu nhập/giờ: ${hourlyIncome} FARM\n`;
                    msg += `• Thu nhập/ngày (ước tính): ${dailyIncome} FARM\n`;

                    // Thông tin trạng thái farm
                    msg += `\n⏱️ TRẠNG THÁI FARM\n`;
                    if (canFarmNow) {
                        msg += `• ✅ Có thể farm ngay! Dùng lệnh '.airdrop farm'\n`;
                    } else {
                        msg += `• ⏳ Thời gian chờ: ${minutesRemaining} phút\n`;
                    }

                    msg += `\n💡 ĐỀ XUẤT HÀNH ĐỘNG\n`;

                    if (canFarmNow) {
                        msg += `• Farm ngay để thu hoạch token\n`;
                    }

                    if (wallet.tokens['FARM'] >= NFT_CONFIG.mintPrice) {
                        msg += `• Tạo NFT để tăng thu nhập (+${NFT_CONFIG.mintPrice / 100}%/NFT)\n`;
                    }

                    const uncompletedAchievements = Object.entries(ACHIEVEMENTS)
                        .filter(([id]) => !achievements.includes(id));

                    if (uncompletedAchievements.length > 0) {
                        const [id, achievement] = uncompletedAchievements[0];
                        const progress = calculateProgress(wallet, id);
                        const percentage = Math.min(100, Math.floor((progress / achievement.requirement) * 100));
                        msg += `• Hoàn thành thành tựu "${achievement.name}" (${percentage}%)\n`;
                    }

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "rank":
                case "top":
                case "leaderboard": {
                    const category = target[1]?.toLowerCase() || "value";

                    // Lấy danh sách người chơi đã có ví
                    const userWallets = Object.entries(wallets);
                    if (userWallets.length === 0) {
                        return api.sendMessage(
                            "⚠️ Chưa có người chơi nào tham gia Airdrop!",
                            threadID, messageID
                        );
                    }

                    let leaderboard = [];
                    let title = "";

                    switch (category) {
                        case "value":
                        case "wealth":
                            title = "💰 TOP 10 NGƯỜI GIÀU NHẤT 💰";
                            leaderboard = userWallets
                                .map(([userId, wallet]) => {
                                    const tokenValue = calculateRewards(userId);
                                    const nftValue = (wallet.nfts?.length || 0) * NFT_CONFIG.mintPrice * 0.5;
                                    return {
                                        userId,
                                        value: tokenValue + nftValue
                                    };
                                })
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 10);
                            break;

                        case "farm":
                        case "token":
                            title = "🪙 TOP 10 NGƯỜI CÓ NHIỀU FARM TOKEN NHẤT 🪙";
                            leaderboard = userWallets
                                .map(([userId, wallet]) => ({
                                    userId,
                                    value: wallet.tokens?.FARM || 0
                                }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 10);
                            break;

                        case "nft":
                            title = "🎨 TOP 10 NGƯỜI SƯU TẬP NFT 🎨";
                            leaderboard = userWallets
                                .map(([userId, wallet]) => ({
                                    userId,
                                    value: wallet.nfts?.length || 0
                                }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 10);
                            break;

                        case "level":
                            title = "👨‍🌾 TOP 10 NGƯỜI LEVEL CAO NHẤT 👨‍🌾";
                            leaderboard = userWallets
                                .map(([userId, wallet]) => ({
                                    userId,
                                    value: wallet.farming?.level || 1,
                                    subValue: wallet.farming?.totalFarmed || 0
                                }))
                                .sort((a, b) => b.value === a.value ?
                                    b.subValue - a.subValue : b.value - a.value)
                                .slice(0, 10);
                            break;

                        case "streak":
                            title = "🔥 TOP 10 STREAK FARMING CAO NHẤT 🔥";
                            leaderboard = userWallets
                                .map(([userId, wallet]) => ({
                                    userId,
                                    value: wallet.farming?.streak || 0
                                }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 10);
                            break;

                        default:
                            return api.sendMessage(
                                "⚠️ Loại bảng xếp hạng không hợp lệ. Sử dụng:\n" +
                                ".airdrop top value - Xếp hạng theo giá trị tài sản\n" +
                                ".airdrop top farm - Xếp hạng theo số lượng FARM token\n" +
                                ".airdrop top nft - Xếp hạng theo số lượng NFT\n" +
                                ".airdrop top level - Xếp hạng theo cấp độ farming\n" +
                                ".airdrop top streak - Xếp hạng theo streak farming",
                                threadID, messageID
                            );
                    }

                    let msg = `${title}\n`;
                    msg += `━━━━━━━━━━━━━━━━━━\n\n`;

                    leaderboard.forEach((entry, index) => {
                        let userIdDisplay = entry.userId;

                        // Thêm biểu tượng huy chương cho 3 người đầu tiên
                        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;

                        // Định dạng giá trị hiển thị dựa vào loại bảng xếp hạng
                        let valueDisplay = "";
                        switch (category) {
                            case "value":
                            case "wealth":
                                valueDisplay = `$${entry.value.toFixed(2)}`;
                                break;
                            case "farm":
                            case "token":
                                valueDisplay = `${entry.value} FARM`;
                                break;
                            case "nft":
                                valueDisplay = `${entry.value} NFT`;
                                break;
                            case "level":
                                valueDisplay = `Level ${entry.value} (${entry.subValue} FARM)`;
                                break;
                            case "streak":
                                valueDisplay = `${entry.value} ngày`;
                                break;
                        }

                        msg += `${medal} ID: ${userIdDisplay}\n   ${valueDisplay}\n`;
                    });

                    // Hiển thị vị trí của người gửi lệnh
                    const senderIndex = leaderboard.findIndex(entry => entry.userId === senderID);
                    if (senderIndex !== -1) {
                        msg += `\n🔍 Bạn đang xếp hạng #${senderIndex + 1}`;
                    } else {
                        const allUsers = userWallets
                            .map(([userId, wallet]) => {
                                let value = 0;
                                switch (category) {
                                    case "value":
                                    case "wealth":
                                        value = calculateRewards(userId) +
                                            (wallet.nfts?.length || 0) * NFT_CONFIG.mintPrice * 0.5;
                                        break;
                                    case "farm":
                                    case "token":
                                        value = wallet.tokens?.FARM || 0;
                                        break;
                                    case "nft":
                                        value = wallet.nfts?.length || 0;
                                        break;
                                    case "level":
                                        value = wallet.farming?.level || 1;
                                        break;
                                    case "streak":
                                        value = wallet.farming?.streak || 0;
                                        break;
                                }
                                return { userId, value };
                            })
                            .sort((a, b) => b.value - a.value);

                        const senderRank = allUsers.findIndex(entry => entry.userId === senderID) + 1;
                        if (senderRank > 0) {
                            msg += `\n🔍 Bạn đang xếp hạng #${senderRank} (không nằm trong top 10)`;
                        } else {
                            msg += `\n❓ Bạn chưa tham gia Airdrop! Dùng lệnh '.airdrop connect' để bắt đầu`;
                        }
                    }

                    return api.sendMessage(msg, threadID, messageID);
                }
                case "event": {
                    const event = checkActiveEvent();
                    if (!event) {
                        const newEvent = startRandomEvent();
                        if (newEvent) {
                            const duration = Math.floor(newEvent.duration / (60 * 60 * 1000));
                            let msg = `🎉 SỰ KIỆN MỚI ĐÃ BẮT ĐẦU! 🎉\n\n`;
                            msg += `📌 ${newEvent.name}\n`;
                            msg += `ℹ️ ${newEvent.description}\n`;
                            if (newEvent.bonus) msg += `💰 Bonus: +${newEvent.bonus * 100}%\n`;
                            if (newEvent.intervalReduction) msg += `⏱️ Giảm thời gian chờ: -${newEvent.intervalReduction * 100}%\n`;
                            if (newEvent.luckyChance) msg += `🍀 Tăng tỷ lệ may mắn: +${newEvent.luckyChance * 100}%\n`;
                            msg += `⏳ Thời gian: ${duration} giờ\n\n`;
                            msg += `Tranh thủ farm ngay để nhận nhiều token hơn!`;

                            return api.sendMessage(msg, threadID, messageID);
                        } else {
                            return api.sendMessage("❌ Hiện không có sự kiện nào diễn ra!", threadID, messageID);
                        }
                    } else {
                        const remainingTime = eventEndTime - Date.now();
                        const hoursRemaining = Math.floor(remainingTime / (60 * 60 * 1000));
                        const minutesRemaining = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

                        let msg = `🎮 SỰ KIỆN ĐANG DIỄN RA 🎮\n\n`;
                        msg += `📌 ${event.name}\n`;
                        msg += `ℹ️ ${event.description}\n`;
                        if (event.bonus) msg += `💰 Bonus: +${event.bonus * 100}%\n`;
                        if (event.intervalReduction) msg += `⏱️ Giảm thời gian chờ: -${event.intervalReduction * 100}%\n`;
                        if (event.luckyChance) msg += `🍀 Tăng tỷ lệ may mắn: +${event.luckyChance * 100}%\n`;
                        msg += `⏳ Thời gian còn lại: ${hoursRemaining}h ${minutesRemaining}m\n\n`;
                        msg += `Tranh thủ farm ngay để nhận nhiều token hơn!`;

                        return api.sendMessage(msg, threadID, messageID);
                    }
                }
                case "claim": {
                    const totalValue = calculateRewards(senderID);
                    if (totalValue <= 0) {
                        return api.sendMessage(
                            "❌ Bạn không có token nào để claim!",
                            threadID, messageID
                        );
                    }
                
                    const withdrawalFee = Math.min(Math.ceil(totalValue * 0.05), 100); 
                    const finalAmount = Math.floor(totalValue - withdrawalFee);
                    
                    const isFirstClaim = !wallet.hasClaimedBefore;
                    const actualFee = isFirstClaim ? Math.ceil(withdrawalFee / 2) : withdrawalFee;
                    const actualAmount = isFirstClaim ? Math.floor(totalValue - actualFee) : finalAmount;
                    
                    if (!global.airdropStats) {
                        global.airdropStats = {
                            totalFeesCollected: 0,
                            totalClaimedAmount: 0,
                            claimCount: 0
                        };
                    }
                    global.airdropStats.totalFeesCollected += actualFee;
                    global.airdropStats.totalClaimedAmount += actualAmount;
                    global.airdropStats.claimCount++;
                
                    updateBalance(senderID, actualAmount);
                
                    if (wallets[senderID]) {
                        wallets[senderID].tokens = {};
                        wallets[senderID].staked = {};
                        wallets[senderID].hasClaimedBefore = true;
                        saveData();
                    }
                
                    return api.sendMessage(
                        `✅ Đã claim thành công!\n` +
                        `💰 Nhận được: $${actualAmount}\n` +
                        `💸 Phí giao dịch: $${actualFee} (${isFirstClaim ? "50% giảm giá lần đầu" : "5%"})\n\n` +
                        `💡 Tip: Claim số tiền càng lớn, tỷ lệ phí càng hiệu quả!`,
                        threadID, messageID
                    );
                }

                case "farm": {
                    initUserData(senderID);
                    const result = farmTokens(senderID);
                    return api.sendMessage(result.message, threadID, messageID);
                }

                case "farm-info":
                case "farming": {
                    const wallet = initUserData(senderID);
                    if (!wallet || !wallet.farming) {
                        return api.sendMessage(
                            "❌ Bạn chưa bắt đầu farming! Dùng lệnh '.airdrop farm' để bắt đầu.",
                            threadID, messageID
                        );
                    }

                    const currentLevel = FARMING_LEVELS.find(l => l.level === wallet.farming.level) || FARMING_LEVELS[0];
                    const nextLevel = FARMING_LEVELS.find(l => l.level > wallet.farming.level) || null;

                    const now = Date.now();
                    const timePassed = now - (wallet.farming.lastClaim || 0);
                    const canFarmNow = timePassed >= FARMING_CONFIG.interval;

                    const timeRemaining = canFarmNow ? 0 : FARMING_CONFIG.interval - timePassed;
                    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

                    const power = wallet.farming.power || 1;
                    const baseAmount = FARMING_CONFIG.baseRate * power;
                    const nftBonus = calculateNFTBonus(wallet.nfts || []);
                    const streakBonus = Math.min(
                        wallet.farming.streak * FARMING_CONFIG.streakBonus,
                        FARMING_CONFIG.maxStreakBonus
                    );
                    const levelBonus = currentLevel.bonus;
                    const totalBonus = nftBonus + streakBonus + levelBonus;
                    const hourlyRate = Math.floor(baseAmount * (1 + totalBonus));

                    let msg = "🌾 THÔNG TIN FARMING 🌾\n";
                    msg += "━━━━━━━━━━━━━━━━━━\n\n";
                    msg += `👨‍🌾 CẤP ĐỘ: ${currentLevel.name} (${wallet.farming.level}/5)\n`;
                    if (nextLevel) {
                        const progress = wallet.farming.totalFarmed;
                        const required = nextLevel.requirement;
                        const percentage = Math.min(100, Math.floor((progress / required) * 100));
                        msg += `📊 Tiến độ lên cấp: ${progress}/${required} (${percentage}%)\n`;
                    } else {
                        msg += `🏆 Đã đạt cấp độ tối đa!\n`;
                    }
                    msg += `\n💰 HIỆU SUẤT:\n`;
                    msg += `• Cơ bản: ${baseAmount} FARM/giờ\n`;
                    if (nftBonus > 0) msg += `• Bonus NFT: +${(nftBonus * 100).toFixed(0)}%\n`;
                    if (streakBonus > 0) msg += `• Streak bonus: +${(streakBonus * 100).toFixed(0)}%\n`;
                    msg += `• Level bonus: +${(levelBonus * 100).toFixed(0)}%\n`;
                    msg += `• Tổng bonus: +${(totalBonus * 100).toFixed(0)}%\n`;
                    msg += `• Thu nhập: ${hourlyRate} FARM/giờ\n`;
                    msg += `\n📈 THÀNH TÍCH:\n`;
                    msg += `• Tổng đã farm: ${wallet.farming.totalFarmed} FARM\n`;
                    msg += `• Streak hiện tại: ${wallet.farming.streak} ngày\n`;
                    msg += `• Số NFT sở hữu: ${wallet.nfts?.length || 0}\n`;
                    msg += `\n⏱️ TRẠNG THÁI:\n`;
                    if (canFarmNow) {
                        msg += `• ✅ Có thể farm ngay bây giờ!\n`;
                        msg += `• Dùng lệnh '.airdrop farm' để thu hoạch`;
                    } else {
                        msg += `• ⏳ Thời gian chờ: ${hoursRemaining}h ${minutesRemaining}m\n`;
                    }
                    return api.sendMessage(msg, threadID, messageID);
                }

                case "help": {
                    const helpTopic = target[1]?.toLowerCase();

                    if (helpTopic) {
                        switch (helpTopic) {
                            case "start":
                            case "begin":
                                return api.sendMessage(
                                    "🚀 HƯỚNG DẪN BẮT ĐẦU 🚀\n\n" +
                                    "1️⃣ Đầu tiên, kết nối ví với lệnh:\n   .airdrop connect\n\n" +
                                    "2️⃣ Xem các dự án có sẵn để tham gia:\n   .airdrop projects\n\n" +
                                    "3️⃣ Hoàn thành nhiệm vụ trong dự án để nhận token:\n   .airdrop task [project_id] [task_id]\n\n" +
                                    "4️⃣ Thu hoạch token FARM mỗi giờ:\n   .airdrop farm\n\n" +
                                    "5️⃣ Kiểm tra số dư token của bạn:\n   .airdrop info\n\n" +
                                    "💡 Gõ '.airdrop help tokens' để tìm hiểu về các loại token",
                                    threadID, messageID
                                );

                            case "tokens":
                            case "farm":
                                return api.sendMessage(
                                    "💰 HƯỚNG DẪN VỀ TOKEN 💰\n\n" +
                                    "🪙 Các loại token:\n" +
                                    "• FARM: Token chính của hệ thống, dùng để mint NFT\n" +
                                    "• Token dự án: Mỗi dự án sẽ có token riêng (VD: DEFI-abc123)\n\n" +
                                    "📈 Cách kiếm token:\n" +
                                    "• Thu hoạch FARM mỗi giờ với lệnh '.airdrop farm'\n" +
                                    "• Hoàn thành nhiệm vụ dự án để nhận token dự án\n" +
                                    "• Hoàn thành nhiệm vụ hàng ngày để nhận thêm FARM\n\n" +
                                    "💱 Sử dụng token:\n" +
                                    "• Stake token dự án: '.airdrop stake [project_id] [amount]'\n" +
                                    "• Mint NFT với FARM: '.airdrop nft mint'\n" +
                                    "• Đổi token lấy tiền: '.airdrop claim'",
                                    threadID, messageID
                                );

                                case "projects":
                                    return api.sendMessage(
                                        "🏢 HƯỚNG DẪN VỀ DỰ ÁN 🏢\n\n" +
                                        "📋 XEM DANH SÁCH DỰ ÁN\n" +
                                        "• .airdrop projects - Xem tất cả dự án\n" +
                                        "• .airdrop projects [loại] - Lọc theo loại (defi/nft/gamefi...)\n" +
                                        "• .airdrop projects [loại] [sắp xếp] - Sắp xếp (newest/price/safu/growth/rewards)\n" +
                                        "• .airdrop projects [loại] [sắp xếp] [trang] - Xem trang cụ thể\n\n" +
                                        
                                        "🔍 LỌC THEO RỦI RO\n" +
                                        "• .airdrop projects safe - Lọc dự án an toàn (SAFU ≥ 70)\n" +
                                        "• .airdrop projects medium - Lọc dự án trung bình (SAFU 40-69)\n" +
                                        "• .airdrop projects risky - Lọc dự án rủi ro cao (SAFU < 40)\n\n" +
                                        
                                        "🧭 ĐIỀU HƯỚNG DỰ ÁN\n" +
                                        "• .airdrop nav safe - Xem dự án an toàn nhất\n" +
                                        "• .airdrop nav best - Xem dự án tốt nhất (SAFU + lợi nhuận)\n" +
                                        "• .airdrop nav random - Xem dự án ngẫu nhiên\n" +
                                        "• .airdrop nav newest - Xem dự án mới nhất\n\n" +
                                        
                                        "🔍 XEM CHI TIẾT DỰ ÁN\n" +
                                        "• .airdrop detail [project_id] - Xem thông tin chi tiết dự án\n\n" +
                                        
                                        "📊 ĐÁNH GIÁ DỰ ÁN\n" +
                                        "• SAFU Score: Đánh giá độ an toàn của dự án (0-100)\n" +
                                        "• 🟢 70-100: An toàn, đáng tin cậy\n" +
                                        "• 🟠 40-69: Cần thận trọng\n" +
                                        "• 🔴 0-39: Rủi ro cao\n\n" +
                                        
                                        "💡 CHIẾN LƯỢC THAM GIA\n" +
                                        "• Ưu tiên dự án có SAFU score cao\n" +
                                        "• Làm nhiệm vụ dễ trước, khó sau\n" +
                                        "• Stake token của dự án triển vọng để tăng giá trị\n" +
                                        "• Đa dạng hóa danh mục đầu tư vào nhiều loại dự án\n" +
                                        "• Chú ý cảnh báo rủi ro trong phần chi tiết dự án",
                                        threadID, messageID
                                    );
                            case "nft":
                                return api.sendMessage(
                                    "🎨 HƯỚNG DẪN VỀ NFT 🎨\n\n" +
                                    "NFT là vật phẩm kỹ thuật số giúp tăng hiệu suất farming\n\n" +
                                    "📝 Tạo NFT:\n" +
                                    "• Dùng lệnh '.airdrop nft mint' (giá: 1000 FARM)\n" +
                                    "• NFT có các độ hiếm: Common, Rare, Epic, Legendary\n" +
                                    "• Mỗi NFT có các chỉ số ngẫu nhiên (Power, Luck, Speed, Yield)\n\n" +
                                    "🔍 Xem NFT của bạn:\n" +
                                    "• Dùng lệnh '.airdrop nft list'\n\n" +
                                    "⚡ Lợi ích của NFT:\n" +
                                    "• Tăng lượng token FARM thu được khi farming\n" +
                                    "• Càng nhiều NFT và độ hiếm càng cao, bonus càng lớn\n" +
                                    "• NFT với chỉ số Yield cao giúp tăng thu nhập nhiều hơn",
                                    threadID, messageID
                                );

                            case "quests":
                                return api.sendMessage(
                                    "📋 HƯỚNG DẪN NHIỆM VỤ & THÀNH TỰU 📋\n\n" +
                                    "🎯 Nhiệm vụ hàng ngày:\n" +
                                    "• Farm Tokens: Thu hoạch FARM token\n" +
                                    "• Complete Tasks: Hoàn thành nhiệm vụ dự án\n" +
                                    "• Trading Volume: Stake hoặc swap token\n\n" +
                                    "🏆 Thành tựu:\n" +
                                    "• Master Farmer: Sở hữu nhiều token FARM\n" +
                                    "• Pro Trader: Đạt giá trị giao dịch cao\n" +
                                    "• NFT Collector: Sở hữu nhiều NFT\n\n" +
                                    "💰 Phần thưởng:\n" +
                                    "• Hoàn thành nhiệm vụ để nhận token FARM\n" +
                                    "• Mỗi thành tựu có phần thưởng khác nhau\n\n" +
                                    "📊 Kiểm tra tiến độ:\n" +
                                    "• Dùng lệnh '.airdrop quests'",
                                    threadID, messageID
                                );

                            case "earn":
                            case "money":
                                return api.sendMessage(
                                    "💸 HƯỚNG DẪN KIẾM TIỀN 💸\n\n" +
                                    "📈 Chiến lược tối ưu:\n" +
                                    "1. Kết nối ví và hoàn thành nhiệm vụ dự án\n" +
                                    "2. Thu hoạch FARM token mỗi giờ\n" +
                                    "3. Stake token dự án để tăng giá trị x1.5\n" +
                                    "4. Dùng FARM để mint NFT để tăng hiệu suất farming\n" +
                                    "5. Hoàn thành nhiệm vụ hàng ngày để nhận thêm FARM\n" +
                                    "6. Đạt được các thành tựu để nhận nhiều FARM hơn\n\n" +
                                    "💰 Đổi lấy tiền thật:\n" +
                                    "• Dùng lệnh '.airdrop claim' để đổi tất cả token lấy tiền\n" +
                                    "• Giá trị = (số token × giá token) + (số token stake × giá token × 1.5)\n\n" +
                                    "⚠️ Lưu ý: Khi claim, tất cả token sẽ bị reset về 0!",
                                    threadID, messageID
                                );


                            case "rank":
                            case "ranking":
                                return api.sendMessage(
                                    "📊 XẾP HẠNG NGƯỜI CHƠI 📊\n\n" +
                                    "Xem bảng xếp hạng người chơi:\n" +
                                    "• .airdrop top value - Xếp hạng theo giá trị tài sản\n" +
                                    "• .airdrop top farm - Xếp hạng theo số lượng FARM token\n" +
                                    "• .airdrop top nft - Xếp hạng theo số lượng NFT\n" +
                                    "• .airdrop top level - Xếp hạng theo cấp độ farming\n" +
                                    "• .airdrop top streak - Xếp hạng theo streak farming\n\n" +
                                    "Cố gắng đạt được thứ hạng cao để đạt được huy hiệu đặc biệt!",
                                    threadID, messageID
                                );
                            default:
                                return api.sendMessage(
                                    "❓ DANH MỤC HƯỚNG DẪN ❓\n\n" +
                                    "Chọn một chủ đề để xem hướng dẫn chi tiết:\n\n" +
                                    "1. .airdrop help start - Hướng dẫn bắt đầu\n" +
                                    "2. .airdrop help tokens - Thông tin về token\n" +
                                    "3. .airdrop help nft - Hướng dẫn về NFT\n" +
                                    "4. .airdrop help quests - Nhiệm vụ & thành tựu\n" +
                                    "5. .airdrop help earn - Chiến lược kiếm tiền\n\n" +
                                    "👉 Hoặc gõ '.airdrop help' để xem tổng quan",
                                    threadID, messageID
                                );
                        }
                    }

                    return api.sendMessage(
                        "📚 HƯỚNG DẪN CHƠI AIRDROP 📚\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "💡 KHÁI NIỆM CHÍNH\n" +
                        "• Airdrop là game mô phỏng việc kiếm token từ các dự án crypto\n" +
                        "• Bạn tạo ví, tham gia dự án, hoàn thành nhiệm vụ để nhận token\n" +
                        "• Token có thể stake để tăng giá trị hoặc đổi thành tiền thật\n\n" +

                        "🎮 CÁCH CHƠI CƠ BẢN\n" +
                        "1. Kết nối ví: .airdrop connect\n" +
                        "2. Xem dự án: .airdrop projects\n" +
                        "3. Làm nhiệm vụ: .airdrop task [project_id] [task_id]\n" +
                        "4. Thu hoạch: .airdrop farm (mỗi giờ 1 lần)\n" +
                        "5. Mint NFT: .airdrop nft mint (để tăng tốc độ farm)\n" +
                        "6. Xem tiến độ: .airdrop quests\n" +
                        "7. Đổi tiền: .airdrop claim\n\n" +

                        "👨‍🏫 HƯỚNG DẪN CHI TIẾT\n" +
                        "• Gõ '.airdrop help start' để xem hướng dẫn bắt đầu\n" +
                        "• Gõ '.airdrop help tokens' để hiểu về token\n" +
                        "• Gõ '.airdrop help nft' để tìm hiểu về NFT\n" +
                        "• Gõ '.airdrop help quests' để xem nhiệm vụ\n" +
                        "• Gõ '.airdrop help earn' để biết cách kiếm tiền hiệu quả\n" +
                        "• Gõ '.airdrop help rank' để xem bảng xếp hạng người chơi\n\n" +

                        "💼 CHIẾN LƯỢC\n" +
                        "• Farm token mỗi giờ để tối đa hóa thu nhập\n" +
                        "• Stake token để tăng giá trị lên 1.5 lần\n" +
                        "• Mint nhiều NFT để tăng hiệu suất farming\n" +
                        "• Hoàn thành nhiệm vụ hàng ngày và thành tựu",
                        threadID, messageID
                    );
                }
                case "nft": {
                    const nftAction = target[1]?.toLowerCase();

                    switch (nftAction) {
                        case "mint":
                            const result = mintNFT(senderID);
                            return api.sendMessage(result.message, threadID, messageID);

                        case "list": {
                            const wallet = wallets[senderID];
                            if (!wallet?.nfts?.length) {
                                return api.sendMessage("You don't own any NFTs", threadID, messageID);
                            }

                            let msg = "🎨 YOUR NFTs 🎨\n";
                            wallet.nfts.forEach((nft, i) => {
                                msg += `\n${i + 1}. ${nft.rarity} NFT\n`;
                                msg += Object.entries(nft.attributes)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join('\n');
                                msg += '\n';
                            });

                            return api.sendMessage(msg, threadID, messageID);
                        }
                    }
                }

                case "quests": {
                    const wallet = initUserData(senderID);
                    let msg = "📝 QUESTS & ACHIEVEMENTS\n\n";

                    msg += "DAILY QUESTS:\n";
                    QUESTS.daily.forEach(quest => {

                        const questData = wallet.quests?.daily || {};
                        const progress = questData[quest.id] || 0;

                        msg += `• ${quest.name}: ${progress}/${quest.requirement}\n`;
                        msg += `  Reward: ${quest.reward} FARM\n`;
                    });

                    msg += "\nACHIEVEMENTS:\n";
                    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {

                        const achievements = wallet.quests?.achievements || [];
                        const unlocked = achievements.includes(id);

                        msg += `${unlocked ? '✅' : '❌'} ${achievement.name}\n`;
                        msg += `  Reward: ${achievement.reward} FARM\n`;
                    });

                    return api.sendMessage(msg, threadID, messageID);
                }
                default:
                    return api.sendMessage(
                        "🎮 AIRDROP 🎮\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        "📜 LỆNH CƠ BẢN:\n" +
                        "1. .airdrop connect - Kết nối ví\n" +
                        "2. .airdrop projects - Xem danh sách dự án\n" +
                        "3. .airdrop farm - Thu hoạch token\n" +
                        "4. .airdrop nft mint - Tạo NFT tăng hiệu suất\n" +
                        "5. .airdrop info - Xem thông tin ví\n" +
                        "6. .airdrop claim - Đổi token lấy tiền\n" +
                        "7. .airdrop rank - Xem bảng xếp hạng\n" +
                        "8. .airdrop event - xem sự kiện\n" +
                        "9. .airdrop refresh - Làm mới thông tin dự án\n\n" +

                        "📚 KHÔNG BIẾT CHƠI? GÕ:\n" +
                        "👉 .airdrop help - Xem hướng dẫn đầy đủ\n\n" +

                        "💡 MẸO: Mint NFT để tăng tốc độ farming token!",
                        threadID, messageID
                    );
            }
        } catch (err) {
            console.error('Airdrop error:', err);
            return api.sendMessage("❌ Có lỗi xảy ra!", threadID, messageID);
        }
    }
};
