import { recommendationBadgeClass, recommendationLabel } from '../lib/format';

export function RecommendationBadge({ type }: { type: string }) {
  return (
    <span className={`badge ${recommendationBadgeClass(type)}`}>
      {recommendationLabel(type)}
    </span>
  );
}
