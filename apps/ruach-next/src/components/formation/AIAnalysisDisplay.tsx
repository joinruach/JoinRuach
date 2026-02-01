"use client";

export interface AnalysisScores {
  depth: number; // 0-1
  specificity: number; // 0-1
  honesty: number; // 0-1
  alignment: number; // 0-1
}

export interface SharpeningQuestion {
  question: string;
  context: string;
}

export interface AIAnalysisDisplayProps {
  scores: AnalysisScores;
  sharpeningQuestions?: SharpeningQuestion[];
  summary?: string;
  isLoading?: boolean;
}

export function AIAnalysisDisplay({
  scores,
  sharpeningQuestions = [],
  summary = "",
  isLoading = false,
}: AIAnalysisDisplayProps) {
  const averageScore =
    (scores.depth + scores.specificity + scores.honesty + scores.alignment) / 4;

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-blue-600 dark:text-blue-400";
    if (score >= 0.4) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 0.8)
      return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
    if (score >= 0.6)
      return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
    if (score >= 0.4)
      return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800";
    return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Fair";
    return "Needs Work";
  };

  const ScoreCard = ({
    label,
    score,
  }: {
    label: string;
    score: number;
  }) => (
    <div
      className={`rounded-lg border p-4 ${getScoreBgColor(score)}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </h4>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {Math.round(score * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            score >= 0.8
              ? "bg-green-500"
              : score >= 0.6
                ? "bg-blue-500"
                : score >= 0.4
                  ? "bg-yellow-500"
                  : "bg-red-500"
          }`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <p className={`mt-2 text-xs font-medium ${getScoreColor(score)}`}>
        {getScoreLabel(score)}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
            <p className="text-blue-900 dark:text-blue-100 font-medium">
              Analyzing your reflection...
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-blue-200 dark:bg-blue-900/30 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-blue-200 dark:bg-blue-900/30 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 p-6">
        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">
          AI Analysis Results
        </h3>
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          Your reflection has been analyzed to identify areas of growth and
          depth in your spiritual formation.
        </p>
      </div>

      {/* Overall Score */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Overall Depth Score
          </p>
          <div className="text-5xl font-bold mb-2">
            <span className={getScoreColor(averageScore)}>
              {Math.round(averageScore * 100)}%
            </span>
          </div>
          <p className={`text-lg font-semibold ${getScoreColor(averageScore)}`}>
            {getScoreLabel(averageScore)}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <ScoreCard label="Depth" score={scores.depth} />
        <ScoreCard label="Specificity" score={scores.specificity} />
        <ScoreCard label="Honesty" score={scores.honesty} />
        <ScoreCard label="Alignment" score={scores.alignment} />
      </div>

      {/* Summary */}
      {summary && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            AI Feedback
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* Sharpening Questions */}
      {sharpeningQuestions && sharpeningQuestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Sharpening Questions for Deeper Reflection
          </h4>
          <div className="space-y-3">
            {sharpeningQuestions.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4"
              >
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  {item.question}
                </p>
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  {item.context}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidance */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">💡 Tip:</span> These scores are
          designed to help you grow deeper in your reflection practice. They're
          not judgments but invitations to greater honesty and specificity.
        </p>
      </div>
    </div>
  );
}
