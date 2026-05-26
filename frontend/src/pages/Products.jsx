import { useEffect, useState } from 'react';
import { api, auth } from '../api/client.js';
import BarChart from '../components/BarChart.jsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });
  const [produceFor, setProduceFor] = useState(null);
  const [produceQty, setProduceQty] = useState('');
  const [produceNote, setProduceNote] = useState('');
  const user = auth.getUser();
  const canEdit = ['admin', 'uildver'].includes(user?.role);

  const load = () => {
    api('/products').then(setProducts).catch((e) => setError(e.message));
    api('/distributors').then(setDistributors).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const distributorsByProduct = (productId) =>
    distributors
      .map((d) => {
        const s = (d.stock || []).find((x) => x.product_id === productId);
        return { label: d.name, value: s ? Number(s.quantity) || 0 : 0 };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await api('/products', { method: 'POST', body: JSON.stringify(newProduct) });
      setNewProduct({ name: '', description: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  const submitProduce = async (e) => {
    e.preventDefault();
    try {
      await api(`/products/${produceFor.id}/produce`, {
        method: 'POST',
        body: JSON.stringify({ quantity: parseInt(produceQty, 10), note: produceNote }),
      });
      setProduceFor(null);
      setProduceQty('');
      setProduceNote('');
      load();
    } catch (err) { setError(err.message); }
  };

  const editThreshold = async (p) => {
    const input = prompt(
      `"${p.name}" — анхааруулгын босго оруулна уу.\n\nАгуулахын нөөц энэ тооноос бага болоход анхааруулга гарна.`,
      String(p.low_stock_threshold ?? 5)
    );
    if (input === null) return;
    const val = parseInt(input, 10);
    if (Number.isNaN(val) || val < 0) {
      alert('Бүхэл тоо оруулна уу.');
      return;
    }
    try {
      await api(`/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ low_stock_threshold: val }),
      });
      load();
    } catch (err) { setError(err.message); }
  };

  const remove = async (id, name) => {
    if (!confirm(`"${name}" бүтээгдэхүүнийг устгах уу?\n\nХэрэв гүйлгээний түүх байгаа бол архивлагдана.`)) return;
    try {
      const r = await api(`/products/${id}`, { method: 'DELETE' });
      if (r.archived) {
        setError('');
        alert(r.message || 'Гүйлгээтэй учир архивлав.');
      }
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <div className="topbar"><h1>Бүтээгдэхүүн</h1></div>

      {canEdit && (
        <div className="card">
          <h3>Шинэ бүтээгдэхүүн нэмэх</h3>
          <form onSubmit={addProduct} className="row">
            <input
              placeholder="Нэр" value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              style={{ flex: 1 }} required
            />
            <input
              placeholder="Тайлбар" value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              style={{ flex: 2 }}
            />
            <button type="submit">Нэмэх</button>
          </form>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {products.length > 0 && (
        <div className="card">
          <h3>Агуулахын нөөц (график)</h3>
          <BarChart
            data={products.map((p) => ({ label: p.name, value: Number(p.warehouse_quantity) || 0 }))}
          />
        </div>
      )}

      {products.length > 0 && (
        <div className="card">
          <h3>Бараа бүрээр — ямар борлуулагчид хэд хэдэн ширхэг байна</h3>
          {products.map((p) => {
            const data = distributorsByProduct(p.id);
            return (
              <div key={p.id} style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {p.name}
                  <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                    (нийт {p.total_distributed} ширхэг)
                  </span>
                </div>
                <BarChart data={data} emptyText="Энэ бараа борлуулагчид алга" />
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Нэр</th><th>Тайлбар</th><th>Агуулахад</th><th>Борлуулагчид</th><th>Босго</th>
              {canEdit && <th>Үйлдэл</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const wh = Number(p.warehouse_quantity) || 0;
              const threshold = Number(p.low_stock_threshold) || 0;
              const isLow = wh <= threshold;
              const isEmpty = wh === 0;
              const rowClass = isLow ? (isEmpty ? 'low-stock-row empty' : 'low-stock-row') : '';
              return (
                <tr key={p.id} className={rowClass}>
                  <td>
                    <strong>{p.name}</strong>
                    {isEmpty && <span style={{ marginLeft: 8, fontSize: 12, color: '#991b1b' }}>● Дууссан</span>}
                    {isLow && !isEmpty && <span style={{ marginLeft: 8, fontSize: 12, color: '#78350f' }}>● Багасч байна</span>}
                  </td>
                  <td>{p.description}</td>
                  <td>{wh}</td>
                  <td>{p.total_distributed}</td>
                  <td>{threshold}</td>
                  {canEdit && (
                    <td>
                      <button onClick={() => setProduceFor(p)} style={{ marginRight: 6 }}>Үйлдвэрлэв</button>
                      <button className="secondary" onClick={() => editThreshold(p)} style={{ marginRight: 6 }}>Босго</button>
                      {user.role === 'admin' && (
                        <button className="danger" onClick={() => remove(p.id, p.name)}>Устгах</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {produceFor && (
        <div className="modal-bg" onClick={() => setProduceFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{produceFor.name} — үйлдвэрлэл нэмэх</h3>
            <form onSubmit={submitProduce}>
              <div className="form-group">
                <label>Тоо ширхэг</label>
                <input type="number" min="1" value={produceQty} onChange={(e) => setProduceQty(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Тэмдэглэл</label>
                <input value={produceNote} onChange={(e) => setProduceNote(e.target.value)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setProduceFor(null)}>Болих</button>
                <button type="submit">Хадгалах</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
