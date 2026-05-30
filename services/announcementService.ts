// /services/announcementService.ts
// 站台公告 / 本週推薦：以一個帶 `announcement` 標籤的 GitHub Issue 當儲存。
import { unstable_cache } from "next/cache";
import {
  listIssues,
  createIssue,
  updateIssue,
} from "@/services/githubIssuesService";

export const ANNOUNCEMENT_CACHE_TAG = "announcement";

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
  /** 是否啟用前台「今日自動推薦」（後台未填推薦地點時自動挑今天有贈品的一間） */
  autoRecommend: boolean;
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
  autoRecommend: true,
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
        autoRecommend: d.autoRecommend !== false, // 預設開啟
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

/** 讀取目前公告（含對應 issue 編號與狀態，無則為 null）。已關閉的 issue 視為停用。 */
export async function getAnnouncement(): Promise<{
  data: Announcement;
  issueNumber: number | null;
  state: "open" | "closed" | null;
}> {
  const issues = await listIssues({ labels: LABEL, state: "all" });
  if (issues.length === 0) {
    return { data: { ...EMPTY_ANNOUNCEMENT }, issueNumber: null, state: null };
  }
  const issue = issues[0];
  const data = parseAnnouncement(issue.body);
  // 已關閉的 issue 一律視為停用，前台不顯示
  if (issue.state !== "open") data.enabled = false;
  return { data, issueNumber: issue.number, state: issue.state };
}

/** 讀取公告（含 Next.js 跨 invocation 快取，5 分鐘 TTL）。前台請用這個。 */
export const getCachedAnnouncement = unstable_cache(
  async (): Promise<Announcement> => {
    const { data } = await getAnnouncement();
    return data;
  },
  [ANNOUNCEMENT_CACHE_TAG],
  { revalidate: 300, tags: [ANNOUNCEMENT_CACHE_TAG] }
);

/** 儲存公告（更新既有 issue 或建立新 issue），存檔時會重新開啟 issue 使其生效。 */
export async function saveAnnouncement(
  input: Omit<Announcement, "updatedAt">
): Promise<Announcement> {
  const { issueNumber } = await getAnnouncement();
  const data: Announcement = { ...input, updatedAt: new Date().toISOString() };
  const body = buildBody(data);

  if (issueNumber) {
    await updateIssue(issueNumber, {
      title: TITLE,
      body,
      state: "open",
      state_reason: "reopened",
    });
  } else {
    await createIssue(TITLE, body, [LABEL]);
  }
  return data;
}
