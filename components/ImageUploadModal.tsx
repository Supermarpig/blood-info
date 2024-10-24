// /components/ImageUploadModal.tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

// 定義 Zod schema 進行表單驗證
const schema = z.object({
    imageUrl: z.string().url('必須是有效的 URL').min(1, '圖片 URL 不能為空'),
});

interface FormData {
    imageUrl: string;
}

interface ImageUploadModalProps {
    image: string | null;
    setImage: (image: string | null) => void;
    buttonText?: string; // 可選的按鈕文本
    donationID: string | undefined;
    organization: string;
}

export default function ImageUploadModal({ image, setImage, buttonText = '+', donationID, organization }: ImageUploadModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false); // 控制提交後狀態
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // 提交表單並發送到後端 API
    const onSubmit = async (data: FormData) => {
        if (!donationID || !organization) {
            console.error('donationID 或 organization 未定義');
            return;
        }

        try {
            const response = await fetch('/api/save-image-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: donationID,
                    organization,
                    imgUrl: data.imageUrl,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('提交成功:', result);
                // 更新圖片狀態並顯示提交成功訊息
                setImage(data.imageUrl);
                setIsSubmitted(true);
                reset(); // 重置表單
            } else {
                const errorData = await response.json();
                console.error('提交失敗:', errorData);
                // 你可以根據需要顯示錯誤訊息
            }
        } catch (error) {
            console.error('提交時發生錯誤:', error);
            // 你可以根據需要顯示錯誤訊息
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {image ? (
                    <button className="bg-gray-200 rounded-full flex items-center justify-center size-16">
                        <img src={image} alt="Uploaded" className="rounded-full w-full h-full object-cover" />
                    </button>
                ) : (
                    <button className="bg-gray-200 p-4 rounded-full w-8 h-8 flex items-center justify-center">
                        <span className="w-8 h-8 flex items-center justify-center">{buttonText}</span>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-screen overflow-auto">
                <DialogHeader>
                    <DialogTitle>{image ? '' : '新增活動圖片 URL'}</DialogTitle>
                </DialogHeader>

                {image ? (
                    <>
                        {isSubmitted ? (
                            <div className="text-center">
                                <p className="text-green-500">圖片 URL 提交成功，等待審核！</p>
                            </div>
                        ) : null}
                        <img src={image} alt="Uploaded" className="object-contain" />
                    </>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                                圖片 URL
                            </label>
                            <input
                                type="text"
                                id="imageUrl"
                                {...register('imageUrl')}
                                className="p-4 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="請輸入圖片 URL"
                            />
                            {errors.imageUrl && (
                                <p className="mt-2 text-sm text-red-600">{errors.imageUrl.message}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                                提交
                            </button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
