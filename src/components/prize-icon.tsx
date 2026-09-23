import React from 'react';
import {
  Candy,
  Cookie,
  Code,
  PenTool,
  Smile,
  Sparkles,
  Key,
  CircleDot,
  Coffee,
  BookOpen,
  GlassWater,
  Award,
  Shirt,
  Briefcase,
  Banknote,
  Crown,
  Flame,
  Gift,
  Zap,
  LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Candy,
  Cookie,
  Code,
  PenTool,
  Smile,
  Sparkles,
  Key,
  CircleDot,
  Coffee,
  BookOpen,
  GlassWater,
  Award,
  Shirt,
  Briefcase,
  Banknote,
  Crown,
  Flame,
  Gift,
  Zap,
};

interface PrizeIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export function PrizeIcon({ name, size = 48, className, color }: PrizeIconProps) {
  const IconComponent = ICON_MAP[name] || Gift;
  return <IconComponent size={size} className={className} color={color} />;
}

/**
 * Ngôi sao Ma Pháp cách điệu phong cách Cổ Tích / Fairy Tail (Celestial Guild Star)
 * Thiết kế 4 cánh nhọn chính vươn dài, 4 cánh phụ, vòng tròn ma pháp cổ ngữ và lõi tinh thạch
 */
export function CelestialStar({
  size = 16,
  className = '',
  color = '#f59e0b',
  glow = true,
}: {
  size?: number;
  className?: string;
  color?: string;
  glow?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 transition-transform ${className}`}
      style={{
        filter: glow ? `drop-shadow(0 0 ${Math.max(2, size / 3)}px ${color}cc)` : undefined,
      }}
    >
      <defs>
        <radialGradient id={`starGrad-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>

      {/* Vòng tròn cổ ngữ ma thuật ngoài cùng */}
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="1.5 1.5"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="0.6" opacity="0.4" />

      {/* 4 tia phụ nhỏ hướng chéo */}
      <path
        d="M12 12 L15.5 8.5 M12 12 L15.5 15.5 M12 12 L8.5 15.5 M12 12 L8.5 8.5"
        stroke={color}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Ngôi sao 4 cánh ma pháp chính vươn dài kiểu Fairy Tail */}
      <path
        d="M12 1 
           C12.4 7.2 13.5 10.5 23 12 
           C13.5 13.5 12.4 16.8 12 23 
           C11.6 16.8 10.5 13.5 1 12 
           C10.5 10.5 11.6 7.2 12 1 Z"
        fill={`url(#starGrad-${color})`}
      />

      {/* Lõi Tinh Thạch ma thuật trung tâm */}
      <circle cx="12" cy="12" r="2.2" fill="#ffffff" />
      <circle cx="12" cy="12" r="1.2" fill={color} />
    </svg>
  );
}

/**
 * Hàng hiển thị số lượng sao ma thuật phong cách Fairy Tail
 */
export function StarRating({
  count,
  size = 14,
  className = '',
  color = '#fbbf24',
}: {
  count: number;
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`inline-flex items-center justify-center gap-1 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CelestialStar
          key={i}
          size={size}
          color={color}
          className="hover:scale-125 transition-transform"
        />
      ))}
    </div>
  );
}

/**
 * Huy hiệu Ma Trận Hội Pháp Sư (Fairy Tail Guild Magic Crest) cho thẻ quà
 */
export function MagicGuildCrest({
  stars,
  color,
  size = 54,
}: {
  stars: number;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Vòng ma trận quay chậm phía sau */}
      <svg
        className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite]"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.35 }}
      >
        <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="1.5" strokeDasharray="3 4" />
        <circle cx="50" cy="50" r="38" stroke={color} strokeWidth="1" />
        {/* Hình bát giác / đa giác ma pháp cổ */}
        <polygon
          points="50,14 75,25 86,50 75,75 50,86 25,75 14,50 25,25"
          stroke={color}
          strokeWidth="0.8"
        />
      </svg>

      {/* Ngôi sao ma pháp chủ đạo ở trung tâm */}
      <CelestialStar size={size * 0.65} color={color} glow />

      {/* Số sao nhỏ nổi ở góc dưới */}
      <div
        className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold font-mono border"
        style={{
          backgroundColor: '#0a1426',
          borderColor: color,
          color,
          boxShadow: `0 0 8px ${color}88`,
        }}
      >
        {stars}★
      </div>
    </div>
  );
}
