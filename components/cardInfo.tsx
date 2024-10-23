import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface DonationEvent {
    id?: string;
    time: string;
    organization: string;
    location: string;
    rawContent: string;
    customNote?: string;
}

interface CardInfoProps {
    donation: DonationEvent;
    searchKeyword: string;
    className?: string; // 新增 className 屬性
}

const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === keyword.toLowerCase() ? (
                    <span key={index} className="bg-yellow-200 rounded-sm p-1">
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
    return (
        <Card key={donation.id} className={`shadow-lg ${className}`}>
            <CardHeader>
                <CardTitle className="text-lg">
                    {highlightText(donation.organization, searchKeyword)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p>
                        <span className="font-semibold">時間：</span>
                        {highlightText(donation.time, searchKeyword)}
                    </p>
                    <p className="flex items-center">
                        {/* 地圖 icon，點擊後打開 Google Maps */}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donation.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:text-orange-700 hover:underline flex items-center"
                        >
                            <FaMapMarkerAlt className=" mr-1" />
                            {highlightText(donation.location, searchKeyword)}
                        </a>
                    </p>



                    {donation.customNote && (
                        <p className="text-blue-600">
                            <span className="font-semibold">註記：</span>
                            {donation.customNote}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
