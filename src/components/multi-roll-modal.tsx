'use client';

import React, { useEffect, useState } from 'react';
import { Prize, TIER_COLORS, TIER_LABELS } from '@/lib/prizes';
import { PrizeIcon, StarRating, MagicGuildCrest, CelestialStar } from '@/components/prize-icon';
import { fireConfetti } from '@/lib/confetti';
import { Sparkles, Trophy, RotateCcw, X, Crown } from 'lucide-react';

interface MultiRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  onRollAgain: () => void;
  isRollingAgain?: boolean;
}

export function MultiRollModal({
  isOpen,
  onClose,
  prizes,
  onRollAgain,
  isRollingAgain,
}: MultiRollModalProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  // Staggered reveal animation
  useEffect(() => {
    if (!isOpen || prizes.length === 0) {
      setRevealedCount(0);
      return;
    }

    setRevealedCount(0);

    // Kiểm tra xem có quà 5 sao hoặc 6 sao không để bắn pháo hoa
    const hasJackpot = prizes.some(p => p.stars >= 5);
    if (hasJackpot) {
      setTimeout(() => {
        fireConfetti(4500);
      }, 700);
    }

    // Lật từng thẻ một cách nhịp nhàng
    const interval = setInterval(() => {
      setRevealedCount(prev => {
        if (prev >= prizes.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 110);

    return () => clearInterval(interval);
  }, [isOpen, prizes]);

  if (!isOpen || prizes.length === 0) return null;

  const highestTier = Math.max(...prizes.map(p => p.rarity));
  const highestStar = Math.max(...prizes.map(p => p.stars));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070d19]/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-[#0f1d38] border border-[#223C77] rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Glow bar based on highest rarity */}
        <div
          className="h-1.5 w-full transition-all duration-700"
          style={{
            backgroundColor: TIER_COLORS[highestTier],
            boxShadow: `0 0 24px ${TIER_COLORS[highestTier]}`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#223C77]/60 bg-[#0c172e]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg"
              style={{
                backgroundColor: `${TIER_COLORS[highestTier]}25`,
                borderColor: `${TIER_COLORS[highestTier]}66`,
                color: TIER_COLORS[highestTier],
              }}
            >
              {highestStar >= 5 ? <Crown size={26} /> : <CelestialStar size={24} color={TIER_COLORS[highestTier]} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white tracking-wide">
                  KẾT QUẢ QUAY X10 (10 RƯƠNG)
                </h3>
                {highestStar === 6 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/60 animate-pulse">
                    ⭐ NỔ HŨ 6 SAO TIỀN MẶT ĐỘC BẢN!
                  </span>
                ) : highestStar === 5 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-400/60">
                    SIÊU PHẨM 5 SAO TIỀN MẶT!
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-400">
                CLB Tin Học ULIS - Hãy đưa màn hình này cho BTC tại quầy để nhận quà tương ứng số sao
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 10 Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {prizes.map((prize, idx) => {
              const isRevealed = idx < revealedCount;
              const isHighTier = prize.stars >= 4;
              const isJackpot = prize.stars === 6;
              const color = TIER_COLORS[prize.rarity];

              return (
                <div
                  key={`${prize.id}-${idx}`}
                  className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 transform ${
                    isRevealed
                      ? 'scale-100 opacity-100 translate-y-0'
                      : 'scale-90 opacity-0 translate-y-4'
                  } ${
                    isJackpot
                      ? 'bg-gradient-to-b from-[#2e2308] via-[#1a1b32] to-[#0c1628] border-amber-400 shadow-amber-500/30'
                      : isHighTier
                      ? 'bg-gradient-to-b from-[#182646] to-[#0f1c35]'
                      : 'bg-[#112244]/80'
                  }`}
                  style={{
                    borderColor: `${color}66`,
                    boxShadow:
                      isRevealed && isHighTier
                        ? `0 0 18px ${color}44, inset 0 0 14px ${color}20`
                        : undefined,
                  }}
                >
                  {/* Badge Rarity & Star */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${color}22`,
                        color: color,
                      }}
                    >
                      {prize.stars} SAO
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                  </div>

                  {/* Stars Display Fairy Tail Style */}
                  <div className="pt-1.5 flex justify-center">
                    <StarRating count={prize.stars} size={12} color={color} />
                  </div>

                  {/* Icon Art with Magic Guild Crest */}
                  <div className="py-2.5 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner transition-transform hover:scale-105"
                      style={{
                        backgroundColor: `${color}20`,
                        borderColor: `${color}55`,
                        color: color,
                      }}
                    >
                      <MagicGuildCrest stars={prize.stars} color={color} size={48} />
                    </div>
                  </div>

                  {/* Content Copy */}
                  <div className="text-center pt-2 border-t border-[#223C77]/40">
                    <div className="font-extrabold text-sm text-white truncate" title={prize.name}>
                      {prize.name}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-0.5 font-medium" title={prize.sub}>
                      {prize.sub}
                    </div>
                  </div>

                  {/* High Tier Golden Sheen for 6 Star */}
                  {isJackpot && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-amber-400 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#223C77]/60 bg-[#0c172e]">
          <div className="text-xs text-slate-300">
            Đã mở trọn vẹn <strong className="text-amber-400 font-mono font-bold">10</strong> phần quà! BTC trao quà theo số sao trên thẻ.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRollAgain}
              disabled={isRollingAgain}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#223C77] hover:bg-[#2e52a4] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-900/50 border border-blue-400/40 transition-all active:scale-95"
            >
              <RotateCcw size={16} />
              Quay Tiếp x10
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Xác Nhận & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
