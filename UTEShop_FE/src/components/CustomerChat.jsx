import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaComments, FaTimes, FaPaperPlane, FaStore, FaShoppingCart } from "react-icons/fa";
import api from "../api/axiosConfig";
import { useSocket } from "../context/SocketContext";

export default function CustomerChat() {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedProduct, setAttachedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation and messages when chat is opened
  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      setConversation(null);
      setMessages([]);
      return;
    }

    const loadChatData = async () => {
      try {
        setLoading(true);
        // Lấy hoặc tạo cuộc hội thoại
        const convRes = await api.get("/chats/me");
        if (convRes.data.success) {
          setConversation(convRes.data.data);
          
          // Lấy tin nhắn
          const msgRes = await api.get("/chats/me/messages");
          if (msgRes.data.success) {
            setMessages(msgRes.data.data);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadChatData();
      setUnreadCount(0);
    }
  }, [isOpen, user]);

  // Listen for custom events to open chat from orders
  useEffect(() => {
    const handleOpenChat = async (e) => {
      if (!user) {
        alert("Vui lòng đăng nhập để liên hệ với shop!");
        return;
      }
      setIsOpen(true);
      if (e.detail?.product) {
        // Đính kèm sản phẩm vào tin nhắn đang chuẩn bị gửi
        setAttachedProduct(e.detail.product);
      }
    };

    window.addEventListener("open-customer-chat", handleOpenChat);
    return () => window.removeEventListener("open-customer-chat", handleOpenChat);
  }, [user]);

  // Listen to Socket.io events for new messages
  useEffect(() => {
    if (!socket || !user) return;

    const handleReceiveMessage = (data) => {
      console.log("📨 Nhận tin nhắn chat realtime:", data);
      const { message, conversation: updatedConversation } = data;

      // Kiểm tra xem tin nhắn này có thuộc cuộc hội thoại của mình không
      if (updatedConversation.customer === user._id) {
        setMessages((prev) => {
          // Tránh bị trùng tin nhắn
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setConversation(updatedConversation);

        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    socket.on("receive_chat_message", handleReceiveMessage);
    return () => {
      socket.off("receive_chat_message", handleReceiveMessage);
    };
  }, [socket, user, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !attachedProduct) return;

    const payload = {
      message: inputMessage
    };

    if (attachedProduct) {
      payload.product = {
        _id: attachedProduct._id,
        name: attachedProduct.name,
        image: attachedProduct.image,
        price: attachedProduct.price
      };
    }

    // Clear inputs immediately for better UX
    setInputMessage("");
    setAttachedProduct(null);

    try {
      const res = await api.post("/chats/me/messages", payload);
      if (res.data.success) {
        const newMsg = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      alert("Không thể gửi tin nhắn. Vui lòng thử lại!");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 z-50 bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          title="Chat với Shop"
        >
          <FaStore className="text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-24 z-50 w-96 h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FaStore className="text-white text-xl" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Hỗ trợ khách hàng UTE SHOP</h3>
                <p className="text-xs opacity-90">Chúng tôi sẵn sàng phục vụ bạn</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Đang tải tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                <FaStore className="text-4xl mb-2 text-gray-300" />
                <p className="text-sm">Chưa có tin nhắn nào.</p>
                <p className="text-xs">Gửi tin nhắn bên dưới để nhận tư vấn từ UTE SHOP nhé!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderRole === "customer";
                return (
                  <div key={msg._id || msg.createdAt} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="text-[10px] text-gray-400 mb-0.5 px-2">
                      {isMe ? "Bạn" : "Hỗ trợ khách hàng"}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMe
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                      }`}
                    >
                      {/* Attached Product */}
                      {msg.product && msg.product._id && (
                        <div className="mb-2 p-2 bg-black/5 rounded-lg border border-black/10 flex gap-2">
                          <img
                            src={msg.product.image || "/placeholder.svg"}
                            alt={msg.product.name}
                            className="w-12 h-12 object-cover rounded bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-inherit">{msg.product.name}</p>
                            <p className="text-[10px] font-medium text-inherit">{formatPrice(msg.product.price)}</p>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      
                      <span className={`text-[9px] opacity-75 mt-1 block text-right`}>
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Product Preview */}
          {attachedProduct && (
            <div className="px-4 py-2 bg-teal-50 border-t border-teal-100 flex items-center justify-between gap-3 animate-slide-up">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={attachedProduct.image || "/placeholder.svg"}
                  alt={attachedProduct.name}
                  className="w-10 h-10 object-cover rounded border bg-white"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-teal-900">{attachedProduct.name}</p>
                  <p className="text-[10px] text-teal-700">{formatPrice(attachedProduct.price)}</p>
                </div>
              </div>
              <button
                onClick={() => setAttachedProduct(null)}
                className="text-gray-400 hover:text-red-500 text-sm p-1"
                title="Hủy đính kèm"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2 items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn để được shop tư vấn..."
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={(!inputMessage.trim() && !attachedProduct) || loading}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-2.5 rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
