'use client';

import { useState, useEffect, useCallback } from 'react';
import { WonItem } from '@/components/inventory-modal';
import { Prize } from '@/lib/prizes';

const STORAGE_KEY = 'ulis_it_gacha_history_v2';
const CLAIMED_6STAR_KEY = 'ulis_it_6star_claimed';
const BUFF_COUNTS_KEY = 'ulis_it_buff_counts_v1';
const FORCED_PRIZE_KEY = 'ulis_it_forced_prize_v1';

export function usePrizeHistory() {
  const [history, setHistory] = useState<WonItem[]>([]);
  const [isSixStarClaimed, setIsSixStarClaimed] = useState<boolean>(false);
  const [buffCounts, setBuffCounts] = useState<Record<string, number>>({});
  const [forcedPrizeId, setForcedPrizeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 1. Đọc trạng thái 6 sao đã bị claim chưa
      const claimedRaw = localStorage.getItem(CLAIMED_6STAR_KEY);
      const isClaimed = claimedRaw === 'true';

      // 2. Đọc trạng thái số lần buff của từng ô quà
      const buffRaw = localStorage.getItem(BUFF_COUNTS_KEY);
      if (buffRaw) {
        const parsedBuffs = JSON.parse(buffRaw);
        if (parsedBuffs && typeof parsedBuffs === 'object') {
          setBuffCounts(parsedBuffs);
        }
      }

      // 3. Đọc quà đang bị gài nổ lượt kế tiếp (nếu có)
      const forcedRaw = localStorage.getItem(FORCED_PRIZE_KEY);
      if (forcedRaw) {
        setForcedPrizeId(forcedRaw);
      }

      // 4. Đọc lịch sử các lượt quay
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          // Đồng bộ nếu trong lịch sử đã có thẻ 6 sao
          const hasSixStar = parsed.some((item: WonItem) => item.stars === 6 || item.rarity === 5);
          if (hasSixStar && !isClaimed) {
            localStorage.setItem(CLAIMED_6STAR_KEY, 'true');
            setIsSixStarClaimed(true);
            return;
          }
        }
      }
      setIsSixStarClaimed(isClaimed);
    } catch {
      // Fallback nếu localStorage bị chặn
    }
  }, []);

  const addWonItems = useCallback((prizes: Prize[]) => {
    setHistory(prev => {
      const newItems: WonItem[] = prizes.map(p => ({
        id: `${p.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        prizeId: p.id,
        name: p.name,
        sub: p.sub,
        stars: p.stars,
        rarity: p.rarity,
        iconName: p.iconName,
        timestamp: Date.now(),
      }));

      // Kiểm tra nếu có phần thưởng 6 sao trong lượt này
      const droppedSixStar = prizes.some(p => p.stars === 6);
      if (droppedSixStar) {
        setIsSixStarClaimed(true);
        try {
          localStorage.setItem(CLAIMED_6STAR_KEY, 'true');
        } catch {}
      }

      const updated = [...newItems, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 500)));
      } catch {}
      return updated;
    });
  }, []);

  // Thao tác Buff tỉ lệ cho từng ô quà (hỗ trợ cộng nhiều lần cùng lúc: +1, +5, +10)
  const buffPrize = useCallback((prizeId: string, amount = 1) => {
    setBuffCounts(prev => {
      const current = prev[prizeId] || 0;
      const next = { ...prev, [prizeId]: Math.max(0, current + amount) };
      try {
        localStorage.setItem(BUFF_COUNTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Thao tác giảm bớt số lần buff
  const unbuffPrize = useCallback((prizeId: string, amount = 1) => {
    setBuffCounts(prev => {
      const current = prev[prizeId] || 0;
      const nextVal = current - amount;
      if (nextVal <= 0) {
        const next = { ...prev };
        delete next[prizeId];
        try {
          localStorage.setItem(BUFF_COUNTS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      }
      const next = { ...prev, [prizeId]: nextVal };
      try {
        localStorage.setItem(BUFF_COUNTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Đặt lại số lần buff của một phần quà về 0
  const resetPrizeBuff = useCallback((prizeId: string) => {
    setBuffCounts(prev => {
      const next = { ...prev };
      delete next[prizeId];
      try {
        localStorage.setItem(BUFF_COUNTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Thao tác bí mật: Khóa mục tiêu / Gài Nổ 100% cho lượt quay kế tiếp
  const setForcedPrize = useCallback((prizeId: string | null) => {
    setForcedPrizeId(prizeId);
    try {
      if (prizeId) {
        localStorage.setItem(FORCED_PRIZE_KEY, prizeId);
      } else {
        localStorage.removeItem(FORCED_PRIZE_KEY);
      }
    } catch {}
  }, []);

  // Tiêu thụ cờ gài nổ sau khi lượt quay hoàn tất
  const consumeForcedPrize = useCallback(() => {
    setForcedPrizeId(null);
    try {
      localStorage.removeItem(FORCED_PRIZE_KEY);
    } catch {}
  }, []);

  const resetSixStarClaim = useCallback(() => {
    try {
      localStorage.removeItem(CLAIMED_6STAR_KEY);
    } catch {}
    setIsSixStarClaimed(false);
  }, []);

  // Khi bấm "Reset đổi ca": Xóa sạch lịch sử, reset cờ 6 sao, XÓA HẾT BUFF VÀ XÓA GÀI NỔ
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CLAIMED_6STAR_KEY);
      localStorage.removeItem(BUFF_COUNTS_KEY);
      localStorage.removeItem(FORCED_PRIZE_KEY);
    } catch {}
    setHistory([]);
    setIsSixStarClaimed(false);
    setBuffCounts({});
    setForcedPrizeId(null);
  }, []);

  // Tổng số lần đã buff trong ca hiện tại
  const totalBuffCount = Object.values(buffCounts).reduce((sum, count) => sum + count, 0);

  return {
    history,
    addWonItems,
    clearHistory,
    totalSpins: history.length,
    isSixStarClaimed,
    resetSixStarClaim,
    buffCounts,
    buffPrize,
    unbuffPrize,
    resetPrizeBuff,
    totalBuffCount,
    forcedPrizeId,
    setForcedPrize,
    consumeForcedPrize,
  };
}
