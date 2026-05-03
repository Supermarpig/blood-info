import { NextResponse } from 'next/server';
import crypto from 'crypto';

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '請選擇圖片' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: '圖片不能超過 5MB' }, { status: 400 });
        }
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: '只接受圖片檔案' }, { status: 400 });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return NextResponse.json({ error: '上傳設定錯誤' }, { status: 500 });
        }

        const timestamp = Math.round(Date.now() / 1000);
        const signature = crypto
            .createHash('sha1')
            .update(`folder=blood-reports&timestamp=${timestamp}${apiSecret}`)
            .digest('hex');

        const uploadForm = new FormData();
        uploadForm.append('file', file);
        uploadForm.append('api_key', apiKey);
        uploadForm.append('timestamp', String(timestamp));
        uploadForm.append('signature', signature);
        uploadForm.append('folder', 'blood-reports');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: uploadForm }
        );

        const result = await response.json();

        if (!result.secure_url) {
            console.error('Cloudinary upload failed:', result);
            return NextResponse.json({ error: '圖片上傳失敗，請稍後再試' }, { status: 500 });
        }

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json({ error: '圖片上傳失敗，請稍後再試' }, { status: 500 });
    }
}
