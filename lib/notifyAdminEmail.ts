/**
 * 站長通知信（Resend）。
 *
 * 沿用既有的寄信管道：scripts/sendNotification.js 已經用 Resend 從
 * noreply@bloodtw.com 寄信給回報者，網域驗證過了，這裡只是換一個收件人。
 *
 * 原則：通知失敗絕不能影響使用者的操作。呼叫端一律當作「送出去就好」，
 * 這裡把所有錯誤吞掉並記 log。
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "捐血資訊平台 <noreply@bloodtw.com>";

/** 收件人可用環境變數覆蓋，免得換信箱還要改程式 */
function adminRecipient(): string {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || "cody.yu@bloodtw.com";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function send(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log("[notifyAdminEmail] 未設定 RESEND_API_KEY，略過通知");
    return;
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [adminRecipient()],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[notifyAdminEmail] Resend 失敗:", await res.text());
    }
  } catch (err) {
    console.error("[notifyAdminEmail] Resend 例外:", err);
  }
}

/** 有人投稿活動海報 → 通知站長去審 */
export async function notifyPosterSubmitted(params: {
  eventId: string;
  eventLabel: string;
  imageUrl: string;
}): Promise<void> {
  const label = escapeHtml(params.eventLabel || params.eventId);
  const eventUrl = `https://www.bloodtw.com/activity/${encodeURIComponent(
    params.eventId
  )}`;

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
    <tr><td style="padding:20px 20px 12px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">有人上傳了活動海報，等你審核</p>
      <p style="margin:0;font-size:15px;font-weight:600;line-height:1.5;">${label}</p>
    </td></tr>
    <tr><td style="padding:0 20px;">
      <img src="${escapeHtml(params.imageUrl)}" alt="投稿海報"
           style="width:100%;height:auto;display:block;border:1px solid #e5e7eb;border-radius:8px;" />
    </td></tr>
    <tr><td style="padding:16px 20px 20px;">
      <a href="https://www.bloodtw.com/admin"
         style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;">
        前往後台審核
      </a>
      <a href="${eventUrl}"
         style="display:inline-block;margin-left:10px;color:#6b7280;text-decoration:none;padding:10px 0;font-size:13px;">
        看這場活動
      </a>
      <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;">
        審核通過後，這張圖就會顯示在該場活動上（清單卡片與活動頁）。
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  await send(`[待審] 有人上傳海報：${params.eventLabel || params.eventId}`, html);
}
