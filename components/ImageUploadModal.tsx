import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

// 定義 Zod schema 進行表單驗證
const schema = z.object({
    imageUrl: z.string().url('必須是有效的 URL').nonempty('圖片 URL 不能為空'),
});

interface FormData {
    imageUrl: string;
}

interface ImageUploadModalProps {
    image: string | null;
    setImage: (image: string | null) => void;
    buttonText?: string; // 可選的按鈕文本
}

export default function ImageUploadModal({ image, setImage, buttonText = '+' }: ImageUploadModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false); // 控制提交後狀態
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // 提交表單並發送到 Google Sheets
    const onSubmit = async (data: FormData) => {
        try {
            // 在此發送請求到 Google Sheets API，或者使用 Google Forms 等來記錄數據
            await fetch('/api/save-image-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: data.imageUrl }),
            });

            // 提交成功後，更新圖片狀態並關閉表單
            setImage(data.imageUrl);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting image URL:', error);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>

                {image ? (
                    <button className="bg-gray-200 rounded-full flex items-center justify-center  size-16">
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

                {
                    image ?
                        <>
                            {isSubmitted
                                ?
                                <div className="text-center">
                                    <p className="text-green-500">圖片 URL 提交成功，等待審核！</p>
                                </div>
                                : ''
                            }
                            <img src={image} alt="Uploaded" className="object-contain" />
                        </>
                        :
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
                }
            </DialogContent>
        </Dialog>
    );
}
