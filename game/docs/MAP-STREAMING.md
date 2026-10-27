# Map tải theo camera và chi phí render

## Đã triển khai

- `WorldStreamer` tạo texture địa hình, nước, trang trí và cây quanh camera thay vì toàn map.
- Vùng nhìn có đệm 256 đơn vị cho tán vươn từ ngoài màn hình; mỗi chunk dài 512 đơn vị.
- Chunk đang nhìn được dựng ngay; nạp trước tối đa một chunk mỗi lần cập nhật.
- Giữ đệm ba chunk để tránh dựng/gỡ liên tục khi đi qua ranh giới; vùng xa hủy sprite trước rồi gỡ texture.
- Texture biến thể cây dùng chung được giữ trong cache hữu hạn; khi quay lại, art chunk tái tạo xác định.
- Tán cây chỉ xoay khi hộp bao có tính độ nghiêng giao camera. Tiết kiệm trả góc về 0 một lần.
- Theo dõi display-list add/remove để gán cameraFilter đúng ngay cả khi tổng số object không đổi.
- Dọn chunk khi shutdown/restart. Dữ liệu map, collider, mốc cảnh, tài nguyên, công trình và Save vẫn giữ nguyên.

Đây là dựng hình từ dữ liệu local theo vị trí, không phải tải map qua mạng. Chưa chuyển việc sinh texture sang worker:
đến một vùng hoàn toàn mới vẫn có chi phí dựng/upload, nhất là khi dịch chuyển xa. Prefetch giảm nhu cầu dựng lúc vào view.
Lớp nước/thác và luật gameplay giữ nguyên; không tự thay chất lượng hoặc DPR trong đợt này.

## Số đo

Chrome headless, GPU phần mềm; viewport PC 1600×900 và điện thoại 390×844 (không giả lập pointer coarse).
Đã chụp/xem vùng rừng và mép phải map; đi qua x=930, 3400, 8000, 15600 rồi quay lại x=930.

| Đại lượng                      | Trước: dựng toàn map   | Sau: các vị trí đã đo           |
| ------------------------------ | ---------------------- | ------------------------------- |
| Chunk địa hình                 | 32                     | 4–8 chunk đang giữ              |
| Dữ liệu texture chunk RGBA thô | 20.322.304 byte        | 1.726.464–5.636.096 byte        |
| Cây có sprite                  | 43                     | 5–10 cây đang giữ               |
| Ví dụ PC ở x=3400              | cập nhật xoay toàn map | 3/10 tán đang giữ được cập nhật |

Byte texture tính từ chiều rộng × chiều cao × 4 của các texture terrain/water/decor; số trước tính từ toàn bộ metadata.
Đây không phải tổng bộ nhớ game, JS heap hay số đo VRAM: chưa tính sprite dùng chung, nền, framebuffer và bản sao CPU/GPU.
Cache sprite cây có thể tăng khi gặp biến thể mới, rồi ổn định; không dùng tổng texture bằng nhau ở hai vùng làm tiêu chí.
Không suy ra FPS điện thoại từ Chrome headless. Chưa có benchmark thiết bị thật hoặc đo GPU từng pass.

## Vì sao DPR, hậu xử lý và nhiều lớp nền tăng tải GPU?

Canvas ở chế độ Đẹp dùng mật độ tối đa DPR 3. Tăng mật độ cả chiều rộng lẫn chiều cao làm số pixel tăng theo bình phương.
Ví dụ màn hình CSS 1920×1080, bỏ qua sai số làm tròn lưới pixel:

| Mật độ | Backing canvas | Pixel mỗi khung           |
| ------ | -------------- | ------------------------- |
| DPR 1  | 1920×1080      | khoảng 2,07 triệu         |
| DPR 2  | 3840×2160      | khoảng 8,29 triệu, gấp 4  |
| DPR 3  | 5760×3240      | khoảng 18,66 triệu, gấp 9 |

`LightPipeline` xử lý camera thế giới bằng một pass hậu xử lý toàn khung: đọc màu cảnh, đọc trường sáng,
nhân RGB rồi ghi kết quả. Pixel art có ít chi tiết không làm pass này tự chạy ở độ phân giải nghệ thuật thấp.
Framebuffer lớn còn tốn bộ nhớ và băng thông đọc/ghi. Camera tách lớp không có nghĩa cả ba camera đều vẽ lại mọi object:
cameraFilter chỉ cho object đi qua đúng camera của nó.

`WorldLighting` chỉ tính/upload trường sáng theo ô 10 lần/giây ở Đẹp, 5 lần/giây ở Tiết kiệm.
Giảm tần suất này giảm việc tính trên CPU và upload; shader toàn khung vẫn chạy theo mỗi frame hiển thị.
Vì vậy giảm tick ánh sáng không đồng nghĩa giảm cùng tỉ lệ chi phí hậu xử lý GPU.

Nền Đẹp có năm lớp, Tiết kiệm hai lớp. Mỗi lớp dùng TileSprite; chuyển ngày/đêm hoặc chuyển loại rừng có thể pha nhiều
texture trên cùng lớp. Các vùng chồng nhau tiếp tục lấy mẫu và blend pixel (overdraw), tăng tải khi DPR cao.
Đây là lý do chi phí tăng về cấu trúc; chưa profile GPU thật nên chưa kết luận pass nào là nút thắt chính.

## Kiểm chứng

- `npm run check`: 191/191 unit test; 0 lỗi mới, giữ 41 warning ESLint và 3 warning CSS legacy.
- `npm run build`: đạt; giữ cảnh báo chunk JavaScript lớn đã có.
- `npx playwright test`: 33/33 đạt trong bản sao `/tmp/pixel-streaming/isolate`, cổng 8101/8102.
- Test mới: nạp/gỡ xa, quay lại đúng pixel, giữ tiến trình, cameraFilter, culling tán và restart.
- Không thay Firebase, thêm dependency, commit, push hoặc deploy.
