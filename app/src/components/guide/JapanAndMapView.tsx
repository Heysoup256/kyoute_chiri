import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  CloudSun,
  Compass,
  Factory,
  Globe2,
  MapPin,
  Search,
  ShieldAlert,
  Wheat,
} from 'lucide-react';
import { useState } from 'react';
import type { JapanGeographyDataset, PlaceEntry } from '../../types/schema_v1';
import type { PlaceMatcher } from '../../utils/places';
import { RichGeoText } from '../study/RichGeoText';
import { GeoDiagramRenderer } from './GeoDiagrams';
import { JapanDomesticStatsSection } from './JapanDomesticStatsSection';

interface JapanAndMapViewProps {
  dataset: JapanGeographyDataset | null;
  placeMatcher: PlaceMatcher | null;
  focusedRegionId?: string | null;
  onFocusPlace: (place: PlaceEntry) => void;
  onOpenJapanCountry: () => void;
}

type JapanSubTab = 'regions' | 'map_skills' | 'domestic_stats';

/**
 * 日本地理（9地方データマップ）＆ 第2問「地域調査・地形図・読図」マスタービュー
 */
export function JapanAndMapView({
  dataset,
  placeMatcher,
  focusedRegionId,
  onFocusPlace,
  onOpenJapanCountry,
}: JapanAndMapViewProps) {
  const [subTab, setSubTab] = useState<JapanSubTab>(
    focusedRegionId ? 'regions' : 'map_skills',
  );
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(focusedRegionId ?? '');
  const [filterText, setFilterText] = useState('');

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
        日本地理・地域調査マスターを読み込み中...
      </div>
    );
  }

  const kw = filterText.trim().toLowerCase();
  const filteredSkills = dataset.mapSkills.filter((sk) =>
    !kw
      ? true
      : `${sk.title} ${sk.summary} ${sk.checkPoints.join(' ')}`.toLowerCase().includes(kw),
  );
  const filteredRegions = dataset.regions.filter((rg) =>
    !kw
      ? true
      : `${rg.name} ${rg.prefectures} ${rg.climateNote} ${rg.agricultureNote} ${rg.industryNote} ${rg.examPoints.join(' ')}`
          .toLowerCase()
          .includes(kw),
  );

  const activeSkill =
    filteredSkills.find((s) => s.id === selectedSkillId) ?? filteredSkills[0] ?? dataset.mapSkills[0];
  const activeRegion =
    filteredRegions.find((r) => r.id === selectedRegionId) ??
    filteredRegions[0] ??
    dataset.regions[0];

  const handleJumpRegionOnMap = () => {
    if (!activeRegion) return;
    onFocusPlace({
      id: `jp-region-${activeRegion.id}`,
      name: `${activeRegion.name}（${activeRegion.prefectures}）`,
      aliases: [],
      category: '日本地域・共テ第2問対策',
      summary: `${activeRegion.climateNote} ${activeRegion.agricultureNote}`,
      lng: activeRegion.lng,
      lat: activeRegion.lat,
      zoom: activeRegion.zoom,
      iso3: 'JPN',
    });
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* 上部サブタブ */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSubTab('map_skills')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                subTab === 'map_skills'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              地形図・地域調査の鉄則（{dataset.mapSkills.length}）
            </button>
            <button
              type="button"
              onClick={() => setSubTab('regions')}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                subTab === 'regions'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              日本9地方データマップ（{dataset.regions.length}）
            </button>
            <button
              type="button"
              onClick={() => setSubTab('domestic_stats')}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                subTab === 'domestic_stats'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              日本国内統計
            </button>
            <button
              type="button"
              onClick={onOpenJapanCountry}
              className="hidden items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800 hover:bg-indigo-100 md:inline-flex"
            >
              <Globe2 className="h-3.5 w-3.5" />
              日本統計・雨温図詳細へ
            </button>
          </div>

          {subTab !== 'domestic_stats' && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="日本地方・地形図用語で絞り込み"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* メイン領域 */}
      {subTab === 'domestic_stats' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3.5 md:p-6">
          <div className="mx-auto max-w-6xl">
            <JapanDomesticStatsSection domesticStats={dataset.domesticStats} />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
        <div className="mx-auto flex h-full max-w-6xl flex-col md:flex-row">
          {/* 左/上リスト */}
          <nav
            aria-label="日本地理項目リスト"
            className="shrink-0 border-b border-slate-200 bg-white p-2.5 md:h-full md:w-72 md:overflow-y-auto md:border-b-0 md:border-r md:p-3"
          >
            {subTab === 'map_skills' ? (
              <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
                {filteredSkills.map((sk) => {
                  const sel = sk.id === activeSkill?.id;
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => setSelectedSkillId(sk.id)}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-bold transition md:w-full ${
                        sel
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="mb-0.5 block text-[10px] text-emerald-700">{sk.badge}</span>
                      <span className="line-clamp-2">{sk.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
                {filteredRegions.map((rg) => {
                  const sel = rg.id === activeRegion?.id;
                  return (
                    <button
                      key={rg.id}
                      type="button"
                      onClick={() => setSelectedRegionId(rg.id)}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-left transition md:w-full ${
                        sel
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{rg.name}</div>
                      <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                        {rg.prefectures}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          {/* 右コンテンツ */}
          <div className="flex-1 overflow-y-auto p-3.5 md:p-6">
            {subTab === 'map_skills' && activeSkill && (
              <article className="space-y-4">
                <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                    <BookOpen className="h-3 w-3" />
                    {activeSkill.badge}
                  </span>
                  <h2 className="mt-2 text-base font-extrabold text-slate-900 md:text-lg">
                    {activeSkill.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                    <RichGeoText
                      text={activeSkill.summary}
                      placeMatcher={placeMatcher}
                      onFocusPlace={onFocusPlace}
                    />
                  </p>
                </header>

                {activeSkill.diagramId && (
                  <GeoDiagramRenderer diagramId={activeSkill.diagramId} />
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <h3 className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                    地形図読解の基本原則
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {activeSkill.checkPoints.map((cp, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-800 md:text-[13px]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          <RichGeoText
                            text={cp}
                            placeMatcher={placeMatcher}
                            onFocusPlace={onFocusPlace}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {activeSkill.comparisonTable && (
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    {activeSkill.comparisonTable.caption && (
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-800">
                        {activeSkill.comparisonTable.caption}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[460px] border-collapse text-left text-xs">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-600">
                          <tr>
                            {activeSkill.comparisonTable.headers.map((h) => (
                              <th key={h} className="border-b border-slate-200 px-3 py-2">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSkill.comparisonTable.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/70">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-3 py-2 align-top leading-snug ${
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
                )}
              </article>
            )}

            {subTab === 'regions' && activeRegion && (
              <article className="space-y-4">
                <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                        日本の地域地誌
                      </span>
                      <h2 className="mt-1.5 text-lg font-extrabold text-slate-900">
                        {activeRegion.name}
                      </h2>
                      <p className="text-xs font-medium text-slate-500">
                        対象都府県・道：{activeRegion.prefectures}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleJumpRegionOnMap}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      地図でこの地方を見る
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-800">
                      <CloudSun className="h-4 w-4 text-sky-600" />
                      気候・局地風の特徴
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={activeRegion.climateNote}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <Wheat className="h-4 w-4 text-emerald-600" />
                      農林水産業・特産物
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={activeRegion.agricultureNote}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-800">
                      <Factory className="h-4 w-4 text-indigo-600" />
                      工業地域・主要産業
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={activeRegion.industryNote}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800">
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                      都市問題・交通・災害リスク
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-[13px]">
                      <RichGeoText
                        text={activeRegion.urbanAndDisasterNote}
                        placeMatcher={placeMatcher}
                        onFocusPlace={onFocusPlace}
                      />
                    </p>
                  </section>
                </div>

                <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <div className="text-xs font-extrabold text-amber-900">
                    共テで狙われる必須ポイント（{activeRegion.name}）
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {activeRegion.examPoints.map((ep, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs leading-relaxed text-amber-950"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                        <span>
                          <RichGeoText
                            text={ep}
                            placeMatcher={placeMatcher}
                            onFocusPlace={onFocusPlace}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
