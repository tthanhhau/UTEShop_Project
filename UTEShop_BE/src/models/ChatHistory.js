import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  guestToken: {
    type: String,
    default: null
  },
  sender: {
    type: String,
    enum: ["user", "bot"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  intent: {
    type: String,
    default: null
  },
  products: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    image: String
  }]
}, {
  timestamps: true
});

// Index để query nhanh theo user hoặc guestToken
chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ guestToken: 1, createdAt: -1 });

// Merge guest chat history vào user khi đăng nhập
chatHistorySchema.statics.mergeGuestToUser = async function(guestToken, userId) {
  if (!guestToken || !userId) return;
  await this.updateMany(
    { guestToken, user: null },
    { $set: { user: userId, guestToken: null } }
  );
};

// Lấy lịch sử chat
chatHistorySchema.statics.getHistory = async function(userId, guestToken, limit = 50) {
  const query = userId ? { user: userId } : { guestToken, user: null };
  return this.find(query).sort({ createdAt: -1 }).limit(limit).lean();
};

export default mongoose.model("ChatHistory", chatHistorySchema);
