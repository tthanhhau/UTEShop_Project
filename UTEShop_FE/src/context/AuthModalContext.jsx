import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useSelector((s) => s.auth);

  // Automatically close modal when user successfully logs in
  useEffect(() => {
    if (user && isLoginOpen) {
      setIsLoginOpen(false);
    }
  }, [user, isLoginOpen]);

  const openLoginModal = () => setIsLoginOpen(true);
  const closeLoginModal = () => setIsLoginOpen(false);

  return (
    <AuthModalContext.Provider
      value={{
        isLoginOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
};
