import type { CountryData, ImportanceRank, PlaceEntry } from '../types/schema_v1';

export interface SearchFilterCriteria {
  query: string;
  koppenCode: string;
  rank: ImportanceRank | '';
  integration: string;
  examYear: string;
}

export interface SearchHit {
  country: CountryData;
  matchedReasons: string[];
}

export interface PlaceSearchHit {
  place: PlaceEntry;
  countryNameJa: string;
  matchedIn: string[];
  score: number;
}

export const EMPTY_FILTERS: SearchFilterCriteria = {
  query: '',
  koppenCode: '',
  rank: '',
  integration: '',
  examYear: '',
};

export function hasActiveFilters(filters: SearchFilterCriteria): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.koppenCode ||
      filters.rank ||
      filters.integration ||
      filters.examYear,
  );
}

/**
 * 国別データ全体を対象にした逆引き検索・複合フィルタリング関数
 */
export function searchCountries(
  countries: Record<string, CountryData>,
  filters: SearchFilterCriteria,
): SearchHit[] {
  const qNorm = filters.query.trim().toLowerCase();
  const hits: SearchHit[] = [];

  for (const country of Object.values(countries)) {
    const reasons: string[] = [];

    if (filters.rank && country.examSummary.rank !== filters.rank) {
      continue;
    }
    if (filters.rank) {
      reasons.push(`ランク${filters.rank}`);
    }

    if (filters.koppenCode) {
      const codes = country.climate.koppenCodes;
      const cityCodes = country.climate.cities.map((c) => c.koppenCode);
      const allCodes = [...codes, ...cityCodes];
      const matched = allCodes.some((c) =>
        c.toLowerCase().startsWith(filters.koppenCode.toLowerCase()),
      );
      if (!matched) continue;
      reasons.push(`気候 ${filters.koppenCode}`);
    }

    if (filters.integration) {
      const orgs = country.cultureAndHistory.regionalIntegrations.join(' ');
      if (!orgs.toLowerCase().includes(filters.integration.toLowerCase())) {
        continue;
      }
      reasons.push(filters.integration);
    }

    if (filters.examYear) {
      if (!country.examSummary.years.includes(filters.examYear)) {
        continue;
      }
      reasons.push(`出題 ${filters.examYear}`);
    }

    if (qNorm) {
      const deepDiveText = [
        ...country.nature.items,
        ...country.industry.agriculture,
        ...country.industry.resourcesAndEnergy,
        ...country.industry.industrialRegions,
        ...country.cultureAndHistory.historicalContext,
      ]
        .map((it) =>
          it.deepDive
            ? `${it.deepDive.mechanism ?? ''} ${it.deepDive.historicalShift ?? ''} ${it.deepDive.examTrap ?? ''} ${it.deepDive.compareNote ?? ''}`
            : '',
        )
        .join(' ');

      const subnationalText = country.subnational
        ? `${country.subnational.headline} ${country.subnational.summary} ${country.subnational.zones
            .map(
              (z) =>
                `${z.name} ${z.tag} ${z.climateAndSoil} ${z.agriculture} ${z.industryAndResources} ${z.citiesAndCulture}`,
            )
            .join(' ')} ${country.subnational.boundaryLines
            .map((b) => `${b.name} ${b.criterion} ${b.sideALabel} ${b.sideBLabel}`)
            .join(' ')}`
        : '';

      const searchFields: { label: string; text: string }[] = [
        {
          label: '国名・首都',
          text: `${country.nameJa} ${country.nameEn} ${country.capital} ${country.region} ${country.subRegion}`,
        },
        {
          label: '国内地域・都市',
          text: `${(country.topCities ?? []).map((c) => `${c.nameJa} ${c.note}`).join(' ')} ${(country.specialRegions ?? []).map((sr) => `${sr.name} ${sr.tag} ${sr.description}`).join(' ')} ${subnationalText}`,
        },
        {
          label: '概要・暮らし',
          text: `${country.quickOverview?.headline ?? ''} ${country.quickOverview?.summary ?? ''} ${(country.quickOverview?.keyPoints ?? []).join(' ')} ${country.dailyLife?.summary ?? ''} ${country.dailyLife?.food ?? ''} ${country.dailyLife?.housing ?? ''} ${country.dailyLife?.streetNote ?? ''}`,
        },
        {
          label: '自然・地形',
          text: `${country.nature.orogenicBelts.join(' ')} ${country.nature.summary ?? ''} ${country.nature.items
            .map(
              (i) =>
                `${i.label} ${i.detail ?? ''} ${(i.tags ?? []).join(' ')} ${(i.clozeTerms ?? []).join(' ')}`,
            )
            .join(' ')}`,
        },
        {
          label: '気候・都市',
          text: `${country.climate.koppenCodes.join(' ')} ${country.climate.summary} ${country.climate.cities
            .map(
              (c) =>
                `${c.nameJa} ${c.koppenCode} ${c.koppenNameJa ?? ''} ${c.factors.join(' ')}`,
            )
            .join(' ')}`,
        },
        {
          label: '農業・資源・工業',
          text: `${country.industry.whittleseyTypes.join(' ')} ${[
            ...country.industry.agriculture,
            ...country.industry.resourcesAndEnergy,
            ...country.industry.industrialRegions,
          ]
            .map(
              (i) =>
                `${i.label} ${i.detail ?? ''} ${i.worldRankNote ?? ''} ${(i.tags ?? []).join(' ')} ${(i.clozeTerms ?? []).join(' ')}`,
            )
            .join(' ')} ${country.industry.trade.majorExports.join(' ')} ${country.industry.trade.majorPartners.join(' ')}`,
        },
        {
          label: '文化・歴史・国際',
          text: `${country.cultureAndHistory.languageFamily} ${country.cultureAndHistory.officialLanguages.join(' ')} ${country.cultureAndHistory.religions
            .map((r) => r.name)
            .join(' ')} ${country.cultureAndHistory.ethnicGroups.join(' ')} ${country.cultureAndHistory.regionalIntegrations.join(' ')} ${country.cultureAndHistory.historicalContext
            .map(
              (i) =>
                `${i.label} ${i.detail ?? ''} ${(i.tags ?? []).join(' ')} ${(i.clozeTerms ?? []).join(' ')}`,
            )
            .join(' ')}`,
        },
        {
          label: '要点・詳細解説',
          text: `${country.examCheatSheet ? `${country.examCheatSheet.oneLineKey} ${country.examCheatSheet.mustMemorizeStats.join(' ')} ${country.examCheatSheet.commonConfusions.map((cc) => `${cc.partnerNameJa} ${cc.title} ${cc.diffPoint}`).join(' ')}` : ''} ${deepDiveText}`,
        },
        {
          label: '頻出トピック',
          text: country.examSummary.frequentTopics.join(' '),
        },
      ];

      const matchedFields = searchFields
        .filter((f) => f.text.toLowerCase().includes(qNorm))
        .map((f) => f.label);

      if (matchedFields.length === 0) continue;
      reasons.push(...matchedFields.slice(0, 2));
    }

    hits.push({
      country,
      matchedReasons: reasons,
    });
  }

  // 重要度ランク S -> A -> B -> C、次いで出題回数順
  const rankWeight: Record<ImportanceRank, number> = { S: 0, A: 1, B: 2, C: 3 };
  hits.sort((a, b) => {
    const rw = rankWeight[a.country.examSummary.rank] - rankWeight[b.country.examSummary.rank];
    if (rw !== 0) return rw;
    return b.country.examSummary.appearanceCount - a.country.examSummary.appearanceCount;
  });

  return hits;
}

/**
 * 地図上の全地域・国内区分・地理境界線・山川地形・都市を対象にした全文検索（空白区切りAND対応）
 */
export function searchMapPlaces(
  places: PlaceEntry[],
  countries: Record<string, CountryData>,
  query: string,
  limit = 120,
): PlaceSearchHit[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0 || places.length === 0) return [];

  const hits: PlaceSearchHit[] = [];

  for (const place of places) {
    const c = place.iso3 ? countries[place.iso3] : undefined;
    const countryNameJa = c?.nameJa ?? '';
    const countryNameEn = c?.nameEn ?? '';

    const nameNorm = place.name.toLowerCase();
    const aliasNorms = (place.aliases ?? []).map((a) => a.toLowerCase());
    const catNorm = place.category.toLowerCase();
    const summaryNorm = place.summary.toLowerCase();
    const cNameNorm = `${countryNameJa} ${countryNameEn}`.toLowerCase();
    const combined = `${nameNorm} ${aliasNorms.join(' ')} ${catNorm} ${summaryNorm} ${cNameNorm}`;

    let allMatched = true;
    for (const tok of tokens) {
      if (!combined.includes(tok)) {
        allMatched = false;
        break;
      }
    }
    if (!allMatched) continue;

    let score = 0;
    const matchedInSet = new Set<string>();
    const primaryTok = tokens[0];

    const exactName =
      nameNorm === primaryTok || aliasNorms.some((a) => a === primaryTok);
    const prefixName =
      nameNorm.startsWith(primaryTok) || aliasNorms.some((a) => a.startsWith(primaryTok));
    const subName =
      tokens.every((t) => nameNorm.includes(t) || aliasNorms.some((a) => a.includes(t)));

    if (exactName) {
      score = 100;
      matchedInSet.add('名称');
    } else if (prefixName) {
      score = 80;
      matchedInSet.add('名称');
    } else if (subName) {
      score = 60;
      matchedInSet.add('名称');
    } else if (tokens.some((t) => catNorm.includes(t))) {
      score = 40;
      matchedInSet.add('カテゴリ');
    } else {
      score = 20;
    }

    if (tokens.every((t) => catNorm.includes(t))) {
      matchedInSet.add('カテゴリ');
    }
    if (tokens.some((t) => summaryNorm.includes(t))) {
      matchedInSet.add('解説');
    }
    if (countryNameJa && tokens.some((t) => cNameNorm.includes(t))) {
      matchedInSet.add('国名');
    }

    hits.push({
      place,
      countryNameJa,
      matchedIn: [...matchedInSet].slice(0, 2),
      score,
    });
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.place.name.length - b.place.name.length;
  });

  return hits.slice(0, limit);
}
