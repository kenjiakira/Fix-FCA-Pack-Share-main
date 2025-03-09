const fs = require("fs");
const path = require("path");
const {
  getBalance,
  updateBalance,
  updateQuestProgress,
} = require("../utils/currencies");
const { getVIPBenefits } = require("../vip/vipCheck");
const farmDataPath = path.join(__dirname, "./json/farm_data.json");
const farmImagesDir = path.join(__dirname, "../cache/farm");

if (!fs.existsSync(path.dirname(farmDataPath))) {
  fs.mkdirSync(path.dirname(farmDataPath), { recursive: true });
}

if (!fs.existsSync(farmImagesDir)) {
  fs.mkdirSync(farmImagesDir, { recursive: true });
}

const CROPS = {
  lua: {
    name: "Lúa",
    emoji: "🌾",
    price: 50,
    time: 40 * 60,
    yield: 70,
    exp: 5,
    water: 3,
    level: 1,
    seasons: { ALL: true },
    description: "Cây lúa nước truyền thống, trồng được quanh năm",
  },
  rau: {
    name: "Rau xanh",
    emoji: "🥬",
    price: 10,
    time: 15 * 60,
    yield: 15,
    exp: 2,
    water: 2,
    level: 1,
    seasons: { ALL: true },
    description: "Các loại rau xanh: rau muống, rau cải...",
  },
  ca_rot: {
    name: "Cà rốt",
    emoji: "🥕",
    price: 15,
    time: 20 * 60,
    yield: 20,
    exp: 3,
    water: 2,
    level: 1,
    seasons: { AUTUMN: true, WINTER: true },
    description: "Cà rốt nhiều vitamin A, thích hợp mùa thu và đông",
  },

  gia_do: {
    name: "Giá đỗ",
    emoji: "🌱",
    price: 8,
    time: 10 * 60,
    yield: 14,
    exp: 2,
    water: 3,
    level: 1,
    seasons: { SPRING: true, ALL: true },
    description: "Giá đỗ tươi xanh, thu hoạch nhanh, đặc biệt tốt vào mùa xuân",
  },
  hanh_la: {
    name: "Hành lá",
    emoji: "🌿",
    price: 12,
    time: 15 * 60,
    yield: 18,
    exp: 3,
    water: 2,
    level: 1,
    seasons: { SPRING: true, SUMMER: true },
    description: "Hành lá thơm phức, dễ trồng vào đầu năm",
  },
  rau_bina: {
    name: "Rau bina",
    emoji: "🥬",
    price: 15,
    time: 20 * 60,
    yield: 22,
    exp: 4,
    water: 3,
    level: 2,
    seasons: { SPRING: true, WINTER: true },
    description: "Rau bina giàu dinh dưỡng, thích hợp mùa xuân mát mẻ",
  },
  dau: {
    name: "Đậu",
    emoji: "🌱",
    price: 20,
    time: 25 * 60,
    yield: 27,
    exp: 5,
    water: 2,
    level: 2,
    seasons: { SPRING: true, SUMMER: true },
    description:
      "Các loại đậu: đậu xanh, đậu đen... trồng tốt vào mùa xuân và hè",
  },
  dau_rong: {
    name: "Đậu rồng",
    emoji: "🌱",
    price: 15,
    time: 20 * 60,
    yield: 23,
    exp: 3,
    water: 3,
    level: 2,
    seasons: { ALL: true },
    description: "Đậu rồng dẻo thơm, cho thu hoạch quanh năm",
  },

  rau_muong: {
    name: "Rau muống",
    emoji: "🥗",
    price: 10,
    time: 15 * 60,
    yield: 15,
    exp: 3,
    water: 4,
    level: 1,
    seasons: { SUMMER: true },
    description: "Rau muống xanh mát, đặc trưng mùa hè Việt Nam",
  },
  dau_bap: {
    name: "Đậu bắp",
    emoji: "🌿",
    price: 18,
    time: 25 * 60,
    yield: 26,
    exp: 5,
    water: 3,
    level: 3,
    seasons: { SUMMER: true },
    description: "Đậu bắp mọng nước, kháng bệnh tốt trong mùa hè",
  },
  ca_tim: {
    name: "Cà tím",
    emoji: "🍆",
    price: 22,
    time: 30 * 60,
    yield: 32,
    exp: 6,
    water: 3,
    level: 4,
    seasons: { SUMMER: true, AUTUMN: true },
    description: "Cà tím màu tím óng, thu hoạch vào mùa nắng",
  },
  kho_qua: {
    name: "Khổ qua",
    emoji: "🥒",
    price: 20,
    time: 25 * 60,
    yield: 30,
    exp: 4,
    water: 3,
    level: 3,
    seasons: { SUMMER: true },
    description: "Khổ qua đắng mát, thích hợp trồng mùa nóng",
  },
  ngo: {
    name: "Ngô",
    emoji: "🌽",
    price: 25,
    time: 35 * 60,
    yield: 40,
    exp: 4,
    water: 3,
    level: 3,
    seasons: { SUMMER: true, AUTUMN: true },
    description: "Ngô ngọt đặc sản miền Trung, phát triển tốt vào mùa hè",
  },
  ca_chua: {
    name: "Cà chua",
    emoji: "🍅",
    price: 30,
    time: 40 * 60,
    yield: 40,
    exp: 5,
    water: 3,
    level: 4,
    seasons: { SUMMER: true, SPRING: true },
    description: "Cà chua tươi ngọt, phát triển tốt vào mùa hè nắng",
  },
  dua_hau: {
    name: "Dưa hấu",
    emoji: "🍉",
    price: 45,
    time: 60 * 60,
    yield: 60,
    exp: 10,
    water: 4,
    level: 6,
    seasons: { SUMMER: true },
    description: "Dưa hấu miền Trung ngọt lịm, chỉ phát triển tốt vào mùa hè",
  },
  dua_leo: {
    name: "Dưa leo",
    emoji: "🥒",
    price: 38,
    time: 30 * 60,
    yield: 60,
    exp: 6,
    water: 4,
    level: 5,
    seasons: { SUMMER: true, SPRING: true },
    description: "Dưa leo mát lành, trồng nhanh thu hoạch nhanh vào mùa hè",
  },

  bi_do: {
    name: "Bí đỏ",
    emoji: "🎃",
    price: 40,
    time: 45 * 60,
    yield: 60,
    exp: 7,
    water: 2,
    level: 5,
    seasons: { AUTUMN: true },
    description: "Bí đỏ to tròn, thu hoạch vào mùa thu",
  },
  khoai_mon: {
    name: "Khoai môn",
    emoji: "🌰",
    price: 35,
    time: 50 * 60,
    yield: 55,
    exp: 6,
    water: 3,
    level: 4,
    seasons: { AUTUMN: true, WINTER: true },
    description: "Khoai môn bột ngọt, trồng vào cuối mùa mưa",
  },
  dau_phong: {
    name: "Đậu phộng",
    emoji: "🥜",
    price: 30,
    time: 40 * 60,
    yield: 50,
    exp: 5,
    water: 2,
    level: 3,
    seasons: { AUTUMN: true },
    description: "Đậu phộng giòn ngon, thu hoạch vào mùa thu",
  },
  khoai_tay: {
    name: "Khoai tây",
    emoji: "🥔",
    price: 35,
    time: 45 * 60,
    yield: 60,
    exp: 5,
    water: 3,
    level: 5,
    seasons: { AUTUMN: true, WINTER: true },
    description: "Khoai tây Đà Lạt, thích hợp thời tiết mát mẻ mùa thu",
  },
  khoai_lang: {
    name: "Khoai lang",
    emoji: "🍠",
    price: 40,
    time: 50 * 60,
    yield: 60,
    exp: 10,
    water: 2,
    level: 7,
    seasons: { AUTUMN: true },
    description: "Khoai lang vỏ tím ruột vàng, thu hoạch vào mùa thu",
  },
  ot: {
    name: "Ớt",
    emoji: "🌶️",
    price: 28,
    time: 35 * 60,
    yield: 40,
    exp: 9,
    water: 2,
    level: 4,
    seasons: { AUTUMN: true, SUMMER: true },
    description: "Ớt cay nồng đặc trưng, phát triển tốt cuối hè đầu thu",
  },

  cai_xanh: {
    name: "Cải xanh",
    emoji: "🥦",
    price: 15,
    time: 20 * 60,
    yield: 25,
    exp: 4,
    water: 2,
    level: 2,
    seasons: { WINTER: true },
    description: "Cải xanh mát lành, thích hợp thời tiết mát mẻ mùa đông",
  },
  su_hao: {
    name: "Su hào",
    emoji: "🧅",
    price: 20,
    time: 30 * 60,
    yield: 30,
    exp: 5,
    water: 2,
    level: 3,
    seasons: { WINTER: true },
    description: "Su hào giòn ngọt, đặc trưng mùa đông miền Bắc",
  },
  cu_cai: {
    name: "Củ cải",
    emoji: "🥕",
    price: 18,
    time: 25 * 60,
    yield: 30,
    exp: 4,
    water: 3,
    level: 2,
    seasons: { WINTER: true },
    description: "Củ cải trắng tròn, phát triển tốt trong thời tiết lạnh",
  },
  bong_cai: {
    name: "Bông cải xanh",
    emoji: "🥦",
    price: 25,
    time: 35 * 60,
    yield: 40,
    exp: 6,
    water: 3,
    level: 4,
    seasons: { WINTER: true },
    description: "Bông cải xanh bổ dưỡng, ưa thời tiết mát lạnh",
  },
  cai_thao: {
    name: "Cải thảo",
    emoji: "🥬",
    price: 55,
    time: 65 * 60,
    yield: 70,
    exp: 9,
    water: 4,
    level: 7,
    seasons: { WINTER: true },
    description: "Cải thảo tươi ngon từ vùng cao nguyên, thích hợp mùa đông",
  },

  sa: {
    name: "Sả",
    emoji: "🌿",
    price: 32,
    time: 40 * 60,
    yield: 58,
    exp: 5,
    water: 3,
    level: 4,
    seasons: { SUMMER: true, AUTUMN: true },
    description: "Sả thơm dùng trong nhiều món ăn truyền thống",
  },
  gung: {
    name: "Gừng",
    emoji: "🌱",
    price: 50,
    time: 55 * 60,
    yield: 90,
    exp: 7,
    water: 2,
    level: 6,
    seasons: { AUTUMN: true, WINTER: true },
    description: "Gừng ấm nồng, đặc sản vùng đất Trà Quế, tốt vào mùa lạnh",
  },
  mia: {
    name: "Mía",
    emoji: "🎋",
    price: 60,
    time: 70 * 60,
    yield: 90,
    exp: 8,
    water: 5,
    level: 6,
    seasons: { SUMMER: true },
    description: "Mía ngọt từ đồng bằng sông Cửu Long, thích nghi mùa hè",
  },

  ca_phe: {
    name: "Cà phê",
    emoji: "☕",
    price: 150,
    time: 100 * 60,
    yield: 230,
    exp: 15,
    water: 3,
    level: 8,
    seasons: { SPRING: true, AUTUMN: true },
    description:
      "Cà phê Robusta thơm ngon từ Tây Nguyên, thu hoạch mùa xuân và thu",
  },
  tieu: {
    name: "Tiêu",
    emoji: "⚫",
    price: 180,
    time: 90 * 60,
    yield: 300,
    exp: 18,
    water: 2,
    level: 9,
    seasons: { SPRING: true, SUMMER: true },
    description: "Hạt tiêu Phú Quốc nổi tiếng thế giới, trồng vào mùa xuân-hè",
  },
  tra: {
    name: "Trà",
    emoji: "🍵",
    price: 200,
    time: 120 * 60,
    yield: 300,
    exp: 35,
    water: 4,
    level: 10,
    seasons: { SPRING: true },
    description: "Trà Shan tuyết từ vùng núi cao Tây Bắc, thu hái vào mùa xuân",
  },

  chuoi: {
    name: "Chuối",
    emoji: "🍌",
    price: 70,
    time: 75 * 60,
    yield: 130,
    exp: 12,
    water: 3,
    level: 7,
    seasons: { SUMMER: true },
    description: "Chuối tiêu thơm ngon từ miền Tây Nam Bộ, trồng mùa hè",
  },
  xoai: {
    name: "Xoài",
    emoji: "🥭",
    price: 120,
    time: 85 * 60,
    yield: 220,
    exp: 10,
    water: 3,
    level: 8,
    seasons: { SUMMER: true },
    description: "Xoài cát Hòa Lộc ngọt lịm, chỉ phát triển tốt vào mùa hè",
  },
  vai: {
    name: "Vải",
    emoji: "🔴",
    price: 160,
    time: 95 * 60,
    yield: 290,
    exp: 22,
    water: 4,
    level: 9,
    seasons: { SUMMER: true },
    description: "Vải thiều Lục Ngạn chín mọng, chỉ trưởng thành vào mùa hè",
  },
  buoi: {
    name: "Bưởi",
    emoji: "🟢",
    price: 190,
    time: 110 * 60,
    yield: 350,
    exp: 20,
    water: 4,
    level: 9,
    seasons: { AUTUMN: true },
    description: "Bưởi Năm Roi thơm ngon, ngọt lịm, trồng vào mùa thu",
  },
  dua: {
    name: "Dừa",
    emoji: "🥥",
    price: 210,
    time: 120 * 60,
    yield: 270,
    exp: 25,
    water: 2,
    level: 10,
    seasons: { ALL: true },
    description:
      "Dừa Bến Tre nổi tiếng với nước ngọt thơm mát, trồng quanh năm",
  },

  nho_do: {
    name: "Nho đỏ",
    emoji: "🍇",
    price: 250,
    time: 130 * 60,
    yield: 300,
    exp: 50,
    water: 5,
    level: 11,
    seasons: { AUTUMN: true },
    description: "Nho đỏ quý hiếm từ vùng cao Đà Lạt, chỉ trồng vào mùa thu",
  },
  sen: {
    name: "Hoa sen",
    emoji: "🪷",
    price: 300,
    time: 280 * 60,
    yield: 350,
    exp: 40,
    water: 6,
    level: 12,
    seasons: { SUMMER: true },
    description: "Hoa sen quý, biểu tượng của sự tinh khiết, nở rộ vào mùa hè",
  },
  lan: {
    name: "Lan đột biến",
    emoji: "🌸",
    price: 500,
    time: 800 * 60,
    yield: 3000,
    exp: 50,
    water: 4,
    level: 13,
    seasons: { SPRING: true },
    description: "Lan đột biến cực hiếm, giá trị cực cao, chỉ nở vào mùa xuân",
  },
  sam: {
    name: "Nhân sâm",
    emoji: "🌿",
    price: 800,
    time: 800 * 60,
    yield: 3500,
    exp: 60,
    water: 5,
    level: 14,
    seasons: { WINTER: true },
    description:
      "Nhân sâm quý hiếm nghìn năm tuổi, chỉ trồng được vào mùa đông",
  },
  truffle: {
    name: "Nấm Truffle",
    emoji: "🍄",
    price: 1200,
    time: 9000 * 60,
    yield: 3000,
    exp: 70,
    water: 4,
    level: 15,
    seasons: { AUTUMN: true, WINTER: true },
    description:
      "Nấm truffle đen - thực phẩm đắt giá nhất thế giới, mọc vào thu đông",
  },
  rau_thom: {
    name: "Rau thơm",
    emoji: "🌿",
    price: 12,
    time: 15 * 60,
    yield: 20,
    exp: 3,
    water: 2,
    level: 1,
    seasons: { ALL: true },
    description: "Các loại rau thơm như húng, quế, tía tô, kinh giới...",
  },
};

const ANIMALS = {
  ga: {
    name: "Gà",
    emoji: "🐓",
    price: 100,
    productTime: 4 * 60 * 60,
    product: "trứng",
    productEmoji: "🥚",
    productPrice: 150,
    feed: 50,
    level: 3,
    description: "Gà ta chạy bộ, cho trứng chất lượng cao",
  },
  vit: {
    name: "Vịt",
    emoji: "🦆",
    price: 150,
    productTime: 5 * 60 * 60,
    product: "trứng vịt",
    productEmoji: "🥚",
    productPrice: 200,
    feed: 70,
    level: 5,
    description: "Vịt thả đồng, đẻ trứng vịt dinh dưỡng",
  },
  heo: {
    name: "Heo",
    emoji: "🐷",
    price: 300,
    productTime: 7 * 60 * 60,
    product: "thịt",
    productEmoji: "🥩",
    productPrice: 550,
    feed: 150,
    level: 8,
    description: "Heo đặc sản nuôi thả vườn",
  },
  bo: {
    name: "Bò",
    emoji: "🐄",
    price: 500,
    productTime: 9 * 60 * 60,
    product: "sữa",
    productEmoji: "🥛",
    productPrice: 800,
    feed: 220,
    level: 10,
    description: "Bò sữa cho sữa tươi nguyên chất",
  },
  ca: {
    name: "Cá",
    emoji: "🐟",
    price: 800,
    productTime: 3 * 60 * 60,
    product: "cá tươi",
    productEmoji: "🐠",
    productPrice: 2200,
    feed: 800,
    level: 4,
    description: "Cá đồng nuôi trong ao",
  },

  de: {
    name: "Dê",
    emoji: "🐐",
    price: 800,
    productTime: 6 * 60 * 60,
    product: "sữa dê",
    productEmoji: "🥛",
    productPrice: 1000,
    feed: 30,
    level: 11,
    description: "Dê sữa cao cấp từ vùng núi Tây Bắc",
  },
  ngua: {
    name: "Ngựa",
    emoji: "🐎",
    price: 1200,
    productTime: 11 * 60 * 60,
    product: "lông ngựa",
    productEmoji: "🧶",
    productPrice: 2500,
    feed: 400,
    level: 12,
    description: "Ngựa thuần chủng quý hiếm",
  },
  huou: {
    name: "Hươu",
    emoji: "🦌",
    price: 1500,
    productTime: 13 * 60 * 60,
    product: "nhung hươu",
    productEmoji: "🦴",
    productPrice: 3800,
    feed: 450,
    level: 13,
    description: "Hươu sao quý hiếm, cho nhung chất lượng cao",
  },
  dan_dieu: {
    name: "Đà điểu",
    emoji: "🦩",
    price: 1800,
    productTime: 15 * 60 * 60,
    product: "trứng đà điểu",
    productEmoji: "🥚",
    productPrice: 4500,
    feed: 500,
    level: 14,
    description: "Đà điểu châu Phi, cho trứng siêu lớn",
  }
};

const SHOP_ITEMS = {
  phan_bon: {
    name: "Phân bón",
    emoji: "💩",
    price: 1000,
    description: "Giảm 20% thời gian trồng trọt",
    effect: "grow_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 1,
  },
  thuoc_sau: {
    name: "Thuốc sâu",
    emoji: "🧪",
    price: 3000,
    description: "Tăng 20% sản lượng thu hoạch",
    effect: "yield_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 3,
  },
  may_cay: {
    name: "Máy cày",
    emoji: "🚜",
    price: 50000,
    description: "Tự động gieo trồng vụ mới sau thu hoạch",
    effect: "auto_plant",
    duration: null,
    level: 9,
  },
  he_thong_tuoi: {
    name: "Hệ thống tưới",
    emoji: "💧",
    price: 50000,
    description: "Tự động tưới cây mỗi 4 giờ",
    effect: "auto_water",
    duration: null,
    level: 7,
  },
  chuong_trai: {
    name: "Nâng Cấp Chuồng trại",
    emoji: "🏡",
    price: 10000,
    description: "Tăng số lượng vật nuôi tối đa lên 10",
    effect: "animal_capacity",
    duration: null,
    level: 9,
  },
  chuong_trai_1: {
    name: "Chuồng trại cấp 1",
    emoji: "🏡",
    price: 20000,
    description: "Tăng số lượng vật nuôi tối đa lên 15",
    effect: "animal_capacity_1",
    duration: null,
    level: 10,
  },
  chuong_trai_2: {
    name: "Chuồng trại cấp 2",
    emoji: "🏘️",
    price: 60000,
    description: "Tăng số lượng vật nuôi tối đa lên 25 con",
    effect: "animal_capacity_2",
    duration: null,
    level: 12,
  },
  chuong_trai_3: {
    name: "Trang trại hiện đại",
    emoji: "🏰",
    price: 150000,
    description: "Tăng số lượng vật nuôi tối đa lên 40 con",
    effect: "animal_capacity_3",
    duration: null,
    level: 15,
  },
  thuc_an_gia_suc: {
    name: "Thức ăn gia súc",
    emoji: "🌾",
    price: 5000,
    description: "Tăng 30% sản lượng từ vật nuôi",
    effect: "animal_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 4,
  },
  giong_cao_cap: {
    name: "Giống cây cao cấp",
    emoji: "🌱",
    price: 1000,
    description: "Tăng 50% kinh nghiệm từ trồng trọt",
    effect: "exp_boost",
    duration: 24 * 60 * 60 * 1000,
    level: 4,
  },
};

const LEVELS = [
  { level: 1, exp: 0, title: "Nông dân tập sự", reward: 50000, plotSize: 4 },
  { level: 2, exp: 100, title: "Nông dân cần mẫn", reward: 60000, plotSize: 6 },
  { level: 3, exp: 300, title: "Trồng trọt viên", reward: 80000, plotSize: 8 },
  {
    level: 4,
    exp: 600,
    title: "Nông dân kinh nghiệm",
    reward: 100,
    plotSize: 9,
  },
  {
    level: 5,
    exp: 1200,
    title: "Người làm vườn",
    reward: 100,
    plotSize: 12,
  },
  {
    level: 6,
    exp: 3000,
    title: "Chủ trang trại nhỏ",
    reward: 150,
    plotSize: 16,
  },
  {
    level: 7,
    exp: 6000,
    title: "Nông dân chuyên nghiệp",
    reward: 200,
    plotSize: 20,
  },
  {
    level: 8,
    exp: 12000,
    title: "Chủ trang trại",
    reward: 300,
    plotSize: 25,
  },
  {
    level: 9,
    exp: 24000,
    title: "Nông gia thịnh vượng",
    reward: 4000,
    plotSize: 30,
  },
  {
    level: 10,
    exp: 60000,
    title: "Đại điền chủ",
    reward: 5000,
    plotSize: 36,
  },
  {
    level: 11,
    exp: 150000,
    title: "Nhà nông học",
    reward: 6500,
    plotSize: 42,
  },
  {
    level: 12,
    exp: 300000,
    title: "Bậc thầy canh tác",
    reward: 8000,
    plotSize: 48,
  },
  {
    level: 13,
    exp: 700000,
    title: "Tỷ phú nông nghiệp",
    reward: 10000,
    plotSize: 54,
  },
  {
    level: 14,
    exp: 1000000,
    title: "Đế chế nông sản",
    reward: 15000,
    plotSize: 60,
  },
  {
    level: 15,
    exp: 5000000,
    title: "Huyền thoại nông trại",
    reward: 20000,
    plotSize: 64,
  },
];

const WEATHER_EFFECTS = {
  sunny: {
    name: "Nắng ráo",
    emoji: "☀️",
    cropBonus: 0.1,
    waterDrain: 0.2,
    description:
      "Ngày nắng đẹp, cây trồng phát triển tốt nhưng cần nhiều nước hơn",
  },
  rainy: {
    name: "Mưa",
    emoji: "🌧️",
    cropBonus: 0.05,
    waterFill: 0.5,
    description: "Trời mưa, tự động tưới cây nhưng năng suất thấp hơn",
  },
  cloudy: {
    name: "Âm u",
    emoji: "☁️",
    description: "Trời âm u, không có điều gì đặc biệt",
  },
  storm: {
    name: "Bão",
    emoji: "🌪️",
    cropDamage: 0.2,
    description: "Bão! Cây trồng có thể bị hỏng, hãy thu hoạch sớm!",
  },
  drought: {
    name: "Hạn hán",
    emoji: "🔥",
    waterDrain: 0.4,
    description: "Hạn hán, cây mất nước nhanh chóng",
  },
};

const DAILY_MISSIONS = {
  plant: {
    name: "Trồng cây",
    emoji: "🌱",
    descriptions: [
      { target: 3, reward: 50, exp: 10, description: "Trồng 3 cây bất kỳ" },
      { target: 5, reward: 100, exp: 20, description: "Trồng 5 cây bất kỳ" },
      {
        target: 10,
        reward: 250,
        exp: 40,
        description: "Trồng 10 cây bất kỳ",
      },
    ],
    check: "plant_count",
  },

  harvest: {
    name: "Thu hoạch",
    emoji: "🌾",
    descriptions: [
      {
        target: 3,
        reward: 80,
        exp: 15,
        description: "Thu hoạch 3 cây trồng",
      },
      {
        target: 5,
        reward: 150,
        exp: 25,
        description: "Thu hoạch 5 cây trồng",
      },
      {
        target: 10,
        reward: 300,
        exp: 50,
        description: "Thu hoạch 10 cây trồng",
      },
    ],
    check: "harvest_count",
  },

  feed: {
    name: "Cho ăn",
    emoji: "🥫",
    descriptions: [
      { target: 2, reward: 80, exp: 15, description: "Cho 2 vật nuôi ăn" },
      { target: 4, reward: 160, exp: 30, description: "Cho 4 vật nuôi ăn" },
    ],
    check: "feed_count",
  },

  collect: {
    name: "Thu thập sản phẩm",
    emoji: "🥚",
    descriptions: [
      {
        target: 3,
        reward: 100,
        exp: 15,
        description: "Thu thập 3 sản phẩm từ vật nuôi",
      },
      {
        target: 5,
        reward: 200,
        exp: 30,
        description: "Thu thập 5 sản phẩm từ vật nuôi",
      },
    ],
    check: "collect_count",
  },

  sell: {
    name: "Bán sản phẩm",
    emoji: "💰",
    descriptions: [
      {
        target: 5,
        reward: 70,
        exp: 12,
        description: "Bán 5 sản phẩm bất kỳ",
      },
      {
        target: 10,
        reward: 150,
        exp: 25,
        description: "Bán 10 sản phẩm bất kỳ",
      },
    ],
    check: "sell_count",
  },

  water: {
    name: "Tưới nước",
    emoji: "💧",
    descriptions: [
      {
        target: 5,
        reward: 50,
        exp: 8,
        description: "Tưới nước cho 5 cây trồng",
      },
      {
        target: 10,
        reward: 120,
        exp: 18,
        description: "Tưới nước cho 10 cây trồng",
      },
    ],
    check: "water_count",
  },

  process: {
    name: "Chế biến",
    emoji: "👨‍🍳",
    descriptions: [
      { target: 2, reward: 120, exp: 20, description: "Chế biến 2 món ăn" },
      { target: 4, reward: 250, exp: 40, description: "Chế biến 4 món ăn" },
    ],
    check: "process_count",
  },

  visit: {
    name: "Thăm trang trại",
    emoji: "👋",
    descriptions: [
      {
        target: 1,
        reward: 50,
        exp: 10,
        description: "Thăm 1 trang trại khác",
      },
      {
        target: 2,
        reward: 150,
        exp: 25,
        description: "Thăm 2 trang trại khác",
      },
    ],
    check: "visit_count",
  },
};
const EVENTS = {
  tet: {
    name: "Tết Nguyên Đán",
    startMonth: 1,
    duration: 15,
    crops: {
      hoa_dao: {
        name: "Hoa Đào",
        emoji: "🌸",
        price: 1000,
        time: 48 * 60 * 60,
        yield: 3000,
        exp: 30,
        water: 5,
        description: "Hoa đào đỏ thắm, biểu tượng của Tết miền Bắc",
      },
      hoa_mai: {
        name: "Hoa Mai",
        emoji: "🌼",
        price: 1000,
        time: 48 * 60 * 60,
        yield: 2500,
        exp: 30,
        water: 5,
        description: "Hoa mai vàng rực rỡ, biểu tượng của Tết miền Nam",
      },
    },
  },
  trungThu: {
    name: "Tết Trung Thu",
    startMonth: 8,
    duration: 10,
    crops: {
      banhDeo: {
        name: "Bánh Dẻo",
        emoji: "🥮",
        price: 500,
        time: 24 * 60 * 60,
        yield: 1500,
        exp: 20,
        water: 0,
        description: "Bánh dẻo nhân thơm ngon truyền thống",
      },
      banhNuong: {
        name: "Bánh Nướng",
        emoji: "🥧",
        price: 600,
        time: 24 * 60 * 60,
        yield: 1800,
        exp: 25,
        water: 0,
        description: "Bánh nướng nhân thập cẩm",
      },
    },
  },
};
const PROCESSING_RECIPES = {
  banh_mi: {
    name: "Bánh mì",
    emoji: "🥖",
    ingredients: { lúa: 3 },
    yield: 1,
    value: 100,
    exp: 15,
    time: 15 * 60,
    level: 3,
    description: "Bánh mì mềm thơm từ lúa xay thành bột",
  },
  pho_mai: {
    name: "Phô mai",
    emoji: "🧀",
    ingredients: { sữa: 3 },
    yield: 1,
    value: 300,
    exp: 20,
    time: 30 * 60,
    level: 5,
    description: "Phô mai được làm từ sữa bò tươi ngon",
  },
  trung_bac: {
    name: "Trứng bác",
    emoji: "🍳",
    ingredients: { trứng: 2, "trứng vịt": 1 },
    yield: 1,
    value: 600,
    exp: 10,
    time: 10 * 60,
    level: 2,
    description: "Món trứng chiên thơm ngon bổ dưỡng",
  },
  xuc_xich: {
    name: "Xúc xích",
    emoji: "🌭",
    ingredients: { thịt: 2 },
    yield: 3,
    value: 1500,
    exp: 18,
    time: 20 * 60,
    level: 4,
    description: "Xúc xích thịt heo ngon tuyệt",
  },
  ca_kho: {
    name: "Cá kho",
    emoji: "🐟",
    ingredients: { "cá tươi": 3 },
    yield: 2,
    value: 700,
    exp: 12,
    time: 15 * 60,
    level: 2,
    description: "Cá kho tộ đậm đà hương vị Việt Nam",
  },
  salad: {
    name: "Salad",
    emoji: "🥗",
    ingredients: { "rau xanh": 3, "cà rốt": 2 },
    yield: 3,
    value: 800,
    exp: 15,
    time: 10 * 60,
    level: 3,
    description: "Salad rau củ tươi ngon bổ dưỡng",
  },
  thit_kho: {
    name: "Thịt kho",
    emoji: "🍲",
    ingredients: { thịt: 3, trứng: 2 },
    yield: 3,
    value: 2000,
    exp: 25,
    time: 30 * 60,
    level: 6,
    description: "Thịt kho tàu đậm đà, béo ngậy",
  },
  banh_ngot: {
    name: "Bánh ngọt",
    emoji: "🍰",
    ingredients: { trứng: 3, sữa: 2, lúa: 2 },
    yield: 2,
    value: 1800,
    exp: 20,
    time: 20 * 60,
    level: 7,
    description: "Bánh ngọt mềm mịn thơm ngon",
  },
};
const VIETNAM_SEASONS = {
  SPRING: { name: "Mùa xuân", months: [2, 3, 4], emoji: "🌱" },
  SUMMER: { name: "Mùa hè", months: [5, 6, 7, 8], emoji: "☀️" },
  AUTUMN: { name: "Mùa thu", months: [9, 10, 11], emoji: "🍂" },
  WINTER: { name: "Mùa đông", months: [12, 1], emoji: "❄️" },
};
function getCurrentSeason() {
  const currentMonth = new Date().getMonth() + 1;

  for (const [seasonKey, season] of Object.entries(VIETNAM_SEASONS)) {
    if (season.months.includes(currentMonth)) {
      return { key: seasonKey, ...season };
    }
  }

  return { key: "SPRING", ...VIETNAM_SEASONS.SPRING };
}

function getSeasonalEffects(cropId) {
  const currentSeason = getCurrentSeason();
  const cropConfig =
    CROPS[cropId] ||
    (checkEvent() && checkEvent().crops ? checkEvent().crops[cropId] : null);

  if (!cropConfig || !cropConfig.seasons) {
    return { growthBonus: 1, yieldBonus: 1, expBonus: 1 };
  }

  const isOptimalSeason = cropConfig.seasons[currentSeason.key];

  const isAllSeason = cropConfig.seasons.ALL;

  let growthMultiplier = 1;
  let yieldMultiplier = 1;
  let expMultiplier = 1;

  if (isOptimalSeason) {
    growthMultiplier = 1;
    yieldMultiplier = 1.1; 
    expMultiplier = 1.1;
  }
  else if (!isAllSeason) {
    growthMultiplier = 1.3; 
    yieldMultiplier = 0.5;
    expMultiplier = 0.5; 
  }

  return {
    growthBonus: growthMultiplier,
    yieldBonus: yieldMultiplier,
    expBonus: expMultiplier,
  };
}
function generateDailyMissions(userFarm) {
  if (userFarm.dailyMissions && userFarm.dailyMissions.date) {
    const lastDate = new Date(userFarm.dailyMissions.date);
    const today = new Date();

    if (lastDate.toDateString() === today.toDateString()) {
      return userFarm.dailyMissions;
    }
  }

  const missionTypes = Object.keys(DAILY_MISSIONS);
  const userLevel = calculateLevel(userFarm.exp).level;
  const today = new Date();

  let missionCount = Math.min(3 + Math.floor(userLevel / 3), 5);

  const selectedMissionTypes = [];
  while (selectedMissionTypes.length < missionCount) {
    const randomType =
      missionTypes[Math.floor(Math.random() * missionTypes.length)];
    if (!selectedMissionTypes.includes(randomType)) {
      selectedMissionTypes.push(randomType);
    }
  }

  const missions = {};
  selectedMissionTypes.forEach((type) => {
    const missionTemplate = DAILY_MISSIONS[type];

    let difficultyIndex = 0;
    if (userLevel >= 5) difficultyIndex = 1;
    if (userLevel >= 8) difficultyIndex = 2;

    difficultyIndex = Math.min(
      difficultyIndex,
      missionTemplate.descriptions.length - 1
    );

    const missionDetail = missionTemplate.descriptions[difficultyIndex];

    missions[type] = {
      name: missionTemplate.name,
      emoji: missionTemplate.emoji,
      description: missionDetail.description,
      target: missionDetail.target,
      reward: missionDetail.reward,
      exp: missionDetail.exp,
      progress: 0,
      claimed: false,
    };
  });

  return {
    date: today.getTime(),
    missions: missions,
    refreshed: today.getTime(),
  };
}

function updateMissionProgress(userFarm, missionType, amount = 1) {
  if (!userFarm.dailyMissions || !userFarm.dailyMissions.missions) {
    userFarm.dailyMissions = generateDailyMissions(userFarm);
  }

  if (userFarm.dailyMissions.missions[missionType]) {
    const mission = userFarm.dailyMissions.missions[missionType];
    if (!mission.claimed) {
      mission.progress = Math.min(mission.progress + amount, mission.target);
    }
    return true;
  }

  return false;
}

function claimMissionReward(userFarm, missionType) {
  if (
    !userFarm.dailyMissions ||
    !userFarm.dailyMissions.missions ||
    !userFarm.dailyMissions.missions[missionType]
  ) {
    return false;
  }

  const mission = userFarm.dailyMissions.missions[missionType];

  if (mission.progress >= mission.target && !mission.claimed) {
    mission.claimed = true;
    return {
      reward: mission.reward,
      exp: mission.exp,
    };
  }

  return false;
}
function isUserVIP(userId) {
  try {
    const vipBenefits = getVIPBenefits(userId);
    return vipBenefits && vipBenefits.level && vipBenefits.level > 0;
  } catch (error) {
    console.error("Error checking VIP status:", error);
    return false;
  }
}
function checkMissionsStatus(userFarm) {
  if (!userFarm.dailyMissions || !userFarm.dailyMissions.missions) {
    return {
      completed: 0,
      total: 0,
      unclaimed: 0,
    };
  }

  let completed = 0;
  let total = 0;
  let unclaimed = 0;

  Object.values(userFarm.dailyMissions.missions).forEach((mission) => {
    total++;
    if (mission.progress >= mission.target) {
      completed++;
      if (!mission.claimed) unclaimed++;
    }
  });

  return { completed, total, unclaimed };
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculateLevel(exp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].exp) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}
function getCurrentWeather(userID) {
  if (!userID) {
    console.error("userID is undefined in getCurrentWeather");
    return WEATHER_EFFECTS.sunny;
  }

  try {
    const farmData = loadFarmData();
    if (!farmData || !farmData.farms) {
      console.error("Invalid farm data in getCurrentWeather");
      return WEATHER_EFFECTS.sunny;
    }

    const userFarm = farmData.farms[userID] || createUserFarm(userID);
    const currentTime = Date.now();

    const isWeatherValid =
      userFarm.weather &&
      userFarm.weather.type &&
      userFarm.weather.nextChange &&
      currentTime < userFarm.weather.nextChange;

      if (!isWeatherValid) {
      const weatherTypes = Object.keys(WEATHER_EFFECTS);
      const date = new Date();
      const month = date.getMonth() + 1;
      const hour = date.getHours();
      const timeOfDay =
        hour >= 5 && hour < 10
          ? "morning"
          : hour >= 10 && hour < 16
          ? "noon"
          : hour >= 16 && hour < 19
          ? "evening"
          : "night";

      let weatherChances = [0.4, 0.3, 0.2, 0.05, 0.05];

      if (month >= 5 && month <= 8) {
        if (timeOfDay === "morning") {
          weatherChances = [0.6, 0.1, 0.2, 0.05, 0.05];
        } else if (timeOfDay === "noon") {
          weatherChances = [0.7, 0.05, 0.05, 0.1, 0.1];
        } else if (timeOfDay === "evening") {
          weatherChances = [0.3, 0.3, 0.3, 0.1, 0];
        } else {
          weatherChances = [0.1, 0.2, 0.7, 0, 0];
        }
      } else if (month >= 9 && month <= 11) {
        if (timeOfDay === "morning") {
          weatherChances = [0.4, 0.2, 0.4, 0, 0];
        } else if (timeOfDay === "noon") {
          weatherChances = [0.5, 0.2, 0.2, 0.05, 0.05];
        } else if (timeOfDay === "evening") {
          weatherChances = [0.2, 0.3, 0.4, 0.1, 0];
        } else {
          weatherChances = [0.1, 0.2, 0.7, 0, 0];
        }
      } else if (month === 12 || month <= 2) {
        if (timeOfDay === "morning") {
          weatherChances = [0.3, 0.1, 0.6, 0, 0];
        } else if (timeOfDay === "noon") {
          weatherChances = [0.4, 0.2, 0.4, 0, 0];
        } else if (timeOfDay === "evening") {
          weatherChances = [0.1, 0.4, 0.5, 0, 0];
        } else {
          weatherChances = [0, 0.3, 0.7, 0, 0];
        }
      } else {
        if (timeOfDay === "morning") {
          weatherChances = [0.4, 0.3, 0.3, 0, 0];
        } else if (timeOfDay === "noon") {
          weatherChances = [0.5, 0.2, 0.2, 0.1, 0];
        } else if (timeOfDay === "evening") {
          weatherChances = [0.3, 0.4, 0.3, 0, 0];
        } else {
          weatherChances = [0.1, 0.3, 0.6, 0, 0];
        }
      }

      if (timeOfDay === "evening") {
        weatherChances[1] = Math.min(weatherChances[1] + 0.1, 1.0);
      }

      if (timeOfDay === "night") {
        weatherChances[2] = Math.min(weatherChances[2] + 0.2, 1.0);
      }

      if (!weatherChances || !Array.isArray(weatherChances)) {
        console.error("weatherChances is undefined or not an array");
        weatherChances = [0.4, 0.3, 0.2, 0.05, 0.05];
      }
      const total = safeReduce(
        weatherChances,
        (sum, chance) => sum + chance,
        0
      );
      if (total !== 1) {
        weatherChances = weatherChances.map((chance) => chance / total);
      }

      let random = Math.random();
      let weatherIndex = 0;
      let sum = 0;

      for (let i = 0; i < weatherChances.length; i++) {
        sum += weatherChances[i];
        if (random < sum) {
          weatherIndex = i;
          break;
        }
      }
      const currentHour = new Date().getHours();
      const realTimeOfDay =
        currentHour >= 5 && currentHour < 10
          ? "morning"
          : currentHour >= 10 && currentHour < 16
          ? "noon"
          : currentHour >= 16 && currentHour < 19
          ? "evening"
          : "night";

      userFarm.weather.timeOfDay = realTimeOfDay;
      userFarm.weather.lastCheckedTime = Date.now();

      const weatherChangeTime = 3 * 60 * 60 * 1000;
      const nextChangeTime = currentTime + weatherChangeTime;

      userFarm.weather = {
        type: weatherTypes[weatherIndex],
        nextChange: nextChangeTime,
        timeOfDay: timeOfDay,
        lastUpdated: currentTime,
        month: month,
      };

      saveFarmData(farmData);
    }

    return WEATHER_EFFECTS[userFarm.weather.type] || WEATHER_EFFECTS.sunny;
  } catch (error) {
    console.error("Error in getCurrentWeather:", error);
    return WEATHER_EFFECTS.sunny;
  }
}

function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getWeatherDescription(weather, timeOfDay) {
  let desc = weather.description;

  if (!timeOfDay) {
    const now = new Date();
    const hour = now.getHours();
    timeOfDay =
      hour >= 5 && hour < 10
        ? "morning"
        : hour >= 10 && hour < 16
        ? "noon"
        : hour >= 16 && hour < 19
        ? "evening"
        : "night";
  }

  const timeEmoji = {
    morning: "🌅",
    noon: "☀️",
    evening: "🌆",
    night: "🌃",
  };

  const timeDescription = {
    morning: "Bình minh đang lên, không khí trong lành",
    noon: "Mặt trời đang cao trên đầu, thời tiết nắng nóng",
    evening: "Hoàng hôn dần buông, ánh nắng nhẹ nhàng",
    night: "Trời tối đen, ánh trăng và sao phủ khắp bầu trời",
  };

  const weatherTimeDesc = {
    sunny: {
      morning: "Ánh nắng sớm mai rực rỡ trên đồng ruộng",
      noon: "Mặt trời chói chang, nắng gay gắt trên trang trại",
      evening: "Hoàng hôn rực rỡ, ánh nắng vàng đẹp mắt",
      night: "Bầu trời đêm trong xanh, đầy sao",
    },
    rainy: {
      morning: "Cơn mưa buổi sớm tưới đẫm ruộng đồng",
      noon: "Mưa rào giữa ngày, làm mát trang trại",
      evening: "Mưa chiều nhẹ hạt, tạo không khí dễ chịu",
      night: "Mưa đêm rả rích, âm thanh dịu dàng",
    },
    cloudy: {
      morning: "Buổi sáng âm u, mây che phủ mặt trời",
      noon: "Trời nhiều mây, thỉnh thoảng có nắng yếu",
      evening: "Hoàng hôn âm u, mây che phủ trời chiều",
      night: "Đêm tối và nhiều mây, không nhìn thấy sao",
    },
    storm: {
      morning: "Sấm sét vang động từ sáng sớm",
      noon: "Bão giữa ngày với gió mạnh và mưa to",
      evening: "Bão chiều tối làm rung chuyển cây cối",
      night: "Cơn bão đêm dữ dội, sấm chớp liên hồi",
    },
    drought: {
      morning: "Sương sớm hiếm hoi trong đợt hạn hán",
      noon: "Nắng hạn gay gắt, đất nứt nẻ",
      evening: "Hoàng hôn khô hanh, không khí nóng bức",
      night: "Đêm nóng oi bức, điểm xuyết bởi ánh lửa đỏ",
    },
  };

  let detailedDesc =
    weatherTimeDesc[weather.type]?.[timeOfDay] ||
    `${weather.description} (${timeDescription[timeOfDay]})`;

  return `${timeEmoji[timeOfDay]} ${detailedDesc}`;
}
function getVIPBenefitsMessage(userId) {
  try {
    const vipBenefits = getVIPBenefits(userId);

    if (!vipBenefits || !vipBenefits.level) {
      return null;
    }

    let message = `👑 ĐẶC QUYỀN VIP ${vipBenefits.level || ""}\n`;
    message += `┏━━━━━━━━━━━━━━━━┓\n`;

    const cooldownBonus = Math.floor(vipBenefits.cooldownReduction * 0.7);
    const workBonus = Math.floor(vipBenefits.workBonus * 0.7);
    const expBonus = vipBenefits.fishExpMultiplier
      ? Math.floor(((vipBenefits.fishExpMultiplier - 1) * 100 * 0.7) / 2)
      : 0;
    const animalBonus = vipBenefits.rareBonus
      ? Math.floor(vipBenefits.rareBonus * 100 * 0.8)
      : 0;

    if (cooldownBonus > 0) {
      message += `┣➤ ⏱️ Giảm thời gian trồng: -${cooldownBonus}%\n`;
    }

    if (workBonus > 0) {
      message += `┣➤ 💰 Tăng sản lượng: +${workBonus}%\n`;
    }

    if (expBonus > 0) {
      message += `┣➤ 📊 Tăng kinh nghiệm: +${expBonus}%\n`;
    }

    if (animalBonus > 0) {
      message += `┣➤ 🐄 Tăng sản lượng vật nuôi: +${animalBonus}%\n`;
    }

    message += `┗━━━━━━━━━━━━━━━━┛\n`;

    return message;
  } catch (error) {
    console.error("Error getting VIP benefits message:", error);
    return null;
  }
}
function findCropId(cropInput) {
  const cropNameToId = {};

  Object.entries(CROPS).forEach(([id, crop]) => {
    cropNameToId[id] = id;
    cropNameToId[crop.name.toLowerCase()] = id;

    const nameWithoutDiacritics = crop.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    cropNameToId[nameWithoutDiacritics] = id;
  });

  const currentEvent = checkEvent();
  if (currentEvent && currentEvent.crops) {
    Object.entries(currentEvent.crops).forEach(([id, crop]) => {
      cropNameToId[id] = id;
      cropNameToId[crop.name.toLowerCase()] = id;

      const nameWithoutDiacritics = crop.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      cropNameToId[nameWithoutDiacritics] = id;
    });
  }

  if (cropNameToId[cropInput]) {
    return cropNameToId[cropInput];
  }

  let bestMatch = null;
  let bestSimilarity = 0;

  Object.entries(cropNameToId).forEach(([name, id]) => {
    if (name.includes(cropInput) || cropInput.includes(name)) {
      const similarity =
        Math.min(name.length, cropInput.length) /
        Math.max(name.length, cropInput.length);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = id;
      }
    }
  });

  return bestMatch && bestSimilarity > 0.5 ? bestMatch : null;
}
async function plantCropsInRange(userFarm, cropId, cropConfig, rangeParam, senderID) {
  // Parse range like "1-5" to get start and end plot indices
  const [startStr, endStr] = rangeParam.split('-');
  const start = parseInt(startStr) - 1; // Convert to 0-based index
  const end = parseInt(endStr) - 1;
  
  if (isNaN(start) || isNaN(end) || start < 0 || end < start || end >= userFarm.plots.length) {
    return {
      success: false,
      message: `❌ Phạm vi ô đất không hợp lệ!\n💡 Định dạng đúng: 1-5 (từ ô 1 đến ô 5)`
    };
  }
  
  const plotsToPlant = [];
  for (let i = start; i <= end; i++) {
    const plot = userFarm.plots[i];
    if (plot.status === "empty" || plot.status === "damaged") {
      plotsToPlant.push(plot);
    }
  }
  
  if (plotsToPlant.length === 0) {
    return {
      success: false,
      message: `❌ Không có ô đất trống nào trong phạm vi từ ${start + 1} đến ${end + 1}!`
    };
  }
  
  const totalCost = cropConfig.price * plotsToPlant.length;
  const balance = await getBalance(senderID);
  
  if (balance < totalCost) {
    return {
      success: false,
      message: `❌ Không đủ tiền để trồng ${plotsToPlant.length} ô ${cropConfig.name}!\n💰 Chi phí: ${formatNumber(totalCost)} $\n💵 Số dư: ${formatNumber(balance)} $`
    };
  }
  
  const currentSeason = getCurrentSeason();
  let seasonalWarning = "";
  
  if (cropConfig.seasons) {
    const isOptimalSeason = cropConfig.seasons[currentSeason.key];
    const isAllSeason = cropConfig.seasons.ALL;
    
    if (!isOptimalSeason && !isAllSeason) {
      seasonalWarning = `\n⚠️ CẢNH BÁO MÙA VỤ: ${cropConfig.name} không phù hợp với ${currentSeason.name}!\n`;
      seasonalWarning += `→ Sản lượng sẽ giảm 30%, cây phát triển chậm hơn 30%\n`;
      seasonalWarning += `→ Kinh nghiệm nhận được giảm 50%\n`;
    } else if (isOptimalSeason) {
      seasonalWarning = `\n🌟 ${cropConfig.name} rất phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ +20% sản lượng, phát triển nhanh hơn 10%\n`;
      seasonalWarning += `→ +10% kinh nghiệm khi thu hoạch\n`;
    }
  }
  
  await updateBalance(senderID, -totalCost);
  
  for (const plot of plotsToPlant) {
    plot.status = "growing";
    plot.crop = cropId;
    plot.plantedAt = Date.now();
    plot.water = cropConfig.water > 0 ? 1 : 0;
    plot.lastWatered = Date.now();
  }
  
  return {
    success: true,
    plantCount: plotsToPlant.length,
    message: `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${plotsToPlant.length} ô từ ${start + 1} đến ${end + 1}!\n💰 Chi phí: -${formatNumber(totalCost)} $\n⏱️ Thu hoạch sau: ${getHarvestTime(cropConfig.time)}${seasonalWarning}`,
    cost: totalCost
  };
}

async function plantCropsInList(userFarm, cropId, cropConfig, listParam, senderID) {
  
  const plotIndices = listParam.split(',').map(num => parseInt(num.trim()) - 1);
  
  if (plotIndices.some(idx => isNaN(idx) || idx < 0 || idx >= userFarm.plots.length)) {
    return {
      success: false,
      message: `❌ Danh sách ô đất không hợp lệ!\n💡 Định dạng đúng: 1,3,5 (các ô 1, 3 và 5)`
    };
  }
  
  const plotsToPlant = [];
  const invalidPlots = [];
  
  plotIndices.forEach(idx => {
    const plot = userFarm.plots[idx];
    if (plot.status === "empty" || plot.status === "damaged") {
      plotsToPlant.push(plot);
    } else {
      invalidPlots.push(idx + 1);
    }
  });
  
  if (plotsToPlant.length === 0) {
    return {
      success: false,
      message: `❌ Không có ô đất trống nào trong danh sách đã chọn!`
    };
  }
  
  const totalCost = cropConfig.price * plotsToPlant.length;
  const balance = await getBalance(senderID);
  
  if (balance < totalCost) {
    return {
      success: false,
      message: `❌ Không đủ tiền để trồng ${plotsToPlant.length} ô ${cropConfig.name}!\n💰 Chi phí: ${formatNumber(totalCost)} $\n💵 Số dư: ${formatNumber(balance)} $`
    };
  }
  
  const currentSeason = getCurrentSeason();
  let seasonalWarning = "";
  
  if (cropConfig.seasons) {
    const isOptimalSeason = cropConfig.seasons[currentSeason.key];
    const isAllSeason = cropConfig.seasons.ALL;
    
    if (!isOptimalSeason && !isAllSeason) {
      seasonalWarning = `\n⚠️ CẢNH BÁO MÙA VỤ: ${cropConfig.name} không phù hợp với ${currentSeason.name}!\n`;
      seasonalWarning += `→ Sản lượng sẽ giảm 30%, cây phát triển chậm hơn 30%\n`;
      seasonalWarning += `→ Kinh nghiệm nhận được giảm 50%\n`;
    } else if (isOptimalSeason) {
      seasonalWarning = `\n🌟 ${cropConfig.name} rất phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ +20% sản lượng, phát triển nhanh hơn 10%\n`;
      seasonalWarning += `→ +10% kinh nghiệm khi thu hoạch\n`;
    }
  }
  
  await updateBalance(senderID, -totalCost);
  
  for (const plot of plotsToPlant) {
    plot.status = "growing";
    plot.crop = cropId;
    plot.plantedAt = Date.now();
    plot.water = cropConfig.water > 0 ? 1 : 0;
    plot.lastWatered = Date.now();
  }
  
  let warningMsg = "";
  if (invalidPlots.length > 0) {
    warningMsg = `\n⚠️ Các ô ${invalidPlots.join(", ")} đã có cây trồng hoặc không hợp lệ`;
  }
  
  return {
    success: true,
    plantCount: plotsToPlant.length,
    message: `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${plotsToPlant.length} ô đất!\n💰 Chi phí: -${formatNumber(totalCost)} $\n⏱️ Thu hoạch sau: ${getHarvestTime(cropConfig.time)}${seasonalWarning}${warningMsg}`,
    cost: totalCost
  };
}

async function plantAllEmptyPlots(userFarm, cropId, cropConfig, senderID) {
  const emptyPlots = userFarm.plots.filter(
    (plot) => plot.status === "empty" || plot.status === "damaged"
  );

  if (emptyPlots.length === 0) {
    return {
      success: false,
      message: `❌ Không có ô đất trống để trồng!\n💡 Thu hoạch hoặc mở khóa thêm ô đất.`,
    };
  }

  const totalCost = cropConfig.price * emptyPlots.length;
  const balance = await getBalance(senderID);

  if (balance < totalCost) {
    return {
      success: false,
      message: `❌ Không đủ tiền để trồng ${emptyPlots.length} ô ${
        cropConfig.name
      }!\n💰 Chi phí: ${formatNumber(totalCost)} $\n💵 Số dư: ${formatNumber(
        balance
      )} $`,
    };
  }
  const currentSeason = getCurrentSeason();
  let seasonalWarning = "";

  if (cropConfig.seasons) {
    const isOptimalSeason = cropConfig.seasons[currentSeason.key];
    const isAllSeason = cropConfig.seasons.ALL;

    if (!isOptimalSeason && !isAllSeason) {
      seasonalWarning = `\n⚠️ CẢNH BÁO MÙA VỤ: ${cropConfig.name} không phù hợp với ${currentSeason.name}!\n`;
      seasonalWarning += `→ Sản lượng sẽ giảm 30%, cây phát triển chậm hơn 30%`;
      seasonalWarning += `→ Kinh nghiệm nhận được giảm 50%\n`;
    } else if (isOptimalSeason) {
      seasonalWarning = `\n🌟 ${cropConfig.name} rất phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ +20% sản lượng, phát triển nhanh hơn 10%`;
      seasonalWarning += `→ +10% kinh nghiệm khi thu hoạch\n`;
    }
  }
  await updateBalance(senderID, -totalCost);

  for (const plot of emptyPlots) {
    plot.status = "growing";
    plot.crop = cropId;
    plot.plantedAt = Date.now();
    plot.water = cropConfig.water > 0 ? 1 : 0;
    plot.lastWatered = Date.now();
  }

  return {
    success: true,
    plantCount: emptyPlots.length,
    message: `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} vào ${
      emptyPlots.length
    } ô đất trống!\n💰 Chi phí: -${formatNumber(
      totalCost
    )} $\n⏱️ Thu hoạch sau: ${getHarvestTime(
      cropConfig.time
    )}${seasonalWarning}`,
    cost: totalCost,
  };
}

function safeReduce(arr, callback, initialValue) {
  if (!arr || !Array.isArray(arr)) {
    console.error("Attempted to reduce on non-array:", arr);
    return initialValue;
  }
  return arr.reduce(callback, initialValue);
}

function checkEvent() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (const [eventId, event] of Object.entries(EVENTS)) {
    if (month === event.startMonth && day <= event.duration) {
      return {
        id: eventId,
        ...event,
      };
    }

    if (eventId === "tet" && month === event.startMonth + 1 && day <= 15) {
      return {
        id: eventId,
        ...event,
      };
    }
  }

  return null;
}

function loadFarmData() {
  try {
    if (!fs.existsSync(farmDataPath)) {
      const defaultData = {
        farms: {},
        lastUpdate: Date.now(),
      };
      fs.writeFileSync(farmDataPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = JSON.parse(fs.readFileSync(farmDataPath, "utf8"));

    if (!data.farms) {
      data.farms = {};
    }

    return data;
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu farm:", error);
    return { farms: {}, lastUpdate: Date.now() };
  }
}

function getCropListMessage(userFarm, page = 1, pageSize = 5) {
  const currentLevel = calculateLevel(userFarm.exp).level;
  const vipMessage = getVIPBenefitsMessage(userFarm.id);

  const availableCrops = Object.entries(CROPS)
    .filter(([_, crop]) => crop.level <= currentLevel)
    .sort((a, b) => a[1].level - b[1].level);

  const lockedCrops = Object.entries(CROPS).filter(
    ([_, crop]) => crop.level > currentLevel
  );

  const totalPages = Math.ceil(availableCrops.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const pageCrops = availableCrops.slice(startIdx, startIdx + pageSize);

  let message = `📋 DANH SÁCH CÂY TRỒNG (${page}/${totalPages})\n`;

  if (vipMessage) {
    message += `${vipMessage}\n`;
  }

  const currentEvent = checkEvent();
  if (currentEvent && currentEvent.crops) {
    message += `\n🎉 CÂY TRỒNG SỰ KIỆN ${currentEvent.name}:\n`;
    Object.entries(currentEvent.crops).forEach(([id, crop]) => {
      message += `→ ${crop.emoji} ${crop.name}: ${formatNumber(
        crop.price
      )} $ | Thu: ${formatNumber(crop.yield)} $\n`;
    });
    message += "\n";
  }

  message += "📊 CÂY TRỒNG THƯỜNG:\n";

  pageCrops.forEach(([id, crop]) => {
    message += `→ ${crop.emoji} ${crop.name}: ${formatNumber(
      crop.price
    )} $ | Thu: ${formatNumber(crop.yield)} $\n`;
  });

  if (lockedCrops.length > 0) {
    message += `\n🔒 Còn ${lockedCrops.length} loại cây khóa (cần nâng cấp)\n`;
  }

  message += `\n💡 Xem trang khác: .farm trồng <số_trang>`;
  message += `\n💡 Trồng cây: .farm trồng <tên_cây> <số_ô>`;

  return message;
}
function saveFarmData(data) {
  try {
    fs.writeFileSync(farmDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu farm:", error);
  }
}
function createPaginatedList(items, currentLevel, page = 1, itemsPerPage = 5) {
  const availableItems = items.filter((item) => item.level <= currentLevel);
  const lockedItems = items.filter((item) => item.level > currentLevel);

  const totalPages = Math.ceil(availableItems.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const displayItems = availableItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return {
    items: displayItems,
    lockedCount: lockedItems.length,
    currentPage: page,
    totalPages,
  };
}
function createUserFarm(userID) {
  const farmData = loadFarmData();
  if (!farmData.farms[userID]) {
    farmData.farms[userID] = {
      id: userID,
      exp: 0,
      plots: [],
      inventory: {},
      animals: {},
      items: {},
      lastActive: Date.now(),
      createdAt: Date.now(),
      autoHarvest: false,
      weather: {
        type: "sunny",
        nextChange: Date.now() + 6 * 60 * 60 * 1000,
      },
    };

    for (let i = 0; i < 4; i++) {
      farmData.farms[userID].plots.push({
        id: i,
        status: "empty",
        crop: null,
        plantedAt: null,
        water: 0,
        lastWatered: null,
      });
    }

    saveFarmData(farmData);
  }

  return farmData.farms[userID];
}

function applyItemEffects(userFarm) {
  if (!userFarm) {
    console.error("userFarm is undefined in applyItemEffects");
    return {
      growBoost: 1,
      yieldBoost: 1,
      expBoost: 1,
      animalBoost: 1,
      autoPlant: false,
      autoWater: false,
      animalCapacity: 5,
    };
  }

  const effects = {
    growBoost: 1,
    yieldBoost: 1,
    expBoost: 1,
    animalBoost: 1,
    autoPlant: false,
    autoWater: false,
    animalCapacity: 5,
  };

  if (!userFarm.items) return effects;

  for (const [itemId, item] of Object.entries(userFarm.items || {})) {
    if (!item || !item.active || (item.expiry && Date.now() > item.expiry)) {
      continue;
    }

    switch (item.effect) {
      case "grow_boost":
        effects.growBoost = 0.8;
        break;
      case "yield_boost":
        effects.yieldBoost = 1.2;
        break;
      case "exp_boost":
        effects.expBoost = 1.5;
        break;
      case "animal_boost":
        effects.animalBoost = 1.3;
        break;
      case "auto_plant":
        effects.autoPlant = true;
        break;
      case "auto_water":
        effects.autoWater = true;
        break;
      case "animal_capacity_1":
        effects.animalCapacity = 15;
        break;
      case "animal_capacity_2":
        effects.animalCapacity = 25;
        break;
      case "animal_capacity_3":
        effects.animalCapacity = 40;
        break;
      case "animal_capacity":
        effects.animalCapacity = 10;
        break;
    }
  }

  try {
    const weather = getCurrentWeather(userFarm.id);
    if (weather && weather.cropBonus) {
      effects.yieldBoost *= 1 + weather.cropBonus;
    }

    if (userFarm.id) {
      const vipBenefits = getVIPBenefits(userFarm.id);
      const isVip = vipBenefits && vipBenefits.level && vipBenefits.level > 0;

      if (isVip) {
        if (vipBenefits.cooldownReduction > 0) {
          effects.growBoost *= 1 - (vipBenefits.cooldownReduction * 0.7) / 100;
        }

        if (vipBenefits.workBonus > 0) {
          effects.yieldBoost *= 1 + (vipBenefits.workBonus * 0.7) / 100;
        }

        if (vipBenefits.fishExpMultiplier > 1) {
          const multiplier = 1 + (vipBenefits.fishExpMultiplier - 1) * 0.5;
          effects.expBoost *= multiplier;
        }

        if (vipBenefits.rareBonus > 0) {
          effects.animalBoost *= 1 + vipBenefits.rareBonus * 0.75;
        }
      }
    }
  } catch (err) {
    console.error("Error applying weather/VIP effects:", err);
  }

  return effects;
}

function updateFarms() {
  try {
    const farmData = loadFarmData();
    const currentTime = Date.now();

    for (const [userID, userFarm] of Object.entries(farmData.farms)) {
      if (!userFarm || !userFarm.plots) continue;

      if (!userFarm.dailyMissions || !userFarm.dailyMissions.date) {
        userFarm.dailyMissions = generateDailyMissions(userFarm);
      } else {
        const lastDate = new Date(userFarm.dailyMissions.date);
        const today = new Date();

        if (lastDate.toDateString() !== today.toDateString()) {
          userFarm.dailyMissions = generateDailyMissions(userFarm);
        }
      }

      userFarm.id = userID;
      const effects = applyItemEffects(userFarm);

      if (!userFarm.weather || currentTime > userFarm.weather.nextChange) {
        const weather = getCurrentWeather(userID);
        if (weather) {
          userFarm.weather = {
            type: weather.type,
            nextChange: currentTime + 6 * 60 * 60 * 1000,
            timeOfDay: userFarm.weather?.timeOfDay || "morning",
            lastUpdated: currentTime,
          };
        }
      }

      if (effects.autoWater && currentTime % (4 * 60 * 60 * 1000) < 60000) {
        userFarm.plots.forEach((plot) => {
          if (plot.status === "growing" && plot.crop) {
            const cropConfig =
              CROPS[plot.crop] ||
              (checkEvent() && checkEvent().crops
                ? checkEvent().crops[plot.crop]
                : null);

            if (cropConfig && cropConfig.water > 0) {
              plot.water = cropConfig.water;
              plot.lastWatered = currentTime;
              plot.lastAutoWater = currentTime;
            }
          }
        });
      }

      if (userFarm.animals) {
        Object.entries(userFarm.animals).forEach(([animalId, animal]) => {
          if (!animal) return;

          if (animal.lastProduced && animal.fed) {
            const animalType = animal.type;
            if (!animalType || !ANIMALS[animalType]) return;

            const animalConfig = ANIMALS[animalType];
            let productionTime = animalConfig.productTime * 1000;

            const vipBenefits = getVIPBenefits(userID);
            if (vipBenefits && vipBenefits.cooldownReduction > 0) {
              productionTime *= 1 - vipBenefits.cooldownReduction / 100;
            }

            if (currentTime - animal.lastProduced >= productionTime) {
              if (!userFarm.inventory) userFarm.inventory = {};
              if (!userFarm.inventory[animalConfig.product]) {
                userFarm.inventory[animalConfig.product] = 0;
              }

              userFarm.inventory[animalConfig.product]++;
              animal.lastProduced = currentTime;
              animal.fed = false;
              animal.productReady = true;
            }
          }
        });
      }

      userFarm.plots.forEach((plot) => {
        if (plot.status === "growing" && plot.crop) {
          const cropId = plot.crop;
          const cropConfig =
            CROPS[cropId] ||
            (checkEvent() && checkEvent().crops
              ? checkEvent().crops[cropId]
              : null);

          if (cropConfig) {
            let seasonalEffects;
            try {
              seasonalEffects = cropId
                ? getSeasonalEffects(cropId)
                : { growthBonus: 1, yieldBonus: 1, expBonus: 1 };
            } catch (err) {
              console.error("Error getting seasonal effects:", err);
              seasonalEffects = { growthBonus: 1, yieldBonus: 1, expBonus: 1 };
            }

            const growTime =
              cropConfig.time *
              1000 *
              effects.growBoost *
              seasonalEffects.growthBonus;

            if (currentTime - (plot.plantedAt || 0) >= growTime) {
              if (plot.water > 0) {
                plot.status = "ready";
                plot.readyAt = currentTime;
              } else {
                plot.plantedAt += 30 * 60 * 1000;
              }
            }

            const weather = getCurrentWeather(userID);
            if (weather && weather.waterDrain && plot.water > 0) {
              const timeSinceLastUpdate =
                currentTime - (farmData.lastUpdate || currentTime);
              const waterDrainRate =
                (weather.waterDrain * timeSinceLastUpdate) / (1000 * 60 * 60);
              plot.water =
                Math.round(Math.max(0, plot.water - waterDrainRate) * 10) / 10;
            }

            if (weather && weather.waterFill) {
              const timeSinceLastUpdate =
                currentTime - (farmData.lastUpdate || currentTime);
              const waterFillRate =
                (weather.waterFill * timeSinceLastUpdate) / (1000 * 60 * 60);
              plot.water =
                Math.round(
                  Math.min(cropConfig.water, plot.water + waterFillRate) * 10
                ) / 10;
            }

            if (
              weather &&
              weather.type === "storm" &&
              weather.cropDamage &&
              Math.random() < weather.cropDamage
            ) {
              plot.status = "damaged";
            }
          }
        } else if (plot.status === "ready" && plot.readyAt) {
          const cropExpiryTime = 2 * 60 * 60 * 1000;
          if (currentTime - plot.readyAt >= cropExpiryTime) {
            const cropId = plot.crop;
            const cropConfig =
              CROPS[cropId] ||
              (checkEvent() && checkEvent().crops
                ? checkEvent().crops[cropId]
                : null);

            plot.status = "damaged";

            if (!userFarm.notifications) userFarm.notifications = [];
            userFarm.notifications.push({
              type: "crop_damaged",
              cropId: plot.crop,
              cropName: cropConfig ? cropConfig.name : "Cây trồng",
              plotIndex: userFarm.plots.indexOf(plot),
              time: currentTime,
            });

            if (userFarm.notifications.length > 10) {
              userFarm.notifications = userFarm.notifications.slice(-10);
            }
          }
        }
      });

      if (userFarm.processing) {
        for (const [recipeId, process] of Object.entries(userFarm.processing)) {
          if (!PROCESSING_RECIPES[recipeId]) {
            delete userFarm.processing[recipeId];
          }
        }
      }
    }

    farmData.lastUpdate = currentTime;
    saveFarmData(farmData);
  } catch (error) {
    console.error("Error in updateFarms:", error);
  }
}
async function plantMultipleCrops(
  userFarm,
  cropId,
  cropConfig,
  amount,
  senderID
) {
  const emptyPlots = userFarm.plots.filter(
    (plot) => plot.status === "empty" || plot.status === "damaged"
  );

  if (emptyPlots.length === 0) {
    return {
      success: false,
      message: `❌ Không có ô đất trống để trồng cây!`,
    };
  }

  const plantCount = Math.min(amount, emptyPlots.length);
  const totalCost = cropConfig.price * plantCount;
  const balance = await getBalance(senderID);

  if (balance < totalCost) {
    return {
      success: false,
      message: `❌ Không đủ tiền để trồng ${plantCount} cây ${
        cropConfig.name
      }!\n💰 Chi phí: ${formatNumber(totalCost)} $\n💵 Số dư: ${formatNumber(
        balance
      )} $`,
    };
  }

  const currentSeason = getCurrentSeason();
  let seasonalWarning = "";

  if (cropConfig.seasons) {
    const isOptimalSeason = cropConfig.seasons[currentSeason.key];
    const isAllSeason = cropConfig.seasons.ALL;

    if (!isOptimalSeason && !isAllSeason) {
      const effects = getSeasonalEffects(cropId);

      seasonalWarning = `\n⚠️ CẢNH BÁO MÙA VỤ: ${cropConfig.name} không phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ Sản lượng sẽ giảm 20%, cây phát triển chậm hơn 20%\n`;

      const bestSeasons = [];
      Object.entries(cropConfig.seasons).forEach(([season, value]) => {
        if (value && season !== "ALL") {
          bestSeasons.push(VIETNAM_SEASONS[season].name);
        }
      });

      if (bestSeasons.length > 0) {
        seasonalWarning += `→ Cây này lý tưởng để trồng vào: ${bestSeasons.join(
          ", "
        )}\n`;
      }
    } else if (isOptimalSeason) {
      seasonalWarning = `\n🌟 ${cropConfig.name} rất phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ +30% sản lượng, phát triển nhanh hơn 20%\n`;
    } else if (isAllSeason) {
      seasonalWarning = `\n📆 ${cropConfig.name} có thể trồng quanh năm với hiệu quả ổn định\n`;
    }
  }

  await updateBalance(senderID, -totalCost);

  for (let i = 0; i < plantCount; i++) {
    const plot = emptyPlots[i];
    plot.status = "growing";
    plot.crop = cropId;
    plot.plantedAt = Date.now();
    plot.water = cropConfig.water > 0 ? 1 : 0;
    plot.lastWatered = Date.now();
  }

  return {
    success: true,
    plantCount: plantCount,
    message: `✅ Đã trồng ${cropConfig.emoji} ${
      cropConfig.name
    } vào ${plantCount} ô đất trống đầu tiên!\n💰 Chi phí: -${formatNumber(
      totalCost
    )} $\n⏱️ Thu hoạch sau: ${getHarvestTime(
      cropConfig.time
    )}${seasonalWarning}`,
    cost: totalCost,
  };
}
async function plantCropInPlot(
  userFarm,
  plotIndex,
  cropId,
  cropConfig,
  senderID
) {
  const plot = userFarm.plots[plotIndex];

  if (plot.status !== "empty" && plot.status !== "damaged") {
    return {
      success: false,
      message: `❌ Ô đất ${
        plotIndex + 1
      } đã có cây trồng!\n→ Sử dụng .farm thu ${
        plotIndex + 1
      } nếu cây đã sẵn sàng thu hoạch`,
    };
  }

  const balance = await getBalance(senderID);
  if (balance < cropConfig.price) {
    return {
      success: false,
      message: `❌ Không đủ tiền để mua ${
        cropConfig.name
      }!\n💰 Giá: ${formatNumber(
        cropConfig.price
      )} $\n💵 Số dư: ${formatNumber(balance)} $`,
    };
  }
  const currentSeason = getCurrentSeason();
  let seasonalWarning = "";

  if (cropConfig.seasons) {
    const isOptimalSeason = cropConfig.seasons[currentSeason.key];
    const isAllSeason = cropConfig.seasons.ALL;

    if (!isOptimalSeason && !isAllSeason) {
      const effects = getSeasonalEffects(cropId);

      seasonalWarning = `\n⚠️ CẢNH BÁO MÙA VỤ: ${cropConfig.name} không phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ Sản lượng sẽ giảm 20%, cây phát triển chậm hơn 20%\n`;

      const bestSeasons = [];
      Object.entries(cropConfig.seasons).forEach(([season, value]) => {
        if (value && season !== "ALL") {
          bestSeasons.push(VIETNAM_SEASONS[season].name);
        }
      });

      if (bestSeasons.length > 0) {
        seasonalWarning += `→ Cây này lý tưởng để trồng vào: ${bestSeasons.join(
          ", "
        )}\n`;
      }
    } else if (isOptimalSeason) {
      seasonalWarning = `\n🌟 ${cropConfig.name} rất phù hợp trồng vào ${currentSeason.name}!\n`;
      seasonalWarning += `→ +30% sản lượng, phát triển nhanh hơn 20%\n`;
    } else if (isAllSeason) {
      seasonalWarning = `\n📆 ${cropConfig.name} có thể trồng quanh năm với hiệu quả ổn định\n`;
    }
  }
  await updateBalance(senderID, -cropConfig.price);
  plot.status = "growing";
  plot.crop = cropId;
  plot.plantedAt = Date.now();
  plot.water = cropConfig.water > 0 ? 1 : 0;
  plot.lastWatered = Date.now();

  return {
    success: true,
    message: `✅ Đã trồng ${cropConfig.emoji} ${cropConfig.name} tại ô đất ${
      plotIndex + 1
    }!\n⏱️ Thu hoạch sau: ${getHarvestTime(cropConfig.time)}${seasonalWarning}`,
    cost: cropConfig.price,
  };
}
function getHarvestTime(timeInSeconds) {
  if (Math.floor(timeInSeconds / 3600) > 0) {
    return `${Math.floor(timeInSeconds / 3600)} giờ ${Math.floor(
      (timeInSeconds % 3600) / 60
    )} phút`;
  } else {
    return `${Math.floor(timeInSeconds / 60)} phút`;
  }
}

module.exports = {
  name: "farm",
  dev: "HNT",
  usedby: 0,
  category: "Games",
  info: "Trồng trọt và chăn nuôi",
  onPrefix: true,
  usages: [],
  cooldowns: 3,

  onLaunch: async function ({ api, event, target }) {
    const { threadID, messageID, senderID } = event;
    const currentTime = Date.now();

try {
  updateFarms();

  const farmData = loadFarmData();
  if (!farmData || !farmData.farms) {
    console.error("Invalid farm data structure");
    return api.sendMessage(
      "❌ Lỗi dữ liệu trang trại! Vui lòng thử lại sau.",
      threadID,
      messageID
    );
  }

  const userFarm = farmData.farms[senderID] || createUserFarm(senderID);
  userFarm.id = senderID;
  farmData.farms[senderID] = userFarm;
  saveFarmData(farmData);
  if (!userFarm.weather) {
    userFarm.weather = {
      type: "sunny",
      nextChange: Date.now() + 6 * 60 * 60 * 1000,
    };
  }
  if (!target[0]) {
    try {
      const level = calculateLevel(userFarm.exp);
      const nextLevel =
        level.level < LEVELS.length ? LEVELS[level.level] : null;

      let plotsReady = 0;
      let plotsGrowing = 0;
      let plotsEmpty = 0;
      let plotsDamaged = 0;

      const weatherType = userFarm.weather && userFarm.weather.type
        ? userFarm.weather.type
        : "sunny";
      const weatherInfo = WEATHER_EFFECTS[weatherType] || WEATHER_EFFECTS.sunny;

      if (!userFarm.dailyMissions || !userFarm.dailyMissions.missions) {
        userFarm.dailyMissions = generateDailyMissions(userFarm);
        saveFarmData(farmData);
      }

      const { completed, total, unclaimed } = checkMissionsStatus(userFarm);
      const hour = new Date().getHours();
      const weatherTimeOfDay = userFarm.weather && userFarm.weather.timeOfDay
        ? userFarm.weather.timeOfDay
        : hour >= 5 && hour < 10
        ? "morning"
        : hour >= 10 && hour < 16
        ? "noon"
        : hour >= 16 && hour < 19
        ? "evening"
        : "night";

      const timeEmoji = {
        morning: "🌅",
        noon: "☀️",
        evening: "🌆",
        night: "🌃",
      };

      userFarm.plots.forEach((plot) => {
        if (plot.status === "ready") plotsReady++;
        else if (plot.status === "growing") plotsGrowing++;
        else if (plot.status === "empty") plotsEmpty++;
        else if (plot.status === "damaged") plotsDamaged++;
      });

      let animalProducts = 0;
      Object.entries(userFarm.animals || {}).forEach(([_, animal]) => {
        if (animal.productReady) animalProducts++;
      });
      
      const plotsInfo = {
        ready: plotsReady,
        growing: plotsGrowing,
        empty: plotsEmpty,
        damaged: plotsDamaged
      };

      const currentEvent = checkEvent();
      const eventMessage = currentEvent
        ? `\n🎉 Sự kiện đặc biệt: ${currentEvent.name} đang diễn ra!\n` +
          `→ Các loại cây đặc biệt có sẵn để trồng!`
        : "";
      const isVip = isUserVIP(senderID);
      const vipMessage = isVip ? getVIPBenefitsMessage(senderID) : "";
      const currentSeason = getCurrentSeason();
      
      let message = `〔 🌾 NÔNG TRẠI AKI 🌾 〕\n` +
        `┣━━━━━━━━━━━━━━━━┫\n`;
        
      if (userFarm.notifications && userFarm.notifications.length > 0) {
        const recentDamageNotifications = userFarm.notifications
          .filter(
            (n) =>
              n.type === "crop_damaged" &&
              Date.now() - n.time < 12 * 60 * 60 * 1000
          )
          .slice(0, 3);

        if (recentDamageNotifications.length > 0) {
          message += `\n⚠️ THÔNG BÁO MỚI:\n`;
          recentDamageNotifications.forEach((note) => {
            const timeAgo = Math.floor(
              (Date.now() - note.time) / (60 * 1000)
            );
            message += `┣➤ ${note.cropName} ở ô ${
              note.plotIndex + 1
            } bị hỏng (${timeAgo} phút trước)\n`;
          });

          userFarm.notifications = userFarm.notifications.filter(
            (n) =>
              !recentDamageNotifications.includes(n) ||
              Date.now() - n.time >= 12 * 60 * 60 * 1000
          );
        }
      }
      
      message += `┣➤ 👨‍🌾 Cấp độ: ${level.level} - ${level.title}\n` +
        `┣➤ 📊 EXP: ${userFarm.exp}/${
          nextLevel ? nextLevel.exp : "MAX"
        }\n` +
        `┃   ${"▰".repeat(
          Math.floor(
            ((userFarm.exp -
              (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
              ((nextLevel ? nextLevel.exp : userFarm.exp) -
                (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
              10
          )
        )}${"▱".repeat(
          10 -
            Math.floor(
              ((userFarm.exp -
                (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                ((nextLevel ? nextLevel.exp : userFarm.exp) -
                  (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                10
            )
        )}\n` +
        `┣━━━━━━━━━━━━━━━━┫\n` +
        `┣➤ 🌱 ĐẤT TRỒNG: ${userFarm.plots.length} ô\n` +
        `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
        `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n` +
        `┃   ⚠️ Đã hỏng: ${plotsInfo.damaged} ô\n` +
        `┃   🔲 Còn trống: ${plotsEmpty} ô\n` +
        `┣➤ 🐄 VẬT NUÔI: ${
          Object.keys(userFarm.animals || {}).length
        } con\n` +
        `┣➤ 📋 Nhiệm vụ: ${completed}/${total} (${unclaimed} chưa nhận)\n` +
        `┣➤ 🗓️ ${
          currentSeason.emoji
        } ${currentSeason.name.toUpperCase()} (Tháng ${currentSeason.months.join(
          ", "
        )})\n` +
        `┣➤ 🌤️ ${weatherInfo.emoji}${timeEmoji[weatherTimeOfDay]} ${weatherInfo.name}\n` +
        `┣➤ 🕒 ${getTimeString()} - ${getWeatherDescription(
          weatherInfo,
          weatherTimeOfDay
        )}\n` +
        (currentEvent && currentEvent.crops
          ? `┣➤ 🎉 SỰ KIỆN: ${currentEvent.name}\n┃   → Các loại cây đặc biệt có sẵn để trồng!\n`
          : "") +
        (vipMessage ? `┣━━━━━━━━━━━━━━━━┫\n${vipMessage}` : "") +
        `┗━━━━━━━━━━━━━━━━┛\n\n` +
        `⚡ LỆNH NHANH:\n` +
        `→ .farm help - Xem hướng dẫn cách chơi\n`;
        
      let damagedCrops = userFarm.plots.filter(
        (plot) => plot.status === "damaged"
      ).length;
      
      if (damagedCrops > 0) {
        message += `┣➤ ⚠️ CẢNH BÁO: ${damagedCrops} cây bị hỏng do thu hoạch trễ\n`;
      }

      return api.sendMessage(message, threadID, messageID);
    } catch (error) {
      console.error("Error in farm command:", error);
      return api.sendMessage(
        "❌ Lỗi xử lý trang trại!",
        threadID,
        messageID
      );
    }
  }

      const command = target[0].toLowerCase();

      switch (command) {
        case "trồng":
        case "trong":
        case "plant": {
          if (
            !target[1] ||
            (!isNaN(parseInt(target[1])) && target.length === 2)
          ) {
            const page = parseInt(target[1]) || 1;
            return api.sendMessage(
              getCropListMessage(userFarm, page),
              threadID,
              messageID
            );
          }

          const lastParam = target[target.length - 1];
          const hasPlotParam =
            !isNaN(parseInt(lastParam)) ||
            ["all", "tất_cả", "tat_ca"].includes(lastParam?.toLowerCase()) ||
            (lastParam && lastParam.includes("-")) ||
            (lastParam && lastParam.includes(","));

          const cropInput = hasPlotParam
            ? target
                .slice(1, target.length - 1)
                .join(" ")
                .toLowerCase()
            : target.slice(1).join(" ").toLowerCase();

          const plotParam = hasPlotParam ? lastParam : "";

          const cropId = findCropId(cropInput);
          if (!cropId) {
            return api.sendMessage(
              `❌ Không tìm thấy cây trồng "${cropInput}"!\n💡 Sử dụng .farm trồng để xem danh sách.`,
              threadID,
              messageID
            );
          }

          let cropConfig = CROPS[cropId];
          const currentEvent = checkEvent();
          if (
            !cropConfig &&
            currentEvent &&
            currentEvent.crops &&
            currentEvent.crops[cropId]
          ) {
            cropConfig = currentEvent.crops[cropId];
          }

          if (!cropConfig) {
            return api.sendMessage(
              `❌ Không tìm thấy thông tin về cây "${cropInput}"!`,
              threadID,
              messageID
            );
          }

          const currentLevel = calculateLevel(userFarm.exp).level;
          if (cropConfig.level > currentLevel) {
            return api.sendMessage(
              `❌ Bạn cần đạt cấp độ ${cropConfig.level} để trồng ${cropConfig.name}!\n👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
              threadID,
              messageID
            );
          }

          let result;

          if (["all", "tất_cả", "tat_ca"].includes(plotParam?.toLowerCase())) {
            result = await plantAllEmptyPlots(
              userFarm,
              cropId,
              cropConfig,
              senderID
            );
          } else if (plotParam && plotParam.includes("-")) {
            result = await plantCropsInRange(
              userFarm,
              cropId,
              cropConfig,
              plotParam,
              senderID
            );
          } else if (plotParam && plotParam.includes(",")) {
            result = await plantCropsInList(
              userFarm,
              cropId,
              cropConfig,
              plotParam,
              senderID
            );
          } else if (
            plotParam &&
            !isNaN(parseInt(plotParam)) &&
            parseInt(plotParam) > 1
          ) {
            result = await plantMultipleCrops(
              userFarm,
              cropId,
              cropConfig,
              parseInt(plotParam),
              senderID
            );
          } else if (plotParam && !isNaN(parseInt(plotParam))) {
            const plotIndex = parseInt(plotParam) - 1;

            if (plotIndex < 0 || plotIndex >= userFarm.plots.length) {
              return api.sendMessage(
                `❌ Ô đất không tồn tại!\n🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
                threadID,
                messageID
              );
            }

            result = await plantCropInPlot(
              userFarm,
              plotIndex,
              cropId,
              cropConfig,
              senderID
            );
          } else {
            return api.sendMessage(
              `💡 HƯỚNG DẪN TRỒNG CÂY:\n` +
                `→ .farm trồng ${cropConfig.name} <số ô>: Trồng vào ô cụ thể\n` +
                `→ .farm trồng ${cropConfig.name} 1-5: Trồng từ ô 1 đến ô 5\n` +
                `→ .farm trồng ${cropConfig.name} 1,3,5: Trồng vào ô 1, 3 và 5\n` +
                `→ .farm trồng ${cropConfig.name} 10: Trồng vào 10 ô đất trống đầu tiên\n` +
                `→ .farm trồng ${cropConfig.name} all: Trồng vào tất cả ô đất trống`,
              threadID,
              messageID
            );
          }

          if (result.success) {
            updateMissionProgress(userFarm, "plant", result.plantCount || 1);
            saveFarmData(farmData);
          }

          return api.sendMessage(result.message, threadID, messageID);
        }

        case "bxh":
        case "xếp_hạng":
        case "rank": {
          const rankType = target[1]?.toLowerCase() || "cấp_độ";
          const page = parseInt(target[2]) || 1;

          let userData = {};
          try {
            const userDataPath = path.join(
              __dirname,
              "../events/cache/userData.json"
            );
            if (fs.existsSync(userDataPath)) {
              userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
            }
          } catch (error) {
            console.error("Error loading userData.json:", error);
          }

          const allFarms = [];

          Object.entries(farmData.farms || {}).forEach(([userId, farm]) => {
            if (!farm) return;

            let farmWorth = 0;

            if (farm.plots) {
              farm.plots.forEach((plot) => {
                if (plot.status === "growing" && plot.crop) {
                  const cropConfig =
                    CROPS[plot.crop] ||
                    (checkEvent() && checkEvent().crops
                      ? checkEvent().crops[plot.crop]
                      : null);

                  if (cropConfig) {
                    farmWorth += cropConfig.price;
                  }
                }
              });
            }

            if (farm.animals) {
              Object.entries(farm.animals).forEach(([_, animal]) => {
                if (animal && animal.type && ANIMALS[animal.type]) {
                  farmWorth += ANIMALS[animal.type].price;
                }
              });
            }

            if (farm.inventory) {
              Object.entries(farm.inventory).forEach(([product, count]) => {
                let productPrice = 0;
                for (const animalType in ANIMALS) {
                  if (ANIMALS[animalType].product === product) {
                    productPrice = ANIMALS[animalType].productPrice;
                    break;
                  }
                }
                farmWorth += productPrice * count;
              });
            }

            let userName = "Người dùng";
            let userExp = 0;

            if (userData[userId]) {
              userName =
                userData[userId].name || `Người dùng ${userId.slice(-4)}`;
              userExp = userData[userId].exp || 0;
            }

            const farmLevel = calculateLevel(farm.exp);

            allFarms.push({
              userId,
              name: userName,
              exp: farm.exp,
              level: farmLevel.level,
              title: farmLevel.title,
              plotCount: farm.plots?.length || 0,
              animalCount: Object.keys(farm.animals || {}).length,
              farmWorth: farmWorth,
              createdAt: farm.createdAt || 0,
              userRank: userData[userId]?.rank || 999,
              userExp: userExp,
            });
          });

          let sortedFarms = [];
          let rankTypeDisplay = "";

          switch (rankType) {
            case "cấp_độ":
            case "level":
            case "exp":
              sortedFarms = allFarms.sort((a, b) => {
                if (b.level !== a.level) {
                  return b.level - a.level;
                }
                return b.exp - a.exp;
              });
              rankTypeDisplay = "Cấp độ cao nhất";
              break;

            case "tài_sản":
            case "giá_trị":
            case "worth":
              sortedFarms = allFarms.sort((a, b) => b.farmWorth - a.farmWorth);
              rankTypeDisplay = "Tài sản giá trị nhất";
              break;

            case "đất":
            case "plots":
              sortedFarms = allFarms.sort((a, b) => b.plotCount - a.plotCount);
              rankTypeDisplay = "Diện tích đất lớn nhất";
              break;

            case "vật_nuôi":
            case "animals":
              sortedFarms = allFarms.sort(
                (a, b) => b.animalCount - a.animalCount
              );
              rankTypeDisplay = "Nhiều vật nuôi nhất";
              break;

            case "lâu_đời":
            case "old":
              sortedFarms = allFarms.sort((a, b) => a.createdAt - b.createdAt);
              rankTypeDisplay = "Trang trại lâu đời nhất";
              break;

            default:
              sortedFarms = allFarms.sort((a, b) => {
                if (b.level !== a.level) {
                  return b.level - a.level;
                }
                return b.exp - a.exp;
              });
              rankTypeDisplay = "Cấp độ cao nhất";
              break;
          }

          const itemsPerPage = 10;
          const totalPages = Math.ceil(sortedFarms.length / itemsPerPage);

          if (page < 1 || page > totalPages) {
            return api.sendMessage(
              `❌ Trang không hợp lệ! Chỉ có ${totalPages} trang xếp hạng.`,
              threadID,
              messageID
            );
          }

          const startIdx = (page - 1) * itemsPerPage;
          const endIdx = Math.min(startIdx + itemsPerPage, sortedFarms.length);
          const displayFarms = sortedFarms.slice(startIdx, endIdx);

          const currentUserRank =
            sortedFarms.findIndex((farm) => farm.userId === senderID) + 1;
          let currentUserInfo = "";

          if (currentUserRank > 0) {
            const userFarmData = sortedFarms[currentUserRank - 1];
            currentUserInfo = `👨‍🌾 Thứ hạng của bạn: #${currentUserRank}\n`;

            switch (rankType) {
              case "cấp_độ":
              case "level":
              case "exp":
                currentUserInfo += `   Cấp độ ${userFarmData.level} (${userFarmData.exp} EXP)\n`;
                break;
              case "tài_sản":
              case "giá_trị":
              case "worth":
                currentUserInfo += `   Tài sản: ${formatNumber(
                  userFarmData.farmWorth
                )} $\n`;
                break;
              case "đất":
              case "plots":
                currentUserInfo += `   Số ô đất: ${userFarmData.plotCount} ô\n`;
                break;
              case "vật_nuôi":
              case "animals":
                currentUserInfo += `   Số vật nuôi: ${userFarmData.animalCount} con\n`;
                break;
              case "lâu_đời":
              case "old":
                currentUserInfo += `   Ngày thành lập: ${new Date(
                  userFarmData.createdAt
                ).toLocaleDateString("vi-VN")}\n`;
                break;
            }
          }

          let message =
            `🏆 BẢNG XẾP HẠNG NÔNG DÂN 🏆\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 Xếp hạng theo: ${rankTypeDisplay}\n` +
            `📊 Trang: ${page}/${totalPages}\n\n`;

          if (currentUserInfo) {
            message += `${currentUserInfo}\n`;
          }

          displayFarms.forEach((farm, index) => {
            const rank = startIdx + index + 1;
            let rankIcon = "👤";

            if (rank === 1) rankIcon = "🥇";
            else if (rank === 2) rankIcon = "🥈";
            else if (rank === 3) rankIcon = "🥉";

            message += `${rankIcon} #${rank}. ${farm.name}\n`;

            switch (rankType) {
              case "cấp_độ":
              case "level":
              case "exp":
                message += `   👨‍🌾 Farm: Cấp ${farm.level} - ${farm.title}\n`;
                message += `   📊 EXP: ${farm.exp}\n`;
                break;
              case "tài_sản":
              case "giá_trị":
              case "worth":
                message += `   💰 Tài sản: ${formatNumber(
                  farm.farmWorth
                )} $\n`;
                break;
              case "đất":
              case "plots":
                message += `   🌱 Số ô đất: ${farm.plotCount} ô\n`;
                break;
              case "vật_nuôi":
              case "animals":
                message += `   🐄 Số vật nuôi: ${farm.animalCount} con\n`;
                break;
              case "lâu_đời":
              case "old":
                message += `   🏡 Ngày thành lập: ${new Date(
                  farm.createdAt
                ).toLocaleDateString("vi-VN")}\n`;
                break;
            }

            message += `\n`;
          });

          message +=
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💡 Xem trang khác: .farm bxh ${rankType} <số trang>\n` +
            `📋 Các loại xếp hạng:\n` +
            `  • .farm bxh cấp_độ - Theo cấp độ\n` +
            `  • .farm bxh tài_sản - Theo giá trị trang trại\n` +
            `  • .farm bxh đất - Theo số lượng đất\n` +
            `  • .farm bxh animals - Theo số vật nuôi\n` +
            `  • .farm bxh lâu_đời - Theo thời gian thành lập`;

          return api.sendMessage(message, threadID, messageID);
        }

        case "thăm":
        case "tham":
        case "visit": {
          let targetID = "";

          const mentions = event.mentions;

          if (mentions && Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
          } else {
            targetID = target[1];
          }

          if (!targetID) {
            return api.sendMessage(
              "❌ Vui lòng tag người chơi hoặc nhập ID để thăm trang trại!\n" +
                "💡 Sử dụng: .farm thăm @tên_người_chơi\n" +
                "💡 Hoặc: .farm thăm [ID người chơi]",
              threadID,
              messageID
            );
          }

          let targetInfo = {};
          try {
            const userDataPath = path.join(
              __dirname,
              "../events/cache/userData.json"
            );
            if (fs.existsSync(userDataPath)) {
              const userData = JSON.parse(
                fs.readFileSync(userDataPath, "utf8")
              );
              if (userData[targetID]) {
                targetInfo = userData[targetID];
              }
            }
          } catch (error) {
            console.error("Error getting target user data:", error);
          }

          const targetName =
            targetInfo.name || `Người chơi ${targetID.slice(-4)}`;

          if (!farmData.farms[targetID]) {
            return api.sendMessage(
              `❌ Không tìm thấy trang trại của ${targetName}!\n` +
                "💡 Người chơi này chưa có trang trại hoặc ID không chính xác.",
              threadID,
              messageID
            );
          }

          if (targetID === senderID) {
            return api.sendMessage(
              "❌ Bạn không thể thăm trang trại của chính mình!\n" +
                "💡 Hãy sử dụng lệnh .farm để xem trang trại của bạn.",
              threadID,
              messageID
            );
          }

          const targetFarm = farmData.farms[targetID];

          if (!userFarm.lastVisits) userFarm.lastVisits = {};

          const lastVisit = userFarm.lastVisits[targetID] || 0;
          const visitCooldown = 3 * 60 * 60 * 1000;

          if (Date.now() - lastVisit < visitCooldown) {
            const remainingTime = Math.ceil(
              (lastVisit + visitCooldown - Date.now()) / (60 * 60 * 1000)
            );
            return api.sendMessage(
              `❌ Bạn đã thăm trang trại của ${targetName} gần đây!\n` +
                `⏱️ Vui lòng đợi thêm ${remainingTime} giờ nữa.`,
              threadID,
              messageID
            );
          }

          const targetLevel = calculateLevel(targetFarm.exp);

          let plotsReady = 0;
          let plotsGrowing = 0;
          let plotsEmpty = 0;
          let plotsDamaged = 0;

          targetFarm.plots.forEach((plot) => {
            if (plot.status === "ready") plotsReady++;
            else if (plot.status === "growing") plotsGrowing++;
            else if (plot.status === "empty") plotsEmpty++;
            else if (plot.status === "damaged") plotsDamaged++;
          });

          let animalProducts = 0;
          Object.entries(targetFarm.animals || {}).forEach(([_, animal]) => {
            if (animal.productReady) animalProducts++;
          });

          const actions = [];

          if (plotsGrowing > 0) {
            const needWateringPlots = targetFarm.plots.filter((plot) => {
              if (plot.status !== "growing" || !plot.crop) return false;

              const cropConfig =
                CROPS[plot.crop] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[plot.crop]
                  : null);

              return (
                cropConfig &&
                cropConfig.water > 0 &&
                plot.water < cropConfig.water
              );
            });

            if (needWateringPlots.length > 0) {
              actions.push("water");
            }
          }

          let unfedAnimals = [];
          if (targetFarm.animals) {
            unfedAnimals = Object.entries(targetFarm.animals)
              .filter(([_, animal]) => !animal.fed)
              .map(([_, animal]) => animal.type);

            const uniqueUnfedTypes = [...new Set(unfedAnimals)];
            if (uniqueUnfedTypes.length > 0) {
              actions.push("feed");
            }
          }

          let actionMessage = "";
          let expGain = Math.floor(Math.random() * 3) + 3;
          let rewardMessage = `📊 Kinh nghiệm: +${expGain} EXP\n`;

          if (actions.length > 0) {
            const randomAction =
              actions[Math.floor(Math.random() * actions.length)];

            if (randomAction === "water") {
              const needWateringPlots = targetFarm.plots.filter((plot) => {
                if (plot.status !== "growing" || !plot.crop) return false;

                const cropConfig =
                  CROPS[plot.crop] ||
                  (checkEvent() && checkEvent().crops
                    ? checkEvent().crops[plot.crop]
                    : null);

                return (
                  cropConfig &&
                  cropConfig.water > 0 &&
                  plot.water < cropConfig.water
                );
              });

              if (needWateringPlots.length > 0) {
                const randomPlot =
                  needWateringPlots[
                    Math.floor(Math.random() * needWateringPlots.length)
                  ];
                const plotIndex = targetFarm.plots.findIndex(
                  (p) => p === randomPlot
                );

                const cropConfig =
                  CROPS[randomPlot.crop] ||
                  (checkEvent() && checkEvent().crops
                    ? checkEvent().crops[randomPlot.crop]
                    : null);

                if (cropConfig) {
                  randomPlot.water = Math.min(
                    cropConfig.water,
                    randomPlot.water + 1
                  );
                  randomPlot.lastWatered = Date.now();

                  actionMessage = `💦 Bạn đã giúp tưới nước cho ${
                    cropConfig.emoji
                  } ${cropConfig.name} ở ô đất ${plotIndex + 1}!\n`;
                  expGain += 5;
                  rewardMessage = `📊 Kinh nghiệm: +${expGain} EXP (tưới nước +5)\n`;
                }
              }
            } else if (randomAction === "feed") {
              const uniqueUnfedTypes = [...new Set(unfedAnimals)];
              const randomType =
                uniqueUnfedTypes[
                  Math.floor(Math.random() * uniqueUnfedTypes.length)
                ];

              const animalConfig = ANIMALS[randomType];
              if (animalConfig) {
                const animalEntry = Object.entries(targetFarm.animals).find(
                  ([_, animal]) => animal.type === randomType && !animal.fed
                );

                if (animalEntry) {
                  const [animalId, animal] = animalEntry;
                  animal.fed = true;
                  animal.lastFed = Date.now();

                  if (!animal.lastProduced) {
                    animal.lastProduced = Date.now();
                  }

                  actionMessage = `🥫 Bạn đã giúp cho ${animalConfig.emoji} ${animalConfig.name} ăn!\n`;
                  expGain += 5;
                  rewardMessage = `📊 Kinh nghiệm: +${expGain} EXP (cho ăn +5)\n`;
                }
              }
            }
          } else {
            actionMessage =
              "💫 Bạn đã tham quan trang trại và học hỏi được một số điều!\n";
          }

          userFarm.lastVisits[targetID] = Date.now();
          userFarm.exp += expGain;

          if (!targetFarm.visitors) targetFarm.visitors = [];
          targetFarm.visitors.push({
            visitorId: senderID,
            visitTime: Date.now(),
            action: actionMessage.trim(),
          });

          if (targetFarm.visitors.length > 10) {
            targetFarm.visitors = targetFarm.visitors.slice(-10);
          }

          saveFarmData(farmData);

          const oldLevel = calculateLevel(userFarm.exp - expGain).level;
          const newLevel = calculateLevel(userFarm.exp).level;

          if (newLevel > oldLevel) {
            const newLevelData = LEVELS[newLevel - 1];
            rewardMessage += `\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
            rewardMessage += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
            rewardMessage += `💰 Phần thưởng: +${formatNumber(
              newLevelData.reward
            )} $\n`;

            await updateBalance(senderID, newLevelData.reward);

            if (newLevelData.plotSize > userFarm.plots.length) {
              const newPlotsCount =
                newLevelData.plotSize - userFarm.plots.length;
              rewardMessage += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

              for (let i = 0; i < newPlotsCount; i++) {
                userFarm.plots.push({
                  id: userFarm.plots.length,
                  status: "empty",
                  crop: null,
                  plantedAt: null,
                  water: 0,
                  lastWatered: null,
                });
              }

              updateMissionProgress(userFarm, "visit", 1);
              saveFarmData(farmData);
            }
          }

          const message =
            `👨‍🌾 TRANG TRẠI CỦA ${targetName.toUpperCase()} 👨‍🌾\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${actionMessage}\n` +
            `🏆 THÔNG TIN TRANG TRẠI:\n` +
            `┏━━━━━━━━━━━━━━━━┓\n` +
            `┣➤ 👨‍🌾 Cấp độ: ${targetLevel.level} - ${targetLevel.title}\n` +
            `┣➤ 🏡 Ngày thành lập: ${new Date(
              targetFarm.createdAt
            ).toLocaleDateString("vi-VN")}\n` +
            `┣➤ 🌱 Ô đất trồng: ${targetFarm.plots.length} ô\n` +
            `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
            `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n``┃   ⚠️ Đã hỏng: ${plotsInfo.damaged} ô\n`;
          +`┃   🔲 Còn trống: ${plotsEmpty} ô\n` +
            `┣➤ 🐄 Vật nuôi: ${
              Object.keys(targetFarm.animals || {}).length
            } con\n` +
            `┗━━━━━━━━━━━━━━━━┛\n\n` +
            `🎁 PHẦN THƯỞNG THAM QUAN:\n` +
            `┏━━━━━━━━━━━━━━━━┓\n` +
            `┣➤ ${rewardMessage}` +
            `┗━━━━━━━━━━━━━━━━┛\n\n` +
            `💡 Bạn có thể thăm lại trang trại này sau 3 giờ nữa.\n` +
            `💫 Thăm trang trại khác: .farm thăm [ID]`;

          return api.sendMessage(message, threadID, messageID);
        }
        case "cho_ăn":
        case "cho_an":
        case "feed": {
          const animalType = target[1]?.toLowerCase();

          if (
            !animalType ||
            animalType === "all" ||
            animalType === "tất_cả" ||
            animalType === "tat_ca"
          ) {
            if (
              !userFarm.animals ||
              Object.keys(userFarm.animals).length === 0
            ) {
              return api.sendMessage(
                `❌ Bạn không có vật nuôi nào trong trang trại!`,
                threadID,
                messageID
              );
            }

            const unfedAnimals = {};
            let totalFeedCost = 0;
            let totalUnfedCount = 0;

            Object.entries(userFarm.animals).forEach(([id, animal]) => {
              if (!animal.fed && animal.type && ANIMALS[animal.type]) {
                if (!unfedAnimals[animal.type]) {
                  unfedAnimals[animal.type] = {
                    count: 0,
                    feedCost: ANIMALS[animal.type].feed,
                    name: ANIMALS[animal.type].name,
                    emoji: ANIMALS[animal.type].emoji,
                  };
                }
                unfedAnimals[animal.type].count++;
                totalFeedCost += ANIMALS[animal.type].feed;
                totalUnfedCount++;
              }
            });

            if (totalUnfedCount === 0) {
              return api.sendMessage(
                `✅ Tất cả vật nuôi của bạn đã được cho ăn rồi!`,
                threadID,
                messageID
              );
            }

            const balance = await getBalance(senderID);
            if (balance < totalFeedCost) {
              return api.sendMessage(
                `❌ Bạn không đủ tiền để cho tất cả vật nuôi ăn!\n` +
                  `💰 Chi phí: ${formatNumber(totalFeedCost)} $\n` +
                  `💵 Số dư: ${formatNumber(balance)} $`,
                threadID,
                messageID
              );
            }

            await updateBalance(senderID, -totalFeedCost);

            Object.entries(userFarm.animals).forEach(([id, animal]) => {
              if (!animal.fed && animal.type && ANIMALS[animal.type]) {
                animal.fed = true;
                animal.lastFed = Date.now();

                if (!animal.lastProduced) {
                  animal.lastProduced = Date.now();
                }
              }
            });

            updateMissionProgress(userFarm, "feed", totalUnfedCount);
            saveFarmData(farmData);

            let message =
              `✅ Đã cho tất cả vật nuôi ăn thành công!\n` +
              `💰 Chi phí: -${formatNumber(totalFeedCost)} $\n\n` +
              `📋 CHI TIẾT:\n`;

            Object.entries(unfedAnimals).forEach(([type, info]) => {
              message += `${info.emoji} ${info.name}: ${
                info.count
              } con (${formatNumber(info.feedCost * info.count)} $)\n`;
            });

            message +=
              `\n⏱️ Vật nuôi sẽ sản xuất sản phẩm sau vài giờ\n` +
              `💡 Thu thập sản phẩm: .farm collect`;

            return api.sendMessage(message, threadID, messageID);
          }

          if (!ANIMALS[animalType]) {
            return api.sendMessage(
              `❌ Không tìm thấy loại vật nuôi "${animalType}"!`,
              threadID,
              messageID
            );
          }

          const animalConfig = ANIMALS[animalType];
          let animalCount = 0;
          let unfedCount = 0;

          if (!userFarm.animals) {
            return api.sendMessage(
              `❌ Bạn không có vật nuôi nào!`,
              threadID,
              messageID
            );
          }

          Object.entries(userFarm.animals).forEach(([id, animal]) => {
            if (animal.type === animalType) {
              animalCount++;
              if (!animal.fed) unfedCount++;
            }
          });

          if (animalCount === 0) {
            return api.sendMessage(
              `❌ Bạn không có ${animalConfig.name} nào trong trang trại!`,
              threadID,
              messageID
            );
          }

          if (unfedCount === 0) {
            return api.sendMessage(
              `❌ Tất cả ${animalConfig.name} của bạn đã được cho ăn rồi!`,
              threadID,
              messageID
            );
          }

          const feedCost = animalConfig.feed * unfedCount;
          const balance = await getBalance(senderID);

          if (balance < feedCost) {
            return api.sendMessage(
              `❌ Bạn không đủ tiền để cho ${animalConfig.name} ăn!\n` +
                `💰 Chi phí: ${formatNumber(feedCost)} $ (${formatNumber(
                  animalConfig.feed
                )} $ × ${unfedCount})\n` +
                `💵 Số dư: ${formatNumber(balance)} $`,
              threadID,
              messageID
            );
          }

          await updateBalance(senderID, -feedCost);

          Object.entries(userFarm.animals).forEach(([id, animal]) => {
            if (animal.type === animalType && !animal.fed) {
              animal.fed = true;
              animal.lastFed = Date.now();

              if (!animal.lastProduced) {
                animal.lastProduced = Date.now();
              }
            }
          });

          updateMissionProgress(userFarm, "feed", unfedCount);
          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Đã cho ${unfedCount} ${animalConfig.name} ăn thành công!\n` +
              `💰 Chi phí: -${formatNumber(feedCost)} $\n` +
              `⏱️ Vật nuôi sẽ sản xuất sản phẩm sau ${Math.floor(
                animalConfig.productTime / 3600
              )} giờ\n` +
              `💡 Thu thập sản phẩm: .farm collect`,
            threadID,
            messageID
          );
        }
        case "thu_sản_phẩm":
        case "thu_san_pham":
        case "collect": {
          if (!userFarm.animals || Object.keys(userFarm.animals).length === 0) {
            return api.sendMessage(
              `❌ Bạn không có vật nuôi nào trong trang trại!`,
              threadID,
              messageID
            );
          }

          let productsCollected = {};
          let animalsFed = [];
          let totalValue = 0;
          let collectCount = 0;

          Object.entries(userFarm.animals).forEach(([id, animal]) => {
            if (!animal.type || !ANIMALS[animal.type]) return;

            const animalConfig = ANIMALS[animal.type];
            const effects = applyItemEffects(userFarm);

            if (!animal.lastProduced) return;

            const productionTime = animalConfig.productTime * 1000;
            const isReady = Date.now() - animal.lastProduced >= productionTime;

            if (animal.fed && isReady) {
              const productAmount = Math.ceil(
                animalConfig.productPrice * effects.animalBoost
              );
              const product = animalConfig.product;

              if (!userFarm.inventory) userFarm.inventory = {};
              if (!userFarm.inventory[product]) userFarm.inventory[product] = 0;

              userFarm.inventory[product]++;
              animal.lastProduced = Date.now();
              animal.fed = false;
              animal.productReady = false;
              collectCount++;

              if (!productsCollected[product]) {
                productsCollected[product] = {
                  count: 0,
                  price: productAmount,
                  emoji: animalConfig.productEmoji,
                };
              }

              productsCollected[product].count++;
              totalValue += productAmount;

              if (!animalsFed.includes(animal.type)) {
                animalsFed.push(animal.type);
              }
            }
          });

          updateMissionProgress(userFarm, "collect", collectCount);
          saveFarmData(farmData);

          if (collectCount === 0) {
            return api.sendMessage(
              `❌ Chưa có sản phẩm nào sẵn sàng để thu thập!\n` +
                `💡 Lưu ý: Vật nuôi cần được cho ăn và đợi đủ thời gian sản xuất.`,
              threadID,
              messageID
            );
          }

          let message = `✅ Đã thu thập ${collectCount} sản phẩm từ vật nuôi!\n\n`;

          Object.entries(productsCollected).forEach(([product, details]) => {
            message += `${details.emoji} ${product}: +${
              details.count
            } (${formatNumber(details.price * details.count)} $)\n`;
          });

          message += `\n💰 Tổng giá trị: ${formatNumber(totalValue)} $`;
          message += `\n💡 Bán sản phẩm: .farm bán <sản phẩm> <số_lượng>`;

          if (animalsFed.length > 0) {
            message += `\n\n⚠️ Lưu ý: Hãy cho ${animalsFed
              .map((type) => ANIMALS[type].name)
              .join(", ")} ăn lại để tiếp tục sản xuất!`;
          }

          return api.sendMessage(message, threadID, messageID);
        }

        case "bán":
        case "ban":
        case "sell": {
          if (
            target[1] &&
            ["vật_phẩm", "vat_pham", "items"].includes(target[1].toLowerCase())
          ) {
            const sellItemId = target[2]?.toLowerCase();

            if (
              !userFarm.items ||
              Object.keys(userFarm.items).filter(
                (key) => userFarm.items[key].active
              ).length === 0
            ) {
              return api.sendMessage(
                `❌ Bạn chưa sở hữu vật phẩm nào để bán!`,
                threadID,
                messageID
              );
            }

            if (!sellItemId) {
              let message = `🧰 VẬT PHẨM CÓ THỂ BÁN 🧰\n`;
              message += `━━━━━━━━━━━━━━━━━━\n\n`;
              message += `💡 Lưu ý: Vật phẩm bán được 70% giá gốc\n\n`;

              let hasItems = false;

              Object.entries(userFarm.items).forEach(([itemId, item]) => {
                if (item.active && (!item.expiry || item.expiry > Date.now())) {
                  hasItems = true;
                  const itemConfig = SHOP_ITEMS[itemId];
                  if (itemConfig) {
                    const sellPrice = Math.floor(itemConfig.price * 0.7);
                    const timeLeft = item.expiry
                      ? Math.max(
                          0,
                          Math.floor(
                            (item.expiry - Date.now()) / (60 * 60 * 1000)
                          )
                        )
                      : "∞";

                    message += `${itemConfig.emoji} ${itemConfig.name}\n`;
                    message += `💰 Giá bán: ${formatNumber(
                      sellPrice
                    )} $ (70% giá gốc)\n`;
                    message += `⏱️ Thời hạn còn lại: ${
                      timeLeft === "∞" ? "Vĩnh viễn" : `${timeLeft} giờ`
                    }\n`;
                    message += `💡 Bán: .farm bán vật_phẩm ${itemId}\n\n`;
                  }
                }
              });

              if (!hasItems) {
                return api.sendMessage(
                  `❌ Không có vật phẩm nào khả dụng để bán!`,
                  threadID,
                  messageID
                );
              }

              return api.sendMessage(message, threadID, messageID);
            }

            if (
              !userFarm.items[sellItemId] ||
              !userFarm.items[sellItemId].active
            ) {
              return api.sendMessage(
                `❌ Bạn không sở hữu vật phẩm này hoặc vật phẩm đã hết hạn!`,
                threadID,
                messageID
              );
            }

            const itemConfig = SHOP_ITEMS[sellItemId];
            if (!itemConfig) {
              return api.sendMessage(
                `❌ Không tìm thấy thông tin vật phẩm trong hệ thống!`,
                threadID,
                messageID
              );
            }

            const sellPrice = Math.floor(itemConfig.price * 0.7);

            delete userFarm.items[sellItemId];
            await updateBalance(senderID, sellPrice);
            saveFarmData(farmData);

            return api.sendMessage(
              `✅ Đã bán ${itemConfig.emoji} ${itemConfig.name} thành công!\n` +
                `💰 Nhận được: +${formatNumber(sellPrice)} $ (70% giá gốc)\n` +
                `⚠️ Lưu ý: Các hiệu ứng từ vật phẩm này sẽ mất đi!`,
              threadID,
              messageID
            );
          } else if (
            target[1] &&
            ["gia_súc", "gia_suc", "animals"].includes(target[1].toLowerCase())
          ) {
            const animalType = target[2]?.toLowerCase();
            const quantity = parseInt(target[3]) || 1;

            if (
              !userFarm.animals ||
              Object.keys(userFarm.animals).length === 0
            ) {
              return api.sendMessage(
                "❌ Bạn không có gia súc nào để bán!\n" +
                  "💡 Mua gia súc: .farm shop animals",
                threadID,
                messageID
              );
            }

            if (!animalType) {
              let message =
                "🐄 BÁN GIA SÚC 🐄\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                "Bạn có thể bán gia súc để lấy lại một phần xu đã đầu tư.\n" +
                "💡 Lưu ý: Giá bán chỉ bằng 70% giá mua.\n\n" +
                "📋 DANH SÁCH GIA SÚC CỦA BẠN:\n\n";

              const animalCounts = {};
              Object.entries(userFarm.animals || {}).forEach(([_, animal]) => {
                if (!animal.type) return;
                const animalType = animal.type;
                if (!animalCounts[animalType]) {
                  animalCounts[animalType] = {
                    count: 0,
                    name: ANIMALS[animalType]?.name || animalType,
                    emoji: ANIMALS[animalType]?.emoji || "🐾",
                    price: ANIMALS[animalType]?.price || 0,
                  };
                }
                animalCounts[animalType].count++;
              });

              Object.entries(animalCounts).forEach(([type, info]) => {
                const sellPrice = Math.floor(info.price * 0.7);
                message += `${info.emoji} ${info.name}: ${info.count} con\n`;
                message += `💰 Giá bán: ${formatNumber(
                  sellPrice
                )} $/con (70% giá mua)\n`;
                message += `💡 Bán: .farm bán gia_súc ${type} <số_lượng>\n\n`;
              });

              message +=
                "━━━━━━━━━━━━━━━━━━\n" +
                "💡 Ví dụ: .farm bán gia_súc ga 2 (bán 2 con gà)";

              return api.sendMessage(message, threadID, messageID);
            }

            if (!ANIMALS[animalType]) {
              return api.sendMessage(
                `❌ Không tìm thấy loại gia súc "${animalType}"!\n` +
                  `💡 Sử dụng .farm bán gia_súc để xem danh sách gia súc của bạn.`,
                threadID,
                messageID
              );
            }

            const userAnimals = Object.entries(userFarm.animals || {}).filter(
              ([_, animal]) => animal.type === animalType
            );

            if (userAnimals.length === 0) {
              return api.sendMessage(
                `❌ Bạn không có ${ANIMALS[animalType].name} nào để bán!\n` +
                  `💡 Mua gia súc: .farm shop animals ${animalType}`,
                threadID,
                messageID
              );
            }

            if (quantity > userAnimals.length) {
              return api.sendMessage(
                `❌ Bạn chỉ có ${userAnimals.length} ${ANIMALS[animalType].name} để bán!\n` +
                  `💡 Nhập số lượng hợp lệ hoặc bỏ trống để bán tất cả.`,
                threadID,
                messageID
              );
            }

            const sellQuantity = Math.min(quantity, userAnimals.length);
            const sellPrice = Math.floor(ANIMALS[animalType].price * 0.7);
            const totalSellPrice = sellPrice * sellQuantity;

            for (let i = 0; i < sellQuantity; i++) {
              const [animalId, _] = userAnimals[i];
              delete userFarm.animals[animalId];
            }

            await updateBalance(senderID, totalSellPrice);
            saveFarmData(farmData);

            return api.sendMessage(
              `✅ Đã bán ${sellQuantity} ${ANIMALS[animalType].emoji} ${ANIMALS[animalType].name} thành công!\n` +
                `💰 Nhận được: +${formatNumber(totalSellPrice)} $\n` +
                `💡 Giá bán: ${formatNumber(sellPrice)}/con (70% giá mua)`,
              threadID,
              messageID
            );
          } else {
            let productName = "";
            let quantity = 0;

            const lastParam = target[target.length - 1];
            const isLastParamNumber = !isNaN(parseInt(lastParam));
            if (isLastParamNumber) {
              quantity = parseInt(lastParam);
              productName = target
                .slice(1, target.length - 1)
                .join(" ")
                .toLowerCase();
            } else {
              productName = target.slice(1).join(" ").toLowerCase();
            }

            if (!productName) {
              if (
                !userFarm.inventory ||
                Object.keys(userFarm.inventory).filter(
                  (key) => userFarm.inventory[key] > 0
                ).length === 0
              ) {
                return api.sendMessage(
                  `❌ Kho hàng của bạn đang trống! Không có gì để bán.\n` +
                    `💡 Hãy thu hoạch cây trồng hoặc sản phẩm từ vật nuôi để có hàng bán.`,
                  threadID,
                  messageID
                );
              }

              let message =
                `🧺 KHO HÀNG CỦA BẠN 🧺\n` + `━━━━━━━━━━━━━━━━━━\n\n`;
              message += `💡 CÁC LOẠI HÀNG ĐẶC BIỆT:\n`;
              message += `→ .farm bán vật_phẩm - Bán các vật phẩm đã mua\n`;
              message += `→ .farm bán gia_súc - Bán vật nuôi\n\n`;
              message += `📋 SẢN PHẨM TRONG KHO:\n\n`;

              Object.entries(userFarm.inventory).forEach(([product, count]) => {
                if (count <= 0) return;

                let productPrice = 0;
                let productEmoji = "📦";

                for (const animalId in ANIMALS) {
                  if (ANIMALS[animalId].product === product) {
                    productPrice = ANIMALS[animalId].productPrice;
                    productEmoji = ANIMALS[animalId].productEmoji;
                    break;
                  }
                }

                for (const cropId in CROPS) {
                  if (
                    CROPS[cropId].name.toLowerCase() === product.toLowerCase()
                  ) {
                    productPrice = CROPS[cropId].yield;
                    productEmoji = CROPS[cropId].emoji;
                    break;
                  }
                }

                for (const recipeId in PROCESSING_RECIPES) {
                  if (
                    PROCESSING_RECIPES[recipeId].name.toLowerCase() ===
                    product.toLowerCase()
                  ) {
                    productPrice = PROCESSING_RECIPES[recipeId].value;
                    productEmoji = PROCESSING_RECIPES[recipeId].emoji;
                    break;
                  }
                }

                message += `${productEmoji} ${product}: ${count} (${formatNumber(
                  count * productPrice
                )} $)\n`;
                message += `💡 Bán: .farm bán ${product} <số_lượng>\n\n`;
              });

              return api.sendMessage(message, threadID, messageID);
            }

            let matchedProduct = null;
            const normalizedInventory = {};

            if (userFarm.inventory) {
              Object.entries(userFarm.inventory).forEach(([product, count]) => {
                if (count <= 0) return;

                const normalizedName = product.toLowerCase();
                const withoutDiacritics = normalizedName
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");

                normalizedInventory[normalizedName] = {
                  original: product,
                  count,
                };
                normalizedInventory[withoutDiacritics] = {
                  original: product,
                  count,
                };
              });

              const normalizedInput = productName.toLowerCase();
              const inputWithoutDiacritics = normalizedInput
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

              if (normalizedInventory[normalizedInput]) {
                matchedProduct = normalizedInventory[normalizedInput].original;
              } else if (normalizedInventory[inputWithoutDiacritics]) {
                matchedProduct =
                  normalizedInventory[inputWithoutDiacritics].original;
              } else {
                let bestMatch = null;
                let bestSimilarity = 0;

                for (const [key, details] of Object.entries(
                  normalizedInventory
                )) {
                  if (
                    key.includes(normalizedInput) ||
                    normalizedInput.includes(key)
                  ) {
                    const similarity =
                      Math.min(key.length, normalizedInput.length) /
                      Math.max(key.length, normalizedInput.length);

                    if (similarity > bestSimilarity) {
                      bestSimilarity = similarity;
                      bestMatch = details.original;
                    }
                  }
                }

                if (bestMatch && bestSimilarity > 0.5) {
                  matchedProduct = bestMatch;
                }
              }

              if (!matchedProduct) {
                return api.sendMessage(
                  `❌ Bạn không có sản phẩm "${productName}" trong kho!`,
                  threadID,
                  messageID
                );
              }
            }

            if (userFarm.inventory && userFarm.inventory[productName]) {
              matchedProduct = productName;
            } else {
              for (const product in userFarm.inventory || {}) {
                if (
                  product.toLowerCase().includes(productName) ||
                  productName.includes(product.toLowerCase())
                ) {
                  matchedProduct = product;
                  break;
                }
              }
            }

            if (!matchedProduct) {
              return api.sendMessage(
                `❌ Bạn không có sản phẩm "${productName}" trong kho!`,
                threadID,
                messageID
              );
            }

            const availableQuantity = userFarm.inventory[matchedProduct];

            if (isNaN(quantity) || quantity <= 0) {
              quantity = availableQuantity;
            }

            if (quantity > availableQuantity) {
              return api.sendMessage(
                `❌ Bạn chỉ có ${availableQuantity} ${matchedProduct} trong kho!`,
                threadID,
                messageID
              );
            }

            let productPrice = 0;
            let productEmoji = "📦";

            for (const animalId in ANIMALS) {
              if (ANIMALS[animalId].product === matchedProduct) {
                productPrice = ANIMALS[animalId].productPrice;
                productEmoji = ANIMALS[animalId].productEmoji;
                break;
              }
            }

            if (productPrice === 0) {
              for (const cropId in CROPS) {
                if (
                  CROPS[cropId].name.toLowerCase() ===
                  matchedProduct.toLowerCase()
                ) {
                  productPrice = CROPS[cropId].yield;
                  productEmoji = CROPS[cropId].emoji;
                  break;
                }
              }

              if (productPrice === 0) {
                const currentEvent = checkEvent();
                if (currentEvent && currentEvent.crops) {
                  for (const cropId in currentEvent.crops) {
                    if (
                      currentEvent.crops[cropId].name.toLowerCase() ===
                      matchedProduct.toLowerCase()
                    ) {
                      productPrice = currentEvent.crops[cropId].yield;
                      productEmoji = currentEvent.crops[cropId].emoji;
                      break;
                    }
                  }
                }
              }

              if (productPrice === 0) {
                for (const recipeId in PROCESSING_RECIPES) {
                  if (
                    PROCESSING_RECIPES[recipeId].name.toLowerCase() ===
                    matchedProduct.toLowerCase()
                  ) {
                    productPrice = PROCESSING_RECIPES[recipeId].value;
                    productEmoji = PROCESSING_RECIPES[recipeId].emoji;
                    break;
                  }
                }
              }
            }

            if (productPrice === 0) {
              return api.sendMessage(
                `❌ Không thể xác định giá của sản phẩm "${matchedProduct}"!`,
                threadID,
                messageID
              );
            }

            const totalValue = productPrice * quantity;
            userFarm.inventory[matchedProduct] -= quantity;
            await updateBalance(senderID, totalValue);

            updateMissionProgress(userFarm, "sell", quantity);
            saveFarmData(farmData);

            return api.sendMessage(
              `✅ Đã bán ${quantity} ${productEmoji} ${matchedProduct} thành công!\n` +
                `💰 Nhận được: +${formatNumber(totalValue)} $\n` +
                `⚠️ Lưu ý: Thu hoạch cây trồng trong vòng 2 giờ sau khi sẵn sàng, nếu không cây sẽ bị hỏng!\n` +
                `📊 Còn lại trong kho: ${userFarm.inventory[matchedProduct]} ${matchedProduct}`,
              threadID,
              messageID
            );
          }
        }

        case "nhiệm_vụ":
        case "nhiem_vu":
        case "missions":
        case "quests": {
          const action = target[1]?.toLowerCase();

          if (!userFarm.dailyMissions || !userFarm.dailyMissions.missions) {
            userFarm.dailyMissions = generateDailyMissions(userFarm);
            saveFarmData(farmData);
          }

          const lastDate = new Date(userFarm.dailyMissions.date);
          const today = new Date();
          if (lastDate.toDateString() !== today.toDateString()) {
            userFarm.dailyMissions = generateDailyMissions(userFarm);
            saveFarmData(farmData);
          }

          if (action === "nhận" || action === "claim" || action === "nhan") {
            const missionType = target[2]?.toLowerCase();

            if (!missionType) {
              let totalReward = 0;
              let totalExp = 0;
              let claimedCount = 0;

              Object.keys(userFarm.dailyMissions.missions).forEach((type) => {
                const result = claimMissionReward(userFarm, type);
                if (result) {
                  totalReward += result.reward;
                  totalExp += result.exp;
                  claimedCount++;
                }
              });

              if (claimedCount > 0) {
                await updateBalance(senderID, totalReward);
                userFarm.exp += totalExp;
                saveFarmData(farmData);

                const oldLevel = calculateLevel(userFarm.exp - totalExp).level;
                const newLevel = calculateLevel(userFarm.exp).level;
                let levelUpMessage = "";

                if (newLevel > oldLevel) {
                  const newLevelData = LEVELS[newLevel - 1];
                  levelUpMessage =
                    `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n` +
                    `🏆 Danh hiệu mới: ${newLevelData.title}\n` +
                    `💰 Phần thưởng: +${formatNumber(
                      newLevelData.reward
                    )} $\n`;

                  await updateBalance(senderID, newLevelData.reward);

                  if (newLevelData.plotSize > userFarm.plots.length) {
                    const newPlotsCount =
                      newLevelData.plotSize - userFarm.plots.length;
                    levelUpMessage += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

                    for (let i = 0; i < newPlotsCount; i++) {
                      userFarm.plots.push({
                        id: userFarm.plots.length,
                        status: "empty",
                        crop: null,
                        plantedAt: null,
                        water: 0,
                        lastWatered: null,
                      });
                    }
                  }

                  saveFarmData(farmData);
                }

                return api.sendMessage(
                  `✅ Đã nhận thưởng ${claimedCount} nhiệm vụ thành công!\n` +
                    `💰 Nhận được: +${formatNumber(totalReward)} $\n` +
                    `📊 Kinh nghiệm: +${totalExp} EXP${levelUpMessage}`,
                  threadID,
                  messageID
                );
              } else {
                return api.sendMessage(
                  `❌ Không có nhiệm vụ nào có thể nhận thưởng!\n` +
                    `💡 Hãy hoàn thành nhiệm vụ trước khi nhận thưởng.`,
                  threadID,
                  messageID
                );
              }
            } else {
              if (!DAILY_MISSIONS[missionType]) {
                return api.sendMessage(
                  `❌ Không tìm thấy nhiệm vụ "${missionType}"!\n` +
                    `💡 Sử dụng .farm quests để xem danh sách nhiệm vụ hiện tại.`,
                  threadID,
                  messageID
                );
              }

              const result = claimMissionReward(userFarm, missionType);
              if (result) {
                await updateBalance(senderID, result.reward);
                userFarm.exp += result.exp;
                saveFarmData(farmData);

                const oldLevel = calculateLevel(
                  userFarm.exp - result.exp
                ).level;
                const newLevel = calculateLevel(userFarm.exp).level;
                let levelUpMessage = "";

                if (newLevel > oldLevel) {
                  const newLevelData = LEVELS[newLevel - 1];
                  levelUpMessage =
                    `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n` +
                    `🏆 Danh hiệu mới: ${newLevelData.title}\n` +
                    `💰 Phần thưởng: +${formatNumber(
                      newLevelData.reward
                    )} $\n`;

                  await updateBalance(senderID, newLevelData.reward);

                  if (newLevelData.plotSize > userFarm.plots.length) {
                    const newPlotsCount =
                      newLevelData.plotSize - userFarm.plots.length;
                    levelUpMessage += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

                    for (let i = 0; i < newPlotsCount; i++) {
                      userFarm.plots.push({
                        id: userFarm.plots.length,
                        status: "empty",
                        crop: null,
                        plantedAt: null,
                        water: 0,
                        lastWatered: null,
                      });
                    }
                  }

                  saveFarmData(farmData);
                }

                const mission = userFarm.dailyMissions.missions[missionType];
                return api.sendMessage(
                  `✅ Đã nhận thưởng nhiệm vụ "${mission.name}" thành công!\n` +
                    `💰 Nhận được: +${formatNumber(result.reward)} $\n` +
                    `📊 Kinh nghiệm: +${result.exp} EXP${levelUpMessage}`,
                  threadID,
                  messageID
                );
              } else {
                return api.sendMessage(
                  `❌ Không thể nhận thưởng nhiệm vụ này!\n` +
                    `💡 Hãy đảm bảo nhiệm vụ đã hoàn thành và chưa nhận thưởng.`,
                  threadID,
                  messageID
                );
              }
            }
          }

          const { completed, total, unclaimed } = checkMissionsStatus(userFarm);
          const resetTime = new Date(userFarm.dailyMissions.date);
          resetTime.setDate(resetTime.getDate() + 1);
          resetTime.setHours(0, 0, 0, 0);

          const timeLeft = resetTime.getTime() - Date.now();
          const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
          const minutesLeft = Math.floor(
            (timeLeft % (60 * 60 * 1000)) / (60 * 1000)
          );

          let message =
            `📋 NHIỆM VỤ HÀNG NGÀY 📋\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `⏱️ Làm mới sau: ${hoursLeft} giờ ${minutesLeft} phút\n` +
            `📊 Tiến độ: ${completed}/${total} nhiệm vụ hoàn thành\n` +
            `🎁 Phần thưởng chưa nhận: ${unclaimed}\n\n` +
            `📌 DANH SÁCH NHIỆM VỤ:\n`;

          Object.entries(userFarm.dailyMissions.missions).forEach(
            ([type, mission]) => {
              const completed = mission.progress >= mission.target;
              const statusIcon = completed
                ? mission.claimed
                  ? "✅"
                  : "⭐"
                : "⏳";
              const statusText = completed
                ? mission.claimed
                  ? "Đã nhận thưởng"
                  : "Hoàn thành! Có thể nhận"
                : "Đang tiến hành";

              message += `\n${statusIcon} ${mission.emoji} ${mission.name}\n`;
              message += `┣➤ ${mission.description}\n`;
              message += `┣➤ Tiến độ: ${mission.progress}/${mission.target}\n`;
              message += `┣➤ Phần thưởng: ${formatNumber(mission.reward)} $, ${
                mission.exp
              } EXP\n`;
              message += `┗➤ Trạng thái: ${statusText}\n`;
            }
          );

          if (unclaimed > 0) {
            message += `\n💡 Nhận thưởng: .farm nhiệm_vụ nhận\n`;
            message += `💡 Nhận từng nhiệm vụ: .farm nhiệm_vụ nhận <loại_nhiệm_vụ>`;
          }

          return api.sendMessage(message, threadID, messageID);
        }

        case "chế_biến":
        case "che_bien":
        case "process": {
          let completedRecipes = [];
          let totalExp = 0;
          let autoCollectMessage = "";

          if (
            userFarm.processing &&
            Object.keys(userFarm.processing).length > 0
          ) {
            for (const [recipeId, process] of Object.entries(
              userFarm.processing
            )) {
              const recipe = PROCESSING_RECIPES[recipeId];
              if (!recipe) {
                delete userFarm.processing[recipeId];
                continue;
              }

              if (
                process.status === "processing" &&
                process.finishTime <= Date.now()
              ) {
                completedRecipes.push({
                  recipe,
                  process,
                  totalValue: recipe.value * recipe.yield * process.quantity,
                });

                if (!userFarm.inventory) userFarm.inventory = {};
                if (!userFarm.inventory[recipe.name])
                  userFarm.inventory[recipe.name] = 0;
                userFarm.inventory[recipe.name] +=
                  recipe.yield * process.quantity;

                totalExp += recipe.exp * process.quantity;

                delete userFarm.processing[recipeId];
              }
            }

            if (totalExp > 0) {
              userFarm.exp += totalExp;
              const oldLevel = calculateLevel(userFarm.exp - totalExp).level;
              const newLevel = calculateLevel(userFarm.exp).level;

              if (completedRecipes.length > 0) {
                autoCollectMessage =
                  `\n\n✅ CHẾ BIẾN HOÀN THÀNH!\n` + `━━━━━━━━━━━━━━━\n`;

                completedRecipes.forEach((item) => {
                  autoCollectMessage += `${item.recipe.emoji} ${item.process.quantity} ${item.recipe.name} đã hoàn thành!\n`;
                  autoCollectMessage += `💰 Giá trị: ${formatNumber(
                    item.totalValue
                  )} $\n`;
                  autoCollectMessage += `📊 EXP: +${
                    item.recipe.exp * item.process.quantity
                  }\n\n`;
                });

                autoCollectMessage += `📦 Tất cả sản phẩm đã được thêm vào kho!\n`;
                autoCollectMessage += `💡 Bán sản phẩm: .farm bán <tên_sản_phẩm> <số_lượng>`;

                if (newLevel > oldLevel) {
                  const newLevelData = LEVELS[newLevel - 1];
                  autoCollectMessage += `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
                  autoCollectMessage += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
                  autoCollectMessage += `💰 Phần thưởng: +${formatNumber(
                    newLevelData.reward
                  )} $\n`;

                  await updateBalance(senderID, newLevelData.reward);

                  if (newLevelData.plotSize > userFarm.plots.length) {
                    const newPlotsCount =
                      newLevelData.plotSize - userFarm.plots.length;
                    autoCollectMessage += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

                    for (let i = 0; i < newPlotsCount; i++) {
                      userFarm.plots.push({
                        id: userFarm.plots.length,
                        status: "empty",
                        crop: null,
                        plantedAt: null,
                        water: 0,
                        lastWatered: null,
                      });
                    }
                  }
                }
              }
            }

            saveFarmData(farmData);
          }

          const recipeId = target[1]?.toLowerCase();
          const quantity = Math.max(1, parseInt(target[2]) || 1);

          if (!recipeId) {
            const currentLevel = calculateLevel(userFarm.exp).level;

            let message = `👨‍🍳 CHẾ BIẾN NÔNG SẢN 👨‍🍳\n` + `━━━━━━━━━━━━━━\n\n`;

            let pendingRecipes = [];
            if (
              userFarm.processing &&
              Object.keys(userFarm.processing).length > 0
            ) {
              for (const [recipeId, process] of Object.entries(
                userFarm.processing
              )) {
                const recipe = PROCESSING_RECIPES[recipeId];
                if (!recipe) continue;

                if (process.status === "processing") {
                  const remaining = Math.ceil(
                    (process.finishTime - Date.now()) / (60 * 1000)
                  );
                  if (remaining > 0) {
                    pendingRecipes.push({
                      recipe,
                      process,
                      remaining,
                    });
                  }
                }
              }

              if (pendingRecipes.length > 0) {
                message += `⏳ ĐANG CHẾ BIẾN:\n`;
                pendingRecipes.forEach((item) => {
                  message += `┣➤ ${item.recipe.emoji} ${item.process.quantity} ${item.recipe.name}\n`;
                  message += `┃   ⏱️ Hoàn thành sau: ${item.remaining} phút\n`;
                });
                message += `┗━━━━━━━━━━━━━━\n\n`;
              }
            }

            message += `ℹ️ THÔNG TIN CHẾ BIẾN:\n`;
            message += `┣➤ Chế biến nông sản để tạo sản phẩm giá trị cao hơn\n`;
            message += `┣➤ Sản phẩm đã hoàn thành sẽ tự động vào kho\n`;
            message += `┗➤ Sử dụng: .farm process <món_ăn> <số_lượng>\n\n`;

            const recipesByLevel = {};
            Object.entries(PROCESSING_RECIPES).forEach(([id, recipe]) => {
              const level = recipe.level;
              if (!recipesByLevel[level]) recipesByLevel[level] = [];
              recipesByLevel[level].push({ id, ...recipe });
            });
            let hasUnlockedRecipes = false;

            for (let level = 1; level <= currentLevel; level++) {
              if (recipesByLevel[level]) {
                hasUnlockedRecipes = true;
                message += `\n🔓 CẤP ĐỘ ${level}:\n`;

                recipesByLevel[level].forEach((recipe) => {
                  message += `┏━━━━━━━━━━━━━┓\n`;
                  message += `┣➤ ${recipe.emoji} ${recipe.name}\n`;
                  message += `┣➤ 💰 Giá bán: ${formatNumber(
                    recipe.value
                  )} $\n`;
                  message += `┣➤ ⏱️ Thời gian: ${Math.floor(
                    recipe.time / 60
                  )} phút\n`;
                  message += `┣➤ 📊 EXP: +${recipe.exp}/sản phẩm\n`;
                  message += `┣➤ 📋 Nguyên liệu:\n`;

                  Object.entries(recipe.ingredients).forEach(
                    ([item, amount]) => {
                      let itemEmoji = "📦";

                      for (const animalId in ANIMALS) {
                        if (ANIMALS[animalId].product === item) {
                          itemEmoji = ANIMALS[animalId].productEmoji;
                          break;
                        }
                      }

                      for (const cropId in CROPS) {
                        if (
                          CROPS[cropId].name.toLowerCase() ===
                          item.toLowerCase()
                        ) {
                          itemEmoji = CROPS[cropId].emoji;
                          break;
                        }
                      }

                      message += `┃   ${itemEmoji} ${item}: ${amount}\n`;
                    }
                  );

                  message += `┣➤ 📦 Thu hoạch: ${recipe.yield} ${recipe.name}\n`;
                  message += `┗➤ 💡 Chế biến: .farm chế_biến ${recipe.id}\n`;
                });
              }
            }

            if (!hasUnlockedRecipes) {
              message += `\n❌ Bạn chưa mở khóa công thức nào!\n`;
              message += `💡 Đạt cấp độ cao hơn để mở khóa công thức.\n`;
            }

            let hasLockedRecipes = false;
            message += `\n🔒 CÔNG THỨC KHÓA:\n`;

            for (let level = currentLevel + 1; level <= 10; level++) {
              if (recipesByLevel[level]) {
                hasLockedRecipes = true;
                message += `\n🔒 CẤP ĐỘ ${level}:\n`;

                recipesByLevel[level].forEach((recipe) => {
                  message += `┣➤ ${recipe.emoji} ${recipe.name}\n`;
                });
              }
            }

            if (!hasLockedRecipes) {
              message += `\n🎉 Bạn đã mở khóa tất cả công thức!\n`;
            }

            message += `\n━━━━━━━━━━━━━\n`;
            message += `💡 Chế biến một khẩu phần: .farm chế_biến <id_món>\n`;
            message += `💡 Chế biến nhiều: .farm chế_biến <id_món> <số_lượng>\n`;

            message += autoCollectMessage;

            return api.sendMessage(message, threadID, messageID);
          }

          const recipe = PROCESSING_RECIPES[recipeId];
          if (!recipe) {
            return api.sendMessage(
              `❌ Không tìm thấy công thức "${recipeId}"!\n` +
                `💡 Sử dụng: .farm chế_biến để xem danh sách công thức.`,
              threadID,
              messageID
            );
          }

          const currentLevel = calculateLevel(userFarm.exp).level;
          if (recipe.level > currentLevel) {
            return api.sendMessage(
              `❌ Bạn cần đạt cấp độ ${recipe.level} để chế biến ${recipe.name}!\n` +
                `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
              threadID,
              messageID
            );
          }

          if (
            userFarm.processing &&
            userFarm.processing[recipeId] &&
            userFarm.processing[recipeId].status === "processing" &&
            userFarm.processing[recipeId].finishTime > Date.now()
          ) {
            const remaining = Math.ceil(
              (userFarm.processing[recipeId].finishTime - Date.now()) /
                (60 * 1000)
            );
            return api.sendMessage(
              `⏳ ${recipe.emoji} ${recipe.name} đang được chế biến!\n` +
                `⏱️ Hoàn thành sau: ${remaining} phút\n` +
                `💡 Món ăn sẽ tự động được thêm vào kho khi hoàn thành.`,
              threadID,
              messageID
            );
          }

          const missingIngredients = [];
          const requiredIngredients = {};

          for (const [item, amount] of Object.entries(recipe.ingredients)) {
            const requiredAmount = amount * quantity;
            requiredIngredients[item] = requiredAmount;

            const availableAmount = userFarm.inventory?.[item] || 0;
            if (availableAmount < requiredAmount) {
              missingIngredients.push({
                name: item,
                required: requiredAmount,
                available: availableAmount,
                missing: requiredAmount - availableAmount,
              });
            }
          }

          if (missingIngredients.length > 0) {
            let message = `❌ Không đủ nguyên liệu để chế biến ${quantity} ${recipe.name}!\n\n`;
            message += `📋 NGUYÊN LIỆU CẦN THIẾT:\n`;

            for (const item of missingIngredients) {
              let itemEmoji = "📦";

              for (const animalId in ANIMALS) {
                if (ANIMALS[animalId].product === item.name) {
                  itemEmoji = ANIMALS[animalId].productEmoji;
                  break;
                }
              }

              message += `${itemEmoji} ${item.name}: ${item.available}/${item.required} (Thiếu ${item.missing})\n`;
            }

            return api.sendMessage(message, threadID, messageID);
          }

          if (!userFarm.processing) userFarm.processing = {};

          for (const [item, amount] of Object.entries(requiredIngredients)) {
            userFarm.inventory[item] -= amount;
            if (userFarm.inventory[item] <= 0) {
              delete userFarm.inventory[item];
            }
          }

          userFarm.processing[recipeId] = {
            recipeId,
            quantity,
            startTime: Date.now(),
            finishTime: Date.now() + recipe.time * 1000,
            status: "processing",
          };

          updateMissionProgress(userFarm, "process", quantity);
          saveFarmData(farmData);

          let message =
            `✅ Bắt đầu chế biến ${quantity} ${recipe.emoji} ${recipe.name}!\n` +
            `⏱️ Thời gian: ${Math.floor(recipe.time / 60)} phút\n` +
            `💰 Giá trị: ${formatNumber(
              recipe.value * recipe.yield * quantity
            )} $\n` +
            `📊 Kinh nghiệm: +${recipe.exp * quantity} EXP\n\n` +
            `💡 Sản phẩm sẽ tự động được thêm vào kho khi hoàn thành!\n` +
            `💡 Sử dụng .farm bán ${recipe.name} để bán khi hoàn thành`;

          message += autoCollectMessage;

          return api.sendMessage(message, threadID, messageID);
        }

        case "kho":
        case "warehouse":
        case "inventory": {
          if (
            !userFarm.inventory ||
            Object.keys(userFarm.inventory).length === 0
          ) {
            return api.sendMessage(
              `❌ Kho hàng của bạn đang trống!\n` +
                `💡 Thu hoạch cây trồng và vật nuôi để có sản phẩm.`,
              threadID,
              messageID
            );
          }

          const categories = {
            crops: { name: "Nông sản", emoji: "🌾", items: {} },
            animal: { name: "Sản phẩm vật nuôi", emoji: "🥩", items: {} },
            processed: { name: "Sản phẩm chế biến", emoji: "🍲", items: {} },
            event: { name: "Vật phẩm sự kiện", emoji: "🎁", items: {} },
            other: { name: "Khác", emoji: "📦", items: {} },
          };

          let totalValue = 0;
          Object.entries(userFarm.inventory).forEach(([product, count]) => {
            if (count <= 0) return;

            let found = false;
            let productInfo = {
              name: product,
              emoji: "📦",
              price: 0,
              category: "other",
            };

            for (const cropId in CROPS) {
              if (CROPS[cropId].name.toLowerCase() === product.toLowerCase()) {
                productInfo = {
                  name: product,
                  emoji: CROPS[cropId].emoji,
                  price: CROPS[cropId].yield,
                  category: "crops",
                };
                found = true;
                break;
              }
            }

            if (!found) {
              for (const animalId in ANIMALS) {
                if (
                  ANIMALS[animalId].product.toLowerCase() ===
                  product.toLowerCase()
                ) {
                  productInfo = {
                    name: product,
                    emoji: ANIMALS[animalId].productEmoji,
                    price: ANIMALS[animalId].productPrice,
                    category: "animal",
                  };
                  found = true;
                  break;
                }
              }
            }

            if (!found) {
              const currentEvent = checkEvent();
              if (currentEvent && currentEvent.crops) {
                for (const cropId in currentEvent.crops) {
                  if (
                    currentEvent.crops[cropId].name.toLowerCase() ===
                    product.toLowerCase()
                  ) {
                    productInfo = {
                      name: product,
                      emoji: currentEvent.crops[cropId].emoji,
                      price: currentEvent.crops[cropId].yield,
                      category: "event",
                    };
                    found = true;
                    break;
                  }
                }
              }
            }

            categories[productInfo.category].items[product] = {
              count,
              emoji: productInfo.emoji,
              price: productInfo.price,
              value: count * productInfo.price,
            };

            totalValue += count * productInfo.price;
          });

          let message = `🏬 KHO HÀNG CỦA BẠN 🏬\n` + `━━━━━━━━━━━━━━\n\n`;

          let hasItems = false;
          for (const [catId, category] of Object.entries(categories)) {
            const items = Object.entries(category.items);
            if (items.length === 0) continue;

            hasItems = true;
            message += `${category.emoji} ${category.name.toUpperCase()}:\n`;

            items.forEach(([itemName, item]) => {
              message += `┣➤ ${item.emoji} ${itemName}: ${
                item.count
              } (${formatNumber(item.value)} $)\n`;
              if (item.count > 1) {
                message += `┃  💡 Bán tất cả: .farm bán ${itemName}\n`;
                message += `┃  💡 Bán một phần: .farm bán ${itemName} <số lượng>\n`;
              } else {
                message += `┃  💡 Bán: .farm bán ${itemName}\n`;
              }
            });
            message += `\n`;
          }

          message += `━━━━━━━━━━━━━━\n`;
          message += `💰 Tổng giá trị kho: ${formatNumber(totalValue)} $\n`;
          message += `📊 Số lượng vật phẩm: ${
            Object.keys(userFarm.inventory).length
          }\n`;
          message += `💡 Bán tất cả sản phẩm cùng loại: .farm bán <tên_sản_phẩm>\n`;
          message += `💡 Bán số lượng cụ thể: .farm bán <tên_sản_phẩm> <số_lượng>\n`;
          if (
            userFarm.items &&
            Object.keys(userFarm.items).filter(
              (key) => userFarm.items[key].active
            ).length > 0
          ) {
            message += `💡 Bán vật phẩm đã mua: .farm bán vật_phẩm\n`;
          }
          if (userFarm.animals && Object.keys(userFarm.animals).length > 0) {
            message += `💡 Bán vật nuôi: .farm bán gia_súc\n`;
          }
          return api.sendMessage(message, threadID, messageID);
        }
        case "info":
        case "thông_tin": {
          const infoTarget = target[1]?.toLowerCase();
          let message = "";
          const vipMessage = getVIPBenefitsMessage(senderID);
          if (vipMessage) {
            message += vipMessage + "\n";
          }

          if (infoTarget) {
            if (CROPS[infoTarget]) {
              const crop = CROPS[infoTarget];
              return api.sendMessage(
                `📊 THÔNG TIN CÂY TRỒNG\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${crop.emoji} Tên: ${crop.name}\n` +
                  `💰 Giá giống: ${formatNumber(crop.price)} $\n` +
                  `⏱️ Thời gian phát triển: ${
                    Math.floor(crop.time / 3600) > 0
                      ? `${Math.floor(crop.time / 3600)} giờ ${Math.floor(
                          (crop.time % 3600) / 60
                        )} phút`
                      : `${Math.floor(crop.time / 60)} phút`
                  }\n` +
                  `💧 Nước cần thiết: ${crop.water} lần tưới\n` +
                  `💵 Thu hoạch: ${formatNumber(crop.yield)} $\n` +
                  `📈 Lợi nhuận: ${formatNumber(
                    crop.yield - crop.price
                  )} $\n` +
                  `📊 Kinh nghiệm: ${crop.exp} EXP\n` +
                  `🏆 Cấp độ yêu cầu: ${crop.level}\n` +
                  `📝 Mô tả: ${crop.description}\n`,
                threadID,
                messageID
              );
            }

            if (ANIMALS[infoTarget]) {
              const animal = ANIMALS[infoTarget];
              return api.sendMessage(
                `📊 THÔNG TIN VẬT NUÔI\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${animal.emoji} Tên: ${animal.name}\n` +
                  `💰 Giá mua: ${formatNumber(animal.price)} $\n` +
                  `⏱️ Chu kỳ sản xuất: ${Math.floor(
                    animal.productTime / 3600
                  )} giờ\n` +
                  `🍲 Chi phí thức ăn: ${formatNumber(animal.feed)} $/lần\n` +
                  `${animal.productEmoji} Sản phẩm: ${animal.product}\n` +
                  `💵 Giá trị: ${formatNumber(animal.productPrice)} $\n` +
                  `📈 Lợi nhuận/ngày: ${formatNumber(
                    (24 / (animal.productTime / 3600)) * animal.productPrice -
                      (24 / (animal.productTime / 3600)) * animal.feed
                  )} $\n` +
                  `🏆 Cấp độ yêu cầu: ${animal.level}\n` +
                  `📝 Mô tả: ${animal.description}`,
                threadID,
                messageID
              );
            }

            if (SHOP_ITEMS[infoTarget]) {
              const item = SHOP_ITEMS[infoTarget];
              return api.sendMessage(
                `📊 THÔNG TIN VẬT PHẨM\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `${item.emoji} Tên: ${item.name}\n` +
                  `💰 Giá mua: ${formatNumber(item.price)} $\n` +
                  `⏱️ Thời hạn: ${
                    item.duration
                      ? Math.floor(item.duration / (24 * 60 * 60 * 1000)) +
                        " ngày"
                      : "Vĩnh viễn"
                  }\n` +
                  `🔮 Hiệu ứng: ${item.description}\n` +
                  `🏆 Cấp độ yêu cầu: ${item.level}`,
                threadID,
                messageID
              );
            }

            return api.sendMessage(
              `❌ Không tìm thấy thông tin về "${target[1]}"!\n` +
                `💡 Hãy nhập đúng ID của cây trồng, vật nuôi hoặc vật phẩm.\n` +
                `→ Ví dụ: .farm info lua (Lúa)\n` +
                `→ Ví dụ: .farm info ga (Gà)`,
              threadID,
              messageID
            );
          }

          const level = calculateLevel(userFarm.exp);
          const nextLevel =
            level.level < LEVELS.length ? LEVELS[level.level] : null;

          `〔 🌾 THÔNG TIN TRANG TRẠI 🌾 〕\n` +
            `┗━━━━━━━━━━━━━━┛\n\n` +
            `🏆 THÔNG TIN CHUNG\n` +
            `┏━━━━━━━━━━━━━━┓\n` +
            `┣➤ 👨‍🌾 Cấp độ: ${level.level} - ${level.title}\n` +
            `┣➤ 📊 EXP: ${userFarm.exp}/${
              nextLevel ? nextLevel.exp : "MAX"
            }\n` +
            `┃   ${"▰".repeat(
              Math.floor(
                ((userFarm.exp -
                  (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                  ((nextLevel ? nextLevel.exp : userFarm.exp) -
                    (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                  10
              )
            )}${"▱".repeat(
              10 -
                Math.floor(
                  ((userFarm.exp -
                    (level.level > 1 ? LEVELS[level.level - 2].exp : 0)) /
                    ((nextLevel ? nextLevel.exp : userFarm.exp) -
                      (level.level > 1 ? LEVELS[level.level - 2].exp : 0))) *
                    10
                )
            )}\n` +
            `┣➤ 🏡 Ngày thành lập: ${new Date(
              userFarm.createdAt
            ).toLocaleDateString("vi-VN")}\n` +
            `┗━━━━━━━━━━━━━━┛\n\n`;

          const weather = getCurrentWeather(senderID);

          message +=
            `🌤️ ĐIỀU KIỆN THỜI TIẾT\n` +
            `┏━━━━━━━━━━━━━━┓\n` +
            `┣➤ ${weather.emoji} ${weather.name}\n` +
            `┣➤ ${weather.description}\n` +
            `┗━━━━━━━━━━━━━━┛\n\n`;

          let plotsReady = 0;
          let plotsGrowing = 0;
          let plotsEmpty = 0;
          let plotsDamaged = 0;

          userFarm.plots.forEach((plot) => {
            if (plot.status === "ready") plotsReady++;
            else if (plot.status === "growing") plotsGrowing++;
            else if (plot.status === "empty") plotsEmpty++;
            else if (plot.status === "damaged") plotsDamaged++;
          });

          message +=
            `🌱 TÌNH HÌNH TRỒNG TRỌT\n` +
            `┏━━━━━━━━━━━━━┓\n` +
            `┣➤ Tổng số ô đất: ${userFarm.plots.length} ô\n` +
            `┣➤ 📊 Thống kê:\n` +
            `┃   ✅ Sẵn sàng thu hoạch: ${plotsReady} ô\n` +
            `┃   🌿 Đang phát triển: ${plotsGrowing} ô\n` +
            `┃   ⚠️ Bị hư hỏng: ${plotsDamaged} ô\n` +
            `┃   🔲 Còn trống: ${plotsEmpty} ô\n`;

          const growingPlots = userFarm.plots.filter(
            (plot) => plot.status === "growing"
          );
          if (growingPlots.length > 0) {
            message += `┣➤ 🌿 CÂY ĐANG TRỒNG:\n`;

            const cropCounts = {};
            growingPlots.forEach((plot) => {
              if (!plot.crop) return;
              const cropId = plot.crop;
              const cropConfig =
                CROPS[cropId] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[cropId]
                  : null);

              if (cropConfig) {
                if (!cropCounts[cropId]) {
                  cropCounts[cropId] = {
                    count: 0,
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                  };
                }
                cropCounts[cropId].count++;
              }
            });

            Object.values(cropCounts).forEach((crop) => {
              message += `┃   ${crop.emoji} ${crop.name}: ${crop.count} ô\n`;
            });
          }
          message += `┗━━━━━━━━━━━━━┛\n\n`;

          const animalCount = Object.keys(userFarm.animals || {}).length;
          message +=
            `🐄 TÌNH HÌNH CHĂN NUÔI\n` +
            `┏━━━━━━━━━━━━━┓\n` +
            `┣➤ Tổng số vật nuôi: ${animalCount} con\n`;

          if (animalCount > 0) {
            message += `┣➤ 📊 THỐNG KÊ:\n`;

            const animalCounts = {};
            Object.entries(userFarm.animals || {}).forEach(([_, animal]) => {
              if (!animal.type) return;
              const animalType = animal.type;
              if (!animalCounts[animalType]) {
                animalCounts[animalType] = {
                  count: 0,
                  ready: 0,
                  name: ANIMALS[animalType]?.name || animalType,
                  emoji: ANIMALS[animalType]?.emoji || "🐾",
                };
              }
              animalCounts[animalType].count++;
              if (animal.productReady) animalCounts[animalType].ready++;
            });

            Object.values(animalCounts).forEach((animal) => {
              message += `┃   ${animal.emoji} ${animal.name}: ${animal.count} con (${animal.ready} sẵn sàng)\n`;
            });

            let estimatedDailyIncome = 0;
            Object.entries(animalCounts).forEach(([type, info]) => {
              if (ANIMALS[type]) {
                const animal = ANIMALS[type];
                const dailyYield = 24 / (animal.productTime / 3600);
                estimatedDailyIncome +=
                  dailyYield * animal.productPrice * info.count;
              }
            });
            message += `┣➤ 💰 Ước tính thu nhập/ngày: ${formatNumber(
              Math.floor(estimatedDailyIncome)
            )} $\n`;
          }

          message += `┗━━━━━━━━━━━━━┛\n\n`;

          const inventoryEntries = Object.entries(userFarm.inventory || {});
          if (inventoryEntries.length > 0) {
            message += `🧺 KHO HÀNG\n` + `┏━━━━━━━━━━━━━┓\n`;

            let totalInventoryValue = 0;
            inventoryEntries.forEach(([item, quantity]) => {
              if (quantity <= 0) return;

              let emoji = "📦";
              let productPrice = 0;

              for (const animalId in ANIMALS) {
                if (ANIMALS[animalId].product === item) {
                  emoji = ANIMALS[animalId].productEmoji;
                  productPrice = ANIMALS[animalId].productPrice;
                  break;
                }
              }

              const itemValue = quantity * productPrice;
              totalInventoryValue += itemValue;
              message += `┣➤ ${emoji} ${item}: ${quantity} (${formatNumber(
                itemValue
              )} $)\n`;
            });

            message +=
              `┣➤ 💰 Tổng giá trị: ${formatNumber(totalInventoryValue)} $\n` +
              `┗━━━━━━━━━━━━━━┛\n\n`;
          }

          const activeItems = Object.entries(userFarm.items || {}).filter(
            ([_, item]) =>
              item.active && (!item.expiry || item.expiry > Date.now())
          );

          if (activeItems.length > 0) {
            message += `🔮 VẬT PHẨM ĐANG SỬ DỤNG\n` + `┏━━━━━━━━━━━━━┓\n`;

            activeItems.forEach(([itemId, item]) => {
              const shopItem = SHOP_ITEMS[itemId];
              if (!shopItem) return;

              const timeLeft = item.expiry
                ? Math.max(
                    0,
                    Math.floor((item.expiry - Date.now()) / (60 * 60 * 1000))
                  )
                : "∞";

              message += `┣➤ ${shopItem.emoji} ${shopItem.name}: ${
                timeLeft === "∞" ? "Vĩnh viễn" : `${timeLeft} giờ còn lại`
              }\n`;
            });

            message += `┗━━━━━━━━━━━━━┛\n\n`;
          }

          const effects = applyItemEffects(userFarm);
          message += `🔄 HIỆU ỨNG ĐANG ÁP DỤNG\n` + `┏━━━━━━━━━━━━━━┓\n`;

          if (effects.growBoost !== 1) {
            message += `┣➤ ⏱️ Tăng tốc phát triển: ${Math.round(
              (1 - effects.growBoost) * 100
            )}%\n`;
          }

          if (effects.yieldBoost !== 1) {
            message += `┣➤ 🌿 Tăng sản lượng: ${Math.round(
              (effects.yieldBoost - 1) * 100
            )}%\n`;
          }

          if (effects.expBoost !== 1) {
            message += `┣➤ 📊 Tăng kinh nghiệm: ${Math.round(
              ((effects.expBoost - 1) * 100) / 2
            )}%\n`;
          }

          if (effects.autoPlant) {
            message += `┣➤ 🌱 Tự động trồng lại cây sau thu hoạch\n`;
          }

          if (effects.autoPlant) {
            message += `┣➤ 🌱 Tự động trồng lại cây sau thu hoạch\n`;
          }

          if (effects.autoWater) {
            message += `┣➤ 💧 Tự động tưới cây mỗi 4 giờ\n`;
          }

          message +=
            `┗━━━━━━━━━━━━━━┛\n\n` +
            `💡 Xem chi tiết về cây/vật nuôi:\n→ .farm info <tên_cây/tên_vật_nuôi>`;
          return api.sendMessage(message, threadID, messageID);
        }

        case "tưới":
        case "tuoi":
        case "water": {
          const plotNumber = parseInt(target[1]) - 1;

          if (isNaN(plotNumber)) {
            let needWaterPlots = userFarm.plots.filter((plot) => {
              if (plot.status !== "growing") return false;

              const cropId = plot.crop;
              if (!cropId) return false;

              const cropConfig =
                CROPS[cropId] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[cropId]
                  : null);

              if (!cropConfig || cropConfig.water === 0) return false;
              return plot.water < cropConfig.water;
            });

            if (needWaterPlots.length === 0) {
              return api.sendMessage(
                `✅ Tất cả cây trồng đều đã được tưới đủ nước hoặc không cần tưới!`,
                threadID,
                messageID
              );
            }

            let wateredCount = 0;
            let wateredCrops = {};

            needWaterPlots.forEach((plot) => {
              const cropId = plot.crop;
              const cropConfig =
                CROPS[cropId] ||
                (checkEvent() && checkEvent().crops
                  ? checkEvent().crops[cropId]
                  : null);

              if (cropConfig) {
                plot.water = Math.min(cropConfig.water, plot.water + 1);
                plot.lastWatered = Date.now();
                wateredCount++;

                if (!wateredCrops[cropId]) {
                  wateredCrops[cropId] = {
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                    count: 0,
                  };
                }
                wateredCrops[cropId].count++;
              }
            });

            saveFarmData(farmData);

            let message = `✅ Đã tưới nước cho ${wateredCount} ô đất thành công!\n\n`;
            message += `📋 CHI TIẾT:\n`;

            Object.values(wateredCrops).forEach((crop) => {
              message += `${crop.emoji} ${crop.name}: ${crop.count} ô\n`;
            });

            return api.sendMessage(message, threadID, messageID);
          }

          if (plotNumber < 0 || plotNumber >= userFarm.plots.length) {
            return api.sendMessage(
              `❌ Ô đất không tồn tại!\n` +
                `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
              threadID,
              messageID
            );
          }

          const plot = userFarm.plots[plotNumber];
          if (plot.status !== "growing") {
            return api.sendMessage(
              `❌ Ô đất ${plotNumber + 1} không có cây đang phát triển!`,
              threadID,
              messageID
            );
          }

          const cropConfig =
            CROPS[plot.crop] ||
            (checkEvent() && checkEvent().crops
              ? checkEvent().crops[plot.crop]
              : null);

          if (!cropConfig) {
            return api.sendMessage(
              `❌ Lỗi dữ liệu cây trồng!`,
              threadID,
              messageID
            );
          }

          if (cropConfig.water === 0) {
            return api.sendMessage(
              `❌ ${cropConfig.name} không cần tưới nước!`,
              threadID,
              messageID
            );
          }

          if (plot.water >= cropConfig.water) {
            return api.sendMessage(
              `❌ ${cropConfig.name} đã được tưới đủ nước!`,
              threadID,
              messageID
            );
          }

          plot.water = Math.min(cropConfig.water, plot.water + 1);
          plot.lastWatered = Date.now();

          updateMissionProgress(userFarm, "water", 1);
          saveFarmData(farmData);

          return api.sendMessage(
            `✅ Đã tưới nước cho ${cropConfig.emoji} ${
              cropConfig.name
            } tại ô đất ${plotNumber + 1}!\n` +
              `💧 Nước hiện tại: ${Math.round(plot.water)}/${cropConfig.water}`,
            threadID,
            messageID
          );
        }

        case "thu":
        case "thu_hoach":
        case "harvest": {
          const plotNumber = parseInt(target[1]) - 1;
          let seasonalMessage = "";

          if (isNaN(plotNumber)) {
            let readyPlots = userFarm.plots.filter(
              (plot) => plot.status === "ready"
            );

            let growingPlots = userFarm.plots.filter(
              (plot) => plot.status === "growing" && plot.crop
            );

            if (readyPlots.length === 0 && growingPlots.length === 0) {
              return api.sendMessage(
                `❌ Bạn chưa trồng cây nào trong trang trại!\n` +
                  `💡 Sử dụng .farm trồng để bắt đầu trồng cây.`,
                threadID,
                messageID
              );
            }

            if (readyPlots.length === 0) {
              let message =
                `⏳ KHÔNG CÓ CÂY SẴN SÀNG THU HOẠCH\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🌱 Các cây đang phát triển:\n\n`;

              let growingCrops = {};

              let harvestDetails = {};

              growingPlots.forEach((plot, index) => {
                const cropId = plot.crop;
                const cropConfig =
                  CROPS[cropId] ||
                  (checkEvent() && checkEvent().crops
                    ? checkEvent().crops[cropId]
                    : null);

                if (!cropConfig) return;

                if (!harvestDetails[cropId]) {
                  harvestDetails[cropId] = {
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                    count: 0,
                    exp: 0,
                  };
                }

                const effects = applyItemEffects(userFarm);
                const growTime = cropConfig.time * 1000 * effects.growBoost;
                const elapsedTime = Date.now() - plot.plantedAt;
                const remainingTime = Math.max(0, growTime - elapsedTime);
                const remainingHours = Math.floor(
                  remainingTime / (60 * 60 * 1000)
                );
                const remainingMinutes = Math.floor(
                  (remainingTime % (60 * 60 * 1000)) / (60 * 1000)
                );

                if (!growingCrops[cropId]) {
                  growingCrops[cropId] = {
                    config: cropConfig,
                    plots: [],
                    shortestTime: { hours: 999, minutes: 59 },
                  };
                }

                growingCrops[cropId].plots.push({
                  plotIndex: userFarm.plots.indexOf(plot),
                  timeLeft: {
                    hours: remainingHours,
                    minutes: remainingMinutes,
                  },
                });

                if (
                  remainingHours < growingCrops[cropId].shortestTime.hours ||
                  (remainingHours === growingCrops[cropId].shortestTime.hours &&
                    remainingMinutes <
                      growingCrops[cropId].shortestTime.minutes)
                ) {
                  growingCrops[cropId].shortestTime = {
                    hours: remainingHours,
                    minutes: remainingMinutes,
                  };
                }
              });

              if (Object.keys(harvestDetails).length > 0) {
                const firstCropId = Object.keys(harvestDetails)[0];
                const seasonalEffects = getSeasonalEffects(firstCropId);

                if (seasonalEffects.yieldBonus > 1) {
                  seasonalMessage = `\n🌟 Bonus mùa vụ: +${Math.floor(
                    (seasonalEffects.yieldBonus - 1) * 100
                  )}% sản lượng!`;
                } else if (seasonalEffects.yieldBonus < 1) {
                  seasonalMessage = `\n⚠️ Penalty mùa vụ: -${Math.floor(
                    (1 - seasonalEffects.yieldBonus) * 100
                  )}% sản lượng!`;
                }
              }
              Object.values(growingCrops).forEach((crop) => {
                const timeText =
                  crop.shortestTime.hours > 0
                    ? `${crop.shortestTime.hours} giờ ${crop.shortestTime.minutes} phút`
                    : `${crop.shortestTime.minutes} phút`;

                message += `${crop.config.emoji} ${crop.config.name} (${crop.plots.length} cây)\n`;
                message += `⏱️ Thu hoạch sớm nhất sau: ${timeText}\n`;
                message += `🌱 Các ô: ${crop.plots
                  .map((p) => p.plotIndex + 1)
                  .join(", ")}\n\n`;
              });

              message += `💡 Sử dụng .farm tưới để tưới nước cho cây và giúp chúng phát triển nhanh hơn.`;

              return api.sendMessage(message, threadID, messageID);
            }

            let totalExp = 0;
            let harvestedCount = 0;
            let autoReplantCount = 0;
            let harvestDetails = {};

            try {
              for (const plot of readyPlots) {
                const cropId = plot.crop;
                if (!cropId) continue;

                let cropConfig = CROPS[cropId];
                if (!cropConfig) {
                  const currentEvent = checkEvent();
                  if (
                    currentEvent &&
                    currentEvent.crops &&
                    currentEvent.crops[cropId]
                  ) {
                    cropConfig = currentEvent.crops[cropId];
                  } else {
                    continue;
                  }
                }

                const effects = applyItemEffects(userFarm);

                const yieldAmount = Math.floor(
                  cropConfig.yield * effects.yieldBoost
                );
                const expAmount = Math.floor(cropConfig.exp * effects.expBoost);

                if (!userFarm.inventory) userFarm.inventory = {};

                const productName = cropConfig.name.toLowerCase();
                if (!userFarm.inventory[productName])
                  userFarm.inventory[productName] = 0;

                userFarm.inventory[productName]++;

                totalExp += expAmount;
                harvestedCount++;

                if (!harvestDetails[cropId]) {
                  harvestDetails[cropId] = {
                    name: cropConfig.name,
                    emoji: cropConfig.emoji,
                    count: 0,
                    exp: 0,
                  };
                }
                harvestDetails[cropId].count++;
                harvestDetails[cropId].exp += expAmount;

                plot.status = "empty";
                plot.crop = null;
                plot.plantedAt = null;
                plot.water = 0;
                plot.lastWatered = null;

                if (effects.autoPlant) {
                  const userBalance = await getBalance(senderID);
                  if (userBalance >= cropConfig.price) {
                    await updateBalance(senderID, -cropConfig.price);
                    plot.status = "growing";
                    plot.crop = cropId;
                    plot.plantedAt = Date.now();
                    plot.water = cropConfig.water > 0 ? 1 : 0;
                    plot.lastWatered = Date.now();
                    autoReplantCount++;
                  }
                }
              }

              let growingCropsInfo = "";
              if (growingPlots.length > 0) {
                let growingCrops = {};

                growingPlots.forEach((plot) => {
                  const cropId = plot.crop;
                  const cropConfig =
                    CROPS[cropId] ||
                    (checkEvent() && checkEvent().crops
                      ? checkEvent().crops[cropId]
                      : null);

                  if (!cropConfig) return;

                  const effects = applyItemEffects(userFarm);
                  const growTime = cropConfig.time * 1000 * effects.growBoost;
                  const elapsedTime = Date.now() - plot.plantedAt;
                  const remainingTime = Math.max(0, growTime - elapsedTime);
                  const remainingHours = Math.floor(
                    remainingTime / (60 * 60 * 1000)
                  );
                  const remainingMinutes = Math.floor(
                    (remainingTime % (60 * 60 * 1000)) / (60 * 1000)
                  );

                  if (!growingCrops[cropId]) {
                    growingCrops[cropId] = {
                      config: cropConfig,
                      count: 0,
                      shortestTime: { hours: 999, minutes: 59 },
                    };
                  }

                  growingCrops[cropId].count++;

                  if (
                    remainingHours < growingCrops[cropId].shortestTime.hours ||
                    (remainingHours ===
                      growingCrops[cropId].shortestTime.hours &&
                      remainingMinutes <
                        growingCrops[cropId].shortestTime.minutes)
                  ) {
                    growingCrops[cropId].shortestTime = {
                      hours: remainingHours,
                      minutes: remainingMinutes,
                    };
                  }
                });

                growingCropsInfo = `\n\n🌱 CÂY ĐANG PHÁT TRIỂN:\n`;
                Object.values(growingCrops).forEach((crop) => {
                  const timeText =
                    crop.shortestTime.hours > 0
                      ? `${crop.shortestTime.hours} giờ ${crop.shortestTime.minutes} phút`
                      : `${crop.shortestTime.minutes} phút`;

                  growingCropsInfo += `${crop.config.emoji} ${crop.config.name}: ${crop.count} cây (${timeText})\n`;
                });
              }

              userFarm.exp += totalExp;

              const oldLevel = calculateLevel(userFarm.exp - totalExp).level;
              const newLevel = calculateLevel(userFarm.exp).level;

              updateMissionProgress(userFarm, "harvest", 1);
              saveFarmData(farmData);

              let message =
                `✅ THU HOẠCH THÀNH CÔNG!\n` +
                `━━━━━━━━━━━━━━━\n` +
                `🌾 Đã thu hoạch: ${harvestedCount} cây trồng\n`;

              if (autoReplantCount > 0) {
                message += `🌱 Tự động trồng lại: ${autoReplantCount} cây\n`;
              }

              message += `\n📋 CHI TIẾT THU HOẠCH:\n`;

              Object.values(harvestDetails).forEach((details) => {
                message += `${details.emoji} ${details.name}: ${details.count} (vào kho), +${details.exp} EXP\n`;
              });

              message += `\n📊 Tổng kinh nghiệm: +${totalExp} EXP\n`;
              message += `📦 Sản phẩm đã được thêm vào kho!\n`;
              message += `💡 Xem kho: .farm kho\n`;

              message += growingCropsInfo;
              message += seasonalMessage;

              if (newLevel > oldLevel) {
                const newLevelData = LEVELS[newLevel - 1];
                message += `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
                message += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
                message += `💰 Phần thưởng: +${formatNumber(
                  newLevelData.reward
                )} $\n`;

                if (newLevelData.plotSize > userFarm.plots.length) {
                  const newPlotsCount =
                    newLevelData.plotSize - userFarm.plots.length;
                  message += `🌱 Mở khóa: ${newPlotsCount} ô đất mới\n`;

                  for (let i = 0; i < newPlotsCount; i++) {
                    userFarm.plots.push({
                      id: userFarm.plots.length,
                      status: "empty",
                      crop: null,
                      plantedAt: null,
                      water: 0,
                      lastWatered: null,
                    });
                  }

                  await updateBalance(senderID, newLevelData.reward);
                  saveFarmData(farmData);
                }
              }

              updateQuestProgress(senderID, "farm_harvest", harvestedCount);

              return api.sendMessage(message, threadID, messageID);
            } catch (error) {
              console.error("Error during mass harvest:", error);
              return api.sendMessage(
                `❌ Có lỗi xảy ra khi thu hoạch: ${error.message}\n` +
                  `💡 Hãy thử thu hoạch từng ô riêng: .farm thu [số ô]`,
                threadID,
                messageID
              );
            }
          }

          const plot = userFarm.plots[plotNumber];
          if (!plot) {
            return api.sendMessage(
              `❌ Ô đất số ${plotNumber + 1} không tồn tại!\n` +
                `🌱 Bạn có ${userFarm.plots.length} ô đất (từ 1 đến ${userFarm.plots.length})`,
              threadID,
              messageID
            );
          }

          if (plot.status !== "ready") {
            return api.sendMessage(
              `❌ Ô đất số ${plotNumber + 1} chưa sẵn sàng thu hoạch!\n` +
                `🌱 Trạng thái hiện tại: ${plot.status}`,
              threadID,
              messageID
            );
          }

          const cropId = plot.crop;
          if (!cropId) {
            return api.sendMessage(
              `❌ Lỗi dữ liệu: Không tìm thấy cây trồng trong ô ${
                plotNumber + 1
              }!`,
              threadID,
              messageID
            );
          }

          let cropConfig = CROPS[cropId];
          if (!cropConfig) {
            const currentEvent = checkEvent();
            if (
              currentEvent &&
              currentEvent.crops &&
              currentEvent.crops[cropId]
            ) {
              cropConfig = currentEvent.crops[cropId];
            } else {
              return api.sendMessage(
                `❌ Lỗi dữ liệu: Không tìm thấy thông tin về cây trồng!`,
                threadID,
                messageID
              );
            }
          }

          const effects = applyItemEffects(userFarm);
          const expAmount = Math.floor(cropConfig.exp * effects.expBoost);

          if (!userFarm.inventory) userFarm.inventory = {};

          const productName = cropConfig.name.toLowerCase();
          if (!userFarm.inventory[productName])
            userFarm.inventory[productName] = 0;

          userFarm.inventory[productName]++;
          userFarm.exp += expAmount;

          const oldLevel = calculateLevel(userFarm.exp - expAmount).level;
          const newLevel = calculateLevel(userFarm.exp).level;

          plot.status = "empty";
          plot.crop = null;
          plot.plantedAt = null;
          plot.water = 0;
          plot.lastWatered = null;

          let replantMessage = "";
          if (effects.autoPlant) {
            const userBalance = await getBalance(senderID);
            if (userBalance >= cropConfig.price) {
              await updateBalance(senderID, -cropConfig.price);
              plot.status = "growing";
              plot.crop = cropId;
              plot.plantedAt = Date.now();
              plot.water = cropConfig.water > 0 ? 1 : 0;
              plot.lastWatered = Date.now();
              replantMessage = `\n🌱 Đã tự động trồng lại ${cropConfig.name}!`;
            }
          }

          saveFarmData(farmData);

          let message =
            `✅ Thu hoạch thành công ${cropConfig.emoji} ${
              cropConfig.name
            } tại ô đất ${plotNumber + 1}!\n` +
            `📦 Đã thêm 1 ${cropConfig.name.toLowerCase()} vào kho!\n` +
            `📊 Kinh nghiệm: +${expAmount} EXP` +
            replantMessage;

          if (newLevel > oldLevel) {
            const newLevelData = LEVELS[newLevel - 1];
            message += `\n\n🎉 CHÚC MỪNG! Bạn đã lên cấp ${newLevel}!\n`;
            message += `🏆 Danh hiệu mới: ${newLevelData.title}\n`;
            message += `💰 Phần thưởng: +${formatNumber(
              newLevelData.reward
            )} $\n`;

            if (newLevelData.plotSize > userFarm.plots.length) {
              const newPlotsCount =
                newLevelData.plotSize - userFarm.plots.length;
              message += `🌱 Mở khóa: ${newPlotsCount} ô đất mới`;

              for (let i = 0; i < newPlotsCount; i++) {
                userFarm.plots.push({
                  id: userFarm.plots.length,
                  status: "empty",
                  crop: null,
                  plantedAt: null,
                  water: 0,
                  lastWatered: null,
                });
              }
            }

            await updateBalance(senderID, newLevelData.reward);
            saveFarmData(farmData);
          }

          updateQuestProgress(senderID, "farm_harvest", 1);

          return api.sendMessage(message, threadID, messageID);
        }
        case "help":
        case "hướng_dẫn": {
          const helpPage = parseInt(target[1]) || 1;

          if (helpPage === 1) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🔰 TỔNG QUAN:\n` +
                `• Xây dựng và phát triển trang trại của riêng bạn\n` +
                `• Trồng cây, thu hoạch nông sản\n` +
                `• Chăn nuôi các loại vật nuôi\n` +
                `• Bán sản phẩm để kiếm xu\n` +
                `• Cây trồng sẽ bị hỏng nếu không thu hoạch trong vòng 2 giờ sau khi sẵn sàng\n` +
                `• Nâng cấp để mở khóa thêm đất và vật nuôi\n\n` +
                `📝 DANH SÁCH LỆNH:\n\n` +
                `🌱 TRỒNG TRỌT:\n` +
                `→ .farm - Xem trang trại của bạn\n` +
                `→ .farm trồng - Xem danh sách cây trồng\n` +
                `→ .farm trồng <cây> <số ô> - Trồng cây vào ô đất\n` +
                `→ .farm tưới - Tưới nước cho tất cả cây\n` +
                `→ .farm tưới <số ô> - Tưới nước cây cụ thể\n` +
                `→ .farm thu - Thu hoạch tất cả cây đã sẵn sàng\n` +
                `→ .farm thu <số ô> - Thu hoạch cây ở ô cụ thể\n\n` +
                `→ .farm help 2 - Xem trang hướng dẫn tiếp theo`,
              threadID,
              messageID
            );
          } else if (helpPage === 2) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN (2) 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🐄 CHĂN NUÔI:\n` +
                `→ .farm shop animals - Xem và mua vật nuôi\n` +
                `→ .farm feed <loại> - Cho vật nuôi ăn\n` +
                `→ .farm collect - Thu thập sản phẩm từ vật nuôi\n` +
                `→ .farm bán_gia_súc - Xem và bán vật nuôi\n\n` +
                `👨‍🍳 CHẾ BIẾN NÔNG SẢN:\n` +
                `→ .farm process - Xem các công thức chế biến\n` +
                `→ .farm process <món_ăn> <số_lượng> - Chế biến món ăn\n` +
                `→ .farm collect_processed - Thu sản phẩm đã chế biến xong\n\n` +
                `💰 MUA SẮM & BÁN HÀNG:\n` +
                `→ .farm sell_items - bán nhanh tất cả\n` +
                `→ .farm shop - Xem các danh mục cửa hàng\n` +
                `→ .farm shop cây - Mua giống cây trồng\n` +
                `→ .farm shop items - Mua vật phẩm nâng cao\n` +
                `→ .farm bán - Xem kho hàng của bạn\n` +
                `→ .farm bán <sản phẩm> <số_lượng> - Bán sản phẩm\n\n` +
                `→ .farm help 3 - Xem trang hướng dẫn tiếp theo`,
              threadID,
              messageID
            );
          } else if (helpPage === 3) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN (3) 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `ℹ️ XEM THÔNG TIN:\n` +
                `→ .farm info - Xem chi tiết trang trại của bạn\n` +
                `→ .farm info <cây/vật nuôi> - Xem thông tin cụ thể\n\n` +
                `🌧️ THỜI TIẾT & SỰ KIỆN:\n` +
                `• Thời tiết thay đổi mỗi 6 giờ và ảnh hưởng đến cây trồng\n` +
                `• Sunny (Nắng): Cây sinh trưởng tốt, +10% sản lượng\n` +
                `• Rainy (Mưa): Tự động tưới cây, +5% sản lượng\n` +
                `• Cloudy (Âm u): Không có tác động đặc biệt\n` +
                `• Storm (Bão): Cây có thể bị hư hại, thu hoạch sớm\n` +
                `• Drought (Hạn hán): Nước bay hơi nhanh hơn\n\n` +
                `🎉 Sự kiện đặc biệt: Tết và Trung thu với cây trồng độc quyền!\n\n` +
                `→ .farm help 4 - Xem trang hướng dẫn tiếp theo`,
              threadID,
              messageID
            );
          } else if (helpPage === 4) {
            return api.sendMessage(
              `🌾 NÔNG TRẠI VUI VẺ - HƯỚNG DẪN (4) 🌾\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `🏆 HỆ THỐNG CẤP ĐỘ:\n` +
                `• Mỗi cấp độ mở khóa thêm cây trồng, vật nuôi mới\n` +
                `• Cấp độ càng cao, diện tích đất canh tác càng lớn\n` +
                `• Kinh nghiệm (EXP) nhận được khi thu hoạch cây\n` +
                `• Lên cấp nhận được phần thưởng xu\n\n` +
                `🔮 VẬT PHẨM ĐẶC BIỆT:\n` +
                `• Phân bón: Giảm 20% thời gian trồng trọt\n` +
                `• Thuốc sâu: Tăng 20% sản lượng thu hoạch\n` +
                `• Máy cày: Tự động trồng lại sau thu hoạch\n` +
                `• Hệ thống tưới: Tự động tưới nước mỗi 4 giờ\n` +
                `• Chuồng trại nâng cấp: Tăng số lượng vật nuôi tối đa\n` +
                `• Thức ăn gia súc: Tăng 30% sản lượng từ vật nuôi\n` +
                `• Giống cây cao cấp: Tăng 50% kinh nghiệm từ trồng trọt\n\n` +
                `💡 MẸO CHƠI:\n` +
                `• Tập trung vào cây ngắn ngày để tích lũy EXP nhanh\n` +
                `• Đầu tư vào vật nuôi để có thu nhập thụ động\n` +
                `• Mua các vật phẩm vĩnh viễn trước khi mua tạm thời\n` +
                `• Theo dõi thời tiết để tối ưu hóa thu hoạch`,
              threadID,
              messageID
            );
          } else {
            return api.sendMessage(
              `❌ Trang hướng dẫn không hợp lệ! Chỉ có trang 1-4.\n` +
                `→ Sử dụng: .farm help <số trang>`,
              threadID,
              messageID
            );
          }
        }

        case "cửa_hàng":
        case "shop": {
          const shopType = target[1]?.toLowerCase();
          const buyItem = target[2]?.toLowerCase();
          const currentLevel = calculateLevel(userFarm.exp).level;

          const vipBenefits = getVIPBenefits(senderID);
          const isVip = isUserVIP(senderID);

          const vipGrowthBonus = isVip
            ? Math.floor((vipBenefits?.cooldownReduction || 0) * 0.7)
            : 0;
          const vipYieldBonus = isVip
            ? Math.floor((vipBenefits?.workBonus || 0) * 0.7)
            : 0;
          const vipExpBonus =
            isVip && vipBenefits?.fishExpMultiplier
              ? Math.floor(
                  ((vipBenefits.fishExpMultiplier - 1) * 100 * 0.7) / 2
                )
              : 0;
          const vipAnimalBonus =
            isVip && vipBenefits?.rareBonus
              ? Math.floor(vipBenefits.rareBonus * 100 * 0.8)
              : 0;
          const vipDiscount = isVip
            ? Math.floor((vipBenefits?.shopDiscount || 0) * 0.9)
            : 0;

          if (!shopType) {
            const vipMessage =
              isVip &&
              (vipGrowthBonus > 0 ||
                vipYieldBonus > 0 ||
                vipExpBonus > 0 ||
                vipAnimalBonus > 0 ||
                vipDiscount > 0)
                ? `👑 ĐẶC QUYỀN VIP CỦA BẠN:\n` +
                  (vipDiscount > 0
                    ? `• 💰 Giảm giá mua sắm: -${vipDiscount}%\n`
                    : "") +
                  (vipGrowthBonus > 0
                    ? `• ⏱️ Giảm thời gian trồng: -${vipGrowthBonus}%\n`
                    : "") +
                  (vipYieldBonus > 0
                    ? `• 📈 Tăng sản lượng cây: +${vipYieldBonus}%\n`
                    : "") +
                  (vipAnimalBonus > 0
                    ? `• 🐄 Tăng sản lượng vật nuôi: +${vipAnimalBonus}%\n`
                    : "") +
                  `\n`
                : "";

            return api.sendMessage(
              "🏪 CỬA HÀNG NÔNG TRẠI 🏪\n" +
                "━━━━━━━━━━━━━━━━━━\n\n" +
                (vipMessage ? vipMessage : "") +
                "1️⃣ Cây trồng:\n" +
                "→ .farm shop cây\n\n" +
                "2️⃣ Vật nuôi:\n" +
                "→ .farm shop animals\n\n" +
                "3️⃣ Vật phẩm:\n" +
                "→ .farm shop items\n\n" +
                "4️⃣ Bán sản phẩm:\n" +
                "→ .farm bán <sản phẩm> <số lượng>",
              threadID,
              messageID
            );
          }

          if (
            shopType === "cây" ||
            shopType === "cay" ||
            shopType === "crops"
          ) {
            let currentPage = 1;
            const currentSeason = getCurrentSeason();
            let message = `🌱 CỬA HÀNG CÂY TRỒNG 🌱\n━━━━━━━━━━━━━━━━━━\n\n`;

            message += `${
              currentSeason.emoji
            } Hiện đang là ${currentSeason.name.toUpperCase()} (Tháng ${currentSeason.months.join(
              ", "
            )})\n`;
            message += `━━━━━━━━━━━━━━━━━━\n\n`;

            if (target[2] && !isNaN(parseInt(target[2]))) {
              currentPage = parseInt(target[2]);
            } else {
              const pageParam = target.find(
                (arg) =>
                  arg.match(/^trang[0-9]+$/i) || arg.match(/^page[0-9]+$/i)
              );
              if (pageParam) {
                currentPage = parseInt(pageParam.replace(/trang|page/i, ""));
              }
            }

            if (currentPage < 1) currentPage = 1;

            const seasonalCrops = Object.entries(CROPS)
              .filter(([id, crop]) => {
                return (
                  crop.seasons &&
                  (crop.seasons[currentSeason.key] || crop.seasons.ALL)
                );
              })
              .map(([id, crop]) => ({
                id,
                ...crop,
                isCurrentSeason:
                  crop.seasons && crop.seasons[currentSeason.key],
                isAllSeason: crop.seasons && crop.seasons.ALL,
              }));

            seasonalCrops.sort((a, b) => {
              if (a.isCurrentSeason && !b.isCurrentSeason) return -1;
              if (!a.isCurrentSeason && b.isCurrentSeason) return 1;
              return a.level - b.level;
            });

            const itemsPerPage = 6;
            const totalPages = Math.ceil(seasonalCrops.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const displayCrops = seasonalCrops
              .filter((crop) => crop.level <= currentLevel)
              .slice(startIndex, startIndex + itemsPerPage);

            const lockedCount = seasonalCrops.filter(
              (crop) => crop.level > currentLevel
            ).length;

            let vipInfo = "";
            if (
              isVip &&
              (vipGrowthBonus > 0 || vipYieldBonus > 0 || vipExpBonus > 0)
            ) {
              vipInfo = `👑 ĐẶC QUYỀN VIP CỦA BẠN:\n`;
              if (vipGrowthBonus > 0) {
                vipInfo += `┣➤ ⏱️ Giảm thời gian trồng: -${vipGrowthBonus}%\n`;
              }
              if (vipYieldBonus > 0) {
                vipInfo += `┣➤ 💰 Tăng sản lượng: +${vipYieldBonus}%\n`;
              }
              if (vipExpBonus > 0) {
                vipInfo += `┣➤ 📊 Tăng kinh nghiệm: +${vipExpBonus}%\n`;
              }
              vipInfo += `┗━━━━━━━━━━━━━━━━━━\n\n`;
            }

            if (vipInfo) {
              message += vipInfo;
            }

            const currentEvent = checkEvent();
            if (currentEvent && currentEvent.crops) {
              message += `🎉 CÂY TRỒNG SỰ KIỆN:\n`;
              Object.entries(currentEvent.crops)
                .slice(0, 2)
                .forEach(([id, crop]) => {
                  const vipYield =
                    vipYieldBonus > 0
                      ? Math.floor(crop.yield * (1 + vipYieldBonus / 100))
                      : 0;
                  const vipTime =
                    vipGrowthBonus > 0
                      ? Math.floor(crop.time * (1 - vipGrowthBonus / 100))
                      : 0;

                  message += `${crop.emoji} ${crop.name}: ${formatNumber(
                    crop.price
                  )}xu → ${formatNumber(crop.yield)}xu`;
                  if (vipYieldBonus > 0) {
                    message += ` → 👑 ${formatNumber(vipYield)}xu`;
                  }
                  message += `\n`;

                  if (vipGrowthBonus > 0) {
                    const normalTime = Math.floor(crop.time / 60);
                    const vipTimeMinutes = Math.floor(vipTime / 60);
                    message += `⏱️ ${normalTime}p → 👑 ${vipTimeMinutes}p (-${vipGrowthBonus}%)\n`;
                  }
                });
              message += `\n`;
            }

            const currentSeasonCrops = displayCrops.filter(
              (crop) => crop.isCurrentSeason
            );
            const allSeasonCrops = displayCrops.filter(
              (crop) => crop.isAllSeason && !crop.isCurrentSeason
            );

            if (currentSeasonCrops.length > 0) {
              message += `🌟 CÂY TRỒNG MÙA ${currentSeason.name.toUpperCase()} (+30% SẢN LƯỢNG):\n\n`;
              currentSeasonCrops.forEach((crop) => {
                const growTimeHours = Math.floor(crop.time / 3600);
                const growTimeMinutes = Math.floor((crop.time % 3600) / 60);
                const growTimeText =
                  growTimeHours > 0
                    ? `${growTimeHours}h${growTimeMinutes}p`
                    : `${growTimeMinutes}p`;

                const vipYield =
                  vipYieldBonus > 0
                    ? Math.floor(crop.yield * (1 + vipYieldBonus / 100))
                    : 0;
                const vipTime =
                  vipGrowthBonus > 0
                    ? Math.floor(crop.time * (1 - vipGrowthBonus / 100))
                    : 0;
                const vipGrowTimeHours =
                  vipTime > 0 ? Math.floor(vipTime / 3600) : 0;
                const vipGrowTimeMinutes =
                  vipTime > 0 ? Math.floor((vipTime % 3600) / 60) : 0;
                const vipGrowTimeText =
                  vipGrowTimeHours > 0
                    ? `${vipGrowTimeHours}h${vipGrowTimeMinutes}p`
                    : `${vipGrowTimeMinutes}p`;
                const vipExp =
                  vipExpBonus > 0
                    ? Math.floor(crop.exp * (1 + vipExpBonus / 100 / 2))
                    : 0;

                const seasonalYield = Math.floor(crop.yield * 1.3);
                const seasonalVipYield =
                  vipYieldBonus > 0
                    ? Math.floor(seasonalYield * (1 + vipYieldBonus / 100))
                    : 0;

                message += `${crop.emoji} ${crop.name} (Cấp ${crop.level})\n`;

                message += `💰 ${formatNumber(crop.price)}xu → ${formatNumber(
                  seasonalYield
                )}xu`;
                if (vipYieldBonus > 0) {
                  message += ` → 👑 ${formatNumber(seasonalVipYield)}xu`;
                }
                message += ` (+${formatNumber(seasonalYield - crop.price)})\n`;

                message += `⏱️ ${growTimeText}`;
                if (vipGrowthBonus > 0) {
                  message += ` → 👑 ${vipGrowTimeText}`;
                }
                message += ` | 💧 ${crop.water} lần | 📊 ${crop.exp}`;
                if (vipExpBonus > 0) {
                  message += ` → 👑 ${vipExp}`;
                }
                message += ` EXP | 🗓️ ${currentSeason.name} 🌟\n\n`;
              });
            }

            if (allSeasonCrops.length > 0) {
              message += `🌱 CÂY TRỒNG QUANH NĂM:\n\n`;
              allSeasonCrops.forEach((crop) => {
                const growTimeHours = Math.floor(crop.time / 3600);
                const growTimeMinutes = Math.floor((crop.time % 3600) / 60);
                const growTimeText =
                  growTimeHours > 0
                    ? `${growTimeHours}h${growTimeMinutes}p`
                    : `${growTimeMinutes}p`;

                const vipYield =
                  vipYieldBonus > 0
                    ? Math.floor(crop.yield * (1 + vipYieldBonus / 100))
                    : 0;
                const vipTime =
                  vipGrowthBonus > 0
                    ? Math.floor(crop.time * (1 - vipGrowthBonus / 100))
                    : 0;
                const vipGrowTimeHours =
                  vipTime > 0 ? Math.floor(vipTime / 3600) : 0;
                const vipGrowTimeMinutes =
                  vipTime > 0 ? Math.floor((vipTime % 3600) / 60) : 0;
                const vipGrowTimeText =
                  vipGrowTimeHours > 0
                    ? `${vipGrowTimeHours}h${vipGrowTimeMinutes}p`
                    : `${vipGrowTimeMinutes}p`;
                const vipExp =
                  vipExpBonus > 0
                    ? Math.floor(crop.exp * (1 + vipExpBonus / 100 / 2))
                    : 0;

                message += `${crop.emoji} ${crop.name} (Cấp ${crop.level})\n`;

                message += `💰 ${formatNumber(crop.price)}xu → ${formatNumber(
                  crop.yield
                )}xu`;
                if (vipYieldBonus > 0) {
                  message += ` → 👑 ${formatNumber(vipYield)}xu`;
                }
                message += ` (+${formatNumber(crop.yield - crop.price)})\n`;

                message += `⏱️ ${growTimeText}`;
                if (vipGrowthBonus > 0) {
                  message += ` → 👑 ${vipGrowTimeText}`;
                }
                message += ` | 💧 ${crop.water} lần | 📊 ${crop.exp}`;
                if (vipExpBonus > 0) {
                  message += ` → 👑 ${vipExp}`;
                }
                message += ` EXP | 🗓️ Trồng quanh năm\n\n`;
              });
            }

            const otherSeasonalCrops = Object.entries(CROPS).filter(
              ([id, crop]) => {
                return (
                  crop.seasons &&
                  !crop.seasons[currentSeason.key] &&
                  !crop.seasons.ALL
                );
              }
            );

            if (otherSeasonalCrops.length > 0) {
              const otherSeasonsCount = {
                SPRING: 0,
                SUMMER: 0,
                AUTUMN: 0,
                WINTER: 0,
              };

              otherSeasonalCrops.forEach(([id, crop]) => {
                Object.keys(crop.seasons || {}).forEach((season) => {
                  if (season !== "ALL" && season !== currentSeason.key) {
                    otherSeasonsCount[season]++;
                  }
                });
              });

              message += `🔒 CÂY TRỒNG MÙA KHÁC (${otherSeasonalCrops.length} loại):\n`;
              Object.entries(otherSeasonsCount).forEach(([season, count]) => {
                if (count > 0 && season !== currentSeason.key) {
                  message += `┣➤ ${VIETNAM_SEASONS[season].emoji} ${VIETNAM_SEASONS[season].name}: ${count} loại\n`;
                }
              });
              message += `┗➤ 💡 Quay lại vào đúng mùa để trồng\n\n`;
            }

            message += `━━━━━━━━━━━━━━━━━━\n`;
            message += `📄 Trang ${currentPage}/${totalPages || 1} • ${
              displayCrops.length
            } cây khả dụng\n`;
            if (totalPages > 1) {
              message += `💡 Xem trang khác: .farm shop cây 2, 3, 4...\n`;
            }
            message += `💡 Mua cây: .farm trồng <tên_cây> <số_ô>`;

            return api.sendMessage(message, threadID, messageID);
          }
          if (
            shopType === "vật_nuôi" ||
            shopType === "vat_nuoi" ||
            shopType === "animals"
          ) {
            let currentPage = 1;

            const animalId = target[2]?.toLowerCase();

            if (animalId && ANIMALS[animalId]) {
              const quantity = parseInt(target[3]) || 1;

              if (quantity <= 0) {
                return api.sendMessage(
                  `❌ Số lượng vật nuôi cần mua phải lớn hơn 0!`,
                  threadID,
                  messageID
                );
              }

              const animalConfig = ANIMALS[animalId];

              if (animalConfig.level > currentLevel) {
                return api.sendMessage(
                  `❌ Bạn cần đạt cấp độ ${animalConfig.level} để mua ${animalConfig.name}!\n` +
                    `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
                  threadID,
                  messageID
                );
              }

              let unitPrice = animalConfig.price;
              if (vipDiscount > 0) {
                unitPrice = Math.floor(unitPrice * (1 - vipDiscount / 100));
              }

              const totalPrice = unitPrice * quantity;

              const balance = await getBalance(senderID);
              if (balance < totalPrice) {
                return api.sendMessage(
                  `❌ Bạn không đủ tiền để mua ${quantity} ${animalConfig.name}!\n` +
                    `💰 Giá: ${formatNumber(totalPrice)} $ (${formatNumber(
                      unitPrice
                    )} × ${quantity})\n` +
                    `💵 Số dư: ${formatNumber(balance)} $`,
                  threadID,
                  messageID
                );
              }

              const animalCount = Object.keys(userFarm.animals || {}).length;
              const effects = applyItemEffects(userFarm);
              const maxCapacity = effects.animalCapacity;
              if (animalCount + quantity > maxCapacity) {
                return api.sendMessage(
                  `❌ Chuồng trại không đủ chỗ! (${animalCount}/${maxCapacity})\n` +
                    `💡 Bạn chỉ có thể mua thêm ${maxCapacity - animalCount} ${
                      animalConfig.name
                    }\n` +
                    `💡 Bán bớt vật nuôi hoặc nâng cấp chuồng trại để có thêm chỗ.`,
                  threadID,
                  messageID
                );
              }

              await updateBalance(senderID, -totalPrice);

              if (!userFarm.animals) {
                userFarm.animals = {};
              }

              for (let i = 0; i < quantity; i++) {
                const animalId = `${Date.now()}-${Math.floor(
                  Math.random() * 1000
                )}-${i}`;
                userFarm.animals[animalId] = {
                  type: animalId,
                  purchased: Date.now(),
                  fed: false,
                  lastFed: null,
                  productReady: false,
                  lastProduced: null,
                };
              }

              saveFarmData(farmData);

              let discountMessage = "";
              if (vipDiscount > 0) {
                const originalTotalPrice = animalConfig.price * quantity;
                discountMessage =
                  `\n💰 Giá gốc: ${formatNumber(originalTotalPrice)} $\n` +
                  `👑 Giảm giá VIP: -${vipDiscount}% (tiết kiệm ${formatNumber(
                    originalTotalPrice - totalPrice
                  )} $)`;
              }

              const productTime = Math.floor(animalConfig.productTime / 3600);
              const dailyProduction = 24 / productTime;
              const dailyIncome =
                Math.floor(
                  dailyProduction *
                    animalConfig.productPrice *
                    (1 + vipAnimalBonus / 100)
                ) * quantity;
              const dailyCost =
                Math.floor(dailyProduction * animalConfig.feed) * quantity;
              const dailyProfit = dailyIncome - dailyCost;

              return api.sendMessage(
                `✅ Đã mua ${quantity} ${animalConfig.emoji} ${animalConfig.name} thành công!${discountMessage}\n` +
                  `💸 Chi phí: -${formatNumber(totalPrice)} $\n` +
                  `📈 Lợi nhuận dự kiến: ${formatNumber(
                    dailyProfit
                  )}/ngày (tất cả)\n` +
                  `🔶 Hướng dẫn:\n` +
                  `→ Cho ăn tất cả: .farm feed all\n` +
                  `→ Cho ăn theo loại: .farm feed ${animalId}\n` +
                  `→ Thu thập sản phẩm: .farm collect`,
                threadID,
                messageID
              );
            } else {
              if (target[2] && !isNaN(parseInt(target[2]))) {
                currentPage = parseInt(target[2]);
              } else {
                const pageParam = target.find(
                  (arg) =>
                    arg.match(/^trang[0-9]+$/i) || arg.match(/^page[0-9]+$/i)
                );
                if (pageParam) {
                  currentPage = parseInt(pageParam.replace(/trang|page/i, ""));
                }
              }

              if (currentPage < 1) currentPage = 1;

              const allAnimals = Object.entries(ANIMALS).map(
                ([id, animal]) => ({
                  id,
                  ...animal,
                })
              );

              const pagination = createPaginatedList(
                allAnimals,
                currentLevel,
                currentPage,
                5
              );

              let vipInfo = "";
              if (vipAnimalBonus > 0 || vipDiscount > 0) {
                vipInfo = `👑 ĐẶC QUYỀN VIP CỦA BẠN:\n`;
                if (vipAnimalBonus > 0) {
                  vipInfo += `┣➤ 🐄 Tăng sản lượng vật nuôi: +${vipAnimalBonus}%\n`;
                }
                if (vipDiscount > 0) {
                  vipInfo += `┣➤ 💰 Giảm giá vật nuôi: -${vipDiscount}%\n`;
                }
                vipInfo += `┗━━━━━━━━━━━━━━━━━━\n\n`;
              }

              let message = `🐄 CỬA HÀNG VẬT NUÔI (Trang ${pagination.currentPage}/${pagination.totalPages})\n`;
              message += `━━━━━━━━━━━━━━━━━━\n\n`;

              if (vipInfo) {
                message += vipInfo;
              }

              const effects = applyItemEffects(userFarm);
              const animalCount = Object.keys(userFarm.animals || {}).length;
              message += `🏡 Sức chứa: ${animalCount}/${effects.animalCapacity} vật nuôi\n\n`;

              pagination.items.forEach((animal) => {
                const productTime = Math.floor(animal.productTime / 3600);
                const dailyProduction = 24 / productTime;

                const normalProductPrice = animal.productPrice;
                const vipProductPrice =
                  vipAnimalBonus > 0
                    ? Math.floor(
                        normalProductPrice * (1 + vipAnimalBonus / 100)
                      )
                    : 0;

                const dailyIncome = Math.floor(
                  dailyProduction * normalProductPrice
                );
                const vipDailyIncome =
                  vipAnimalBonus > 0
                    ? Math.floor(dailyProduction * vipProductPrice)
                    : 0;
                const dailyCost = Math.floor(dailyProduction * animal.feed);
                const dailyProfit = dailyIncome - dailyCost;
                const vipDailyProfit =
                  vipAnimalBonus > 0 ? vipDailyIncome - dailyCost : 0;

                const normalPrice = animal.price;
                const vipPrice =
                  vipDiscount > 0
                    ? Math.floor(normalPrice * (1 - vipDiscount / 100))
                    : 0;

                message += `${animal.emoji} ${animal.name} (Cấp ${animal.level})\n`;

                message += `💰 Giá: ${formatNumber(normalPrice)} $`;
                if (vipDiscount > 0) {
                  message += ` → 👑 ${formatNumber(
                    vipPrice
                  )} $ (-${vipDiscount}%)`;
                }
                message += `\n`;

                message += `${animal.productEmoji} ${
                  animal.product
                } (${formatNumber(normalProductPrice)}xu/${productTime}h`;
                if (vipAnimalBonus > 0) {
                  message += ` → 👑 ${formatNumber(vipProductPrice)}xu`;
                }
                message += `)\n`;

                message += `📈 Lợi nhuận: ${formatNumber(dailyProfit)}/ngày`;
                if (vipAnimalBonus > 0) {
                  message += ` → 👑 ${formatNumber(vipDailyProfit)}/ngày`;
                }
                message += `\n`;

                message += `💡 Mua nhiều: .farm shop animals ${animal.id} <số_lượng>\n\n`;
              });

              message += `━━━━━━━━━━━━━━━━━━\n`;
              message += `📄 Trang ${pagination.currentPage}/${pagination.totalPages} • Còn ${pagination.lockedCount} vật nuôi khóa\n`;
              if (pagination.totalPages > 1) {
                message += `💡 Xem trang khác: .farm shop animals 2, 3, 4...\n`;
              }
              message += `💡 Mua vật nuôi: .farm shop animals <mã_vật_nuôi> <số_lượng>`;

              return api.sendMessage(message, threadID, messageID);
            }
          }

          if (
            shopType === "vật_phẩm" ||
            shopType === "vat_pham" ||
            shopType === "items"
          ) {
            if (buyItem) {
              const itemConfig = SHOP_ITEMS[buyItem];
              if (!itemConfig) {
                return api.sendMessage(
                  `❌ Không tìm thấy vật phẩm "${target[2]}"!\n` +
                    `💡 Sử dụng .farm shop items để xem danh sách.`,
                  threadID,
                  messageID
                );
              }

              if (itemConfig.level > currentLevel) {
                return api.sendMessage(
                  `❌ Bạn cần đạt cấp độ ${itemConfig.level} để mua ${itemConfig.name}!\n` +
                    `👨‍🌾 Cấp độ hiện tại: ${currentLevel}`,
                  threadID,
                  messageID
                );
              }

              const originalPrice = itemConfig.price;
              const discountedPrice =
                vipDiscount > 0
                  ? Math.floor(originalPrice * (1 - vipDiscount / 100))
                  : originalPrice;

              const balance = await getBalance(senderID);
              if (balance < discountedPrice) {
                return api.sendMessage(
                  `❌ Bạn không đủ tiền để mua ${itemConfig.name}!\n` +
                    `💰 Giá: ${formatNumber(discountedPrice)} $${
                      vipDiscount > 0 ? ` (Đã giảm ${vipDiscount}%)` : ""
                    }\n` +
                    `💵 Số dư: ${formatNumber(balance)} $`,
                  threadID,
                  messageID
                );
              }

              if (
                userFarm.items &&
                userFarm.items[buyItem] &&
                userFarm.items[buyItem].active &&
                (!userFarm.items[buyItem].expiry ||
                  userFarm.items[buyItem].expiry > Date.now())
              ) {
                if (!itemConfig.duration) {
                  return api.sendMessage(
                    `❌ Bạn đã sở hữu ${itemConfig.name}!\n` +
                      `💡 Đây là vật phẩm vĩnh viễn, không thể mua thêm.`,
                    threadID,
                    messageID
                  );
                } else {
                  const timeLeft = Math.floor(
                    (userFarm.items[buyItem].expiry - Date.now()) /
                      (60 * 60 * 1000)
                  );
                  return api.sendMessage(
                    `❌ Bạn đang sở hữu ${itemConfig.name} còn hiệu lực!\n` +
                      `⏱️ Thời gian còn lại: ${timeLeft} giờ\n` +
                      `💡 Hãy chờ vật phẩm hết hạn rồi mua lại.`,
                    threadID,
                    messageID
                  );
                }
              }

              await updateBalance(senderID, -discountedPrice);

              if (!userFarm.items) {
                userFarm.items = {};
              }

              userFarm.items[buyItem] = {
                purchased: Date.now(),
                active: true,
                effect: itemConfig.effect,
                expiry: itemConfig.duration
                  ? Date.now() + itemConfig.duration
                  : null,
              };

              saveFarmData(farmData);

              let discountMessage = "";
              if (vipDiscount > 0) {
                discountMessage =
                  `\n💰 Giá gốc: ${formatNumber(originalPrice)} $\n` +
                  `👑 Giảm giá VIP: -${vipDiscount}% (tiết kiệm ${formatNumber(
                    originalPrice - discountedPrice
                  )} $)`;
              }

              return api.sendMessage(
                `✅ Đã mua ${itemConfig.emoji} ${itemConfig.name} thành công!${discountMessage}\n` +
                  `💸 Chi phí: -${formatNumber(discountedPrice)} $\n` +
                  `⏱️ Thời hạn: ${
                    itemConfig.duration
                      ? Math.floor(
                          itemConfig.duration / (24 * 60 * 60 * 1000)
                        ) + " ngày"
                      : "Vĩnh viễn"
                  }\n` +
                  `🔮 Hiệu ứng: ${itemConfig.description}\n` +
                  `→ Hiệu ứng đã được áp dụng tự động!`,
                threadID,
                messageID
              );
            }

            let vipInfo = "";
            if (vipDiscount > 0) {
              vipInfo =
                `👑 ĐẶC QUYỀN VIP CỦA BẠN:\n` +
                `┣➤ 💰 Giảm giá vật phẩm: -${vipDiscount}%\n` +
                `┗━━━━━━━━━━━━━━━━━━\n\n`;
            }

            let message =
              "🔮 CỬA HÀNG VẬT PHẨM 🔮\n" + "━━━━━━━━━━━━━━━━━━\n\n";

            if (vipInfo) {
              message += vipInfo;
            }

            message += "📋 DANH SÁCH VẬT PHẨM\n";

            const itemsByLevel = {};
            Object.entries(SHOP_ITEMS).forEach(([itemId, item]) => {
              if (!itemsByLevel[item.level]) {
                itemsByLevel[item.level] = [];
              }
              itemsByLevel[item.level].push({ id: itemId, ...item });
            });

            for (let level = 1; level <= currentLevel; level++) {
              if (itemsByLevel[level]) {
                if (level > 1) message += "\n";
                message += `🌟 CẤP ĐỘ ${level}:\n`;

                itemsByLevel[level].forEach((item) => {
                  const owned =
                    userFarm.items &&
                    userFarm.items[item.id] &&
                    userFarm.items[item.id].active &&
                    (!userFarm.items[item.id].expiry ||
                      userFarm.items[item.id].expiry > Date.now());

                  const normalPrice = item.price;
                  const discountedPrice =
                    vipDiscount > 0
                      ? Math.floor(normalPrice * (1 - vipDiscount / 100))
                      : normalPrice;

                  message += `\n${item.emoji} ${item.name} ${
                    owned ? "(Đã sở hữu)" : ""
                  }\n`;

                  message += `💰 Giá: ${formatNumber(normalPrice)} $`;
                  if (vipDiscount > 0 && !owned) {
                    message += ` → 👑 ${formatNumber(
                      discountedPrice
                    )} $ (-${vipDiscount}%)`;
                  }
                  message += `\n`;

                  message += `⏱️ Thời hạn: ${
                    item.duration
                      ? Math.floor(item.duration / (24 * 60 * 60 * 1000)) +
                        " ngày"
                      : "Vĩnh viễn"
                  }\n`;
                  message += `🔮 Hiệu ứng: ${item.description}\n`;

                  if (!owned) {
                    message += `💡 Mua: .farm shop items ${item.id}\n`;
                  }
                });
              }
            }

            if (currentLevel < 10) {
              message += "\n🔒 VẬT PHẨM KHÓA:\n";

              for (let level = currentLevel + 1; level <= 10; level++) {
                if (itemsByLevel[level]) {
                  itemsByLevel[level].forEach((item) => {
                    message += `\n${item.emoji} ${item.name} (Cần cấp ${level})\n`;
                  });
                }
              }
            }

            return api.sendMessage(message, threadID, messageID);
          }

          return api.sendMessage(
            "❌ Loại cửa hàng không hợp lệ!\n" +
              "💡 Sử dụng một trong các lệnh sau:\n" +
              "→ .farm shop cây\n" +
              "→ .farm shop animals\n" +
              "→ .farm shop items",
            threadID,
            messageID
          );
        }

        default:
          return api.sendMessage(
            "❌ Lệnh không hợp lệ!\n" +
              "💡 Sử dụng:\n" +
              "→ .farm - Xem trang trại\n" +
              "→ .farm trồng <cây trồng> <số ô> - Trồng cây\n" +
              "→ .farm tưới <số ô> - Tưới nước cho cây\n" +
              "→ .farm thu <số ô> - Thu hoạch\n" +
              "→ .farm shop - Xem cửa hàng",
            threadID,
            messageID
          );
      }
    } catch (error) {
      console.error("Farm command error:", error);
      return api.sendMessage(
        "❌ Đã xảy ra lỗi khi xử lý lệnh farm! Vui lòng thử lại.",
        threadID,
        messageID
      );
    }
  },
};
