module.exports = {
    GENERAL: {
        INVALID_COMMAND: "❌ Lệnh không hợp lệ!\n💡 Gõ .heist help để xem danh sách lệnh",
        INVALID_TARGET: "❌ Vui lòng tag người chơi cần tương tác!",
        INVALID_AMOUNT: "❌ Số lượng không hợp lệ!",
        INSUFFICIENT_FUNDS: "❌ Bạn không đủ tiền để thực hiện hành động này!",
        LEVEL_REQUIRED: "❌ Bạn cần đạt cấp độ {level} để sử dụng tính năng này!",
        COOLDOWN: "⏳ Vui lòng đợi {time} giây nữa để thực hiện lại!",
        SUCCESS: "✅ Thao tác thành công!"
    },

    HEIST: {
        INVALID_ROLE: "❌ Vui lòng chọn vai trò:\n• robber - Cướp\n• police - Cảnh sát",
        ALREADY_ACTIVE: "❌ Bạn đã tham gia vụ cướp khác!",
        NO_ACTIVE_HEIST: "❌ Không có vụ cướp nào đang diễn ra!",
        HEIST_IN_PROGRESS: "❌ Vụ cướp đang diễn ra, không thể tham gia!",
        INSUFFICIENT_PLAYERS: "❌ Cần ít nhất {min} người chơi để bắt đầu!"
    },

    PET: {
        SYNTAX: {
            INFO: "📝 CÚ PHÁP THÚ CƯNG:\n• .heist pet buy [dog/hawk/drone] - Mua thú cưng\n• .heist pet train - Huấn luyện thú cưng\n• .heist pet info - Xem thông tin thú cưng",
            BUY: "❌ Vui lòng chọn loại thú cưng:\n• dog - Chó nghiệp vụ\n• hawk - Diều hâu trinh sát\n• drone - Máy bay không người lái"
        },
        ALREADY_OWNED: "❌ Bạn đã sở hữu thú cưng này!",
        MAX_LEVEL: "❌ Thú cưng đã đạt cấp độ tối đa!",
        NOT_OWNED: "❌ Bạn chưa sở hữu thú cưng!"
    },

    VEHICLE: {
        SYNTAX: {
            INFO: "📝 CÚ PHÁP PHƯƠNG TIỆN:\n• .heist vehicle buy [bike/car/van] - Mua phương tiện\n• .heist vehicle upgrade [engine/armor] [cấp] - Nâng cấp\n• .heist vehicle info - Xem thông tin",
            BUY: "❌ Vui lòng chọn loại phương tiện:\n• bike - Xe máy\n• car - Ô tô\n• van - Xe tải",
            UPGRADE: "❌ Cú pháp nâng cấp: .heist vehicle upgrade [engine/armor] [1-5]"
        },
        ALREADY_OWNED: "❌ Bạn đã sở hữu phương tiện này!",
        MAX_LEVEL: "❌ Đã đạt cấp độ tối đa!",
        NOT_OWNED: "❌ Bạn chưa sở hữu phương tiện!"
    },

    GANG: {
        SYNTAX: {
            INFO: "📝 CÚ PHÁP BANG HỘI:\n• .heist gang create [tên] - Tạo bang hội\n• .heist gang join [tên] - Tham gia bang hội\n• .heist gang upgrade [base/training] [cấp] - Nâng cấp\n• .heist gang info - Xem thông tin bang hội\n• .heist gang list - Xem danh sách bang hội",
            CREATE: "❌ Vui lòng nhập tên bang hội cần tạo!\n💡 Lưu ý: Tên không được chứa dấu cách",
            JOIN: "❌ Vui lòng nhập tên bang hội cần tham gia!",
            UPGRADE: "❌ Cú pháp nâng cấp: .heist gang upgrade [base/training] [1-5]"
        },
        NAME_TAKEN: "❌ Tên bang hội đã được sử dụng!",
        INVALID_NAME: "❌ Tên bang hội không được chứa dấu cách!",
        NOT_FOUND: "❌ Không tìm thấy bang hội!",
        ALREADY_IN_GANG: "❌ Bạn đã ở trong bang hội khác!",
        ALREADY_CREATED: "❌ Bạn đã tạo một bang hội rồi!",
        NOT_IN_GANG: "❌ Bạn chưa tham gia bang hội nào!",
        NOT_LEADER: "❌ Chỉ trưởng bang mới có thể thực hiện điều này!",
        FULL_MEMBERS: "❌ Bang hội đã đủ thành viên!",
        NO_GANGS: "❌ Chưa có bang hội nào được tạo!"
    },

    TOURNAMENT: {
        SYNTAX: {
            LIST: "📝 CÚ PHÁP GIẢI ĐẤU:\n• .heist tournament list - Xem danh sách\n• .heist tournament join [id] - Tham gia\n• .heist tournament ranking - Xem xếp hạng",
            JOIN: "❌ Vui lòng nhập ID giải đấu cần tham gia!"
        },
        NOT_FOUND: "❌ Không tìm thấy giải đấu!",
        ALREADY_JOINED: "❌ Bạn đã tham gia giải đấu này!",
        NOT_ENOUGH_LEVEL: "❌ Bạn cần đạt cấp {level} để tham gia!",
        NO_TOURNAMENTS: "❌ Hiện không có giải đấu nào!"
    },

    MARKET: {
        SYNTAX: {
            LIST: "📝 CÚ PHÁP CHỢ ĐEN:\n• .heist market list - Xem danh sách\n• .heist market buy [id] - Mua vật phẩm\n• .heist market refresh - Làm mới danh sách",
            BUY: "❌ Vui lòng nhập ID vật phẩm cần mua!"
        },
        ITEM_NOT_FOUND: "❌ Không tìm thấy vật phẩm!",
        ALREADY_OWNED: "❌ Bạn đã sở hữu vật phẩm này!",
        REFRESH_COOLDOWN: "⏳ Vui lòng đợi {time} phút để làm mới!"
    },

    SYNTAX_GUIDE: {
        BASIC: [
            "📝 LỆNH CƠ BẢN:",
            "• .heist start [local/state/federal] - Bắt đầu vụ cướp",
            "• .heist join [robber/police] - Tham gia vụ cướp",
            "• .heist attack [@tag] - Tấn công người chơi",
            "• .heist heal - Hồi máu",
            "• .heist status - Xem trạng thái",
            "• .heist shop - Xem cửa hàng",
            "• .heist buy [weapon/equip] [số] - Mua vật phẩm"
        ],
        PET: [
            "📝 LỆNH THÚ CƯNG:",
            "• .heist pet buy [dog/hawk/drone] - Mua thú cưng",
            "• .heist pet train - Huấn luyện thú cưng",
            "• .heist pet info - Xem thông tin thú cưng"
        ],
        VEHICLE: [
            "📝 LỆNH PHƯƠNG TIỆN:",
            "• .heist vehicle buy [bike/car/van] - Mua phương tiện",
            "• .heist vehicle upgrade [engine/armor] [cấp] - Nâng cấp",
            "• .heist vehicle info - Xem thông tin"
        ],
        GANG: [
            "📝 LỆNH BANG HỘI:",
            "• .heist gang create [tên] - Tạo bang hội",
            "• .heist gang join [tên] - Tham gia bang hội", 
            "• .heist gang upgrade [base/training] [cấp] - Nâng cấp"
        ],
        TOURNAMENT: [
            "📝 LỆNH GIẢI ĐẤU:",
            "• .heist tournament list - Xem danh sách",
            "• .heist tournament join [id] - Tham gia giải đấu",
            "• .heist tournament ranking - Xem xếp hạng"
        ],
        MARKET: [
            "📝 LỆNH CHỢ ĐEN:",
            "• .heist market list - Xem danh sách",
            "• .heist market buy [id] - Mua vật phẩm",
            "• .heist market refresh - Làm mới danh sách"
        ]
    }
}; 