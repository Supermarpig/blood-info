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

function tagBadge(name) {
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
    ">${name}</span>`;
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
  <title>回報已上線</title>
</head>
<body style="margin:0;padding:0;background:#fff0f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff0f3;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

        <!-- 上方小標 -->
        <tr><td style="text-align:center;padding-bottom:12px;">
          <span style="background:#fce7f3;color:#be185d;font-size:12px;font-weight:700;padding:5px 16px;border-radius:999px;letter-spacing:1.5px;text-transform:uppercase;">
            捐血資訊平台
          </span>
        </td></tr>

        <!-- 主卡片 -->
        <tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(220,38,38,0.10);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#ff6b6b 0%,#dc2626 50%,#be123c 100%);padding:40px 32px;text-align:center;">
            <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;line-height:56px;text-align:center;font-size:26px;color:#fff;font-weight:900;">✓</div>
            <h1 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">你的回報上線囉！</h1>
            <p style="margin:0;color:#fecaca;font-size:14px;">感謝你讓更多人找到好康捐血活動</p>
          </div>

          <!-- 分隔點 -->
          <div style="background:#fff5f5;padding:14px 0;text-align:center;border-bottom:1.5px dashed #fecdd3;">
            <span style="display:inline-block;width:6px;height:6px;background:#fca5a5;border-radius:50%;margin:0 6px;vertical-align:middle;"></span>
            <span style="display:inline-block;width:6px;height:6px;background:#f87171;border-radius:50%;margin:0 6px;vertical-align:middle;"></span>
            <span style="display:inline-block;width:6px;height:6px;background:#fca5a5;border-radius:50%;margin:0 6px;vertical-align:middle;"></span>
          </div>

          <!-- 內容區 -->
          <div style="padding:28px 32px;">

            <!-- 回報卡片 -->
            <div style="background:linear-gradient(135deg,#fff5f5,#fff0f3);border:1.5px solid #fecdd3;border-radius:16px;padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:11px;color:#f43f5e;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">你回報的內容</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:7px 0;font-size:12px;color:#9f1239;font-weight:600;width:48px;">日期</td>
                  <td style="padding:7px 0;font-size:14px;color:#1f2937;font-weight:700;">${date}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">地點</td>
                  <td style="padding:7px 0;font-size:14px;color:#1f2937;font-weight:700;line-height:1.5;">${location}</td>
                </tr>
              </table>
              ${tagSection}
              ${imageBlock}
            </div>

            <!-- 感謝語 -->
            <p style="margin:20px 0;font-size:14px;color:#6b7280;line-height:1.8;text-align:center;">
              因為有你的分享，<br>更多人能找到有贈品的捐血活動
            </p>

            <!-- CTA -->
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
              ">查看活動頁面 →</a>
            </div>

          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;padding:20px 16px 0;">
          <p style="margin:0;font-size:12px;color:#d1d5db;line-height:2;">
            bloodtw.com · 此信件由系統自動寄出<br>
            你填寫回報表單時留下了 Email
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
        subject: '你的捐血贈品回報已成功上線',
        html,
    }),
});

if (!res.ok) {
    const err = await res.text();
    console.error('Resend 寄信失敗:', err);
    process.exit(1);
}

console.log('通知寄送完成');
