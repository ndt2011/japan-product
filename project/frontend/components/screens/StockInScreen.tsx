"use client";

import { Button, Card, EmptyState, PageHeader } from "@/components/ui";

export function StockInScreen() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Phiếu Nhập Kho"
        subtitle="Quản lý phiếu nhập kho"
        actions={
          <>
            <Button variant="secondary" size="sm" disabled>
              Xuất Excel
            </Button>
            <Button size="sm" disabled>
              + Tạo Phiếu Nhập
            </Button>
          </>
        }
      />

      <Card>
        <EmptyState message="Chưa có phiếu nhập kho. Dữ liệu sẽ hiển thị khi triển khai module nhập kho." />
      </Card>
    </div>
  );
}
