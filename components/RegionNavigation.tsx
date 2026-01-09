"use client";

import Link from "next/link";
import { REGIONS } from "@/lib/regionConfig";
import { MapPin } from "lucide-react";

interface RegionNavigationProps {
  currentSlug?: string;
}

/**
 * Navigation component for switching between different region pages.
 * Displays all available regions as clickable links.
 */
export default function RegionNavigation({
  currentSlug,
}: RegionNavigationProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-red-500" />
        <span className="text-sm font-medium text-gray-700">按地區瀏覽</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            !currentSlug
              ? "bg-red-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          全部地區
        </Link>
        {REGIONS.map((region) => (
          <Link
            key={region.slug}
            href={`/region/${region.slug}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              currentSlug === region.slug
                ? "bg-red-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {region.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
