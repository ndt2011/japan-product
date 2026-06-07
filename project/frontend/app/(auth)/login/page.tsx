import { LoginForm } from "./LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface text-text-muted">
          Đang tải...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
