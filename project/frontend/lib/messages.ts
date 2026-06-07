const MESSAGE_MAP: Record<string, string> = {
  M0101: "Login ID hoặc mật khẩu không đúng.",
  M0102: "Tài khoản bị vô hiệu hóa. Liên hệ quản trị.",
  M0103: "Đăng nhập thành công.",
  M0301: "Lưu thông tin hàng hóa thành công.",
  M0302: "Mã hàng hóa đã tồn tại trong hệ thống.",
  M0303: "Xóa sản phẩm thành công.",
  M0304: "Không thể xóa — sản phẩm đang có đơn hàng.",
  M0002: "Không tìm thấy dữ liệu.",
  M0001: "Dữ liệu nhập không hợp lệ.",
  M0201: "AI không tìm thấy sản phẩm phù hợp. Thử từ khóa khác.",
  M0202: "Tìm kiếm AI quá thời gian. Vui lòng thử lại.",
  M0203: "Đã gửi sản phẩm chờ duyệt thành công.",
  M0204: "Duyệt sản phẩm AI thành công — đã thêm vào catalog.",
  M0205: "Đã từ chối sản phẩm AI.",
  API_OFFLINE: "Không kết nối được API backend. Hãy chạy: cd project/api && php artisan serve",
};

export function translateMessage(code: string): string {
  return MESSAGE_MAP[code] ?? code;
}
