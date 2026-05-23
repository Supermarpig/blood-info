export type IssueState = "open" | "closed";

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
  state: IssueState;
  createdAt: string;
  user: string;
  labels: string[];
  body: string;
  parsed: ParsedDonation | null;
}

export const STATE_LABEL: Record<IssueState, string> = {
  open: "待處理",
  closed: "已處理",
};

export const STATE_STYLE: Record<IssueState, string> = {
  open: "bg-amber-100 text-amber-700",
  closed: "bg-emerald-100 text-emerald-700",
};
