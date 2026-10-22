# Nâng cấp camping — bốn giai đoạn

## Giai đoạn 1: kiến trúc và kiểm thử

Kiểm tra source cho thấy main đã bootstrap CampingScene, scene đã dùng FishingSystem,
ConstructionSystem, PlayerControls, GameUI và SaveRepository. Không xóa hoặc làm lại phần đã nối.
Giữ hai entry camping/world chỉ re-export. Main vẫn 35 dòng.

Bổ sung test từng lỗi vị trí, giao dịch nguyên tử, biên chờ 2,5–5 giây và cửa sổ cắn 2 giây.
Toast chỉ hướng tới bờ nước gần nhất thay vì luôn chỉ Ao Sen.

Kiểm tra tại cuối giai đoạn: 14 unit test, TypeScript và 2 luồng Chrome câu cá/dựng trại đều qua.

## Giai đoạn 2: kinh tế và nấu ăn

Save v2 giữ khóa forest-camping-v1; migrate v1 giữ vị trí, vật liệu, trang bị, cá, công trình
và điểm tài nguyên. Vì v1 chỉ có count/largest, migrate một cá với kích thước kỷ lục,
các cá còn lại ở kích thước tối thiểu; không thể khôi phục kích thước đã không được lưu.

Tách fish (sưu tầm trọn đời) và fishBag (từng cá có thể dùng). Thêm xu, đồ sở hữu,
món ăn, buff; quầy mua bán, bếp nấu, đèn, hàng rào và cây chậu. Cửa hàng có tab Bán/Mua.
Nấu tại lửa, canh cần bếp nấu trong khu bếp. Các giao dịch kiểm tra trước khi thay đổi kho.

Giá đang dùng: độ hiếm 3/8/20/60 xu × hệ số kích thước 1–2; cá nướng ×1,8, canh ×2,5.
Mỗi ô trang bị thêm hai món 80/220 xu. Ăn tăng tốc 10% trong 120 giây chơi.
Bán hàng loạt giữ một cá đạt kỷ lục mỗi loài đang có; bán từng cá vẫn giữ bảng sưu tầm.

Kiểm tra cuối giai đoạn: 20 unit test, TypeScript và 2 luồng Chrome dọc/ngang đều qua.
Đã chụp cửa hàng và nấu ăn ở 390×844 / 844×390.

## Giai đoạn 3: kéo cá và cần câu

Nhấn E lúc cá cắn để vào trận; giữ/thả E hoặc nút cảm ứng để điều chỉnh dây.
Căng đỏ đứt dây, chùng lâu cá thoát. Sức cá phụ thuộc độ hiếm/kích thước, giãy theo RNG.
Mô phỏng thuần nhận dt; scene gọi ở bước 1/60. Di chuyển/nhảy hủy câu, pause giữ thời gian.
Câu cá dễ giúp nhả dây gần ngưỡng đỏ khi người chơi giữ kéo.

Cần tre mặc định; sợi thủy tinh 100 xu + 5 gỗ; carbon 350 xu + 8 gỗ + 6 đá;
huyền thoại 1.000 xu + 15 gỗ + 10 đá. Cần cao chịu dây tốt, kéo nhanh, chờ ngắn,
tăng nhẹ trọng số cá hiếm. Mua/equip cần được lưu; chưa thêm mồi câu tùy chọn.

Kiểm tra cuối giai đoạn: 23 unit test, TypeScript và 2 luồng Chrome câu cá/pause/hủy đều qua.
Test bao gồm kéo đúng nhịp thắng, giữ liên tục đứt dây, không kéo cá thoát,
cần cao thắng nhanh hơn và trọng số hợp lệ.

## Giai đoạn 4: rương và ngày đêm

Mỗi công trình có id ổn định, migrate cấp id cho công trình cũ. Mỗi rương có 20 ô,
chồng theo vật liệu hoặc loại cá/kích thước/món ăn. Hai cột cho phép nhấp chuyển chồng
hoặc chuyển tất cả. Kiểm tra trên bản sao rồi commit hai kho; đầy/vượt chồng hủy toàn bộ.
Chưa giới hạn tổng sức chứa balo; gỗ/đá mỗi kho tối đa 9.999.

Đồng hồ 480 giây/ngày bắt đầu 08:00, dừng khi pause/menu. Trời gradient, sao và lớp phủ
thay đổi bình minh/ngày/hoàng hôn/đêm; texture cache một lần. Lửa, bếp, đèn và lều
có ánh sáng đêm, cull trong 650 đơn vị. Tiết kiệm bỏ sao và nhấp nháy đèn.
Cá tầm/cá vàng núi chỉ chiều tối/đêm, chép gấm không cắn đêm. Chưa thêm ngủ tua giờ.

Vòng render tái sử dụng frame/HUD model, không dựng lại texture từng frame;
tránh tạo mảng khi tính hướng điều khiển và tìm công trình gần nhất.
Hook FPS chỉ có trong dev: window.forest.fps.average, cửa sổ đo một giây.

## Kiểm tra cuối và giới hạn

Bản cuối: npm run check xanh (29 unit test; format, lint, TypeScript). npm run test:e2e xanh 22/22, gồm build production/PWA. Có 41 cảnh báo lint legacy, không có lỗi; build vẫn cảnh báo bundle Phaser lớn hơn 500 KB. Đã chạy npm test và npx tsc --noEmit ở cuối từng giai đoạn.

FPS dev đo lần cuối khoảng 31,1 (Đẹp, desktop mặc định) và 38,1 (Tiết kiệm, 844×390), GPU phần mềm SwiftShader. Hai phép đo có viewport khác nhau nên không phải phép so sánh riêng tác động chất lượng. Số texture giữ 58 trong thử nghiệm. Chrome macOS được chạy ẩn,
không tự mở trang web. Đã resize dọc/ngang, kiểm tra PWA offline, Full HD/Retina/4K,
restart/dọn listener, đa pointer hủy/thả/pause và tính ổn định số texture.

Giá và độ khó trên là mức cân bằng ban đầu để chơi thử, chưa qua playtest dài hạn.
Chưa đo trên điện thoại thật, chưa đo pin; số FPS Chrome ẩn/GPU phần mềm không đại diện GPU điện thoại.
Không thêm dependency, không thay đổi Firebase/database/rules, không commit/push/deploy.

Ảnh kiểm tra trong `test-results/`: shop-390.png, shop-844.png, cook-390.png,
cook-844.png, chest-390.png, chest-844.png, night-high.png và night-low-landscape.png.
Dev vẫn phục vụ tại http://localhost:5173/. Không tự mở trình duyệt.
