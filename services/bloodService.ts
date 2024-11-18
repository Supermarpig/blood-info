// /services/bloodService.ts

import BloodImgInfoModel, { IImgUrl, IImgUrlInput } from '@/models/BloodImgCheck';
import dbConnect from '@/lib/mongodb';

// 創建新的血液圖片信息
export async function createBloodImgInfo(data: IImgUrlInput): Promise<IImgUrl> {
    await dbConnect();

    // 檢查是否已存在相同的 id
    const existingData = await BloodImgInfoModel.findOne({ id: data.id }).lean<IImgUrl>();
    if (existingData) {
        return existingData;
    }

    // console.log(data,"================data😂😂😂")
    const newData = new BloodImgInfoModel(data);
    // console.log("New Data to be saved:😍😍😍", newData);
    await newData.save();
    return newData;
}

// 根據 id 獲取血液圖片信息
export async function getBloodImgInfoById(id: string): Promise<IImgUrl | null> {
    await dbConnect();

    const data = await BloodImgInfoModel.findOne({ id }).lean<IImgUrl>();
    return data;
}

// 更新血液圖片信息
export async function updateBloodImgInfo(
    id: string,
    updateData: Partial<IImgUrlInput>
): Promise<IImgUrl | null> {
    await dbConnect();

    const updatedData = await BloodImgInfoModel.findOneAndUpdate({ id }, updateData, { new: true }).lean<IImgUrl>();
    return updatedData;
}

// 刪除血液圖片信息
export async function deleteBloodImgInfo(id: string): Promise<IImgUrl | null> {
    await dbConnect();

    const deletedData = await BloodImgInfoModel.findOneAndDelete({ id }).lean<IImgUrl>();
    return deletedData;
}

// 獲取所有血液圖片信息
export async function getAllBloodImgInfo(): Promise<IImgUrl[]> {
    await dbConnect();

    const allData = await BloodImgInfoModel.find({}).lean<IImgUrl[]>();
    return allData;
}
