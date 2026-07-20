import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        '/api/auth/login', 
        { email, password },
        { withCredentials: true }
      );
      
      onLoginSuccess(res.data); 
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono text-xs">
      <div className="w-full max-w-sm border border-zinc-900 bg-zinc-950 p-6 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
          <span className="uppercase font-bold tracking-widest text-zinc-400">Вход в систему</span>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">✕</button>
        </div>

        {error && (
          <div className="mb-4 border border-red-900 bg-red-950/20 text-red-400 p-2.5 rounded text-[11px] uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-500 uppercase tracking-wider text-[10px]">Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500"
              placeholder="name@company.com"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-zinc-500 uppercase tracking-wider text-[10px]">Пароль</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-white text-black font-bold uppercase tracking-widest p-2.5 rounded border border-white hover:bg-black hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? 'ПРОВЕРКА...' : 'ВОЙТИ'}
          </button>
        </form>
      </div>
    </div>
  );
}