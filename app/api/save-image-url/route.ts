import { NextResponse } from 'next/server';

// 定義 POST 方法
export async function POST(request: Request) {
    try {
        const { imageUrl } = await request.json();

        // 在這裡處理 imageUrl，例如保存到 Google Sheets 或數據庫中
        console.log('Received image URL:', imageUrl);

        return NextResponse.json({ message: 'URL submitted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error handling POST request:', error);
        return NextResponse.json({ error: 'Failed to save URL' }, { status: 500 });
    }
}
