'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const urlSchema = z.object({
    imageUrl: z.string().url('必須是有效的網址').min(1, '圖片網址不能為空'),
})

const fileSchema = z.object({
    imageFile: z.instanceof(File).refine((file) => file.size <= 5000000, `文件大小不能超過 5MB.`)
        .refine(
            (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
            "僅支援 .jpg、.png 和 .webp 格式"
        ),
})

const formSchema = z.discriminatedUnion('uploadType', [
    z.object({ uploadType: z.literal('url'), ...urlSchema.shape }),
    z.object({ uploadType: z.literal('file'), ...fileSchema.shape }),
])

type FormData = z.infer<typeof formSchema>

interface ImageUploadModalProps {
    image: string | null
    setImage: (image: string | null) => void
    buttonText?: string
    donationID: string | undefined
    organization: string
    date: string
}

export default function ImageUploadModal({
    image,
    setImage,
    buttonText = '+',
    donationID,
    organization,
    date
}: ImageUploadModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            uploadType: 'url',
            imageUrl: '',
        },
    })
    const onSubmit = async (data: FormData) => {
        if (!donationID || !organization) {
            console.error('donationID or organization is undefined');
            return;
        }

        setIsLoading(true);

        try {
            if (data.uploadType === 'url') {
                const response = await fetch('/api/save-image-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: donationID,
                        organization,
                        imgUrl: data.imageUrl,
                        activityDate: date
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(result, "====== result from save-image-url");

                    // 根據實際的回響結構獲取imgUrl
                    const imgUrl = result.data?.imgUrl || result.imgUrl;
                    if (imgUrl) {
                        setImage(imgUrl);
                    } else {
                        console.error('imgUrl not found in response');
                    }

                    setIsSubmitted(true);
                    form.reset();
                } else {
                    const errorData = await response.json();
                    console.error('Submission failed:', errorData);
                }
            } else if (data.uploadType === 'file' && data.imageFile) {
                const formData = new FormData();
                formData.append('file', data.imageFile);
                formData.append('id', donationID);
                formData.append('organization', organization);
                formData.append('activityDate', date);

                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(result, "====== result from upload-image");

                    // 根據實際的res結構獲取imgUrl
                    const imgUrl = result.data?.imgUrl || result.imgUrl;
                    if (imgUrl) {
                        setImage(imgUrl);
                    } else {
                        console.error('imgUrl not found in response');
                    }

                    setIsSubmitted(true);
                    form.reset();
                } else {
                    const errorData = await response.json();
                    console.error('Submission failed:', errorData);
                }
            } else {
                throw new Error('無效的上載類型或缺少文件');
            }
        } catch (error) {
            console.error('Error during submission:', error);
        } finally {
            setIsLoading(false);
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
            <DialogContent aria-describedby={image ? "dialog-description" : undefined} className="max-w-[425px] w-[90%]">
                <DialogHeader>
                    <DialogTitle>{image ? '更新圖片' : '添加活動圖片'}</DialogTitle>
                </DialogHeader>
                {image ? (
                    <div className="space-y-4">
                        {isSubmitted && (
                            <p id="dialog-description" className="text-green-500 text-center">圖片提交成功，等待審核！</p>
                        )}
                        <img src={image} alt="Uploaded" className="w-full h-auto object-contain" />
                    </div>
                ) : (

                    <Tabs defaultValue="url" className="w-full">
                        <p id="dialog-description" className='hidden'>支援 URL 🔗 或文件上傳📁</p>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="url">URL  🔗</TabsTrigger>
                            <TabsTrigger value="file">圖片上傳  🖼️</TabsTrigger>
                        </TabsList>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <TabsContent value="url">
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>圖片網址 🔗🔗🔗</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="請輸入活動圖片網址" {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="file">
                                    <FormField
                                        control={form.control}
                                        name="imageFile"
                                        render={({ field }) => {
                                            const { onChange, onBlur, name, ref } = field;
                                            return (
                                                <FormItem>
                                                    <FormLabel>上傳圖片 🖼️🖼️🖼️</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp"
                                                            name={name}
                                                            onBlur={onBlur}
                                                            ref={ref}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    onChange(file);
                                                                    form.setValue('uploadType', 'file');
                                                                }
                                                            }}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />

                                </TabsContent>
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            上傳中...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            上傳圖片
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}