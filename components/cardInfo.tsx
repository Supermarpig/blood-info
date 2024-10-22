// components/cardInfo.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function CardInfo({ donation, searchKeyword }: CardInfoProps) {
    return (
        <Card key={donation.id} className="shadow-lg">
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
                    <p>
                        <span className="font-semibold">地點：</span>
                        {highlightText(donation.location, searchKeyword)}
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
