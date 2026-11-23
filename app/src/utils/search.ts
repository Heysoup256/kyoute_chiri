import type { CountryData, ImportanceRank } from '../types/schema_v1';

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
      const searchFields: { label: string; text: string }[] = [
        { label: '国名・首都', text: `${country.nameJa} ${country.nameEn} ${country.capital} ${country.region} ${country.subRegion}` },
        {
          label: '概要・暮らし',
          text: `${country.quickOverview?.headline ?? ''} ${country.quickOverview?.summary ?? ''} ${(country.quickOverview?.keyPoints ?? []).join(' ')} ${country.dailyLife?.summary ?? ''} ${country.dailyLife?.food ?? ''} ${country.dailyLife?.housing ?? ''} ${country.dailyLife?.streetNote ?? ''}`,
        },
        {
          label: '自然・地形',
          text: `${country.nature.orogenicBelts.join(' ')} ${country.nature.summary ?? ''} ${country.nature.items
            .map((i) => `${i.label} ${i.detail ?? ''} ${(i.tags ?? []).join(' ')} ${(i.clozeTerms ?? []).join(' ')}`)
            .join(' ')}`,
        },
        {
          label: '気候・都市',
          text: `${country.climate.koppenCodes.join(' ')} ${country.climate.summary} ${country.climate.cities
            .map((c) => `${c.nameJa} ${c.koppenCode} ${c.koppenNameJa ?? ''} ${c.factors.join(' ')}`)
            .join(' ')}`,
        },
        {
          label: '農業・資源・工業',
          text: `${country.industry.whittleseyTypes.join(' ')} ${[
            ...country.industry.agriculture,
            ...country.industry.resourcesAndEnergy,
            ...country.industry.industrialRegions,
          ]
            .map((i) => `${i.label} ${i.detail ?? ''} ${i.worldRankNote ?? ''} ${(i.tags ?? []).join(' ')} ${(i.clozeTerms ?? []).join(' ')}`)
            .join(' ')} ${country.industry.trade.majorExports.join(' ')} ${country.industry.trade.majorPartners.join(' ')}`,
        },
        {
          label: '文化・歴史・国際',
          text: `${country.cultureAndHistory.languageFamily} ${country.cultureAndHistory.officialLanguages.join(' ')} ${country.cultureAndHistory.religions
            .map((r) => r.name)
            .join(' ')} ${country.cultureAndHistory.ethnicGroups.join(' ')} ${country.cultureAndHistory.regionalIntegrations.join(' ')} ${country.cultureAndHistory.historicalContext
            .map((i) => `${i.label} ${i.detail ?? ''} ${(i.tags ?? []).join(' ')} ${(i.clozeTerms ?? []).join(' ')}`)
            .join(' ')}`,
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
