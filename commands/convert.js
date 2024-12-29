module.exports = {
    name: "convert",
    info: "Chuyển đổi đơn vị",
    dev: "HNT",
    usedby: 0,
    onPrefix: true,
    dmUser: true,
    nickName: ["unitconvert", "convert"],
    usages: "Cách sử dụng: .convert [value] [unit_from] to [unit_to]",
    cooldowns: 10,

    onLaunch: async function ({ event, actions }) {
        const args = event.body.split(" ");
        const value = parseFloat(args[0]);
        const fromUnit = args[1]?.toLowerCase();
        const toUnit = args[3]?.toLowerCase();

        if (isNaN(value) || !fromUnit || !toUnit) {
            return actions.reply("Vui lòng nhập đầy đủ thông tin theo dạng: [value] [unit_from] to [unit_to]. Ví dụ: .convert 100 km to m.");
        }

        const units = {
            length: {
                "m": 1, "km": 1000, "cm": 0.01, "mm": 0.001, "mile": 1609.34, "yard": 0.9144, "foot": 0.3048
            },
            mass: {
                "kg": 1, "g": 0.001, "mg": 0.000001, "ton": 1000, "lb": 0.453592, "oz": 0.0283495
            },
            temperature: {
                "c": (v) => (v - 32) * 5 / 9, "f": (v) => (v * 9 / 5) + 32
            },
            area: {
                "m2": 1, "km2": 1000000, "cm2": 0.0001, "mm2": 1e-6, "acre": 4046.86, "ft2": 0.092903
            },
            time: {
                "s": 1, "min": 60, "h": 3600, "d": 86400, "w": 604800, "month": 2628000, "year": 31536000
            },
            speed: {
                "m/s": 1, "km/h": 1000 / 3600, "mile/h": 1609.34 / 3600, "knots": 1852 / 3600
            },
            volume: {
                "l": 1, "ml": 0.001, "gal": 3.78541, "pt": 0.473176, "cup": 0.24
            },
            energy: {
                "j": 1, "cal": 4.184, "kj": 1000, "kcal": 4184, "wh": 3600
            },
            pressure: {
                "pa": 1, "bar": 100000, "atm": 101325, "psi": 6894.76
            },
            force: {
                "n": 1, "dyne": 0.00001, "kgf": 9.80665, "lbf": 4.44822
            },
            power: {
                "w": 1, "kw": 1000, "hp": 745.7
            }
        };

        let conversionResult = null;
        let unitCategory = null;

        for (const category in units) {
            if (units[category][fromUnit] && units[category][toUnit]) {
                unitCategory = category;
                if (unitCategory === "temperature") {
                    conversionResult = units[category][toUnit](value);
                } else {
                    conversionResult = (value * units[category][fromUnit]) / units[category][toUnit];
                }
                break;
            }
        }

        if (conversionResult === null) {
            return actions.reply("Không thể thực hiện chuyển đổi với các đơn vị bạn đã nhập. Vui lòng kiểm tra lại cú pháp.");
        }

        return actions.reply(`${value} ${fromUnit} = ${conversionResult} ${toUnit}`);
    }
};
