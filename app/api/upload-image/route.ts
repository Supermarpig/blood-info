import { NextResponse } from 'next/server';
import { createBloodImgInfo } from '@/services/bloodService';

// 刷新 Imgur Token
async function refreshImgurToken() {
    const clientId = process.env.IMGUR_CLIENT_ID;
    const clientSecret = process.env.IMGUR_CLIENT_SECRET;
    const refreshToken = process.env.IMGUR_REFRESH_TOKEN;

    const bodyParams = new URLSearchParams({
        refresh_token: refreshToken || '',  // 使用空字符串以避免 undefined
        client_id: clientId || '',
        client_secret: clientSecret || '',
        grant_type: 'refresh_token',
    });

    const response = await fetch('https://api.imgur.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams,
    });

    const data = await response.json();

    if (data.access_token) {
        process.env.IMGUR_ACCESS_TOKEN = data.access_token;
        if (data.refresh_token) {
            process.env.IMGUR_REFRESH_TOKEN = data.refresh_token;
        }
        console.log("Access token refreshed successfully");
    } else {
        console.error("Failed to refresh access token", data);
        throw new Error("Failed to refresh access token");
    }
}

// 上傳圖片至 Imgur
// async function uploadToImgur(imageBase64: string, accessToken: string, albumId: string) {
async function uploadToImgur(imageBase64: string, accessToken: string) {
let response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            image: imageBase64,
            type: 'base64',
            // album: albumId,
        }),
    });

    let imgurResponse = await response.json();

    // 如果 Token 過期，嘗試刷新 Token 並重新上傳
    if (imgurResponse.status === 403 && imgurResponse.data?.error === 'invalid_token') {
        console.warn("Access token expired, refreshing...");
        await refreshImgurToken();

        // 使用新的 access_token 再次嘗試上傳
        const newAccessToken = process.env.IMGUR_ACCESS_TOKEN;
        response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${newAccessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                image: imageBase64,
                type: 'base64',
                // album: albumId,
            }),
        });
        imgurResponse = await response.json();
    }

    return imgurResponse;
}

// 處理 POST 請求
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const organization = formData.get('organization') as string;
        const imageFile = formData.get('file') as File;
        const activityDate = formData.get('activityDate') as string;


        if (!id || !organization || !imageFile) {
            console.error('Missing required fields:', { id, organization, imageFile });
            return NextResponse.json(
                { error: 'Missing required fields: id, organization, file' },
                { status: 400 }
            );
        }

        const buffer = await imageFile.arrayBuffer();
        const imageBase64 = Buffer.from(buffer).toString('base64');

        const albumId = process.env.IMGUR_ALBUM_ID || 'lzqTBTa';
        const accessToken = process.env.IMGUR_ACCESS_TOKEN;

        // 檢查 accessToken 和 albumId 是否存在
        if (!accessToken) {
            console.error('Imgur access token is not configured');
            return NextResponse.json(
                { error: 'Imgur access token is not configured' },
                { status: 500 }
            );
        }

        if (!albumId) {
            console.error('Imgur album ID is not configured');
            return NextResponse.json(
                { error: 'Imgur album ID is not configured' },
                { status: 500 }
            );
        }

        // 傳遞確保為 string 類型的 accessToken 和 albumId
        const imgurResponse = await uploadToImgur(imageBase64, accessToken);

        if (!imgurResponse.success || !imgurResponse.data?.link) {
            console.error('Imgur upload failed:', imgurResponse);
            return NextResponse.json(
                { error: 'Failed to upload image to Imgur' },
                { status: 500 }
            );
        }

        const imgUrl = imgurResponse.data.link;
        console.log('Uploaded image URL:', imgUrl);

        // 儲存圖片信息到 MongoDB
        const newImageInfo = await createBloodImgInfo({
            id,
            organization,
            imgUrl,
            activityDate
        });
        return NextResponse.json(
            { message: 'Image uploaded successfully',  data: newImageInfo },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error handling POST request:', error);
        return NextResponse.json({ error: 'Failed to handle image upload' }, { status: 500 });
    }
}
