import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FAQ_DATA } from "@/data/faq";

const PREVIEW_COUNT = 5;

export default function FaqSection() {
  const items = FAQ_DATA.slice(0, PREVIEW_COUNT);

  return (
    <section className="mt-10 mb-4" aria-label="常見問題">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">常見問題</h2>
        <Link
          href="/faq"
          className="text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          查看全部 {FAQ_DATA.length} 則 →
        </Link>
      </div>
      <div className="space-y-2">
        {items.map(({ question, answer }) => (
          <details
            key={question}
            className="group bg-white border border-gray-100 rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none select-none text-sm font-medium text-gray-800">
              {question}
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
