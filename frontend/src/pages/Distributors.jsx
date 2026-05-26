import { useEffect, useState } from 'react';
import { api, auth } from '../api/client.js';
import BarChart from '../components/BarChart.jsx';

export default function Distributors() {
  const [distributors, setDistributors] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [transferFor, setTransferFor] = useState(null);
  const [sellFor, setSellFor] = useState(null);
  const [actionData, setActionData] = useState({ product_id: '', quantity: '', note: '' });
  const [search, setSearch] = useState('');
  const user = auth.getUser();
  const canEdit = ['admin', 'uildver'].includes(user?.role);

  const load = () => {
    api('/distributors').then(setDistributors).catch((e) => setError(e.message));
    api('/products').then(setProducts).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addDistributor = async (e) => {
    e.preventDefault();
    try {
      await api('/distributors', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', phone: '', location: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  const submitAction = async (e) => {
    e.preventDefault();
    const target = transferFor || sellFor;
    const endpoint = transferFor ? 'transfer' : 'sell';
    try {
      await api(`/distributors/${target.id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: parseInt(actionData.product_id, 10),
          quantity: parseInt(actionData.quantity, 10),
          note: actionData.note,
        }),
      });
      setTransferFor(null);
      setSellFor(null);
      setActionData({ product_id: '', quantity: '', note: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  const remove = async (id) => {
    if (!confirm('Устгах уу?')) return;
    try { await api(`/distributors/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { setError(err.message); }
  };

  const modalOpen = transferFor || sellFor;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? distributors.filter((d) => (d.name || '').toLowerCase().includes(q))
    : distributors;

  return (
    <div>
      <div className="topbar"><h1>Борлуулагч</h1></div>

      {canEdit && (
        <div className="card">
          <h3>Шинэ борлуулагч</h3>
          <form onSubmit={addDistributor} className="row">
            <input placeholder="Нэр" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ flex: 1 }}/>
            <input placeholder="Утас" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ flex: 1 }}/>
            <input placeholder="Байршил" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ flex: 1 }}/>
            <button type="submit">Нэмэх</button>
          </form>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="row">
          <input
            placeholder="Нэрээр хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          {search && (
            <button type="button" className="secondary" onClick={() => setSearch('')}>
              Цэвэрлэх
            </button>
          )}
        </div>
        <div style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
          {filtered.length} / {distributors.length} борлуулагч
        </div>
      </div>

      {filtered.length === 0 && distributors.length > 0 && (
        <div className="card" style={{ color: '#6b7280' }}>Хайлтад тохирох борлуулагч олдсонгүй.</div>
      )}

      {filtered.map((d) => (
        <div key={d.id} className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>{d.name}</h3>
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                {d.phone || '—'} · {d.location || '—'}
              </div>
            </div>
            <div className="row">
              {canEdit && <button onClick={() => setTransferFor(d)}>Шилжүүлэх</button>}
              <button className="secondary" onClick={() => setSellFor(d)}>Зарагдсан бүртгэх</button>
              {user.role === 'admin' && <button className="danger" onClick={() => remove(d.id)}>Устгах</button>}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <BarChart
              data={d.stock.map((s) => ({ label: s.product_name, value: Number(s.quantity) || 0 }))}
              emptyText="Нөөц алга"
            />
          </div>
        </div>
      ))}

      {modalOpen && (
        <div className="modal-bg" onClick={() => { setTransferFor(null); setSellFor(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{(transferFor || sellFor).name} — {transferFor ? 'Шилжүүлэх' : 'Зарагдсан бүртгэх'}</h3>
            <form onSubmit={submitAction}>
              <div className="form-group">
                <label>Бүтээгдэхүүн</label>
                <select value={actionData.product_id} onChange={(e) => setActionData({ ...actionData, product_id: e.target.value })} required>
                  <option value="">— сонгох —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Тоо ширхэг</label>
                <input type="number" min="1" value={actionData.quantity} onChange={(e) => setActionData({ ...actionData, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Тэмдэглэл</label>
                <input value={actionData.note} onChange={(e) => setActionData({ ...actionData, note: e.target.value })} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => { setTransferFor(null); setSellFor(null); }}>Болих</button>
                <button type="submit">Хадгалах</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
