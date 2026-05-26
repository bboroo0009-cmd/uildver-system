import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { auth } from './api/client.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Distributors from './pages/Distributors.jsx';
import Transactions from './pages/Transactions.jsx';
import Sales from './pages/Sales.jsx';
import Users from './pages/Users.jsx';

function Layout({ children }) {
  const user = auth.getUser();
  const navigate = useNavigate();

  const logout = () => {
    auth.clear();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Үйлдвэрийн систем</h2>
        <NavLink to="/" end>Хяналтын самбар</NavLink>
        <NavLink to="/products">Бүтээгдэхүүн</NavLink>
        <NavLink to="/distributors">Борлуулагч</NavLink>
        <NavLink to="/sales">Зарагдсан</NavLink>
        <NavLink to="/transactions">Гүйлгээ</NavLink>
        {user?.role === 'admin' && <NavLink to="/users">Хэрэглэгчид</NavLink>}
        <div style={{ marginTop: 30, fontSize: 13, color: '#9ca3af' }}>
          <div>{user?.full_name || user?.username}</div>
          <div><span className={`badge ${user?.role}`}>{user?.role}</span></div>
          <button className="secondary" style={{ marginTop: 12, width: '100%' }} onClick={logout}>Гарах</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

function Protected({ children }) {
  if (!auth.getToken()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/distributors" element={<Protected><Distributors /></Protected>} />
      <Route path="/sales" element={<Protected><Sales /></Protected>} />
      <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
      <Route path="/users" element={<Protected><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
