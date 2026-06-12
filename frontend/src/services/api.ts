import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// MOCK DATA FOR SEED FALLBACK (Allows full frontend execution even without postgres/redis running)
export const HOLIDAYS = [
  '2026-01-01', // Tết Dương Lịch
  '2026-04-30', // Giải Phóng Miền Nam
  '2026-05-01', // Quốc Tế Lao Động
  '2026-09-02', // Quốc Khánh
  '2026-12-25', // Giáng Sinh
];

// Helper to check if a date is a holiday
export const isHoliday = (dateStr: string) => HOLIDAYS.includes(dateStr);

// Helper to check if a date is a weekend (Fri, Sat, Sun)
export const isWeekend = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday
};

// Calculate detailed price breakdown night by night
export const calculatePriceDetails = (roomType: any, checkInStr: string, checkOutStr: string) => {
  if (!checkInStr || !checkOutStr) return { nights: 0, breakdown: [], total: 0 };
  
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  
  if (checkIn >= checkOut) return { nights: 0, breakdown: [], total: 0 };
  
  let nights = 0;
  let total = 0;
  const breakdown: any[] = [];
  
  let current = new Date(checkIn);
  while (current < checkOut) {
    const dateStr = current.toISOString().split('T')[0];
    let price = roomType.base_price;
    let dayType = 'Ngày thường (T2-T5)';
    
    if (isHoliday(dateStr)) {
      price = roomType.holiday_price || Math.round(roomType.base_price * 1.5);
      dayType = 'Ngày lễ (+50%)';
    } else if (isWeekend(dateStr)) {
      price = roomType.weekend_price || Math.round(roomType.base_price * 1.2);
      dayType = 'Cuối tuần T6-CN (+20%)';
    }
    
    breakdown.push({ date: dateStr, dayType, price });
    total += price;
    nights++;
    current.setDate(current.getDate() + 1);
  }
  
  return { nights, breakdown, total };
};

export const DEFAULT_ROOM_TYPES = [
  { 
    id: 1, 
    name: 'Superior', 
    description: 'Phòng ấm cúng 25m2 hướng phố, đầy đủ tiện nghi, phù hợp cho khách công tác.', 
    base_price: 1200000.00, 
    weekend_price: 1440000.00, 
    holiday_price: 1800000.00, 
    capacity: 2, 
    amenities: ["WiFi", "AC", "TV", "Minibar"], 
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600"] 
  },
  { 
    id: 2, 
    name: 'Deluxe', 
    description: 'Phòng rộng rãi 35m2 hướng biển, ban công riêng và bồn tắm thư giãn cao cấp.', 
    base_price: 1800000.00, 
    weekend_price: 2160000.00, 
    holiday_price: 2700000.00, 
    capacity: 2, 
    amenities: ["WiFi", "AC", "TV", "Minibar", "Balcony", "Bathtub", "Ocean View"], 
    images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600"] 
  },
  { 
    id: 3, 
    name: 'Suite', 
    description: 'Phòng Tổng Thống sang trọng 60m2, phòng khách riêng biệt, tiện ích đẳng cấp nhất.', 
    base_price: 3500000.00, 
    weekend_price: 4200000.00, 
    holiday_price: 5250000.00, 
    capacity: 4, 
    amenities: ["WiFi", "AC", "TV", "Minibar", "Balcony", "Bathtub", "Ocean View", "Coffee Maker", "Living Room"], 
    images: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600"] 
  }
];

export const DEFAULT_ROOMS = [
  { id: 1, room_type_id: 1, room_number: '101', floor: 1, status: 'available' },
  { id: 2, room_type_id: 1, room_number: '102', floor: 1, status: 'available' },
  { id: 3, room_type_id: 1, room_number: '103', floor: 1, status: 'available' },
  { id: 4, room_type_id: 1, room_number: '104', floor: 1, status: 'available' },
  { id: 5, room_type_id: 1, room_number: '105', floor: 1, status: 'available' },
  { id: 6, room_type_id: 2, room_number: '201', floor: 2, status: 'available' },
  { id: 7, room_type_id: 2, room_number: '202', floor: 2, status: 'available' },
  { id: 8, room_type_id: 2, room_number: '203', floor: 2, status: 'available' },
  { id: 9, room_type_id: 2, room_number: '204', floor: 2, status: 'available' },
  { id: 10, room_type_id: 3, room_number: '301', floor: 3, status: 'available' },
  { id: 11, room_type_id: 3, room_number: '302', floor: 3, status: 'available' }
];

const DEFAULT_MEMBERSHIP_TIERS = [
  { id: 1, name: 'Silver', min_nights: 0, min_spend: 0, points_multiplier: 1.0, benefits: ["Nước suối miễn phí", "WiFi tiêu chuẩn"] },
  { id: 2, name: 'Gold', min_nights: 10, min_spend: 15000000, points_multiplier: 1.5, benefits: ["Nước suối miễn phí", "WiFi tốc độ cao", "Late checkout (2 PM)", "Welcome drink"] },
  { id: 3, name: 'Platinum', min_nights: 25, min_spend: 40000000, points_multiplier: 2.0, benefits: ["Nước suối miễn phí", "WiFi tốc độ cao", "Late checkout (4 PM)", "Welcome drink", "Nâng hạng phòng khi có phòng trống", "Quyền vào Club Lounge"] }
];

// Initialize LocalStorage state with rich demo data
export const initMockDatabase = (force = false) => {
  if (force || !localStorage.getItem('db_initialized')) {
    localStorage.setItem('room_types', JSON.stringify(DEFAULT_ROOM_TYPES));
    localStorage.setItem('rooms', JSON.stringify(DEFAULT_ROOMS));
    localStorage.setItem('membership_tiers', JSON.stringify(DEFAULT_MEMBERSHIP_TIERS));

    // Pre-seed demo guest accounts
    const demoGuests = [
      {
        id: 1,
        email: 'guest@hotel.com',
        password: 'Guest@123',
        first_name: 'An',
        last_name: 'Nguyễn Văn',
        phone: '0901234567',
        created_at: '2026-01-15T08:00:00.000Z',
        tier: 'Silver',
        points: 450,
        total_nights: 3,
        total_spend: 5400000,
        notes: 'Thích phòng yên tĩnh, tầng cao.'
      },
      {
        id: 2,
        email: 'vip@hotel.com',
        password: 'Vip@1234',
        first_name: 'Bình',
        last_name: 'Trần Thị',
        phone: '0987654321',
        created_at: '2025-06-01T10:00:00.000Z',
        tier: 'Gold',
        points: 1200,
        total_nights: 12,
        total_spend: 21600000,
        notes: 'Thành viên VIP, check-in muộn.'
      }
    ];
    localStorage.setItem('guests', JSON.stringify(demoGuests));

    // Pre-seed demo bookings
    const demoBookings = [
      {
        id: 1, booking_ref: 'KS-2026-000001', guest_id: 1, room_type_id: 1, room_id: 1,
        guest_name: 'Nguyễn Văn An', guest_email: 'guest@hotel.com',
        check_in: '2026-05-10', check_out: '2026-05-12', adults: 2, children: 0,
        total_amount: 2400000, status: 'confirmed', payment_method: 'vnpay',
        payment_status: 'success', created_at: '2026-05-08T14:00:00.000Z'
      },
      {
        id: 2, booking_ref: 'KS-2026-000002', guest_id: 1, room_type_id: 2, room_id: 6,
        guest_name: 'Nguyễn Văn An', guest_email: 'guest@hotel.com',
        check_in: '2026-06-01', check_out: '2026-06-02', adults: 2, children: 1,
        total_amount: 1800000, status: 'confirmed', payment_method: 'momo',
        payment_status: 'success', created_at: '2026-05-28T09:30:00.000Z'
      },
      {
        id: 3, booking_ref: 'KS-2026-000003', guest_id: 2, room_type_id: 3, room_id: 10,
        guest_name: 'Trần Thị Bình', guest_email: 'vip@hotel.com',
        check_in: '2026-06-15', check_out: '2026-06-18', adults: 2, children: 2,
        total_amount: 10500000, status: 'confirmed', payment_method: 'vnpay',
        payment_status: 'success', created_at: '2026-06-10T16:00:00.000Z'
      }
    ];
    localStorage.setItem('bookings', JSON.stringify(demoBookings));

    // Pre-seed demo point transactions
    const demoTransactions = [
      { id: 1, guest_id: 1, type: 'bonus', points: 200, description: 'Điểm thưởng chào mừng thành viên', created_at: '2026-01-15T08:00:00.000Z' },
      { id: 2, guest_id: 1, type: 'earn', points: 240, description: 'Điểm tích lũy đặt phòng KS-2026-000001', created_at: '2026-05-12T12:00:00.000Z' },
      { id: 3, guest_id: 1, type: 'earn', points: 180, description: 'Điểm tích lũy đặt phòng KS-2026-000002', created_at: '2026-06-02T12:00:00.000Z' },
      { id: 4, guest_id: 2, type: 'bonus', points: 200, description: 'Điểm thưởng chào mừng thành viên', created_at: '2025-06-01T10:00:00.000Z' },
      { id: 5, guest_id: 2, type: 'earn', points: 315, description: 'Điểm tích lũy đặt phòng KS-2026-000003 (Hạng Gold x1.5)', created_at: '2026-06-18T12:00:00.000Z' },
      { id: 6, guest_id: 2, type: 'redeem', points: -100, description: 'Đổi điểm lấy Voucher giảm giá 100.000 VND', created_at: '2026-06-19T10:00:00.000Z' }
    ];
    localStorage.setItem('point_transactions', JSON.stringify(demoTransactions));

    // Pre-seed demo vouchers
    const demoVouchers = [
      { id: 1, code: 'WELCOME50', type: 'discount_amount', value: 50000, min_spend: 100000, valid_from: '2026-01-01', valid_to: '2026-12-31', is_active: true },
      { id: 2, code: 'SUMMER200K', type: 'discount_amount', value: 200000, min_spend: 1000000, valid_from: '2026-06-01', valid_to: '2026-08-31', is_active: true },
      { id: 3, code: 'VIP100K', type: 'discount_amount', value: 100000, min_spend: 500000, valid_from: '2026-06-19', valid_to: '2026-07-19', is_active: true, created_by_guest_id: 2 }
    ];
    localStorage.setItem('vouchers', JSON.stringify(demoVouchers));

    localStorage.setItem('db_initialized', 'true');
  }
};

// Initial run
initMockDatabase();

// Mock handlers helper
const getMockData = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setMockData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Calculate guest tier based on nights or spend
export const recalculateGuestTier = (guest: any) => {
  const nights = guest.total_nights || 0;
  const spend = guest.total_spend || 0;
  let tier = 'Silver';
  
  if (nights >= 25 || spend >= 40000000) {
    tier = 'Platinum';
  } else if (nights >= 10 || spend >= 15000000) {
    tier = 'Gold';
  }
  return tier;
};

export const authAPI = {
  register: async (data: any) => {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock registration.');
      const guests = getMockData('guests');
      if (guests.find((g: any) => g.email === data.email)) {
        throw { response: { data: { success: false, message: 'Địa chỉ email đã được đăng ký trên hệ thống.' } } };
      }
      
      const newGuestId = guests.length > 0 ? Math.max(...guests.map((g: any) => g.id)) + 1 : 1;
      let startPoints = 200; // Welcome points
      
      const newGuest: any = {
        id: newGuestId,
        email: data.email,
        password: data.password, // plain text for simple mock login matching
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        created_at: new Date().toISOString(),
        tier: 'Silver',
        points: startPoints,
        total_nights: 0,
        total_spend: 0,
        notes: ''
      };

      // Handle Referral Program points
      const transactions = getMockData('point_transactions');
      transactions.push({
        id: transactions.length + 1,
        guest_id: newGuestId,
        type: 'bonus',
        points: 200,
        description: 'Điểm thưởng chào mừng thành viên mới',
        created_at: new Date().toISOString()
      });

      if (data.referralCode) {
        // Referral code format: KS-REF-{referrerGuestId}
        const refMatch = data.referralCode.match(/^KS-REF-(\d+)$/i);
        if (refMatch) {
          const referrerId = parseInt(refMatch[1]);
          const referrerIdx = guests.findIndex((g: any) => g.id === referrerId);
          if (referrerIdx !== -1) {
            // Reward referrer: +500 points
            guests[referrerIdx].points = (guests[referrerIdx].points || 0) + 500;
            guests[referrerIdx].tier = recalculateGuestTier(guests[referrerIdx]);
            
            transactions.push({
              id: transactions.length + 1,
              guest_id: referrerId,
              type: 'bonus',
              points: 500,
              description: `Điểm thưởng giới thiệu thành viên mới (${data.email})`,
              created_at: new Date().toISOString()
            });

            // Reward referee (new guest): +200 points
            newGuest.points += 200;
            transactions.push({
              id: transactions.length + 1,
              guest_id: newGuestId,
              type: 'bonus',
              points: 200,
              description: `Điểm thưởng được giới thiệu bởi thành viên KS-REF-${referrerId}`,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      guests.push(newGuest);
      setMockData('guests', guests);
      setMockData('point_transactions', transactions);

      return { success: true, data: newGuest, message: 'Mock registration successful' };
    }
  },

  login: async (data: any) => {
    try {
      const response = await api.post('/auth/login', data);
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.guest));
      localStorage.setItem('role', 'guest');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock login.');
      const guests = getMockData('guests');
      const guest = guests.find((g: any) => g.email === data.email && g.password === data.password);
      if (!guest) {
        throw { response: { data: { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' } } };
      }
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      
      const userPayload = {
        id: guest.id,
        email: guest.email,
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone,
        tier: guest.tier || 'Silver',
        points: guest.points || 0,
        totalNights: guest.total_nights || 0,
        totalSpend: guest.total_spend || 0,
        notes: guest.notes || ''
      };
      
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('role', 'guest');
      return { success: true, data: { guest: userPayload }, message: 'Mock login successful' };
    }
  },

  loginAdmin: async (data: any) => {
    try {
      const response = await api.post('/auth/admin/login', data);
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.admin));
      localStorage.setItem('role', 'admin');
      return response.data;
    } catch (err) {
      if (data.email === 'admin@hotel.com' && data.password === 'Admin@123') {
        localStorage.setItem('accessToken', 'mock-admin-token');
        localStorage.setItem('user', JSON.stringify({ email: 'admin@hotel.com', firstName: 'Hệ Thống', lastName: 'Quản Trị viên' }));
        localStorage.setItem('role', 'admin');
        return { success: true, message: 'Mock admin login successful' };
      }
      throw { response: { data: { success: false, message: 'Tài khoản hoặc mật khẩu quản trị không đúng.' } } };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.warn('Mock logout.');
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    return { success: true };
  }
};

export const roomAPI = {
  getRoomTypes: async () => {
    return getMockData('room_types');
  },
  saveRoomType: async (roomType: any) => {
    const roomTypes = getMockData('room_types');
    if (roomType.id) {
      const idx = roomTypes.findIndex((r: any) => r.id === roomType.id);
      roomTypes[idx] = roomType;
    } else {
      roomType.id = roomTypes.length > 0 ? Math.max(...roomTypes.map((r: any) => r.id)) + 1 : 1;
      roomTypes.push(roomType);
    }
    setMockData('room_types', roomTypes);
    return { success: true };
  },
  deleteRoomType: async (id: number) => {
    let roomTypes = getMockData('room_types');
    roomTypes = roomTypes.filter((r: any) => r.id !== id);
    setMockData('room_types', roomTypes);

    // Also remove physical rooms associated
    let rooms = getMockData('rooms');
    rooms = rooms.filter((r: any) => r.room_type_id !== id);
    setMockData('rooms', rooms);
    
    return { success: true };
  },
  getUnits: async () => {
    return getMockData('rooms');
  },
  saveUnit: async (unit: any) => {
    const rooms = getMockData('rooms');
    if (unit.id) {
      const idx = rooms.findIndex((r: any) => r.id === unit.id);
      rooms[idx] = unit;
    } else {
      unit.id = rooms.length > 0 ? Math.max(...rooms.map((r: any) => r.id)) + 1 : 1;
      rooms.push(unit);
    }
    setMockData('rooms', rooms);
    return { success: true };
  },
  deleteUnit: async (id: number) => {
    let rooms = getMockData('rooms');
    rooms = rooms.filter((r: any) => r.id !== id);
    setMockData('rooms', rooms);
    return { success: true };
  },
  bulkAddUnits: async (roomTypeId: number, startNum: number, endNum: number, floor: number) => {
    const rooms = getMockData('rooms');
    let nextId = rooms.length > 0 ? Math.max(...rooms.map((r: any) => r.id)) + 1 : 1;
    
    for (let i = startNum; i <= endNum; i++) {
      const roomNumber = String(i);
      // Avoid duplicate room number
      if (!rooms.find((r: any) => r.room_number === roomNumber)) {
        rooms.push({
          id: nextId++,
          room_type_id: roomTypeId,
          room_number: roomNumber,
          floor: floor,
          status: 'available'
        });
      }
    }
    setMockData('rooms', rooms);
    return { success: true };
  }
};

export const bookingAPI = {
  searchRooms: async (searchParams: any) => {
    const roomTypes = getMockData('room_types');
    const rooms = getMockData('rooms');
    const bookings = getMockData('bookings');
    const totalGuests = (searchParams.adults || 1) + (searchParams.children || 0);

    // Filter by capacity
    const eligibleTypes = roomTypes.filter((type: any) => type.capacity >= totalGuests);

    // Check availability overlaps for each type
    return eligibleTypes.map((type: any) => {
      const roomsOfType = rooms.filter((r: any) => r.room_type_id === type.id);

      // Bookings occupying this room type during the dates
      const occupiedRoomIds = bookings
        .filter((b: any) => {
          if (b.room_type_id !== type.id) return false;
          if (b.status !== 'confirmed' && b.status !== 'checked_in') return false;

          const bIn = b.check_in;
          const bOut = b.check_out;
          const qIn = searchParams.checkIn;
          const qOut = searchParams.checkOut;

          // Overlap condition: queryIn < bookOut && queryOut > bookIn
          return qIn < bOut && qOut > bIn;
        })
        .map((b: any) => b.room_id);

      const availableRooms = roomsOfType.filter((r: any) => !occupiedRoomIds.includes(r.id) && r.status === 'available');
      const roomsLeft = availableRooms.length;

      return {
        ...type,
        roomsLeft,
        available: roomsLeft > 0,
        availableRooms: availableRooms
      };
    });
  },

  createBooking: async (data: any) => {
    const bookings = getMockData('bookings');
    
    // Assign a physical room that is available
    const searchRes = await bookingAPI.searchRooms({
      checkIn: data.check_in,
      checkOut: data.check_out,
      adults: data.adults,
      children: data.children
    });
    
    const matchedType = searchRes.find((t: any) => t.id === data.room_type_id);
    if (!matchedType || matchedType.roomsLeft <= 0) {
      throw new Error('Loại phòng này đã hết phòng trống trong khoảng thời gian đã chọn.');
    }
    
    const assignedRoom = matchedType.availableRooms[0];
    
    const newBooking = {
      ...data,
      id: bookings.length > 0 ? Math.max(...bookings.map((b: any) => b.id)) + 1 : 1,
      booking_ref: 'KS-2026-' + String(bookings.length + 1).padStart(6, '0'),
      room_id: assignedRoom.id,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    setMockData('bookings', bookings);
    return { success: true, data: newBooking };
  },

  confirmBooking: async (bookingId: number, paymentMethod: string) => {
    const bookings = getMockData('bookings');
    const idx = bookings.findIndex((b: any) => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].status = 'confirmed';
      bookings[idx].payment_method = paymentMethod;
      bookings[idx].payment_status = 'success';
      setMockData('bookings', bookings);

      // Award points if guest is logged in
      const guestUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (guestUser && bookings[idx].guest_id === guestUser.id) {
        const amount = bookings[idx].total_amount || 0;
        const multiplier = guestUser.tier === 'Platinum' ? 2.0 : guestUser.tier === 'Gold' ? 1.5 : 1.0;
        const pointsEarned = Math.floor(amount / 100000) * multiplier;

        const guests = getMockData('guests');
        const gIdx = guests.findIndex((g: any) => g.id === guestUser.id);
        if (gIdx !== -1) {
          guests[gIdx].points = (guests[gIdx].points || 0) + pointsEarned;
          // Calculate stay duration
          const checkIn = new Date(bookings[idx].check_in);
          const checkOut = new Date(bookings[idx].check_out);
          const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
          
          guests[gIdx].total_nights = (guests[gIdx].total_nights || 0) + nights;
          guests[gIdx].total_spend = (guests[gIdx].total_spend || 0) + amount;

          // Upgrade Tier logic
          guests[gIdx].tier = recalculateGuestTier(guests[gIdx]);

          setMockData('guests', guests);
          
          // Sync current logged in user
          localStorage.setItem('user', JSON.stringify({
            ...guestUser,
            points: guests[gIdx].points,
            tier: guests[gIdx].tier,
            totalNights: guests[gIdx].total_nights,
            totalSpend: guests[gIdx].total_spend
          }));
        }

        // Add transaction log
        const transactions = getMockData('point_transactions');
        transactions.push({
          id: transactions.length > 0 ? Math.max(...transactions.map((t: any) => t.id)) + 1 : 1,
          guest_id: guestUser.id,
          type: 'earn',
          points: pointsEarned,
          description: `Tích lũy từ đặt phòng ${bookings[idx].booking_ref}`,
          created_at: new Date().toISOString()
        });
        setMockData('point_transactions', transactions);
      }
    }
    return { success: true };
  },

  cancelBooking: async (bookingId: number) => {
    const bookings = getMockData('bookings');
    const idx = bookings.findIndex((b: any) => b.id === bookingId);
    if (idx === -1) throw new Error('Không tìm thấy booking.');
    
    const booking = bookings[idx];
    if (booking.status === 'cancelled') throw new Error('Đơn phòng đã hủy trước đó.');

    bookings[idx].status = 'cancelled';
    bookings[idx].payment_status = 'refunded';
    setMockData('bookings', bookings);

    // Deduct points earned if guest was logged in and paid
    if (booking.guest_id) {
      const guests = getMockData('guests');
      const gIdx = guests.findIndex((g: any) => g.id === booking.guest_id);
      if (gIdx !== -1) {
        const transactions = getMockData('point_transactions');
        const earnTxn = transactions.find((t: any) => t.guest_id === booking.guest_id && t.description.includes(booking.booking_ref));
        
        let pointsToDeduct = 0;
        if (earnTxn) {
          pointsToDeduct = Math.abs(earnTxn.points);
          // Insert a cancellation transaction to show point deduction
          transactions.push({
            id: transactions.length > 0 ? Math.max(...transactions.map((t: any) => t.id)) + 1 : 1,
            guest_id: booking.guest_id,
            type: 'redeem',
            points: -pointsToDeduct,
            description: `Khấu trừ hủy đặt phòng ${booking.booking_ref}`,
            created_at: new Date().toISOString()
          });
          setMockData('point_transactions', transactions);
        }

        // Refund policy logic (hủy trước 24h hoàn 100%, trong 24h hoàn 50%)
        const checkInTime = new Date(booking.check_in + 'T14:00:00').getTime();
        const now = Date.now();
        const hrsDiff = (checkInTime - now) / (1000 * 60 * 60);
        let refundPercent = 1.0;
        let refundReason = 'Hoàn tiền 100% (Hủy trước 24 giờ)';

        if (hrsDiff <= 0) {
          refundPercent = 0;
          refundReason = 'Không được hoàn tiền (Hủy sau giờ Check-In)';
        } else if (hrsDiff < 24) {
          refundPercent = 0.5;
          refundReason = 'Hoàn tiền 50% (Hủy trong vòng 24 giờ)';
        }

        const refundAmount = Math.round(booking.total_amount * refundPercent);

        const checkInDate = new Date(booking.check_in);
        const checkOutDate = new Date(booking.check_out);
        const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

        guests[gIdx].points = Math.max(0, (guests[gIdx].points || 0) - pointsToDeduct);
        guests[gIdx].total_nights = Math.max(0, (guests[gIdx].total_nights || 0) - nights);
        guests[gIdx].total_spend = Math.max(0, (guests[gIdx].total_spend || 0) - booking.total_amount + (booking.total_amount - refundAmount));
        
        guests[gIdx].tier = recalculateGuestTier(guests[gIdx]);
        setMockData('guests', guests);

        // Sync if current user
        const guestUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (guestUser && guestUser.id === booking.guest_id) {
          localStorage.setItem('user', JSON.stringify({
            ...guestUser,
            points: guests[gIdx].points,
            tier: guests[gIdx].tier,
            totalNights: guests[gIdx].total_nights,
            totalSpend: guests[gIdx].total_spend
          }));
        }

        return { 
          success: true, 
          message: `Hủy đơn phòng thành công! ${refundReason}. Số tiền hoàn: ${refundAmount.toLocaleString('vi-VN')} VND.` 
        };
      }
    }
    return { success: true, message: 'Hủy đơn phòng thành công!' };
  },

  getBookings: async () => {
    return getMockData('bookings');
  }
};

export const loyaltyAPI = {
  getHistory: async () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return [];
    const transactions = getMockData('point_transactions');
    return transactions.filter((t: any) => t.guest_id === user.id).sort((a: any, b: any) => b.id - a.id);
  },
  redeemVoucher: async (points: number, amount: number) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.points < points) {
      throw new Error('Số điểm thưởng hiện tại không đủ để thực hiện đổi voucher.');
    }
    
    // Deduct points
    const guests = getMockData('guests');
    const gIdx = guests.findIndex((g: any) => g.id === user.id);
    if (gIdx !== -1) {
      guests[gIdx].points -= points;
      setMockData('guests', guests);
      
      localStorage.setItem('user', JSON.stringify({
        ...user,
        points: guests[gIdx].points
      }));
    }

    const transactions = getMockData('point_transactions');
    transactions.push({
      id: transactions.length > 0 ? Math.max(...transactions.map((t: any) => t.id)) + 1 : 1,
      guest_id: user.id,
      type: 'redeem',
      points: -points,
      description: `Đổi điểm lấy Voucher giảm giá ${amount.toLocaleString('vi-VN')} VND`,
      created_at: new Date().toISOString()
    });
    setMockData('point_transactions', transactions);

    // Create a voucher
    const vouchers = getMockData('vouchers');
    const code = 'VOUCH' + Math.random().toString(36).substring(2, 6).toUpperCase() + String(amount / 1000);
    const newVoucher = {
      id: vouchers.length > 0 ? Math.max(...vouchers.map((v: any) => v.id)) + 1 : 1,
      code,
      type: 'discount_amount',
      value: amount,
      min_spend: amount * 2,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      created_by_guest_id: user.id
    };
    vouchers.push(newVoucher);
    setMockData('vouchers', vouchers);

    return { success: true, voucher: newVoucher };
  },
  getVouchers: async () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const vouchers = getMockData('vouchers');
    if (!user) return vouchers.filter((v: any) => !v.created_by_guest_id);
    return vouchers.filter((v: any) => !v.created_by_guest_id || v.created_by_guest_id === user.id);
  }
};

export const crmAPI = {
  getCustomers: async () => {
    return getMockData('guests');
  },
  saveNotes: async (guestId: number, notes: string) => {
    const guests = getMockData('guests');
    const idx = guests.findIndex((g: any) => g.id === guestId);
    if (idx !== -1) {
      guests[idx].notes = notes;
      setMockData('guests', guests);
    }
    return { success: true };
  },
  awardPoints: async (guestId: number, points: number, description: string) => {
    const guests = getMockData('guests');
    const idx = guests.findIndex((g: any) => g.id === guestId);
    if (idx !== -1) {
      guests[idx].points = Math.max(0, (guests[idx].points || 0) + points);
      guests[idx].tier = recalculateGuestTier(guests[idx]);
      setMockData('guests', guests);

      // Log transaction
      const transactions = getMockData('point_transactions');
      transactions.push({
        id: transactions.length > 0 ? Math.max(...transactions.map((t: any) => t.id)) + 1 : 1,
        guest_id: guestId,
        type: points > 0 ? 'bonus' : 'redeem',
        points: points,
        description: description || (points > 0 ? 'Admin cộng điểm thủ công' : 'Admin trừ điểm thủ công'),
        created_at: new Date().toISOString()
      });
      setMockData('point_transactions', transactions);

      // Sync if current logged in guest is edited
      const guestUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (guestUser && guestUser.id === guestId) {
        localStorage.setItem('user', JSON.stringify({
          ...guestUser,
          points: guests[idx].points,
          tier: guests[idx].tier
        }));
      }
    }
    return { success: true };
  },
  createVoucherBulk: async (voucherData: any) => {
    const vouchers = getMockData('vouchers');
    const newVoucher = {
      id: vouchers.length > 0 ? Math.max(...vouchers.map((v: any) => v.id)) + 1 : 1,
      code: voucherData.code.toUpperCase(),
      type: 'discount_amount',
      value: Number(voucherData.value),
      min_spend: Number(voucherData.minSpend),
      valid_from: voucherData.validFrom,
      valid_to: voucherData.validTo,
      is_active: true
    };
    vouchers.push(newVoucher);
    setMockData('vouchers', vouchers);
    return { success: true };
  },
  distributeVoucherToSegment: async (voucherCode: string, segment: string) => {
    const guests = getMockData('guests');
    const vouchers = getMockData('vouchers');
    const targetVoucherTemplate = vouchers.find((v: any) => v.code === voucherCode);
    if (!targetVoucherTemplate) throw new Error('Không tìm thấy voucher nguồn.');

    // Filter guests in segment
    const targetGuests = guests.filter((g: any) => {
      if (segment === 'All') return true;
      if (segment === 'VIP') return g.tier === 'Platinum' || g.total_spend >= 50000000;
      if (segment === 'Regular') return g.tier === 'Gold' || g.total_nights >= 5;
      if (segment === 'At-Risk') {
        const bookings = getMockData('bookings').filter((b: any) => b.guest_id === g.id);
        if (bookings.length === 0) return false;
        const lastBookingTime = Math.max(...bookings.map((b: any) => new Date(b.created_at).getTime()));
        const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
        return lastBookingTime < sixMonthsAgo;
      }
      if (segment === 'New') {
        const registerTime = new Date(g.created_at).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const bookings = getMockData('bookings').filter((b: any) => b.guest_id === g.id);
        return registerTime > thirtyDaysAgo && bookings.length === 0;
      }
      return false;
    });

    // Bulk distribute
    let nextId = vouchers.length > 0 ? Math.max(...vouchers.map((v: any) => v.id)) + 1 : 1;
    targetGuests.forEach((g: any) => {
      // Create clone voucher code for specific guest
      const newCode = `${targetVoucherTemplate.code}-${g.id}`;
      // Verify duplicate distribution
      if (!vouchers.find((v: any) => v.code === newCode)) {
        vouchers.push({
          ...targetVoucherTemplate,
          id: nextId++,
          code: newCode,
          created_by_guest_id: g.id
        });
      }
    });

    setMockData('vouchers', vouchers);
    return { success: true, count: targetGuests.length };
  }
};
