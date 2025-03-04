# HƯỚNG DẪN SỬ DỤNG LỆNH ORDER TRONG HỆ THỐNG GIAO DỊCH AKI

## 1. GIỚI THIỆU VỀ LỆNH ORDER

Lệnh Order trong hệ thống chứng khoán AKI cho phép bạn đặt các lệnh mua/bán cổ phiếu với nhiều điều kiện khác nhau thay vì chỉ mua/bán ngay lập tức theo giá thị trường. Điều này giúp bạn có thể:
- Mua cổ phiếu với giá thấp hơn giá hiện tại
- Bán cổ phiếu với giá cao hơn giá hiện tại
- Tự động mua/bán khi giá đạt đến một mức nhất định
- Giảm thiểu rủi ro và tối ưu lợi nhuận

## 2. CÁC LOẠI LỆNH

### 2.1. Lệnh Limit (Giới hạn)
- **Định nghĩa**: Đặt lệnh mua/bán với một mức giá cụ thể do bạn chỉ định.
- **Khi nào sử dụng lệnh mua limit**: Khi bạn muốn mua cổ phiếu với giá thấp hơn giá hiện tại.
- **Khi nào sử dụng lệnh bán limit**: Khi bạn muốn bán cổ phiếu với giá cao hơn giá hiện tại.
- **Ví dụ**: Nếu cổ phiếu AAPL đang giao dịch ở giá 250,000 Xu, bạn có thể đặt lệnh mua limit ở giá 230,000 Xu.

### 2.2. Lệnh Stop (Dừng lỗ/Chốt lời)
- **Định nghĩa**: Lệnh sẽ được kích hoạt khi giá cổ phiếu chạm mốc giá stop bạn đã đặt.
- **Khi nào sử dụng lệnh stop bán**: Để giới hạn khoản lỗ hoặc bảo vệ lợi nhuận.
- **Khi nào sử dụng lệnh stop mua**: Để mua khi xác nhận xu hướng tăng.
- **Ví dụ**: Nếu bạn mua MSFT ở giá 280,000 Xu, bạn có thể đặt lệnh stop bán ở giá 260,000 Xu để giới hạn mức lỗ tối đa.

## 3. CÁCH SỬ DỤNG LỆNH ORDER

### 3.1. Cú pháp lệnh

```
.trade order [mã CP] [số lượng] [limit/stop] [giá] [buy/sell]
```

Trong đó:
- **[mã CP]**: Mã cổ phiếu bạn muốn giao dịch (ví dụ: AAPL, MSFT, GOOGL)
- **[số lượng]**: Số lượng cổ phiếu muốn mua hoặc bán
- **[limit/stop]**: Loại lệnh (limit hoặc stop)
- **[giá]**: Mức giá đặt lệnh (tính bằng Xu)
- **[buy/sell]**: Hướng giao dịch (mua hoặc bán)

### 3.2. Ví dụ về lệnh Order

#### Lệnh Limit Mua:
```
.trade order AAPL 100 limit 145000 buy
```
- Lệnh trên có nghĩa: Đặt lệnh mua 100 cổ phiếu AAPL khi giá xuống 145,000 Xu hoặc thấp hơn.

#### Lệnh Limit Bán:
```
.trade order TSLA 50 limit 280000 sell
```
- Lệnh trên có nghĩa: Đặt lệnh bán 50 cổ phiếu TSLA khi giá lên 280,000 Xu hoặc cao hơn.

#### Lệnh Stop Bán (Stop Loss):
```
.trade order MSFT 75 stop 260000 sell
```
- Lệnh trên có nghĩa: Đặt lệnh bán 75 cổ phiếu MSFT nếu giá giảm xuống mức 260,000 Xu hoặc thấp hơn.

#### Lệnh Stop Mua:
```
.trade order GOOGL 30 stop 330000 buy
```
- Lệnh trên có nghĩa: Đặt lệnh mua 30 cổ phiếu GOOGL khi giá vượt qua mức 330,000 Xu, xác nhận xu hướng tăng.

## 4. CHIẾN LƯỢC SỬ DỤNG LỆNH ORDER

### 4.1. Chiến lược mua bình quân giá xuống
- Đặt nhiều lệnh limit mua ở các mức giá giảm dần
- Ví dụ: Đặt lệnh mua AAPL ở các mức 145,000, 140,000, 135,000 Xu

### 4.2. Chiến lược giới hạn rủi ro
- Luôn đặt lệnh stop loss sau khi mua cổ phiếu
- Khuyến nghị: Đặt stop loss ở mức 5-10% dưới giá mua

### 4.3. Chiến lược bảo toàn lợi nhuận
- Khi cổ phiếu tăng giá, điều chỉnh lệnh stop bán lên cao hơn (trailing stop)
- Ví dụ: Nếu mua ở 100,000 Xu, khi giá lên 120,000 Xu, đặt stop ở 110,000 Xu

### 4.4. Chiến lược chia nhỏ lệnh bán
- Bán từng phần danh mục ở các mức giá khác nhau
- Ví dụ: Đặt lệnh bán 1/3 số lượng ở +10%, 1/3 ở +20%, 1/3 ở +30%

## 5. LƯU Ý KHI SỬ DỤNG LỆNH ORDER

1. **Thời hạn lệnh**: Lệnh order có hiệu lực trong phiên giao dịch hiện tại (9:00-19:00).

2. **Kiểm tra tài khoản**: Đảm bảo tài khoản có đủ tiền/cổ phiếu trước khi đặt lệnh.

3. **Giá khớp lệnh**: Lệnh limit mua sẽ khớp ở giá limit hoặc thấp hơn. Lệnh limit bán sẽ khớp ở giá limit hoặc cao hơn.

4. **Khối lượng khớp lệnh**: Lệnh có thể được thực hiện một phần nếu không đủ thanh khoản.

5. **Hủy lệnh**: Sử dụng lệnh `.trade cancel [mã lệnh]` để hủy lệnh đã đặt.

## 6. VÍ DỤ TÌNH HUỐNG THỰC TẾ

### Tình huống 1: Mua cổ phiếu khi giá giảm
```
Giá AAPL hiện tại: 150,000 Xu
Bạn dự đoán giá sẽ giảm trước khi tăng lại
→ Đặt lệnh: .trade order AAPL 100 limit 140000 buy
```

### Tình huống 2: Bảo vệ lợi nhuận
```
Bạn mua META với giá 250,000 Xu
Giá hiện tại đã tăng lên 300,000 Xu
→ Đặt lệnh: .trade order META 50 stop 280000 sell
```

### Tình huống 3: Giao dịch theo xu hướng
```
TSLA đang gặp kháng cự ở mức 280,000 Xu
Nếu vượt qua, có thể sẽ tăng mạnh
→ Đặt lệnh: .trade order TSLA 30 stop 283000 buy
```

## 7. LỢI ÍCH CỦA VIỆC SỬ DỤNG LỆNH ORDER

1. **Tự động hóa**: Không cần theo dõi thị trường liên tục
2. **Kỷ luật giao dịch**: Giúp tuân thủ kế hoạch, hạn chế quyết định cảm tính
3. **Quản lý rủi ro**: Giới hạn mức lỗ tối đa cho mỗi giao dịch
4. **Tối ưu điểm vào/ra**: Có thể đặt lệnh ở các mức giá tốt hơn
5. **Đa dạng chiến lược**: Kết hợp nhiều loại lệnh để tạo chiến lược phức tạp

---

Nếu có bất kỳ thắc mắc nào về cách sử dụng lệnh order, vui lòng liên hệ quản trị viên hệ thống AKI để được hỗ trợ.