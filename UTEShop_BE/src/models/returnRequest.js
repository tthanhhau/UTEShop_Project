import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            enum: [
                "wrong_item",        // Giao sai sản phẩm
                "damaged",           // Sản phẩm bị hư hỏng
                "not_as_described",  // Không đúng mô tả
                "size_not_fit",      // Size không vừa
                "quality_issue",     // Chất lượng không tốt
                "changed_mind",      // Đổi ý không muốn mua
                "other"              // Lý do khác
            ],
            required: true,
        },
        reasonText: {
            type: String,
            default: "",
        },
        customReason: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        refundAmount: {
            type: Number,
            required: true,
        },
        pointsAwarded: {
            type: Number,
            default: 0,
        },
        adminNote: {
            type: String,
            default: "",
        },
        processedAt: {
            type: Date,
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Lấy text hiển thị cho reason
returnRequestSchema.methods.getReasonDisplay = function () {
    const reasonMap = {
        wrong_item: "Giao sai sản phẩm",
        damaged: "Sản phẩm bị hư hỏng",
        not_as_described: "Không đúng mô tả",
        size_not_fit: "Size không vừa",
        quality_issue: "Chất lượng không tốt",
        changed_mind: "Đổi ý không muốn mua",
        other: "Lý do khác"
    };
    return reasonMap[this.reason] || this.reason;
};

export default mongoose.model("ReturnRequest", returnRequestSchema);
