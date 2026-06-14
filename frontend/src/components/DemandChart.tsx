import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  history: { date: string; quantity: number }[];
  projected?: { date: string; quantity: number }[];
  height?: number;
}

export function DemandChart({ history, projected = [], height = 280 }: Props) {
  const historyData = history.slice(-30).map((h) => ({
    date: h.date.slice(5),
    fact: h.quantity,
    prognoz: null as number | null,
  }));

  const projectedData = projected.slice(0, 14).map((p) => ({
    date: p.date.slice(5),
    fact: null as number | null,
    prognoz: p.quantity,
  }));

  const lastHist = historyData[historyData.length - 1];
  const merged = [
    ...historyData,
    ...(lastHist && projectedData.length
      ? [{ ...projectedData[0], fact: lastHist.fact }]
      : []),
    ...projectedData.slice(1),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={merged}>
        <defs>
          <linearGradient id="factGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" />
        <XAxis dataKey="date" stroke="#8b9bb4" fontSize={11} />
        <YAxis stroke="#8b9bb4" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: '#1a2230',
            border: '1px solid #2a3548',
            borderRadius: 8,
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="fact"
          name="Фактичний попит"
          stroke="#3b82f6"
          fill="url(#factGrad)"
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="prognoz"
          name="Прогноз"
          stroke="#10b981"
          fill="none"
          strokeDasharray="5 5"
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
