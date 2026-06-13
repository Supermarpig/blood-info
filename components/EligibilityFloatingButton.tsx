import Link from "@/components/Link";
import { ClipboardCheck } from "lucide-react";

export default function EligibilityFloatingButton() {
  return (
    <Link
      href="/eligibility"
      aria-label="捐血資格測驗"
      className="fixed right-0 z-30 flex -translate-y-1/2 items-center gap-1 rounded-l-xl bg-gradient-to-b from-violet-500 to-purple-600 px-1.5 py-3 text-white shadow-lg transition-all duration-300 hover:px-2.5 hover:shadow-xl"
      style={{ top: "calc(50% + 104px)", writingMode: "vertical-rl" }}
    >
      <ClipboardCheck className="h-3.5 w-3.5" />
      <span className="text-xs font-bold tracking-widest">捐血測驗</span>
    </Link>
  );
}
