import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../api/client.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      auth.set(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>Нэвтрэх</h1>
        <div className="form-group">
          <label>Хэрэглэгчийн нэр</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Нууц үг</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
        </button>
        <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          Жишээ: admin / admin123
        </div>
      </form>
    </div>
  );
}
