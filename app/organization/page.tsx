import { Metadata } from "next";
import Link from "@/components/Link";
import { ChevronRight } from "lucide-react";
import { ORGANIZATIONS } from "@/lib/organizationConfig";
import { BASE_URL } from "@/lib/baseUrl";

const baseUrl = BASE_URL;

export const metadata: Metadata = {
  title: "主辦單位捐血活動查詢｜獅子會、慈善團體、企業贊助捐血",
  description:
    "依主辦單位查詢台灣捐血活動，包含國際獅子會各分會、慈善協會、廟宇與企業贊助捐血活動。快速找到你所在社團或企業主辦的近期捐血時間與地點。",
  alternates: { canonical: `${baseUrl}/organization` },
};

const CATEGORY_LABELS: Record<string, string> = {
  lions: "國際獅子會",
  charity: "慈善協會",
  temple: "廟宇／宗教團體",
  company: "企業贊助",
  "blood-center": "捐血中心",
};

const CATEGORY_ORDER = ["lions", "temple", "charity", "company", "blood-center"];

export default function OrganizationIndexPage() {
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof ORGANIZATIONS>>(
    (acc, cat) => {
      acc[cat] = ORGANIZATIONS.filter((o) => o.category === cat);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto p-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          首頁
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">主辦單位</span>
      </nav>

      <h1 className="text-2xl font-bold mb-2">依主辦單位查詢捐血活動</h1>
      <p className="text-gray-600 text-sm mb-8">
        國際獅子會、慈善團體、廟宇與企業贊助的捐血活動，依主辦單位分類查詢。
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const orgs = grouped[cat];
        if (!orgs || orgs.length === 0) return null;
        return (
          <section key={cat} className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="flex flex-wrap gap-2">
              {orgs.map((org) => (
                <Link
                  key={org.slug}
                  href={`/organization/${org.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  {org.displayName}捐血活動
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-red-300 hover:text-red-600 transition-colors"
        >
          ← 查詢全台捐血活動
        </Link>
      </div>
    </div>
  );
}
