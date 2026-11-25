import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  ChevronDown,
  ChevronUp,
  CloudRainWind,
  Layers,
  Palette,
  WifiOff,
  X,
} from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ClimateOverlayState,
  CountryData,
  EnsoPhase,
  GeoCountryProperties,
  GeoLayerProperties,
  GeoLayerType,
  LayerVisibilityState,
  MapColorMode,
  PlaceEntry,
  SeasonalPhase,
} from '../../types/schema_v1';
import {
  GEO_LAYER_META,
  KOPPEN_13_COLORS,
  MAP_COLOR_MODES,
  RANK_FILL_COLORS,
} from '../../utils/constants';

export interface ThematicGridData {
  width: number;
  height: number;
  koppen: string[][];
  precip: number[][];
  elev: number[][];
  soil?: string[][];
}

interface PopupPhotoInfo {
  url: string;
  caption?: string;
  credit?: string;
}

interface PopupSubLegendItem {
  label: string;
  color: string;
}

interface WorldMapProps {
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  layersGeoJson: FeatureCollection<Geometry, GeoLayerProperties>;
  plateBoundariesGeoJson: FeatureCollection<Geometry>;
  citiesGeoJson: FeatureCollection<Geometry>;
  capitalsGeoJson: FeatureCollection<Geometry>;
  volcanoesGeoJson: FeatureCollection<Geometry>;
  climatePhenomenaGeoJson: FeatureCollection<Geometry>;
  thematicRegionsGeoJson: FeatureCollection<Geometry>;
  thematicGrid: ThematicGridData | null;
  countriesData: Record<string, CountryData>;
  selectedIso3: string | null;
  mapColorMode: MapColorMode;
  onChangeMapColorMode: (mode: MapColorMode) => void;
  highlightedIso3s: string[] | null;
  markedIso3s: string[];
  layerVisibility: LayerVisibilityState;
  onToggleLayer: (layerType: GeoLayerType) => void;
  climateOverlay: ClimateOverlayState;
  onChangeClimateOverlay: (next: ClimateOverlayState) => void;
  focusedPlace: PlaceEntry | null;
  flyToCountryRequest?: { iso3: string; nonce: number } | null;
  highlightBannerLabel?: string | null;
  mobileBottomOffsetVh?: number;
  onClearFocusedPlace: () => void;
  onClearSearchHighlight?: () => void;
  onSelectCountry: (iso3: string, fallbackNameEn?: string) => void;
}

interface LatTickItem {
  key: string;
  label: string;
  topPx: number;
  isEquator?: boolean;
  isSpecial?: boolean;
}

interface LngTickItem {
  key: string;
  label: string;
  leftPx: number;
  isPrime?: boolean;
}

interface EdgeTickState {
  latTicks: LatTickItem[];
  lngTicks: LngTickItem[];
}

interface HoveredInfo {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  subtitle?: string;
}

const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

maplibregl.setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);

const OFFLINE_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'ocean-background',
      type: 'background',
      paint: { 'background-color': '#dbeafe' },
    },
  ],
};

const REGIONAL_RASTER_MODES = [
  'koppen',
  'precipitation',
  'soil',
  'agriculture',
  'elevation',
  'religion',
  'language',
] as const;

const REGIONAL_RASTER_MODE_SET = new Set<string>(REGIONAL_RASTER_MODES);

const RASTER_COORDS: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
    [-180, 83],
    [180, 83],
    [180, -75],
    [-180, -75],
  ];

const PLATE_LAYER_IDS = [
  'plate-convergent',
  'plate-divergent',
  'plate-transform',
] as const;

const POINT_HIT_LAYERS = [
  'focus-place-point',
  'capitals-points',
  'capitals-minor-points',
  'volcanoes-points',
  'cities-climate-points',
  'layer-landform-point',
  'layer-strait-canal',
] as const;

const LINE_HIT_LAYERS = [
  'focus-place-line',
  'layer-mountain-new',
  'layer-mountain-old',
  'layer-river',
  'layer-ocean-current',
  ...PLATE_LAYER_IDS,
  'phenom-wind-line',
] as const;

const BASE_POLYGON_LAYERS = ['countries-fill', 'phenom-band-fill'] as const;

function getDynamicHitRadii(zoom: number): { pointR: number; lineR: number } {
  const pointR = Math.round(Math.min(11, Math.max(3, 2.2 + (zoom - 1) * 1.8)));
  const lineR = Math.round(Math.min(10, Math.max(2, 1.2 + (zoom - 1) * 1.9)));
  return { pointR, lineR };
}

function createStarImage(): ImageData {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#312e81';
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 6.5 : 2.8;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#4f46e5';
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

function createTriangleImage(fillColor: string): ImageData {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.moveTo(12, 3);
  ctx.lineTo(21, 19);
  ctx.lineTo(3, 19);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

function buildPhenomFilter(
  co: ClimateOverlayState,
  geomKind: 'band' | 'wind',
): maplibregl.FilterSpecification {
  const clauses: unknown[] = [];
  if (co.pressureWind) {
    clauses.push([
      'all',
      ['==', ['get', 'phenomGroup'], 'pressure_wind'],
      ['==', ['get', 'season'], co.season],
    ]);
  }
  if (co.monsoon) {
    const mSeason = co.season === 'avg' ? 'jul' : co.season;
    clauses.push([
      'all',
      ['==', ['get', 'phenomGroup'], 'monsoon'],
      ['==', ['get', 'season'], mSeason],
    ]);
  }
  if (co.enso) {
    clauses.push([
      'all',
      ['==', ['get', 'phenomGroup'], 'enso'],
      ['==', ['get', 'season'], co.ensoPhase],
    ]);
  }
  if (co.cyclone) {
    clauses.push(['==', ['get', 'phenomGroup'], 'cyclone']);
  }
  if (clauses.length === 0) {
    return ['==', ['get', 'phenomGroup'], '__none__'];
  }
  return [
    'all',
    ['==', ['get', 'geomKind'], geomKind],
    ['any', ...clauses],
  ] as unknown as maplibregl.FilterSpecification;
}

function lookupThematicGrid(
  grid: ThematicGridData | null,
  lng: number,
  lat: number,
): { koppen: string; precip: number; elev: number; soil: string } | null {
  if (!grid) return null;
  const normLng = ((((lng + 180) % 360) + 360) % 360);
  const col = Math.min(grid.width - 1, Math.max(0, Math.floor(normLng)));
  const row = Math.min(grid.height - 1, Math.max(0, Math.floor(90 - lat)));
  return {
    koppen: grid.koppen[row]?.[col] ?? '',
    precip: grid.precip[row]?.[col] ?? -1,
    elev: grid.elev[row]?.[col] ?? -9999,
    soil: grid.soil?.[row]?.[col] ?? '',
  };
}

function resolveShortestWorldLng(currentCenterLng: number, targetLng: number): number {
  const delta = (((targetLng - currentCenterLng + 540) % 360) + 360) % 360 - 180;
  return currentCenterLng + delta;
}

function getCountryZoomByArea(areaKm2: number): number {
  if (areaKm2 >= 5_000_000) return 3.0;
  if (areaKm2 >= 1_500_000) return 3.6;
  if (areaKm2 >= 400_000) return 4.3;
  if (areaKm2 >= 80_000) return 5.0;
  return 5.7;
}

function resolveCountryFlyTarget(
  iso3: string,
  countriesData: Record<string, CountryData>,
  capitalsGeoJson: FeatureCollection<Geometry>,
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>,
): { lng: number; lat: number; zoom: number } | null {
  const country = countriesData[iso3];
  const zoom = getCountryZoomByArea(country?.stats?.areaKm2 ?? 0);

  const topCity = country?.topCities?.[0];
  if (topCity && Number.isFinite(topCity.lng) && Number.isFinite(topCity.lat)) {
    return { lng: topCity.lng, lat: topCity.lat, zoom };
  }

  const climateCity = country?.climate?.cities?.[0];
  if (climateCity && Number.isFinite(climateCity.lng) && Number.isFinite(climateCity.lat)) {
    return { lng: climateCity.lng, lat: climateCity.lat, zoom };
  }

  const capFeat = capitalsGeoJson.features.find(
    (f) =>
      (f.properties as { iso3?: string } | null)?.iso3 === iso3 &&
      f.geometry?.type === 'Point',
  );
  if (capFeat && capFeat.geometry.type === 'Point') {
    const [lng, lat] = capFeat.geometry.coordinates;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return { lng, lat, zoom };
    }
  }

  const countryFeat = countriesGeoJson.features.find(
    (f) => f.properties?.iso3 === iso3,
  );
  if (!countryFeat?.geometry) return null;

  const rings: number[][][] =
    countryFeat.geometry.type === 'Polygon'
      ? [countryFeat.geometry.coordinates[0]]
      : countryFeat.geometry.type === 'MultiPolygon'
        ? countryFeat.geometry.coordinates.map((poly) => poly[0])
        : [];

  let bestScore = -1;
  let bestCenter: { lng: number; lat: number } | null = null;
  for (const ring of rings) {
    if (!ring || ring.length === 0) continue;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const pt of ring) {
      if (pt[0] < minLng) minLng = pt[0];
      if (pt[0] > maxLng) maxLng = pt[0];
      if (pt[1] < minLat) minLat = pt[1];
      if (pt[1] > maxLat) maxLat = pt[1];
    }
    const spanScore = (maxLng - minLng) * (maxLat - minLat);
    if (spanScore > bestScore) {
      bestScore = spanScore;
      bestCenter = {
        lng: (minLng + maxLng) / 2,
        lat: (minLat + maxLat) / 2,
      };
    }
  }
  return bestCenter ? { lng: bestCenter.lng, lat: bestCenter.lat, zoom } : null;
}

function isPlaceComfortablyInViewport(
  map: maplibregl.Map,
  container: HTMLDivElement,
  place: PlaceEntry,
  leftPanelOpen: boolean,
): number | null {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w < 60 || h < 60) return null;

  const padLeft = leftPanelOpen && w >= 768 ? Math.min(w * 0.42, 325) : Math.max(48, w * 0.13);
  const padRight = Math.max(48, w * 0.12);
  const padTop = Math.max(60, h * 0.12);
  const padBottom = Math.max(60, h * 0.12);

  const centerLng = map.getCenter().lng;
  const bestLng = resolveShortestWorldLng(centerLng, place.lng);
  const pt = map.project([bestLng, place.lat]);

  if (pt.x < padLeft || pt.x > w - padRight || pt.y < padTop || pt.y > h - padBottom) {
    return null;
  }

  if (place.bounds) {
    const [bw, bs, be, bn] = place.bounds;
    const shift = bestLng - place.lng;
    const sw = map.project([bw + shift, bs]);
    const ne = map.project([be + shift, bn]);
    // UIに隠れていないか＋対象範囲が小さすぎないかチェック
    if (sw.x < padLeft - 30 || ne.x > w - 12 || ne.y < 16 || sw.y > h - 16) {
      return null;
    }
    const pxW = Math.abs(ne.x - sw.x);
    const pxH = Math.abs(sw.y - ne.y);
    if (pxW < 55 && pxH < 45) {
      return null;
    }
  }
  return bestLng;
}

function openPopupDom(
  map: maplibregl.Map,
  popupRef: React.MutableRefObject<maplibregl.Popup | null>,
  lngLat: maplibregl.LngLatLike,
  badgeText: string,
  badgeClass: string,
  titleText: string,
  descText?: string,
  opts?: {
    actionBtn?: { label: string; onClick: () => void };
    extraButtons?: Array<{ label: string; onClick: () => void }>;
    photo?: PopupPhotoInfo;
    onZoomPhoto?: (photo: PopupPhotoInfo) => void;
    subLegend?: PopupSubLegendItem[];
  },
) {
  const dom = document.createElement('div');
  dom.className = 'text-xs text-slate-800 space-y-1.5 max-w-[280px]';

  if (opts?.photo?.url) {
    const fig = document.createElement('div');
    fig.className = 'overflow-hidden rounded-lg border border-slate-200 bg-slate-100';
    const img = document.createElement('img');
    img.src = opts.photo.url;
    img.alt = opts.photo.caption || titleText;
    img.referrerPolicy = 'no-referrer';
    img.className = 'h-28 w-full object-cover cursor-pointer hover:opacity-95 transition';
    img.onerror = () => {
      fig.remove();
    };
    if (opts.onZoomPhoto) {
      const pInfo = opts.photo;
      img.onclick = () => opts.onZoomPhoto?.(pInfo);
    }
    fig.appendChild(img);
    if (opts.photo.caption || opts.photo.credit) {
      const cap = document.createElement('div');
      cap.className = 'px-1.5 py-1 text-[10px] leading-tight text-slate-600 bg-white';
      cap.textContent = opts.photo.caption || opts.photo.credit || '';
      fig.appendChild(cap);
    }
    dom.appendChild(fig);
  }

  const badge = document.createElement('div');
  badge.className = `inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`;
  badge.textContent = badgeText;
  dom.appendChild(badge);

  const title = document.createElement('div');
  title.className = 'text-sm font-extrabold text-slate-900';
  title.textContent = titleText;
  dom.appendChild(title);

  if (opts?.subLegend && opts.subLegend.length > 0) {
    const legWrap = document.createElement('div');
    legWrap.className = 'flex flex-col gap-1 rounded bg-slate-50 p-1.5 border border-slate-200';
    for (const item of opts.subLegend) {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-700';
      const sw = document.createElement('span');
      sw.className = 'inline-block h-2.5 w-2.5 shrink-0 rounded-xs';
      sw.style.backgroundColor = item.color;
      row.appendChild(sw);
      const lbl = document.createElement('span');
      lbl.textContent = item.label;
      row.appendChild(lbl);
      legWrap.appendChild(row);
    }
    dom.appendChild(legWrap);
  }

  if (descText) {
    const desc = document.createElement('p');
    desc.className = 'leading-relaxed text-slate-600';
    desc.textContent = descText;
    dom.appendChild(desc);
  }

  if (opts?.extraButtons && opts.extraButtons.length > 0) {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-wrap items-center gap-1 pt-0.5';
    for (const eb of opts.extraButtons) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer';
      btn.textContent = eb.label;
      btn.onclick = () => {
        eb.onClick();
        popupRef.current?.remove();
      };
      wrap.appendChild(btn);
    }
    dom.appendChild(wrap);
  }

  if (opts?.actionBtn) {
    const ab = opts.actionBtn;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'mt-1 rounded bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer';
    btn.textContent = ab.label;
    btn.onclick = () => {
      ab.onClick();
      popupRef.current?.remove();
    };
    dom.appendChild(btn);
  }

  popupRef.current?.remove();
  popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 10, maxWidth: '300px' })
    .setLngLat(lngLat)
    .setDOMContent(dom)
    .addTo(map);
}

/**
 * MapLibre GL JS を用いたインタラクティブ世界地図コンポーネント
 */
export function WorldMap({
  countriesGeoJson,
  layersGeoJson,
  plateBoundariesGeoJson,
  citiesGeoJson,
  capitalsGeoJson,
  volcanoesGeoJson,
  climatePhenomenaGeoJson,
  thematicRegionsGeoJson,
  thematicGrid,
  countriesData,
  selectedIso3,
  mapColorMode,
  onChangeMapColorMode,
  highlightedIso3s,
  markedIso3s,
  layerVisibility,
  onToggleLayer,
  climateOverlay,
  onChangeClimateOverlay,
  focusedPlace,
  flyToCountryRequest,
  highlightBannerLabel,
  mobileBottomOffsetVh = 0,
  onClearFocusedPlace,
  onClearSearchHighlight,
  onSelectCountry,
}: WorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const isStyleReadyRef = useRef(false);
  const hoveredIdRef = useRef<number | string | null>(null);
  const pendingFlyToRef = useRef<{ iso3: string; nonce: number } | null>(null);
  const flyRafRef = useRef<number | null>(null);

  const onSelectCountryRef = useRef(onSelectCountry);

  const [hoveredInfo, setHoveredInfo] = useState<HoveredInfo | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [controlsOpen, setControlsOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
  );
  const controlsOpenRef = useRef(controlsOpen);
  const [climateMenuOpen, setClimateMenuOpen] = useState<boolean>(false);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const showGraticuleRef = useRef(showGraticule);
  const [edgeTicks, setEdgeTicks] = useState<EdgeTickState>({
    latTicks: [],
    lngTicks: [],
  });
  const [zoomPopupPhoto, setZoomPopupPhoto] = useState<PopupPhotoInfo | null>(null);
  const onZoomPhotoRef = useRef<(photo: PopupPhotoInfo) => void>((ph) => setZoomPopupPhoto(ph));

  const enrichedCountriesGeoJson = useMemo(() => {
    const highlightSet = highlightedIso3s ? new Set(highlightedIso3s) : null;
    const markedSet = new Set(markedIso3s);
    return {
      ...countriesGeoJson,
      features: countriesGeoJson.features.map((feat: Feature<Geometry, GeoCountryProperties>) => {
        const iso3 = feat.properties.iso3;
        const detail = countriesData[iso3];
        return {
          ...feat,
          properties: {
            ...feat.properties,
            rank: detail && !detail.isBasicEntry ? detail.examSummary.rank : detail ? 'C' : 'NONE',
            nameJa: detail ? detail.nameJa : feat.properties.nameJaNe || feat.properties.nameEn,
            hasData: Boolean(detail),
            isDetailed: Boolean(detail && !detail.isBasicEntry),
            appearanceCount: detail ? detail.examSummary.appearanceCount : 0,
            isMarked: markedSet.has(iso3),
            isHighlighted: highlightSet ? highlightSet.has(iso3) : false,
            isFilterActive: Boolean(highlightSet),
            populationDensity: detail?.stats?.populationDensity ?? -1,
            gdpPerCapitaUsd: detail?.stats?.gdpPerCapitaUsd ?? -1,
          },
        };
      }),
    };
  }, [countriesGeoJson, countriesData, markedIso3s, highlightedIso3s]);

  const enrichedGeoJsonRef = useRef(enrichedCountriesGeoJson);
  const layersGeoJsonRef = useRef(layersGeoJson);
  const plateBoundariesGeoJsonRef = useRef(plateBoundariesGeoJson);
  const citiesGeoJsonRef = useRef(citiesGeoJson);
  const capitalsGeoJsonRef = useRef(capitalsGeoJson);
  const volcanoesGeoJsonRef = useRef(volcanoesGeoJson);
  const climatePhenomenaGeoJsonRef = useRef(climatePhenomenaGeoJson);
  const thematicRegionsGeoJsonRef = useRef(thematicRegionsGeoJson);
  const thematicGridRef = useRef(thematicGrid);
  const colorModeRef = useRef(mapColorMode);
  const layerVisRef = useRef(layerVisibility);
  const climateOverlayRef = useRef(climateOverlay);
  const selectedIso3Ref = useRef(selectedIso3);
  const countriesDataRef = useRef(countriesData);
  const countriesGeoJsonRef = useRef(countriesGeoJson);
  const mobileBottomOffsetVhRef = useRef(mobileBottomOffsetVh);

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
  }, [onSelectCountry]);
  useEffect(() => {
    enrichedGeoJsonRef.current = enrichedCountriesGeoJson;
  }, [enrichedCountriesGeoJson]);
  useEffect(() => {
    layersGeoJsonRef.current = layersGeoJson;
  }, [layersGeoJson]);
  useEffect(() => {
    plateBoundariesGeoJsonRef.current = plateBoundariesGeoJson;
  }, [plateBoundariesGeoJson]);
  useEffect(() => {
    citiesGeoJsonRef.current = citiesGeoJson;
  }, [citiesGeoJson]);
  useEffect(() => {
    capitalsGeoJsonRef.current = capitalsGeoJson;
  }, [capitalsGeoJson]);
  useEffect(() => {
    volcanoesGeoJsonRef.current = volcanoesGeoJson;
  }, [volcanoesGeoJson]);
  useEffect(() => {
    climatePhenomenaGeoJsonRef.current = climatePhenomenaGeoJson;
  }, [climatePhenomenaGeoJson]);
  useEffect(() => {
    thematicRegionsGeoJsonRef.current = thematicRegionsGeoJson;
  }, [thematicRegionsGeoJson]);
  useEffect(() => {
    thematicGridRef.current = thematicGrid;
  }, [thematicGrid]);
  useEffect(() => {
    colorModeRef.current = mapColorMode;
  }, [mapColorMode]);
  useEffect(() => {
    showGraticuleRef.current = showGraticule;
  }, [showGraticule]);
  useEffect(() => {
    layerVisRef.current = layerVisibility;
  }, [layerVisibility]);
  useEffect(() => {
    climateOverlayRef.current = climateOverlay;
  }, [climateOverlay]);
  useEffect(() => {
    selectedIso3Ref.current = selectedIso3;
  }, [selectedIso3]);
  useEffect(() => {
    controlsOpenRef.current = controlsOpen;
  }, [controlsOpen]);
  useEffect(() => {
    countriesDataRef.current = countriesData;
  }, [countriesData]);
  useEffect(() => {
    countriesGeoJsonRef.current = countriesGeoJson;
  }, [countriesGeoJson]);
  useEffect(() => {
    mobileBottomOffsetVhRef.current = mobileBottomOffsetVh;
  }, [mobileBottomOffsetVh]);

  const executeFlyToCountry = (iso3: string) => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || !isStyleReadyRef.current) return;

    const target = resolveCountryFlyTarget(
      iso3,
      countriesDataRef.current,
      capitalsGeoJsonRef.current,
      countriesGeoJsonRef.current,
    );
    if (!target) return;

    popupRef.current?.remove();
    if (flyRafRef.current !== null) {
      window.cancelAnimationFrame(flyRafRef.current);
    }
    flyRafRef.current = window.requestAnimationFrame(() => {
      flyRafRef.current = null;
      const m = mapRef.current;
      const c = mapContainerRef.current;
      if (!m || !c || !isStyleReadyRef.current) return;

      m.resize();
      const curCenter = m.getCenter();
      const bestLng = resolveShortestWorldLng(curCenter.lng, target.lng);
      const distDeg = Math.hypot(bestLng - curCenter.lng, target.lat - curCenter.lat);
      const duration = Math.round(Math.min(1800, Math.max(950, 850 + distDeg * 7)));

      const isMobile = c.clientWidth < 768;
      const padding = isMobile
        ? {
            top: 48,
            left: 24,
            right: 24,
            bottom: Math.min(
              Math.round(c.clientHeight * 0.62),
              Math.round((window.innerHeight * mobileBottomOffsetVhRef.current) / 100) + 12,
            ),
          }
        : {
            top: 48,
            bottom: 40,
            left: controlsOpenRef.current ? 310 : 40,
            right: 40,
          };

      m.flyTo({
        center: [bestLng, target.lat],
        zoom: target.zoom,
        padding,
        duration,
        curve: 1.45,
        essential: true,
      });
    });
  };
  const executeFlyToCountryRef = useRef(executeFlyToCountry);
  useEffect(() => {
    executeFlyToCountryRef.current = executeFlyToCountry;
  });

  // 地図初期化
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: maplibregl.Map | null = null;
    const abortController = new AbortController();

    async function initMap() {
      let initialStyle: string | maplibregl.StyleSpecification = OFFLINE_FALLBACK_STYLE;
      let usingFallback = true;

      try {
        const timeoutId = window.setTimeout(() => abortController.abort(), 4000);
        const res = await fetch(OPENFREEMAP_STYLE_URL, { signal: abortController.signal });
        window.clearTimeout(timeoutId);
        if (res.ok) {
          initialStyle = (await res.json()) as maplibregl.StyleSpecification;
          usingFallback = false;
        }
      } catch {
        usingFallback = true;
      }

      if (cancelled || !container) return;
      setIsFallbackMode(usingFallback);

      map = new maplibregl.Map({
        container,
        style: initialStyle,
        center: [20, 20],
        zoom: 1.35,
        minZoom: 1,
        maxZoom: 8.5,
        attributionControl: false,
        renderWorldCopies: true,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      mapRef.current = map;

      map.on('style.load', () => {
        if (!map || cancelled) return;

        map.addImage('icon-capital', createStarImage());
        map.addImage('icon-volcano-subduction', createTriangleImage('#dc2626'));
        map.addImage('icon-volcano-divergent', createTriangleImage('#0284c7'));
        map.addImage('icon-volcano-hotspot', createTriangleImage('#9333ea'));

        const styleLayers = map.getStyle().layers ?? [];
        const firstSymbolId = styleLayers.find(
          (l: maplibregl.LayerSpecification) => l.type === 'symbol',
        )?.id;

        map.addSource('countries-source', {
          type: 'geojson',
          data: enrichedGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('thematic-regions-source', {
          type: 'geojson',
          data: thematicRegionsGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('geo-layers-source', {
          type: 'geojson',
          data: layersGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('plate-boundaries-source', {
          type: 'geojson',
          data: plateBoundariesGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('cities-climate-source', {
          type: 'geojson',
          data: citiesGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('capitals-source', {
          type: 'geojson',
          data: capitalsGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('volcanoes-source', {
          type: 'geojson',
          data: volcanoesGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('climate-phenomena-source', {
          type: 'geojson',
          data: climatePhenomenaGeoJsonRef.current as unknown as FeatureCollection,
        });
        map.addSource('focus-place-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addSource('graticule-source', {
          type: 'geojson',
          data: buildGraticuleGeoJson(),
        });

        // 地域単位の主題図7枚（PNGイメージソース：soil 追加・koppen 13区分）
        for (const mode of REGIONAL_RASTER_MODES) {
          map.addSource(`thematic-img-${mode}`, {
            type: 'image',
            url: `${import.meta.env.BASE_URL}data/thematic_${mode}_v1.png`,
            coordinates: RASTER_COORDS,
          });
        }

        map.addLayer(
          {
            id: 'countries-fill',
            type: 'fill',
            source: 'countries-source',
            paint: {
              'fill-color': getFillColorExpr(colorModeRef.current),
              'fill-opacity': getFillOpacityExpr(colorModeRef.current),
            },
          },
          firstSymbolId,
        );

        for (const mode of REGIONAL_RASTER_MODES) {
          const isVis = colorModeRef.current === mode;
          map.addLayer(
            {
              id: `thematic-raster-${mode}`,
              type: 'raster',
              source: `thematic-img-${mode}`,
              layout: { visibility: isVis ? 'visible' : 'none' },
              paint: {
                'raster-opacity': 0.84,
                'raster-resampling':
                  mode === 'elevation' || mode === 'precipitation' ? 'linear' : 'nearest',
              },
            },
            firstSymbolId,
          );
        }

        map.addLayer(
          {
            id: 'thematic-regions-fill',
            type: 'fill',
            source: 'thematic-regions-source',
            paint: { 'fill-opacity': 0 },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'countries-outline',
            type: 'line',
            source: 'countries-source',
            paint: {
              'line-color': '#64748b',
              'line-width': 0.8,
              'line-opacity': 0.72,
            },
          },
          firstSymbolId,
        );

        // 経緯線グリッド＋回帰線・本初子午線＋赤道（赤道は常に表示）
        map.addLayer(
          {
            id: 'graticule-grid',
            type: 'line',
            source: 'graticule-source',
            filter: ['==', ['get', 'kind'], 'graticule'],
            layout: {
              visibility: showGraticuleRef.current ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#475569',
              'line-width': 0.75,
              'line-opacity': 0.25,
            },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'graticule-special',
            type: 'line',
            source: 'graticule-source',
            filter: ['==', ['get', 'kind'], 'special_lat'],
            layout: {
              visibility: showGraticuleRef.current ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#d97706',
              'line-width': 1.0,
              'line-dasharray': [4, 4],
              'line-opacity': 0.55,
            },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'graticule-prime-meridian',
            type: 'line',
            source: 'graticule-source',
            filter: ['==', ['get', 'kind'], 'prime_meridian'],
            layout: {
              visibility: showGraticuleRef.current ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#475569',
              'line-width': 1.0,
              'line-dasharray': [5, 3],
              'line-opacity': 0.45,
            },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'graticule-equator',
            type: 'line',
            source: 'graticule-source',
            filter: ['==', ['get', 'kind'], 'equator'],
            layout: { visibility: 'visible' },
            paint: {
              'line-color': '#e11d48',
              'line-width': 1.9,
              'line-opacity': 0.9,
            },
          },
          firstSymbolId,
        );

        // 非破壊検索ハイライト（主題図や重要度塗りを消さず枠線＋薄色を重ねる）
        map.addLayer(
          {
            id: 'countries-search-tint',
            type: 'fill',
            source: 'countries-source',
            filter: ['==', ['get', 'isHighlighted'], true],
            paint: {
              'fill-color': '#06b6d4',
              'fill-opacity': 0.16,
            },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'countries-search-halo',
            type: 'line',
            source: 'countries-source',
            filter: ['==', ['get', 'isHighlighted'], true],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#ffffff',
              'line-width': 4.8,
              'line-opacity': 0.95,
            },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'countries-search-outline',
            type: 'line',
            source: 'countries-source',
            filter: ['==', ['get', 'isHighlighted'], true],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#0284c7',
              'line-width': 2.4,
              'line-opacity': 0.98,
            },
          },
          firstSymbolId,
        );

        map.addLayer(
          {
            id: 'countries-selected-outline',
            type: 'line',
            source: 'countries-source',
            filter: ['==', ['get', 'iso3'], selectedIso3Ref.current ?? ''],
            paint: {
              'line-color': '#312e81',
              'line-width': 2.8,
            },
          },
          firstSymbolId,
        );

        // 気象・大気大循環オーバーレイ
        const phenomBandFilter = buildPhenomFilter(climateOverlayRef.current, 'band');
        const phenomWindFilter = buildPhenomFilter(climateOverlayRef.current, 'wind');
        map.addLayer({
          id: 'phenom-band-fill',
          type: 'fill',
          source: 'climate-phenomena-source',
          filter: phenomBandFilter,
          paint: {
            'fill-color': [
              'match',
              ['get', 'subtype'],
              'low',
              '#ef4444',
              'high',
              '#f59e0b',
              'warm_water',
              '#dc2626',
              'warm_anomaly',
              '#dc2626',
              'warm_intense',
              '#b91c1c',
              'cold_upwell',
              '#2563eb',
              'cold_intense',
              '#1d4ed8',
              'dry_anomaly',
              '#b45309',
              'typhoon',
              '#0ea5e9',
              'hurricane',
              '#8b5cf6',
              'cyclone',
              '#ec4899',
              '#6366f1',
            ],
            'fill-opacity': 0.24,
          },
        });

        map.addLayer({
          id: 'phenom-band-outline',
          type: 'line',
          source: 'climate-phenomena-source',
          filter: phenomBandFilter,
          paint: {
            'line-color': [
              'match',
              ['get', 'subtype'],
              'high',
              '#d97706',
              'typhoon',
              '#0284c7',
              'hurricane',
              '#7c3aed',
              'cyclone',
              '#db2777',
              '#ef4444',
            ],
            'line-width': 1.5,
            'line-dasharray': [3, 2],
            'line-opacity': 0.75,
          },
        });

        map.addLayer({
          id: 'phenom-wind-line',
          type: 'line',
          source: 'climate-phenomena-source',
          filter: phenomWindFilter,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': [
              'match',
              ['get', 'subtype'],
              'westerlies',
              '#0284c7',
              'trade',
              '#16a34a',
              'trade_normal',
              '#16a34a',
              'trade_strong',
              '#15803d',
              'wind_el',
              '#ea580c',
              'monsoon_summer',
              '#e11d48',
              'monsoon_winter',
              '#2563eb',
              'typhoon',
              '#0369a1',
              'hurricane',
              '#6d28d9',
              'cyclone',
              '#be185d',
              '#0f172a',
            ],
            'line-width': 3.2,
            'line-opacity': 0.92,
          },
        });

        // プレート境界 3層
        map.addLayer({
          id: 'plate-convergent',
          type: 'line',
          source: 'plate-boundaries-source',
          filter: ['==', ['get', 'boundaryType'], 'convergent'],
          layout: {
            visibility: layerVisRef.current.plate_boundary ? 'visible' : 'none',
            'line-cap': 'round',
          },
          paint: { 'line-color': '#dc2626', 'line-width': 2.1, 'line-opacity': 0.85 },
        });

        map.addLayer({
          id: 'plate-divergent',
          type: 'line',
          source: 'plate-boundaries-source',
          filter: ['==', ['get', 'boundaryType'], 'divergent'],
          layout: {
            visibility: layerVisRef.current.plate_boundary ? 'visible' : 'none',
            'line-cap': 'round',
          },
          paint: { 'line-color': '#0284c7', 'line-width': 1.9, 'line-opacity': 0.8 },
        });

        map.addLayer({
          id: 'plate-transform',
          type: 'line',
          source: 'plate-boundaries-source',
          filter: ['==', ['get', 'boundaryType'], 'transform'],
          layout: { visibility: layerVisRef.current.plate_boundary ? 'visible' : 'none' },
          paint: {
            'line-color': '#d97706',
            'line-width': 1.7,
            'line-dasharray': [3, 2],
            'line-opacity': 0.85,
          },
        });

        // 海流（暖流赤・寒流青、実線＋方向矢じりジオメトリ）
        map.addLayer({
          id: 'layer-ocean-current',
          type: 'line',
          source: 'geo-layers-source',
          filter: ['==', ['get', 'layerType'], 'ocean_current'],
          layout: {
            visibility: layerVisRef.current.ocean_current ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': ['match', ['get', 'subType'], 'warm', '#e11d48', '#2563eb'],
            'line-width': 2.6,
            'line-opacity': 0.9,
          },
        });

        map.addLayer({
          id: 'layer-river',
          type: 'line',
          source: 'geo-layers-source',
          filter: ['==', ['get', 'layerType'], 'river'],
          layout: {
            visibility: layerVisRef.current.river ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: { 'line-color': '#0284c7', 'line-width': 2.4 },
        });

        map.addLayer({
          id: 'layer-mountain-new',
          type: 'line',
          source: 'geo-layers-source',
          filter: [
            'all',
            ['==', ['get', 'layerType'], 'mountain_range'],
            ['!=', ['get', 'subType'], 'old_orogenic'],
          ],
          layout: {
            visibility: layerVisRef.current.mountain_range ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: { 'line-color': '#9a3412', 'line-width': 3.8, 'line-opacity': 0.85 },
        });

        map.addLayer({
          id: 'layer-mountain-old',
          type: 'line',
          source: 'geo-layers-source',
          filter: [
            'all',
            ['==', ['get', 'layerType'], 'mountain_range'],
            ['==', ['get', 'subType'], 'old_orogenic'],
          ],
          layout: {
            visibility: layerVisRef.current.mountain_range ? 'visible' : 'none',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#b45309',
            'line-width': 3.3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.85,
          },
        });

        // 特徴的地形ポイント（沈水・カルスト・サンゴ礁・三角州で色分け）
        map.addLayer({
          id: 'layer-landform-point',
          type: 'circle',
          source: 'geo-layers-source',
          filter: ['==', ['get', 'layerType'], 'landform_point'],
          layout: { visibility: layerVisRef.current.landform_point ? 'visible' : 'none' },
          paint: {
            'circle-radius': 5.8,
            'circle-color': [
              'match',
              ['get', 'subType'],
              ['fjord', 'rias', 'estuary', 'dalmatian'],
              '#0891b2',
              'karst',
              '#7c3aed',
              'coral_reef',
              '#ec4899',
              'delta',
              '#059669',
              '#10b981',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.8,
          },
        });

        map.addLayer({
          id: 'layer-strait-canal',
          type: 'circle',
          source: 'geo-layers-source',
          filter: ['==', ['get', 'layerType'], 'strait_canal'],
          layout: { visibility: layerVisRef.current.strait_canal ? 'visible' : 'none' },
          paint: {
            'circle-radius': 5.8,
            'circle-color': '#d97706',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.8,
          },
        });

        // 87気候都市ポイント（厳密13区分対応カラー）
        map.addLayer({
          id: 'cities-climate-points',
          type: 'circle',
          source: 'cities-climate-source',
          layout: { visibility: colorModeRef.current === 'koppen' ? 'visible' : 'none' },
          paint: {
            'circle-radius': 5.5,
            'circle-color': [
              'match',
              ['get', 'koppen13'],
              'Af',
              KOPPEN_13_COLORS.Af,
              'Am',
              KOPPEN_13_COLORS.Am,
              'Aw',
              KOPPEN_13_COLORS.Aw,
              'BW',
              KOPPEN_13_COLORS.BW,
              'BS',
              KOPPEN_13_COLORS.BS,
              'Cs',
              KOPPEN_13_COLORS.Cs,
              'Cw',
              KOPPEN_13_COLORS.Cw,
              'Cfa',
              KOPPEN_13_COLORS.Cfa,
              'Cfb',
              KOPPEN_13_COLORS.Cfb,
              'Df',
              KOPPEN_13_COLORS.Df,
              'Dw',
              KOPPEN_13_COLORS.Dw,
              'ET',
              KOPPEN_13_COLORS.ET,
              'EF',
              KOPPEN_13_COLORS.EF,
              '#64748b',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.8,
          },
        });

        map.addLayer({
          id: 'capitals-points',
          type: 'symbol',
          source: 'capitals-source',
          filter: ['==', ['get', 'isPrimary60'], true],
          layout: {
            visibility: layerVisRef.current.capitals ? 'visible' : 'none',
            'icon-image': 'icon-capital',
            'icon-size': 0.85,
            'icon-allow-overlap': true,
          },
        });

        map.addLayer({
          id: 'capitals-minor-points',
          type: 'symbol',
          source: 'capitals-source',
          minzoom: 3.2,
          filter: ['!=', ['get', 'isPrimary60'], true],
          layout: {
            visibility: layerVisRef.current.capitals ? 'visible' : 'none',
            'icon-image': 'icon-capital',
            'icon-size': 0.65,
            'icon-allow-overlap': true,
          },
        });

        map.addLayer({
          id: 'volcanoes-points',
          type: 'symbol',
          source: 'volcanoes-source',
          layout: {
            visibility: layerVisRef.current.volcanoes ? 'visible' : 'none',
            'icon-image': [
              'match',
              ['get', 'volcanoType'],
              'hotspot',
              'icon-volcano-hotspot',
              'divergent',
              'icon-volcano-divergent',
              'icon-volcano-subduction',
            ],
            'icon-size': 0.92,
            'icon-allow-overlap': true,
          },
        });

        // 説明文地名ジャンプ・検索場所ハイライト層（個別色対応）
        map.addLayer({
          id: 'focus-place-fill',
          type: 'fill',
          source: 'focus-place-source',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: {
            'fill-color': ['coalesce', ['get', 'fillColor'], '#4f46e5'],
            'fill-opacity': 0.34,
          },
        });

        map.addLayer({
          id: 'focus-place-line',
          type: 'line',
          source: 'focus-place-source',
          filter: [
            'all',
            ['in', ['geometry-type'], ['literal', ['Polygon', 'LineString', 'MultiLineString']]],
            ['!=', ['get', 'lineDash'], true],
          ],
          paint: {
            'line-color': ['coalesce', ['get', 'fillColor'], '#f59e0b'],
            'line-width': ['coalesce', ['get', 'lineWidth'], 3.2],
          },
        });

        map.addLayer({
          id: 'focus-place-line-dash',
          type: 'line',
          source: 'focus-place-source',
          filter: [
            'all',
            ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
            ['==', ['get', 'lineDash'], true],
          ],
          paint: {
            'line-color': ['coalesce', ['get', 'fillColor'], '#dc2626'],
            'line-width': ['coalesce', ['get', 'lineWidth'], 4.2],
            'line-dasharray': [3, 2],
          },
        });

        map.addLayer({
          id: 'focus-place-point',
          type: 'circle',
          source: 'focus-place-source',
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'circle-radius': 11,
            'circle-color': '#f59e0b',
            'circle-opacity': 0.45,
            'circle-stroke-color': '#4f46e5',
            'circle-stroke-width': 3,
          },
        });

        isStyleReadyRef.current = true;
        setEdgeTicks(computeEdgeTicks(map, container, showGraticuleRef.current));
        if (pendingFlyToRef.current) {
          const pending = pendingFlyToRef.current;
          pendingFlyToRef.current = null;
          executeFlyToCountryRef.current(pending.iso3);
        }
      });

      map.on('move', () => {
        if (!map || !container || !isStyleReadyRef.current) return;
        setEdgeTicks(computeEdgeTicks(map, container, showGraticuleRef.current));
      });

      const queryHitLayerFirst = (point: maplibregl.Point) => {
        if (!map) return null;
        const { pointR, lineR } = getDynamicHitRadii(map.getZoom());

        const activePoints = POINT_HIT_LAYERS.filter((id) => Boolean(map?.getLayer(id)));
        if (activePoints.length > 0) {
          const pBox: [maplibregl.PointLike, maplibregl.PointLike] = [
            [point.x - pointR, point.y - pointR],
            [point.x + pointR, point.y + pointR],
          ];
          const pHits = map.queryRenderedFeatures(pBox, { layers: activePoints });
          if (pHits.length > 0) return pHits[0];
        }

        const activeLines = LINE_HIT_LAYERS.filter((id) => Boolean(map?.getLayer(id)));
        if (activeLines.length > 0) {
          const lBox: [maplibregl.PointLike, maplibregl.PointLike] = [
            [point.x - lineR, point.y - lineR],
            [point.x + lineR, point.y + lineR],
          ];
          const lHits = map.queryRenderedFeatures(lBox, { layers: activeLines });
          if (lHits.length > 0) return lHits[0];
        }

        const activeBase = BASE_POLYGON_LAYERS.filter((id) => Boolean(map?.getLayer(id)));
        const baseHits = map.queryRenderedFeatures(point, { layers: activeBase });
        return baseHits[0] ?? null;
      };

      map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
        if (!map || !isStyleReadyRef.current) return;
        const top = queryHitLayerFirst(e.point);

        if (!top) {
          map.getCanvas().style.cursor = '';
          if (hoveredIdRef.current !== null) {
            map.setFeatureState({ source: 'countries-source', id: hoveredIdRef.current }, { hover: false });
            hoveredIdRef.current = null;
          }
          setHoveredInfo(null);
          return;
        }

        map.getCanvas().style.cursor = 'pointer';
        const lid = top.layer.id;

        if (lid !== 'countries-fill' && hoveredIdRef.current !== null) {
          map.setFeatureState({ source: 'countries-source', id: hoveredIdRef.current }, { hover: false });
          hoveredIdRef.current = null;
        }

        if (lid === 'countries-fill') {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== top.id) {
            map.setFeatureState({ source: 'countries-source', id: hoveredIdRef.current }, { hover: false });
          }
          if (top.id !== undefined) {
            hoveredIdRef.current = top.id;
            map.setFeatureState({ source: 'countries-source', id: top.id }, { hover: true });
          }
          const props = top.properties as GeoCountryProperties & {
            nameJa?: string;
            rank?: string;
            hasData?: boolean;
            isDetailed?: boolean;
            isMarked?: boolean;
          };
          const cm = colorModeRef.current;
          let modeLabel = 'クリックで詳細を表示';
          if (cm === 'heatmap') {
            modeLabel = props.isDetailed
              ? `重要度ランク ${props.rank}（詳細収録）`
              : props.hasData
                ? '基礎データ収録（クリックで表示）'
                : '未収録';
          } else if (cm === 'marked') {
            modeLabel = props.isMarked ? '★ マーク済み' : '未マーク';
          } else if (cm === 'koppen' || cm === 'precipitation' || cm === 'elevation') {
            const gHit = lookupThematicGrid(thematicGridRef.current, e.lngLat.lng, e.lngLat.lat);
            if (cm === 'koppen') {
              modeLabel = `地点気候 ${gHit?.koppen || props.koppenMain || '-'}`;
            } else if (cm === 'precipitation') {
              const pVal = gHit && gHit.precip >= 0 ? gHit.precip : props.annualPrecipMm;
              modeLabel = `地点年降水量 約${pVal ?? '-'}mm`;
            } else {
              const eVal = gHit && gHit.elev > -9999 ? gHit.elev : props.meanElevationM;
              modeLabel = `地点標高 約${eVal ?? '-'}m`;
            }
          } else if (cm === 'soil') {
            const regFeats = map.queryRenderedFeatures(e.point, {
              layers: ['thematic-regions-fill'],
            });
            const regMatch = regFeats.find(
              (f) => (f.properties as { mode?: string })?.mode === 'soil',
            );
            if (regMatch) {
              const rp = regMatch.properties as { nameJa?: string };
              modeLabel = rp.nameJa ?? '-';
            } else {
              const gHit = lookupThematicGrid(thematicGridRef.current, e.lngLat.lng, e.lngLat.lat);
              modeLabel = `地点土壌：${gHit?.soil || '-'}`;
            }
          } else if (cm === 'agriculture' || cm === 'religion' || cm === 'language') {
            const regFeats = map.queryRenderedFeatures(e.point, {
              layers: ['thematic-regions-fill'],
            });
            const regMatch = regFeats.find(
              (f) => (f.properties as { mode?: string })?.mode === cm,
            );
            if (regMatch) {
              const rp = regMatch.properties as { nameJa?: string; category?: string };
              modeLabel = `${rp.nameJa ?? ''}（${rp.category ?? ''}）`;
            } else if (cm === 'agriculture') {
              modeLabel = props.agricultureMain ?? '-';
            } else if (cm === 'religion') {
              modeLabel = props.religionMain ?? '-';
            } else {
              modeLabel = props.languageFamilyMain ?? '-';
            }
          } else if (cm === 'population_density') {
            modeLabel =
              props.populationDensity !== undefined && props.populationDensity >= 0
                ? `人口密度：約${Number(props.populationDensity).toLocaleString()}人/km²`
                : 'データなし';
          } else if (cm === 'gdp_per_capita') {
            modeLabel =
              props.gdpPerCapitaUsd !== undefined && props.gdpPerCapitaUsd >= 0
                ? `1人あたりGDP：約$${Math.round(Number(props.gdpPerCapitaUsd)).toLocaleString()}`
                : 'データなし';
          }
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: props.nameJa || props.nameEn || '',
            subtitle: modeLabel,
          });
        } else if (lid === 'capitals-points' || lid === 'capitals-minor-points') {
          const p = top.properties as { nameJa?: string; countryNameJa?: string };
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: `★ 首都: ${p.nameJa ?? ''}`,
            subtitle: `${p.countryNameJa ?? ''}（クリックで詳細）`,
          });
        } else if (lid === 'volcanoes-points') {
          const p = top.properties as { nameJa?: string; volcanoTypeJa?: string };
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: `▲ 火山: ${p.nameJa ?? ''}`,
            subtitle: p.volcanoTypeJa ?? '',
          });
        } else if (lid === 'cities-climate-points') {
          const p = top.properties as { nameJa?: string; countryNameJa?: string; koppenCode?: string };
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: `${p.nameJa ?? ''}（${p.countryNameJa ?? ''}）`,
            subtitle: `気候区分 ${p.koppenCode ?? ''}（クリックで国詳細）`,
          });
        } else if (lid.startsWith('plate-')) {
          const p = top.properties as { name?: string; boundaryTypeJa?: string };
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: p.name ?? 'プレート境界',
            subtitle: `${p.boundaryTypeJa ?? ''}（クリックで詳細）`,
          });
        } else if (lid.startsWith('phenom-')) {
          const p = top.properties as { nameJa?: string };
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: p.nameJa ?? '気象現象',
            subtitle: 'クリックで成因・影響を表示',
          });
        } else if (lid.startsWith('focus-place')) {
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: '選択中の注目地点・地域',
            subtitle: 'クリックで解説を確認',
          });
        } else {
          const p = top.properties as Partial<GeoLayerProperties>;
          const meta = p.layerType ? GEO_LAYER_META[p.layerType] : undefined;
          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            containerWidth: container.clientWidth,
            title: p.nameJa ?? '自然・地形レイヤー',
            subtitle: p.subTypeJa || p.flowDirection
              ? `${p.subTypeJa ?? meta?.label ?? ''}（クリックで詳細・写真）`
              : `${meta?.label ?? ''}（クリックで詳細）`,
          });
        }
      });

      map.on('mouseout', () => {
        if (!map || !isStyleReadyRef.current) return;
        if (hoveredIdRef.current !== null) {
          map.setFeatureState({ source: 'countries-source', id: hoveredIdRef.current }, { hover: false });
          hoveredIdRef.current = null;
        }
        setHoveredInfo(null);
      });

      map.on('click', (e: maplibregl.MapMouseEvent) => {
        if (!map || !isStyleReadyRef.current) return;
        const top = queryHitLayerFirst(e.point);
        if (!top) return;

        const lid = top.layer.id;

        if (lid === 'countries-fill') {
          popupRef.current?.remove();
          const props = top.properties as { iso3?: string; nameEn?: string };
          if (props.iso3 && props.iso3 !== 'UNK') {
            onSelectCountryRef.current(props.iso3, props.nameEn);
          }
          return;
        }

        if (lid === 'capitals-points' || lid === 'capitals-minor-points') {
          const p = top.properties as { iso3?: string; nameJa?: string; countryNameJa?: string; note?: string };
          openPopupDom(
            map,
            popupRef,
            e.lngLat,
            `首都（${p.countryNameJa ?? ''}）`,
            'bg-indigo-100 text-indigo-800',
            p.nameJa ?? '',
            p.note,
            {
              actionBtn: p.iso3
                ? { label: `${p.countryNameJa ?? p.iso3} の詳細を開く`, onClick: () => onSelectCountryRef.current(p.iso3!) }
                : undefined,
            },
          );
          return;
        }

        if (lid === 'volcanoes-points') {
          const p = top.properties as {
            iso3?: string;
            nameJa?: string;
            volcanoTypeJa?: string;
            description?: string;
            photoUrl?: string;
            photoCaption?: string;
            photoCredit?: string;
          };
          openPopupDom(
            map,
            popupRef,
            e.lngLat,
            p.volcanoTypeJa ?? '火山',
            'bg-rose-100 text-rose-800',
            p.nameJa ?? '',
            p.description,
            {
              photo: p.photoUrl ? { url: p.photoUrl, caption: p.photoCaption, credit: p.photoCredit } : undefined,
              onZoomPhoto: onZoomPhotoRef.current,
              actionBtn: p.iso3
                ? { label: '所在国の詳細を見る', onClick: () => onSelectCountryRef.current(p.iso3!) }
                : undefined,
            },
          );
          return;
        }

        if (lid === 'cities-climate-points') {
          popupRef.current?.remove();
          const cProps = top.properties as { iso3?: string };
          if (cProps.iso3) onSelectCountryRef.current(cProps.iso3);
          return;
        }

        if (lid.startsWith('plate-')) {
          const p = top.properties as { name?: string; boundaryTypeJa?: string; description?: string };
          openPopupDom(
            map,
            popupRef,
            e.lngLat,
            p.boundaryTypeJa ?? 'プレート境界',
            'bg-red-50 text-red-700',
            p.name ?? 'プレート境界',
            p.description,
          );
          return;
        }

        if (lid.startsWith('phenom-')) {
          const p = top.properties as { nameJa?: string; description?: string };
          openPopupDom(
            map,
            popupRef,
            e.lngLat,
            '気象・大気大循環',
            'bg-sky-100 text-sky-800',
            p.nameJa ?? '',
            p.description,
          );
          return;
        }

        if (lid.startsWith('focus-place')) {
          const p = top.properties as {
            name?: string;
            category?: string;
            summary?: string;
            photoUrl?: string;
            photoCaption?: string;
            photoCredit?: string;
          };
          openPopupDom(
            map,
            popupRef,
            e.lngLat,
            p.category || '注目地点・地域',
            'bg-amber-100 text-amber-900',
            p.name || '注目地域',
            p.summary,
            {
              photo: p.photoUrl ? { url: p.photoUrl, caption: p.photoCaption, credit: p.photoCredit } : undefined,
              onZoomPhoto: onZoomPhotoRef.current,
            },
          );
          return;
        }

        // Physical geo-layers (river, mountain, ocean current, landform, strait)
        const props = top.properties as {
          layerType?: GeoLayerType;
          subTypeJa?: string;
          nameJa?: string;
          summary?: string;
          relatedCountries?: string | string[];
          photoUrl?: string;
          photoCaption?: string;
          photoCredit?: string;
        };

        let relatedList: string[] = [];
        if (Array.isArray(props.relatedCountries)) {
          relatedList = props.relatedCountries;
        } else if (typeof props.relatedCountries === 'string') {
          try {
            const parsed = JSON.parse(props.relatedCountries);
            if (Array.isArray(parsed)) relatedList = parsed;
          } catch {
            relatedList = [];
          }
        }

        const badgeLbl =
          props.subTypeJa ||
          (props.layerType ? GEO_LAYER_META[props.layerType].label : '地形');

        openPopupDom(
          map,
          popupRef,
          e.lngLat,
          badgeLbl,
          'bg-slate-100 text-slate-700',
          props.nameJa ?? '',
          props.summary,
          {
            photo: props.photoUrl
              ? { url: props.photoUrl, caption: props.photoCaption, credit: props.photoCredit }
              : undefined,
            onZoomPhoto: onZoomPhotoRef.current,
            extraButtons: relatedList.map((iso) => ({
              label: `関連国: ${iso}`,
              onClick: () => onSelectCountryRef.current(iso),
            })),
          },
        );
      });
    }

    initMap();

    const observer = new ResizeObserver(() => {
      const m = mapRef.current;
      if (!m) return;
      m.resize();
      if (isStyleReadyRef.current) {
        setEdgeTicks(computeEdgeTicks(m, container, showGraticuleRef.current));
      }
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      abortController.abort();
      observer.disconnect();
      isStyleReadyRef.current = false;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // 国ソース更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    const src = map.getSource('countries-source') as maplibregl.GeoJSONSource | undefined;
    src?.setData(enrichedCountriesGeoJson as unknown as FeatureCollection);
  }, [enrichedCountriesGeoJson]);

  // 主題図モード＆ラスタ表示切替（検索ハイライト中も主題図を消さない）
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current || !map.getLayer('countries-fill')) return;
    map.setPaintProperty('countries-fill', 'fill-color', getFillColorExpr(mapColorMode));
    map.setPaintProperty('countries-fill', 'fill-opacity', getFillOpacityExpr(mapColorMode));

    for (const mode of REGIONAL_RASTER_MODES) {
      const layerId = `thematic-raster-${mode}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          mapColorMode === mode ? 'visible' : 'none',
        );
      }
    }

    if (map.getLayer('cities-climate-points')) {
      map.setLayoutProperty(
        'cities-climate-points',
        'visibility',
        mapColorMode === 'koppen' ? 'visible' : 'none',
      );
    }
    if (map.getLayer('ne2_shaded')) {
      map.setPaintProperty(
        'ne2_shaded',
        'raster-opacity',
        mapColorMode === 'elevation' ? 0.35 : 0.14,
      );
    }
  }, [mapColorMode]);

  // 経緯線・回帰線グリッド ON/OFF（赤道ライン自体は常に表示を維持）
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    const vis = showGraticule ? 'visible' : 'none';
    for (const lid of ['graticule-grid', 'graticule-special', 'graticule-prime-meridian']) {
      if (map.getLayer(lid)) {
        map.setLayoutProperty(lid, 'visibility', vis);
      }
    }
  }, [showGraticule]);

  // 都市ポイントデータの更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    const src = map.getSource('cities-climate-source') as maplibregl.GeoJSONSource | undefined;
    src?.setData(citiesGeoJson);
  }, [citiesGeoJson]);

  // 選択国アウトライン更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current || !map.getLayer('countries-selected-outline')) return;
    map.setFilter('countries-selected-outline', ['==', ['get', 'iso3'], selectedIso3 ?? '']);
  }, [selectedIso3]);

  // 自然・地形・首都・火山レイヤー ON/OFF
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    const setVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };
    setVis('layer-mountain-new', layerVisibility.mountain_range);
    setVis('layer-mountain-old', layerVisibility.mountain_range);
    setVis('layer-river', layerVisibility.river);
    setVis('layer-ocean-current', layerVisibility.ocean_current);
    setVis('plate-convergent', layerVisibility.plate_boundary);
    setVis('plate-divergent', layerVisibility.plate_boundary);
    setVis('plate-transform', layerVisibility.plate_boundary);
    setVis('layer-landform-point', layerVisibility.landform_point);
    setVis('layer-strait-canal', layerVisibility.strait_canal);
    setVis('capitals-points', layerVisibility.capitals);
    setVis('capitals-minor-points', layerVisibility.capitals);
    setVis('volcanoes-points', layerVisibility.volcanoes);
  }, [layerVisibility]);

  // 気象・大気大循環オーバーレイ更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    const fBand = buildPhenomFilter(climateOverlay, 'band');
    const fWind = buildPhenomFilter(climateOverlay, 'wind');
    if (map.getLayer('phenom-band-fill')) {
      map.setFilter('phenom-band-fill', fBand);
    }
    if (map.getLayer('phenom-band-outline')) {
      map.setFilter('phenom-band-outline', fBand);
    }
    if (map.getLayer('phenom-wind-line')) {
      map.setFilter('phenom-wind-line', fWind);
    }
  }, [climateOverlay]);

  // 地名・注目地域ジャンプ＆スマートビューポート・距離連動カメラ移動
  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || !isStyleReadyRef.current) return;
    const src = map.getSource('focus-place-source') as maplibregl.GeoJSONSource | undefined;
    if (!focusedPlace) {
      src?.setData({ type: 'FeatureCollection', features: [] });
      popupRef.current?.remove();
      return;
    }

    const focusFeatures: Feature<Geometry>[] =
      focusedPlace.subFeatures && focusedPlace.subFeatures.length > 0
        ? focusedPlace.subFeatures.map((sf) => ({
          type: 'Feature',
          properties: {
            name: sf.label,
            category: focusedPlace.category,
            summary: focusedPlace.summary,
            fillColor: sf.fillColor,
            lineDash: Boolean(sf.lineDash),
            lineWidth: sf.lineWidth ?? null,
            photoUrl: focusedPlace.photoUrl,
            photoCaption: focusedPlace.photoCaption,
            photoCredit: focusedPlace.photoCredit,
          },
          geometry: sf.geometry,
        }))
        : [
          {
            type: 'Feature',
            properties: {
              name: focusedPlace.name,
              category: focusedPlace.category,
              summary: focusedPlace.summary,
              photoUrl: focusedPlace.photoUrl,
              photoCaption: focusedPlace.photoCaption,
              photoCredit: focusedPlace.photoCredit,
            },
            geometry: focusedPlace.geometry ?? {
              type: 'Point',
              coordinates: [focusedPlace.lng, focusedPlace.lat],
            },
          },
        ];

    src?.setData({
      type: 'FeatureCollection',
      features: focusFeatures,
    });

    if (focusedPlace.skipCameraMove) {
      popupRef.current?.remove();
      return;
    }

    map.resize();
    const curCenter = map.getCenter();
    const isLeftPanelCovering = controlsOpenRef.current && container.clientWidth >= 768;
    const visibleWorldLng = isPlaceComfortablyInViewport(
      map,
      container,
      focusedPlace,
      controlsOpenRef.current,
    );
    let targetLng = visibleWorldLng ?? resolveShortestWorldLng(curCenter.lng, focusedPlace.lng);

    if (visibleWorldLng === null) {
      const distDeg = Math.hypot(targetLng - curCenter.lng, focusedPlace.lat - curCenter.lat);
      const isNear = distDeg < 22;
      const isMid = distDeg < 60;
      const durationMs = isNear ? 240 : isMid ? 480 : 740;
      const camPadding = {
        top: 70,
        bottom: 70,
        left: isLeftPanelCovering ? 320 : 60,
        right: 60,
      };

      if (focusedPlace.bounds) {
        const [bw, bs, be, bn] = focusedPlace.bounds;
        const shift = targetLng - focusedPlace.lng;
        map.fitBounds(
          [
            [bw + shift, bs],
            [be + shift, bn],
          ],
          {
            padding: camPadding,
            maxZoom: 5.8,
            duration: durationMs,
            linear: isNear,
          },
        );
      } else if (isNear) {
        map.easeTo({
          center: [targetLng, focusedPlace.lat],
          zoom: Math.max(map.getZoom(), focusedPlace.zoom || 6.0),
          padding: camPadding,
          duration: durationMs,
        });
      } else {
        map.flyTo({
          center: [targetLng, focusedPlace.lat],
          zoom: focusedPlace.zoom || 6.0,
          padding: camPadding,
          duration: durationMs,
          curve: isMid ? 1.15 : 1.35,
          essential: true,
        });
      }
    } else {
      targetLng = visibleWorldLng;
    }

    const subLegend = focusedPlace.subFeatures?.map((sf) => ({
      label: sf.label,
      color: sf.fillColor,
    }));

    openPopupDom(
      map,
      popupRef,
      [targetLng, focusedPlace.lat],
      focusedPlace.category,
      'bg-amber-100 text-amber-900',
      focusedPlace.name,
      focusedPlace.summary,
      {
        photo: focusedPlace.photoUrl
          ? {
            url: focusedPlace.photoUrl,
            caption: focusedPlace.photoCaption,
            credit: focusedPlace.photoCredit,
          }
          : undefined,
        onZoomPhoto: onZoomPhotoRef.current,
        subLegend,
        actionBtn: { label: 'ハイライトを消す', onClick: () => onClearFocusedPlace() },
      },
    );
  }, [focusedPlace, onClearFocusedPlace]);

  // サイコロボタン等によるランダム国アニメーション飛行
  useEffect(() => {
    if (!flyToCountryRequest) return;
    if (!mapRef.current || !isStyleReadyRef.current) {
      pendingFlyToRef.current = flyToCountryRequest;
      return;
    }
    executeFlyToCountryRef.current(flyToCountryRequest.iso3);
  }, [flyToCountryRequest]);

  useEffect(() => {
    return () => {
      if (flyRafRef.current !== null) {
        window.cancelAnimationFrame(flyRafRef.current);
      }
    };
  }, []);

  const activeModeMeta =
    MAP_COLOR_MODES.find((m) => m.id === mapColorMode) ?? MAP_COLOR_MODES[0];

  const activeClimateCount =
    Number(climateOverlay.pressureWind) +
    Number(climateOverlay.monsoon) +
    Number(climateOverlay.enso) +
    Number(climateOverlay.cyclone);

  return (
    <div className="relative h-full w-full overflow-hidden bg-blue-50">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* 検索／統計ランキングヒット中バナー（主題図色を消さず枠線ハイライト） */}
      {highlightedIso3s && (
        <div className="absolute left-3 top-14 z-10 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full border border-cyan-400 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md backdrop-blur-xs md:left-1/2 md:top-3 md:max-w-lg md:-translate-x-1/2">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-cyan-600 bg-cyan-200" />
          <span className="truncate">
            {highlightBannerLabel
              ? `${highlightBannerLabel}（${highlightedIso3s.length}カ国）`
              : `検索一致: ${highlightedIso3s.length}カ国`}
          </span>
          {onClearSearchHighlight && (
            <button
              type="button"
              onClick={onClearSearchHighlight}
              className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
              aria-label="検索ハイライトを解除"
            >
              <X className="h-3 w-3" />
              解除
            </button>
          )}
        </div>
      )}

      {/* 右端：赤道・緯度目盛り（glyphs非依存のDOM表示） */}
      {edgeTicks.latTicks.map((t) => (
        <div
          key={t.key}
          style={{ top: `${t.topPx}px` }}
          className={`pointer-events-none absolute right-1.5 z-10 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[9.5px] leading-none shadow-2xs ${t.isEquator
            ? 'bg-rose-600/90 font-extrabold text-white'
            : t.isSpecial
              ? 'border border-amber-300/80 bg-amber-50/90 font-semibold text-amber-800'
              : 'border border-slate-300/70 bg-white/85 font-semibold text-slate-600'
            }`}
        >
          {t.label}
        </div>
      ))}

      {/* 下端（スマホでボトムシート表示時はシート直上）：経度目盛り */}
      {edgeTicks.lngTicks.map((t) => (
        <div
          key={t.key}
          style={{
            left: `${t.leftPx}px`,
            '--lng-bottom': mobileBottomOffsetVh > 0 ? `calc(${mobileBottomOffsetVh}vh + 6px)` : '4px',
          } as React.CSSProperties}
          className={`pointer-events-none absolute bottom-[var(--lng-bottom)] z-10 -translate-x-1/2 rounded px-1.5 py-0.5 font-mono text-[9.5px] leading-none shadow-2xs md:bottom-1 ${t.isPrime
            ? 'border border-slate-400/80 bg-white/92 font-extrabold text-slate-800'
            : 'border border-slate-300/70 bg-white/85 font-semibold text-slate-600'
            }`}
        >
          {t.label}
        </div>
      ))}

      {/* ホバーツールチップ（デスクトップ用） */}
      {hoveredInfo && (
        <div
          className="pointer-events-none absolute z-10 hidden max-w-[270px] rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-md backdrop-blur-xs md:block"
          style={{
            left: Math.min(hoveredInfo.x + 14, hoveredInfo.containerWidth - 280),
            top: Math.max(hoveredInfo.y - 44, 8),
          }}
        >
          <div className="truncate text-xs font-bold text-slate-900">{hoveredInfo.title}</div>
          {hoveredInfo.subtitle && (
            <div className="truncate text-[11px] text-slate-600">{hoveredInfo.subtitle}</div>
          )}
        </div>
      )}

      {/* 左上：レイヤー＆主題図折りたたみパネル */}
      <div className="absolute left-3 top-3 z-10 max-w-[260px] md:max-w-[300px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setControlsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-600" />
              地図レイヤー・主題図
            </span>
            {controlsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {controlsOpen && (
            <div className="max-h-[72vh] space-y-3 overflow-y-auto border-t border-slate-200 p-3 text-xs">
              {/* 主題図・塗り分けモード */}
              <div>
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Palette className="h-3.5 w-3.5 text-indigo-500" />
                  主題図・色分け表示
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-[11px]">
                  {MAP_COLOR_MODES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeMapColorMode(opt.id)}
                      className={`rounded-md px-1 py-1 font-bold transition ${mapColorMode === opt.id
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {opt.shortLabel}
                    </button>
                  ))}
                </div>

                {highlightedIso3s && (
                  <div className="mt-2 flex items-center justify-between gap-1.5 rounded bg-cyan-50 px-2 py-1 text-[11px] font-bold text-cyan-800">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-xs border border-cyan-600 bg-cyan-200" />
                      枠線ハイライト: {highlightedIso3s.length}件
                    </span>
                    {onClearSearchHighlight && (
                      <button
                        type="button"
                        onClick={onClearSearchHighlight}
                        className="rounded bg-white px-1.5 py-0.5 text-[10px] text-cyan-700 hover:bg-cyan-100"
                      >
                        解除
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-2 space-y-1.5">
                  <div className="text-[10px] leading-snug text-slate-500">
                    {activeModeMeta.subtitle}
                  </div>
                  {activeModeMeta.legend.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] text-slate-700">
                      {activeModeMeta.legend.map((item) => (
                        <div key={item.label} className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs border border-black/15"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 気象・大気大循環オーバーレイ（困ったときに重ね表示） */}
              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setClimateMenuOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-md bg-sky-50/80 px-2 py-1.5 text-[11px] font-bold text-sky-900 hover:bg-sky-100/80"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CloudRainWind className="h-3.5 w-3.5 text-sky-600" />
                    気象・大気大循環（重ね表示）
                    {activeClimateCount > 0 && (
                      <span className="rounded-full bg-sky-600 px-1.5 text-[10px] text-white">
                        {activeClimateCount}
                      </span>
                    )}
                  </span>
                  {climateMenuOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {climateMenuOpen && (
                  <div className="mt-2 space-y-2 rounded-lg border border-sky-100 bg-sky-50/40 p-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={climateOverlay.pressureWind}
                        onChange={() =>
                          onChangeClimateOverlay({
                            ...climateOverlay,
                            pressureWind: !climateOverlay.pressureWind,
                          })
                        }
                        className="h-3.5 w-3.5 rounded text-sky-600"
                      />
                      高圧帯・低圧帯・偏西風・貿易風
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={climateOverlay.monsoon}
                        onChange={() =>
                          onChangeClimateOverlay({
                            ...climateOverlay,
                            monsoon: !climateOverlay.monsoon,
                          })
                        }
                        className="h-3.5 w-3.5 rounded text-sky-600"
                      />
                      モンスーン（夏・冬の季節風）
                    </label>

                    {(climateOverlay.pressureWind || climateOverlay.monsoon) && (
                      <div className="pl-5">
                        <div className="mb-1 text-[10px] font-bold text-slate-500">
                          季節位置の切替（南北移動）
                        </div>
                        <div className="grid grid-cols-3 gap-1 rounded bg-white p-0.5 text-[10.5px]">
                          {(
                            [
                              { id: 'jan', label: '1月（北冬）' },
                              { id: 'avg', label: '春秋平均' },
                              { id: 'jul', label: '7月（北夏）' },
                            ] as { id: SeasonalPhase; label: string }[]
                          ).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                onChangeClimateOverlay({ ...climateOverlay, season: s.id })
                              }
                              className={`rounded py-1 font-bold ${climateOverlay.season === s.id
                                ? 'bg-sky-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={climateOverlay.enso}
                        onChange={() =>
                          onChangeClimateOverlay({
                            ...climateOverlay,
                            enso: !climateOverlay.enso,
                          })
                        }
                        className="h-3.5 w-3.5 rounded text-sky-600"
                      />
                      エルニーニョ／ラニーニャ現象
                    </label>

                    {climateOverlay.enso && (
                      <div className="pl-5">
                        <div className="grid grid-cols-3 gap-1 rounded bg-white p-0.5 text-[10px]">
                          {(
                            [
                              { id: 'normal', label: '平常時' },
                              { id: 'elnino', label: 'エルニーニョ' },
                              { id: 'lanina', label: 'ラニーニャ' },
                            ] as { id: EnsoPhase; label: string }[]
                          ).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() =>
                                onChangeClimateOverlay({ ...climateOverlay, ensoPhase: p.id })
                              }
                              className={`rounded py-1 font-bold ${climateOverlay.ensoPhase === p.id
                                ? 'bg-orange-500 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={climateOverlay.cyclone}
                        onChange={() =>
                          onChangeClimateOverlay({
                            ...climateOverlay,
                            cyclone: !climateOverlay.cyclone,
                          })
                        }
                        className="h-3.5 w-3.5 rounded text-sky-600"
                      />
                      台風・ハリケーン・サイクロン
                    </label>
                  </div>
                )}
              </div>

              {/* 自然・地形・首都・火山レイヤーON/OFF */}
              <div className="border-t border-slate-100 pt-2">
                <div className="mb-1.5 text-[11px] font-bold text-slate-500">
                  自然・地形・都市レイヤー（クリックで解説）
                </div>
                <div className="space-y-1">
                  {(Object.keys(GEO_LAYER_META) as GeoLayerType[]).map((key) => {
                    const meta = GEO_LAYER_META[key];
                    const checked = layerVisibility[key];
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-start gap-2 rounded-md p-1 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleLayer(key)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="truncate">{meta.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{meta.description}</div>
                        </div>
                      </label>
                    );
                  })}

                  <label className="flex cursor-pointer items-start gap-2 rounded-md border-t border-slate-100 p-1 pt-1.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showGraticule}
                      onChange={() => {
                        const next = !showGraticule;
                        setShowGraticule(next);
                        if (mapRef.current && mapContainerRef.current && isStyleReadyRef.current) {
                          setEdgeTicks(
                            computeEdgeTicks(mapRef.current, mapContainerRef.current, next),
                          );
                        }
                      }}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-rose-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600" />
                        <span className="truncate">経緯線・回帰線（赤道は常時表示）</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        回帰線(23.4°)・極圏(66.6°)・本初子午線・30°グリッド
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {isFallbackMode && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/95 px-2.5 py-1 text-[11px] font-medium text-amber-800 shadow-xs">
            <WifiOff className="h-3.5 w-3.5" />
            シンプル地図モード（GeoJSON描画）
          </div>
        )}
      </div>

      {/* 地図ポップアップ実写真の拡大モーダル */}
      {zoomPopupPhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setZoomPopupPhoto(null)}
        >
          <div
            className="max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomPopupPhoto.url}
              alt={zoomPopupPhoto.caption ?? ''}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-full object-contain bg-slate-900"
            />
            <div className="flex items-center justify-between gap-3 p-3 text-xs">
              <div>
                <div className="font-bold text-slate-900">{zoomPopupPhoto.caption}</div>
                {zoomPopupPhoto.credit && (
                  <div className="text-[11px] text-slate-500">{zoomPopupPhoto.credit}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setZoomPopupPhoto(null)}
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildGraticuleGeoJson(): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = [];

  const makeLatLine = (lat: number, kind: string, label: string) => {
    const coords: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 10) {
      coords.push([lon, lat]);
    }
    features.push({
      type: 'Feature',
      properties: { kind, label },
      geometry: { type: 'LineString', coordinates: coords },
    });
  };

  const makeLonLine = (lon: number, kind: string, label: string) => {
    const coords: [number, number][] = [];
    for (let lat = -85; lat <= 85; lat += 5) {
      coords.push([lon, lat]);
    }
    features.push({
      type: 'Feature',
      properties: { kind, label },
      geometry: { type: 'LineString', coordinates: coords },
    });
  };

  makeLatLine(0, 'equator', '赤道 (0°)');
  makeLatLine(23.436, 'special_lat', '北回帰線 (23.4°N)');
  makeLatLine(-23.436, 'special_lat', '南回帰線 (23.4°S)');
  makeLatLine(66.564, 'special_lat', '北極圏 (66.6°N)');
  makeLatLine(-66.564, 'special_lat', '南極圏 (66.6°S)');

  for (const lat of [-60, -30, 30, 60]) {
    makeLatLine(lat, 'graticule', `${Math.abs(lat)}°`);
  }

  makeLonLine(0, 'prime_meridian', '本初子午線 (0°)');
  for (const lon of [-150, -120, -90, -60, -30, 30, 60, 90, 120, 150, 180]) {
    makeLonLine(lon, 'graticule', `${lon}°`);
  }

  return { type: 'FeatureCollection', features };
}

function computeEdgeTicks(
  map: maplibregl.Map,
  container: HTMLDivElement,
  showGrid: boolean,
): EdgeTickState {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w <= 0 || h <= 0) return { latTicks: [], lngTicks: [] };

  const centerLng = map.getCenter().lng;
  const latDefs: { key: string; lat: number; label: string; isEquator?: boolean; isSpecial?: boolean }[] = [
    { key: 'eq', lat: 0, label: '赤道 0°', isEquator: true },
    { key: 'n30', lat: 30, label: '30°N' },
    { key: 's30', lat: -30, label: '30°S' },
    { key: 'n60', lat: 60, label: '60°N' },
    { key: 's60', lat: -60, label: '60°S' },
    { key: 'n23', lat: 23.436, label: '23.4°N', isSpecial: true },
    { key: 's23', lat: -23.436, label: '23.4°S', isSpecial: true },
  ];

  const latTicks: LatTickItem[] = [];
  for (const item of latDefs) {
    if (!item.isEquator && !showGrid) continue;
    const pt = map.project([centerLng, item.lat]);
    if (pt.y < 96 || pt.y > h - 38) continue;
    if (latTicks.some((existing) => Math.abs(existing.topPx - pt.y) < 20)) continue;
    latTicks.push({
      key: item.key,
      label: item.label,
      topPx: Math.round(pt.y),
      isEquator: item.isEquator,
      isSpecial: item.isSpecial,
    });
  }

  const lngTicks: LngTickItem[] = [];
  if (showGrid) {
    const lngDefs: { key: string; lng: number; label: string; isPrime?: boolean }[] = [
      { key: '0', lng: 0, label: '0°', isPrime: true },
      { key: 'e60', lng: 60, label: '60°E' },
      { key: 'e120', lng: 120, label: '120°E' },
      { key: '180', lng: 180, label: '180°' },
      { key: 'w120', lng: -120, label: '120°W' },
      { key: 'w60', lng: -60, label: '60°W' },
      { key: 'e30', lng: 30, label: '30°E' },
      { key: 'e90', lng: 90, label: '90°E' },
      { key: 'e150', lng: 150, label: '150°E' },
      { key: 'w150', lng: -150, label: '150°W' },
      { key: 'w90', lng: -90, label: '90°W' },
      { key: 'w30', lng: -30, label: '30°W' },
    ];
    const minLeft = 22;
    const maxRight = w - 38;
    for (const item of lngDefs) {
      for (const offset of [-360, 0, 360]) {
        const pt = map.project([item.lng + offset, 0]);
        if (pt.x < minLeft || pt.x > maxRight) continue;
        if (lngTicks.some((existing) => Math.abs(existing.leftPx - pt.x) < 44)) continue;
        lngTicks.push({
          key: `${item.key}_${offset}`,
          label: item.label,
          leftPx: Math.round(pt.x),
          isPrime: item.isPrime,
        });
      }
    }
  }

  return { latTicks, lngTicks };
}

function getFillColorExpr(colorMode: MapColorMode): maplibregl.ExpressionSpecification {
  if (colorMode === 'population_density') {
    return [
      'step',
      ['coalesce', ['get', 'populationDensity'], -1],
      '#e2e8f0',
      0,
      '#fef9c3',
      10,
      '#fde047',
      50,
      '#fb923c',
      150,
      '#f97316',
      300,
      '#dc2626',
      600,
      '#7f1d1d',
    ];
  }
  if (colorMode === 'gdp_per_capita') {
    return [
      'step',
      ['coalesce', ['get', 'gdpPerCapitaUsd'], -1],
      '#e2e8f0',
      0,
      '#fef2f2',
      2000,
      '#fde68a',
      6000,
      '#86efac',
      15000,
      '#2dd4bf',
      30000,
      '#2563eb',
      50000,
      '#312e81',
    ];
  }
  if (colorMode === 'marked') {
    return ['case', ['get', 'isMarked'], '#f59e0b', '#e2e8f0'];
  }
  if (colorMode === 'plain') {
    return ['case', ['get', 'isDetailed'], '#6366f1', '#cbd5e1'];
  }
  if (REGIONAL_RASTER_MODE_SET.has(colorMode)) {
    return ['case', ['get', 'hasData'], '#6366f1', '#cbd5e1'];
  }
  return [
    'match',
    ['get', 'rank'],
    'S',
    RANK_FILL_COLORS.S,
    'A',
    RANK_FILL_COLORS.A,
    'B',
    RANK_FILL_COLORS.B,
    'C',
    RANK_FILL_COLORS.C,
    RANK_FILL_COLORS.NONE,
  ];
}

function getFillOpacityExpr(colorMode: MapColorMode): maplibregl.ExpressionSpecification {
  if (colorMode === 'population_density' || colorMode === 'gdp_per_capita') {
    return ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.72];
  }
  if (REGIONAL_RASTER_MODE_SET.has(colorMode)) {
    return ['case', ['boolean', ['feature-state', 'hover'], false], 0.14, 0.01];
  }
  if (colorMode === 'plain') {
    return [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.42,
      ['get', 'isDetailed'],
      0.2,
      0.08,
    ];
  }
  if (colorMode === 'marked') {
    return [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.75,
      ['get', 'isMarked'],
      0.68,
      ['get', 'isDetailed'],
      0.16,
      0.06,
    ];
  }
  return [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    0.72,
    ['get', 'isDetailed'],
    0.55,
    0.22,
  ];
}
