import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports/summary').then(setSummary).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div>Уншиж байна…</div>;

  const totalWarehouse = summary.products.reduce((a, p) => a + p.warehouse, 0);
  const totalDistributed = summary.products.reduce((a, p) => a + p.distributed, 0);
  const totalSold = summary.products.reduce((a, p) => a + p.sold, 0);

  const typeLabel = {
    produce: 'Үйлдвэрлэв', transfer: 'Шилжүүлэв', sell: 'Зарав', return: 'Буцаав',
  };

  return (
    <div>
      <div className="topbar"><h1>Хяналтын самбар</h1></div>

      {summary.low_stock && summary.low_stock.length > 0 && (
        <div className="warning-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            ⚠ Багасч буй нөөц ({summary.low_stock.length})
          </div>
          <div className="low-stock-list">
            {summary.low_stock.map((p) => (
              <div key={p.id} className={`low-stock-item ${p.warehouse_quantity === 0 ? 'empty' : ''}`}>
                <span>{p.name}</span>
                <strong>
                  {p.warehouse_quantity === 0
                    ? 'Дууссан!'
                    : `${p.warehouse_quantity} ширхэг үлдсэн`}
                </strong>
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  (босго: {p.low_stock_threshold})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-cards">
        <div className="card">
          <div className="stat-label">Агуулахын нийт нөөц</div>
          <div className="stat">{totalWarehouse}</div>
        </div>
        <div className="card">
          <div className="stat-label">Борлуулагчид байгаа</div>
          <div className="stat">{totalDistributed}</div>
        </div>
        <div className="card">
          <div className="stat-label">Нийт борлуулсан</div>
          <div className="stat">{totalSold}</div>
        </div>
        <div className="card">
          <div className="stat-label">Борлуулагчийн тоо</div>
          <div className="stat">{summary.distributor_count}</div>
        </div>
      </div>

      <div className="card">
        <h3>Бүтээгдэхүүн тус бүрээр</h3>
        <table>
          <thead>
            <tr><th>Нэр</th><th>Агуулахад</th><th>Борлуулагчид</th><th>Борлуулсан</th></tr>
          </thead>
          <tbody>
            {summary.products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.warehouse}</td>
                <td>{p.distributed}</td>
                <td>{p.sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Сүүлийн гүйлгээ</h3>
        <table>
          <thead>
            <tr><th>Огноо</th><th>Төрөл</th><th>Бүтээгдэхүүн</th><th>Тоо</th><th>Борлуулагч</th><th>Хэн</th></tr>
          </thead>
          <tbody>
            {summary.recent_transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString('mn-MN')}</td>
                <td>{typeLabel[t.type] || t.type}</td>
                <td>{t.product_name}</td>
                <td>{t.quantity}</td>
                <td>{t.distributor_name || '—'}</td>
                <td>{t.username || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
