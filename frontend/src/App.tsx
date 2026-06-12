import React, { useState, useEffect } from 'react';
import { 
  Hotel, Calendar, Users, LogOut, ChevronRight, Check, X, 
  Plus, Gift, Share2, Clipboard, BarChart3, Users2, BedDouble,
  Award, Ticket, DollarSign, PieChart as PieIcon, AlertTriangle, Search
} from 'lucide-react';
import { 
  authAPI, roomAPI, bookingAPI, loyaltyAPI, crmAPI, 
  calculatePriceDetails, initMockDatabase, DEFAULT_ROOM_TYPES
} from './services/api';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

// Local Mock Helpers
const getMockData = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setMockData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export default function App() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<'home' | 'member' | 'admin'>('home');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<'guest' | 'admin' | null>(null);

  // Modal states
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'admin_login' | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authReferralCode, setAuthReferralCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Booking Flow states
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<'search' | 'checkout' | 'payment_gateway' | 'success'>('search');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo' | 'cash'>('vnpay');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [tempBooking, setTempBooking] = useState<any>(null);
  const [paymentGatewayError, setPaymentGatewayError] = useState('');

  // Member Portal states
  const [memberSubTab, setMemberSubTab] = useState<'profile' | 'bookings' | 'vouchers'>('profile');
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [redeemPoints, setRedeemPoints] = useState(100);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Admin Panel states
  const [adminSection, setAdminSection] = useState<'stats' | 'rooms' | 'customers' | 'marketing'>('stats');
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  
  // Admin Search & Filters
  const [crmSearchText, setCrmSearchText] = useState('');
  const [crmTierFilter, setCrmTierFilter] = useState<string>('All');
  const [crmSegmentFilter, setCrmSegmentFilter] = useState<string>('All');

  // Room type CRUD
  const [editingRoomType, setEditingRoomType] = useState<any>(null);
  const [newRoomTypeName, setNewRoomTypeName] = useState('');
  const [newRoomTypePrice, setNewRoomTypePrice] = useState(1000000);
  const [newRoomTypeWeekendPrice, setNewRoomTypeWeekendPrice] = useState(1200000);
  const [newRoomTypeHolidayPrice, setNewRoomTypeHolidayPrice] = useState(1500000);
  const [newRoomTypeCapacity, setNewRoomTypeCapacity] = useState(2);
  const [newRoomTypeDesc, setNewRoomTypeDesc] = useState('');
  
  // Physical units management
  const [selectedRoomTypeForUnits, setSelectedRoomTypeForUnits] = useState<any>(null);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [unitRoomNumber, setUnitRoomNumber] = useState('');
  const [unitFloor, setUnitFloor] = useState(1);
  const [unitStatus, setUnitStatus] = useState<'available' | 'occupied' | 'maintenance'>('available');
  const [showBulkAddUnits, setShowBulkAddUnits] = useState(false);
  const [bulkStartNum, setBulkStartNum] = useState(101);
  const [bulkEndNum, setBulkEndNum] = useState(105);
  const [bulkFloor, setBulkFloor] = useState(1);

  // CRM guest adjustments
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<any>(null);
  const [guestNotesText, setGuestNotesText] = useState('');
  const [awardPointsAmount, setAwardPointsAmount] = useState(100);
  const [awardPointsDesc, setAwardPointsDesc] = useState('');

  // Voucher Creation & Distribution
  const [marketingVoucherCode, setMarketingVoucherCode] = useState('');
  const [marketingVoucherValue, setMarketingVoucherValue] = useState(100000);
  const [marketingVoucherMinSpend, setMarketingVoucherMinSpend] = useState(200000);
  const [marketingVoucherValidFrom, setMarketingVoucherValidFrom] = useState('');
  const [marketingVoucherValidTo, setMarketingVoucherValidTo] = useState('');
  const [distributingVoucherCode, setDistributingVoucherCode] = useState('');
  const [distributeTargetSegment, setDistributeTargetSegment] = useState('All');

  useEffect(() => {
    // Load local auth
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setRole(storedRole as any);
    }
    fetchRoomTypesAndRooms();
    
    // Set default checkin as tomorrow, checkout day after tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 2);
    setCheckIn(tomorrow.toISOString().split('T')[0]);
    setCheckOut(dayAfter.toISOString().split('T')[0]);
  }, []);

  const fetchRoomTypesAndRooms = async () => {
    const types = await roomAPI.getRoomTypes();
    setRoomTypes(types);
  };

  const fetchLoyaltyData = async () => {
    const history = await loyaltyAPI.getHistory();
    const vouchers = await loyaltyAPI.getVouchers();
    setPointHistory(history);
    setMyVouchers(vouchers);
    
    const bookings = await bookingAPI.getBookings();
    if (currentUser) {
      setMyBookings(bookings.filter((b: any) => b.guest_id === currentUser.id).sort((a: any, b: any) => b.id - a.id));
    }
  };

  const fetchAdminData = async () => {
    const customers = await crmAPI.getCustomers();
    const bookings = await bookingAPI.getBookings();
    setCrmCustomers(customers);
    setAllBookings(bookings);
  };

  useEffect(() => {
    if (currentUser && activeTab === 'member') {
      fetchLoyaltyData();
    }
    if (role === 'admin' && activeTab === 'admin') {
      fetchAdminData();
      fetchRoomTypesAndRooms();
    }
  }, [activeTab, currentUser, role]);

  // Handle selected room type physical rooms
  useEffect(() => {
    if (selectedRoomTypeForUnits) {
      roomAPI.getUnits().then(units => {
        setUnitsList(units.filter((u: any) => u.room_type_id === selectedRoomTypeForUnits.id));
      });
    }
  }, [selectedRoomTypeForUnits]);

  // Auth actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authModal === 'admin_login') {
        await authAPI.loginAdmin({ email: authEmail, password: authPassword });
        setRole('admin');
        setActiveTab('admin');
      } else {
        const res = await authAPI.login({ email: authEmail, password: authPassword });
        setCurrentUser(res.data.guest);
        setRole('guest');
        setActiveTab('member');
      }
      setAuthModal(null);
      resetAuthFields();
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // Check validation rules from PDF
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError('Định dạng email không hợp lệ.');
      return;
    }
    
    // Password: min 8, uppercase, lowercase, numbers
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passRegex.test(authPassword)) {
      setAuthError('Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.');
      return;
    }

    if (authFirstName.length < 2 || authFirstName.length > 50 || authLastName.length < 2 || authLastName.length > 50) {
      setAuthError('Họ và Tên phải có độ dài từ 2 đến 50 ký tự.');
      return;
    }

    // Vietnam phone format: +84 or 0xxxxxxxxx
    const phoneRegex = /^(?:\+84|0)(?:\d{9}|\d{10})$/;
    if (!phoneRegex.test(authPhone)) {
      setAuthError('Số điện thoại không đúng định dạng Việt Nam (+84 hoặc 0xxxxxxxxx).');
      return;
    }

    try {
      await authAPI.register({
        email: authEmail,
        password: authPassword,
        firstName: authFirstName,
        lastName: authLastName,
        phone: authPhone,
        referralCode: authReferralCode
      });
      // Auto-login
      const loginRes = await authAPI.login({ email: authEmail, password: authPassword });
      setCurrentUser(loginRes.data.guest);
      setRole('guest');
      setAuthModal(null);
      setActiveTab('member');
      resetAuthFields();
      alert('Đăng ký tài khoản thành viên thành công! Bạn nhận được +200 điểm thưởng chào mừng.');
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Đăng ký không thành công.');
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setCurrentUser(null);
    setRole(null);
    setActiveTab('home');
  };

  const resetAuthFields = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthFirstName('');
    setAuthLastName('');
    setAuthPhone('');
    setAuthReferralCode('');
    setAuthError('');
  };

  // Booking Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date boundary
    const todayStr = new Date().toISOString().split('T')[0];
    if (checkIn < todayStr) {
      alert('Ngày nhận phòng không thể ở quá khứ.');
      return;
    }
    if (checkIn >= checkOut) {
      alert('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    
    const diffNights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    if (diffNights > 30) {
      alert('Thời gian lưu trú tối đa là 30 ngày.');
      return;
    }

    const results = await bookingAPI.searchRooms({ checkIn, checkOut, adults, children });
    setSearchResults(results);
    setBookingStep('search');
  };

  const selectRoomType = (type: any) => {
    setSelectedRoomType(type);
    setAppliedVoucher(null);
    setVoucherCode('');
    setBookingStep('checkout');
  };

  const handleApplyVoucher = () => {
    const priceDetails = calculatePriceDetails(selectedRoomType, checkIn, checkOut);
    const vouchers = JSON.parse(localStorage.getItem('vouchers') || '[]');
    const voucher = vouchers.find((v: any) => v.code.toUpperCase() === voucherCode.trim().toUpperCase() && v.is_active);
    
    if (voucher) {
      if (priceDetails.total < voucher.min_spend) {
        alert(`Đơn đặt phòng tối thiểu phải trị giá ${voucher.min_spend.toLocaleString('vi-VN')} VND để sử dụng voucher này.`);
        return;
      }
      // Check if this voucher belongs to another guest
      if (voucher.created_by_guest_id && (!currentUser || voucher.created_by_guest_id !== currentUser.id)) {
        alert('Mã giảm giá này không khả dụng cho tài khoản của bạn.');
        return;
      }
      setAppliedVoucher(voucher);
    } else {
      alert('Mã giảm giá không chính xác hoặc đã hết hạn sử dụng.');
    }
  };

  // Initialize payment redirect
  const handleGoToPayment = async () => {
    const guestUser = currentUser || { id: null, email: 'guest@anon.com', firstName: 'Khách', lastName: 'Vãng lai' };
    const priceDetails = calculatePriceDetails(selectedRoomType, checkIn, checkOut);
    const total = priceDetails.total - (appliedVoucher ? appliedVoucher.value : 0);

    const bookingData = {
      room_type_id: selectedRoomType.id,
      guest_id: guestUser.id,
      guest_name: `${guestUser.lastName} ${guestUser.firstName}`,
      guest_email: guestUser.email,
      check_in: checkIn,
      check_out: checkOut,
      adults,
      children,
      total_amount: Math.max(total, 0),
    };

    try {
      const res = await bookingAPI.createBooking(bookingData);
      if (res.success) {
        setTempBooking(res.data);
        setBookingStep('payment_gateway');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt phòng. Vui lòng thử lại.');
    }
  };

  // Confirm payment in simulated gateway
  const handleConfirmPaymentSuccess = async () => {
    if (tempBooking) {
      await bookingAPI.confirmBooking(tempBooking.id, paymentMethod);
      // Consume voucher if applied
      if (appliedVoucher) {
        const vouchers = JSON.parse(localStorage.getItem('vouchers') || '[]');
        const idx = vouchers.findIndex((v: any) => v.id === appliedVoucher.id);
        if (idx !== -1) {
          // If it was a generic public voucher, leave it active, otherwise mark used
          if (appliedVoucher.created_by_guest_id) {
            vouchers[idx].is_active = false;
            setMockData('vouchers', vouchers);
          }
        }
      }
      setConfirmedBooking(tempBooking);
      setBookingStep('success');
      // Sync local user states
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        setCurrentUser(JSON.parse(updatedUser));
      }
      setTempBooking(null);
      setAppliedVoucher(null);
    }
  };

  const handleConfirmPaymentFail = () => {
    setPaymentGatewayError('Thanh toán không thành công hoặc giao dịch bị hủy bỏ bởi người dùng.');
    setBookingStep('checkout');
    setTempBooking(null);
  };

  // Cancel Booking (Guest)
  const handleCancelMyBooking = async (bookingId: number) => {
    if (confirm('Bạn chắc chắn muốn hủy đơn đặt phòng này? Quy trình hoàn tiền và thu hồi điểm sẽ được áp dụng.')) {
      try {
        const res = await bookingAPI.cancelBooking(bookingId);
        alert(res.message);
        fetchLoyaltyData();
      } catch (err: any) {
        alert(err.message || 'Không thể hủy đơn đặt phòng.');
      }
    }
  };

  // Loyalty Points Redemption
  const handleRedeemPoints = async () => {
    try {
      const amount = redeemPoints * 1000;
      await loyaltyAPI.redeemVoucher(redeemPoints, amount);
      fetchLoyaltyData();
      const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setCurrentUser(updatedUser);
      alert('Đổi điểm thành công! Voucher giảm giá mới đã được thêm vào tài khoản của bạn.');
    } catch (err: any) {
      alert(err.message || 'Quy đổi thất bại.');
    }
  };

  // Admin save room type
  const handleSaveRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingRoomType && !editingRoomType.isNew ? { ...editingRoomType } : { id: null };
    data.name = newRoomTypeName;
    data.base_price = Number(newRoomTypePrice);
    data.weekend_price = Number(newRoomTypeWeekendPrice);
    data.holiday_price = Number(newRoomTypeHolidayPrice);
    data.capacity = Number(newRoomTypeCapacity);
    data.description = newRoomTypeDesc;
    data.amenities = editingRoomType?.amenities || ["WiFi", "AC", "TV", "Minibar"];
    data.images = editingRoomType?.images || ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600"];

    await roomAPI.saveRoomType(data);
    setEditingRoomType(null);
    fetchRoomTypesAndRooms();
    alert('Đã cập nhật loại phòng thành công.');
  };

  // Admin unit actions
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const unit = editingUnit ? { ...editingUnit } : { id: null };
    unit.room_type_id = selectedRoomTypeForUnits.id;
    unit.room_number = unitRoomNumber;
    unit.floor = Number(unitFloor);
    unit.status = unitStatus;

    await roomAPI.saveUnit(unit);
    setEditingUnit(null);
    // Reload units
    const units = await roomAPI.getUnits();
    setUnitsList(units.filter((u: any) => u.room_type_id === selectedRoomTypeForUnits.id));
    alert('Đã cập nhật thông tin phòng vật lý.');
  };

  const handleDeleteUnit = async (id: number) => {
    if (confirm('Bạn chắc chắn muốn xóa phòng vật lý này?')) {
      await roomAPI.deleteUnit(id);
      const units = await roomAPI.getUnits();
      setUnitsList(units.filter((u: any) => u.room_type_id === selectedRoomTypeForUnits.id));
    }
  };

  const handleBulkAddUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkStartNum > bulkEndNum) {
      alert('Số bắt đầu không thể lớn hơn số kết thúc.');
      return;
    }
    await roomAPI.bulkAddUnits(selectedRoomTypeForUnits.id, bulkStartNum, bulkEndNum, bulkFloor);
    setShowBulkAddUnits(false);
    // Reload
    const units = await roomAPI.getUnits();
    setUnitsList(units.filter((u: any) => u.room_type_id === selectedRoomTypeForUnits.id));
    alert(`Đã thêm hàng loạt các phòng từ ${bulkStartNum} đến ${bulkEndNum}.`);
  };

  // CRM notes & points adjustment
  const handleSaveGuestNotes = async () => {
    await crmAPI.saveNotes(selectedCustomerForDetail.id, guestNotesText);
    alert('Đã lưu ghi chú chăm sóc khách hàng.');
    fetchAdminData();
    // Refresh selected customer
    const customers = await crmAPI.getCustomers();
    setSelectedCustomerForDetail(customers.find((g: any) => g.id === selectedCustomerForDetail.id));
  };

  const handleAwardPoints = async () => {
    if (awardPointsAmount === 0) return;
    await crmAPI.awardPoints(selectedCustomerForDetail.id, awardPointsAmount, awardPointsDesc);
    alert('Cập nhật điểm thành công.');
    fetchAdminData();
    // Refresh
    const customers = await crmAPI.getCustomers();
    setSelectedCustomerForDetail(customers.find((g: any) => g.id === selectedCustomerForDetail.id));
    setAwardPointsAmount(100);
    setAwardPointsDesc('');
  };

  // Admin marketing voucher creation
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketingVoucherCode) return;
    await crmAPI.createVoucherBulk({
      code: marketingVoucherCode,
      value: marketingVoucherValue,
      minSpend: marketingVoucherMinSpend,
      validFrom: marketingVoucherValidFrom,
      validTo: marketingVoucherValidTo
    });
    alert(`Đã khởi tạo Voucher ${marketingVoucherCode.toUpperCase()} trên hệ thống.`);
    setMarketingVoucherCode('');
    fetchAdminData();
  };

  // Admin voucher distribution
  const handleDistributeVoucher = async () => {
    if (!distributingVoucherCode) {
      alert('Vui lòng chọn Voucher cần phát hành.');
      return;
    }
    try {
      const res = await crmAPI.distributeVoucherToSegment(distributingVoucherCode, distributeTargetSegment);
      alert(`Phát hành thành công! Đã gửi voucher ${distributingVoucherCode} cho ${res.count} thành viên thuộc phân khúc "${distributeTargetSegment}".`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Phát hành voucher thất bại.');
    }
  };

  // Reset local database completely
  const handleResetDatabase = () => {
    if (confirm('Bạn muốn đặt lại cơ sở dữ liệu về ban đầu? Việc này sẽ xóa toàn bộ các đơn đặt phòng, thành viên và voucher mới tạo.')) {
      initMockDatabase(true);
      fetchRoomTypesAndRooms();
      fetchAdminData();
      if (currentUser) {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setCurrentUser(null);
        setRole(null);
      }
      setActiveTab('home');
      alert('Cơ sở dữ liệu LocalStorage đã được đặt lại thành công!');
    }
  };

  // Filter crm customers
  const filteredCustomers = crmCustomers.filter((c: any) => {
    const text = crmSearchText.toLowerCase();
    const matchesSearch = 
      c.first_name.toLowerCase().includes(text) || 
      c.last_name.toLowerCase().includes(text) || 
      c.email.toLowerCase().includes(text) || 
      c.phone.includes(text);
    
    const matchesTier = crmTierFilter === 'All' || c.tier === crmTierFilter;
    
    // Segment logic
    let matchesSegment = true;
    if (crmSegmentFilter !== 'All') {
      if (crmSegmentFilter === 'VIP') {
        matchesSegment = c.tier === 'Platinum' || c.total_spend >= 50000000;
      } else if (crmSegmentFilter === 'Regular') {
        matchesSegment = c.tier === 'Gold' || c.total_nights >= 5;
      } else if (crmSegmentFilter === 'At-Risk') {
        const bookings = allBookings.filter((b: any) => b.guest_id === c.id);
        if (bookings.length === 0) {
          matchesSegment = false;
        } else {
          const lastBookingTime = Math.max(...bookings.map((b: any) => new Date(b.created_at).getTime()));
          const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
          matchesSegment = lastBookingTime < sixMonthsAgo;
        }
      } else if (crmSegmentFilter === 'New') {
        const registerTime = new Date(c.created_at).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const bookings = allBookings.filter((b: any) => b.guest_id === c.id);
        matchesSegment = registerTime > thirtyDaysAgo && bookings.length === 0;
      }
    }

    return matchesSearch && matchesTier && matchesSegment;
  });

  // Calculate charts data
  const getRevenueByMonth = () => {
    const months = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];
    // Default values for beauty dashboard
    const baseRevenue = [24000000, 32000000, 28000000, 45000000, 68000000, 85000000, 72000000, 64000000, 52000000, 48000000, 39000000, 55000000];
    
    // Aggregate from allBookings if matching months
    const date = new Date();
    const currentYear = date.getFullYear();
    
    return months.map((m, idx) => {
      const confirmed = allBookings.filter(b => {
        const bDate = new Date(b.created_at);
        return b.status === 'confirmed' && bDate.getFullYear() === currentYear && bDate.getMonth() === idx;
      });
      const extraRev = confirmed.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      return {
        name: m,
        'Doanh Thu': baseRevenue[idx] + extraRev
      };
    });
  };

  const getRevenueByRoomType = () => {
    const types = roomTypes.length > 0 ? roomTypes : DEFAULT_ROOM_TYPES;
    return types.map((t: any) => {
      const typeBookings = allBookings.filter(b => b.room_type_id === t.id && b.status === 'confirmed');
      const rev = typeBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      return {
        name: t.name,
        'Doanh thu thực tế': rev,
        'Doanh thu nền': t.id === 1 ? 24000000 : t.id === 2 ? 38000000 : 45000000
      };
    });
  };

  const getBookingStatusData = () => {
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;
    
    return [
      { name: 'Xác Nhận (Confirmed)', value: confirmed + 12 },
      { name: 'Chờ Thanh Toán (Pending)', value: pending + 2 },
      { name: 'Đã Hủy (Cancelled)', value: cancelled + 3 }
    ];
  };

  const getTierDistribution = () => {
    const silver = crmCustomers.filter(c => c.tier === 'Silver').length;
    const gold = crmCustomers.filter(c => c.tier === 'Gold').length;
    const platinum = crmCustomers.filter(c => c.tier === 'Platinum').length;
    return [
      { name: 'Silver Tier', value: silver + 14 },
      { name: 'Gold Tier', value: gold + 8 },
      { name: 'Platinum Tier', value: platinum + 4 }
    ];
  };

  const getPointsAnalytics = () => {
    const transactions = getMockData('point_transactions');
    const issued = transactions.filter((t: any) => t.points > 0).reduce((sum: number, t: any) => sum + t.points, 0);
    const redeemed = Math.abs(transactions.filter((t: any) => t.points < 0).reduce((sum: number, t: any) => sum + t.points, 0));
    
    return [
      { name: 'Điểm Phát Hành', 'Tích Lũy': issued },
      { name: 'Điểm Quy Đổi', 'Sử Dụng': redeemed }
    ];
  };

  const COLORS = ['#C9A84C', '#DEC176', '#8A9A86', '#8E9AA6', '#EF4444'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-12 font-sans selection:bg-accent selection:text-slate-950">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('home'); setBookingStep('search'); setSelectedRoomType(null); setSearchResults([]); }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-amber-300 flex items-center justify-center shadow-lg shadow-accent/20">
              <Hotel className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">HOTEL LOYALTY</span>
              <p className="text-[10px] text-accent tracking-widest font-semibold uppercase">Grand Booking & CRM</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium">
            <button 
              onClick={() => { setActiveTab('home'); setBookingStep('search'); setSelectedRoomType(null); setSearchResults([]); }} 
              className={`pb-1 transition-all ${activeTab === 'home' ? 'text-accent border-b-2 border-accent' : 'text-slate-400 hover:text-white'}`}
            >
              Đặt Phòng
            </button>
            <button 
              onClick={() => {
                if (!currentUser || role !== 'guest') {
                  setAuthModal('login');
                } else {
                  setActiveTab('member');
                  setMemberSubTab('profile');
                }
              }} 
              className={`pb-1 transition-all ${activeTab === 'member' ? 'text-accent border-b-2 border-accent' : 'text-slate-400 hover:text-white'}`}
            >
              Thành Viên
            </button>
            <button 
              onClick={() => {
                if (role !== 'admin') {
                  setAuthModal('admin_login');
                } else {
                  setActiveTab('admin');
                  setAdminSection('stats');
                }
              }} 
              className={`pb-1 transition-all ${activeTab === 'admin' ? 'text-accent border-b-2 border-accent' : 'text-slate-400 hover:text-white'}`}
            >
              Quản Trị
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleResetDatabase}
              className="text-xs text-red-400/80 hover:text-red-400 hover:underline px-3 py-1 bg-red-950/20 rounded border border-red-900/30 transition-all font-semibold"
            >
              Reset Data
            </button>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-semibold">{currentUser.lastName} {currentUser.firstName}</span>
                  {role === 'guest' && (
                    <span className="text-xs text-accent font-medium">Hạng {currentUser.tier} • {currentUser.points} điểm</span>
                  )}
                  {role === 'admin' && (
                    <span className="text-xs text-indigo-400 font-medium">Quản Trị Viên</span>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthModal('login')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-amber-500 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-accent/15 transition-all text-sm"
              >
                Đăng Nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/25">KỲ NGHỈ THƯỢNG LƯU</span>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                Tìm Phòng Cao Cấp &amp; <br />
                <span className="bg-gradient-to-r from-accent via-amber-300 to-yellow-500 bg-clip-text text-transparent">Tích Lũy Điểm Thưởng Khách Hàng</span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg">
                Hệ thống đặt phòng thông minh với chương trình khách hàng thân thiết Silver, Gold &amp; Platinum cực kỳ hấp dẫn.
              </p>
            </div>

            {/* Search Widget */}
            {bookingStep !== 'payment_gateway' && bookingStep !== 'success' && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-950/50">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ngày Check-In</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                      <input 
                        type="date" 
                        required
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-accent outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ngày Check-Out</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                      <input 
                        type="date" 
                        required
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-accent outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Người Lớn (1-10)</label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                        <input 
                          type="number" 
                          min="1" 
                          max="10"
                          value={adults}
                          onChange={(e) => setAdults(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-accent outline-none text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trẻ Em (0-5)</label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                        <input 
                          type="number" 
                          min="0" 
                          max="5"
                          value={children}
                          onChange={(e) => setChildren(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-accent outline-none text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-accent text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-accent/10 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-5 h-5" />
                      TÌM PHÒNG TRỐNG
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Results & Booking Engine Flow */}
            {bookingStep === 'search' && searchResults.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-wide">Các Loại Phòng Còn Trống</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {searchResults.map((type) => (
                    <div key={type.id} className="glass-panel overflow-hidden rounded-2xl border border-slate-800 hover:border-accent/30 transition-all flex flex-col group">
                      <div className="h-56 overflow-hidden relative">
                        <img 
                          src={type.images[0]} 
                          alt={type.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 px-3 py-1 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold text-accent">
                          Sức chứa: {type.capacity} khách
                        </div>
                      </div>
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">{type.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${type.roomsLeft > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {type.roomsLeft > 0 ? `Còn ${type.roomsLeft} phòng trống` : 'Hết phòng'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{type.description}</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {type.amenities.map((item: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">{item}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                          <div>
                            <span className="text-xs text-slate-400 block font-medium">Giá 1 đêm từ</span>
                            <span className="text-xl font-extrabold text-accent">{(type.base_price).toLocaleString('vi-VN')} VND</span>
                          </div>
                          <button 
                            onClick={() => selectRoomType(type)}
                            disabled={type.roomsLeft <= 0}
                            className="px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-white font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed"
                          >
                            Chọn Phòng <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookingStep === 'checkout' && selectedRoomType && (() => {
              const priceDetails = calculatePriceDetails(selectedRoomType, checkIn, checkOut);
              const totalAmount = priceDetails.total - (appliedVoucher ? appliedVoucher.value : 0);
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold tracking-wide">Xác Nhận Thông Tin Đặt Phòng</h2>
                    
                    {paymentGatewayError && (
                      <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>{paymentGatewayError}</span>
                      </div>
                    )}
                    
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Họ &amp; Tên Khách Hàng</label>
                          <input 
                            type="text" 
                            disabled
                            value={currentUser ? `${currentUser.lastName} ${currentUser.firstName}` : 'Khách vãng lai'}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-350 text-sm outline-none cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Địa Chỉ Email</label>
                          <input 
                            type="email" 
                            disabled
                            value={currentUser ? currentUser.email : 'guest@anon.com'}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-350 text-sm outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Phương Thức Thanh Toán</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <label className={`p-4 rounded-xl border flex flex-col justify-between gap-4 cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-accent bg-accent/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                            <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="sr-only" />
                            <span className="font-bold text-sm block">VNPAY Portal</span>
                            <span className="text-xs text-slate-400">Cổng thanh toán điện tử VNPAY (Simulate)</span>
                          </label>
                          <label className={`p-4 rounded-xl border flex flex-col justify-between gap-4 cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-accent bg-accent/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                            <input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="sr-only" />
                            <span className="font-bold text-sm block">Ví MoMo</span>
                            <span className="text-xs text-slate-400">Ví điện tử MoMo Mobile QR (Simulate)</span>
                          </label>
                          <label className={`p-4 rounded-xl border flex flex-col justify-between gap-4 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-accent bg-accent/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                            <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="sr-only" />
                            <span className="font-bold text-sm block">Khi Nhận Phòng</span>
                            <span className="text-xs text-slate-400">Thanh toán bằng tiền mặt/thẻ tại quầy lễ tân</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Order Summary */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-wide">Chi Tiết Đơn Phòng</h2>
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Loại phòng:</span>
                          <span className="font-semibold">{selectedRoomType.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Nhận phòng:</span>
                          <span className="font-semibold">{checkIn}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Trả phòng:</span>
                          <span className="font-semibold">{checkOut}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Tổng thời gian:</span>
                          <span className="font-bold text-accent">{priceDetails.nights} Đêm</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Số khách:</span>
                          <span className="font-semibold">{adults} NL, {children} TE</span>
                        </div>
                      </div>

                      <hr className="border-slate-800" />
                      
                      {/* Price Breakdown night-by-night */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Bảng giá chi tiết từng đêm:</span>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {priceDetails.breakdown.map((b: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-slate-400">{b.date} ({b.dayType})</span>
                              <span className="font-semibold text-slate-300">{(b.price).toLocaleString('vi-VN')} VND</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <hr className="border-slate-800" />

                      {/* Voucher Box */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Mã Giảm Giá (Voucher)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Nhập mã voucher..."
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            className="flex-grow px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent"
                          />
                          <button 
                            onClick={handleApplyVoucher}
                            className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
                          >
                            Áp Dụng
                          </button>
                        </div>
                        {appliedVoucher && (
                          <div className="flex justify-between items-center px-3 py-1 bg-green-950/20 border border-green-800/30 rounded text-xs text-green-400">
                            <span>✓ Giảm -{(appliedVoucher.value).toLocaleString('vi-VN')} VND ({appliedVoucher.code})</span>
                            <button onClick={() => setAppliedVoucher(null)} className="text-red-400 hover:text-red-300 font-bold ml-1">X</button>
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-800" />

                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Tổng tiền phòng</span>
                          {appliedVoucher && (
                            <span className="text-xs text-slate-500 line-through">{(priceDetails.total).toLocaleString('vi-VN')} VND</span>
                          )}
                        </div>
                        <span className="text-2xl font-black text-accent">
                          {Math.max(totalAmount, 0).toLocaleString('vi-VN')} VND
                        </span>
                      </div>

                      {currentUser && role === 'guest' && (
                        <div className="p-3 bg-slate-900/50 rounded-xl border border-accent/25 text-center text-xs">
                          <span className="text-slate-400">Bạn sẽ tích lũy được:</span>
                          <span className="block font-bold text-accent mt-1">
                            +{Math.floor(Math.max(totalAmount, 0) / 100000) * (currentUser.tier === 'Platinum' ? 2.0 : currentUser.tier === 'Gold' ? 1.5 : 1.0)} điểm thưởng
                          </span>
                        </div>
                      )}

                      <div className="flex gap-4 pt-2">
                        <button 
                          onClick={() => { setBookingStep('search'); setPaymentGatewayError(''); }}
                          className="w-1/2 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                        >
                          Quay lại
                        </button>
                        <button 
                          onClick={handleGoToPayment}
                          className="w-1/2 py-3 bg-accent text-slate-950 hover:brightness-110 font-bold rounded-xl text-sm transition-all shadow-lg shadow-accent/15 cursor-pointer"
                        >
                          Đặt Phòng
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Simulated Payment Gateway Gate */}
            {bookingStep === 'payment_gateway' && tempBooking && (
              <div className="max-w-xl mx-auto py-8">
                <div className={`p-8 rounded-3xl border shadow-2xl relative ${
                  paymentMethod === 'vnpay' ? 'bg-[#0f2142] border-blue-900/40 text-slate-100' :
                  paymentMethod === 'momo' ? 'bg-[#3b0b23] border-pink-900/40 text-slate-100' :
                  'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
                    <div>
                      {paymentMethod === 'vnpay' && <span className="font-extrabold text-2xl tracking-wider text-blue-400">VN<span className="text-red-400">PAY</span> Sandbox</span>}
                      {paymentMethod === 'momo' && <span className="font-extrabold text-2xl tracking-wider text-pink-400">MoMo Test Cổng</span>}
                      {paymentMethod === 'cash' && <span className="font-extrabold text-2xl tracking-wider text-accent">XÁC NHẬN ĐƠN PHÒNG</span>}
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Simulated Gateway v2.0</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Số tiền thanh toán</span>
                      <span className="text-2xl font-black text-accent">{tempBooking.total_amount.toLocaleString('vi-VN')} VND</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-xs">Mã đơn phòng:</span>
                        <span className="font-mono font-bold">{tempBooking.booking_ref}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-xs">Khách hàng:</span>
                        <span className="font-bold">{tempBooking.guest_name}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-400 block text-xs">Thời gian ở:</span>
                        <span>{tempBooking.check_in} / {tempBooking.check_out}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-400 block text-xs">Phương thức:</span>
                        <span className="font-bold text-accent uppercase">{paymentMethod}</span>
                      </div>
                    </div>

                    {paymentMethod !== 'cash' && (
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mx-auto w-48 h-48 shadow-lg">
                        {/* SVG QR Code Simulation */}
                        <svg className="w-40 h-40" viewBox="0 0 100 100">
                          <rect x="0" y="0" width="100" height="100" fill="#fff" />
                          <rect x="5" y="5" width="30" height="30" fill="#000" />
                          <rect x="10" y="10" width="20" height="20" fill="#fff" />
                          <rect x="14" y="14" width="12" height="12" fill="#000" />
                          
                          <rect x="65" y="5" width="30" height="30" fill="#000" />
                          <rect x="70" y="10" width="20" height="20" fill="#fff" />
                          <rect x="74" y="14" width="12" height="12" fill="#000" />

                          <rect x="5" y="65" width="30" height="30" fill="#000" />
                          <rect x="10" y="70" width="20" height="20" fill="#fff" />
                          <rect x="74" y="74" width="12" height="12" fill="#000" />
                          
                          {/* Random dot matrices */}
                          <rect x="42" y="10" width="10" height="6" fill="#000" />
                          <rect x="50" y="24" width="8" height="8" fill="#000" />
                          <rect x="40" y="40" width="20" height="20" fill="#000" />
                          <rect x="45" y="45" width="10" height="10" fill="#fff" />
                          <rect x="70" y="45" width="12" height="6" fill="#000" />
                          <rect x="10" y="45" width="6" height="12" fill="#000" />
                          <rect x="65" y="65" width="8" height="12" fill="#000" />
                          <rect x="80" y="80" width="12" height="10" fill="#000" />
                          <rect x="85" y="65" width="5" height="5" fill="#000" />
                        </svg>
                        <span className="text-[10px] text-slate-800 font-bold mt-2">Quét mã để thanh toán</span>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <p className="text-xs text-slate-400 text-center leading-relaxed">
                        {paymentMethod === 'cash' ? 'Nhấn xác nhận bên dưới để hoàn tất lưu giữ đơn phòng.' :
                        'Hệ thống đang chạy trong chế độ GIẢ LẬP (MOCK). Vui lòng chọn một trong hai phương án dưới đây để tiếp tục.'}
                      </p>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={handleConfirmPaymentFail}
                          className="w-1/2 py-3 bg-red-950/40 border border-red-900/30 text-red-400 font-bold rounded-xl text-sm transition-all hover:bg-red-900/20 cursor-pointer"
                        >
                          {paymentMethod === 'cash' ? 'Hủy Bỏ' : 'Thanh Toán Thất Bại'}
                        </button>
                        <button 
                          onClick={handleConfirmPaymentSuccess}
                          className="w-1/2 py-3 bg-green-500 text-slate-950 font-bold rounded-xl text-sm transition-all hover:brightness-105 shadow-lg shadow-green-500/20 cursor-pointer"
                        >
                          {paymentMethod === 'cash' ? 'Xác Nhận Đặt' : 'Thanh Toán Thành Công'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bookingStep === 'success' && confirmedBooking && (
              <div className="max-w-md mx-auto text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <span className="text-green-500 font-bold text-sm">ĐƠN ĐẶT PHÒNG THÀNH CÔNG</span>
                  <h2 className="text-3xl font-extrabold text-white">Thành Công!</h2>
                  <p className="text-slate-400 text-sm">
                    Mã đặt phòng của bạn là <span className="font-mono text-accent font-bold">{confirmedBooking.booking_ref}</span>. Chúng tôi đã gửi email xác nhận đặt phòng và hóa đơn.
                  </p>
                </div>
                
                <div className="glass-panel p-6 rounded-2xl text-left space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Loại phòng:</span>
                    <span className="font-semibold">{selectedRoomType.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Check-In / Out:</span>
                    <span className="font-semibold">{checkIn} đến {checkOut}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Trạng thái:</span>
                    <span className="font-bold text-green-500">Đã xác nhận ({paymentMethod.toUpperCase()})</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setBookingStep('search');
                      setSelectedRoomType(null);
                      setSearchResults([]);
                    }}
                    className="w-1/2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ĐẶT THÊM PHÒNG
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('member');
                      setMemberSubTab('bookings');
                    }}
                    className="w-1/2 px-6 py-3 rounded-xl bg-accent text-slate-950 font-bold text-xs transition-all hover:brightness-105 cursor-pointer shadow-lg shadow-accent/15"
                  >
                    XEM ĐƠN PHÒNG CỦA TÔI
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Member Loyalty Portal */}
        {activeTab === 'member' && currentUser && (
          <div className="space-y-8">
            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setMemberSubTab('profile')}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${memberSubTab === 'profile' ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Hạng Thẻ &amp; Tích Điểm
              </button>
              <button 
                onClick={() => setMemberSubTab('bookings')}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${memberSubTab === 'bookings' ? 'border-accent text-accent' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                Đơn Phòng Của Tôi
              </button>
            </div>

            {memberSubTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  {/* Membership Premium Card */}
                  <div className={`p-8 rounded-3xl relative overflow-hidden shadow-2xl ${
                    currentUser.tier === 'Platinum' ? 'gradient-platinum text-white' :
                    currentUser.tier === 'Gold' ? 'gradient-gold text-slate-950 shadow-amber-500/10' :
                    'gradient-silver text-white'
                  }`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">THẺ THÀNH VIÊN THÂN THIẾT</span>
                        <h2 className="text-3xl font-extrabold tracking-wide">{currentUser.lastName} {currentUser.firstName}</h2>
                      </div>
                      <div className="px-4 py-1.5 rounded-xl border border-white/20 bg-black/10 backdrop-blur-md text-xs font-black uppercase tracking-wider">
                        {currentUser.tier} MEMBER
                      </div>
                    </div>

                    <div className="mt-16 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider opacity-80 block">Số điểm tích lũy</span>
                        <span className="text-3xl font-black">{currentUser.points} <span className="text-xs font-normal opacity-85">điểm</span></span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider opacity-80 block">Tổng đêm đã nghỉ</span>
                        <span className="text-2xl font-black">{currentUser.totalNights} Đêm</span>
                      </div>
                    </div>
                  </div>

                  {/* Tier upgrade progress */}
                  {currentUser.tier !== 'Platinum' && (
                    <div className="glass-panel p-6 rounded-2xl space-y-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Tiến trình nâng hạng tiếp theo</span>
                        <span className="text-accent">
                          Còn {currentUser.tier === 'Silver' ? 10 - currentUser.totalNights : 25 - currentUser.totalNights} Đêm (hoặc {currentUser.tier === 'Silver' ? (15000000 - currentUser.totalSpend).toLocaleString('vi-VN') : (40000000 - currentUser.totalSpend).toLocaleString('vi-VN')} VND chi tiêu) để lên hạng {currentUser.tier === 'Silver' ? 'Gold' : 'Platinum'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-accent h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (currentUser.totalNights / (currentUser.tier === 'Silver' ? 10 : 25)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Points Transaction Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold tracking-wide">Lịch Sử Giao Dịch Điểm</h3>
                    <div className="glass-panel p-6 rounded-2xl space-y-4 max-h-[300px] overflow-y-auto">
                      {pointHistory.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">Chưa có giao dịch tích lũy điểm nào.</p>
                      ) : (
                        pointHistory.map((t) => (
                          <div key={t.id} className="flex justify-between items-center py-3 border-b border-slate-850 last:border-none">
                            <div className="space-y-0.5">
                              <span className="text-sm font-semibold block text-slate-200">{t.description}</span>
                              <span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className={`text-sm font-black ${t.points > 0 ? 'text-accent' : 'text-red-400'}`}>
                              {t.points > 0 ? '+' : ''}{t.points}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Redeem & Rewards Side */}
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-accent" />
                      <h3 className="text-lg font-bold">Đổi Điểm Lấy Voucher</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Điểm chọn đổi:</span>
                        <span className="font-mono text-white">{redeemPoints} điểm</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="1000" 
                        step="100"
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(Number(e.target.value))}
                        className="w-full accent-accent cursor-pointer"
                      />
                      <div className="p-3 bg-slate-900 rounded-xl text-center space-y-1">
                        <span className="text-xs text-slate-400 block">Quy đổi được Voucher giảm</span>
                        <span className="font-extrabold text-accent">{(redeemPoints * 1000).toLocaleString('vi-VN')} VND</span>
                      </div>

                      <button 
                        onClick={handleRedeemPoints}
                        disabled={currentUser.points < redeemPoints}
                        className="w-full py-3 bg-accent text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-xl text-xs transition-colors hover:brightness-105 cursor-pointer"
                      >
                        XÁC NHẬN ĐỔI ĐIỂM
                      </button>
                    </div>
                  </div>

                  {/* Referral Program */}
                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-accent" />
                      <h3 className="text-lg font-bold">Giới Thiệu Bạn Bè</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Chia sẻ mã giới thiệu này cho bạn bè. Bạn nhận ngay <span className="font-bold text-accent">+500 điểm</span>, bạn của bạn nhận <span className="font-bold text-accent">+200 điểm</span> khi họ đăng ký tài khoản mới.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`KS-REF-${currentUser.id}`}
                        className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono outline-none flex-grow"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`KS-REF-${currentUser.id}`);
                          alert('Mã giới thiệu đã được sao chép vào clipboard!');
                        }}
                        className="p-2 bg-slate-800 rounded-xl text-slate-350 hover:text-white cursor-pointer"
                        title="Copy"
                      >
                        <Clipboard className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vouchers list */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Voucher của tôi</h3>
                    {myVouchers.filter(v => v.created_by_guest_id === currentUser.id).length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-4">Chưa đổi voucher nào.</p>
                    ) : (
                      myVouchers.filter(v => v.created_by_guest_id === currentUser.id).map((v) => (
                        <div key={v.id} className={`p-3 bg-slate-900 border rounded-xl flex justify-between items-center ${v.is_active ? 'border-slate-800' : 'border-slate-950 opacity-50'}`}>
                          <div>
                            <span className="font-mono text-accent text-sm font-bold block">{v.code}</span>
                            <span className="text-[10px] text-slate-400">Giảm: {(v.value).toLocaleString('vi-VN')} VND (Chi tiêu từ {(v.min_spend).toLocaleString('vi-VN')} VND)</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.is_active ? 'bg-green-950/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                            {v.is_active ? 'Khả dụng' : 'Đã dùng'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {memberSubTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  {(['all', 'active', 'completed', 'cancelled'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setBookingFilter(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        bookingFilter === f ? 'bg-accent border-accent text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'Tất Cả Đơn' :
                       f === 'active' ? 'Sắp Tới' :
                       f === 'completed' ? 'Đã Hoàn Thành' : 'Đã Hủy'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myBookings
                    .filter(b => {
                      if (bookingFilter === 'all') return true;
                      if (bookingFilter === 'active') return b.status === 'confirmed' || b.status === 'pending';
                      if (bookingFilter === 'completed') return b.status === 'checked_in' || b.status === 'checked_out';
                      return b.status === 'cancelled';
                    })
                    .map(b => {
                      const roomType = roomTypes.find(r => r.id === b.room_type_id) || DEFAULT_ROOM_TYPES[0];
                      const checkInDate = new Date(b.check_in);
                      const isFuture = checkInDate.getTime() > Date.now();
                      
                      return (
                        <div key={b.id} className="glass-panel p-6 rounded-2xl border border-slate-850 flex flex-col justify-between gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono text-[10px] text-slate-500 block">Mã đơn phòng: {b.booking_ref}</span>
                              <h4 className="font-bold text-lg text-slate-200">{roomType.name}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                              b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {b.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                            <div>
                              <span>Nhận phòng:</span>
                              <p className="font-semibold text-slate-200">{b.check_in}</p>
                            </div>
                            <div>
                              <span>Trả phòng:</span>
                              <p className="font-semibold text-slate-200">{b.check_out}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Tổng thanh toán:</span>
                              <span className="font-bold text-accent text-base">{b.total_amount.toLocaleString('vi-VN')} VND</span>
                            </div>
                            
                            {isFuture && b.status !== 'cancelled' && (
                              <button 
                                onClick={() => handleCancelMyBooking(b.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-bold border border-red-900/30 transition-all cursor-pointer"
                              >
                                Hủy Đặt Phòng
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  
                  {myBookings.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 py-12">
                      Chưa có đơn đặt phòng nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin CRM & Management Panel */}
        {activeTab === 'admin' && role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <button 
                onClick={() => { setAdminSection('stats'); setSelectedCustomerForDetail(null); setSelectedRoomTypeForUnits(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${adminSection === 'stats' ? 'bg-accent text-slate-950' : 'hover:bg-slate-900'}`}
              >
                <BarChart3 className="w-5 h-5" />
                Báo Cáo &amp; Phân Tích
              </button>
              <button 
                onClick={() => { setAdminSection('rooms'); setSelectedCustomerForDetail(null); setSelectedRoomTypeForUnits(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${adminSection === 'rooms' ? 'bg-accent text-slate-950' : 'hover:bg-slate-900'}`}
              >
                <BedDouble className="w-5 h-5" />
                Quản Lý Loại Phòng
              </button>
              <button 
                onClick={() => { setAdminSection('customers'); setSelectedCustomerForDetail(null); setSelectedRoomTypeForUnits(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${adminSection === 'customers' ? 'bg-accent text-slate-950' : 'hover:bg-slate-900'}`}
              >
                <Users2 className="w-5 h-5" />
                Quản Lý Khách Hàng (CRM)
              </button>
              <button 
                onClick={() => { setAdminSection('marketing'); setSelectedCustomerForDetail(null); setSelectedRoomTypeForUnits(null); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer ${adminSection === 'marketing' ? 'bg-accent text-slate-950' : 'hover:bg-slate-900'}`}
              >
                <Ticket className="w-5 h-5" />
                Voucher &amp; Chiến Dịch
              </button>
            </div>

            <div className="lg:col-span-3">
              {adminSection === 'stats' && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold tracking-wide">Báo Cáo Khách Sạn</h3>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Doanh Thu Đơn Phòng</span>
                      <span className="text-3xl font-black text-accent">
                        {(allBookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.total_amount || 0), 0)).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Tổng Đơn Đặt Phòng</span>
                      <span className="text-3xl font-black">{allBookings.length} Đơn</span>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl space-y-2">
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Thành Viên Thân Thiết</span>
                      <span className="text-3xl font-black">{crmCustomers.length} Khách</span>
                    </div>
                  </div>

                  {/* Recharts Charts Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Line Chart */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-sm font-bold text-slate-350 mb-4 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-accent" /> Biểu đồ Doanh Thu Năm 2026</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getRevenueByMonth()} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#223" />
                            <XAxis dataKey="name" stroke="#678" fontSize={10} />
                            <YAxis stroke="#678" fontSize={10} tickFormatter={(val) => `${val / 1000000}M`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Doanh Thu" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-sm font-bold text-slate-350 mb-4 flex items-center gap-1.5"><BedDouble className="w-4 h-4 text-accent" /> Doanh Thu Phân Loại Phòng</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getRevenueByRoomType()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#223" />
                            <XAxis dataKey="name" stroke="#678" fontSize={10} />
                            <YAxis stroke="#678" fontSize={10} tickFormatter={(val) => `${val / 1000000}M`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334' }} />
                            <Legend />
                            <Bar dataKey="Doanh thu thực tế" fill="#C9A84C" />
                            <Bar dataKey="Doanh thu nền" fill="#2c3e50" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart: booking status */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-sm font-bold text-slate-350 mb-4 flex items-center gap-1.5"><PieIcon className="w-4 h-4 text-accent" /> Cơ Cấu Trạng Thái Đơn Phòng</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getBookingStatusData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getBookingStatusData().map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart: loyalty membership */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-sm font-bold text-slate-350 mb-4 flex items-center gap-1.5"><Award className="w-4 h-4 text-accent" /> Cơ Cấu Hạng Hội Viên</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getTierDistribution()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(props: any) => `${props.name} ${(props.percent ? props.percent * 100 : 0).toFixed(0)}%`}
                              dataKey="value"
                            >
                              {getTierDistribution().map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stacked Bar: loyalty points */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800 md:col-span-2">
                      <h4 className="text-sm font-bold text-slate-350 mb-4 flex items-center gap-1.5"><Award className="w-4 h-4 text-accent" /> Phân Tích Điểm Thưởng Hệ Thống</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getPointsAnalytics()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#223" />
                            <XAxis dataKey="name" stroke="#678" fontSize={10} />
                            <YAxis stroke="#678" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334' }} />
                            <Legend />
                            <Bar dataKey="Tích Lũy" fill="#C9A84C" />
                            <Bar dataKey="Sử Dụng" fill="#EF4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Booking Listing */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Lịch Sử Đặt Phòng Gần Đây</h4>
                    <div className="glass-panel overflow-hidden rounded-2xl border border-slate-800">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-850">
                            <th className="p-4">Khách Hàng</th>
                            <th className="p-4">Mã Đơn</th>
                            <th className="p-4">Ngày Đi/Về</th>
                            <th className="p-4">Doanh Thu</th>
                            <th className="p-4">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allBookings.map((b) => (
                            <tr key={b.id} className="border-b border-slate-900 hover:bg-slate-900/50">
                              <td className="p-4 font-semibold">{b.guest_name || 'Khách vãng lai'}</td>
                              <td className="p-4 font-mono text-xs">{b.booking_ref}</td>
                              <td className="p-4 text-xs text-slate-400">{b.check_in} / {b.check_out}</td>
                              <td className="p-4 font-bold text-accent">{(b.total_amount).toLocaleString('vi-VN')} VND</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  b.status === 'confirmed' ? 'bg-green-500/15 text-green-400' :
                                  b.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                                  'bg-red-500/15 text-red-400'
                                }`}>
                                  {b.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {allBookings.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có đơn đặt phòng nào trên hệ thống.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminSection === 'rooms' && !selectedRoomTypeForUnits && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold tracking-wide">Quản Lý Loại Phòng</h3>
                    <button 
                      onClick={() => {
                        setEditingRoomType(null);
                        setNewRoomTypeName('');
                        setNewRoomTypePrice(1000000);
                        setNewRoomTypeWeekendPrice(1200000);
                        setNewRoomTypeHolidayPrice(1500000);
                        setNewRoomTypeCapacity(2);
                        setNewRoomTypeDesc('');
                        setEditingRoomType({ isNew: true });
                      }}
                      className="px-4 py-2 bg-accent text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> THÊM LOẠI PHÒNG
                    </button>
                  </div>

                  {editingRoomType && (
                    <form onSubmit={handleSaveRoomType} className="glass-panel p-6 rounded-2xl space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h4 className="text-lg font-bold">{editingRoomType.isNew ? 'Thêm Loại Phòng Mới' : 'Cập Nhật Loại Phòng'}</h4>
                        <button type="button" onClick={() => setEditingRoomType(null)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Tên Loại Phòng</label>
                          <input 
                            type="text" 
                            required
                            value={newRoomTypeName}
                            onChange={(e) => setNewRoomTypeName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Sức Chứa tối đa</label>
                          <input 
                            type="number" 
                            required
                            value={newRoomTypeCapacity}
                            onChange={(e) => setNewRoomTypeCapacity(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Giá Ngày Thường T2-T5 (VND)</label>
                          <input 
                            type="number" 
                            required
                            value={newRoomTypePrice}
                            onChange={(e) => setNewRoomTypePrice(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Giá Cuối Tuần T6-CN (VND)</label>
                          <input 
                            type="number" 
                            required
                            value={newRoomTypeWeekendPrice}
                            onChange={(e) => setNewRoomTypeWeekendPrice(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Giá Ngày Lễ (+50%) (VND)</label>
                          <input 
                            type="number" 
                            required
                            value={newRoomTypeHolidayPrice}
                            onChange={(e) => setNewRoomTypeHolidayPrice(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Mô Tả</label>
                        <textarea 
                          rows={3}
                          value={newRoomTypeDesc}
                          onChange={(e) => setNewRoomTypeDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                        />
                      </div>

                      <div className="flex gap-4 justify-end">
                        <button 
                          type="button" 
                          onClick={() => setEditingRoomType(null)}
                          className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold"
                        >
                          Hủy
                        </button>
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-accent text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Lưu Lại
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Room types Table */}
                  <div className="glass-panel overflow-hidden rounded-2xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-850">
                          <th className="p-4">Tên Loại Phòng</th>
                          <th className="p-4">Sức Chứa</th>
                          <th className="p-4">Bảng Giá (Thường/Tuần/Lễ)</th>
                          <th className="p-4">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomTypes.map((type) => (
                          <tr key={type.id} className="border-b border-slate-900">
                            <td className="p-4 font-bold">{type.name}</td>
                            <td className="p-4">{type.capacity} Người</td>
                            <td className="p-4 space-y-1">
                              <span className="text-xs text-slate-350 block">Thường: <b className="text-accent">{(type.base_price || 0).toLocaleString()}</b> VND</span>
                              <span className="text-xs text-slate-350 block">Cuối tuần: <b className="text-accent">{(type.weekend_price || Math.round(type.base_price * 1.2)).toLocaleString()}</b> VND</span>
                              <span className="text-xs text-slate-350 block">Ngày lễ: <b className="text-accent">{(type.holiday_price || Math.round(type.base_price * 1.5)).toLocaleString()}</b> VND</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => setSelectedRoomTypeForUnits(type)}
                                  className="px-3 py-1 bg-slate-800 text-xs rounded hover:bg-slate-700 font-semibold"
                                >
                                  Quản lý phòng vật lý
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingRoomType(type);
                                    setNewRoomTypeName(type.name);
                                    setNewRoomTypePrice(type.base_price);
                                    setNewRoomTypeWeekendPrice(type.weekend_price || Math.round(type.base_price * 1.2));
                                    setNewRoomTypeHolidayPrice(type.holiday_price || Math.round(type.base_price * 1.5));
                                    setNewRoomTypeCapacity(type.capacity);
                                    setNewRoomTypeDesc(type.description);
                                  }}
                                  className="px-3 py-1 bg-slate-800 text-xs rounded hover:bg-slate-700 text-indigo-400 font-semibold"
                                >
                                  Sửa
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (confirm('Bạn chắc chắn muốn xóa loại phòng này cùng toàn bộ phòng vật lý trực thuộc?')) {
                                      await roomAPI.deleteRoomType(type.id);
                                      fetchRoomTypesAndRooms();
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-950/50 text-red-400 text-xs rounded hover:bg-red-900/50 font-semibold"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Physical Units (Rooms) Management Dashboard */}
              {adminSection === 'rooms' && selectedRoomTypeForUnits && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <button onClick={() => setSelectedRoomTypeForUnits(null)} className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold mb-2">
                        ← Quay lại danh sách Loại phòng
                      </button>
                      <h3 className="text-2xl font-bold tracking-wide">Quản Lý Phòng Vật Lý: {selectedRoomTypeForUnits.name}</h3>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingUnit(null);
                          setUnitRoomNumber('');
                          setUnitFloor(1);
                          setUnitStatus('available');
                          setEditingUnit({ isNew: true });
                          setShowBulkAddUnits(false);
                        }}
                        className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-700"
                      >
                        <Plus className="w-4 h-4" /> THÊM 1 PHÒNG
                      </button>
                      <button 
                        onClick={() => {
                          setShowBulkAddUnits(true);
                          setEditingUnit(null);
                        }}
                        className="px-4 py-2 bg-accent text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:brightness-105"
                      >
                        <Plus className="w-4 h-4" /> THÊM HÀNG LOẠT (BULK)
                      </button>
                    </div>
                  </div>

                  {editingUnit && (
                    <form onSubmit={handleSaveUnit} className="glass-panel p-6 rounded-2xl space-y-4 max-w-md">
                      <h4 className="font-bold border-b border-slate-800 pb-2">{editingUnit.isNew ? 'Thêm phòng vật lý mới' : 'Sửa phòng'}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Số Phòng</label>
                          <input 
                            type="text" 
                            required
                            value={unitRoomNumber}
                            onChange={(e) => setUnitRoomNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                            placeholder="Ví dụ: 106"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Tầng</label>
                          <input 
                            type="number" 
                            required
                            value={unitFloor}
                            onChange={(e) => setUnitFloor(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Trạng thái phòng</label>
                        <select 
                          value={unitStatus}
                          onChange={(e: any) => setUnitStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                        >
                          <option value="available">Sẵn sàng (Available)</option>
                          <option value="occupied">Đang có khách (Occupied)</option>
                          <option value="maintenance">Đang bảo trì (Maintenance)</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setEditingUnit(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-accent text-slate-950 rounded-xl text-xs font-bold cursor-pointer">Lưu</button>
                      </div>
                    </form>
                  )}

                  {showBulkAddUnits && (
                    <form onSubmit={handleBulkAddUnits} className="glass-panel p-6 rounded-2xl space-y-4 max-w-md border-accent/20">
                      <h4 className="font-bold border-b border-slate-850 pb-2 text-accent">Thêm Phòng Hàng Loạt (Bulk Insert)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Bắt đầu từ số</label>
                          <input 
                            type="number" 
                            required
                            value={bulkStartNum}
                            onChange={(e) => setBulkStartNum(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Kết thúc ở số</label>
                          <input 
                            type="number" 
                            required
                            value={bulkEndNum}
                            onChange={(e) => setBulkEndNum(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Tầng</label>
                        <input 
                          type="number" 
                          required
                          value={bulkFloor}
                          onChange={(e) => setBulkFloor(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowBulkAddUnits(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-accent text-slate-950 rounded-xl text-xs font-bold cursor-pointer">Khởi Tạo</button>
                      </div>
                    </form>
                  )}

                  <div className="glass-panel overflow-hidden rounded-2xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-850">
                          <th className="p-4">Số Phòng</th>
                          <th className="p-4">Số Tầng</th>
                          <th className="p-4">Trạng Thái Vật Lý</th>
                          <th className="p-4">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unitsList.map((unit) => (
                          <tr key={unit.id} className="border-b border-slate-900">
                            <td className="p-4 font-mono font-bold text-slate-200">Phòng {unit.room_number}</td>
                            <td className="p-4">Tầng {unit.floor}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                unit.status === 'available' ? 'bg-green-500/15 text-green-400' :
                                unit.status === 'occupied' ? 'bg-blue-500/15 text-blue-400' :
                                'bg-red-500/15 text-red-400'
                              }`}>
                                {unit.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingUnit(unit);
                                  setUnitRoomNumber(unit.room_number);
                                  setUnitFloor(unit.floor);
                                  setUnitStatus(unit.status);
                                  setShowBulkAddUnits(false);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded"
                              >
                                Sửa
                              </button>
                              <button 
                                onClick={() => handleDeleteUnit(unit.id)}
                                className="px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-900/40 text-xs rounded"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminSection === 'customers' && !selectedCustomerForDetail && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold tracking-wide">Quản Lý Khách Hàng (CRM)</h3>

                  {/* CRM Filter Controls */}
                  <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-4 border border-slate-850">
                    <div className="flex-grow min-w-[200px]">
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Tìm kiếm thành viên</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Tìm theo tên, email, sđt..."
                          value={crmSearchText}
                          onChange={(e) => setCrmSearchText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Lọc Hạng Thẻ</label>
                      <select 
                        value={crmTierFilter}
                        onChange={(e) => setCrmTierFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
                      >
                        <option value="All">Tất cả Hạng</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Phân Khúc CRM</label>
                      <select 
                        value={crmSegmentFilter}
                        onChange={(e) => setCrmSegmentFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-accent"
                      >
                        <option value="All">Tất cả Nhóm</option>
                        <option value="VIP">Nhóm VIP (Platinum hoặc Spend &gt; 50M)</option>
                        <option value="Regular">Nhóm Regular (Gold hoặc Nights &gt;= 5)</option>
                        <option value="At-Risk">Nhóm Có Nguy Cơ Rời Bỏ (&gt; 6 tháng không đặt phòng)</option>
                        <option value="New">Nhóm Mới (Đăng ký &lt; 30 ngày, chưa đặt phòng)</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer listing */}
                  <div className="glass-panel overflow-hidden rounded-2xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-850">
                          <th className="p-4">Thành Viên</th>
                          <th className="p-4">Hạng / Điểm Hiện Tại</th>
                          <th className="p-4">Nights / Chi Tiêu Lũy Kế</th>
                          <th className="p-4">Ghi Chú CSKH</th>
                          <th className="p-4">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((c) => (
                          <tr key={c.id} className="border-b border-slate-900 hover:bg-slate-900/30">
                            <td className="p-4">
                              <span className="font-bold block text-slate-200">{c.last_name} {c.first_name}</span>
                              <span className="text-xs text-slate-500">{c.email} • {c.phone}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold block text-accent">{c.tier}</span>
                              <span className="text-xs text-slate-400">{c.points} Điểm</span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold block">{c.total_nights || 0} đêm nghỉ</span>
                              <span className="text-xs text-slate-400">{(c.total_spend || 0).toLocaleString('vi-VN')} VND</span>
                            </td>
                            <td className="p-4 text-xs text-slate-400 italic max-w-[200px] truncate">{c.notes || 'Không có ghi chú'}</td>
                            <td className="p-4">
                              <button 
                                onClick={() => {
                                  setSelectedCustomerForDetail(c);
                                  setGuestNotesText(c.notes || '');
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
                              >
                                Xem chi tiết &amp; Tặng Điểm
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">Chưa có khách hàng đăng ký thành viên khớp với điều kiện lọc.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CRM Guest Details & Adjustments Panel */}
              {adminSection === 'customers' && selectedCustomerForDetail && (
                <div className="space-y-6">
                  <button onClick={() => setSelectedCustomerForDetail(null)} className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
                    ← Quay lại danh sách CRM Khách hàng
                  </button>

                  <div className="glass-panel p-6 rounded-3xl space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                      <div>
                        <h3 className="text-2xl font-black text-white">{selectedCustomerForDetail.last_name} {selectedCustomerForDetail.first_name}</h3>
                        <span className="text-xs text-slate-450 block">{selectedCustomerForDetail.email} • {selectedCustomerForDetail.phone}</span>
                        <span className="text-xs text-slate-500 mt-1 block">Đăng ký ngày: {new Date(selectedCustomerForDetail.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-2xl text-right">
                        <span className="text-[10px] text-accent block uppercase font-bold tracking-wider">Membership Tier</span>
                        <span className="text-lg font-black text-accent">{selectedCustomerForDetail.tier}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Notes */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-300">Ghi Chú CSKH</h4>
                        <textarea 
                          rows={3}
                          value={guestNotesText}
                          onChange={(e) => setGuestNotesText(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          placeholder="Thêm các thông tin chăm sóc khách hàng đặc biệt..."
                        />
                        <button 
                          onClick={handleSaveGuestNotes}
                          className="px-4 py-2 bg-accent text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Lưu Ghi Chú
                        </button>
                      </div>

                      {/* Manual Points Award Form */}
                      <div className="space-y-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
                        <h4 className="text-sm font-bold text-accent">Tặng / Điều Chỉnh Điểm Thưởng</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Số Điểm (Dùng dấu âm '-' để trừ)</label>
                            <input 
                              type="number" 
                              value={awardPointsAmount}
                              onChange={(e) => setAwardPointsAmount(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Lý do điều chỉnh</label>
                            <input 
                              type="text" 
                              placeholder="Ví dụ: Đền bù dịch vụ"
                              value={awardPointsDesc}
                              onChange={(e) => setAwardPointsDesc(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={handleAwardPoints}
                          className="px-4 py-2 bg-accent text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Cập Nhật Điểm
                        </button>
                      </div>
                    </div>

                    {/* Customer point history log */}
                    <div className="space-y-4 pt-4 border-t border-slate-850">
                      <h4 className="text-sm font-bold text-slate-350">Lịch sử điểm của khách</h4>
                      <div className="glass-panel overflow-hidden rounded-2xl border border-slate-850">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-850 text-slate-400">
                              <th className="p-3">Giao Dịch</th>
                              <th className="p-3">Ngày</th>
                              <th className="p-3">Thay đổi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getMockData('point_transactions')
                              .filter((t: any) => t.guest_id === selectedCustomerForDetail.id)
                              .sort((a: any, b: any) => b.id - a.id)
                              .map((t: any) => (
                                <tr key={t.id} className="border-b border-slate-950">
                                  <td className="p-3 font-semibold">{t.description}</td>
                                  <td className="p-3 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                                  <td className={`p-3 font-black ${t.points > 0 ? 'text-accent' : 'text-red-400'}`}>
                                    {t.points > 0 ? '+' : ''}{t.points}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSection === 'marketing' && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold tracking-wide">Voucher &amp; Chiến Dịch Marketing</h3>

                  {/* Marketing Automation Overview cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-2xl space-y-2 border-l-4 border-accent">
                      <span className="text-xs text-slate-400 block font-semibold">Chúc Mừng Sinh Nhật Ngày Mai</span>
                      <span className="text-3xl font-black text-slate-100">2 Khách Hàng</span>
                      <span className="text-[10px] text-slate-500 block">Tự động tặng Voucher mừng sinh nhật</span>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl space-y-2 border-l-4 border-blue-400">
                      <span className="text-xs text-slate-400 block font-semibold">Conversion Rate Chiến Dịch</span>
                      <span className="text-3xl font-black text-blue-400">12.4 %</span>
                      <span className="text-[10px] text-slate-500 block">Tỷ lệ khách quy đổi voucher</span>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl space-y-2 border-l-4 border-green-400">
                      <span className="text-xs text-slate-400 block font-semibold">Voucher Đã Phân Phối</span>
                      <span className="text-3xl font-black text-green-400">
                        {getMockData('vouchers').length} chiếc
                      </span>
                      <span className="text-[10px] text-slate-500 block">Gồm voucher đổi điểm &amp; chiến dịch</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create generic Voucher */}
                    <form onSubmit={handleCreateVoucher} className="glass-panel p-6 rounded-2xl space-y-4">
                      <h4 className="text-lg font-bold border-b border-slate-850 pb-2">Tạo Voucher Hệ Thống Mới</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Mã Voucher (Code)</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Mã viết liền, VD: SALE100"
                            value={marketingVoucherCode}
                            onChange={(e) => setMarketingVoucherCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Mức Giảm Giá (VND)</label>
                          <input 
                            type="number" 
                            required
                            value={marketingVoucherValue}
                            onChange={(e) => setMarketingVoucherValue(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Chi tiêu tối thiểu (Min spend)</label>
                          <input 
                            type="number" 
                            required
                            value={marketingVoucherMinSpend}
                            onChange={(e) => setMarketingVoucherMinSpend(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Hiệu lực Từ ngày</label>
                          <input 
                            type="date" 
                            required
                            value={marketingVoucherValidFrom}
                            onChange={(e) => setMarketingVoucherValidFrom(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Đến ngày</label>
                        <input 
                          type="date" 
                          required
                          value={marketingVoucherValidTo}
                          onChange={(e) => setMarketingVoucherValidTo(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-xs"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-2 bg-accent text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Khởi Tạo Voucher
                      </button>
                    </form>

                    {/* Distribute Voucher code to CRM Segment */}
                    <div className="glass-panel p-6 rounded-2xl space-y-6">
                      <h4 className="text-lg font-bold border-b border-slate-850 pb-2">Gửi Voucher Theo Phân Khúc CRM</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Chọn Voucher Nguồn</label>
                          <select 
                            value={distributingVoucherCode}
                            onChange={(e) => setDistributingVoucherCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          >
                            <option value="">-- Chọn mã voucher --</option>
                            {getMockData('vouchers')
                              .filter((v: any) => !v.created_by_guest_id) // generic source vouchers
                              .map((v: any) => (
                                <option key={v.id} value={v.code}>{v.code} (Giảm: {v.value.toLocaleString()} VND)</option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Gửi Đến Phân Khúc</label>
                          <select 
                            value={distributeTargetSegment}
                            onChange={(e) => setDistributeTargetSegment(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-accent text-sm"
                          >
                            <option value="All">Tất cả khách hàng</option>
                            <option value="VIP">Nhóm khách hàng VIP</option>
                            <option value="Regular">Nhóm khách hàng Thường xuyên</option>
                            <option value="At-Risk">Nhóm khách hàng có Nguy cơ rời bỏ</option>
                            <option value="New">Nhóm thành viên mới đăng ký</option>
                          </select>
                        </div>

                        <button 
                          onClick={handleDistributeVoucher}
                          className="w-full py-3 bg-accent text-slate-950 font-bold rounded-xl text-xs hover:brightness-105 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-4 h-4" /> Phát hành gửi chiến dịch
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Vouchers */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Danh Sách Voucher Đang Hoạt Động</h4>
                    <div className="glass-panel overflow-hidden rounded-2xl border border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-850">
                            <th className="p-4">Mã Code</th>
                            <th className="p-4">Giá trị giảm</th>
                            <th className="p-4">Điều kiện tối thiểu</th>
                            <th className="p-4">Hạn Hiệu Lực</th>
                            <th className="p-4">Đối Tượng Nhận</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getMockData('vouchers').map((v: any) => (
                            <tr key={v.id} className="border-b border-slate-950 hover:bg-slate-900/10">
                              <td className="p-4 font-mono font-bold text-accent">{v.code}</td>
                              <td className="p-4">{(v.value).toLocaleString('vi-VN')} VND</td>
                              <td className="p-4">{(v.min_spend).toLocaleString('vi-VN')} VND</td>
                              <td className="p-4 text-slate-400">{v.valid_from} / {v.valid_to}</td>
                              <td className="p-4">
                                {v.created_by_guest_id ? (
                                  <span className="text-[10px] text-slate-350 px-2 py-0.5 rounded bg-slate-900 border border-slate-850">
                                    Thành viên ID: {v.created_by_guest_id}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-green-400 px-2 py-0.5 rounded bg-green-950/20">
                                    Toàn Hệ Thống (Public)
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Auth Modals */}
      {authModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl space-y-6 relative">
            <button 
              onClick={() => {
                setAuthModal(null);
                resetAuthFields();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black">
                {authModal === 'login' ? 'Đăng Nhập Thành Viên' : 
                 authModal === 'register' ? 'Đăng Ký Thành Viên' : 'Quản Trị Hệ Thống'}
              </h3>
              <p className="text-slate-400 text-xs">
                {authModal === 'login' ? 'Điền thông tin tài khoản hội viên của bạn' : 
                 authModal === 'register' ? 'Đăng ký nhanh để nhận ưu đãi Hạng Silver ngay' : 'Đăng nhập trang quản trị nội bộ'}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 rounded-xl text-xs text-center">
                {authError}
              </div>
            )}

            <form onSubmit={authModal === 'register' ? handleRegister : handleLogin} className="space-y-4">
              {authModal === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tên (First Name)</label>
                      <input 
                        type="text" 
                        required
                        value={authFirstName}
                        onChange={(e) => setAuthFirstName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Họ (Last Name)</label>
                      <input 
                        type="text" 
                        required
                        value={authLastName}
                        onChange={(e) => setAuthLastName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Số điện thoại</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: 0901234567"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mã giới thiệu (Nếu có)</label>
                    <input 
                      type="text" 
                      placeholder="Mã: KS-REF-{ID}"
                      value={authReferralCode}
                      onChange={(e) => setAuthReferralCode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Địa chỉ Email</label>
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-accent text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-accent/10 hover:brightness-105 transition-all cursor-pointer"
              >
                {authModal === 'register' ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP'}
              </button>
            </form>

            <div className="text-center text-xs">
              {authModal === 'login' ? (
                <p className="text-slate-400">
                  Chưa có tài khoản hội viên?{' '}
                  <button onClick={() => setAuthModal('register')} className="text-accent hover:underline font-semibold">Đăng ký tại đây</button>
                </p>
              ) : authModal === 'register' ? (
                <p className="text-slate-400">
                  Đã có tài khoản?{' '}
                  <button onClick={() => setAuthModal('login')} className="text-accent hover:underline font-semibold">Đăng nhập</button>
                </p>
              ) : (
                <p className="text-slate-500">Đăng nhập dành riêng cho cán bộ quản lý khách sạn.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
