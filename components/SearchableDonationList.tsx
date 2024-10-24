// components/SearchableDonationList.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/CardInfo";
import BackToTopButton from "@/components/BackToTopButton";

interface DonationEvent {
    id?: string;
    time: string;
    organization: string;
    location: string;
    rawContent: string;
    customNote?: string;
}

interface SearchableDonationListProps {
    data: Record<string, DonationEvent[]>;
}

export default function SearchableDonationList({ data }: SearchableDonationListProps) {
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [showPastEvents, setShowPastEvents] = useState<boolean>(false);

    const today = new Date().toISOString().split("T")[0];
    const pastEvents: Record<string, DonationEvent[]> = {};
    const todayEvents: Record<string, DonationEvent[]> = {};
    const upcomingEvents: Record<string, DonationEvent[]> = {};

    Object.entries(data).forEach(([date, events]) => {
        if (date < today) {
            pastEvents[date] = events;
        } else if (date === today) {
            todayEvents[date] = events;
        } else {
            upcomingEvents[date] = events;
        }
    });

    const filterEvents = (events: DonationEvent[]) =>
        events.filter(
            (event) =>
                event.organization.includes(searchKeyword) ||
                event.location.includes(searchKeyword) ||
                event.time.includes(searchKeyword)
        );

    const filterAndRenderEventsByDate = (
        eventsByDate: Record<string, DonationEvent[]>,
        backgroundColorClass: string
    ) =>
        Object.entries(eventsByDate)
            .map(([date, events]) => {
                const filteredEvents = filterEvents(events);
                if (filteredEvents.length === 0) return null;
                return (
                    <div key={date}>
                        <div className="sticky top-0 bg-white z-10 shadow-md">
                            <h2 className="text-lg font-medium mb-2 p-2">{date}</h2>
                        </div>
                        <div
                            className={`mb-4 ${backgroundColorClass} p-4 rounded-md shadow-md`}
                        >
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredEvents.map((donation, index) => (
                                    <CardInfo
                                        key={`${donation.id}-${index}`}
                                        donation={donation}
                                        searchKeyword={searchKeyword}
                                        className="transition-transform transform hover:scale-105"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })
            .filter((element) => element !== null);

    const togglePastEvents = () => {
        setShowPastEvents(!showPastEvents);
    };

    return (
        <div>
            <div className="mb-6">
                <Input
                    placeholder="搜索活動（機構名稱、地點）"
                    onChange={debounce((e) => setSearchKeyword(e.target.value), 300)}
                    className="w-full"
                />
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">今日活動</h2>
                {filterAndRenderEventsByDate(todayEvents, "bg-yellow-100")}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">即將開始的活動</h2>
                {filterAndRenderEventsByDate(upcomingEvents, "bg-green-100")}
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold mb-4">已過期的活動</h2>
                    <button
                        onClick={togglePastEvents}
                        className="text-green-700 flex items-center"
                    >
                        {showPastEvents ? (
                            <>
                                <ChevronUp className="h-5 w-5 mr-2" />
                                <span>隱藏</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-5 w-5 mr-2" />
                                <span>顯示</span>
                            </>
                        )}
                    </button>
                </div>
                {showPastEvents && filterAndRenderEventsByDate(pastEvents, "bg-gray-100")}
            </div>

            <BackToTopButton />
        </div>
    );
}
