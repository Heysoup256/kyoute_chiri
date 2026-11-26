import {
  BookOpen,
  Compass,
  Eye,
  EyeOff,
  HelpCircle,
  MapPin,
  Maximize2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  CountryData,
  PhotoEncyclopediaCategory,
  PhotoEncyclopediaEntry,
  PlaceEntry,
} from '../../types/schema_v1';
import { KOPPEN_13_COLORS } from '../../utils/constants';

interface PhotoInferenceGalleryProps {
  entries: PhotoEncyclopediaEntry[];
  countriesData: Record<string, CountryData>;
  onFocusPlace: (place: PlaceEntry) => void;
  onSelectCountry: (iso3: string) => void;
}

type CatFilter = 'all' | PhotoEncyclopediaCategory;

const CAT_META: { id: CatFilter; label: string; badgeClass: string }[] = [
  { id: 'all', label: 'すべて', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  {
    id: 'housing',
    label: '伝統住居・建築',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'agriculture',
    label: '農業・灌漑景観',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'landform',
    label: '地形・自然景観',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 'urban',
    label: '都市構造・街区',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'industry_energy',
    label: '資源・発電・交通',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
];

function getCatInfo(cat: PhotoEncyclopediaCategory) {
  return CAT_META.find((c) => c.id === cat) ?? CAT_META[1];
}

/**
 * 景観・農業・都市構造写真からの地理推論図鑑（一覧学習＆推論練習モード）
 */
export function PhotoInferenceGallery({
  entries,
  countriesData,
  onFocusPlace,
  onSelectCountry,
}: PhotoInferenceGalleryProps) {
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [zoomEntry, setZoomEntry] = useState<PhotoEncyclopediaEntry | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return entries.filter((e) => {
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (!kw) return true;
      const hay = [
        e.title,
        e.locationLabel,
        e.koppenCodes.join(' '),
        e.visualClues.join(' '),
        e.inferenceSummary,
        e.examPoint,
        ...e.relatedIso3s.map((iso) => countriesData[iso]?.nameJa ?? iso),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [entries, catFilter, keyword, countriesData]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!entries.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
        景観写真・地理推論図鑑データを読み込み中です...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* 上部ツールバー */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 md:px-6">
        <div className="mx-auto max-w-6xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {CAT_META.map((c) => {
                const count =
                  c.id === 'all'
                    ? entries.length
                    : entries.filter((e) => e.category === c.id).length;
                const active = catFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCatFilter(c.id)}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {c.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPracticeMode((v) => !v);
                  setRevealedIds({});
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                  practiceMode
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {practiceMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {practiceMode ? '推論練習モード中（名称・地域隠蔽）' : '写真から推論練習モード'}
              </button>

              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="景観・気候・国名で検索..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* カードグリッド */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
              条件に一致する景観カードがありません。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((entry) => {
                const cm = getCatInfo(entry.category);
                const isHidden = practiceMode && !revealedIds[entry.id];
                const imgBroken = Boolean(failedUrls[entry.id]);

                return (
                  <article
                    key={entry.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                  >
                    {/* 写真エリア */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      {!imgBroken ? (
                        <img
                          src={entry.photoUrl}
                          alt={isHidden ? '推論練習用 地理景観写真' : entry.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={() => setFailedUrls((prev) => ({ ...prev, [entry.id]: true }))}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-xs text-slate-300">
                          <Compass className="h-6 w-6 text-slate-400" />
                          <span>写真を読み込めませんでした</span>
                        </div>
                      )}

                      <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-xs ${cm.badgeClass}`}>
                          {cm.label}
                        </span>
                        {!isHidden &&
                          entry.koppenCodes.map((kc) => (
                            <span
                              key={kc}
                              className="rounded-full border border-white/60 px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-xs"
                              style={{ backgroundColor: KOPPEN_13_COLORS[kc] ?? '#e2e8f0' }}
                            >
                              {kc}
                            </span>
                          ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setZoomEntry(entry)}
                        className="absolute right-2.5 top-2.5 rounded-lg bg-slate-900/70 p-1.5 text-white backdrop-blur-xs hover:bg-slate-900"
                        title="写真を拡大"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* 本文エリア */}
                    <div className="flex flex-1 flex-col justify-between space-y-3 p-3.5">
                      <div className="space-y-2.5">
                        {isHidden ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
                            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-900">
                              <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                              写真の観察ポイントから地域・気候を推論しよう
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-sm font-black leading-snug text-slate-900">
                              {entry.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] font-semibold text-indigo-700">
                              代表地域: {entry.locationLabel}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-[11.5px]">
                          <div className="font-bold text-slate-700">写真から読み取る着眼点</div>
                          <ul className="space-y-0.5 text-slate-600">
                            {entry.visualClues.map((clue) => (
                              <li key={clue} className="flex items-start gap-1">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                                <span>{clue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {isHidden ? (
                          <button
                            type="button"
                            onClick={() => toggleReveal(entry.id)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-extrabold text-white hover:bg-indigo-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            地域・解答と因果推論を表示
                          </button>
                        ) : (
                          <div className="space-y-2 text-xs">
                            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-2.5">
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-sky-900">
                                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                                気候・地形・社会との因果推論
                              </div>
                              <p className="mt-1 leading-relaxed text-slate-700">
                                {entry.inferenceSummary}
                              </p>
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-900">
                                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                                出題・判別の着目点
                              </div>
                              <p className="mt-0.5 leading-relaxed text-slate-700">
                                {entry.examPoint}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isHidden && (
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              onFocusPlace({
                                id: `enc_${entry.id}`,
                                name: entry.title,
                                aliases: [],
                                category: `景観推論図鑑（${entry.locationLabel}）`,
                                summary: entry.inferenceSummary,
                                lng: entry.lng,
                                lat: entry.lat,
                                zoom: entry.zoom,
                                iso3: entry.relatedIso3s[0],
                                photoUrl: entry.photoUrl,
                                photoCaption: `${entry.title}（${entry.locationLabel}）`,
                                photoCredit: entry.photoCredit,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-100"
                          >
                            <MapPin className="h-3 w-3" />
                            地図でこの場所を見る
                          </button>

                          <div className="flex flex-wrap gap-1">
                            {entry.relatedIso3s.slice(0, 3).map((iso) => (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => onSelectCountry(iso)}
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10.5px] font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                              >
                                {countriesData[iso]?.nameJa.split('（')[0] ?? iso}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ライトボックス拡大モーダル */}
      {zoomEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setZoomEntry(null)}
        >
          <div
            className="max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomEntry.photoUrl}
              alt={practiceMode && !revealedIds[zoomEntry.id] ? '地理景観' : zoomEntry.title}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-full bg-slate-900 object-contain"
            />
            <div className="flex items-center justify-between gap-3 p-3.5 text-xs">
              <div>
                <div className="font-extrabold text-slate-900">
                  {practiceMode && !revealedIds[zoomEntry.id]
                    ? '推論練習モード（名称非表示）'
                    : `${zoomEntry.title}（${zoomEntry.locationLabel}）`}
                </div>
                <div className="text-[11px] text-slate-500">{zoomEntry.photoCredit}</div>
              </div>
              <button
                type="button"
                onClick={() => setZoomEntry(null)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-200"
              >
                <X className="h-3.5 w-3.5" />
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

