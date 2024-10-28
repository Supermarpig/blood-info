// /api/upload-image/route.ts

/**
* 要先將圖片上傳到imgur api 取得圖片網址imgUrl
* 然後再把圖片存到 mongoDB裡面 依照下面的格式儲存這樣
*/
// /api/upload-image/route.ts

import { NextResponse } from 'next/server';
import { createBloodImgInfo } from '@/services/bloodService';
import { IImgFileInput } from '@/models/BloodImgCheck';

// 使用 Imgur API 上傳圖片到指定相簿
async function uploadToImgur(imageBase64: string, accessToken: string, albumId: string) {
    const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image: imageBase64,
            type: 'base64',
            album: albumId, // 指定上傳的相簿 ID
        }),
    });

    return response.json();
}

// 從 Imgur 獲取 Access Token 的函數
async function getAccessToken(authCode: string) {
    const clientId = process.env.IMGUR_CLIENT_ID;
    const clientSecret = process.env.IMGUR_CLIENT_SECRET;

    const response = await fetch('https://api.imgur.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId || '',
            client_secret: clientSecret || '',
            grant_type: 'authorization_code',
            code: authCode,  // 從回調 URL 獲得的 `code`
        }),
    });

    return response.json();
}

export async function POST(request: Request) {
    try {
        const body: Partial<IImgFileInput> = await request.json();
        const { id, organization, imageBase64 } = body;

        // 驗證必要欄位
        if (!id || !organization || !imageBase64) {
            return NextResponse.json(
                { error: 'Missing required fields: id, organization, imageBase64' },
                { status: 400 }
            );
        }

        // 假設你已經通過用戶授權獲得了 `authCode`
        const authCode = 'AUTH_CODE_FROM_USER_AUTHORIZATION_FLOW'; // 用戶授權流程獲得
        const tokenResponse = await getAccessToken(authCode);

        if (!tokenResponse || !tokenResponse.access_token) {
            return NextResponse.json(
                { error: 'Failed to retrieve access token' },
                { status: 500 }
            );
        }

        const accessToken = tokenResponse.access_token;
        const albumId = 'lzqTBTa';  // 你的相簿 ID

        // 上傳圖片到 Imgur
        const imgurResponse = await uploadToImgur(imageBase64, accessToken, albumId);
        if (!imgurResponse.success) {
            return NextResponse.json(
                { error: 'Failed to upload image to Imgur' },
                { status: 500 }
            );
        }

        const imgUrl = imgurResponse.data.link;

        // 建立新的血液圖片信息並儲存到 MongoDB
        const newBloodImgInfo = await createBloodImgInfo({
            id,
            organization,
            imgUrl,
        });

        return NextResponse.json(
            { message: 'Image uploaded and URL saved successfully', data: newBloodImgInfo },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error handling POST request:', error);
        return NextResponse.json({ error: 'Failed to save URL' }, { status: 500 });
    }
}