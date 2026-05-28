import { useEffect, useState } from 'react';
import { api, auth } from '../api/client.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'uildver' });
  const [error, setError] = useState('');
  const me = auth.getUser();

  const load = () => api('/auth/users').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/users', { method: 'POST', body: JSON.stringify(form) });
      setForm({ username: '', password: '', full_name: '', role: 'uildver' });
      load();
    } catch (err) { setError(err.message); }
  };

  const changePassword = async (u) => {
    const pass = prompt(`"${u.username}" хэрэглэгчийн шинэ нууц үг (6-аас дээш тэмдэгт):`);
    if (pass === null) return;
    if (pass.length < 6) { alert('Нууц үг 6-аас доошгүй байх ёстой.'); return; }
    try {
      await api(`/auth/users/${u.id}/password`, { method: 'PUT', body: JSON.stringify({ password: pass }) });
      alert(`${u.username}-ийн нууц үг шинэчлэгдсэн.`);
    } catch (err) { setError(err.message); }
  };

  const removeUser = async (u) => {
    if (!confirm(`"${u.username}" хэрэглэгчийг устгах уу?`)) return;
    try {
      await api(`/auth/users/${u.id}`, { method: 'DELETE' });
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <div className="topbar"><h1>Хэрэглэгчид</h1></div>

      <div className="card">
        <h3>Шинэ хэрэглэгч нэмэх</h3>
        <form onSubmit={submit} className="row">
          <input placeholder="Хэрэглэгчийн нэр" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required style={{ flex: 1 }}/>
          <input placeholder="Овог нэр" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={{ flex: 1 }}/>
          <input type="password" placeholder="Нууц үг" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ flex: 1 }}/>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="uildver">Үйлдвэр</option>
            <option value="borluulagch">Борлуулагч</option>
          </select>
          <button type="submit">Нэмэх</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Нэр</th><th>Овог нэр</th><th>Эрх</th><th>Үүсгэсэн</th><th>Үйлдэл</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.full_name || '—'}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString('mn-MN')}</td>
                <td>
                  <button className="secondary" onClick={() => changePassword(u)} style={{ marginRight: 6 }}>Нууц үг солих</button>
                  {u.id !== me?.id && (
                    <button className="danger" onClick={() => removeUser(u)}>Устгах</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
