import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/navbar";
import ChatBot from "../components/ChatBot";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <ChatBot />
    </>
  );
};

export default MainLayout;
