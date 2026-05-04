// 從 GitHub Actions 環境變數取得 Issue body
const issueBody = JSON.parse(process.env.ISSUE_BODY || '""');

// 從 JSON 區塊解析回報資料
const jsonMatch = issueBody.match(/```json\s*([\s\S]*?)```/);
let data = {};
try { data = JSON.parse(jsonMatch?.[1] || '{}'); } catch {}

const email = data.email || '';
if (!email) {
    console.log('此回報無提供 Email，略過通知');
    process.exit(0);
}
console.log(`寄送通知至: ${email}`);

const location = data.address      || '未知地點';
const date     = data.activityDate || '未知日期';
const tags     = data.tags         || [];
const imgur    = data.imgurUrl     || '';

// ── 樣式設定 ────────────────────────────────────────────
const SITE_URL = 'https://bloodtw.com';

const TAG_EMOJI = {
    '電影票': '🎬', '禮券': '🎫', '超商': '🏪',
    '餐飲': '☕', '生活用品': '🧴', '食品': '🍱',
};

function tagBadge(name) {
    const emoji = TAG_EMOJI[name] || '🎁';
    return `<span style="
        display:inline-block;
        background:linear-gradient(135deg,#fdf2f8,#fce7f3);
        color:#be185d;
        border:1.5px solid #f9a8d4;
        border-radius:999px;
        padding:5px 14px;
        font-size:13px;
        font-weight:600;
        margin:4px 4px 4px 0;
    ">${emoji} ${name}</span>`;
}

const tagSection = tags.length
    ? `<div style="margin-top:16px;padding-top:16px;border-top:1.5px dashed #fecdd3;">
         ${tags.map(tagBadge).join('')}
       </div>`
    : '';

const imageBlock = imgur
    ? `<div style="margin-top:16px;border-radius:12px;overflow:hidden;border:2px solid #fecdd3;">
         <img src="${imgur}" alt="贈品圖片" style="width:100%;max-height:200px;object-fit:cover;display:block;" />
       </div>`
    : '';

// ── HTML 模板 ────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>你的回報已上線 🎉</title>
</head>
<body style="margin:0;padding:0;background:#fff0f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff0f3;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

        <!-- 裝飾小標 -->
        <tr><td style="text-align:center;padding-bottom:12px;">
          <span style="background:#fce7f3;color:#be185d;font-size:12px;font-weight:700;padding:5px 14px;border-radius:999px;letter-spacing:1px;">
            🩸 捐血資訊平台
          </span>
        </td></tr>

        <!-- 主卡片 -->
        <tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(220,38,38,0.10);">

          <!-- Header 漸層 -->
          <div style="background:linear-gradient(135deg,#ff6b6b 0%,#dc2626 50%,#be123c 100%);padding:36px 32px;text-align:center;position:relative;">
            <div style="font-size:52px;margin-bottom:8px;line-height:1;">🎉</div>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
              你的回報上線囉！
            </h1>
            <p style="margin:0;color:#fecaca;font-size:14px;">感謝你讓更多人找到好康捐血活動 💪</p>
          </div>

          <!-- 分隔波浪 emoji -->
          <div style="background:#fff5f5;text-align:center;font-size:22px;padding:10px 0;letter-spacing:6px;border-bottom:1.5px dashed #fecdd3;">
            ❤️ 🩸 ❤️
          </div>

          <!-- 內容區 -->
          <div style="padding:28px 32px;">

            <!-- 回報卡片 -->
            <div style="background:linear-gradient(135deg,#fff5f5,#fff0f3);border:1.5px solid #fecdd3;border-radius:16px;padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:11px;color:#f43f5e;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">
                📋 你回報的內容
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:7px 0;vertical-align:top;width:28px;font-size:16px;">📅</td>
                  <td style="padding:7px 0;font-size:12px;color:#9f1239;font-weight:600;width:40px;">日期</td>
                  <td style="padding:7px 0;font-size:14px;color:#1f2937;font-weight:700;">${date}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;vertical-align:top;font-size:16px;">📍</td>
                  <td style="padding:7px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">地點</td>
                  <td style="padding:7px 0;font-size:14px;color:#1f2937;font-weight:700;line-height:1.5;">${location}</td>
                </tr>
              </table>
              ${tagSection}
              ${imageBlock}
            </div>

            <!-- 感謝語 -->
            <p style="margin:20px 0;font-size:14px;color:#6b7280;line-height:1.8;text-align:center;">
              因為有你的分享，<br>
              更多人能找到有贈品的捐血活動 🫶
            </p>

            <!-- CTA 按鈕 -->
            <div style="text-align:center;">
              <a href="${SITE_URL}" style="
                display:inline-block;
                background:linear-gradient(135deg,#f43f5e,#dc2626);
                color:#ffffff;
                font-size:15px;
                font-weight:700;
                text-decoration:none;
                padding:14px 40px;
                border-radius:999px;
                letter-spacing:0.5px;
                box-shadow:0 4px 14px rgba(220,38,38,0.35);
              ">查看活動頁面 →</a>
            </div>

          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding:20px 16px 0;">
          <p style="margin:0;font-size:12px;color:#f43f5e;opacity:0.7;line-height:2;">
            🩸 bloodtw.com<br>
            <span style="color:#9ca3af;font-size:11px;">
              此信件自動寄出 · 你填寫回報表單時留下了 Email
            </span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

// ── 寄信 ────────────────────────────────────────────────
const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        from: '捐血資訊平台 <noreply@bloodtw.com>',
        to: [email],
        subject: '🎉 你的捐血贈品回報已成功上線！',
        html,
    }),
});

if (!res.ok) {
    const err = await res.text();
    console.error('Resend 寄信失敗:', err);
    process.exit(1);
}

console.log('通知寄送完成');
