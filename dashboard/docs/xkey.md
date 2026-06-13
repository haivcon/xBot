# 🔑 xKey - Offline Wallet Vault

**xKey** là dự án mã nguồn mở sinh ra với một mục tiêu duy nhất: **Quản lý danh sách Ví Web3 một cách cực kỳ bảo mật**.

## Kiến trúc Không Máy Chủ (Serverless)

Khác với các ứng dụng ví thông thường yêu cầu đồng bộ đám mây, xKey hoạt động theo triết lý **Offline First**.
- Toàn bộ dữ liệu của bạn được mã hóa bằng thuật toán `AES-256-CBC` mạnh mẽ.
- Dữ liệu mã hóa được lưu trực tiếp vào ổ cứng/bộ nhớ trong thiết bị của bạn thông qua `Capacitor Preferences`.
- Không có bất kỳ gói dữ liệu nào được truyền ra ngoài. Do đó, ngay cả khi điện thoại bị theo dõi qua mạng WiFi, tài sản của bạn vẫn an toàn.

## Tính năng nổi bật

### 1. Xác thực Sinh trắc học (Biometric)
Khi mở ứng dụng hoặc khi muốn xem Private Key, xKey bắt buộc phải quét Vân tay / FaceID của chủ thiết bị.
Nếu xác thực thất bại, Private Key sẽ bị khóa vĩnh viễn trong phiên làm việc đó.

### 2. Xuất / Nhập hàng loạt (Batch Ops)
Bạn có hàng trăm ví testnet/airdrop? xKey hỗ trợ:
- Tính năng xuất toàn bộ danh sách ví ra file `.csv` chuẩn định dạng.
- Nhập danh sách ví vào hệ thống mới (Yêu cầu mật khẩu Backup).

### 3. Hỗ trợ đa ngôn ngữ
xKey đã được bản địa hóa ra **15 ngôn ngữ** khác nhau, cho phép bất kỳ ai trên thế giới cũng có thể sử dụng dễ dàng.

## Làm sao để cài đặt?

Vì tính chất bảo mật và liên quan đến Private Key, chúng tôi khuyến cáo người dùng tải ứng dụng Android (APK) trực tiếp từ kho lưu trữ mã nguồn mở GitHub.

1. Truy cập [Github Releases](https://github.com/haivcon/xkey/releases/latest).
2. Tải file `xKey.apk`.
3. Cho phép cài đặt ứng dụng từ "Nguồn không xác định" trên Android.
4. Mở app và thiết lập mật khẩu cấp 1 (Master Password).
