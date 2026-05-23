// /services/announcementService.ts
// 站台公告 / 本週推薦：以一個帶 `announcement` 標籤的 GitHub Issue 當儲存。
import {
  listIssues,
  createIssue,
  updateIssue,
} from "@/services/githubIssuesService";

const LABEL = "announcement";
const TITLE = "[公告] 網站公告設定（系統用，請勿關閉）";

export interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  /** 本週推薦捐血地點 */
  spots: string[];
  /** 本週主打贈品 */
  gifts: string[];
  ctaText: string;
  ctaUrl: string;
  /** 版本時間，供前台 localStorage 判斷是否已看過 */
  updatedAt: string;
}

export const EMPTY_ANNOUNCEMENT: Announcement = {
  enabled: false,
  title: "",
  message: "",
  spots: [],
  gifts: [],
  ctaText: "",
  ctaUrl: "",
  updatedAt: "",
};

function parseAnnouncement(body: string): Announcement {
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  if (match) {
    try {
      const d = JSON.parse(match[1]);
      return {
        enabled: !!d.enabled,
        title: d.title || "",
        message: d.message || "",
        spots: Array.isArray(d.spots) ? d.spots : [],
        gifts: Array.isArray(d.gifts) ? d.gifts : [],
        ctaText: d.ctaText || "",
        ctaUrl: d.ctaUrl || "",
        updatedAt: d.updatedAt || "",
      };
    } catch {
      // ignore
    }
  }
  return { ...EMPTY_ANNOUNCEMENT };
}

function buildBody(data: Announcement): string {
  return `## 網站公告設定

此 Issue 由後台「公告」分頁自動維護，內容存於下方 JSON 區塊，請勿手動編輯或關閉。

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`;
}

/** 讀取目前公告（含對應 issue 編號，無則為 null）。 */
export async function getAnnouncement(): Promise<{
  data: Announcement;
  issueNumber: number | null;
}> {
  const issues = await listIssues({ labels: LABEL, state: "all" });
  if (issues.length === 0) {
    return { data: { ...EMPTY_ANNOUNCEMENT }, issueNumber: null };
  }
  return {
    data: parseAnnouncement(issues[0].body),
    issueNumber: issues[0].number,
  };
}

/** 儲存公告（更新既有 issue 或建立新 issue），回傳含最新 updatedAt 的內容。 */
export async function saveAnnouncement(
  input: Omit<Announcement, "updatedAt">
): Promise<Announcement> {
  const { issueNumber } = await getAnnouncement();
  const data: Announcement = { ...input, updatedAt: new Date().toISOString() };
  const body = buildBody(data);

  if (issueNumber) {
    await updateIssue(issueNumber, { title: TITLE, body });
  } else {
    await createIssue(TITLE, body, [LABEL]);
  }
  return data;
}
