"use client";

import { Button, Input } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const setUser = useAuthStore((s) => s.setUser);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: loginId, password, remember_me: rememberMe }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const code = data.message ?? (response.status === 503 ? "API_OFFLINE" : "M0101");
        setError(translateMessage(code));
        return;
      }

      if (data.data?.user) {
        setUser(data.data.user);
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand to-purple-accent p-12 flex-col justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg backdrop-blur">
            🇯🇵
          </div>
          <div>
            <p className="text-lg font-semibold">SupplyFlow</p>
            <p className="text-sm text-white/70">Nhật-Việt ERP</p>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Quản lý hàng hóa
            <br />
            Nhật Bản — Việt Nam
          </h1>
          <p className="mt-4 text-white/80 text-sm max-w-md">
            Hệ thống B2B quản lý thực phẩm chức năng, kho hàng, đơn hàng và công nợ cho doanh nghiệp xuất nhập khẩu.
          </p>
        </div>
        <p className="text-xs text-white/50">© 2026 SupplyFlow ERP</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white">🇯🇵</div>
            <div>
              <p className="font-semibold text-text-primary">SupplyFlow</p>
              <p className="text-xs text-text-muted">Nhật-Việt ERP</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-text-primary">Đăng nhập</h2>
          <p className="mt-1 text-sm text-text-muted mb-8">Nhập thông tin tài khoản để tiếp tục</p>

          {sessionExpired && !error && (
            <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-warning border border-amber-100">
              Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Login ID"
              id="login_id"
              type="text"
              required
              maxLength={50}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="admin hoặc vn_company01"
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm text-text-body">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  maxLength={50}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-text-primary text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-body"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-brand focus:ring-brand/30"
              />
              <span className="text-sm text-text-body">Lưu đăng nhập</span>
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-text-placeholder">
            Demo: admin / Admin@123 · vn_company01 / Company@123
          </p>
        </div>
      </div>
    </div>
  );
}
