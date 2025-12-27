import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Building2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import ImageUploadModal from './ImageUploadModal';

interface DonationEvent {
    id?: string;
    time: string;
    organization: string;
    location: string;
    rawContent: string;
    customNote?: string;
    date: string;
    center?: string;
}

interface CardInfoProps {
    donation: DonationEvent;
    searchKeyword: string;
    className?: string;
}

const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === keyword.toLowerCase() ? (
                    <span key={index} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 font-medium">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default function CardInfo({ donation, searchKeyword, className = '' }: CardInfoProps) {
    const [image, setImage] = useState<string | null>(null);

    // 根據中心決定顏色標籤
    const getCenterColor = (center?: string) => {
        switch (center) {
            case '台北': return 'bg-blue-100 text-blue-700 border-blue-200';
            case '新竹': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case '台中': return 'bg-orange-100 text-orange-700 border-orange-200';
            case '高雄': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md border-gray-200 ${className}`}>
            <CardContent className="p-0">
                <div className="flex flex-col h-full">
                    {/* 頭部：時間與中心標籤 */}
                    <div className="flex items-stretch border-b border-gray-100">
                        <div className="flex-none bg-slate-50 px-4 py-3 flex items-center justify-center border-r border-gray-100 min-w-[100px]">
                            <div className="flex flex-col items-center">
                                <Clock className="w-4 h-4 text-slate-400 mb-1" />
                                <span className="font-bold text-slate-700 whitespace-nowrap">
                                    {highlightText(donation.time, searchKeyword)}
                                </span>
                            </div>
                        </div>
                        <div className="flex-grow p-3 flex items-center justify-between bg-white relative">
                            {donation.center && (
                                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getCenterColor(donation.center)}`}>
                                    {donation.center}
                                </span>
                            )}
                            
                             {/* 手機版可能會太擠，把圖片上傳放這裡或絕對定位 */}
                             <div className="ml-auto p-1">
                                <ImageUploadModal image={image} setImage={setImage} donationID={donation.id} organization={donation.organization} date={donation.date} />
                             </div>
                        </div>
                    </div>

                    {/* 主要內容：地點與機構 */}
                    <div className="p-4 space-y-3 bg-white flex-grow">
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 flex items-start gap-2">
                                <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span>{highlightText(donation.organization, searchKeyword)}</span>
                            </h3>
                        </div>

                        <div>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donation.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-start gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <MapPin className="w-5 h-5 text-red-500 group-hover:text-red-600 flex-shrink-0 mt-0.5" />
                                <span className="text-base font-medium group-hover:underline decoration-blue-400 underline-offset-2">
                                    {highlightText(donation.location, searchKeyword)}
                                </span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5" />
                            </a>
                        </div>

                        {donation.customNote && (
                            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100 mt-2">
                                <span className="font-semibold block text-xs uppercase tracking-wider text-amber-500 mb-0.5">Note</span>
                                {donation.customNote}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
