import { NextResponse } from 'next/server';
import { createBloodImgInfo } from '@/services/bloodService';
// import { IImgFileInput } from '@/models/BloodImgCheck';

async function uploadToImgur(imageBase64: string, clientId: string, albumId: string) {
    const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
            Authorization: `Client-ID ${clientId}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            image: imageBase64,
            type: 'base64',
            album: albumId, // 指定上傳的相簿 ID
        }),
    });

    return response.json();
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const organization = formData.get('organization') as string;
        const imageFile = formData.get('imageFile') as File;

        // 檢查必要字段
        if (!id || !organization || !imageFile) {
            return NextResponse.json(
                { error: 'Missing required fields: id, organization, imageFile' },
                { status: 400 }
            );
        }
        
        // 讀取文件並轉換為 Base64
        const buffer = await imageFile.arrayBuffer();
        const imageBase64 = Buffer.from(buffer).toString('base64');

        const clientId = process.env.IMGUR_CLIENT_ID;
        const albumId = 'lzqTBTa'; // 您的相簿 ID

        if (!clientId) {
            return NextResponse.json(
                { error: 'Imgur client ID is not configured' },
                { status: 500 }
            );
        }

        // 上載圖片到 Imgur
        const imgurResponse = await uploadToImgur(imageBase64, clientId, albumId);
        if (!imgurResponse.success) {
            console.error('Imgur upload failed:', imgurResponse);
            return NextResponse.json(
                { error: 'Failed to upload image to Imgur' },
                { status: 500 }
            );
        }

        const imgUrl = imgurResponse.data.link;

        // 創建新的血液圖片信息並保存到 MongoDB
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
