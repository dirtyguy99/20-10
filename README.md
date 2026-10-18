# Một món quà nho nhỏ dành cho cậu

Trang web 2D chúc mừng Ngày Phụ nữ Việt Nam 20/10, với bó hoa hồng đỏ trên nền đen và các hiệu ứng trái tim.

## Tính năng

- 20 bông hồng đỏ, dùng chung 10 lời chúc. Mỗi lời chúc gắn với hai bông hoa.
- Chạm vào hoa để mở thiệp; chỉ những lời chúc khác nhau mới được tính vào tiến trình.
- Xem đủ 10 lời chúc sẽ tự mở màn bất ngờ: chữ vàng bay xoay rồi ghép thành câu “Chúc mừng cậu đã nhận gói đáng iu trọn đờiii <3”.
- Hai sticker nền trong suốt lắc nhẹ ở trên và dưới dòng chữ.
- Nhạc nền tự lặp khi kết thúc, bắt đầu từ lần tương tác đầu tiên. Có nút bật/tắt nhạc.
- Ghi nhớ tiến trình trong trình duyệt; hỗ trợ điện thoại, bàn phím và chế độ giảm chuyển động.

- Photobooth ở góc phải: bật camera và tự bấm chụp từng tấm, mỗi lần đếm ngược 3 giây. Đủ 4 tấm mới ghép dải ảnh dọc. Có đổi camera, chụp lại tấm vừa rồi hoặc cả bộ và tải PNG 720 × 2200 px, gồm 4 ảnh chữ nhật ngang 600 × 440 px.
- Khung giấy trắng ngà phủ toàn bộ dải ảnh, 4 ô chữ nhật viền thẳng có cùng kích thước và lề, chữ Womens Day bằng font viết tay Great Vibes; tông giấy trắng ngà và chữ đỏ theo ảnh tham khảo, 4 sticker hoa nhỏ (2 hoa hồng, 2 tulip), 1 nơ hồng và nét tim mảnh phân bố ở viền; nền giấy lặp chữ nghiêng “it's always you” tràn ra hai cạnh và mép dưới, phần tiêu đề giữ sạch, cùng sao vàng nhạt trong ảnh. Font Great Vibes được lưu kèm theo giấy phép OFL trong assets/.
- Khi đóng photobooth hoặc chuyển ứng dụng, những tấm đã chụp vẫn được giữ để chụp tiếp.
- Camera chỉ bật sau khi nhấn nút, tự tắt khi chụp xong, đóng photobooth hoặc chuyển ứng dụng. Ảnh được xử lý trên thiết bị, không gửi lên máy chủ.

## Chạy trang web

Không cần cài thư viện hoặc chạy bước build. Photobooth cần HTTPS (như Vercel) hoặc máy chủ `localhost`, và quyền camera của trình duyệt.

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
photobooth.css
photobooth.js
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
