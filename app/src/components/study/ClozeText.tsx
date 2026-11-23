import { useState } from 'react';

interface ClozeTermButtonProps {
  term: string;
  forceReveal?: boolean;
}

/**
 * 単一の重要語句をブラインド（暗記用穴埋め）表示し、クリック/タップで個別開示できるコンポーネント
 */
export function ClozeTermButton({ term, forceReveal = false }: ClozeTermButtonProps) {
  const [revealed, setRevealed] = useState(false);
  const isShown = forceReveal || revealed;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setRevealed((v) => !v);
      }}
      title={isShown ? 'クリックで再び隠す' : 'クリックで答えを表示'}
      className={`relative mx-0.5 inline-flex items-center justify-center rounded px-1.5 py-0.5 font-bold transition ${
        isShown
          ? 'bg-amber-100 text-amber-900 underline decoration-amber-400 decoration-dotted'
          : 'bg-slate-800 text-slate-800 hover:bg-slate-700 select-none'
      }`}
    >
      <span className={isShown ? '' : 'opacity-0'}>{term}</span>
      {!isShown && (
        <span className="pointer-events-none absolute text-[10px] font-bold text-slate-200">
          ?
        </span>
      )}
    </button>
  );
}

interface ClozeTextProps {
  text: string;
  clozeTerms?: string[];
  blindMode: boolean;
  forceReveal?: boolean;
}

/**
 * 本文中の重要語句 (clozeTerms) を自動的に検出し、ブラインドモード時にマスク置換するコンポーネント
 */
export function ClozeText({
  text,
  clozeTerms = [],
  blindMode,
  forceReveal = false,
}: ClozeTextProps) {
  if (!blindMode || clozeTerms.length === 0) {
    return <>{text}</>;
  }

  // 長い語句を優先して正規表現分割
  const validTerms = [...new Set(clozeTerms.filter((t) => t.trim().length > 0))].sort(
    (a, b) => b.length - a.length,
  );
  if (validTerms.length === 0) {
    return <>{text}</>;
  }

  const escaped = validTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(regex);
  const termSet = new Set(validTerms);

  return (
    <>
      {parts.map((part, idx) => {
        if (termSet.has(part)) {
          return (
            <ClozeTermButton
              key={`${idx}-${part}`}
              term={part}
              forceReveal={forceReveal}
            />
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}
