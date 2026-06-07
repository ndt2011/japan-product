"use client";

import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useState } from "react";

export function InventoryScreen() {
  const [tab, setTab] = useState<"list" | "stock">("list");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kiểm Kê Kho"
        subtitle="Quản lý kiểm kê và tồn kho thực tế"
        actions={
          <Button size="sm" disabled>
            + Tạo Phiếu Kiểm Kê
          </Button>
        }
      />

      <div className="flex gap-2 border-b border-border">
        {[
          { id: "list" as const, label: "Phiếu Kiểm Kê" },
          { id: "stock" as const, label: "Tồn Kho Thực Tế" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`pb-3 px-1 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-body"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <EmptyState
          message={
            tab === "list"
              ? "Chưa có phiếu kiểm kê. Dữ liệu sẽ hiển thị khi triển khai module kiểm kê."
              : "Chưa có tồn kho kiểm kê. Xem tồn kho sản phẩm tại màn Hàng hóa."
          }
        />
      </Card>
    </div>
  );
}
