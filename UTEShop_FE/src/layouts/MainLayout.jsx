import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/navbar";
import ChatBot from "../components/ChatBot";
import CustomerChat from "../components/CustomerChat";
import LoginModal from "../components/LoginModal";

const MainLayout = () => {
  // activeChat: null | "bot" | "customer" — chỉ cho phép 1 chat mở tại 1 thời điểm
  const [activeChat, setActiveChat] = useState(null);

  return (
    <>
      <Navbar />
      <Outlet />
      <ChatBot
        isOpen={activeChat === "bot"}
        onOpen={() => setActiveChat("bot")}
        onClose={() => setActiveChat(null)}
      />
      <CustomerChat
        isOpen={activeChat === "customer"}
        onOpen={() => setActiveChat("customer")}
        onClose={() => setActiveChat(null)}
        otherChatOpen={activeChat === "bot"}
      />
      <LoginModal />
    </>
  );
};

export default MainLayout;
