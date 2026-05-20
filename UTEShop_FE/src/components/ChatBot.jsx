import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaShoppingCart, FaCheck, FaBox, FaTruck, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import axios from "../api/axiosConfig";

// Dùng sessionStorage để mỗi tab mới sẽ bắt đầu chat mới (không load lịch sử cũ)
const GUEST_TOKEN_KEY = "uteshop_guest_token";
const SESSION_KEY = "uteshop_chat_session";
const PENDING_PURCHASE_KEY = "uteshop_pending_purchase";

const defaultMessage = {
  id: 1,
  text: "Xin chào! 👋 Tôi là trợ lý AI của UTEShop. Tôi có thể giúp bạn:\n• Tìm kiếm sản phẩm\n• Đặt hàng nhanh chóng\n• Tư vấn chọn size\n\nBạn cần gì nào? 😊",
  sender: "bot",
  timestamp: new Date(),
  products: [],
};

export default function ChatBot() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([defaultMessage]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [guestToken, setGuestToken] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const prevUserRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Khởi tạo sessionId và guestToken
  // Dùng sessionStorage để mỗi tab mới bắt đầu chat mới
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    const savedGuestToken = sessionStorage.getItem(GUEST_TOKEN_KEY);

    if (savedSession) setSessionId(savedSession);
    if (savedGuestToken && !user) setGuestToken(savedGuestToken);
  }, []);

  // Merge guest chat khi đăng nhập
  useEffect(() => {
    const mergeAndLoadHistory = async () => {
      // Chỉ merge khi user vừa đăng nhập (từ null -> có user)
      if (user && !prevUserRef.current) {
        const savedGuestToken = sessionStorage.getItem(GUEST_TOKEN_KEY);
        if (savedGuestToken) {
          try {
            await axios.post("/chatbot/merge", { guestToken: savedGuestToken });
            sessionStorage.removeItem(GUEST_TOKEN_KEY);
            setGuestToken(null);
          } catch (error) {
            console.error("Error merging chat:", error);
          }
        }
      }
      prevUserRef.current = user;
    };

    mergeAndLoadHistory();
  }, [user]);

  // Load lịch sử chat khi mở chatbox
  useEffect(() => {
    const loadHistory = async () => {
      if (!isOpen || historyLoaded) return;

      try {
        const params = {};
        if (!user && guestToken) {
          params.guestToken = guestToken;
        }

        const response = await axios.get("/chatbot/history", { params });
        const history = response.data.data;

        if (history && history.length > 0) {
          const formattedHistory = history.map((msg, index) => ({
            id: msg._id || index,
            text: msg.message,
            sender: msg.sender,
            timestamp: new Date(msg.createdAt),
            products: msg.products?.map(p => ({
              _id: p.productId,
              name: p.name,
              price: p.price,
              image: p.image
            })) || [],
            intent: msg.intent
          }));
          setMessages([defaultMessage, ...formattedHistory]);
        }
        setHistoryLoaded(true);
      } catch (error) {
        console.error("Error loading chat history:", error);
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [isOpen, user, guestToken, historyLoaded]);

  // Reset historyLoaded khi user thay đổi
  useEffect(() => {
    setHistoryLoaded(false);
  }, [user]);

  // Tạo sessionId khi mở chat
  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      sessionStorage.setItem(SESSION_KEY, newSessionId);
    }
  }, [isOpen, sessionId]);

  // Xử lý pending purchase sau khi đăng nhập
  useEffect(() => {
    const processPendingPurchase = async () => {
      if (!user) return;

      const pendingPurchase = sessionStorage.getItem(PENDING_PURCHASE_KEY);
      if (!pendingPurchase) return;

      try {
        const items = JSON.parse(pendingPurchase);
        sessionStorage.removeItem(PENDING_PURCHASE_KEY);

        // Kiểm tra xem là array (nhiều sản phẩm) hay object (1 sản phẩm - format cũ)
        if (Array.isArray(items)) {
          // Nhiều sản phẩm
          const formattedItems = items.map(item => ({
            product: {
              _id: item.productId,
              name: item.name,
              price: item.price,
              images: item.image ? [item.image] : [],
              discountPercentage: item.discountPercentage || 0,
            },
            quantity: item.quantity,
            size: item.size,
          }));

          console.log("🛒 Processing pending purchase with", formattedItems.length, "items");

          navigate("/checkout", {
            state: { cartItems: formattedItems, fromCart: true },
          });
        } else {
          // 1 sản phẩm (format cũ - backward compatible)
          navigate("/checkout", {
            state: {
              product: {
                _id: items.productId,
                name: items.name,
                price: items.price,
                images: items.image ? [items.image] : [],
                discountPercentage: items.discountPercentage || 0,
              },
              quantity: items.quantity,
              selectedSize: items.size,
            },
          });
        }
      } catch (error) {
        console.error("Error processing pending purchase:", error);
        navigate("/products");
      }
    };

    processPendingPurchase();
  }, [user, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await axios.post("/chatbot/message", {
        message: messageToSend,
        sessionId: sessionId,
        guestToken: !user ? guestToken : null,
      });

      const { data, guestToken: newGuestToken } = response.data;

      // Lưu guestToken nếu chưa đăng nhập (dùng sessionStorage để mỗi tab mới bắt đầu chat mới)
      if (newGuestToken && !user) {
        setGuestToken(newGuestToken);
        sessionStorage.setItem(GUEST_TOKEN_KEY, newGuestToken);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: data.message,
          sender: "bot",
          timestamp: new Date(),
          products: data.products || [],
          intent: data.intent,
          action: data.action,
          cartCount: data.cartCount,
        },
      ]);

      if (data.action?.type === "CHECKOUT") {
        await handleCheckoutAction(data.action.cartItems);
      } else if (data.action?.type === "NAVIGATE") {
        handleNavigateAction(data.action.url);
      } else if (data.action?.type === "SHOW_ORDERS") {
        // Thêm orders vào message để hiển thị
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg) {
            lastMsg.orders = data.action.orders;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOrderClick = (orderId, status) => {
    setIsOpen(false);
    // Nếu đơn hàng đã giao, chuyển đến trang lịch sử mua hàng với highlight
    if (status === "delivered") {
      navigate(`/purchase-history?highlight=${orderId}`);
    } else {
      // Các trạng thái khác chuyển đến trang theo dõi đơn hàng
      navigate(`/orders-tracking?highlight=${orderId}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <FaClock className="text-yellow-500" />;
      case "processing": return <FaBox className="text-blue-500" />;
      case "preparing": return <FaBox className="text-purple-500" />;
      case "shipped": return <FaTruck className="text-orange-500" />;
      case "delivered": return <FaCheckCircle className="text-green-500" />;
      case "cancelled": return <FaTimesCircle className="text-red-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 border-yellow-300";
      case "processing": return "bg-blue-100 border-blue-300";
      case "preparing": return "bg-purple-100 border-purple-300";
      case "shipped": return "bg-orange-100 border-orange-300";
      case "delivered": return "bg-green-100 border-green-300";
      case "cancelled": return "bg-red-100 border-red-300";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  const handleNavigateAction = (url) => {
    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "⚠️ Bạn cần đăng nhập để xem thông tin này.\n\nĐang chuyển đến trang đăng nhập...",
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setTimeout(() => {
      setIsOpen(false);
      navigate(url);
    }, 1000);
  };

  const handleCheckoutAction = async (cartItems) => {
    if (!user) {
      // Lưu TẤT CẢ sản phẩm trong giỏ hàng, không chỉ sản phẩm đầu tiên
      if (cartItems && cartItems.length > 0) {
        const allItems = cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          discountPercentage: item.discountPercentage || 0,
          size: item.size,
          quantity: item.quantity,
          image: item.image,
        }));
        sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(allItems));
        console.log("🛒 Saved pending purchase with", allItems.length, "items");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "⚠️ Bạn cần đăng nhập để đặt hàng.\n\nĐang chuyển đến trang đăng nhập...",
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setIsProcessingOrder(true);

    console.log("🛒 ChatBot - handleCheckoutAction called with cartItems:", cartItems);
    console.log("🛒 ChatBot - cartItems.length:", cartItems?.length);

    try {
      // Luôn format items theo cùng một cách để đảm bảo nhất quán
      const formattedItems = cartItems.map((item) => ({
        product: {
          _id: item.productId,
          name: item.name,
          price: item.price,
          images: item.image ? [item.image] : [],
          discountPercentage: item.discountPercentage || 0,
        },
        quantity: item.quantity,
        size: item.size,
      }));

      console.log("🛒 ChatBot - Formatted items for checkout:", formattedItems);
      console.log("🛒 ChatBot - Number of items:", formattedItems.length);

      setTimeout(() => {
        setIsOpen(false);
        // Luôn truyền dưới dạng cartItems để CheckoutPage xử lý nhất quán
        navigate("/checkout", {
          state: { cartItems: formattedItems, fromCart: true },
        });
      }, 1000);
    } catch (error) {
      console.error("Checkout error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "❌ Có lỗi xảy ra. Vui lòng thử lại!",
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleQuickBuy = async (product) => {
    const availableSize = product.sizes?.find((s) => s.stock > 0)?.size || "Free Size";

    if (!user) {
      sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify({
        productId: product._id,
        name: product.name,
        price: product.price,
        discountPercentage: product.discountPercentage || 0,
        size: availableSize,
        quantity: 1,
        image: product.image,
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `⚠️ Bạn cần đăng nhập để mua **${product.name}**.\n\nĐang chuyển đến trang đăng nhập...`,
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setIsProcessingOrder(true);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: `🛒 Đang chuyển đến trang thanh toán cho **${product.name}** (size ${availableSize})...`,
        sender: "bot",
        timestamp: new Date(),
        products: [],
      },
    ]);

    try {
      setTimeout(() => {
        setIsOpen(false);
        navigate("/checkout", {
          state: {
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              images: product.image ? [product.image] : [],
              discountPercentage: product.discountPercentage || 0,
            },
            quantity: 1,
            selectedSize: availableSize,
          },
        });
      }, 1000);
    } catch (error) {
      console.error("Quick buy error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "❌ Có lỗi xảy ra. Vui lòng thử lại!",
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const quickReplies = ["Tìm áo thun", "Giày Nike", "Đang giảm giá", "Sản phẩm bán chạy"];

  const handleQuickReply = async (reply) => {
    const userMessage = {
      id: Date.now(),
      text: reply,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await axios.post("/chatbot/message", {
        message: reply,
        sessionId: sessionId,
        guestToken: !user ? guestToken : null,
      });

      const { data, guestToken: newGuestToken } = response.data;

      if (newGuestToken && !user) {
        setGuestToken(newGuestToken);
        localStorage.setItem(GUEST_TOKEN_KEY, newGuestToken);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: data.message,
          sender: "bot",
          timestamp: new Date(),
          products: data.products || [],
          intent: data.intent,
          action: data.action,
          cartCount: data.cartCount,
        },
      ]);

      if (data.action?.type === "CHECKOUT") {
        await handleCheckoutAction(data.action.cartItems);
      } else if (data.action?.type === "NAVIGATE") {
        handleNavigateAction(data.action.url);
      } else if (data.action?.type === "SHOW_ORDERS") {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg) {
            lastMsg.orders = data.action.orders;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          sender: "bot",
          timestamp: new Date(),
          products: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <FaComments className="text-2xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            1
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                  <FaRobot className="text-blue-500 text-lg" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">UTEShop AI</h3>
                <p className="text-xs opacity-90">Hỗ trợ đặt hàng nhanh</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 ${msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        : "bg-white text-gray-800 shadow-md"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Products */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.products.map((product, index) => (
                      <div key={product._id} className="bg-white rounded-lg p-2 shadow-sm border hover:shadow-md transition">
                        <div className="flex gap-2 cursor-pointer" onClick={() => handleProductClick(product._id)}>
                          <div className="relative">
                            {product.image && (
                              <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded" />
                            )}
                            <span className="absolute -top-1 -left-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs font-bold text-blue-600">
                                {formatPrice(product.price * (1 - (product.discountPercentage || 0) / 100))}
                              </span>
                              {product.discountPercentage > 0 && (
                                <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickBuy(product)}
                          disabled={isTyping || isProcessingOrder}
                          className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <FaShoppingCart className="text-xs" />
                          Mua ngay #{index + 1}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {msg.orders && msg.orders.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.orders.map((order, index) => (
                      <div
                        key={order._id}
                        onClick={() => handleOrderClick(order._id, order.status)}
                        className={`rounded-lg p-3 border-2 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${getStatusColor(order.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-700">#{order.orderCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className="text-xs font-medium">{order.statusText}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>📅 {new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                          <span className="font-bold text-blue-600">{formatPrice(order.totalPrice)}</span>
                        </div>

                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <FaBox className="text-gray-400" />
                          <span>{order.itemCount} sản phẩm</span>
                        </div>

                        {/* Preview items */}
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2 flex gap-1 overflow-hidden">
                            {order.items.slice(0, 3).map((item, idx) => (
                              item.image && (
                                <img
                                  key={idx}
                                  src={item.image}
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded border border-gray-200"
                                />
                              )
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-2 text-center">
                          <span className="text-xs text-blue-600 font-medium">Nhấn để xem chi tiết →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  </div>
                </div>
              </div>
            )}

            {isProcessingOrder && (
              <div className="flex justify-start">
                <div className="bg-green-100 rounded-2xl px-4 py-3 shadow-md flex items-center gap-2">
                  <FaCheck className="text-green-600 animate-pulse" />
                  <span className="text-sm text-green-700">Đang xử lý đơn hàng...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-white border-t flex flex-wrap gap-1.5">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-200 transition"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi về sản phẩm..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-2.5 rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
