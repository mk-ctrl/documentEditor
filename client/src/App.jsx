import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EditorPage from './pages/EditorPage.jsx';
import NotFound from './pages/NotFound.jsx';

const priv = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={priv(<Dashboard />)} />
        <Route path="/d/:id" element={priv(<EditorPage />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
