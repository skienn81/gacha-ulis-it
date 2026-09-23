import { Prize } from './prizes';

// CS:GO Panorama timing reconstructed from popup_capability_decodable.js/.css.
export const OPENING_DELAY_MS = 2400;
export const SPIN_DURATION_MS = 10000; // Thời gian quay chuẩn 10 giây hồi hộp & kịch tính
export const FAST_SPIN_DURATION_MS = 600; // Khi bật Skip / Fast spin
export const TICK_SECONDS = [0,.063,.125,.188,.250,.313,.375,.438,.500,.563,.625,.688,.750,.813,.875,.938,1,1.063,1.125,1.188,1.250,1.313,1.375,1.483,1.351,1.620,1.701,1.786,1.872,2.003,2.154,2.313,2.466,2.615,2.773,2.941,3.104,3.339,3.630,3.953,4.385,5.004,5.800,6.750,7.800,8.900,9.500].sort((a,b)=>a-b);

export const TARGET_LUNCH_PRICE = 50;
export const LOG_PRICE_SPREAD = .35;

export function caseEase(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const t = (lo + hi) / 2, u = 1 - t, x = 3 * u * u * t * .075 + 3 * u * t * t * .165 + t * t * t;
    if (x < p) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2, u = 1 - t;
  return 3 * u * u * t * .82 + 3 * u * t * t + t * t * t;
}

/**
 * Bộ chọn xác suất quà tặng ULIS IT:
 * - Tỉ lệ tự nhiên, công bằng, chơi bền bỉ cho ngày hội đông người.
 * - Chỉ quà 6 Sao là có tiền mặt; duy nhất 1 người trúng trong cả ngày hội (sau đó loại bỏ).
 * - Quà ảo giác marketing (weight = 0 hoặc isTeaser = true) tuyệt đối không bao giờ trúng.
 */
export function createPrizeSelector(prizeList: Prize[]) {
  if (!prizeList.length) throw new Error('Danh sách quà tặng không được rỗng');

  // Lọc lấy danh sách quà thật sự có thể trúng
  const validPrizes = prizeList.filter(p => !p.isTeaser && p.weight > 0);

  function choose(
    items: Prize[] = validPrizes,
    random = Math.random,
    excludeSixStar = false,
    buffCounts: Record<string, number> = {},
    forcedPrizeId?: string | null
  ): Prize {
    let pool = (items.length ? items : validPrizes).filter(p => !p.isTeaser && p.weight > 0);
    if (!pool.length) pool = validPrizes;

    // Cơ chế Bí Mật BTC: Nếu kích hoạt "Gài Nổ / Khóa Mục Tiêu Lượt Kế Tiếp"
    if (forcedPrizeId) {
      const target = pool.find(p => p.id === forcedPrizeId);
      if (target) {
        // Nếu mục tiêu gài là 6 sao nhưng 6 sao đã trúng trước đó thì bỏ qua, nếu chưa trúng thì ăn chắc 100%
        if (target.stars !== 6 || !excludeSixStar) {
          return target;
        }
      }
    }

    if (excludeSixStar) {
      const filtered = pool.filter(p => p.stars !== 6);
      if (filtered.length) pool = filtered;
    }

    // Trọng số thực tế sau khi tính số lần buff:
    // Cộng thẳng +75 điểm/lần buff để quà hiếm (6 sao gốc = 1) tăng mạnh tỉ lệ chỉ sau 2-5 click!
    const getEffectiveWeight = (p: Prize) => {
      const buffs = buffCounts[p.id] || 0;
      if (buffs <= 0) return p.weight;
      return p.weight * (1 + buffs * 0.5) + buffs * 75;
    };

    const currentTotal = pool.reduce((sum, p) => sum + getEffectiveWeight(p), 0);
    const draw = random() * currentTotal;
    let accumulated = 0;
    for (const item of pool) {
      accumulated += getEffectiveWeight(item);
      if (draw <= accumulated) return item;
    }
    return pool[pool.length - 1];
  }

  function chooseMultiple(count: number, random = Math.random, excludeSixStar = false): Prize[] {
    const results: Prize[] = [];
    let hasDroppedSixStar = excludeSixStar;
    for (let i = 0; i < count; i++) {
      const picked = choose(validPrizes, random, hasDroppedSixStar);
      if (picked.stars === 6) {
        hasDroppedSixStar = true;
      }
      results.push(picked);
    }
    return results;
  }

  return {
    prizes: prizeList,
    choose,
    chooseMultiple,
  };
}

/**
 * Tính toán chính xác tỉ lệ % rơi hiện tại của từng món quà dựa trên số lần buff
 * Dùng để hiển thị trực tiếp cho BTC theo dõi trong Kho Quà
 */
export function calculatePrizeChances(
  prizeList: Prize[],
  buffCounts: Record<string, number> = {},
  excludeSixStar = false
): Record<string, number> {
  let pool = prizeList.filter(p => !p.isTeaser && p.weight > 0);
  if (excludeSixStar) {
    const filtered = pool.filter(p => p.stars !== 6);
    if (filtered.length) pool = filtered;
  }

  const getEffectiveWeight = (p: Prize) => {
    const buffs = buffCounts[p.id] || 0;
    if (buffs <= 0) return p.weight;
    return p.weight * (1 + buffs * 0.5) + buffs * 75;
  };

  const currentTotal = pool.reduce((sum, p) => sum + getEffectiveWeight(p), 0);
  const chances: Record<string, number> = {};
  for (const item of pool) {
    chances[item.id] = currentTotal > 0 ? (getEffectiveWeight(item) / currentTotal) * 100 : 0;
  }
  return chances;
}

export function stopFraction(random = Math.random) {
  return (Math.floor(random() * 81) + 10) / 100;
}

export function priceRarity(priceInThousands: number) {
  return priceInThousands <= 40 ? 0 : priceInThousands <= 65 ? 1 : priceInThousands <= 100 ? 2 : priceInThousands <= 130 ? 3 : 4;
}

export function createSpinProfile(random = Math.random, reducedMotion = false) {
  if (reducedMotion) return { durationMs: 4000 + Math.floor(random() * 1001), tiles: 10 + Math.floor(random() * 4), friction: 2.7 + random() * .6 };
  // Chuẩn thời lượng quay 10 giây (9500ms - 10500ms) để nhịp phanh con lăn chạy đầy cảm xúc và hồi hộp
  return { durationMs: 9500 + Math.floor(random() * 1001), tiles: 40 + Math.floor(random() * 11), friction: 2.7 + random() * .6 };
}

export function createFastSpinProfile(random = Math.random) {
  return { durationMs: 700 + Math.floor(random() * 200), tiles: 8 + Math.floor(random() * 3), friction: 2.2 };
}

export function spinProgress(progress: number, friction: number) {
  const p = Math.max(0, Math.min(1, progress));
  return 1 - Math.pow(1 - p, friction);
}

// Tương thích ngược với module kiểm thử
type PricedMeal = { price: number; rarity: number };
export function createFoodSelector<T extends PricedMeal>(population: T[], target = TARGET_LUNCH_PRICE) {
  if (!population.length) throw new Error('No meals in population');
  const min = Math.min(...population.map(f => f.price)), max = Math.max(...population.map(f => f.price));
  const counts = new Map<number, number>();
  population.forEach(f => counts.set(f.price, (counts.get(f.price) || 0) + 1));
  const logs = population.map(f => Math.log(f.price / 50));
  const prior = logs.map((x, i) => -.5 * (x / LOG_PRICE_SPREAD) ** 2 - Math.log(counts.get(population[i].price)!));
  function weights(tilt: number) {
    const logits = logs.map((x, i) => prior[i] + tilt * x), anchor = Math.max(...logits);
    const raw = logits.map(x => Math.exp(x - anchor)), sum = raw.reduce((s, x) => s + x, 0);
    return raw.map(x => x / sum);
  }
  const mean = (w: number[]) => population.reduce((s, f, i) => s + f.price * w[i], 0);
  let raw: number[];
  if (target === min || target === max) { const n = counts.get(target)!; raw = population.map(f => f.price === target ? 1 / n : 0); }
  else {
    let lo = -1, hi = 1;
    while (mean(weights(lo)) > target) lo *= 2;
    while (mean(weights(hi)) < target) hi *= 2;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (mean(weights(mid)) < target) lo = mid; else hi = mid; }
    raw = weights((lo + hi) / 2);
  }
  const probabilities = new Map(population.map((f, i) => [f, raw[i]]));
  function weighted(items: T[]) {
    if (!items.length) throw new Error('No eligible meals');
    const w = items.map(f => { const p = probabilities.get(f); if (p === undefined) throw new Error('Unknown meal'); return p; });
    const sum = w.reduce((s, p) => s + p, 0); if (sum <= 0) throw new Error('Eligible meals have no probability');
    return { w, sum };
  }
  return {
    probabilities,
    expectedPrice: mean(raw),
    choose(items: T[], random = Math.random): T {
      const { w, sum } = weighted(items); const draw = random();
      let remaining = draw * sum;
      for (let i = 0; i < items.length; i++) if ((remaining -= w[i]) < 0) return items[i];
      return items[items.length - 1];
    }
  };
}
