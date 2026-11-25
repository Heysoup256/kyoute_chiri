import { Layers, MapPin, Navigation, Sparkles } from 'lucide-react';
import type {
  PlaceEntry,
  PlaceSubFeature,
  SubnationalBoundaryLine,
  SubnationalProfile,
  SubnationalZone,
} from '../../types/schema_v1';
import { SubnationalDiagram } from './SubnationalDiagrams';

interface SubnationalRegionTabProps {
  iso3: string;
  countryNameJa: string;
  subnational: SubnationalProfile;
  onFocusPlace: (place: PlaceEntry) => void;
}

function computeZonesBounds(zones: SubnationalZone[]): [number, number, number, number] | undefined {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const z of zones) {
    if (z.bounds) {
      minLng = Math.min(minLng, z.bounds[0]);
      minLat = Math.min(minLat, z.bounds[1]);
      maxLng = Math.max(maxLng, z.bounds[2]);
      maxLat = Math.max(maxLat, z.bounds[3]);
    } else {
      minLng = Math.min(minLng, z.lng - 3);
      minLat = Math.min(minLat, z.lat - 3);
      maxLng = Math.max(maxLng, z.lng + 3);
      maxLat = Math.max(maxLat, z.lat + 3);
    }
  }
  if (!Number.isFinite(minLng)) return undefined;
  return [minLng, minLat, maxLng, maxLat];
}

export function SubnationalRegionTab({
  iso3,
  countryNameJa,
  subnational,
  onFocusPlace,
}: SubnationalRegionTabProps) {
  const shortName = countryNameJa.split('（')[0];

  const handleOverlayAll = () => {
    const subFeatures: PlaceSubFeature[] = [];
    for (const z of subnational.zones) {
      if (z.polygon && z.polygon.length >= 4) {
        subFeatures.push({
          label: z.name,
          fillColor: z.color,
          lineWidth: 2,
          geometry: {
            type: 'Polygon',
            coordinates: [z.polygon],
          },
        });
      }
    }
    for (const line of subnational.boundaryLines) {
      if (line.coordinates.length >= 2) {
        subFeatures.push({
          label: `境界: ${line.name}`,
          fillColor: line.color,
          lineDash: true,
          lineWidth: 4.5,
          geometry: {
            type: 'LineString',
            coordinates: line.coordinates,
          },
        });
      }
    }
    const bounds = computeZonesBounds(subnational.zones);
    const first = subnational.zones[0];
    onFocusPlace({
      id: `subnational-all-${iso3}`,
      name: `${shortName}：国内地域区分＆境界線マップ`,
      aliases: [],
      category: '国内地域対比',
      summary: subnational.summary,
      lng: first?.lng ?? 0,
      lat: first?.lat ?? 0,
      zoom: first?.zoom ?? 4.5,
      bounds,
      iso3,
      subFeatures,
    });
  };

  const handleFocusLine = (line: SubnationalBoundaryLine) => {
    const mid = line.coordinates[Math.floor(line.coordinates.length / 2)] ?? [0, 0];
    const lngs = line.coordinates.map((c) => c[0]);
    const lats = line.coordinates.map((c) => c[1]);
    const pad = 4.0;
    onFocusPlace({
      id: `subline-${iso3}-${line.id}`,
      name: `${shortName}・${line.name}`,
      aliases: [],
      category: '国内重要境界線',
      summary: `${line.criterion} ／ ${line.examPoint}`,
      lng: mid[0],
      lat: mid[1],
      zoom: 4.8,
      bounds: [
        Math.min(...lngs) - pad,
        Math.min(...lats) - pad,
        Math.max(...lngs) + pad,
        Math.max(...lats) + pad,
      ],
      iso3,
      subFeatures: [
        {
          label: line.name,
          fillColor: line.color,
          lineDash: true,
          lineWidth: 5,
          geometry: {
            type: 'LineString',
            coordinates: line.coordinates,
          },
        },
      ],
    });
  };

  const handleFocusZone = (zone: SubnationalZone) => {
    const subFeatures: PlaceSubFeature[] =
      zone.polygon && zone.polygon.length >= 4
        ? [
            {
              label: zone.name,
              fillColor: zone.color,
              lineWidth: 3,
              geometry: {
                type: 'Polygon',
                coordinates: [zone.polygon],
              },
            },
          ]
        : [];
    onFocusPlace({
      id: `subzone-${iso3}-${zone.id}`,
      name: `${shortName}：${zone.name}`,
      aliases: [],
      category: zone.tag,
      summary: `${zone.climateAndSoil} ${zone.agriculture}`,
      lng: zone.lng,
      lat: zone.lat,
      zoom: zone.zoom,
      bounds: zone.bounds,
      iso3,
      subFeatures,
    });
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー要約＋一括マップ重ね合わせボタン */}
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
            <Sparkles className="h-3 w-3" />
            国内の地域差・境界線マスター
          </span>
          <button
            type="button"
            onClick={handleOverlayAll}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
          >
            <Layers className="h-3.5 w-3.5" />
            地図に境界線＆地域区分を表示
          </button>
        </div>
        <h3 className="mt-2 text-sm font-extrabold text-slate-900">{subnational.headline}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{subnational.summary}</p>
      </div>

      {/* 専用SVG模式図（主要国は断面・帯図、他は境界対比カード） */}
      <SubnationalDiagram countryNameJa={shortName} subnational={subnational} />

      {/* 境界線詳細（地図表示ボタン付き） */}
      {subnational.boundaryLines.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-extrabold tracking-wide text-slate-600 uppercase">
            必出の国内境界線・分水界（{subnational.boundaryLines.length}本）
          </h4>
          {subnational.boundaryLines.map((line) => (
            <div
              key={line.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-xs font-extrabold text-slate-900">{line.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleFocusLine(line)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  <Navigation className="h-3 w-3" />
                  地図に線を引く
                </button>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">
                基準：{line.criterion}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11.5px] sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">{line.sideALabel}</div>
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">{line.sideBLabel}</div>
              </div>
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[11px] leading-snug text-amber-950">
                <strong>共テの急所：</strong>
                {line.examPoint}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 横断比較マトリクス */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-800">
          {subnational.comparisonTable.caption}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                {subnational.comparisonTable.headers.map((h) => (
                  <th key={h} className="px-2.5 py-1.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subnational.comparisonTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/60">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-2.5 py-2 align-top leading-snug ${
                        cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 各ゾーン詳細カード */}
      <section className="space-y-2.5">
        <h4 className="text-xs font-extrabold tracking-wide text-slate-600 uppercase">
          国内地域ブロック別の詳細分布（{subnational.zones.length}地域）
        </h4>
        {subnational.zones.map((zone) => (
          <div
            key={zone.id}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <h5 className="text-xs font-extrabold text-slate-900 md:text-[13px]">
                    {zone.name}
                  </h5>
                </div>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700">
                  {zone.tag}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFocusZone(zone)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                <MapPin className="h-3 w-3" />
                地図で地域を表示
              </button>
            </div>

            <div className="mt-2.5 space-y-1.5 text-[11.5px] leading-relaxed text-slate-700">
              <div>
                <strong className="text-slate-900">気候・土壌：</strong>
                {zone.climateAndSoil}
              </div>
              <div>
                <strong className="text-slate-900">農林水産：</strong>
                {zone.agriculture}
              </div>
              <div>
                <strong className="text-slate-900">資源・工業：</strong>
                {zone.industryAndResources}
              </div>
              <div>
                <strong className="text-slate-900">都市・民族文化：</strong>
                {zone.citiesAndCulture}
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-[11px] leading-snug text-rose-900">
              <strong>判別ポイント・ひっかけ注意：</strong>
              {zone.examTrap}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
