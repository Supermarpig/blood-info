"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, Calendar } from "lucide-react";
import { debounce } from "@/utils";
import CardInfo from "@/components/CardInfo";
import BackToTopButton from "@/components/BackToTopButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface DonationEvent {
    id?: string;
    time: string;
    organization: string;
    location: string;
    rawContent: string;
    customNote?: string;
    date: string;
    center?: string;
    detailUrl?: string;
}

interface SearchableDonationListProps {
    data: Record<string, DonationEvent[]>;
}

export default function SearchableDonationList({ data }: SearchableDonationListProps) {
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [selectedCenter, setSelectedCenter] = useState<string>("全部");
    const [showPastEvents, setShowPastEvents] = useState<boolean>(false);

    const today = new Date().toISOString().split("T")[0];

    // 整理所有可用的中心列表
    const centers = ["全部", "台北", "新竹", "台中", "高雄"];

    // 使用 useMemo 優化資料處理
    const { todayEvents, upcomingEvents, pastEvents } = useMemo(() => {
        const _pastEvents: Record<string, DonationEvent[]> = {};
        const _todayEvents: Record<string, DonationEvent[]> = {};
        const _upcomingEvents: Record<string, DonationEvent[]> = {};

        Object.entries(data).forEach(([date, events]) => {
            // 1. 先篩選中心
            const centerFilteredEvents = selectedCenter === "全部" 
                ? events 
                : events.filter(e => e.center === selectedCenter);

            // 2. 再篩選關鍵字
            const keywordFilteredEvents = centerFilteredEvents.filter(
                (event) =>
                    event.organization.includes(searchKeyword) ||
                    event.location.includes(searchKeyword) ||
                    event.time.includes(searchKeyword)
            );

            if (keywordFilteredEvents.length > 0) {
                if (date < today) {
                    _pastEvents[date] = keywordFilteredEvents;
                } else if (date === today) {
                    _todayEvents[date] = keywordFilteredEvents;
                } else {
                    _upcomingEvents[date] = keywordFilteredEvents;
                }
            }
        });

        return {
            todayEvents: _todayEvents,
            upcomingEvents: _upcomingEvents,
            pastEvents: _pastEvents
        };
    }, [data, selectedCenter, searchKeyword, today]);

    const renderEventSection = (
        eventsByDate: Record<string, DonationEvent[]>,
        title: string,
        icon: React.ReactNode
    ) => {
        const dates = Object.keys(eventsByDate).sort();
        if (dates.length === 0) return null;

        return (
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    {icon}
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {dates.reduce((acc, date) => acc + eventsByDate[date].length, 0)} 場
                    </span>
                </div>
                
                <div className="space-y-6">
                    {dates.map((date) => (
                        <div key={date} className="relative">
                            <div className="sticky top-0 z-10 py-2 -mx-4 px-4 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 mb-2">
                                <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {date}
                                </h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {eventsByDate[date].map((donation, index) => (
                                    <CardInfo
                                        key={`${donation.id}-${index}`}
                                        donation={donation}
                                        searchKeyword={searchKeyword}
                                        className="h-full"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* 頂部搜尋與篩選區 */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-4 pt-2 mb-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <Tabs value={selectedCenter} onValueChange={setSelectedCenter} className="w-full md:w-auto">
                        <TabsList className="w-full md:w-auto grid grid-cols-5 md:flex bg-slate-100 p-1">
                            {centers.map(center => (
                                <TabsTrigger 
                                    key={center} 
                                    value={center}
                                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                >
                                    {center}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="搜尋機構、地點..."
                            onChange={debounce((e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value), 300)}
                            className="pl-9 bg-white border-slate-200 focus:border-primary w-full"
                        />
                    </div>
                </div>
            </div>

            {/* 主要內容區 */}
            <div className="space-y-8 pb-20">
                {/* 今日活動 */}
                {renderEventSection(
                    todayEvents, 
                    "今日活動", 
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                )}

                {/* 未來活動 */}
                {renderEventSection(
                    upcomingEvents, 
                    "即將開始", 
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-1"></span>
                )}

                {/* 歷史活動控制 */}
                <div className="pt-8 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => setShowPastEvents(!showPastEvents)}
                        className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-12"
                    >
                        {showPastEvents ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                隱藏已過期的活動
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                查看已過期的活動 ({Object.keys(pastEvents).length} 天)
                            </>
                        )}
                    </Button>
                    
                    {showPastEvents && (
                        <div className="mt-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            {renderEventSection(pastEvents, "已過期活動", <span className="w-2 h-2 rounded-full bg-gray-400"></span>)}
                        </div>
                    )}
                </div>
            </div>

            <BackToTopButton />
        </div>
    );
}
