"use client";

import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useState } from "react";

const statusMap: Record<string, { label: string; variant: "gray" | "warning" | "primary" | "success" }> = {
  Draft: { label: "Nháp", variant: "gray" },
  Pending: { label: "Chờ duyệt", variant: "warning" },
  Approved: { label: "Đã duyệt", variant: "primary" },
  Completed: { label: "Hoàn thành", variant: "success" },
};

const receipts = [
  { id: "PN-2024-0234", supplier: "Samsung Việt Nam", date: "2024-12-10", items: 5, total: "145.000.000đ", status: "Completed", warehouse: "Kho HN", creator: "Nguyễn A." },
  { id: "PN-2024-0233", supplier: "Apple VN", date: "2024-12-09", items: 3, total: "89.700.000đ", status: "Approved", warehouse: "Kho HCM", creator: "Trần B." },
  { id: "PN-2024-0232", supplier: "Dell VN", date: "2024-12-08", items: 8, total: "228.000.000đ", status: "Pending", warehouse: "Kho HN", creator: "Lê C." },
  { id: "PN-2024-0231", supplier: "Sony VN", date: "2024-12-07", items: 2, total: "18.980.000đ", status: "Draft", warehouse: "Kho ĐN", creator: "Phạm D." },
  { id: "PN-2024-0230", supplier: "LG VN", date: "2024-12-06", items: 4, total: "58.000.000đ", status: "Completed", warehouse: "Kho CT", creator: "Hoàng E." },
];

const productLines = [
  { sku: "PHN-023", name: "iPhone 15 Pro Max", qty: 10, unitPrice: "27.000.000đ", total: "270.000.000đ" },
  { sku: "AUD-012", name: "AirPods Pro 2", qty: 20, unitPrice: "5.500.000đ", total: "110.000.000đ" },
];

export function StockInScreen() {
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(receipts[0]);

  const filtered = receipts.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Phiếu Nhập Kho"
        subtitle={`${receipts.length} phiếu nhập · Dữ liệu demo`}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled>
              Xuất Excel
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + Tạo Phiếu Nhập
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng Phiếu", value: receipts.length, color: "text-brand" },
          { label: "Hoàn Thành", value: receipts.filter((r) => r.status === "Completed").length, color: "text-success" },
          { label: "Chờ Duyệt", value: receipts.filter((r) => r.status === "Pending").length, color: "text-warning" },
          { label: "Nháp", value: receipts.filter((r) => r.status === "Draft").length, color: "text-text-muted" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-xl mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <SearchInput
            placeholder="Tìm phiếu nhập, NCC..."
            value={search}
            onChange={setSearch}
            className="flex-1 min-w-52"
          />
          <select className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body">
            <option>Tất cả trạng thái</option>
            {Object.values(statusMap).map((s) => (
              <option key={s.label}>{s.label}</option>
            ))}
          </select>
          <input type="date" className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body" />
        </div>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã Phiếu</Th>
              <Th>Nhà Cung Cấp</Th>
              <Th>Kho</Th>
              <Th>Ngày Tạo</Th>
              <Th>Số Mặt Hàng</Th>
              <Th>Tổng Tiền</Th>
              <Th>Người Tạo</Th>
              <Th>Trạng Thái</Th>
              <Th>Thao Tác</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((r) => {
              const s = statusMap[r.status];
              return (
                <Tr key={r.id}>
                  <Td>
                    <span className="text-brand text-xs font-medium">{r.id}</span>
                  </Td>
                  <Td className="text-xs">{r.supplier}</Td>
                  <Td className="text-xs">{r.warehouse}</Td>
                  <Td className="text-xs text-text-muted">{r.date}</Td>
                  <Td className="text-xs">{r.items} mặt hàng</Td>
                  <Td className="text-xs text-text-primary">{r.total}</Td>
                  <Td className="text-xs">{r.creator}</Td>
                  <Td>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelected(r);
                        setDetailOpen(true);
                      }}
                    >
                      Chi tiết
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Chi Tiết Phiếu Nhập - ${selected?.id}`}
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-surface-muted rounded-xl">
            <div>
              <p className="text-xs text-text-muted">Nhà Cung Cấp</p>
              <p className="text-sm text-text-primary mt-0.5">{selected?.supplier}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Kho Nhập</p>
              <p className="text-sm text-text-primary mt-0.5">{selected?.warehouse}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Ngày Tạo</p>
              <p className="text-sm text-text-primary mt-0.5">{selected?.date}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Trạng Thái</p>
              <div className="mt-0.5">
                {selected && (
                  <Badge variant={statusMap[selected.status].variant}>
                    {statusMap[selected.status].label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Table>
            <Thead>
              <tr>
                <Th>SKU</Th>
                <Th>Tên Sản Phẩm</Th>
                <Th>Số Lượng</Th>
                <Th>Đơn Giá</Th>
                <Th>Thành Tiền</Th>
              </tr>
            </Thead>
            <tbody>
              {productLines.map((pl) => (
                <Tr key={pl.sku}>
                  <Td className="text-xs text-brand">{pl.sku}</Td>
                  <Td className="text-xs">{pl.name}</Td>
                  <Td className="text-xs">{pl.qty}</Td>
                  <Td className="text-xs">{pl.unitPrice}</Td>
                  <Td className="text-xs text-text-primary">{pl.total}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-text-muted">Tổng cộng:</span>
            <span className="text-base text-text-primary">{selected?.total}</span>
          </div>

          <div className="flex gap-2">
            {selected?.status === "Pending" && (
              <Button variant="success" className="flex-1">
                Phê Duyệt
              </Button>
            )}
            {selected?.status === "Approved" && (
              <Button variant="primary" className="flex-1">
                Hoàn Thành
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo Phiếu Nhập Kho" width="max-w-xl">
        <div className="space-y-3">
          <Select
            label="Nhà Cung Cấp"
            options={[
              { value: "samsung", label: "Samsung Việt Nam" },
              { value: "apple", label: "Apple VN" },
              { value: "dell", label: "Dell VN" },
            ]}
            onChange={() => {}}
          />
          <Select
            label="Kho Nhập"
            options={[
              { value: "hn", label: "Kho Hà Nội" },
              { value: "hcm", label: "Kho TP.HCM" },
              { value: "dn", label: "Kho Đà Nẵng" },
            ]}
            onChange={() => {}}
          />
          <Input label="Ngày Nhập" type="date" />
          <Input label="Ghi Chú" placeholder="Ghi chú nội bộ..." />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button variant="secondary" className="flex-1">
              Lưu Nháp
            </Button>
            <Button className="flex-1">Gửi Duyệt</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
