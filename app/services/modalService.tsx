"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";

interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  type?: "info" | "warning" | "error" | "success";
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "info" | "warning" | "error" | "danger";
}

interface ModalContextType {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve?: () => void;
  }>({
    isOpen: false,
    options: { title: "", message: "" },
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    options: { title: "", message: "" },
  });

  const alert = (options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertModal({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        options,
        onConfirm: () => {
          setConfirmModal({
            isOpen: false,
            options: { title: "", message: "" },
          });
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal({
            isOpen: false,
            options: { title: "", message: "" },
          });
          resolve(false);
        },
      });
    });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, options: { title: "", message: "" } });
    if (alertModal.resolve) {
      alertModal.resolve();
    }
  };

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.options.title}
        message={alertModal.options.message}
        confirmText={alertModal.options.confirmText}
        type={alertModal.options.type}
        onClose={closeAlert}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
        onConfirm={confirmModal.onConfirm || (() => {})}
        onCancel={confirmModal.onCancel || (() => {})}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
