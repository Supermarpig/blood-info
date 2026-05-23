// /services/githubIssuesService.ts
// 後台管理用的 GitHub Issues 封裝。
// 回報資料的「單一來源」是 GitHub Issues（label: donation-report），
// 與既有的前台表單、importReports.js 匯入流程共用同一份 issue。

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const API = "https://api.github.com";

export interface ParsedDonation {
  address: string;
  activityDate: string;
  time: string;
  tags: string[];
  imgurUrl: string;
  email: string;
}

export interface AdminIssue {
  number: number;
  title: string;
  htmlUrl: string;
  state: "open" | "closed";
  createdAt: string;
  user: string;
  labels: string[];
  body: string;
  /** 僅 donation-report 會解析出結構化欄位 */
  parsed: ParsedDonation | null;
}

function ensureConfig() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error("GITHUB_TOKEN 或 GITHUB_REPO 未設定");
  }
}

function ghHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * 從 issue body 解析回報欄位。優先讀 ```json``` 區塊，失敗則退回表格解析。
 * 與 scripts/importReports.js 的解析邏輯一致。
 */
export function parseDonationIssue(body: string): ParsedDonation | null {
  if (!body) return null;

  const jsonMatch = body.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const d = JSON.parse(jsonMatch[1]);
      return {
        address: d.address || "",
        activityDate: d.activityDate || "",
        time: d.time || "",
        tags: Array.isArray(d.tags) ? d.tags : [],
        imgurUrl: d.imgurUrl || d.imageUrl || "",
        email: d.email || "",
      };
    } catch {
      // 落到表格解析
    }
  }

  const addressMatch = body.match(/\| 📍 地址 \| (.+?) \|/);
  const dateMatch = body.match(/\| 📅 日期 \| (.+?) \|/);
  const timeMatch = body.match(/\| ⏰ 時間 \| (.+?) \|/);
  const tagsMatch =
    body.match(/\| 🏷️ 贈品 \| (.+?) \|/) || body.match(/\| 🏷️ 標籤 \| (.+?) \|/);
  const emailMatch = body.match(/\| 📧 通知 Email \| (.+?) \|/);
  const imageMatch = body.match(/!\[.*?\]\((.+?)\)/);

  if (!addressMatch && !dateMatch) return null;

  const tagsStr = tagsMatch ? tagsMatch[1].trim() : "";
  const timeStr = timeMatch ? timeMatch[1].trim() : "";
  const emailStr = emailMatch ? emailMatch[1].trim() : "";

  return {
    address: addressMatch ? addressMatch[1].trim() : "",
    activityDate: dateMatch ? dateMatch[1].trim() : "",
    time: timeStr && timeStr !== "未指定" ? timeStr : "",
    tags:
      tagsStr && tagsStr !== "無"
        ? tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    imgurUrl: imageMatch ? imageMatch[1].trim() : "",
    email: emailStr && emailStr !== "未提供" ? emailStr : "",
  };
}

/**
 * 依回報欄位組出 issue body（含 json 區塊 + 預覽表格），確保 importReports 可解析。
 */
export function buildDonationBody(d: ParsedDonation): string {
  const giftTagsText = d.tags.length > 0 ? d.tags.join(", ") : "無";
  const json = JSON.stringify(
    {
      address: d.address,
      activityDate: d.activityDate,
      time: d.time,
      tags: d.tags,
      imgurUrl: d.imgurUrl,
      email: d.email || "",
    },
    null,
    2
  );

  return `## 捐血地點回報

### 資料
\`\`\`json
${json}
\`\`\`

### 預覽
| 欄位 | 內容 |
|------|------|
| 📍 地址 | ${d.address} |
| 📅 日期 | ${d.activityDate} |
| ⏰ 時間 | ${d.time || "未指定"} |
| 🏷️ 贈品 | ${giftTagsText} |
| 📧 通知 Email | ${d.email || "未提供"} |

${d.imgurUrl ? `### 圖片\n![${d.address}](${d.imgurUrl})\n` : ""}---
*此 Issue 由後台管理建立/編輯*
`;
}

interface RawIssue {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  user?: { login?: string };
  labels?: (string | { name?: string })[];
  body?: string;
  pull_request?: unknown;
}

function toAdminIssue(i: RawIssue): AdminIssue {
  return {
    number: i.number,
    title: i.title,
    htmlUrl: i.html_url,
    state: i.state,
    createdAt: i.created_at,
    user: i.user?.login || "",
    labels: (i.labels || []).map((l) =>
      typeof l === "string" ? l : l.name || ""
    ),
    body: i.body || "",
    parsed: parseDonationIssue(i.body || ""),
  };
}

/**
 * 列出指定 label 與狀態的 issues（排除 PR）。
 */
export async function listIssues(opts: {
  labels: string;
  state?: "open" | "closed" | "all";
}): Promise<AdminIssue[]> {
  ensureConfig();
  const state = opts.state || "open";
  const url = `${API}/repos/${GITHUB_REPO}/issues?labels=${encodeURIComponent(
    opts.labels
  )}&state=${state}&per_page=100&sort=created&direction=desc`;

  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GitHub API 錯誤: ${res.status}`);
  }
  const issues: RawIssue[] = await res.json();
  return issues.filter((i) => !i.pull_request).map(toAdminIssue);
}

/**
 * 建立一筆地點回報 issue（後台手動新增），走與前台表單相同的格式。
 */
export async function createDonationIssue(
  d: ParsedDonation
): Promise<AdminIssue> {
  ensureConfig();
  const title = `[回報] ${d.activityDate} - ${d.address}`;
  const res = await fetch(`${API}/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: ghHeaders(),
    body: JSON.stringify({
      title,
      body: buildDonationBody(d),
      labels: ["donation-report"],
    }),
  });
  if (!res.ok) {
    throw new Error(`GitHub API 錯誤: ${res.status}`);
  }
  return toAdminIssue(await res.json());
}

/**
 * 更新 issue（標題/內容/開關狀態）。
 */
export async function updateIssue(
  issueNumber: number,
  patch: {
    title?: string;
    body?: string;
    state?: "open" | "closed";
    state_reason?: "completed" | "not_planned" | "reopened";
  }
): Promise<AdminIssue> {
  ensureConfig();
  const res = await fetch(
    `${API}/repos/${GITHUB_REPO}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: ghHeaders(),
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub API 錯誤: ${res.status}`);
  }
  return toAdminIssue(await res.json());
}
