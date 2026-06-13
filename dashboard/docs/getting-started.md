# Bắt Đầu Nhanh

Chào mừng bạn đến với **xLayer.my**! Hệ sinh thái được thiết kế để giải quyết bài toán: *Làm sao để giao dịch trên Telegram tiện lợi, nhưng vẫn đảm bảo tuyệt đối an toàn cho Private Key?*

## Luồng hoạt động chuẩn (Khuyên dùng)

Thay vì trực tiếp tạo ví trên Telegram (nơi rủi ro về kết nối), quy trình bảo mật cao nhất được thiết lập như sau:

1. **Tạo ví hoàn toàn Offline**: Sử dụng thiết bị di động (Android) tải ứng dụng **xKey**. Ứng dụng này hoạt động hoàn toàn ngoại tuyến.
2. **Xuất Private Key (Copy)**: Lấy Private Key của bạn thông qua xác thực sinh trắc học trên xKey.
3. **Nhập vào xBot**: Truy cập `@XlayerAi_bot` trên Telegram, dán Private Key vào để bot sử dụng giao dịch.
4. **Cơ chế tự xóa (Auto-delete)**: Ngay lập tức, Bot sẽ **tự động xóa tin nhắn** chứa Private Key của bạn trên Telegram để tránh rủi ro lộ lọt qua khung chat.

::: info Cập nhật Mới
Bạn hiện có thể dùng tính năng [Quét QR] để truyền Private Key qua camera mà không cần phải Copy/Paste!
:::

## Câu hỏi thường gặp

### xKey có thật sự Offline?
Có. Hệ thống xKey không tích hợp bất kỳ một API gửi/nhận dữ liệu nào ra bên ngoài. Toàn bộ tính năng mã hóa `AES-256` diễn ra ngay trên CPU thiết bị của bạn.

### Tiền của tôi có an toàn trên xBot?
Chúng tôi lưu trữ các Private Key đã mã hóa trên môi trường Server an toàn và không ai (kể cả quản trị viên) có thể đọc được số Private Key này dưới dạng văn bản (plain-text). Tuy nhiên, bạn vẫn nên thiết lập một ví riêng biệt chỉ dùng cho Trading Bot thay vì dùng ví Hold dài hạn.
