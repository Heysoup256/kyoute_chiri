import { ClozeTermButton } from './ClozeText';
import type { PlaceEntry } from '../../types/schema_v1';
import type { PlaceMatcher } from '../../utils/places';

interface RichGeoTextProps {
  text: string;
  clozeTerms?: string[];
  blindMode: boolean;
  forceReveal?: boolean;
  placeMatcher?: PlaceMatcher | null;
  onFocusPlace?: (place: PlaceEntry) => void;
}

/**
 * 暗記モードの穴埋めと、本文中の地名・用語（チェルノーゼム・都市・山脈等）の
 * ワンタップ地図ジャンプ機能を両立するテキスト表示コンポーネント
 */
export function RichGeoText({
  text,
  clozeTerms = [],
  blindMode,
  forceReveal = false,
  placeMatcher,
  onFocusPlace,
}: RichGeoTextProps) {
  const renderWithPlaces = (segment: string, keyPrefix: string) => {
    if (!placeMatcher || !onFocusPlace || segment.length < 2) {
      return <span key={keyPrefix}>{segment}</span>;
    }
    const parts = segment.split(placeMatcher.regex);
    return (
      <span key={keyPrefix}>
        {parts.map((part, idx) => {
          const hit = placeMatcher.lookup.get(part);
          if (hit) {
            return (
              <button
                key={`${keyPrefix}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusPlace(hit);
                }}
                title={`地図で「${hit.name}」の位置を表示（${hit.category}）`}
                className="inline cursor-pointer border-b border-dotted border-indigo-500 font-semibold text-indigo-700 transition hover:bg-indigo-50 hover:text-indigo-900"
              >
                {part}
              </button>
            );
          }
          return <span key={`${keyPrefix}-${idx}`}>{part}</span>;
        })}
      </span>
    );
  };

  if (!blindMode || clozeTerms.length === 0) {
    return <>{renderWithPlaces(text, 'plain')}</>;
  }

  const validTerms = [...new Set(clozeTerms.filter((t) => t.trim().length > 0))].sort(
    (a, b) => b.length - a.length,
  );
  if (validTerms.length === 0) {
    return <>{renderWithPlaces(text, 'plain')}</>;
  }

  const escaped = validTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const clozeRegex = new RegExp(`(${escaped.join('|')})`, 'g');
  const segments = text.split(clozeRegex);
  const termSet = new Set(validTerms);

  return (
    <>
      {segments.map((seg, idx) => {
        if (termSet.has(seg)) {
          return (
            <ClozeTermButton
              key={`c-${idx}-${seg}`}
              term={seg}
              forceReveal={forceReveal}
            />
          );
        }
        return renderWithPlaces(seg, `t-${idx}`);
      })}
    </>
  );
}
