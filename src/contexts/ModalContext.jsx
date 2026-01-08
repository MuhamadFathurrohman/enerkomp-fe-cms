// src/contexts/ModalContext.jsx
import React, { createContext, useContext, useState } from "react";
import { ModalRenderer } from "../components/Modals/Modal";

const ModalContext = createContext();

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModalContext must be used within ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  const openModal = (key, content, size = "medium", className = "") => {
    setModals((prev) => [...prev, { key, content, size, className }]);
  };

  const closeModal = (key) => {
    setModals((prev) => prev.filter((modal) => modal.key !== key));
  };

  const value = {
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalRenderer modals={modals} closeModal={closeModal} />
    </ModalContext.Provider>
  );
};
