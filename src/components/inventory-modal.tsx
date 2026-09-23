'use client';

import React, { useState, useMemo } from 'react';
import { Prize, PRIZES, TIER_COLORS, TIER_LABELS } from '@/lib/prizes';
import { calculatePrizeChances } from '@/lib/case-mechanics';
import { PrizeIcon, StarRating, MagicGuildCrest, CelestialStar } from '@/components/prize-icon';
import { X, Trash2, Copy, Check, History, Package, Trophy, RotateCcw, Zap, Plus, Minus, Target } from 'lucide-react';

export interface WonItem {
  id: string;
  prizeId: string;
  name: string;
  sub: string;
  stars: 1 | 2 | 3 | 4 | 5 | 6;
  rarity: 0 | 1 | 2 | 3 | 4 | 5;
  iconName: string;
  timestamp: number;
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: WonItem[];
  onClearHistory: () => void;
  isSixStarClaimed?: boolean;
  onResetSixStar?: () => void;
  buffCounts?: Record<string, number>;
  onBuffPrize?: (prizeId: string, amount?: number) => void;
  onUnbuffPrize?: (prizeId: string, amount?: number) => void;
  onResetPrizeBuff?: (prizeId: string) => void;
  totalBuffCount?: number;
  forcedPrizeId?: string | null;
  onSetForcedPrize?: (prizeId: string | null) => void;
}

export function InventoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
  isSixStarClaimed = false,
  onResetSixStar,
  buffCounts = {},
  onBuffPrize,
  onUnbuffPrize,
  onResetPrizeBuff,
  totalBuffCount = 0,
  forcedPrizeId = null,
  onSetForcedPrize,
}: InventoryModalProps) {
  const [activeTab, setActiveTab] = useState<'prizes' | 'log'>('prizes');
  const [copied, setCopied] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!isOpen) return null;

  // Danh sách quà thực tế có thể quay trúng
  const validPrizes = PRIZES.filter(p => !p.isTeaser && p.weight > 0);

  // Tính toán tỉ lệ % rơi thực tế của từng món quà dựa trên số lần buff và trạng thái 6 sao
  const chances = useMemo(() => {
    return calculatePrizeChances(PRIZES, buffCounts, isSixStarClaimed);
  }, [buffCounts, isSixStarClaimed]);

  // Tính toán thống kê theo 6 bậc sao
  const totalSpins = history.length;
  const tierCounts = [0, 0, 0, 0, 0, 0];
  const itemCounts = new Map<string, number>();

  history.forEach(item => {
    const tier = item.rarity ?? (item.stars - 1);
    if (tier >= 0 && tier < 6) {
      tierCounts[tier]++;
    }
    itemCounts.set(item.prizeId, (itemCounts.get(item.prizeId) || 0) + 1);
  });

  const handleCopyReport = () => {
    const lines = [
      `=== BÁO CÁO GACHA CLB TIN HỌC ULIS IT (CLUB DAY 2026) ===`,
      `Tổng số lượt quay tại Booth: ${totalSpins}`,
      `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`,
      `---------------------------------`,
      `Thống kê theo phân bậc Sao:`,
      ...tierCounts.map((count, tier) => `• ${tier + 1} Sao (${TIER_LABELS[tier]}): ${count} phần`),
      `---------------------------------`,
      `Trạng thái Giải 6 Sao Độc Bản: ${
        isSixStarClaimed
          ? 'ĐÃ CÓ NGƯỜI TRÚNG (Đã tự động loại khỏi pool quay)'
          : 'CHƯA TRÚNG (Sẵn sàng nổ hũ)'
      }`,
      `Tổng số lần đã Buff tỉ lệ ca này: ${totalBuffCount} lần`,
      ...(forcedPrizeId
        ? [`Mục tiêu đang gài nổ lượt sau: ${validPrizes.find(p => p.id === forcedPrizeId)?.name || forcedPrizeId}`]
        : []),
      `---------------------------------`,
      `Chi tiết quà đã phát & tỉ lệ hiện tại:`,
      ...validPrizes.map(p => {
        const count = itemCounts.get(p.id) || 0;
        const buffs = buffCounts[p.id] || 0;
        const chance = chances[p.id] || 0;
        return `• ${p.name} [${p.stars} Sao]: Đã trao ${count} | Tỉ lệ hiện tại: ${chance.toFixed(1)}% ${
          buffs > 0 ? `(Buff +${buffs} lần)` : ''
        }`;
      }),
      `=================================`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050c1a]/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0e1d3b] border border-[#2b4982] rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header ULIS IT */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#244177] bg-[#0c1832]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#223C77]/50 text-cyan-300 flex items-center justify-center border border-cyan-400/40 shadow-inner">
              <Package size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">Kho Quà & Bảng Điều Khiển BTC</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-500/30">
                  CLB ULIS IT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Theo dõi tỉ lệ rơi thực tế, buff điểm linh hoạt và gài nổ lượt quay kế tiếp
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

        {/* Thanh Admin Trạng Thái 6 Sao & Tổng Buff */}
        <div className="px-6 py-2.5 bg-[#081224] border-b border-[#244177] flex items-center justify-between text-xs flex-wrap gap-2">
          {/* Trạng thái 6 Sao */}
          <div className="flex items-center gap-2">
            <CelestialStar size={14} color={isSixStarClaimed ? '#f59e0b' : '#94a3b8'} glow={isSixStarClaimed} />
            <span className="text-slate-300 font-semibold">6 Sao Tiền Mặt:</span>
            {isSixStarClaimed ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ĐÃ CÓ NGƯỜI TRÚNG (Đã ẩn)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                CHƯA TRÚNG (Sẵn sàng)
              </span>
            )}
            {isSixStarClaimed && onResetSixStar && (
              <button
                onClick={onResetSixStar}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-1 font-bold"
                title="Đặt lại để cho phép rơi thêm 1 lần"
              >
                Reset 6 Sao
              </button>
            )}
          </div>

          {/* Trạng thái Buff */}
          <div className="flex items-center gap-2">
            <Zap size={14} className={totalBuffCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
            <span className="text-slate-300 font-semibold">Tổng Buff ca này:</span>
            {totalBuffCount > 0 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse">
                ⚡ {totalBuffCount} LẦN BUFF
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] text-slate-400 bg-slate-800/60 border border-slate-700">
                Mặc định (Chưa buff)
              </span>
            )}
            <span className="text-[10px] text-slate-400 italic">(Đổi ca sẽ tự hết buff)</span>
          </div>
        </div>

        {/* Banner Bí Mật: Gài Nổ 100% Lượt Kế Tiếp */}
        {forcedPrizeId && (
          <div className="px-6 py-2 bg-gradient-to-r from-amber-950/90 via-rose-950/80 to-amber-950/90 border-b border-amber-500/40 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-bold text-amber-300">
                🎯 [BÍ MẬT BTC] ĐÃ GÀI NỔ 100%: Lượt quay tiếp theo chắc chắn trúng vào{' '}
                <span className="text-white underline underline-offset-2 font-extrabold">
                  {validPrizes.find(p => p.id === forcedPrizeId)?.name || 'Vật phẩm đã chọn'}
                </span>
                !
              </span>
            </div>
            {onSetForcedPrize && (
              <button
                onClick={() => onSetForcedPrize(null)}
                className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600/50 text-[11px] font-bold transition-colors"
              >
                Hủy Gài Nổ
              </button>
            )}
          </div>
        )}

        {/* Thống kê nhanh theo 6 Bậc Sao */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-6 py-3 bg-[#0c1832] border-b border-[#244177]">
          {tierCounts.map((count, tier) => (
            <div
              key={tier}
              className="flex flex-col items-center justify-center p-2 rounded-xl border bg-[#112244]/70"
              style={{
                borderColor: `${TIER_COLORS[tier]}44`,
              }}
            >
              <span className="text-[10px] font-bold tracking-wider" style={{ color: TIER_COLORS[tier] }}>
                {tier + 1} SAO
              </span>
              <StarRating count={tier + 1} size={10} color={TIER_COLORS[tier]} className="my-0.5" />
              <span className="text-base font-bold font-mono text-white">{count}</span>
            </div>
          ))}
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-6 border-b border-[#244177] bg-[#0f1d3a]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('prizes')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'prizes'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy size={16} />
              Quản lý Thẻ Ô Quà & Buff Tỉ Lệ ({validPrizes.length})
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'log'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History size={16} />
              Lịch sử quay tại Booth ({totalSpins})
            </button>
          </div>

          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#223C77] text-white hover:bg-[#2c4e9b] border border-blue-400/40 transition-all shadow-sm"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Đã copy báo cáo!' : 'Copy báo cáo gửi BTC'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[260px]">
          {activeTab === 'prizes' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {validPrizes.map(prize => {
                const count = itemCounts.get(prize.id) || 0;
                const buffs = buffCounts[prize.id] || 0;
                const color = TIER_COLORS[prize.rarity];
                const isForced = forcedPrizeId === prize.id;
                const isClaimed6Star = prize.stars === 6 && isSixStarClaimed;
                const chance = isClaimed6Star ? 0 : (chances[prize.id] || 0);

                return (
                  <div
                    key={prize.id}
                    className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all ${
                      isForced
                        ? 'bg-[#291811] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
                        : buffs > 0
                        ? 'bg-[#132449] border-amber-500/70 shadow-[0_0_14px_rgba(245,158,11,0.2)]'
                        : 'bg-[#122244]/80'
                    }`}
                    style={{
                      borderColor: isForced ? '#f59e0b' : buffs > 0 ? '#f59e0b88' : `${color}44`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border relative"
                        style={{
                          backgroundColor: `${color}20`,
                          borderColor: `${color}66`,
                          color,
                        }}
                      >
                        <MagicGuildCrest stars={prize.stars} color={color} size={38} />
                        {isForced && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md animate-bounce">
                            <Target size={12} className="stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-extrabold text-sm text-white truncate">
                            {prize.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Badge Tỉ lệ % rơi hiện tại */}
                            {isClaimed6Star ? (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                ĐÃ NỔ (0%)
                              </span>
                            ) : isForced ? (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 border border-amber-300 animate-pulse flex items-center gap-0.5">
                                <Target size={10} className="stroke-[3]" /> 100% LƯỢT SAU
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  chance > 30
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : chance > 10
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                                }`}
                                title="Xác suất rơi trong mỗi lượt quay"
                              >
                                Tỉ lệ: ~{chance.toFixed(1)}%
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0 border border-blue-500/30">
                              Đã phát: {count}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StarRating count={prize.stars} size={11} color={color} />
                          <span className="text-[11px] text-slate-300 truncate">{prize.sub}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thao tác Buff Tỉ Lệ & Gài Nổ ngay trong Thẻ Ô Quà */}
                    <div className="mt-3 pt-2.5 border-t border-[#244177]/60 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {buffs > 0 ? (
                          <div className="flex items-center gap-1 font-mono font-bold text-amber-300">
                            <Zap size={13} className="fill-amber-400 text-amber-400" />
                            <span>+{buffs} lần</span>
                            <span className="text-slate-400 font-normal text-[10px]">(+{buffs * 75}đ)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Gốc: {prize.weight}đ</span>
                        )}
                        {buffs > 0 && onResetPrizeBuff && (
                          <button
                            onClick={() => onResetPrizeBuff(prize.id)}
                            className="text-[10px] text-slate-400 hover:text-rose-300 underline underline-offset-2 ml-1"
                            title="Đặt lại số buff của món này về 0"
                          >
                            Về 0
                          </button>
                        )}
                      </div>

                      {/* Các nút hành động nhanh cho BTC */}
                      <div className="flex items-center gap-1">
                        {/* Giảm 1 buff */}
                        {buffs > 0 && onUnbuffPrize && (
                          <button
                            onClick={() => onUnbuffPrize(prize.id, 1)}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-600"
                            title="Giảm 1 lần buff"
                          >
                            <Minus size={12} />
                          </button>
                        )}

                        {/* Buff nhẹ +1 */}
                        {onBuffPrize && (
                          <button
                            onClick={() => onBuffPrize(prize.id, 1)}
                            className="px-2 py-1 text-xs font-bold rounded-md bg-[#233d73] hover:bg-[#2e5096] text-cyan-200 border border-cyan-500/30 transition-all active:scale-95"
                            title="Buff nhẹ +1 (+75 điểm trọng số)"
                          >
                            +1
                          </button>
                        )}

                        {/* Buff mạnh +5 */}
                        {onBuffPrize && (
                          <button
                            onClick={() => onBuffPrize(prize.id, 5)}
                            className="flex items-center gap-0.5 px-2.5 py-1 text-xs font-bold rounded-md bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
                            title="Buff mạnh +5 lần (+375 điểm) - Tỉ lệ tăng vọt!"
                          >
                            <Zap size={11} className="fill-slate-950" />
                            <span>+5</span>
                          </button>
                        )}

                        {/* Cơ chế bí mật: Gài Nổ 100% Lượt Sau */}
                        {onSetForcedPrize && (
                          <button
                            disabled={isClaimed6Star}
                            onClick={() => onSetForcedPrize(isForced ? null : prize.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all active:scale-95 border ${
                              isClaimed6Star
                                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                : isForced
                                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border-rose-600/40 hover:border-rose-400'
                            }`}
                            title={
                              isClaimed6Star
                                ? 'Phần thưởng 6 Sao đã có người trúng'
                                : isForced
                                ? 'Đang kích hoạt gài nổ - Nhấn để hủy'
                                : 'Khóa mục tiêu: Lượt quay tiếp theo chắc chắn 100% trúng món này!'
                            }
                          >
                            <Target size={12} className={isForced ? 'stroke-[2.5]' : ''} />
                            <span>{isForced ? 'Đang Khóa' : 'Gài Nổ'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {totalSpins === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Package size={44} className="mb-2 stroke-1 text-slate-600" />
                  <p className="text-sm font-medium">Chưa có lượt quay nào.</p>
                  <p className="text-xs text-slate-500 mt-1">Các lượt quay trúng quà sẽ tự động lưu vào đây.</p>
                </div>
              ) : (
                history.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-2.5 rounded-xl border bg-[#112244]/60 text-xs"
                    style={{ borderColor: `${TIER_COLORS[item.rarity]}33` }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${TIER_COLORS[item.rarity]}25`,
                          borderColor: `${TIER_COLORS[item.rarity]}55`,
                          color: TIER_COLORS[item.rarity],
                        }}
                      >
                        <CelestialStar size={16} color={TIER_COLORS[item.rarity]} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white truncate">{item.name}</span>
                          <StarRating count={item.stars} size={10} color={TIER_COLORS[item.rarity]} />
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">{item.sub}</span>
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Admin Bar: Reset kho quà đổi ca (Xóa hết dữ liệu và HẾT BUFF) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#244177] bg-[#0c1832]">
          {showConfirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-medium">
                Xác nhận đổi ca (Xóa lịch sử & xóa toàn bộ Buff)?
              </span>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="px-3 py-1 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-500 font-bold shadow-md"
              >
                Xác nhận Reset Đổi Ca
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1.5 text-xs text-rose-400/90 hover:text-rose-300 font-bold transition-colors"
            >
              <Trash2 size={14} />
              Reset kho quà (Đổi ca trực - Hết buff)
            </button>
          )}

          <div className="text-xs text-slate-300">
            Tổng lượt quay tại quầy: <strong className="text-cyan-300 font-mono text-sm">{totalSpins}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
