import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    images: [{ type: String }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    // thêm field mới
    soldCount: { type: Number, default: 0, index: true },          // số lượng bán
    viewCount: { type: Number, default: 0, index: true },          // số lượt xem
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 }, // % giảm giá
    isActive: { type: Boolean, default: true, index: true },      // trạng thái hiển thị sản phẩm
    isVisible: { type: Boolean, default: true, index: true },     // trạng thái hiển thị sản phẩm (dùng cho admin)
    
    // Size và stock theo size
    sizes: [{
      size: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 }
    }]
  },
  { timestamps: true }
);

// Index để sort nhanh
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ viewCount: -1 });
productSchema.index({ discountPercentage: -1 });

export default mongoose.model("Product", productSchema);
