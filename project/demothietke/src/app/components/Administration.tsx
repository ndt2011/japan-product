import React, { useState } from "react";
import { Card, Button, Badge, Table, Thead, Th, Td, Tr, Modal, Input, Select, PageHeader, SearchInput } from "./ui";

const roles = ["Admin", "Kho", "Nhà Cung Cấp", "Đại Lý", "Kế Toán"];

const permissions = [
  { module: "Dashboard", Admin: true, Kho: true, "Nhà Cung Cấp": false, "Đại Lý": true, "Kế Toán": true },
  { module: "Nhà Cung Cấp", Admin: true, Kho: false, "Nhà Cung Cấp": true, "Đại Lý": false, "Kế Toán": false },
  { module: "Hàng Hóa", Admin: true, Kho: true, "Nhà Cung Cấp": true, "Đại Lý": false, "Kế Toán": false },
  { module: "Phiếu Nhập", Admin: true, Kho: true, "Nhà Cung Cấp": false, "Đại Lý": false, "Kế Toán": true },
  { module: "Kiểm Kê", Admin: true, Kho: true, "Nhà Cung Cấp": false, "Đại Lý": false, "Kế Toán": false },
  { module: "Đại Lý", Admin: true, Kho: false, "Nhà Cung Cấp": false, "Đại Lý": true, "Kế Toán": false },
  { module: "Đơn Hàng", Admin: true, Kho: true, "Nhà Cung Cấp": false, "Đại Lý": true, "Kế Toán": true },
  { module: "Xuất Kho", Admin: true, Kho: true, "Nhà Cung Cấp": false, "Đại Lý": false, "Kế Toán": false },
  { module: "Công Nợ", Admin: true, Kho: false, "Nhà Cung Cấp": false, "Đại Lý": true, "Kế Toán": true },
  { module: "Báo Cáo", Admin: true, Kho: false, "Nhà Cung Cấp": false, "Đại Lý": false, "Kế Toán": true },
  { module: "Quản Trị", Admin: true, Kho: false, "Nhà Cung Cấp": false, "Đại Lý": false, "Kế Toán": false },
];

const usersData = [
  { id: "USR-001", name: "Nguyễn Văn Admin", email: "admin@company.vn", role: "Admin", status: "active", lastLogin: "12/12/2024 09:15", created: "01/01/2024" },
  { id: "USR-002", name: "Trần Thị Kho A", email: "khoa@company.vn", role: "Kho", status: "active", lastLogin: "12/12/2024 08:30", created: "15/02/2024" },
  { id: "USR-003", name: "Lê Văn Kho B", email: "khob@company.vn", role: "Kho", status: "active", lastLogin: "11/12/2024 17:45", created: "15/02/2024" },
  { id: "USR-004", name: "Phạm Kế Toán", email: "ketoan@company.vn", role: "Kế Toán", status: "active", lastLogin: "12/12/2024 10:00", created: "01/03/2024" },
  { id: "USR-005", name: "Hoàng Đại Lý", email: "daily@company.vn", role: "Đại Lý", status: "inactive", lastLogin: "05/12/2024 14:20", created: "10/04/2024" },
  { id: "USR-006", name: "Vũ Nhà Cung Cấp", email: "ncc@company.vn", role: "Nhà Cung Cấp", status: "active", lastLogin: "12/12/2024 11:00", created: "20/05/2024" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-[#FEF2F2] text-[#DC2626]",
  Kho: "bg-[#EFF6FF] text-[#2563EB]",
  "Nhà Cung Cấp": "bg-[#F0FDF4] text-[#16A34A]",
  "Đại Lý": "bg-[#FFFBEB] text-[#D97706]",
  "Kế Toán": "bg-[#F5F3FF] text-[#7C3AED]",
};

const tabs = [
  { id: "users", label: "👤 Người Dùng" },
  { id: "permissions", label: "🔐 Phân Quyền" },
  { id: "settings", label: "⚙️ Cài Đặt" },
];

export function Administration() {
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = usersData.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Trị Hệ Thống"
        subtitle="Quản lý người dùng, vai trò và phân quyền"
        actions={
          tab === "users" ? (
            <Button size="sm" onClick={() => setModalOpen(true)}>+ Thêm Người Dùng</Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === t.id ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {roles.map((role) => (
              <Card key={role} className="p-3">
                <p className="text-xs text-[#6B7280]">{role}</p>
                <p className="text-lg mt-1 text-[#111827]">{usersData.filter((u) => u.role === role).length}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <SearchInput placeholder="Tìm người dùng..." value={search} onChange={setSearch} className="max-w-sm" />
          </Card>

          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Tên</Th>
                  <Th>Email</Th>
                  <Th>Vai Trò</Th>
                  <Th>Đăng Nhập Cuối</Th>
                  <Th>Ngày Tạo</Th>
                  <Th>Trạng Thái</Th>
                  <Th>Thao Tác</Th>
                </tr>
              </Thead>
              <tbody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td><span className="text-xs text-[#2563EB] font-medium">{u.id}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs flex items-center justify-center shrink-0">
                          {u.name[0]}
                        </div>
                        <span className="text-xs text-[#111827]">{u.name}</span>
                      </div>
                    </Td>
                    <Td className="text-xs text-[#2563EB]">{u.email}</Td>
                    <Td>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${roleColors[u.role]}`}>{u.role}</span>
                    </Td>
                    <Td className="text-xs text-[#6B7280]">{u.lastLogin}</Td>
                    <Td className="text-xs text-[#6B7280]">{u.created}</Td>
                    <Td>
                      <Badge variant={u.status === "active" ? "success" : "gray"}>
                        {u.status === "active" ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-xs">✏️</Button>
                        <Button variant="ghost" size="icon" className="text-xs">🔑</Button>
                        <Button variant="ghost" size="icon" className="text-xs">🗑️</Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {/* Permissions Tab */}
      {tab === "permissions" && (
        <Card>
          <div className="p-4 border-b border-[#F3F4F6]">
            <p className="text-sm text-[#111827]">Phân Quyền Theo Module</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Cấu hình quyền truy cập cho từng vai trò</p>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Module</Th>
                {roles.map((r) => <Th key={r}><span className={`px-2 py-0.5 rounded-full text-xs ${roleColors[r]}`}>{r}</span></Th>)}
              </tr>
            </Thead>
            <tbody>
              {permissions.map((row) => (
                <Tr key={row.module}>
                  <Td className="text-xs text-[#111827]">{row.module}</Td>
                  {roles.map((r) => (
                    <Td key={r} className="text-center">
                      <span className={`text-sm ${(row as Record<string, boolean | string>)[r] ? "text-[#16A34A]" : "text-[#E5E7EB]"}`}>
                        {(row as Record<string, boolean | string>)[r] ? "✓" : "✕"}
                      </span>
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-sm text-[#111827] mb-4">Cài Đặt Chung</h3>
            <div className="space-y-3">
              <Input label="Tên Công Ty" defaultValue="SupplyFlow Corp Vietnam" />
              <Input label="Email Liên Hệ" defaultValue="contact@supplyflow.vn" />
              <Input label="Số Điện Thoại" defaultValue="028 3900 1234" />
              <Input label="Địa Chỉ" defaultValue="123 Nguyễn Huệ, Q.1, TP.HCM" />
              <Button className="w-full">Lưu Cài Đặt</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm text-[#111827] mb-4">Cấu Hình Kho</h3>
            <div className="space-y-3">
              <Input label="Cảnh Báo Tồn Thấp (%)" defaultValue="20" type="number" />
              <Select label="Tiền Tệ" options={[{ value: "VND", label: "VND - Việt Nam Đồng" }, { value: "USD", label: "USD - US Dollar" }]} onChange={() => {}} />
              <Select label="Định Dạng Ngày" options={[{ value: "dd/mm/yyyy", label: "DD/MM/YYYY" }, { value: "mm/dd/yyyy", label: "MM/DD/YYYY" }]} onChange={() => {}} />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-[#111827]">Thông Báo Email</p>
                  <p className="text-xs text-[#6B7280]">Nhận email khi tồn kho thấp</p>
                </div>
                <div className="w-10 h-5 bg-[#2563EB] rounded-full relative cursor-pointer">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
              <Button className="w-full">Lưu Cấu Hình</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm text-[#111827] mb-4">Danh Sách Kho</h3>
            <div className="space-y-2">
              {[
                { name: "Kho Hà Nội", address: "Cầu Giấy, Hà Nội", capacity: 5000 },
                { name: "Kho TP.HCM", address: "Bình Dương", capacity: 8000 },
                { name: "Kho Đà Nẵng", address: "Khu CN Đà Nẵng", capacity: 3000 },
                { name: "Kho Cần Thơ", address: "KCN Trà Nóc", capacity: 2000 },
              ].map((w) => (
                <div key={w.name} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                  <div>
                    <p className="text-xs text-[#111827]">{w.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{w.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280]">Sức chứa</p>
                    <p className="text-xs text-[#111827]">{w.capacity.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="sm" className="w-full">+ Thêm Kho</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm text-[#111827] mb-4">Nhật Ký Hệ Thống</h3>
            <div className="space-y-2">
              {[
                { action: "Thêm sản phẩm mới", user: "admin", time: "12/12 09:15" },
                { action: "Phê duyệt phiếu nhập PN-234", user: "khoa", time: "12/12 08:30" },
                { action: "Xuất kho PX-567", user: "khob", time: "11/12 17:45" },
                { action: "Cập nhật đại lý ĐL-001", user: "admin", time: "11/12 14:20" },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full shrink-0" />
                  <span className="text-[#374151] flex-1">{log.action}</span>
                  <span className="text-[#9CA3AF]">{log.user}</span>
                  <span className="text-[#9CA3AF] shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Thêm Người Dùng Mới">
        <div className="space-y-3">
          <Input label="Họ Tên *" placeholder="Nguyễn Văn A" />
          <Input label="Email *" placeholder="email@company.vn" type="email" />
          <Input label="Mật Khẩu *" placeholder="••••••••" type="password" />
          <Select label="Vai Trò *" options={roles.map((r) => ({ value: r, label: r }))} onChange={() => {}} />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button className="flex-1">Tạo Tài Khoản</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
