# 台灣捐血活動資訊網

> 今天哪裡有捐血車？全台捐血活動即時查詢，包含捐血站地點、開放時間與贈品資訊。

**線上網站：[bloodtw.com](https://bloodtw.com)**

---

## 功能介紹

- **即時活動查詢**：每日自動更新全台捐血車與捐血站資訊
- **縣市篩選**：支援台北、新北、台中、高雄等各縣市快速切換
- **贈品篩選**：依贈品類型（電影票、超商禮券、餐飲券等）篩選活動
- **PTT 資訊整合**：同步顯示 PTT 血液板網友分享的活動細節與圖片
- **行事曆檢視**：月曆視角瀏覽即將舉行的捐血活動

---

## 頁面說明

| 路徑 | 說明 |
| ---- | ---- |
| `/` | 首頁，今日全台捐血活動列表 |
| `/region/[slug]` | 各地區頁面（北區、桃竹苗、中區、南區） |
| `/gift/[slug]` | 依贈品類型篩選頁面 |
| `/calendar` | 捐血活動行事曆 |
| `/faq` | 捐血常見問題 |

---

## 技術架構

- **Framework**：Next.js 14（App Router）
- **UI**：Tailwind CSS + shadcn/ui
- **資料庫**：MongoDB
- **部署**：Vercel

---

## 本地開發

```bash
# 安裝套件
pnpm install

# 啟動開發伺服器
pnpm dev

# 更新捐血資料
pnpm updateData
```

環境變數請參考 `.env.example`。

---

## 資料來源

- 台灣血液基金會各捐血中心公告
- PTT 血液板（[blood.ptt.cc](https://www.ptt.cc/bbs/Blood/index.html)）

---

## 授權

MIT License
