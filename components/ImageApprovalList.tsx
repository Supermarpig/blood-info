'use client'
// components/ImageApprovalList.tsx

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ImageApprovalListProps {
  data: {
    _id: string
    id: string
    organization: string
    imgUrl: string
    activityDate?: string
    createdAt: string
    updatedAt: string
  }[]
}

export default function ImageApprovalList({ data }: ImageApprovalListProps) {
  const [approvals, setApprovals] = useState<{ [key: string]: boolean | null }>({})

  const handleApproval = (id: string, isApproved: boolean | null) => {
    setApprovals(prev => ({ ...prev, [id]: isApproved }))
  }

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border border-gray-300 p-6 shadow-lg bg-white">
      <ul className="space-y-6">
        {data.map((item) => (
          <li key={item._id} className="flex items-start space-x-6 p-5 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <Dialog>
              <DialogTrigger asChild>
                <Image
                  src={item.imgUrl}
                  alt={`Image for ${item.organization}`}
                  width={120}
                  height={120}
                  className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                />
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <Image
                  src={item.imgUrl}
                  alt={`Full size image for ${item.organization}`}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg"
                />
              </DialogContent>
            </Dialog>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-800">{item.organization}</h3>
              <p className="text-sm text-gray-600 mt-1">活動日期: {item.activityDate || '未提供'}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* 核准按鈕 */}
              <button
                onClick={() => handleApproval(item._id, true)}
                className={`text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-300 ${
                  approvals[item._id] === true
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'bg-gray-200 text-gray-800 hover:bg-green-100 hover:text-green-600'
                }`}
              >
                核准
              </button>

              {/* 拒絕按鈕 */}
              <button
                onClick={() => handleApproval(item._id, false)}
                className={`text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-300 ${
                  approvals[item._id] === false
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                拒絕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
