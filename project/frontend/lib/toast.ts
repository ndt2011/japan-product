"use client";

import { useToastStore, type ToastType } from "@/stores/useToastStore";

function push(type: ToastType, message: string, title?: string, duration = 4000) {
  return useToastStore.getState().push({ type, message, title, duration });
}

/** Toast ngắn gọn — dùng sau lưu / xóa / thao tác API */
export const toast = {
  success: (message: string, title = "Thành công") => push("success", message, title),
  error: (message: string, title = "Lỗi") => push("error", message, title, 5500),
  info: (message: string, title?: string) => push("info", message, title),
  warning: (message: string, title = "Lưu ý") => push("warning", message, title),
};
