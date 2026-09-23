'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  PRIZES,
  Prize,
  TIER_COLORS,
  TIER_LABELS,
  TIER_NAMES,
} from '@/lib/prizes';
import {
  createPrizeSelector,
  createSpinProfile,
  createFastSpinProfile,
  spinProgress,
  stopFraction,
} from '@/lib/case-mechanics';
import { CaseAudio } from '@/lib/case-audio';
import { PrizeIcon, StarRating, MagicGuildCrest, CelestialStar } from '@/components/prize-icon';
import { InventoryModal } from '@/components/inventory-modal';
import { usePrizeHistory } from '@/hooks/use-prize-history';
import { fireConfetti } from '@/lib/confetti';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Package,
  Zap,
  RotateCw,
  Trophy,
  Award,
  Crown,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Component hiển thị thẻ quà trên dải roulette với phong cách Ma Pháp Cổ Điển / Fairy Tail
const PrizeCard = memo(function PrizeCard({
  prize,
  small = false,
  slot,
}: {
  prize: Prize;
  small?: boolean;
  slot?: number;
}) {
  const color = TIER_COLORS[prize.rarity];
  const isJackpot = prize.stars === 6;

  return (
    <div
      className={`prize-card ${small ? 'small' : ''} ${isJackpot ? 'jackpot-card' : ''}`}
      data-slot-id={slot}
      style={
        {
          '--rarity': color,
          ...(slot === undefined ? {} : { position: 'absolute', left: slot * 254 }),
        } as React.CSSProperties
      }
    >
      {/* Vòng tròn ma trận cổ watermark chìm mờ */}
      <div className="card-magic-circle-watermark" />

      <div className="card-top-header">
        <span className="tier-badge" style={{ color }}>
          {prize.stars} SAO
        </span>
        <StarRating count={prize.stars} size={small ? 10 : 13} color={color} />
      </div>

      <div className="prize-art-wrapper">
        <div
          className="prize-icon-bubble"
          style={{
            backgroundColor: `${color}18`,
            borderColor: `${color}55`,
            color,
          }}
        >
          {prize.imageUrl ? (
            <img src={prize.imageUrl} alt={prize.name} className="prize-img" />
          ) : (
            <MagicGuildCrest stars={prize.stars} color={color} size={small ? 44 : 70} />
          )}
        </div>
      </div>

      <div className="card-info">
        <div className="flex items-center justify-between gap-1">
          <strong className="prize-name" title={prize.name}>
            {prize.name}
          </strong>
          {prize.isTeaser && (
            <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
              CỰC HIẾM
            </span>
          )}
        </div>
        <span className="prize-sub" title={prize.sub}>
          {prize.sub}
        </span>
      </div>
    </div>
  );
});

export default function Home() {
  const [sound, setSound] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [singleResult, setSingleResult] = useState<Prize | null>(null);

  // Inventory Modal State
  const [showInventory, setShowInventory] = useState(false);

  // Hook quản lý lịch sử quà tặng & trạng thái 6 sao độc bản & buff tỉ lệ
  const {
    history,
    addWonItems,
    clearHistory,
    totalSpins,
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
  } = usePrizeHistory();

  // Selector chọn quà theo trọng số
  const prizeSelector = useMemo(() => createPrizeSelector(PRIZES), []);

  // Âm thanh Web Audio engine
  const audio = useRef<CaseAudio | null>(null);
  useEffect(() => {
    const engine = new CaseAudio(basePath);
    audio.current = engine;
    engine.preload();
    const hide = () => {
      if (document.hidden) engine.pause();
      else engine.recover();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      engine.dispose();
      audio.current = null;
    };
  }, []);

  const toggleSound = () => {
    setSound(prev => {
      const next = !prev;
      audio.current?.setMuted(!next);
      return next;
    });
  };

  // Khởi tạo hàng thẻ roulette ban đầu (hiển thị đủ các bậc sao từ 1 đến 6 và cả quà teaser)
  const [reel, setReel] = useState(() =>
    PRIZES.slice(0, 14).map((prize, id) => ({ prize, id }))
  );
  const [visibleStart, setVisibleStart] = useState(0);
  const busy = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(-400);

  const attachTrack = useCallback((node: HTMLDivElement | null) => {
    track.current = node;
    if (node) node.style.transform = `translate3d(${position.current}px,0,0)`;
  }, []);

  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Xử lý phát âm thanh khi có kết quả
  const playRevealSound = useCallback((rarity: number) => {
    if (rarity >= 5) {
      audio.current?.play('item_reveal6_ancient');
    } else if (rarity === 4) {
      audio.current?.play('item_reveal5_legendary');
    } else if (rarity >= 2) {
      audio.current?.play('item_reveal4_mythical');
    } else {
      audio.current?.play('item_reveal3_rare');
    }
  }, []);

  // Hàm chạy hoạt ảnh con lăn Roulette chuẩn 10 giây hồi hộp & kịch tính
  const executeReelSpin = useCallback(
    (targetWinner: Prize, onComplete: () => void) => {
      if (!viewport.current || !track.current) return;

      const step = 254,
        tileWidth = 240,
        width = viewport.current.clientWidth;
      const start = position.current;
      const center = Math.floor((width / 2 - start) / step);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const profile = createSpinProfile(Math.random, reducedMotion);
      const target = center + profile.tiles;
      const end = width / 2 - tileWidth * stopFraction() - target * step;

      const rightEdge = Math.ceil((width - start) / step) + 1;
      const items = reel.filter(
        item => item.id >= center - Math.ceil(width / step) - 2 && item.id <= rightEdge
      );
      const last = Math.max(...items.map(item => item.id));
      const recent: Prize[] = [];

      for (let id = last + 1; id <= target + 4; id++) {
        const alternatives = PRIZES.filter(p => !recent.includes(p));
        // Khi quay, vẫn hiển thị tất cả các thẻ (kể cả 6 sao và quà teaser) để kích thích thị giác
        const prize =
          id === target
            ? targetWinner
            : alternatives[Math.floor(Math.random() * alternatives.length)] || PRIZES[0];
        items.push({ id, prize });
        recent.push(prize);
        if (recent.length > 6) recent.shift();
      }

      flushSync(() => {
        setReel(items);
        setSpinning(true);
      });

      audio.current?.play('csgo_ui_crate_open');
      const duration = profile.durationMs; // 10 giây chuẩn
      const started = performance.now();
      let renderedStart = visibleStart;
      let lastCell = Math.floor((start - width / 2) / step);

      const animate = (now: number) => {
        const progress = Math.max(0, Math.min(1, (now - started) / duration));
        const next = start + (end - start) * spinProgress(progress, profile.friction);
        position.current = next;

        const firstVisible = Math.max(0, Math.floor(-next / step));
        if (firstVisible - renderedStart >= 4 || firstVisible < renderedStart) {
          renderedStart = Math.max(0, firstVisible - 2);
          setVisibleStart(renderedStart);
        }
        if (track.current) track.current.style.transform = `translate3d(${next}px,0,0)`;

        const currentCell = Math.floor((next - width / 2) / step);
        if (currentCell !== lastCell) {
          lastCell = currentCell;
          audio.current?.play('csgo_ui_crate_item_scroll');
        }

        if (progress < 1) {
          frame.current = requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          busy.current = false;
          onComplete();
        }
      };

      frame.current = requestAnimationFrame(animate);
    },
    [reel, visibleStart]
  );

  // === QUAY ONE SHOT (MỞ 1 LƯỢT DUY NHẤT) ===
  const rollSingle = useCallback(() => {
    if (busy.current || !viewport.current || !track.current) return;
    audio.current?.unlock();
    busy.current = true;
    setSingleResult(null);

    // Âm thầm loại bỏ 6 sao nếu đã có người trúng (áp dụng số lần buff tỉ lệ và mục tiêu gài nổ nếu có)
    const winner = prizeSelector.choose(
      undefined,
      Math.random,
      isSixStarClaimed,
      buffCounts,
      forcedPrizeId
    );

    // Tiêu thụ mục tiêu gài nổ ngay khi lượt quay bắt đầu
    if (forcedPrizeId) {
      consumeForcedPrize();
    }

    // Nếu bật Fast Mode (Bỏ qua animation)
    if (fastMode) {
      audio.current?.play('csgo_ui_crate_item_scroll');
      setSpinning(true);
      setTimeout(() => {
        addWonItems([winner]);
        setSingleResult(winner);
        setSpinning(false);
        busy.current = false;
        playRevealSound(winner.rarity);
        if (winner.stars >= 5) fireConfetti(4500);
      }, 350);
      return;
    }

    // Hoạt ảnh quay Roulette đầy đủ chuẩn 10 giây
    executeReelSpin(winner, () => {
      addWonItems([winner]);
      setSingleResult(winner);
      playRevealSound(winner.rarity);
      if (winner.stars >= 5) fireConfetti(4500);
    });
  }, [
    prizeSelector,
    isSixStarClaimed,
    buffCounts,
    forcedPrizeId,
    consumeForcedPrize,
    fastMode,
    executeReelSpin,
    addWonItems,
    playRevealSound,
  ]);

  // Lọc thẻ hiển thị trong reel để tối ưu hiệu năng
  const visibleCards = useMemo(() => {
    return reel.filter(item => item.id >= visibleStart && item.id < visibleStart + 16);
  }, [reel, visibleStart]);

  // Danh mục tất cả quà tặng sắp xếp từ 6 Sao xuống 1 Sao
  const catalogCards = useMemo(() => {
    return [...PRIZES]
      .sort((a, b) => b.stars - a.stars)
      .map(prize => <PrizeCard key={prize.id} prize={prize} small />);
  }, []);

  return (
    <div className="ulis-theme min-h-screen flex flex-col justify-between text-slate-100">
      {/* HEADER QUY CHUẨN ĐH NGOẠI NGỮ & CLB TIN HỌC ULIS IT */}
      <header className="ulis-header">
        <div className="header-brand-container">
          {/* Logo CLB Tin học ULIS IT */}
          <div className="ulis-logo-shield">
            <img
              src={`${basePath}/brand/ulis-it-logo.png`}
              alt="ULIS IT Club Logo"
              className="w-12 h-12 object-contain rounded-full shadow-lg"
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="ulis-title-group">
            <span className="ulis-parent-school">TRƯỜNG ĐẠI HỌC NGOẠI NGỮ – ĐHQGHN</span>
            <div className="flex items-center gap-2">
              <h2 className="ulis-main-title">CLB TIN HỌC ULIS IT</h2>
              <div className="ulis-sub-badge">
                <span className="pulse-dot" />
                <span>BOOTH CLUB DAY 2026</span>
              </div>
            </div>
            <p className="ulis-slogan">
              “Cùng nhau kiến tạo cơ hội – Creating opportunities together”
            </p>
          </div>
        </div>

        <div className="header-controls">
          {/* Nút Skip animation / Quay nhanh */}
          <button
            onClick={() => setFastMode(!fastMode)}
            className={`control-pill ${fastMode ? 'active-fast' : ''}`}
            title="Bỏ qua hiệu ứng quay (dùng khi xếp hàng đông tại booth)"
          >
            <Zap size={16} className={fastMode ? 'text-amber-400' : 'text-slate-400'} />
            <span>{fastMode ? 'Quay Nhanh: BẬT' : 'Quay Nhanh: TẮT'}</span>
          </button>

          {/* Nút Kho Quà & Thống Kê */}
          <button
            onClick={() => setShowInventory(true)}
            className="control-pill inventory-btn"
            title="Xem kho quà đã phát và đối chiếu số sao"
          >
            <Package size={16} className="text-cyan-300" />
            <span>Kho Quà</span>
            {totalSpins > 0 && <span className="spin-counter-badge">{totalSpins}</span>}
          </button>

          {/* Nút Âm thanh */}
          <button
            onClick={toggleSound}
            className="control-pill sound-btn"
            title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} className="text-rose-400" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="ulis-main-content">
        {/* HERO BANNER */}
        <div className="hero-banner">
          <div className="hero-badge">
            <Sparkles size={14} className="text-amber-300" />
            <span>VÒNG QUAY MA PHÁP ONE SHOT – NHẬN QUÀ THEO SAO</span>
          </div>
          <h1 className="hero-heading">
            RƯƠNG QUÀ TẶNG <em>ULIS IT CLUB</em>
          </h1>
          <p className="hero-desc">
            Chào mừng tân sinh viên ghé thăm gian hàng CLB Tin học ULIS! Hãy kích hoạt vòng quay ma pháp 10 giây để trúng quà từ <strong>1 Sao</strong> đến <strong>6 Sao</strong>. Đặc biệt phần thưởng <strong>6 Sao DUY NHẤT</strong> có cơ hội nhận Lì Xì Tiền Mặt cực khủng từ CLB!
          </p>
        </div>

        {/* CS:GO STYLE CASE ROULETTE */}
        <div className="case-outer-container">
          <div className="case-top-bar">
            <div className="flex items-center gap-2">
              <span className="case-status-indicator" />
              <span className="font-bold text-sm tracking-wider text-white">
                HÒM QUÀ CLUB DAY 2026
              </span>
              <span className="ulis-badge-tag">HỆ PHÂN TẦNG 1 - 6 SAO</span>
            </div>
            <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
              <span>Giải Tiền Mặt Duy Nhất:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <CelestialStar size={13} color="#f59e0b" />
                6 SAO TIỀN MẶT ĐỘC BẢN
              </span>
            </div>
          </div>

          <div className="reel-viewport" ref={viewport}>
            <div className="reel-fade left" />
            <div className="selector-needle" />
            <div className="reel-fade right" />

            <div className="reel-track" ref={attachTrack}>
              {visibleCards.map(item => (
                <PrizeCard key={item.id} prize={item.prize} slot={item.id} />
              ))}
            </div>
          </div>

          <div className="case-bottom-bar">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Award size={14} className="text-amber-400" />
              <span>Quay thưởng tại quầy – 100% nhận quà lưu niệm theo số sao từ CLB Tin học</span>
            </div>
            <div className="text-xs font-mono text-slate-300">
              Tổng lượt quay tại quầy: <strong className="text-cyan-300">{totalSpins}</strong>
            </div>
          </div>
        </div>

        {/* ACTION BUTTON (CHỈ QUAY ONE SHOT DUY NHẤT) */}
        <div className="actions-cluster">
          <button
            onClick={rollSingle}
            disabled={spinning}
            className="action-btn-primary roll-1-btn"
            style={{ padding: '18px 48px', minWidth: '320px', justifyContent: 'center' }}
          >
            <RotateCw size={24} className={spinning ? 'animate-spin' : ''} />
            <div className="btn-text-group" style={{ alignItems: 'center', textAlign: 'center' }}>
              <span className="btn-main-label" style={{ fontSize: '18px' }}>
                VÒNG QUAY MA PHÁP ONE SHOT
              </span>
              <span className="btn-sub-label text-blue-200" style={{ fontSize: '12.5px' }}>
                {spinning ? 'Đang quay kịch tính (10 giây)...' : 'Nhấn để quay 1 lượt hồi hộp 10 giây'}
              </span>
            </div>
          </button>
        </div>

        {/* POPUP KẾT QUẢ QUAY */}
        {singleResult && (
          <div className="result-modal-backdrop animate-in fade-in duration-200">
            <div
              className={`result-modal-box ${singleResult.stars >= 5 ? 'jackpot-box' : ''}`}
              style={{
                borderColor: TIER_COLORS[singleResult.rarity],
                boxShadow: `0 0 55px ${TIER_COLORS[singleResult.rarity]}66`,
              }}
            >
              {/* Golden Rays Background khi nổ quà 5 hoặc 6 sao */}
              {singleResult.stars >= 5 && <div className="jackpot-rays" />}

              <div className="result-modal-content">
                {singleResult.stars === 6 ? (
                  <div className="jackpot-badge-header">
                    <Crown size={20} />
                    <span>CHÚC MỪNG TRÚNG TIỀN MẶT JACKPOT 6 SAO ĐỘC BẢN!</span>
                  </div>
                ) : singleResult.stars === 5 ? (
                  <div className="jackpot-badge-header bg-rose-500/20 text-rose-300 border-rose-500/50">
                    <Sparkles size={18} />
                    <span>TRÚNG SIÊU PHẨM 5 SAO: MÓC KHÓA MICA LIMITED!</span>
                  </div>
                ) : null}

                <div
                  className="result-tier-pill"
                  style={{
                    backgroundColor: `${TIER_COLORS[singleResult.rarity]}22`,
                    color: TIER_COLORS[singleResult.rarity],
                    borderColor: `${TIER_COLORS[singleResult.rarity]}66`,
                  }}
                >
                  {singleResult.stars} SAO • {TIER_LABELS[singleResult.rarity]}
                </div>

                <div className="my-2.5 flex justify-center">
                  <StarRating
                    count={singleResult.stars}
                    size={26}
                    color={TIER_COLORS[singleResult.rarity]}
                  />
                </div>

                <div
                  className="result-icon-display"
                  style={{
                    backgroundColor: `${TIER_COLORS[singleResult.rarity]}20`,
                    borderColor: `${TIER_COLORS[singleResult.rarity]}77`,
                    color: TIER_COLORS[singleResult.rarity],
                  }}
                >
                  <MagicGuildCrest
                    stars={singleResult.stars}
                    color={TIER_COLORS[singleResult.rarity]}
                    size={90}
                  />
                </div>

                <h2 className="result-title">{singleResult.name}</h2>
                <p className="result-sub">{singleResult.sub}</p>

                {singleResult.quip && (
                  <div className="result-quip-box">
                    <span>"{singleResult.quip}"</span>
                  </div>
                )}

                <div className="result-actions">
                  <button
                    onClick={rollSingle}
                    disabled={spinning}
                    className="result-btn-again"
                  >
                    <RotateCw size={16} />
                    <span>Quay Thêm Lượt Nữa</span>
                  </button>
                  <button
                    onClick={() => {
                      setSingleResult(null);
                      setShowInventory(true);
                    }}
                    className="result-btn-inventory"
                  >
                    <Package size={16} />
                    <span>Xem Kho Quà</span>
                  </button>
                  <button
                    onClick={() => setSingleResult(null)}
                    className="result-btn-close"
                  >
                    Nhận Quà & Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATALOG TẤT CẢ PHẦN QUÀ (PREVIEW ALL ĐỂ KÍCH THÍCH THỊ GIÁC) */}
        <section className="catalog-section">
          <div className="catalog-header">
            <div>
              <span className="eyebrow-text">DANH MỤC PHẦN THƯỞNG MA PHÁP THEO SAO</span>
              <h3 className="catalog-title">
                Hệ Thống Quà Tặng Booth Club Day 2026 (1 - 6 Sao)
              </h3>
            </div>
            <div className="rarity-legend-bar">
              {TIER_COLORS.map((color, idx) => (
                <div key={idx} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: color }} />
                  <span style={{ color }}>{idx + 1} Sao</span>
                </div>
              ))}
            </div>
          </div>

          <div className="catalog-grid">{catalogCards}</div>
        </section>
      </main>

      {/* FOOTER QUY CHUẨN THƯƠNG HIỆU */}
      <footer className="ulis-footer">
        <div className="footer-left">
          <strong>TRƯỜNG ĐẠI HỌC NGOẠI NGỮ – ĐẠI HỌC QUỐC GIA HÀ NỘI</strong>
          <span className="footer-booth-tag">CLB TIN HỌC ULIS IT • BOOTH CLUB DAY 2026</span>
        </div>
        <div className="footer-right">
          <span>Hệ thống quay thưởng chuyên dụng tại bàn tiếp đón sinh viên</span>
        </div>
      </footer>

      {/* MODAL INVENTORY & THỐNG KÊ (HỖ TRỢ BTC XEM TRẠNG THÁI 6 SAO, BUFF TỈ LỆ & ĐỐI CHIẾU SỐ SAO) */}
      <InventoryModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        history={history}
        onClearHistory={clearHistory}
        isSixStarClaimed={isSixStarClaimed}
        onResetSixStar={resetSixStarClaim}
        buffCounts={buffCounts}
        onBuffPrize={buffPrize}
        onUnbuffPrize={unbuffPrize}
        onResetPrizeBuff={resetPrizeBuff}
        totalBuffCount={totalBuffCount}
        forcedPrizeId={forcedPrizeId}
        onSetForcedPrize={setForcedPrize}
      />
    </div>
  );
}
