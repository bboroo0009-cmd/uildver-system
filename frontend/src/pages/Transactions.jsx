import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const typeLabel = {
  produce: 'Үйлдвэрлэв',
  transfer: 'Шилжүүлэв',
  sell: 'Зарав',
  return: 'Буцаав',
};

export default function Transactions() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/reports/transactions').then(setList).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="topbar"><h1>Гүйлгээний түүх</h1></div>
      {error && <div className="error">{error}</div>}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Огноо</th><th>Төрөл</th><th>Бүтээгдэхүүн</th>
              <th>Тоо</th><th>Борлуулагч</th><th>Хэн</th><th>Тэмдэглэл</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString('mn-MN')}</td>
                <td>{typeLabel[t.type] || t.type}</td>
                <td>{t.product_name}</td>
                <td>{t.quantity}</td>
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
