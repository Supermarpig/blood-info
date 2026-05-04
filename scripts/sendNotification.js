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

// ── Email 樣式設定 ──────────────────────────────────────
const BRAND_RED   = '#dc2626';
const LIGHT_RED   = '#fff7f7';
const BORDER_RED  = '#fee2e2';
const SITE_URL    = 'https://bloodtw.com';

const TAG_EMOJI = {
    '電影票': '🎬',
    '禮券':   '🎫',
    '超商':   '🏪',
    '餐飲':   '☕',
    '生活用品': '🧴',
    '食品':   '🍱',
};

function tagBadge(name) {
    const emoji = TAG_EMOJI[name] || '🎁';
    return `<span style="
        display:inline-block;
        background:#fdf2f8;
        color:#be185d;
        border:1px solid #fbcfe8;
        border-radius:999px;
        padding:3px 12px;
        font-size:13px;
        font-weight:500;
        margin:3px 4px 3px 0;
    ">${emoji} ${name}</span>`;
}

const tagSection = tags.length
    ? `<div style="margin-top:14px;border-top:1px solid ${BORDER_RED};padding-top:14px;">
         ${tags.map(tagBadge).join('')}
       </div>`
    : '';

const imageBlock = imgur
    ? `<img src="${imgur}" alt="贈品圖片" style="
        width:100%;
        max-height:220px;
        object-fit:cover;
        border-radius:10px;
        margin:16px 0;
        display:block;
      " />`
    : '';

// ── HTML Email 模板 ────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>你的回報已上線</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:${BRAND_RED};border-radius:14px 14px 0 0;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:28px;">🩸</p>
          <h1 style="margin:8px 0 4px;color:#fff;font-size:20px;font-weight:700;letter-spacing:0.5px;">捐血資訊平台</h1>
          <p style="margin:0;color:#fecaca;font-size:13px;">bloodtw.com</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#111827;font-weight:700;">你的回報已成功上線 ✓</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
            感謝你提供捐血贈品資訊，讓更多人能找到划算的捐血活動！
          </p>

          <!-- 回報卡片 -->
          <div style="background:${LIGHT_RED};border:1px solid ${BORDER_RED};border-radius:12px;padding:20px 20px 16px;">
            <p style="margin:0 0 12px;font-size:11px;color:#ef4444;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
              你的回報內容
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;width:80px;">📅 日期</td>
                <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;">${date}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;vertical-align:top;">📍 地點</td>
                <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;line-height:1.5;">${location}</td>
              </tr>
            </table>
            ${tagSection}
            ${imageBlock}
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-top:28px;">
            <a href="${SITE_URL}" style="
              display:inline-block;
              background:${BRAND_RED};
              color:#ffffff;
              font-size:15px;
              font-weight:600;
              text-decoration:none;
              padding:13px 36px;
              border-radius:9px;
            ">查看活動頁面 →</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 14px 14px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">
            此信件由 <a href="${SITE_URL}" style="color:#ef4444;text-decoration:none;">bloodtw.com</a> 自動寄出<br>
            你收到此信是因為填寫回報表單時留下了 Email
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── 寄信 ──────────────────────────────────────────────
const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        from: `捐血資訊平台 <noreply@bloodtw.com>`,
        to: [email],
        subject: '你的回報已成功上線 ✓',
        html,
    }),
});

if (!res.ok) {
    const err = await res.text();
    console.error('Resend 寄信失敗:', err);
    process.exit(1);
}

console.log('通知寄送完成');
