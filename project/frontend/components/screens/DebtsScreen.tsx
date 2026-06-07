"use client";

import { Button, Card, EmptyState, PageHeader } from "@/components/ui";

export function DebtsScreen() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Theo Dõi Công Nợ"
        subtitle="Quản lý thanh toán và công nợ đại lý"
        actions={
          <Button size="sm" variant="secondary" disabled>
            Xuất Báo Cáo
          </Button>
        }
      />

      <Card>
        <EmptyState message="Chưa có dữ liệu công nợ. Sẽ hiển thị khi triển khai module công nợ đại lý." />
      </Card>
    </div>
  );
}
