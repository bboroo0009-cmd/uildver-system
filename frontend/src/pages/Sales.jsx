import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import BarChart from '../components/BarChart.jsx';
import { formatMoney } from '../utils/format.js';

export default function Sales() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api('/reports/sales').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div>Уншиж байна…</div>;

  const q = search.trim().toLowerCase();
  const filteredTx = q
    ? data.transactions.filter((t) =>
        (t.product_name || '').toLowerCase().includes(q) ||
        (t.distributor_name || '').toLowerCase().includes(q)
      )
    : data.transactions;

  const groupedByDistributor = data.by_distributor.map((d) => ({
    ...d,
    products: data.by_distributor_product.filter((x) => x.distributor_id === d.id),
  }));

  return (
    <div>
      <div className="topbar"><h1>Зарагдсан бараа</h1></div>

      <div className="grid-cards">
        <div className="card">
          <div className="stat-label">Нийт орлого</div>
          <div className="stat">{formatMoney(data.total_revenue)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Нийт зарагдсан ширхэг</div>
          <div className="stat">{data.total_sold}</div>
        </div>
        <div className="card">
          <div className="stat-label">Борлуулалтын гүйлгээний тоо</div>
          <div className="stat">{data.sale_count}</div>
        </div>
      </div>

      <div className="card">
        <h3>Бараа бүрийн орлого</h3>
        <BarChart
          data={data.by_product.map((p) => ({ label: `${p.name} (${p.quantity_sold}ш)`, value: Math.round(p.revenue) }))}
          emptyText="Борлуулалт хараахан алга"
        />
      </div>

      <div className="card">
        <h3>Борлуулагч бүрийн орлого</h3>
        <BarChart
          data={data.by_distributor.map((d) => ({ label: `${d.name} (${d.quantity_sold}ш)`, value: Math.round(d.revenue) }))}
          emptyText="Борлуулалт хараахан алга"
        />
      </div>

      {groupedByDistributor.length > 0 && (
        <div className="card">
          <h3>Борлуулагч бүр ямар бараа хэд зарсан</h3>
          {groupedByDistributor.map((d) => (
            <div key={d.id} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {d.name}
                <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                  (нийт {d.quantity_sold}ш — {formatMoney(d.revenue)})
                </span>
              </div>
              <BarChart
                data={d.products.map((p) => ({ label: `${p.product_name} (${p.quantity_sold}ш)`, value: Math.round(p.revenue) }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Борлуулалтын түүх</h3>
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Бараа эсвэл борлуулагчаар хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          {search && (
            <button type="button" className="secondary" onClick={() => setSearch('')}>Цэвэрлэх</button>
          )}
        </div>
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>
          {filteredTx.length} / {data.transactions.length} гүйлгээ
        </div>
        <table>
          <thead>
            <tr>
              <th>Огноо</th><th>Бараа</th><th>Тоо</th><th>Нэгж үнэ</th><th>Нийт</th><th>Борлуулагч</th><th>Хэн</th><th>Тэмдэглэл</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.length === 0 ? (
              <tr><td colSpan="8" style={{ color: '#6b7280' }}>Гүйлгээ алга</td></tr>
            ) : filteredTx.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString('mn-MN')}</td>
                <td>{t.product_name}</td>
                <td>{t.quantity}</td>
                <td>{formatMoney(t.unit_price)}</td>
                <td><strong>{formatMoney(t.total_price)}</strong></td>
                <td>{t.distributor_name || '—'}</td>
                <td>{t.username || '—'}</td>
                <td>{t.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
