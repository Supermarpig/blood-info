# SEO 政策事實表

這份檔案存放**本站 SEO 策略所依賴的 Google 政策斷言**，每一條都帶「來源網址 + 最後驗證日 + 官方原文」。

## 為什麼需要這份檔案

`.claude/commands/post.md` 之類的 skill 檔案裡曾直接寫死政策斷言（例如「Google 已停止顯示 FAQ 富結果」）。
那種寫法有兩個問題：

1. **不知道它何時被驗證過**，所以也不知道它過期了沒。
2. **AI 助理的知識有截止日**，對截止日之後的變動不但無感，還不會自覺。

規則:**任何政策斷言都必須寫在這裡並附最後驗證日。skill 檔案只引用，不重述。**

## 檢查時機

`/post` 每次執行時會先做時效檢查（見 post.md Step 0）。手動檢查就抓這頁：

- **Search Central 文件更新日誌**：https://developers.google.com/search/updates
- 比對「最後驗證日」之後的條目，只要動到 structured data / rich results / AI 功能 / Discover / 排名系統就更新本表。

**上次全表驗證日：2026-08-02**

---

## 現行斷言

### 1. FAQ 富結果已停用

- **狀態**：已確認停用
- **最後驗證**：2026-08-02
- **來源**：https://developers.google.com/search/updates（2026-06-15 條目）
- **原文**：「the FAQ rich result feature is no longer shown in Google Search results」
- **時間軸**：2026-05-07 停止顯示 → 2026-06-15 官方文件移除 → 2026-08 Search Console API 支援結束
- **對本站的意思**：不要為了 SERP 展開而加 FAQPage JSON-LD，沒有效果。
- **但注意**：FAQPage **仍是合法的 schema.org 型別**，既有頁面上的標記留著不會被懲罰，不需要專案去清除。

### 2. AI Overviews / AI Mode 沒有專屬優化手段

- **狀態**：已確認
- **最後驗證**：2026-08-02
- **來源**：https://developers.google.com/search/docs/appearance/ai-features
- **原文**：
  - 「There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary.」
  - 「You don't need to create new machine readable files, AI text files, or markup to appear in these features. There's also no special schema.org structured data that you need to add.」
- **Google 實際建議的做法**：
  - 頁面要能被索引、且有資格顯示摘要片段
  - robots.txt 允許爬取
  - **透過內部連結讓內容容易被發現**
  - 良好的頁面體驗
  - **重要內容必須以文字形式存在**
- **對本站的意思**：⚠️ 不要再宣稱「用問句寫法搶 AI 引用」是一種獨立技巧——那是 SEO 圈的推論，不是 Google 的說法。
  問句式寫作仍然值得做（它天然滿足「重要內容以文字形式存在」且好讀），但要當成**一般的好內容**，不是 AI 專屬破解法。
  真正被官方點名的槓桿是**內部連結**，那個本站可以直接控制。

### 3. llms.txt 對 Google 搜尋無用

- **狀態**：已確認
- **最後驗證**：2026-08-02
- **來源**：https://developers.google.com/search/updates（2026-06-15 條目）
- **摘要**：Google 明確表示 llms.txt 對 Google 搜尋並非必要；要為了別的服務維護可以，但不要期待它影響 Google。
- **對本站的意思**：不要花時間做 llms.txt。

### 4. 評論摘要規範收緊

- **狀態**：已確認
- **最後驗證**：2026-08-02
- **來源**：https://developers.google.com/search/updates（2026-07-24 條目）
- **摘要**：新增針對「假評論與未揭露的利益相關評論」的規範。
- **對本站的意思**：目前不影響（本站無評論結構化資料）。若日後要做捐血點評價功能，先回來讀這條。

---

## 待驗證 / 尚無定論

| 主題 | 現況 | 該查什麼 |
|---|---|---|
| 精選摘要（featured snippet）是否仍為獨立 SERP 功能 | **未驗證**。post.md 假設它還在，但在 AI Overviews 擴張後未經確認 | Search Central 文件的 snippet 相關頁面 |
| Discover 流量的具體進入條件 | 本站 Discover 長期為 0，原因未定 | Discover 官方文件 + Search Console Discover 報表 |

---

## Search Console API 設定（`pnpm gsc` 需要）

`scripts/gscInsights.js` 用 service account 讀 Search Console 數據。一次性設定：

1. **開 Google Cloud 專案**：https://console.cloud.google.com/ →建立專案（名字隨意，例如 `bloodtw-seo`）
2. **啟用 API**：搜尋「Google Search Console API」→ 啟用
3. **建 service account**：IAM 與管理 → 服務帳戶 → 建立服務帳戶 → 取個名字 → 建立並繼續 → 角色可略過 → 完成
4. **下載金鑰**：點進該服務帳戶 → 金鑰 → 新增金鑰 → 建立新金鑰 → **JSON** → 下載
5. **金鑰放進專案**：把下載的檔案改名為 `.gsc-service-account.json` 放在專案根目錄（已列入 .gitignore）
6. **在 Search Console 授權**：https://search.google.com/search-console → 選 bloodtw.com 資源 → 設定 → 使用者和權限 → 新增使用者 → 貼上 service account 的 email（長得像 `xxx@專案名.iam.gserviceaccount.com`）→ 權限選「完整」或「受限」皆可
7. **補 `.env.local`**：

   ```
   GSC_SITE_URL=sc-domain:bloodtw.com
   GSC_SERVICE_ACCOUNT_FILE=.gsc-service-account.json
   ```

   `GSC_SITE_URL` 要跟 Search Console 裡的資源類型一致：網域資源用 `sc-domain:bloodtw.com`，
   網址前置字元資源用 `https://www.bloodtw.com/`。填錯會拿到 403。

8. **驗證**：`pnpm gsc`

若出現 403，最常見原因是第 6 步沒做、或做了但還沒生效（偶爾要等幾分鐘）。
