# 🏨 Hotel Loyalty Grand — Booking & Loyalty CRM Platform

> Hệ thống đặt phòng khách sạn cao cấp tích hợp chương trình khách hàng thân thiết toàn diện.

## ✨ Tính Năng Chính

### 🔑 Xác Thực & Phân Quyền
- Đăng ký thành viên với validate đầy đủ (email, mật khẩu mạnh, SĐT Việt Nam)
- Đăng nhập / Đăng xuất thành viên & Admin
- Mã giới thiệu (Referral Code) — tặng điểm thưởng khi giới thiệu bạn bè
- Tài khoản Admin mặc định: `admin@hotel.com` / `Admin@123456`

### 🛏️ Đặt Phòng Thông Minh
- Tìm kiếm phòng theo ngày, số lượng khách
- Kiểm tra phòng trống theo thời gian thực (chống trùng đặt)
- Bảng giá động: giá ngày thường / cuối tuần / ngày lễ
- Hiển thị breakdown chi tiết giá từng đêm
- Áp dụng Voucher giảm giá khi checkout

### 💳 Cổng Thanh Toán Giả Lập
- Giả lập thanh toán VNPAY / MoMo / Tiền mặt
- Xác nhận thanh toán thành công hoặc thất bại
- Tự động tích điểm sau khi thanh toán thành công

### 👤 Cổng Thành Viên
- Xem & chỉnh sửa hồ sơ cá nhân
- Lịch sử đặt phòng + trạng thái (Xác nhận / Chờ / Đã hủy)
- Hủy đặt phòng với chính sách hoàn tiền và thu hồi điểm
- Kho Voucher cá nhân
- Đổi điểm lấy voucher giảm giá

### 🎖️ Chương Trình Loyalty 3 Hạng
| Hạng | Điểm Tối Thiểu | Quyền Lợi |
|------|---------------|-----------|
| Silver | 0 | 1x điểm / đêm |
| Gold | 5,000 điểm | 1.5x điểm + ưu đãi đặc biệt |
| Platinum | 20,000 điểm | 2x điểm + dịch vụ VIP |

### 🛠️ Bảng Quản Trị Admin
- **Dashboard Báo Cáo**: Biểu đồ doanh thu (LineChart), phân tích loại phòng (BarChart), cơ cấu thành viên (PieChart) — sử dụng Recharts
- **Quản Lý Phòng**: CRUD loại phòng với giá 3 mức, quản lý phòng vật lý (units) từng tầng, Bulk-Add hàng loạt
- **CRM Khách Hàng**: Tìm kiếm, lọc theo hạng/phân khúc (VIP, Regular, At-Risk, New), tặng điểm thủ công, ghi chú chăm sóc
- **Marketing & Voucher**: Tạo voucher hàng loạt, phát hành theo phân khúc khách hàng

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (dark mode glassmorphism)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React useState + localStorage (mock database)
- **Hosting**: Vercel

## 🏃 Chạy Dự Án

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## 🔐 Tài Khoản Demo

| Loại | Email | Mật Khẩu |
|------|-------|---------|
| Admin | admin@hotel.com | Admin@123456 |
| Thành viên | guest1@example.com | Guest@123456 |

## 📁 Cấu Trúc Dự Án

```
frontend/
├── src/
│   ├── App.tsx          # Main application component (toàn bộ UI)
│   ├── services/
│   │   └── api.ts       # Mock API + localStorage database
│   ├── index.css        # Global styles + Tailwind theme
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── vercel.json          # Vercel deployment config
├── tailwind.config.js   # Tailwind configuration
└── vite.config.ts       # Vite configuration
```

---

Made with ❤️ — Hotel Loyalty Grand Booking Engine
