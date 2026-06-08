"use client";

import { Button, Card, Input, PageHeader } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validateProfileForm,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import { FormEvent, useEffect, useState } from "react";

interface ProfileData {
  id: number;
  user_type: string;
  login_id: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
}

export function ProfileScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    contact_name: "",
    email: "",
    phone: "",
    avatar_url: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/proxy/profile");
      const data = await res.json();
      if (data.success && data.data?.profile) {
        const p = data.data.profile as ProfileData;
        setProfile(p);
        setForm({
          full_name: p.full_name ?? "",
          contact_name: p.contact_name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          avatar_url: p.avatar_url ?? "",
          password: "",
          password_confirmation: "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  function patchForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => clearFieldError(prev, key));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validateProfileForm(form, profile?.user_type ?? "staff");
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body: Record<string, string> = {
        email: form.email,
        phone: form.phone,
        avatar_url: form.avatar_url,
      };
      if (profile?.user_type === "company") {
        body.contact_name = form.contact_name;
      } else {
        body.full_name = form.full_name;
      }
      if (form.password) {
        body.password = form.password;
        body.password_confirmation = form.password_confirmation;
      }

      const res = await fetch("/api/proxy/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0002"));
        return;
      }
      const p = data.data.profile as ProfileData;
      setProfile(p);
      setMessage("Đã cập nhật hồ sơ.");
      setForm((f) => ({ ...f, password: "", password_confirmation: "" }));

      const meRes = await fetch("/api/proxy/auth/me");
      const meData = await meRes.json();
      if (meData.success && meData.data?.user) {
        setUser(meData.data.user);
      }
    } catch {
      setError("Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }

  const displayName =
    profile?.user_type === "company"
      ? profile.company_name ?? profile.login_id
      : profile?.full_name ?? profile?.login_id;

  return (
    <div className="space-y-4 max-w-lg">
      <PageHeader title="Hồ sơ cá nhân" subtitle="Cập nhật thông tin tài khoản" />

      {loading ? (
        <Card className="p-8 text-center text-text-muted">Đang tải...</Card>
      ) : (
        <Card className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-xl overflow-hidden">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (displayName ?? "U").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{displayName}</p>
              <p className="text-xs text-text-muted">{profile?.login_id}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {profile?.user_type === "company" ? (
              <Input
                label="Người liên hệ"
                required
                value={form.contact_name}
                onChange={(e) => patchForm("contact_name", e.target.value)}
                error={fieldErrors.contact_name}
              />
            ) : (
              <Input
                label="Họ tên"
                required
                value={form.full_name}
                onChange={(e) => patchForm("full_name", e.target.value)}
                error={fieldErrors.full_name}
              />
            )}
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => patchForm("email", e.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => patchForm("phone", e.target.value)}
            />
            <Input
              label="Avatar URL"
              value={form.avatar_url}
              onChange={(e) => patchForm("avatar_url", e.target.value)}
              placeholder="https://..."
              error={fieldErrors.avatar_url}
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              value={form.password}
              onChange={(e) => patchForm("password", e.target.value)}
              placeholder="Để trống nếu không đổi"
              error={fieldErrors.password}
            />
            {form.password && (
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                required
                value={form.password_confirmation}
                onChange={(e) => patchForm("password_confirmation", e.target.value)}
                error={fieldErrors.password_confirmation}
              />
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}

            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
