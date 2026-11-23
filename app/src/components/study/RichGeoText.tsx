import type { PlaceEntry } from '../../types/schema_v1';
import type { PlaceMatcher } from '../../utils/places';

interface RichGeoTextProps {
  text: string;
  placeMatcher?: PlaceMatcher | null;
  onFocusPlace?: (place: PlaceEntry) => void;
}

/**
 * 本文中の地名・用語（チェルノーゼム・都市・山脈等）のワンタップ地図ハイライト表示コンポーネント
 */
export function RichGeoText({
  text,
  placeMatcher,
  onFocusPlace,
}: RichGeoTextProps) {
  if (!placeMatcher || !onFocusPlace || text.length < 2) {
    return <span>{text}</span>;
  }
  const parts = text.split(placeMatcher.regex);
  return (
    <span>
      {parts.map((part, idx) => {
        const hit = placeMatcher.lookup.get(part);
        if (hit) {
          return (
            <button
              key={`pl-${idx}`}
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
        return <span key={`tx-${idx}`}>{part}</span>;
      })}
    </span>
  );
}
