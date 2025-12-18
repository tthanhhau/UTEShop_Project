import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }, // Tham chiếu đến đơn hàng để xác minh đã mua
    adminReply: {
      comment: { type: String, maxlength: 1000 },
      admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      repliedAt: { type: Date }
    },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

// Index để tối ưu truy vấn
reviewSchema.index({ product: 1, createdAt: -1 });
// Mỗi sản phẩm trong mỗi đơn hàng chỉ được review 1 lần
reviewSchema.index({ order: 1, product: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, product: 1 }); // Index for performance

export default mongoose.model("Review", reviewSchema);
