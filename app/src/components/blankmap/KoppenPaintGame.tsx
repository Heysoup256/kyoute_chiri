import type { FeatureCollection, Geometry } from 'geojson';
import {
  CheckCircle2,
  Eraser,
  Eye,
  Hand,
  PaintBucket,
  Paintbrush,
  Repeat,
  RotateCcw,
  Trash2,
  Trophy,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KoppenBestRecord } from '../../hooks/useQuizStats';
import type { GeoCountryProperties } from '../../types/schema_v1';
import { KOPPEN_13_COLORS, KOPPEN_GROUP_COLORS } from '../../utils/constants';
import type { ThematicGridData } from '../map/WorldMap';
import {
  evaluateKoppenPaint,
  floodFillLand,
  getRegionGridBounds,
  KOPPEN_13_LABELS,
  KOPPEN_13_ORDER,
  KOPPEN_5_LABELS,
  KOPPEN_5_ORDER,
  koppenCodeToValue,
  PAINT_REGIONS,
  valueToGroupIndex,
  valueToKoppenCode,
  type KoppenEvaluationResult,
  type PaintGranularity,
} from './blankMapUtils';

type PaintTool = 'brush' | 'bucket' | 'eraser' | 'pan';
type CompareMode = 'user' | 'truth' | 'overlay' | 'diff';

interface KoppenPaintGameProps {
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  thematicGrid: ThematicGridData;
  bestScores: Record<string, KoppenBestRecord>;
  onRecordScore: (
    key: string,
    exactPct: number,
    groupPct: number,
    rank: 'S' | 'A' | 'B' | 'C' | 'D',
  ) => void;
}

interface InspectInfo {
  col: number;
  row: number;
  userCode: string;
  truthCode: string;
}

const BRUSH_RADII = [
  { id: 0, label: '細' },
  { id: 1, label: '中' },
  { id: 2, label: '太' },
  { id: 4, label: '極太' },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function KoppenPaintGame({
  countriesGeoJson,
  thematicGrid,
  bestScores,
  onRecordScore,
}: KoppenPaintGameProps) {
  const [regionId, setRegionId] = useState<string>('europe');
  const [granularity, setGranularity] = useState<PaintGranularity>('13');
  const [tool, setTool] = useState<PaintTool>('brush');
  const [brushRadius, setBrushRadius] = useState<number>(2);
  const [activeCode, setActiveCode] = useState<string>('Cs');
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [showLatGuides, setShowLatGuides] = useState<boolean>(true);

  const [phase, setPhase] = useState<'paint' | 'compare'>('paint');
  const [compareMode, setCompareMode] = useState<CompareMode>('user');
  const [overlayAlpha, setOverlayAlpha] = useState<number>(50);
  const [evalResult, setEvalResult] = useState<KoppenEvaluationResult | null>(null);
  const [inspectInfo, setInspectInfo] = useState<InspectInfo | null>(null);

  // 360x180 塗装グリッド（Uint8Array）
  const [userGrid, setUserGrid] = useState<Uint8Array>(() => new Uint8Array(360 * 180));
  const [undoStack, setUndoStack] = useState<Uint8Array[]>([]);
  const [viewTransform, setViewTransform] = useState<{ zoom: number; panX: number; panY: number }>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [canvasCssSize, setCanvasCssSize] = useState<{ w: number; h: number }>({ w: 600, h: 400 });

  // ポインター／マルチタッチ制御 Refs
  const userGridRef = useRef(userGrid);
  useEffect(() => {
    userGridRef.current = userGrid;
  }, [userGrid]);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    zoom: number;
    panX: number;
    panY: number;
  } | null>(null);
  const strokeRef = useRef<{
    active: boolean;
    lastCol: number;
    lastRow: number;
    snapshotPushed: boolean;
  }>({ active: false, lastCol: -1, lastRow: -1, snapshotPushed: false });
  const panDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
  }>({ active: false, startX: 0, startY: 0, origPanX: 0, origPanY: 0 });

  const activeRegion = useMemo(
    () => PAINT_REGIONS.find((r) => r.id === regionId) ?? PAINT_REGIONS[0],
    [regionId],
  );
  const gridBounds = useMemo(() => getRegionGridBounds(activeRegion), [activeRegion]);
  const gridW = gridBounds.colMax - gridBounds.colMin + 1;
  const gridH = gridBounds.rowMax - gridBounds.rowMin + 1;

  // 粒度切替時に選択色を対応する区分へ合わせる
  const handleChangeGranularity = (next: PaintGranularity) => {
    if (next === granularity) return;
    setGranularity(next);
    setActiveCode((prev) => {
      if (next === '5') return prev.charAt(0) || 'C';
      const firstMatch = KOPPEN_13_ORDER.find((c) => c.startsWith(prev.charAt(0)));
      return firstMatch ?? 'Cfa';
    });
    setUserGrid(new Uint8Array(360 * 180));
    setUndoStack([]);
    setPhase('paint');
    setEvalResult(null);
    setInspectInfo(null);
  };

  const handleSelectRegion = (nextRegionId: string) => {
    setRegionId(nextRegionId);
    setViewTransform({ zoom: 1, panX: 0, panY: 0 });
    setInspectInfo(null);
    if (phase === 'compare') {
      setPhase('paint');
      setEvalResult(null);
    }
  };

  // パレット色の RGB マップ事前計算
  const paletteRgbMap = useMemo(() => {
    const map: [number, number, number][] = [[255, 255, 255]];
    const order = granularity === '5' ? KOPPEN_5_ORDER : KOPPEN_13_ORDER;
    for (const code of order) {
      const hex = granularity === '5' ? KOPPEN_GROUP_COLORS[code] : KOPPEN_13_COLORS[code];
      map.push(hexToRgb(hex ?? '#cbd5e1'));
    }
    return map;
  }, [granularity]);

  // 国境線ポリゴンリング配列の事前抽出（再レンダリング高速化）
  const borderRings = useMemo(() => {
    const out: number[][][] = [];
    for (const feat of countriesGeoJson.features) {
      if (feat.properties?.iso3 === 'ATA' && regionId !== 'world') continue;
      const g = feat.geometry;
      if (!g) continue;
      if (g.type === 'Polygon') {
        for (const r of g.coordinates) out.push(r);
      } else if (g.type === 'MultiPolygon') {
        for (const poly of g.coordinates) {
          for (const r of poly) out.push(r);
        }
      }
    }
    return out;
  }, [countriesGeoJson, regionId]);

  // ResizeObserver でコンテナ実サイズ監視
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasCssSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 座標変換パラメータ
  const getProjection = useCallback(() => {
    const { w, h } = canvasCssSize;
    const baseScale = Math.max(1, Math.min((w - 20) / gridW, (h - 20) / gridH));
    const scale = baseScale * viewTransform.zoom;
    const cx = w / 2 + viewTransform.panX;
    const cy = h / 2 + viewTransform.panY;
    const leftX = cx - (gridW / 2) * scale;
    const topY = cy - (gridH / 2) * scale;
    return { w, h, scale, leftX, topY };
  }, [canvasCssSize, gridW, gridH, viewTransform]);

  const screenToGrid = useCallback(
    (clientX: number, clientY: number): { col: number; row: number; localX: number; localY: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const { scale, leftX, topY } = getProjection();
      const col = Math.floor((localX - leftX) / scale) + gridBounds.colMin;
      const row = Math.floor((localY - topY) / scale) + gridBounds.rowMin;
      return { col, row, localX, localY };
    },
    [getProjection, gridBounds],
  );

  // 対象地域内でのリアルタイム塗装進捗（%）
  const paintProgressPct = useMemo(() => {
    let total = 0;
    let painted = 0;
    for (let r = gridBounds.rowMin; r <= gridBounds.rowMax; r++) {
      const rowArr = thematicGrid.koppen[r];
      if (!rowArr) continue;
      for (let c = gridBounds.colMin; c <= gridBounds.colMax; c++) {
        if (!rowArr[c]) continue;
        total++;
        if (userGrid[r * 360 + c] > 0) painted++;
      }
    }
    return total > 0 ? Math.round((painted / total) * 100) : 0;
  }, [gridBounds, thematicGrid.koppen, userGrid]);

  // キャンバス描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { w, h, scale, leftX, topY } = getProjection();
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 全体背景（海）
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(0, 0, w, h);

    // オフスクリーン 1:1 グリッド画像生成
    const off = document.createElement('canvas');
    off.width = gridW;
    off.height = gridH;
    const offCtx = off.getContext('2d');
    if (offCtx) {
      const img = offCtx.createImageData(gridW, gridH);
      const buf = img.data;
      const effMode: CompareMode = phase === 'paint' ? 'user' : compareMode;
      const alpha = overlayAlpha / 100;

      for (let gr = 0; gr < gridH; gr++) {
        const r = gridBounds.rowMin + gr;
        const rowArr = thematicGrid.koppen[r];
        for (let gc = 0; gc < gridW; gc++) {
          const c = gridBounds.colMin + gc;
          const pIdx = (gr * gridW + gc) * 4;
          const truthCode = rowArr?.[c] ?? '';

          if (!truthCode) {
            // 海
            buf[pIdx] = 219;
            buf[pIdx + 1] = 234;
            buf[pIdx + 2] = 254;
            buf[pIdx + 3] = 255;
            continue;
          }

          const uVal = userGrid[r * 360 + c];
          const tVal = koppenCodeToValue(truthCode, granularity);
          let rgb: [number, number, number] = [255, 255, 255];

          if (effMode === 'user') {
            rgb = uVal > 0 ? (paletteRgbMap[uVal] ?? [255, 255, 255]) : [255, 255, 255];
          } else if (effMode === 'truth') {
            rgb = tVal > 0 ? (paletteRgbMap[tVal] ?? [255, 255, 255]) : [255, 255, 255];
          } else if (effMode === 'overlay') {
            const uRgb = uVal > 0 ? (paletteRgbMap[uVal] ?? [255, 255, 255]) : [248, 250, 252];
            const tRgb = tVal > 0 ? (paletteRgbMap[tVal] ?? [255, 255, 255]) : [248, 250, 252];
            rgb = [
              Math.round(uRgb[0] * (1 - alpha) + tRgb[0] * alpha),
              Math.round(uRgb[1] * (1 - alpha) + tRgb[1] * alpha),
              Math.round(uRgb[2] * (1 - alpha) + tRgb[2] * alpha),
            ];
          } else {
            // diff 差分正誤
            if (uVal === 0) {
              rgb = [203, 213, 225]; // 未塗装灰
            } else if (uVal === tVal) {
              rgb = [34, 197, 94]; // 完全一致 緑
            } else if (
              valueToGroupIndex(uVal, granularity) === valueToGroupIndex(tVal, granularity)
            ) {
              rgb = [250, 204, 21]; // 大区分一致 黄
            } else {
              rgb = [239, 68, 68]; // 不一致 赤
            }
          }

          buf[pIdx] = rgb[0];
          buf[pIdx + 1] = rgb[1];
          buf[pIdx + 2] = rgb[2];
          buf[pIdx + 3] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, leftX, topY, gridW * scale, gridH * scale);
    }

    // 対象領域枠線
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX, topY, gridW * scale, gridH * scale);

    // 国境線オーバーレイ（同座標系へ厳密投影）
    if (showBorders) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(leftX, topY, gridW * scale, gridH * scale);
      ctx.clip();

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.58)';
      ctx.lineWidth = Math.max(0.7, Math.min(1.4, scale * 0.11));
      ctx.beginPath();
      for (const ring of borderRings) {
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          const px = leftX + (lng + 180 - gridBounds.colMin) * scale;
          const py = topY + (90 - lat - gridBounds.rowMin) * scale;
          if (i === 0 || Math.abs(lng - ring[i - 1][0]) > 180) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 緯線ガイド（赤道・回帰線・30°/60°）
    if (showLatGuides) {
      const guides = [
        { lat: 0, label: '赤道 0°', color: '#e11d48', dash: [] as number[], width: 1.4 },
        { lat: 23.436, label: '23.4°N', color: '#d97706', dash: [5, 4], width: 1.0 },
        { lat: -23.436, label: '23.4°S', color: '#d97706', dash: [5, 4], width: 1.0 },
        { lat: 30, label: '30°N', color: '#64748b', dash: [2, 3], width: 0.8 },
        { lat: -30, label: '30°S', color: '#64748b', dash: [2, 3], width: 0.8 },
        { lat: 60, label: '60°N', color: '#64748b', dash: [2, 3], width: 0.8 },
      ];
      ctx.font = 'bold 10px monospace';
      for (const g of guides) {
        const gy = 90 - g.lat - gridBounds.rowMin;
        if (gy < 0 || gy > gridH) continue;
        const py = topY + gy * scale;
        ctx.save();
        ctx.strokeStyle = g.color;
        ctx.lineWidth = g.width;
        ctx.setLineDash(g.dash);
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, leftX), py);
        ctx.lineTo(Math.min(w, leftX + gridW * scale), py);
        ctx.stroke();
        ctx.fillStyle = g.color;
        ctx.globalAlpha = 0.9;
        ctx.fillText(g.label, Math.max(6, leftX + 4), py - 3);
        ctx.restore();
      }
    }

    // タップ確認セルのハイライトマーカー
    if (inspectInfo) {
      const ix = leftX + (inspectInfo.col - gridBounds.colMin) * scale;
      const iy = topY + (inspectInfo.row - gridBounds.rowMin) * scale;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix - 1, iy - 1, Math.max(4, scale) + 2, Math.max(4, scale) + 2);
    }
  }, [
    getProjection,
    gridW,
    gridH,
    gridBounds,
    thematicGrid.koppen,
    userGrid,
    granularity,
    paletteRgbMap,
    phase,
    compareMode,
    overlayAlpha,
    showBorders,
    showLatGuides,
    borderRings,
    inspectInfo,
  ]);

  const paintCircleOnGrid = useCallback(
    (grid: Uint8Array, c0: number, r0: number, val: number, rad: number): boolean => {
      let changed = false;
      for (let dr = -rad; dr <= rad; dr++) {
        const r = r0 + dr;
        if (r < gridBounds.rowMin || r > gridBounds.rowMax) continue;
        const rowArr = thematicGrid.koppen[r];
        if (!rowArr) continue;
        for (let dc = -rad; dc <= rad; dc++) {
          if (dr * dr + dc * dc > rad * rad + (rad > 0 ? 0.4 : 0)) continue;
          const c = c0 + dc;
          if (c < gridBounds.colMin || c > gridBounds.colMax) continue;
          if (!rowArr[c]) continue; // 海にははみ出さない自動マスク
          const idx = r * 360 + c;
          if (grid[idx] !== val) {
            grid[idx] = val;
            changed = true;
          }
        }
      }
      return changed;
    },
    [gridBounds, thematicGrid.koppen],
  );

  const pushUndoSnapshot = useCallback((snapshot: Uint8Array) => {
    setUndoStack((prev) => [...prev.slice(-29), snapshot]);
  }, []);

  const activePaintValue = useMemo(
    () => (tool === 'eraser' ? 0 : koppenCodeToValue(activeCode, granularity)),
    [tool, activeCode, granularity],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      // 2本指ピンチ・パンへ即移行
      strokeRef.current.active = false;
      panDragRef.current.active = false;
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRef.current = {
        dist: Math.max(10, dist),
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
        zoom: viewTransform.zoom,
        panX: viewTransform.panX,
        panY: viewTransform.panY,
      };
      return;
    }

    const pos = screenToGrid(e.clientX, e.clientY);
    if (!pos) return;

    if (phase === 'compare') {
      // 比較モードではパンまたはセルタップ解説
      const truthRaw = thematicGrid.koppen[pos.row]?.[pos.col] ?? '';
      if (
        truthRaw &&
        pos.col >= gridBounds.colMin &&
        pos.col <= gridBounds.colMax &&
        pos.row >= gridBounds.rowMin &&
        pos.row <= gridBounds.rowMax
      ) {
        const tVal = koppenCodeToValue(truthRaw, granularity);
        const uVal = userGridRef.current[pos.row * 360 + pos.col];
        setInspectInfo({
          col: pos.col,
          row: pos.row,
          userCode: uVal > 0 ? valueToKoppenCode(uVal, granularity) : '未塗装',
          truthCode: valueToKoppenCode(tVal, granularity),
        });
      }
      panDragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        origPanX: viewTransform.panX,
        origPanY: viewTransform.panY,
      };
      return;
    }

    if (tool === 'pan') {
      panDragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        origPanX: viewTransform.panX,
        origPanY: viewTransform.panY,
      };
      return;
    }

    if (tool === 'bucket') {
      const filled = floodFillLand(
        userGridRef.current,
        thematicGrid.koppen,
        pos.col,
        pos.row,
        activePaintValue,
        activeRegion,
      );
      if (filled) {
        pushUndoSnapshot(new Uint8Array(userGridRef.current));
        setUserGrid(filled);
      }
      return;
    }

    // ブラシ / 消しゴムストローク開始
    const snap = new Uint8Array(userGridRef.current);
    const next = new Uint8Array(snap);
    const changed = paintCircleOnGrid(next, pos.col, pos.row, activePaintValue, brushRadius);
    strokeRef.current = {
      active: true,
      lastCol: pos.col,
      lastRow: pos.row,
      snapshotPushed: changed,
    };
    if (changed) {
      pushUndoSnapshot(snap);
      setUserGrid(next);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.max(10, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const p0 = pinchStartRef.current;
      const nextZoom = Math.min(8, Math.max(0.85, p0.zoom * (dist / p0.dist)));
      setViewTransform({
        zoom: nextZoom,
        panX: p0.panX + (midX - p0.midX),
        panY: p0.panY + (midY - p0.midY),
      });
      return;
    }

    if (panDragRef.current.active) {
      const p = panDragRef.current;
      setViewTransform((v) => ({
        ...v,
        panX: p.origPanX + (e.clientX - p.startX),
        panY: p.origPanY + (e.clientY - p.startY),
      }));
      return;
    }

    if (!strokeRef.current.active || phase !== 'paint') return;
    const pos = screenToGrid(e.clientX, e.clientY);
    if (!pos) return;

    const { lastCol, lastRow } = strokeRef.current;
    const steps = Math.max(1, Math.abs(pos.col - lastCol), Math.abs(pos.row - lastRow));
    const before = userGridRef.current;
    const next = new Uint8Array(before);
    let anyChanged = false;
    for (let s = 0; s <= steps; s++) {
      const cc = Math.round(lastCol + ((pos.col - lastCol) * s) / steps);
      const rr = Math.round(lastRow + ((pos.row - lastRow) * s) / steps);
      if (paintCircleOnGrid(next, cc, rr, activePaintValue, brushRadius)) {
        anyChanged = true;
      }
    }
    strokeRef.current.lastCol = pos.col;
    strokeRef.current.lastRow = pos.row;
    if (anyChanged) {
      if (!strokeRef.current.snapshotPushed) {
        pushUndoSnapshot(new Uint8Array(before));
        strokeRef.current.snapshotPushed = true;
      }
      setUserGrid(next);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
    strokeRef.current.active = false;
    panDragRef.current.active = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setViewTransform((v) => ({
      ...v,
      zoom: Math.min(8, Math.max(0.85, Math.round(v.zoom * factor * 100) / 100)),
    }));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setUserGrid(last);
  };

  const handleClearRegion = () => {
    const snap = new Uint8Array(userGridRef.current);
    const next = new Uint8Array(snap);
    for (let r = gridBounds.rowMin; r <= gridBounds.rowMax; r++) {
      for (let c = gridBounds.colMin; c <= gridBounds.colMax; c++) {
        next[r * 360 + c] = 0;
      }
    }
    pushUndoSnapshot(snap);
    setUserGrid(next);
  };

  const handleEvaluate = () => {
    const res = evaluateKoppenPaint(userGridRef.current, thematicGrid.koppen, activeRegion, granularity);
    setEvalResult(res);
    setPhase('compare');
    setCompareMode('diff');
    setInspectInfo(null);
    onRecordScore(`${regionId}_${granularity}`, res.exactPct, res.groupPct, res.rank);
  };

  const paletteOrder = granularity === '5' ? KOPPEN_5_ORDER : KOPPEN_13_ORDER;
  const paletteLabels = granularity === '5' ? KOPPEN_5_LABELS : KOPPEN_13_LABELS;
  const scoreKey = `${regionId}_${granularity}`;
  const bestRec = bestScores[scoreKey];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50 lg:flex-row">
      {/* 上／左側：地域選択・ツール・パレット（または採点比較パネル） */}
      <div className="z-10 flex max-h-[42vh] shrink-0 flex-col border-b border-slate-200 bg-white lg:max-h-full lg:w-[370px] lg:border-b-0 lg:border-r">
        {/* 地域＆粒度ヘッダー */}
        <div className="space-y-2 border-b border-slate-200 p-2.5 md:p-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleChangeGranularity('5')}
                className={`rounded-md px-2 py-1 transition ${
                  granularity === '5' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                5大気候帯
              </button>
              <button
                type="button"
                onClick={() => handleChangeGranularity('13')}
                className={`rounded-md px-2 py-1 transition ${
                  granularity === '13' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                共テ13区分
              </button>
            </div>

            {bestRec && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                <Trophy className="h-3 w-3 text-amber-500" />
                自己ベスト {bestRec.exactPct}% ({bestRec.rank})
              </span>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5 text-[11px]">
            {PAINT_REGIONS.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => handleSelectRegion(reg.id)}
                className={`shrink-0 rounded-full border px-2.5 py-1 font-bold transition ${
                  regionId === reg.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {reg.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* 編集モード側コントロール */}
        {phase === 'paint' ? (
          <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5 md:p-3">
            {/* ツールボタン群 */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
              {(
                [
                  { id: 'brush', label: 'ブラシ', icon: Paintbrush },
                  { id: 'bucket', label: 'バケツ', icon: PaintBucket },
                  { id: 'eraser', label: '消しゴム', icon: Eraser },
                  { id: 'pan', label: '移動', icon: Hand },
                ] as { id: PaintTool; label: string; icon: typeof Paintbrush }[]
              ).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTool(t.id)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 transition ${
                      tool === t.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleUndo}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                title="1手戻す"
              >
                <Undo2 className="h-3.5 w-3.5" />
                戻す
              </button>
              <button
                type="button"
                onClick={handleClearRegion}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                title="現在の地域を全消去"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ブラシサイズ & 表示ガイド */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-500">太さ:</span>
                {BRUSH_RADII.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBrushRadius(b.id);
                      if (tool === 'pan' || tool === 'bucket') setTool('brush');
                    }}
                    className={`rounded border px-2 py-0.5 font-bold ${
                      brushRadius === b.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowBorders((v) => !v)}
                  className={`rounded border px-1.5 py-0.5 font-bold ${
                    showBorders ? 'border-slate-400 bg-slate-100 text-slate-800' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  国境
                </button>
                <button
                  type="button"
                  onClick={() => setShowLatGuides((v) => !v)}
                  className={`rounded border px-1.5 py-0.5 font-bold ${
                    showLatGuides ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  緯線
                </button>
              </div>
            </div>

            {/* 気候色パレット */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-500">
                  気候パレット（海にはみ出さず陸地だけ塗れます）
                </span>
                <span className="font-bold text-indigo-700">塗装率 {paintProgressPct}%</span>
              </div>
              <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-2">
                {paletteOrder.map((code) => {
                  const hex =
                    granularity === '5' ? KOPPEN_GROUP_COLORS[code] : KOPPEN_13_COLORS[code];
                  const selected = activeCode === code && tool !== 'eraser' && tool !== 'pan';
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setActiveCode(code);
                        if (tool === 'eraser' || tool === 'pan') setTool('brush');
                      }}
                      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-left transition ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-xs border border-black/20"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="truncate text-[11px] font-bold text-slate-800">
                        {code}{' '}
                        <span className="font-normal text-slate-500">
                          {paletteLabels[code]?.split('（')[0]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleEvaluate}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              塗り終わり・再現度を採点＆比較
            </button>
          </div>
        ) : (
          /* 採点＆重ね合わせポチポチ比較パネル */
          evalResult && (
            <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5 md:p-3">
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500">
                      {activeRegion.label}（{granularity === '5' ? '5大区分' : '13区分'}）再現度
                    </div>
                    <div className="text-2xl font-black text-indigo-700">
                      {evalResult.exactPct}%
                      <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                        ランク {evalResult.rank}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-slate-600">
                    <div>大区分一致：{evalResult.groupPct}%</div>
                    <div>塗装率：{evalResult.coveragePct}%</div>
                  </div>
                </div>
              </div>

              {/* ポチポチ比較トグル（押すたび自分の塗り ⇔ 正解を瞬時切替） */}
              <button
                type="button"
                onClick={() => setCompareMode((m) => (m === 'truth' ? 'user' : 'truth'))}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-extrabold shadow-xs transition active:scale-[0.98] ${
                  compareMode === 'truth'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-indigo-500 bg-indigo-50 text-indigo-900'
                }`}
              >
                <Repeat className="h-4 w-4" />
                ポチポチ比較：現在【
                {compareMode === 'truth'
                  ? '正解マップ'
                  : compareMode === 'user'
                    ? '自分の塗り'
                    : compareMode === 'overlay'
                      ? '重ね合わせ'
                      : '差分正誤'}
                】→ タップで交互切替
              </button>

              {/* 4表示切替タブ */}
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 text-[11px] font-bold">
                {(
                  [
                    { id: 'user', label: '自分の塗り' },
                    { id: 'truth', label: '正解マップ' },
                    { id: 'overlay', label: '重ね合わせ' },
                    { id: 'diff', label: '差分(正誤)' },
                  ] as { id: CompareMode; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCompareMode(tab.id)}
                    className={`rounded-md py-1.5 transition ${
                      compareMode === tab.id
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {compareMode === 'overlay' && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <div className="mb-1 flex items-center justify-between font-bold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-indigo-600" />
                      正解マップの重ね合わせ濃さ
                    </span>
                    <span>{overlayAlpha}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={overlayAlpha}
                    onChange={(e) => setOverlayAlpha(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {compareMode === 'diff' && (
                <div className="flex flex-wrap gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10.5px] font-bold text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-xs bg-green-500" /> 一致
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-xs bg-yellow-400" /> 大区分一致
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-xs bg-red-500" /> 不一致
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-xs bg-slate-300" /> 未塗装
                  </span>
                </div>
              )}

              {inspectInfo && (
                <div className="rounded-lg border border-cyan-300 bg-cyan-50 px-2.5 py-2 text-xs text-slate-800">
                  <div className="font-extrabold text-cyan-900">
                    タップ地点（{Math.round(89.5 - inspectInfo.row)}°N /{' '}
                    {Math.round(-179.5 + inspectInfo.col)}°E付近）
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span>
                      あなたの塗り：<b>{inspectInfo.userCode}</b>
                    </span>
                    <span>
                      正解：
                      <b className="text-indigo-700">
                        {inspectInfo.truthCode}（{paletteLabels[inspectInfo.truthCode]?.split('（')[0]}）
                      </b>
                    </span>
                  </div>
                </div>
              )}

              {/* 気候区分別の一致率リスト（苦手順） */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500">
                  気候区分別の一致率（苦手順／地図タップで正誤確認可）
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {evalResult.byCode.map((row) => (
                    <div
                      key={row.code}
                      className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px]"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-xs border border-black/15"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="w-24 shrink-0 truncate font-bold text-slate-800">
                        {row.code} {row.label.split('（')[0]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${row.exactPct}%` }}
                        />
                      </div>
                      <span className="w-11 text-right font-mono font-bold text-slate-700">
                        {row.exactPct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhase('paint')}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                >
                  続きを塗り直す
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClearRegion();
                    setPhase('paint');
                    setEvalResult(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> リセット
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* 下／右側：インタラクティブ Canvas */}
      <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden bg-blue-100">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className={`h-full w-full touch-none select-none ${
            phase === 'compare' || tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          }`}
        />

        {/* 右上ズームコントロール */}
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() =>
              setViewTransform((v) => ({ ...v, zoom: Math.min(8, Math.round(v.zoom * 1.3 * 100) / 100) }))
            }
            className="rounded-lg border border-slate-300 bg-white/95 p-1.5 text-slate-700 shadow-sm hover:bg-white"
            aria-label="拡大"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewTransform((v) => ({ ...v, zoom: Math.max(0.85, Math.round((v.zoom / 1.3) * 100) / 100) }))
            }
            className="rounded-lg border border-slate-300 bg-white/95 p-1.5 text-slate-700 shadow-sm hover:bg-white"
            aria-label="縮小"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewTransform({ zoom: 1, panX: 0, panY: 0 })}
            className="rounded-lg border border-slate-300 bg-white/95 px-1.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm hover:bg-white"
            title="視点リセット"
          >
            1:1
          </button>
        </div>

        {/* 比較モード時は右上以外にも簡単にポチポチできるフローティングバッジ */}
        {phase === 'compare' && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-300 bg-white/95 px-2.5 py-1 shadow-md backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setCompareMode((m) => (m === 'truth' ? 'user' : 'truth'))}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white active:scale-95"
            >
              <Repeat className="h-3.5 w-3.5" />
              {compareMode === 'truth' ? '正解表示中 ⇄ 自分の塗りへ' : '自分の塗り ⇄ 正解へ'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
