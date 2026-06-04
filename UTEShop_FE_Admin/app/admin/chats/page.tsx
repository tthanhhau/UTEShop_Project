'use client';

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { FaComments, FaPaperPlane, FaUser, FaStore } from 'react-icons/fa';

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Conversation {
  _id: string;
  customer: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCountAdmin: number;
  unreadCountCustomer: number;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  senderRole: 'customer' | 'admin';
  message: string;
  product?: Product;
  createdAt: string;
}

const BACKEND_URL = 'http://localhost:5000';

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep track of active conversation ID in a ref for socket listener
  useEffect(() => {
    activeConversationIdRef.current = activeConversation ? activeConversation._id : null;
  }, [activeConversation]);

  // Connect to Socket.io and fetch conversations on load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    // Fetch conversations list
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/api/chats/admin/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setConversations(res.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách cuộc trò chuyện:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Connect socket
    socketRef.current = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Admin WebSocket connected successfully!');
    });

    socketRef.current.on('receive_chat_message', (data: { conversation: Conversation; message: Message }) => {
      console.log('📨 Admin nhận tin realtime:', data);
      const { conversation: updatedConv, message } = data;

      // Update conversations list (bring to top and update last message)
      setConversations((prev) => {
        const filtered = prev.filter((c) => c._id !== updatedConv._id);
        
        // If this is the active conversation, keep unread count to 0 in UI
        const isCurrentActive = activeConversationIdRef.current === updatedConv._id;
        const newConv = {
          ...updatedConv,
          unreadCountAdmin: isCurrentActive ? 0 : updatedConv.unreadCountAdmin
        };
        
        return [newConv, ...filtered];
      });

      // If this is the active conversation, append message
      if (activeConversationIdRef.current === updatedConv._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('🔌 Admin WebSocket disconnected');
      }
    };
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      const token = localStorage.getItem('adminToken');
      try {
        setLoadingMessages(true);
        const res = await axios.get(`${BACKEND_URL}/api/chats/admin/conversations/${activeConversation._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setMessages(res.data.data.messages);
          
          // Reset unread count locally for this conversation
          setConversations((prev) =>
            prev.map((c) =>
              c._id === activeConversation._id ? { ...c, unreadCountAdmin: 0 } : c
            )
          );
        }
      } catch (error) {
        console.error('Lỗi khi lấy tin nhắn:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const token = localStorage.getItem('adminToken');
    const msgText = inputMessage;
    setInputMessage('');

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/chats/admin/conversations/${activeConversation._id}/messages`,
        { message: msgText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const newMsg = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Update conversation's last message in the sidebar list
        setConversations((prev) => {
          const updatedList = prev.map((c) => {
            if (c._id === activeConversation._id) {
              return {
                ...c,
                lastMessage: msgText,
                lastMessageAt: new Date().toISOString()
              };
            }
            return c;
          });
          // Sort conversations by lastMessageAt descending
          return updatedList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 h-[calc(100vh-180px)] flex overflow-hidden">
      {/* Sidebar - Conversations list */}
      <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <FaComments className="text-purple-600" />
            Hội thoại khách hàng
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Đang tải cuộc trò chuyện...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Chưa có cuộc trò chuyện nào từ khách hàng.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversation?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${
                    isActive ? 'bg-purple-50/80 border-l-4 border-l-purple-600' : 'hover:bg-gray-100/50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {conv.customer?.name?.[0] || 'U'}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {conv.customer?.name || 'Khách hàng'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 truncate max-w-[80%]">
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCountAdmin > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {conv.unreadCountAdmin}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Box area */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeConversation ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {activeConversation.customer?.name?.[0] || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{activeConversation.customer?.name}</h4>
                  <p className="text-xs text-gray-500">
                    {activeConversation.customer?.email} {activeConversation.customer?.phone ? `| ${activeConversation.customer.phone}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full text-sm text-gray-500">
                  Đang tải tin nhắn...
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg._id || msg.createdAt}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-gray-400 mb-0.5 px-2">
                        {isMe ? 'Bạn (Shop)' : activeConversation.customer?.name || 'Khách hàng'}
                      </div>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          isMe
                            ? 'bg-purple-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}
                      >
                        {/* Reference Product Card */}
                        {msg.product && msg.product._id && (
                          <div className="mb-2 p-2 bg-black/5 rounded-lg border border-black/10 flex gap-2 text-inherit">
                            <img
                              src={msg.product.image || '/placeholder.svg'}
                              alt={msg.product.name}
                              className="w-12 h-12 object-cover rounded bg-white flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate text-inherit">
                                {msg.product.name}
                              </p>
                              <p className="text-[10px] font-medium text-inherit">
                                {formatPrice(msg.product.price)}
                              </p>
                            </div>
                          </div>
                        )}

                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <span className="text-[9px] opacity-75 mt-1 block text-right">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập nội dung tin nhắn để phản hồi khách hàng..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loadingMessages}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
              >
                <FaPaperPlane className="text-xs" />
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/10">
            <FaComments className="text-6xl text-gray-200 mb-3" />
            <h4 className="font-bold text-gray-700 text-base">Chọn một cuộc trò chuyện</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Vui lòng nhấp chọn một cuộc trò chuyện của khách hàng từ danh sách bên trái để xem nội dung và phản hồi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
