// /api/upload-image/route.ts

/**
* 要先將圖片上傳到imgur api 取得圖片網址imgUrl
* 然後再把圖片存到 mongoDB裡面 依照下面的格式儲存這樣
*/

import { NextResponse } from 'next/server';
import { createBloodImgInfo } from '@/services/bloodService';
import { IImgUrlInput } from '@/models/BloodImgCheck';

export async function POST(request: Request) {
    try {
        const body: Partial<IImgUrlInput> = await request.json();

        // 驗證必要欄位
        const { id, organization, imgUrl } = body;
        if (!id || !organization || !imgUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: id, organization, imgUrl' },
                { status: 400 }
            );
        }

        // 建立新的血液圖片信息
        const newBloodImgInfo = await createBloodImgInfo({
            id,
            organization,
            imgUrl,
        });

        return NextResponse.json(
            { message: 'URL submitted successfully', data: newBloodImgInfo },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error handling POST request:', error);
        return NextResponse.json({ error: 'Failed to save URL' }, { status: 500 });
    }
}
