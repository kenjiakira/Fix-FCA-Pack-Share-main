require('dotenv').config();
const axios = require('axios');

class AppStateService {
    async updateAppState(newContent) {
        try {
            if (!Array.isArray(newContent)) {
                return { success: false, message: 'Appstate phải là một mảng' };
            }

            const jsonbinUrl = process.env.APPSTATE_SYNC_URL;
            const finalApiKey = process.env.APPSTATE_SYNC_API_KEY;
            
            if (!jsonbinUrl || !jsonbinUrl.trim()) {
                return { success: false, message: 'Thiếu JSONBin.io URL. Vui lòng cấu hình APPSTATE_SYNC_URL trong file .env' };
            }
            
            if (!finalApiKey || !finalApiKey.trim()) {
                return { success: false, message: 'Thiếu API Key. Vui lòng cấu hình APPSTATE_SYNC_API_KEY trong file .env' };
            }

            let updateUrl = jsonbinUrl.trim();
            if (!updateUrl.startsWith('https://')) {
                updateUrl = `https://${updateUrl}`;
            }
            
            if (updateUrl.includes('/b/')) {
                const binId = updateUrl.match(/\/b\/([^\/]+)/)?.[1];
                if (binId) {
                    updateUrl = `https://api.jsonbin.io/v3/b/${binId}`;
                }
            }

            const headers = {
                'Content-Type': 'application/json',
                'X-Master-Key': finalApiKey
            };

            const response = await axios.put(
                updateUrl,
                newContent,
                {
                    headers: headers,
                    timeout: 30000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                return { success: false, message: 'API Key không hợp lệ hoặc không có quyền truy cập' };
            }

            if (response.status === 404) {
                return { success: false, message: 'Bin không tồn tại. Vui lòng kiểm tra lại URL' };
            }

            if (response.status !== 200) {
                return { success: false, message: `Lỗi từ JSONBin.io: ${response.status} - ${response.statusText}` };
            }

            return {
                success: true,
                message: 'Đã cập nhật appstate lên JSONBin.io thành công'
            };
        } catch (error) {
            console.error('Error updating appstate to jsonbin.io:', error);
            
            if (error.response) {
                const status = error.response.status;
                const statusText = error.response.statusText;
                
                if (status === 401 || status === 403) {
                    return { success: false, message: 'API Key không hợp lệ hoặc không có quyền truy cập' };
                }
                
                if (status === 404) {
                    return { success: false, message: 'Bin không tồn tại. Vui lòng kiểm tra lại URL' };
                }
                
                return { success: false, message: `Lỗi từ JSONBin.io: ${status} - ${statusText}` };
            }
            
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                return { success: false, message: 'Không thể kết nối đến JSONBin.io. Kiểm tra kết nối mạng' };
            }
            
            return { success: false, message: `Lỗi: ${error.message}` };
        }
    }
}

module.exports = new AppStateService();

