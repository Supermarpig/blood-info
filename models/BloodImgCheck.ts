// /models/BloodImgCheck.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// 定義接口
export interface IImgUrl extends Document {
    id: string;
    organization: string;
    imgUrl: string;
    activityDate: string;
}

// 使用 Pick 工具類型來創建 IImgUrlInput
export type IImgUrlInput = Pick<IImgUrl, 'id' | 'organization' | 'imgUrl' | 'activityDate'>;

// IImgFileInput 包含 base64 圖片數據（imageBase64）
export type IImgFileInput = {
    id: string;
    organization: string;
    imageBase64: string; // 新增的 base64 圖片數據
    activityDate: string;
};

const ImgUrlSchema = new Schema<IImgUrl>(
    {
        id: { type: String, required: true },
        organization: { type: String, required: true },
        imgUrl: { type: String, required: true },
        activityDate: { type: String, required: true }
    },
    {
        timestamps: true, // 自動添加 createdAt 和 updatedAt 欄位
        collection: 'bloodImgInfo', // 指定集合名稱
    }
);

// 定義模型類型
type IBloodImgInfoModel = Model<IImgUrl>;

// // 刪除舊的模型（如果存在），並重新創建模型
// if (mongoose.models.BloodImgInfo) {
//     delete mongoose.models.BloodImgInfo;
// }

// 創建並導出模型
const BloodImgInfoModel =
    mongoose.models.BloodImgInfo as IBloodImgInfoModel || mongoose.model<IImgUrl, IBloodImgInfoModel>('BloodImgInfo', ImgUrlSchema);

export default BloodImgInfoModel;
