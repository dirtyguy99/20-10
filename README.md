# Một món quà nho nhỏ dành cho cậu

Trang web 2D chúc mừng Ngày Phụ nữ Việt Nam 20/10, với bó hoa hồng trên nền đen và các hiệu ứng trái tim.

## Tính năng

- 20 bông hồng, dùng chung 10 lời chúc. Mỗi lời chúc gắn với hai bông hoa.
- Chạm vào hoa để mở thiệp; chỉ những lời chúc khác nhau mới được tính vào tiến trình.
- Xem đủ 10 lời chúc sẽ tự mở màn bất ngờ: chữ vàng bay xoay rồi ghép thành câu “Chúc mừng cậu đã nhận gói đáng iu trọn đờiii”.
- Hai sticker nền trong suốt lắc nhẹ ở trên và dưới dòng chữ.
- Nhạc nền tự lặp khi kết thúc, bắt đầu từ lần tương tác đầu tiên. Có nút bật/tắt nhạc.
- Ghi nhớ tiến trình trong trình duyệt; hỗ trợ điện thoại, bàn phím và chế độ giảm chuyển động.

## Chạy trang web

Mở `index.html` bằng trình duyệt. Không cần cài thư viện hoặc chạy bước build.

Nếu có Python, có thể chạy máy chủ cục bộ:

```sh
python -m http.server 8000
```

Sau đó truy cập `http://localhost:8000`.

## Triển khai với GitHub Pages

Trong **Settings → Pages**, chọn **Deploy from a branch**, nhánh **main**, thư mục **/(root)** và lưu. Kho đã chứa `.nojekyll` để phục vụ trang tĩnh.

## Cấu trúc và chỉnh sửa

```text
index.html
style.css
app.js
assets/
  background-music.mp3
  cat-cutout.png
  love-cutout.png
```

- Sửa 10 lời chúc trong danh sách `wishes` của `app.js`.
- Sửa giao diện và chuyển động trong `style.css`.
- Thay `assets/background-music.mp3` để đổi nhạc. Âm lượng mặc định là 38%.
- Font tải từ Google Fonts, có font dự phòng khi không có mạng.
- Âm thanh và hình tham chiếu do người dùng cung cấp; hai sticker được xử lý thành PNG trong suốt.
