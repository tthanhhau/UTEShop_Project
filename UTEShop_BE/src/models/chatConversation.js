import mongoose from "mongoose";

const chatConversationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  lastMessage: {
    type: String,
    default: ""
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCountCustomer: {
    type: Number,
    default: 0
  },
  unreadCountAdmin: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

chatConversationSchema.index({ customer: 1 });
chatConversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model("ChatConversation", chatConversationSchema);
