import { MapPin, Navigation } from 'lucide-react';
import { useEffect } from 'react';
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
  onAutoFocusPlace: (place: PlaceEntry) => void;
  onFocusPlace: (place: PlaceEntry) => void;
  onClearSubnationalOverlay: () => void;
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

function buildSubnationalFeatures(
  subnational: SubnationalProfile,
  emphasizeId?: string,
): PlaceSubFeature[] {
  const subFeatures: PlaceSubFeature[] = [];
  for (const z of subnational.zones) {
    const hasPoly = Boolean(z.polygon && z.polygon.length >= 4);
    subFeatures.push({
      label: z.name,
      category: z.tag,
      fillColor: z.color,
      lineWidth: emphasizeId === z.id ? 3.5 : 1.8,
      summary: `${z.climateAndSoil} ${z.agriculture}`,
      detailLines: [
        `気候・土壌：${z.climateAndSoil}`,
        `農林水産：${z.agriculture}`,
        `資源・工業：${z.industryAndResources}`,
        `都市・文化：${z.citiesAndCulture}`,
      ],
      geometry: hasPoly
        ? {
            type: 'Polygon',
            coordinates: [z.polygon!],
          }
        : {
            type: 'Point',
            coordinates: [z.lng, z.lat],
          },
    });
  }
  for (const line of subnational.boundaryLines) {
    if (line.coordinates.length >= 2) {
      subFeatures.push({
        label: line.name,
        category: `国内境界線（${line.criterion}）`,
        fillColor: line.color,
        lineDash: true,
        lineWidth: emphasizeId === line.id ? 5.5 : 4,
        summary: `${line.sideALabel} ／ ${line.sideBLabel}`,
        detailLines: [
          `基準：${line.criterion}`,
          line.sideALabel,
          line.sideBLabel,
          `要点：${line.examPoint}`,
        ],
        geometry: {
          type: 'LineString',
          coordinates: line.coordinates,
        },
      });
    }
  }
  return subFeatures;
}

export function SubnationalRegionTab({
  iso3,
  countryNameJa,
  subnational,
  onAutoFocusPlace,
  onFocusPlace,
  onClearSubnationalOverlay,
}: SubnationalRegionTabProps) {
  const shortName = countryNameJa.split('（')[0];

  // 国内地域タブが開かれている間は地域区分ポリゴンと主要境界線を地図上に常時表示し、離れたら解除
  useEffect(() => {
    const first = subnational.zones[0];
    onAutoFocusPlace({
      id: `subnational-all-${iso3}`,
      name: `${shortName}：国内地域区分＆境界線マップ`,
      aliases: [],
      category: '国内地域対比',
      summary: subnational.summary,
      lng: first?.lng ?? 0,
      lat: first?.lat ?? 0,
      zoom: first?.zoom ?? 4.5,
      bounds: computeZonesBounds(subnational.zones),
      iso3,
      subFeatures: buildSubnationalFeatures(subnational),
      skipPopup: true,
    });
    return () => {
      onClearSubnationalOverlay();
    };
  }, [iso3, shortName, subnational, onAutoFocusPlace, onClearSubnationalOverlay]);

  const handleFocusLine = (line: SubnationalBoundaryLine) => {
    const mid = line.coordinates[Math.floor(line.coordinates.length / 2)] ?? [0, 0];
    const lngs = line.coordinates.map((c) => c[0]);
    const lats = line.coordinates.map((c) => c[1]);
    const pad = 4.0;
    onFocusPlace({
      id: `subline-${iso3}-${line.id}`,
      name: `${shortName}・${line.name}`,
      aliases: [],
      category: '国内境界線',
      summary: `${line.criterion}\n${line.examPoint}`,
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
      subFeatures: buildSubnationalFeatures(subnational, line.id),
    });
  };

  const handleFocusZone = (zone: SubnationalZone) => {
    onFocusPlace({
      id: `subzone-${iso3}-${zone.id}`,
      name: `${shortName}：${zone.name}`,
      aliases: [],
      category: zone.tag,
      summary: `気候・土壌：${zone.climateAndSoil}\n農林水産：${zone.agriculture}\n資源・工業：${zone.industryAndResources}`,
      lng: zone.lng,
      lat: zone.lat,
      zoom: zone.zoom,
      bounds: zone.bounds,
      iso3,
      subFeatures: buildSubnationalFeatures(subnational, zone.id),
    });
  };

  return (
    <div className="space-y-4">
      {/* 国内の地域差・境界線 サマリー */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="text-[11px] font-bold text-indigo-700">国内の地域差・境界線</div>
        <h3 className="mt-1 text-sm font-extrabold text-slate-900">{subnational.headline}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{subnational.summary}</p>
        <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          地図上の地域・境界線にカーソルを合わせると、詳しい解説を表示します。
        </p>
      </div>

      {/* 専用SVG模式図（主要国は断面・帯図、他は境界対比カード） */}
      <SubnationalDiagram countryNameJa={shortName} subnational={subnational} />

      {/* 境界線詳細 */}
      {subnational.boundaryLines.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-extrabold tracking-wide text-slate-600">
            国内の主要境界線・分水界（{subnational.boundaryLines.length}本）
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
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                >
                  <Navigation className="h-3 w-3" />
                  地図で注目
                </button>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">
                基準：{line.criterion}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11.5px] sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">{line.sideALabel}</div>
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">{line.sideBLabel}</div>
              </div>
              <div className="mt-2 rounded-lg border border-slate-200 border-l-2 border-l-amber-500 bg-slate-50/80 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700">
                <strong className="text-slate-900">要点：</strong>
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
        <h4 className="text-xs font-extrabold tracking-wide text-slate-600">
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
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
              >
                <MapPin className="h-3 w-3" />
                地図で注目
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

            <div className="mt-2 rounded-lg border border-slate-200 border-l-2 border-l-rose-400 bg-slate-50/80 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700">
              <strong className="text-slate-900">判別ポイント：</strong>
              {zone.examTrap}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
