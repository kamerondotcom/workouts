"use client";

import { useState, useCallback } from "react";

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

export function useModal() {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    options: AlertOptions;
  }>({
    isOpen: false,
    options: { title: "", message: "" },
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    options: { title: "", message: "" },
  });

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertModal({
        isOpen: true,
        options,
      });

      // Store the resolve function to call when modal closes
      (alertModal as any).resolve = resolve;
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
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
      });
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertModal({ isOpen: false, options: { title: "", message: "" } });
    if ((alertModal as any).resolve) {
      (alertModal as any).resolve();
    }
  }, [alertModal]);

  const closeConfirm = useCallback(() => {
    setConfirmModal({ isOpen: false, options: { title: "", message: "" } });
  }, []);

  return {
    alert,
    confirm,
    alertModal,
    confirmModal,
    closeAlert,
    closeConfirm,
  };
}
