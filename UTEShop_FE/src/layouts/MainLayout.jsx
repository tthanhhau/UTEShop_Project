import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/navbar";
import ChatBot from "../components/ChatBot";
import LoginModal from "../components/LoginModal";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <ChatBot />
      <LoginModal />
    </>
  );
};

export default MainLayout;
