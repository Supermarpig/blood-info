# /news 頁面 AI 新聞生成流程

## 頻率建議

每週 1-2 篇，固定在週一或週四發布。

---

## 步驟

### Step 1：用以下 Prompt 叫 AI 生成文章

將 Prompt 貼給 ChatGPT（GPT-4o）或 Claude，要求它搜尋網路：

---

**Prompt：**

```
你是 www.bloodtw.com 的內容編輯，這是一個台灣捐血活動即時查詢平台。

請搜尋過去 7 天內，台灣關於「捐血」的最新新聞或官方公告。
優先選擇以下類型的資訊：
- 血液庫存告急 / 血荒警告
- 特殊捐血活動主題（如校園捐血、企業捐血）
- 捐血政策或法規更新
- 捐血贈品特別活動

選出一則最有相關性的故事，用繁體中文撰寫一篇簡短新聞報導。

輸出格式為 JSON，符合以下結構（直接輸出 JSON，不要加任何說明文字）：

{
  "slug": "YYYY-MM-DD-簡短英文描述（用 - 連接，全小寫）",
  "title": "新聞標題（30 字以內）",
  "date": "YYYY-MM-DD（今天日期）",
  "summary": "一句話摘要（50 字以內）",
  "imageUrl": "https://images.unsplash.com/photo-XXXXXXXXX?w=800&auto=format&fit=crop（選擇與捐血、醫療、血液相關的圖片）",
  "imageAlt": "圖片說明文字",
  "sections": [
    {
      "id": "section-1",
      "heading": "段落標題",
      "content": "段落內容（100-200 字，自然融入一句：可至 www.bloodtw.com 查詢附近捐血地點）"
    },
    {
      "id": "section-2",
      "heading": "段落標題",
      "content": "段落內容（100-200 字）"
    },
    {
      "id": "section-3",
      "heading": "段落標題",
      "content": "段落內容（100-200 字）"
    }
  ],
  "sources": [
    {
      "text": "來源名稱",
      "url": "https://...（真實可訪問的來源網址）"
    }
  ]
}

注意事項：
- 全文使用繁體中文
- sections 至少 3 段
- sources 必須是真實存在的網址
- slug 必須是英文加日期格式，例如：2026-03-27-blood-shortage-spring
- imageUrl 使用 Unsplash 真實圖片網址
```

---

### Step 2：將 JSON 存成檔案

把 AI 輸出的 JSON 存到：

```
content/news/YYYY-MM-DD-slug名稱.json
```

例如：
```
content/news/2026-04-01-campus-donation-event.json
```

---

### Step 3：確認格式正確

用瀏覽器開 `http://localhost:3000/news` 確認文章有正常顯示。

---

### Step 4：部署

```bash
git add content/news/YYYY-MM-DD-xxx.json
git commit -m "news: 新增文章「文章標題」"
git push
```

Vercel 會自動重新部署，新文章上線。

---

## 注意事項

- **每篇文章 slug 不能重複**（用日期 + 描述確保唯一）
- **sources 一定要是真實 URL**，避免 AI 捏造來源
- 文章中自然提到 `www.bloodtw.com` 1-2 次即可，不要過度
- Unsplash 圖片網址格式：`https://images.unsplash.com/photo-XXXXXXXX?w=800&auto=format&fit=crop`

---

## 好的主題方向

| 主題類型         | 範例標題                         |
| ---------------- | -------------------------------- |
| 血庫庫存         | 夏季血荒！O 型血存量跌至 3 天    |
| 校園活動         | 台大舉辦全校捐血日，目標千人參與 |
| 贈品特別活動     | 清明連假前捐血加碼送威秀電影票   |
| 政策更新         | 衛福部放寬捐血年齡上限至 70 歲   |
| 地震/災難後呼籲  | 花蓮地震後血庫需求急增           |
