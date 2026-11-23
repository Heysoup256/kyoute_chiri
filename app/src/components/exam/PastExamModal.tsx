import {
  BookOpen,
  CheckCircle2,
  Eye,
  Filter,
  Maximize2,
  PenTool,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PastExamQuestion } from '../../types/schema_v1';
import { formatExamId } from '../../utils/constants';

interface PastExamModalProps {
  isOpen: boolean;
  titleLabel: string;
  questions: PastExamQuestion[];
  initialQuestionId?: string;
  onClose: () => void;
}

/**
 * 共通テスト過去問の切り抜き画像閲覧・4択演習・拡大ライトボックス対応モーダル
 * （特定国の関連過去問モード、および全180問アーカイブ演習モードの両方に対応）
 */
export function PastExamModal({
  isOpen,
  titleLabel,
  questions,
  initialQuestionId,
  onClose,
}: PastExamModalProps) {
  const [examFilter, setExamFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>(() => {
    const found = questions.find((q) => q.questionId === initialQuestionId);
    return found ? found.questionId : (questions[0]?.questionId ?? '');
  });
  const [mode, setMode] = useState<'solve' | 'view'>('solve');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [failedClipUrls, setFailedClipUrls] = useState<Record<string, boolean>>({});

  const examOptions = useMemo(() => {
    const map = new Map<
      string,
      { examId: string; year: number; session: string; label: string; count: number }
    >();
    for (const q of questions) {
      const existing = map.get(q.examId);
      if (existing) {
        existing.count += 1;
      } else {
        const course = q.year >= 2025 ? '地理総合・探究' : '地理B';
        map.set(q.examId, {
          examId: q.examId,
          year: q.year,
          session: q.session,
          label: `${formatExamId(q.examId)}（${course}）`,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.session === b.session) return 0;
      return a.session === 'main' ? -1 : 1;
    });
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return questions.filter((q) => {
      if (examFilter !== 'all' && q.examId !== examFilter) return false;
      if (kw) {
        const hay = `${q.title} ${q.promptSummary ?? ''} ${q.topicTags.join(' ')} ${q.questionLabel}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [questions, examFilter, keyword]);

  if (!isOpen) return null;

  const activeQuestion =
    filteredQuestions.find((q) => q.questionId === selectedId) ??
    filteredQuestions[0] ??
    null;

  const activeClipUrl = resolveClipUrl(activeQuestion?.clipImagePath ?? null);
  const showClipImage = Boolean(activeClipUrl && !failedClipUrls[activeClipUrl]);

  const handleSelectQuestion = (qid: string) => {
    setSelectedId(qid);
    setSelectedChoice(null);
    setIsSubmitted(false);
  };

  const handleCheckAnswer = () => {
    if (selectedChoice === null || !activeQuestion) return;
    setIsSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/65 p-0 backdrop-blur-[2px] md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="関連過去問演習モーダル"
    >
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:max-w-4xl md:rounded-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 md:text-base">
                {titleLabel}
              </h3>
              <p className="text-xs text-slate-500">
                該当問題数: {filteredQuestions.length}問（全{questions.length}問中）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 多数収録時（全180問アーカイブや複数問）の絞り込みバー */}
        {questions.length > 6 && (
          <div className="grid grid-cols-1 gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 sm:grid-cols-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setSelectedChoice(null);
                  setIsSubmitted(false);
                }}
                placeholder="トピック・語句検索..."
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <select
                aria-label="試験回で絞り込み"
                value={examFilter}
                onChange={(e) => {
                  setExamFilter(e.target.value);
                  setSelectedChoice(null);
                  setIsSubmitted(false);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="all">すべての試験回（{examOptions.length}回）</option>
                {examOptions.map((opt) => (
                  <option key={opt.examId} value={opt.examId}>
                    {opt.label} ({opt.count}問)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 問題セレクタ＆モード切替バー */}
        {filteredQuestions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
            {filteredQuestions.length <= 10 ? (
              <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
                {filteredQuestions.map((q) => {
                  const active = q.questionId === activeQuestion?.questionId;
                  return (
                    <button
                      key={q.questionId}
                      type="button"
                      onClick={() => handleSelectQuestion(q.questionId)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {formatExamId(q.examId)} 第{q.daimon ?? ''}問 問{q.toi ?? ''}
                    </button>
                  );
                })}
              </div>
            ) : (
              <select
                aria-label="設問を選択"
                value={activeQuestion?.questionId ?? ''}
                onChange={(e) => handleSelectQuestion(e.target.value)}
                className="max-w-full flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 sm:max-w-md"
              >
                {filteredQuestions.map((q) => (
                  <option key={q.questionId} value={q.questionId}>
                    [{formatExamId(q.examId)}] {q.title}
                  </option>
                ))}
              </select>
            )}

            <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode('solve')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${mode === 'solve' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                解く
              </button>
              <button
                type="button"
                onClick={() => setMode('view')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${mode === 'view' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
              >
                <Eye className="h-3.5 w-3.5" />
                答えを見る
              </button>
            </div>
          </div>
        )}

        {/* 問題本文・画像エリア */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {!activeQuestion ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              該当する過去問がありません。絞り込み条件を変更してください。
            </div>
          ) : (
            <div className="space-y-4">
              {/* メタデータ */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {activeQuestion.sessionLabel ?? formatExamId(activeQuestion.examId)} ／ {activeQuestion.questionLabel}
                    </span>
                    {activeQuestion.points && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        配点 {activeQuestion.points}点
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1.5 text-sm font-bold text-slate-900 md:text-base">
                    {activeQuestion.title}
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeQuestion.topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 切り抜き問題PNG画像 */}
              {showClipImage && activeClipUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setZoomImageUrl(activeClipUrl)}
                    className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-lg bg-slate-900/75 px-2.5 py-1.5 text-xs font-bold text-white shadow hover:bg-slate-900"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    拡大表示
                  </button>
                  <img
                    src={activeClipUrl}
                    alt={`${activeQuestion.questionLabel} 切り抜き問題画像`}
                    onClick={() => setZoomImageUrl(activeClipUrl)}
                    onError={() =>
                      setFailedClipUrls((prev) =>
                        prev[activeClipUrl] ? prev : { ...prev, [activeClipUrl]: true },
                      )
                    }
                    className="max-h-[440px] w-full cursor-zoom-in bg-white object-contain p-1 md:max-h-[520px]"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="mt-1 text-sm leading-relaxed text-slate-800">
                    {activeQuestion.promptSummary}
                  </p>
                </div>
              )}

              {/* 選択肢ボタン（横並びグリッドでスマホも押しやすい） */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">
                  {mode === 'solve'
                    ? '上の問題画像を見て解答番号を選んでください：'
                    : '正解番号：'}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Array.from({ length: activeQuestion.choicesCount }, (_, idx) => {
                    const num = idx + 1;
                    const isCorrect = num === activeQuestion.correctAnswer;
                    const isPicked = num === selectedChoice;

                    let cardClass =
                      'border-slate-300 bg-white text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/40';
                    if (mode === 'view') {
                      cardClass = isCorrect
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-400';
                    } else if (isSubmitted) {
                      if (isCorrect) {
                        cardClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                      } else if (isPicked && !isCorrect) {
                        cardClass = 'border-red-400 bg-red-50 text-red-900';
                      } else {
                        cardClass = 'border-slate-200 bg-white opacity-60';
                      }
                    } else if (isPicked) {
                      cardClass = 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200';
                    }

                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={mode === 'view' || isSubmitted}
                        onClick={() => setSelectedChoice(num)}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition ${cardClass}`}
                      >
                        <span>{'①②③④⑤⑥⑦⑧'[idx] ?? num}</span>
                        {(mode === 'view' || isSubmitted) && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        {mode === 'solve' && isSubmitted && isPicked && !isCorrect && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === 'solve' && !isSubmitted && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={selectedChoice === null}
                    onClick={handleCheckAnswer}
                    className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
                  >
                    答え合わせをする
                  </button>
                </div>
              )}

              {(mode === 'view' || isSubmitted) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {mode === 'solve' && isSubmitted && (
                    <div className="mb-2 flex items-center gap-2">
                      {selectedChoice === activeQuestion.correctAnswer ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          正解！（解答：{activeQuestion.correctAnswer}）
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                          <XCircle className="h-4 w-4" />
                          不正解（正解は {activeQuestion.correctAnswer}）
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-xs font-bold text-slate-700">解答・確認ポイント</div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {activeQuestion.explanation ?? `正解は ${activeQuestion.correctAnswer} です。`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 全画面拡大ライトボックス */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-slate-950/90 p-2 md:p-6"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="flex items-center justify-between pb-2 text-white">
            <span className="text-xs font-semibold text-slate-300">
              背景または閉じるボタンをタップして戻る（スクロールで閲覧）
            </span>
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
            >
              閉じる
            </button>
          </div>
          <div
            className="flex-1 overflow-auto rounded-xl bg-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImageUrl}
              alt="拡大問題画像"
              className="mx-auto h-auto w-full max-w-3xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function resolveClipUrl(clipPath: string | null): string | null {
  if (!clipPath) return null;
  if (/^https?:\/\//.test(clipPath)) return clipPath;
  return `${import.meta.env.BASE_URL}${clipPath.replace(/^\/+/, '')}`;
}
