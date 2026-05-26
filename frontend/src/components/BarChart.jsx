const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

export default function BarChart({ data, emptyText = 'Өгөгдөл алга' }) {
  if (!data || data.length === 0) {
    return <div style={{ color: '#6b7280', fontSize: 13, padding: '8px 0' }}>{emptyText}</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="bar-row">
            <div className="bar-label" title={d.label}>{d.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
              />
            </div>
            <div className="bar-value">{d.value}</div>
          </div>
        );
      })}
    </div>
  );
}
