export interface Prize {
  id: string;
  name: string;
  sub: string;
  stars: 1 | 2 | 3 | 4 | 5 | 6;
  rarity: 0 | 1 | 2 | 3 | 4 | 5; // 0: 1 Sao -> 5: 6 Sao
  iconName: string;
  quip: string;
  weight: number; // Trọng số xác suất trúng (weight = 0 là quà ảo teaser marketing)
  isTeaser?: boolean; // Quà ảo giác marketing, không bao giờ trúng
  imageUrl?: string;
}

export const TIER_COLORS = [
  '#38bdf8', // 0: 1 Sao (Băng Tuyết Lam - Bánh Kẹo)
  '#2563eb', // 1: 2 Sao (Đại Dương Lam - Sticker)
  '#8b5cf6', // 2: 3 Sao (Tử Quang Ma Pháp - Bút Bi)
  '#ec4899', // 3: 4 Sao (Tinh Linh Hồng Ngọc - Giấy Note)
  '#ef4444', // 4: 5 Sao (Hỏa Long Xích Hồng - Móc Khóa Mica)
  '#ffd700', // 5: 6 Sao (Kim Quang Thần Thánh - Tiền Mặt Jackpot Duy Nhất)
] as const;

export const TIER_LABELS = [
  '1 SAO - PHỔ THÔNG',
  '2 SAO - TIÊU CHUẨN',
  '3 SAO - ĐẶC BIỆT',
  '4 SAO - CAO CẤP',
  '5 SAO - SIÊU PHẨM',
  '6 SAO - JACKPOT ĐỘC BẢN',
] as const;

export const TIER_NAMES = [
  '1 Sao',
  '2 Sao',
  '3 Sao',
  '4 Sao',
  '5 Sao',
  '6 Sao',
] as const;

export const PRIZES: Prize[] = [
  // ==========================================
  // PHẦN THƯỞNG THỰC TẾ (CÓ THỂ QUAY TRÚNG)
  // Chỉ duy nhất phần thưởng 6 Sao là có tiền mặt
  // Tỉ lệ tự nhiên, cân bằng để chơi bền cả ngày hội
  // ==========================================

  // --- BẬC 1 SAO: BÁNH KẸO (~46% - Quà ngọt ngào dồi dào đón bạn mới) ---
  {
    id: 'star-1-candy',
    name: 'Phần Thưởng 1 Sao',
    sub: 'Kẹo Mút Trái Cây & Bánh Ngọt Tân Sinh Viên',
    stars: 1,
    rarity: 0,
    iconName: 'Candy',
    quip: 'Ngọt ngào như dòng code chạy một phát pass test!',
    weight: 230,
  },
  {
    id: 'star-1-snack',
    name: 'Phần Thưởng 1 Sao',
    sub: 'Gói Bánh Snack Giòn Tan Nạp Năng Lượng',
    stars: 1,
    rarity: 0,
    iconName: 'Cookie',
    quip: 'Ăn một miếng snack, nạp đầy mana khám phá toàn bộ Booth CLB!',
    weight: 230,
  },

  // --- BẬC 2 SAO: STICKER (~30% - Cực hot cho sinh viên dán laptop, điện thoại) ---
  {
    id: 'star-2-sticker-it',
    name: 'Phần Thưởng 2 Sao',
    sub: 'Set Sticker IT & Logo CLB Chống Nước',
    stars: 2,
    rarity: 1,
    iconName: 'Code',
    quip: 'Dán nắp laptop tăng ngay 200% phong độ dân IT Ngoại Ngữ.',
    weight: 150,
  },
  {
    id: 'star-2-sticker-holo',
    name: 'Phần Thưởng 2 Sao',
    sub: 'Sticker Hologram Bảy Màu Lấp Lánh Độc Quyền',
    stars: 2,
    rarity: 1,
    iconName: 'Sparkles',
    quip: 'Lấp lánh ánh kim ma thuật, chống trầy xước góc học tập.',
    weight: 150,
  },

  // --- BẬC 3 SAO: BÚT BI (~15% - Hữu ích cho việc học tập) ---
  {
    id: 'star-3-pen',
    name: 'Phần Thưởng 3 Sao',
    sub: 'Bút Bi Ký Tên & Vũ Khí Điểm Danh ULIS IT',
    stars: 3,
    rarity: 2,
    iconName: 'PenTool',
    quip: 'Bút thi cuối kỳ không bao giờ tắc mực, trừ khi hết chữ!',
    weight: 150,
  },

  // --- BẬC 4 SAO: GIẤY NOTE (~6.5% - Giấy ghi chú deadline) ---
  {
    id: 'star-4-note',
    name: 'Phần Thưởng 4 Sao',
    sub: 'Tập Giấy Note Ghi Chú Deadline & Kế Hoạch',
    stars: 4,
    rarity: 3,
    iconName: 'BookOpen',
    quip: 'Ghi lại mục tiêu học tập và lịch hẹn của hội pháp sư công nghệ.',
    weight: 65,
  },

  // --- BẬC 5 SAO: MÓC KHÓA MICA (~2.4% - Quà lưu niệm độc quyền có hạn) ---
  {
    id: 'star-5-keychain',
    name: 'Phần Thưởng 5 Sao',
    sub: 'Móc Khóa Mica ULIS IT Bản Kỷ Niệm Giới Hạn',
    stars: 5,
    rarity: 4,
    iconName: 'Key',
    quip: 'Treo chìa khóa hay balo đều chuẩn nhận diện hội đồng môn!',
    weight: 24,
  },

  // --- BẬC 6 SAO: TIỀN MẶT JACKPOT DUY NHẤT (~0.1% - DUY NHẤT 1 NGƯỜI TRÚNG CẢ NGÀY HỘI) ---
  {
    id: 'star-6-cash-jackpot',
    name: 'Phần Thưởng 6 Sao',
    sub: 'ĐẠI LÌ XÌ TIỀN MẶT JACKPOT TỐI THƯỢNG ĐỘC BẢN',
    stars: 6,
    rarity: 5,
    iconName: 'Crown',
    quip: 'Nổ hũ giải thưởng TIỀN MẶT tối thượng duy nhất của Club Day 2026! Cả hội trường chúc mừng bạn!',
    weight: 1, // Duy nhất 1 người trúng trong cả ngày, sau đó tự động xóa bỏ khỏi pool
  },

  // ==========================================
  // PHẦN THƯỞNG ẢO GIÁC MARKETING (TEASER ONLY)
  // Xuất hiện trên vòng xoay kích thích thị giác, KHÔNG BAO GIỜ TRÚNG (weight = 0)
  // ==========================================
  {
    id: 'teaser-mech-keyboard',
    name: 'Phần Thưởng 6 Sao',
    sub: 'Bàn Phím Cơ Custom RGB Không Dây Huyền Thoại',
    stars: 6,
    rarity: 5,
    iconName: 'Flame',
    quip: 'Bàn phím cơ ma đạo cực phẩm!',
    weight: 0,
    isTeaser: true,
  },
  {
    id: 'teaser-wireless-headphone',
    name: 'Phần Thưởng 5 Sao',
    sub: 'Tai Nghe Gaming Không Dây Chống Ồn Cao Cấp',
    stars: 5,
    rarity: 4,
    iconName: 'Zap',
    quip: 'Âm thanh vòm ma thuật cực đỉnh!',
    weight: 0,
    isTeaser: true,
  },
  {
    id: 'teaser-bomber-jacket',
    name: 'Phần Thưởng 5 Sao',
    sub: 'Áo Khoác Bomber ULIS IT Limited Edition',
    stars: 5,
    rarity: 4,
    iconName: 'Shirt',
    quip: 'Áo khoác hội viên danh dự của CLB!',
    weight: 0,
    isTeaser: true,
  },
  {
    id: 'teaser-thermos-gold',
    name: 'Phần Thưởng 4 Sao',
    sub: 'Bình Giữ Nhiệt Khắc Laser Logo Mạ Vàng',
    stars: 4,
    rarity: 3,
    iconName: 'GlassWater',
    quip: 'Sang trọng và trường tồn cùng thời gian!',
    weight: 0,
    isTeaser: true,
  },
  {
    id: 'teaser-dev-course',
    name: 'Phần Thưởng 4 Sao',
    sub: 'Học Bổng Khóa Lập Trình Chuyên Sâu Quốc Tế',
    stars: 4,
    rarity: 3,
    iconName: 'Award',
    quip: 'Tấm vé vàng chinh phục công nghệ!',
    weight: 0,
    isTeaser: true,
  },
];
