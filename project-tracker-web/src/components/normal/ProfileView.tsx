import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface ProfileViewProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  onUpdateSuccess: (updatedUser: any) => void;
  onLogoutSuccess: () => void;
}

export default function ProfileView({ user, onUpdateSuccess, onLogoutSuccess }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // При переходе к редактированию бьем строку "Петров Иван Сидорович" по пробелам
  const nameParts = user.fullName.split(' ');

  // Стейты для раздельных полей ФИО
  const [lastName, setLastName] = useState(nameParts[0] || '');
  const [firstName, setFirstName] = useState(nameParts[1] || '');
  const [middleName, setMiddleName] = useState(nameParts[2] || '');
  
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleLogoutClick = async () => {
    try {
    //   await axios.post('https://localhost:7291/api/auth/logout', {}, { withCredentials: true });
      await axios.post('/api/auth/logout', {}, { withCredentials: true });

      onLogoutSuccess();
    } catch (err) {
      onLogoutSuccess();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Передаем объект строго под твой новый UpdateProfileDto
      const res = await axios.put(
        // 'https://localhost:7291/api/auth/update-profile',
        '/api/auth/update-profile',

        { 
          firstName, 
          lastName, 
          middleName: middleName || null, 
          email, 
          currentPassword: currentPassword || null, 
          newPassword: newPassword || null 
        },
        { withCredentials: true }
      );

      onUpdateSuccess(res.data); // Бэк вернет fullName, собранный заново
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setMessage({ text: 'Профиль успешно обновлен', isError: false });
    } catch (err: any) {
      setMessage({ 
        text: err.response?.data?.message || 'Ошибка при сохранении данных', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 font-mono text-xs">
      <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-lg space-y-6">
        
        <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-tight">Личный Кабинет</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Управление профилем</p>
          </div>
          <button 
            type="button"
            onClick={() => { 
              setIsEditing(!isEditing); 
              setMessage(null);
              // Сбрасываем к актуальным значениям при отмене
              const freshParts = user.fullName.split(' ');
              setLastName(freshParts[0] || '');
              setFirstName(freshParts[1] || '');
              setMiddleName(freshParts[2] || '');
              setEmail(user.email);
            }}
            className="border border-zinc-800 text-zinc-400 px-3 py-1 rounded uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer"
          >
            {isEditing ? 'Отмена' : 'Редактировать'}
          </button>
        </div>

        {message && (
          <div className={`border p-2.5 rounded text-[11px] uppercase tracking-wider ${
            message.isError ? 'border-red-900 bg-red-950/20 text-red-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
          }`}>
            {message.text}
          </div>
        )}

        {!isEditing ? (
          /* РЕЖИМ ПРОСМОТРА */
          <div className="space-y-4">
            <div>
              <span className="text-zinc-600 block uppercase text-[10px]">Сотрудник</span>
              <span className="text-zinc-200 text-sm font-bold">{user.fullName}</span>
            </div>
            <div>
              <span className="text-zinc-600 block uppercase text-[10px]">Электронная почта</span>
              <span className="text-zinc-400">{user.email}</span>
            </div>
            <div>
              <span className="text-zinc-600 block uppercase text-[10px]">Уровень доступа</span>
              <span className="inline-block bg-white text-black font-bold text-[10px] px-2 py-0.5 rounded mt-1 uppercase">
                {user.role}
              </span>
            </div>
            <div className="pt-4 border-t border-zinc-900">
              <button 
                onClick={handleLogoutClick}
                className="w-full text-center border border-zinc-800 text-zinc-500 py-2 rounded uppercase tracking-wider hover:text-red-400 hover:border-red-950 transition-colors cursor-pointer"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        ) : (
          /* РЕЖИМ РЕДАКТИРОВАНИЯ */
          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-500 uppercase tracking-wider text-[9px]">Фамилия</label>
                <input 
                  type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  className="bg-black border border-zinc-800 text-white p-2 rounded focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-500 uppercase tracking-wider text-[9px]">Имя</label>
                <input 
                  type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="bg-black border border-zinc-800 text-white p-2 rounded focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-500 uppercase tracking-wider text-[9px]">Отчество</label>
                <input 
                  type="text" value={middleName} onChange={e => setMiddleName(e.target.value)}
                  className="bg-black border border-zinc-800 text-white p-2 rounded focus:outline-none focus:border-zinc-500"
                  placeholder="При наличии"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-zinc-500 uppercase tracking-wider text-[10px]">Email</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="pt-2 border-t border-zinc-900 space-y-3">
              <span className="text-zinc-600 block uppercase text-[9px] tracking-widest font-bold">Безопасность (заполни для смены пароля)</span>
              
              <div className="flex flex-col space-y-1">
                <label className="text-zinc-500 uppercase tracking-wider text-[10px]">Текущий пароль</label>
                <input 
                  type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-zinc-500 uppercase tracking-wider text-[10px]">Новый пароль</label>
                <input 
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-white text-black font-bold uppercase tracking-widest p-2.5 rounded border border-white hover:bg-black hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}