import type { Feature, FeatureCollection, Geometry } from 'geojson';
import * as maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoCountryProperties, GeoLayerProperties } from '../../types/schema_v1';

export type BlankFeatureCategory =
  | 'mountain_range'
  | 'river'
  | 'strait_canal'
  | 'landform_point'
  | 'ocean_current'
  | 'capitals_60'
  | 'capitals_all'
  | 'volcanoes'
  | 'mixed';

export type BlankMapCanvasMode =
  | 'country'
  | 'feature_select'
  | 'feature_pin'
  | 'climate_spot';

export interface PinOverlayData {
  userLng: number;
  userLat: number;
  targetLng: number;
  targetLat: number;
}

export interface SpotMarkerData {
  lng: number;
  lat: number;
}

export interface FlyTargetData {
  lng: number;
  lat: number;
  zoom: number;
  nonce: number;
}

export interface BoundsFitData {
  bounds: [number, number, number, number]; // [west, south, east, north]
  nonce: number;
}

interface BlankMapQuizCanvasProps {
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  layersGeoJson: FeatureCollection<Geometry, GeoLayerProperties>;
  capitalsGeoJson: FeatureCollection<Geometry>;
  volcanoesGeoJson: FeatureCollection<Geometry>;
  mode: BlankMapCanvasMode;
  featureCategory?: BlankFeatureCategory;
  /** クイズ内の選択対象となるfeatureIdのホワイトリスト（指定時はそれ以外非表示） */
  allowedFeatureIds?: Set<string> | null;
  countryColors?: Record<string, string>;
  featureColors?: Record<string, string>;
  /** ピン打ちモードなどで個別1件のみ回答後に表示する際 */
  revealedFeatureId?: string | null;
  pinOverlay?: PinOverlayData | null;
  spotMarker?: SpotMarkerData | null;
  flyTarget?: FlyTargetData | null;
  fitBoundsTarget?: BoundsFitData | null;
  showGraticule: boolean;
  onClickCountry?: (iso3: string) => void;
  onClickFeature?: (featureId: string) => void;
  onClickMapCoord?: (lng: number, lat: number) => void;
}

const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'ocean-bg',
      type: 'background',
      paint: { 'background-color': '#dbeafe' },
    },
  ],
};

function buildBlankGraticuleGeoJson(): FeatureCollection<Geometry> {
  const features: Feature<Geometry>[] = [];
  const makeLat = (lat: number, kind: string) => {
    const coords: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 10) coords.push([lon, lat]);
    features.push({
      type: 'Feature',
      properties: { kind },
      geometry: { type: 'LineString', coordinates: coords },
    });
  };
  const makeLon = (lon: number, kind: string) => {
    const coords: [number, number][] = [];
    for (let lat = -85; lat <= 85; lat += 5) coords.push([lon, lat]);
    features.push({
      type: 'Feature',
      properties: { kind },
      geometry: { type: 'LineString', coordinates: coords },
    });
  };
  makeLat(0, 'equator');
  makeLat(23.436, 'special');
  makeLat(-23.436, 'special');
  makeLat(66.564, 'special');
  makeLat(-66.564, 'special');
  for (const lat of [-60, -30, 30, 60]) makeLat(lat, 'grid');
  makeLon(0, 'prime');
  for (const lon of [-150, -120, -90, -60, -30, 30, 60, 90, 120, 150, 180]) makeLon(lon, 'grid');
  return { type: 'FeatureCollection', features };
}

function resolveShortestWorldLng(currentCenterLng: number, targetLng: number): number {
  const delta = (((targetLng - currentCenterLng + 540) % 360) + 360) % 360 - 180;
  return currentCenterLng + delta;
}

interface TickState {
  latTicks: { key: string; label: string; topPx: number; isEquator?: boolean; isSpecial?: boolean }[];
  lngTicks: { key: string; label: string; leftPx: number; isPrime?: boolean }[];
}

function computeEdgeTicks(
  map: maplibregl.Map,
  container: HTMLDivElement,
  showGrid: boolean,
): TickState {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w <= 0 || h <= 0) return { latTicks: [], lngTicks: [] };
  const cLng = map.getCenter().lng;

  const latDefs = [
    { key: 'eq', lat: 0, label: '赤道 0°', isEquator: true },
    { key: 'n23', lat: 23.436, label: '23.4°N', isSpecial: true },
    { key: 's23', lat: -23.436, label: '23.4°S', isSpecial: true },
    { key: 'n30', lat: 30, label: '30°N' },
    { key: 's30', lat: -30, label: '30°S' },
    { key: 'n60', lat: 60, label: '60°N' },
    { key: 's60', lat: -60, label: '60°S' },
  ];
  const latTicks: TickState['latTicks'] = [];
  for (const d of latDefs) {
    if (!d.isEquator && !showGrid) continue;
    const pt = map.project([cLng, d.lat]);
    if (pt.y < 36 || pt.y > h - 28) continue;
    if (latTicks.some((e) => Math.abs(e.topPx - pt.y) < 18)) continue;
    latTicks.push({
      key: d.key,
      label: d.label,
      topPx: Math.round(pt.y),
      isEquator: d.isEquator,
      isSpecial: d.isSpecial,
    });
  }

  const lngTicks: TickState['lngTicks'] = [];
  if (showGrid) {
    const lngDefs = [
      { key: '0', lng: 0, label: '0°', isPrime: true },
      { key: 'e60', lng: 60, label: '60°E' },
      { key: 'e120', lng: 120, label: '120°E' },
      { key: '180', lng: 180, label: '180°' },
      { key: 'w120', lng: -120, label: '120°W' },
      { key: 'w60', lng: -60, label: '60°W' },
    ];
    for (const d of lngDefs) {
      for (const offset of [-360, 0, 360]) {
        const pt = map.project([d.lng + offset, 0]);
        if (pt.x < 24 || pt.x > w - 32) continue;
        if (lngTicks.some((e) => Math.abs(e.leftPx - pt.x) < 44)) continue;
        lngTicks.push({
          key: `${d.key}_${offset}`,
          label: d.label,
          leftPx: Math.round(pt.x),
          isPrime: d.isPrime,
        });
      }
    }
  }
  return { latTicks, lngTicks };
}

export function BlankMapQuizCanvas({
  countriesGeoJson,
  layersGeoJson,
  capitalsGeoJson,
  volcanoesGeoJson,
  mode,
  featureCategory = 'mixed',
  allowedFeatureIds = null,
  countryColors = {},
  featureColors = {},
  revealedFeatureId = null,
  pinOverlay = null,
  spotMarker = null,
  flyTarget = null,
  fitBoundsTarget = null,
  showGraticule,
  onClickCountry,
  onClickFeature,
  onClickMapCoord,
}: BlankMapQuizCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const hoverCountryIdRef = useRef<number | string | null>(null);

  const [edgeTicks, setEdgeTicks] = useState<TickState>({ latTicks: [], lngTicks: [] });

  const modeRef = useRef(mode);
  const onClickCountryRef = useRef(onClickCountry);
  const onClickFeatureRef = useRef(onClickFeature);
  const onClickMapCoordRef = useRef(onClickMapCoord);
  const showGraticuleRef = useRef(showGraticule);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    onClickCountryRef.current = onClickCountry;
  }, [onClickCountry]);
  useEffect(() => {
    onClickFeatureRef.current = onClickFeature;
  }, [onClickFeature]);
  useEffect(() => {
    onClickMapCoordRef.current = onClickMapCoord;
  }, [onClickMapCoord]);
  useEffect(() => {
    showGraticuleRef.current = showGraticule;
  }, [showGraticule]);

  // 国ポリゴンソース（色マッピング付き、文字情報ゼロ）
  const styledCountriesGeoJson = useMemo<FeatureCollection<Geometry>>(() => {
    return {
      type: 'FeatureCollection',
      features: countriesGeoJson.features
        .filter((f) => f.properties?.iso3 !== 'ATA')
        .map((f, idx) => {
          const iso = f.properties?.iso3 ?? '';
          const color = countryColors[iso];
          return {
            type: 'Feature',
            id: idx + 1,
            properties: {
              iso3: iso,
              quizColor: color ?? '#ffffff',
              hasCustomColor: Boolean(color),
            },
            geometry: f.geometry,
          };
        }),
    };
  }, [countriesGeoJson, countryColors]);

  // 無記名地物（山脈・河川・海流・海峡・地形・首都・火山）ソース
  const { lineFeaturesGeoJson, pointFeaturesGeoJson } = useMemo(() => {
    const lineFeats: Feature<Geometry>[] = [];
    const pointFeats: Feature<Geometry>[] = [];

    const matchesCategory = (fid: string, ltype: string, isPrimary60?: boolean) => {
      if (revealedFeatureId && fid === revealedFeatureId) return true;
      if (mode === 'feature_pin' && !revealedFeatureId) return false;
      if (mode === 'country' || mode === 'climate_spot') return false;
      if (allowedFeatureIds && !allowedFeatureIds.has(fid)) return false;

      if (featureCategory === 'mixed') {
        return ['mountain_range', 'river', 'strait_canal', 'landform_point'].includes(ltype);
      }
      if (featureCategory === 'capitals_60') {
        return ltype === 'capitals' && Boolean(isPrimary60);
      }
      if (featureCategory === 'capitals_all') {
        return ltype === 'capitals';
      }
      return ltype === featureCategory;
    };

    for (const f of layersGeoJson.features) {
      const p = f.properties;
      const fid = p.id;
      if (!matchesCategory(fid, p.layerType)) continue;
      const customColor = featureColors[fid];
      const baseColor =
        customColor ??
        (p.layerType === 'mountain_range'
          ? '#b45309'
          : p.layerType === 'river'
            ? '#0284c7'
            : p.layerType === 'ocean_current'
              ? p.flowDirection === 'cold'
                ? '#2563eb'
                : '#e11d48'
              : p.layerType === 'strait_canal'
                ? '#d97706'
                : '#059669');
      const wrapped: Feature<Geometry> = {
        type: 'Feature',
        properties: {
          quizId: fid,
          quizColor: baseColor,
          highlighted: Boolean(customColor || revealedFeatureId === fid),
          layerType: p.layerType,
        },
        geometry: f.geometry,
      };
      if (f.geometry.type === 'Point') pointFeats.push(wrapped);
      else lineFeats.push(wrapped);
    }

    for (const f of capitalsGeoJson.features) {
      const p = (f.properties ?? {}) as { id?: string; isPrimary60?: boolean };
      const fid = p.id ?? '';
      if (!fid || !matchesCategory(fid, 'capitals', p.isPrimary60)) continue;
      const customColor = featureColors[fid];
      pointFeats.push({
        type: 'Feature',
        properties: {
          quizId: fid,
          quizColor: customColor ?? '#4f46e5',
          highlighted: Boolean(customColor || revealedFeatureId === fid),
          layerType: 'capitals',
        },
        geometry: f.geometry,
      });
    }

    for (const f of volcanoesGeoJson.features) {
      const p = (f.properties ?? {}) as { id?: string };
      const fid = p.id ?? '';
      if (!fid || !matchesCategory(fid, 'volcanoes')) continue;
      const customColor = featureColors[fid];
      pointFeats.push({
        type: 'Feature',
        properties: {
          quizId: fid,
          quizColor: customColor ?? '#dc2626',
          highlighted: Boolean(customColor || revealedFeatureId === fid),
          layerType: 'volcanoes',
        },
        geometry: f.geometry,
      });
    }

    return {
      lineFeaturesGeoJson: { type: 'FeatureCollection', features: lineFeats } as FeatureCollection<Geometry>,
      pointFeaturesGeoJson: { type: 'FeatureCollection', features: pointFeats } as FeatureCollection<Geometry>,
    };
  }, [
    layersGeoJson,
    capitalsGeoJson,
    volcanoesGeoJson,
    mode,
    featureCategory,
    allowedFeatureIds,
    featureColors,
    revealedFeatureId,
  ]);

  const pinOverlayGeoJson = useMemo<FeatureCollection<Geometry>>(() => {
    if (!pinOverlay) return { type: 'FeatureCollection', features: [] };
    const uLng = resolveShortestWorldLng(pinOverlay.targetLng, pinOverlay.userLng);
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { kind: 'line' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [uLng, pinOverlay.userLat],
              [pinOverlay.targetLng, pinOverlay.targetLat],
            ],
          },
        },
        {
          type: 'Feature',
          properties: { kind: 'user' },
          geometry: { type: 'Point', coordinates: [pinOverlay.userLng, pinOverlay.userLat] },
        },
        {
          type: 'Feature',
          properties: { kind: 'target' },
          geometry: { type: 'Point', coordinates: [pinOverlay.targetLng, pinOverlay.targetLat] },
        },
      ],
    };
  }, [pinOverlay]);

  const spotGeoJson = useMemo<FeatureCollection<Geometry>>(() => {
    if (!spotMarker) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [spotMarker.lng, spotMarker.lat] },
        },
      ],
    };
  }, [spotMarker]);

  const countriesInitRef = useRef(styledCountriesGeoJson);
  const linesInitRef = useRef(lineFeaturesGeoJson);
  const pointsInitRef = useRef(pointFeaturesGeoJson);
  const pinInitRef = useRef(pinOverlayGeoJson);
  const spotInitRef = useRef(spotGeoJson);
  useEffect(() => {
    countriesInitRef.current = styledCountriesGeoJson;
  }, [styledCountriesGeoJson]);
  useEffect(() => {
    linesInitRef.current = lineFeaturesGeoJson;
  }, [lineFeaturesGeoJson]);
  useEffect(() => {
    pointsInitRef.current = pointFeaturesGeoJson;
  }, [pointFeaturesGeoJson]);
  useEffect(() => {
    pinInitRef.current = pinOverlayGeoJson;
  }, [pinOverlayGeoJson]);
  useEffect(() => {
    spotInitRef.current = spotGeoJson;
  }, [spotGeoJson]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: BLANK_STYLE,
      center: [18, 22],
      zoom: 1.25,
      minZoom: 0.9,
      maxZoom: 8.5,
      attributionControl: false,
      renderWorldCopies: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('blank-countries', {
        type: 'geojson',
        data: countriesInitRef.current,
      });
      map.addSource('blank-graticule', {
        type: 'geojson',
        data: buildBlankGraticuleGeoJson(),
      });
      map.addSource('blank-lines', {
        type: 'geojson',
        data: linesInitRef.current,
      });
      map.addSource('blank-points', {
        type: 'geojson',
        data: pointsInitRef.current,
      });
      map.addSource('blank-pin-overlay', {
        type: 'geojson',
        data: pinInitRef.current,
      });
      map.addSource('blank-spot', {
        type: 'geojson',
        data: spotInitRef.current,
      });

      map.addLayer({
        id: 'blank-countries-fill',
        type: 'fill',
        source: 'blank-countries',
        paint: {
          'fill-color': [
            'case',
            ['get', 'hasCustomColor'],
            ['get', 'quizColor'],
            ['boolean', ['feature-state', 'hover'], false],
            '#e0f2fe',
            '#ffffff',
          ],
          'fill-opacity': 0.96,
        },
      });

      map.addLayer({
        id: 'blank-countries-outline',
        type: 'line',
        source: 'blank-countries',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#0284c7',
            '#64748b',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1.7,
            0.85,
          ],
        },
      });

      const gridVis = showGraticuleRef.current ? 'visible' : 'none';
      map.addLayer({
        id: 'blank-grat-grid',
        type: 'line',
        source: 'blank-graticule',
        filter: ['==', ['get', 'kind'], 'grid'],
        layout: { visibility: gridVis },
        paint: { 'line-color': '#94a3b8', 'line-width': 0.7, 'line-opacity': 0.45 },
      });
      map.addLayer({
        id: 'blank-grat-special',
        type: 'line',
        source: 'blank-graticule',
        filter: ['==', ['get', 'kind'], 'special'],
        layout: { visibility: gridVis },
        paint: { 'line-color': '#d97706', 'line-width': 1.1, 'line-opacity': 0.65, 'line-dasharray': [4, 3] },
      });
      map.addLayer({
        id: 'blank-grat-prime',
        type: 'line',
        source: 'blank-graticule',
        filter: ['==', ['get', 'kind'], 'prime'],
        layout: { visibility: gridVis },
        paint: { 'line-color': '#475569', 'line-width': 1.0, 'line-opacity': 0.65, 'line-dasharray': [3, 3] },
      });
      map.addLayer({
        id: 'blank-grat-equator',
        type: 'line',
        source: 'blank-graticule',
        filter: ['==', ['get', 'kind'], 'equator'],
        paint: { 'line-color': '#e11d48', 'line-width': 1.4, 'line-opacity': 0.7 },
      });

      map.addLayer({
        id: 'blank-feature-lines',
        type: 'line',
        source: 'blank-lines',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'quizColor'],
          'line-width': ['case', ['get', 'highlighted'], 6.0, 4.2],
          'line-opacity': 0.92,
        },
      });

      map.addLayer({
        id: 'blank-feature-points',
        type: 'circle',
        source: 'blank-points',
        paint: {
          'circle-color': ['get', 'quizColor'],
          'circle-radius': [
            'case',
            ['get', 'highlighted'],
            9,
            ['interpolate', ['linear'], ['zoom'], 1, 5.2, 5, 8.2],
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      map.addLayer({
        id: 'blank-pin-line',
        type: 'line',
        source: 'blank-pin-overlay',
        filter: ['==', ['get', 'kind'], 'line'],
        paint: {
          'line-color': '#ef4444',
          'line-width': 2.5,
          'line-dasharray': [3, 3],
        },
      });
      map.addLayer({
        id: 'blank-pin-user',
        type: 'circle',
        source: 'blank-pin-overlay',
        filter: ['==', ['get', 'kind'], 'user'],
        paint: {
          'circle-color': '#ef4444',
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      map.addLayer({
        id: 'blank-pin-target',
        type: 'circle',
        source: 'blank-pin-overlay',
        filter: ['==', ['get', 'kind'], 'target'],
        paint: {
          'circle-color': '#16a34a',
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      });

      map.addLayer({
        id: 'blank-spot-halo',
        type: 'circle',
        source: 'blank-spot',
        paint: {
          'circle-color': '#ef4444',
          'circle-radius': 14,
          'circle-opacity': 0.25,
          'circle-stroke-color': '#ef4444',
          'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: 'blank-spot-core',
        type: 'circle',
        source: 'blank-spot',
        paint: {
          'circle-color': '#dc2626',
          'circle-radius': 6.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.2,
        },
      });

      readyRef.current = true;
      setEdgeTicks(computeEdgeTicks(map, container, showGraticuleRef.current));
    });

    map.on('move', () => {
      if (!readyRef.current) return;
      setEdgeTicks(computeEdgeTicks(map, container, showGraticuleRef.current));
    });

    map.on('mousemove', (e) => {
      if (!readyRef.current) return;
      if (modeRef.current === 'country') {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['blank-countries-fill'] });
        const fid = hits[0]?.id ?? null;
        if (hoverCountryIdRef.current !== null && hoverCountryIdRef.current !== fid) {
          map.setFeatureState({ source: 'blank-countries', id: hoverCountryIdRef.current }, { hover: false });
        }
        if (fid !== null) {
          hoverCountryIdRef.current = fid;
          map.setFeatureState({ source: 'blank-countries', id: fid }, { hover: true });
          map.getCanvas().style.cursor = 'pointer';
        } else {
          hoverCountryIdRef.current = null;
          map.getCanvas().style.cursor = '';
        }
        return;
      }

      if (modeRef.current === 'feature_select') {
        const ptHits = map.queryRenderedFeatures(
          [
            [e.point.x - 10, e.point.y - 10],
            [e.point.x + 10, e.point.y + 10],
          ],
          { layers: ['blank-feature-points'] },
        );
        const lnHits =
          ptHits.length > 0
            ? []
            : map.queryRenderedFeatures(
                [
                  [e.point.x - 8, e.point.y - 8],
                  [e.point.x + 8, e.point.y + 8],
                ],
                { layers: ['blank-feature-lines'] },
              );
        map.getCanvas().style.cursor = ptHits.length > 0 || lnHits.length > 0 ? 'pointer' : '';
      } else if (modeRef.current === 'feature_pin') {
        map.getCanvas().style.cursor = 'crosshair';
      } else {
        map.getCanvas().style.cursor = '';
      }
    });

    map.on('mouseout', () => {
      if (!readyRef.current) return;
      if (hoverCountryIdRef.current !== null) {
        map.setFeatureState({ source: 'blank-countries', id: hoverCountryIdRef.current }, { hover: false });
        hoverCountryIdRef.current = null;
      }
    });

    map.on('click', (e) => {
      if (!readyRef.current) return;
      const curMode = modeRef.current;

      if (curMode === 'feature_pin') {
        onClickMapCoordRef.current?.(e.lngLat.lng, e.lngLat.lat);
        return;
      }

      if (curMode === 'feature_select') {
        const ptHits = map.queryRenderedFeatures(
          [
            [e.point.x - 14, e.point.y - 14],
            [e.point.x + 14, e.point.y + 14],
          ],
          { layers: ['blank-feature-points'] },
        );
        const hit =
          ptHits[0] ??
          map.queryRenderedFeatures(
            [
              [e.point.x - 11, e.point.y - 11],
              [e.point.x + 11, e.point.y + 11],
            ],
            { layers: ['blank-feature-lines'] },
          )[0];
        const qid = (hit?.properties as { quizId?: string } | undefined)?.quizId;
        if (qid) onClickFeatureRef.current?.(qid);
        return;
      }

      if (curMode === 'country') {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['blank-countries-fill'] });
        const iso3 = (hits[0]?.properties as { iso3?: string } | undefined)?.iso3;
        if (iso3 && iso3 !== 'UNK') {
          onClickCountryRef.current?.(iso3);
        }
      }
    });

    const ro = new ResizeObserver(() => {
      map.resize();
      if (readyRef.current) {
        setEdgeTicks(computeEdgeTicks(map, container, showGraticuleRef.current));
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource('blank-countries') as maplibregl.GeoJSONSource | undefined)?.setData(
      styledCountriesGeoJson,
    );
  }, [styledCountriesGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource('blank-lines') as maplibregl.GeoJSONSource | undefined)?.setData(
      lineFeaturesGeoJson,
    );
    (map.getSource('blank-points') as maplibregl.GeoJSONSource | undefined)?.setData(
      pointFeaturesGeoJson,
    );
  }, [lineFeaturesGeoJson, pointFeaturesGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource('blank-pin-overlay') as maplibregl.GeoJSONSource | undefined)?.setData(
      pinOverlayGeoJson,
    );
  }, [pinOverlayGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource('blank-spot') as maplibregl.GeoJSONSource | undefined)?.setData(spotGeoJson);
  }, [spotGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !readyRef.current) return;
    const vis = showGraticule ? 'visible' : 'none';
    for (const lid of ['blank-grat-grid', 'blank-grat-special', 'blank-grat-prime']) {
      if (map.getLayer(lid)) map.setLayoutProperty(lid, 'visibility', vis);
    }
    if (container) {
      setEdgeTicks(computeEdgeTicks(map, container, showGraticule));
    }
  }, [showGraticule]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !flyTarget) return;
    const bestLng = resolveShortestWorldLng(map.getCenter().lng, flyTarget.lng);
    map.flyTo({
      center: [bestLng, flyTarget.lat],
      zoom: flyTarget.zoom,
      duration: 850,
      curve: 1.35,
      essential: true,
    });
  }, [flyTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !fitBoundsTarget) return;
    const [w, s, e, n] = fitBoundsTarget.bounds;
    map.fitBounds(
      [
        [w, s],
        [e, n],
      ],
      { padding: 28, maxZoom: 5.5, duration: 700 },
    );
  }, [fitBoundsTarget]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-blue-100">
      <div ref={containerRef} className="h-full w-full" />

      {edgeTicks.latTicks.map((t) => (
        <div
          key={t.key}
          style={{ top: `${t.topPx}px` }}
          className={`pointer-events-none absolute right-1.5 z-10 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[9.5px] leading-none shadow-2xs ${
            t.isEquator
              ? 'bg-rose-600/90 font-extrabold text-white'
              : t.isSpecial
                ? 'border border-amber-300 bg-amber-50/90 font-semibold text-amber-800'
                : 'border border-slate-300/80 bg-white/85 font-semibold text-slate-600'
          }`}
        >
          {t.label}
        </div>
      ))}

      {edgeTicks.lngTicks.map((t) => (
        <div
          key={t.key}
          style={{ left: `${t.leftPx}px` }}
          className={`pointer-events-none absolute bottom-1 z-10 -translate-x-1/2 rounded px-1.5 py-0.5 font-mono text-[9.5px] leading-none shadow-2xs ${
            t.isPrime
              ? 'border border-slate-400 bg-white/95 font-extrabold text-slate-800'
              : 'border border-slate-300/80 bg-white/85 font-semibold text-slate-600'
          }`}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
