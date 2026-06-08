import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";

interface ApiPayload {
  success?: boolean;
  message?: string;
}

/** Gọi sau fetch JSON — toast thành công / lỗi thống nhất */
export function feedbackApi(
  data: ApiPayload,
  successMessage: string,
  options?: { errorMessage?: string; silent?: boolean },
): boolean {
  if (data.success) {
    if (!options?.silent) toast.success(successMessage);
    return true;
  }
  const msg = options?.errorMessage ?? translateMessage(data.message ?? "M0001");
  toast.error(msg);
  return false;
}
