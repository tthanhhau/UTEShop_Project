import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatConversation",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  senderRole: {
    type: String,
    enum: ["customer", "admin"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  product: {
    _id: { type: String, default: null },
    name: { type: String, default: null },
    image: { type: String, default: null },
    price: { type: Number, default: null }
  }
}, {
  timestamps: true
});

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
