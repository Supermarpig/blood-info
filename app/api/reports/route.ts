// /app/api/reports/route.ts
import { NextResponse } from "next/server";

interface LocationReportInput {
  type: "location";
  address: string;
  activityDate: string;
  imgurUrl: string;
  tags?: string[];
}

interface WishlistInput {
  type: "wishlist";
  title: string;
  description: string;
}

type ReportInput = LocationReportInput | WishlistInput;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

async function createGitHubIssue(
  title: string,
  body: string,
  labels: string[]
): Promise<{ success: boolean; issueUrl?: string; error?: string }> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error("GITHUB_TOKEN or GITHUB_REPO is not defined");
    return { success: false, error: "伺服器設定錯誤，請聯繫管理員" };
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ title, body, labels }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("GitHub API error:", errorData);
    return { success: false, error: "無法建立 Issue，請稍後再試" };
  }

  const issueData = await response.json();
  return { success: true, issueUrl: issueData.html_url };
}

function handleLocationReport(data: LocationReportInput) {
  const { address, activityDate, imgurUrl, tags } = data;

  // 基本驗證
  if (!address || !activityDate || !imgurUrl) {
    return { error: "缺少必要欄位：地址、日期或圖片連結", status: 400 };
  }

  if (!imgurUrl.includes("i.imgur.com")) {
    return { error: "圖片網址必須來自 i.imgur.com", status: 400 };
  }

  // 轉換時間標籤
  const timeTags = (tags || []).filter((t) =>
    ["早上", "下午", "整天"].includes(t)
  );
  const giftTags = (tags || []).filter(
    (t) => !["早上", "下午", "整天"].includes(t)
  );

  let timeStr = "";
  if (timeTags.includes("整天")) {
    timeStr = "09:00~17:00";
  } else if (timeTags.includes("早上") && timeTags.includes("下午")) {
    timeStr = "09:00~17:00";
  } else if (timeTags.includes("早上")) {
    timeStr = "09:00~12:00";
  } else if (timeTags.includes("下午")) {
    timeStr = "13:00~17:00";
  }

  const giftTagsText = giftTags.length > 0 ? giftTags.join(", ") : "無";
  const issueTitle = `[回報] ${activityDate} - ${address}`;
  const issueBody = `## 捐血地點回報

### 資料
\`\`\`json
{
  "address": "${address}",
  "activityDate": "${activityDate}",
  "time": "${timeStr}",
  "tags": ${JSON.stringify(giftTags)},
  "imgurUrl": "${imgurUrl}"
}
\`\`\`

### 預覽
| 欄位 | 內容 |
|------|------|
| 📍 地址 | ${address} |
| 📅 日期 | ${activityDate} |
| ⏰ 時間 | ${timeStr || "未指定"} |
| 🏷️ 贈品 | ${giftTagsText} |

### 圖片
![${address}](${imgurUrl})

---
*此 Issue 由使用者透過網站表單自動建立*
`;

  return {
    title: issueTitle,
    body: issueBody,
    labels: ["donation-report"],
    successMessage: "回報提交成功，感謝您的協助！",
  };
}

function handleWishlistReport(data: WishlistInput) {
  const { title, description } = data;

  // 基本驗證
  if (!title || !description) {
    return { error: "缺少必要欄位：標題或說明", status: 400 };
  }

  if (title.length < 2) {
    return { error: "標題至少需要 2 個字", status: 400 };
  }

  if (description.length < 10) {
    return { error: "說明至少需要 10 個字", status: 400 };
  }

  const issueTitle = `[許願] ${title}`;
  const issueBody = `## 功能許願 ✨

### 功能名稱
${title}

### 功能說明
${description}

---
*此 Issue 由使用者透過網站表單自動建立*
`;

  return {
    title: issueTitle,
    body: issueBody,
    labels: ["wishlist", "enhancement"],
    successMessage: "許願成功，感謝您的建議！",
  };
}

export async function POST(request: Request) {
  try {
    const body: ReportInput = await request.json();
    const reportType = body.type || "location";

    let result;
    if (reportType === "wishlist") {
      result = handleWishlistReport(body as WishlistInput);
    } else {
      result = handleLocationReport(body as LocationReportInput);
    }

    // 檢查驗證錯誤
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // 建立 GitHub Issue
    const issueResult = await createGitHubIssue(
      result.title,
      result.body,
      result.labels
    );

    if (!issueResult.success) {
      return NextResponse.json({ error: issueResult.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: result.successMessage,
        issueUrl: issueResult.issueUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error handling report submission:", error);
    return NextResponse.json(
      { error: "提交失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
