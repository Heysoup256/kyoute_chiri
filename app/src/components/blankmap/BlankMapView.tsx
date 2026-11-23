import type { FeatureCollection, Geometry } from 'geojson';
import {
  CloudSun,
  Flag,
  Mountain,
  Paintbrush,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { useQuizStats } from '../../hooks/useQuizStats';
import type {
  CountriesDataset,
  GeoCountryProperties,
  GeoLayerProperties,
} from '../../types/schema_v1';
import type { ThematicGridData } from '../map/WorldMap';
import { ClimateChoiceQuiz } from './ClimateChoiceQuiz';
import { KoppenPaintGame } from './KoppenPaintGame';
import { PlaceQuizPanel } from './PlaceQuizPanel';

type BlankSubMode = 'country' | 'feature' | 'koppen' | 'climate';

interface BlankMapViewProps {
  countriesData: CountriesDataset;
  countriesGeoJson: FeatureCollection<Geometry, GeoCountryProperties>;
  layersGeoJson: FeatureCollection<Geometry, GeoLayerProperties>;
  capitalsGeoJson: FeatureCollection<Geometry>;
  volcanoesGeoJson: FeatureCollection<Geometry>;
  thematicGrid: ThematicGridData | null;
  onOpenCountryInMap: (iso3: string) => void;
}

const SUB_TABS: { id: BlankSubMode; label: string; shortLabel: string; icon: typeof Flag }[] = [
  { id: 'country', label: '国名 → 場所当て', shortLabel: '国名当て', icon: Flag },
  { id: 'feature', label: '山・川・地形当て', shortLabel: '山川・地形', icon: Mountain },
  { id: 'koppen', label: 'ケッペン塗り絵', shortLabel: '気候塗り絵', icon: Paintbrush },
  { id: 'climate', label: '雨温図・ハイサー4択', shortLabel: '雨温図4択', icon: CloudSun },
];

export function BlankMapView({
  countriesData,
  countriesGeoJson,
  layersGeoJson,
  capitalsGeoJson,
  volcanoesGeoJson,
  thematicGrid,
  onOpenCountryInMap,
}: BlankMapViewProps) {
  const [subMode, setSubMode] = useState<BlankSubMode>('country');
  const {
    stats,
    recordCountryResult,
    recordFeatureResult,
    recordClimateQuizResult,
    recordKoppenScore,
    getWeakCountryIso3s,
    getWeakFeatureIds,
    resetStats,
  } = useQuizStats();

  const weakCountryIso3s = getWeakCountryIso3s();
  const weakFeatureIds = getWeakFeatureIds();

  const totalTriedCountries = Object.keys(stats.countryStats).length;
  const totalBestPainted = Object.keys(stats.koppenBestScores).length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
      {/* サブモード切替バー */}
      <div className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-2.5 py-1.5 md:px-4">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {SUB_TABS.map((t) => {
            const Icon = t.icon;
            const active = subMode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubMode(t.id)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition md:px-3 md:text-xs ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="sm:hidden">{t.shortLabel}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 text-[11px] text-slate-500 lg:flex">
          <span>
            記録: 国 <b>{totalTriedCountries}</b> / 塗り絵 <b>{totalBestPainted}</b>地域
          </span>
          {(totalTriedCountries > 0 || totalBestPainted > 0 || stats.climateQuiz.total > 0) && (
            <button
              type="button"
              onClick={resetStats}
              className="inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="学習記録をリセット"
            >
              <RotateCcw className="h-2.5 w-2.5" /> リセット
            </button>
          )}
        </div>
      </div>

      {/* 選択中サブモード本体 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {(subMode === 'country' || subMode === 'feature') && (
          <PlaceQuizPanel
            key={subMode}
            quizKind={subMode}
            countriesData={countriesData.countries}
            countriesGeoJson={countriesGeoJson}
            layersGeoJson={layersGeoJson}
            capitalsGeoJson={capitalsGeoJson}
            volcanoesGeoJson={volcanoesGeoJson}
            quizStats={stats}
            weakCountryIso3s={weakCountryIso3s}
            weakFeatureIds={weakFeatureIds}
            onRecordCountry={recordCountryResult}
            onRecordFeature={recordFeatureResult}
            onOpenCountryInMap={onOpenCountryInMap}
          />
        )}

        {subMode === 'koppen' && thematicGrid && (
          <KoppenPaintGame
            countriesGeoJson={countriesGeoJson}
            thematicGrid={thematicGrid}
            bestScores={stats.koppenBestScores}
            onRecordScore={recordKoppenScore}
          />
        )}

        {subMode === 'koppen' && !thematicGrid && (
          <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
            気候グリッドデータを読み込み中です...
          </div>
        )}

        {subMode === 'climate' && (
          <ClimateChoiceQuiz
            countriesData={countriesData.countries}
            countriesGeoJson={countriesGeoJson}
            layersGeoJson={layersGeoJson}
            capitalsGeoJson={capitalsGeoJson}
            volcanoesGeoJson={volcanoesGeoJson}
            climateTotalStats={stats.climateQuiz}
            onRecordResult={recordClimateQuizResult}
            onOpenCountryInMap={onOpenCountryInMap}
          />
        )}
      </div>
    </div>
  );
}
