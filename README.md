# Pixel Forest

Game Phaser 3.90 với rừng đêm, DJ, khiên bảo vệ và nhạc.

Chơi tại https://vundu2309.github.io/web-g/

## Mã nguồn và phát hành

Mã nguồn ở `game/`. Thư mục gốc chứa nội dung build để GitHub Pages phục vụ từ nhánh `main`, thư mục `/ (root)`.

```sh
cd game
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
```

Khi phát hành: chép toàn bộ nội dung `game/dist/` ra thư mục gốc repository rồi commit cùng mã nguồn. Giữ `.nojekyll`. Không chép source `game/index.html` ra gốc.

Nhạc nằm ở `game/public/assets/audio/song-gio.mp3`, được build ra `assets/audio/song-gio.mp3`. Nhạc chỉ phát sau tương tác khi có hiệu ứng DJ và bật âm nhạc.

Manifest và service worker hỗ trợ cài đặt và cache game offline; nhạc không được cache trước.
