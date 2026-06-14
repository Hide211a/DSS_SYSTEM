import type { ReactNode } from 'react';
import type { ProductDssAnalysis } from '../types';
import { buildDssConclusion } from '../lib/dssConclusion';
import { RecommendationBadge } from './RecommendationBadge';

const ACCENT_BORDER: Record<string, string> = {
  primary: 'var(--primary)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  ok: 'var(--accent)',
};

interface DssConclusionProps {
  analysis: ProductDssAnalysis;
  isScenario?: boolean;
  actions?: ReactNode;
}

export function DssConclusion({ analysis, isScenario, actions }: DssConclusionProps) {
  const content = buildDssConclusion(analysis);
  const borderColor = ACCENT_BORDER[content.accent] ?? 'var(--border)';

  return (
    <section
      className="card dss-conclusion"
      style={{
        marginTop: '2rem',
        borderColor,
        borderWidth: 2,
        background:
          content.priority === 'high'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--bg-card) 45%)'
            : undefined,
      }}
    >
      <div className="dss-conclusion-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Висновок системи</h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isScenario ? 'На основі what-if сценарію' : 'Підсумок аналізу та рекомендоване рішення'}
          </p>
        </div>
        <RecommendationBadge type={analysis.recommendation} />
      </div>

      <div className="dss-conclusion-grid">
        <div className="dss-conclusion-block">
          <h3>Аналіз ситуації</h3>
          <ul>
            {content.analysis.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="dss-conclusion-block">
          <h3>Рішення DSS</h3>
          <p className="dss-conclusion-decision">{content.decision}</p>
        </div>

        <div className="dss-conclusion-block">
          <h3>Що зробити</h3>
          <ol>
            {content.actions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {actions && <div className="dss-conclusion-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
