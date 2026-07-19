import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleSelect from '../small/RoleSelect';
axios.defaults.withCredentials = true;

interface Employee {
    id?: number;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    role: string;
    password?: string;
}

export default function EmployeeManager() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Состояния для формы (создание / редактирование)
    const [formData, setFormData] = useState<Employee>({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        role: 'Employee', // <-- По умолчанию обычный сотрудник
        password: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Глобальный URL твоего бэкенда
    // const API_URL = 'https://localhost:7291/api/employees';
    const API_URL = '/api/employees';


    // Получение списка (обычное или через поиск)
    const fetchEmployees = async (query = '') => {
        setLoading(true);
        try {
            const url = query ? `${API_URL}/search?query=${encodeURIComponent(query)}` : API_URL;
            const res = await axios.get(url);
            setEmployees(res.data);
        } catch (err) {
            console.error("Ошибка при загрузке сотрудников", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Хандлер поиска с AJAX
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        fetchEmployees(value); // Мгновенный поиск при вводе
    };

    // Сохранение (Create или Update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // PUT запрос (Обновление)
                await axios.put(`${API_URL}/${editingId}`, formData);
            } else {
                // POST запрос (Создание)
                await axios.post(API_URL, formData);
            }
            resetForm();
            fetchEmployees(searchQuery);
        } catch (err) {
            console.error("Не удалось сохранить сотрудника", err);
        }
    };

    // Удаление
    const handleDelete = async (id: number) => {
        if (!window.confirm("Удалить сотрудника из системы?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchEmployees(searchQuery);
        } catch (err) {
            console.error("Ошибка при удалении", err);
        }
    };

    const startEdit = (emp: Employee) => {
        setEditingId(emp.id!);
        setFormData({
            firstName: emp.firstName,
            lastName: emp.lastName,
            middleName: emp.middleName || '',
            email: emp.email,
            role: emp.role || 'Employee' // <-- Передаем роль в форму редактирования
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ firstName: '', lastName: '', middleName: '', email: '', role: 'Employee', password: '' });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="max-w-5xl mx-auto px-4">
            {/* ЗАГОЛОВОК И КНОПКА ДОБАВЛЕНИЯ */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-xl font-bold tracking-tight uppercase font-mono">Состав Команды</h1>
                    <p className="text-xs text-zinc-500 font-mono mt-1">Управление учетными карточками сотрудников</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-white text-black text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded border border-white hover:bg-black hover:text-white transition-all"
                    >
                        + Добавить сотрудника
                    </button>
                )}
            </div>

            {/* ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4 animate-fadeIn">
                    <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 border-b border-zinc-900 pb-2">
                        {editingId ? 'Редактировать профиль' : 'Новая карточка сотрудника'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="flex flex-col space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider">Фамилия</label>
                            <input
                                type="text" required
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider">Имя</label>
                            <input
                                type="text" required
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider">Отчество (при наличии)</label>
                            <input
                                type="text"
                                value={formData.middleName}
                                onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                                className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider">E-mail</label>
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 pt-2 text-xs font-mono">
                        <button
                            type="submit"
                            className="bg-white text-black px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                        >
                            {editingId ? 'Сохранить изменения' : 'Создать запись'}
                        </button>
                        <button
                            type="button" onClick={resetForm}
                            className="border border-zinc-800 text-zinc-400 px-4 py-2 rounded uppercase tracking-wider hover:text-white transition-colors"
                        >
                            Отмена
                        </button>
                    </div>

                    {!editingId && (
                        <div className="flex flex-col space-y-1">
                            <label className="text-zinc-500 uppercase tracking-wider">Пароль для входа</label>
                            <input
                                type="password"
                                placeholder="Если пусто: password123"
                                value={formData.password || ''}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="bg-black border border-zinc-800 text-white p-2.5 rounded focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>
                    )}

                    {/* Выпадающий список выбора Роли */}
                    <RoleSelect
                        value={formData.role}
                        onChange={(newRole) => setFormData({ ...formData, role: newRole })}
                    />

                </form>
            )}

            {/* ЖИВОЙ ПОИСК */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="ЖИВОЙ ПОИСК ПО ФИО ИЛИ EMAIL..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full bg-zinc-950 border border-zinc-900 text-zinc-300 font-mono text-xs tracking-wider p-3 pl-4 rounded focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-700"
                />
            </div>

            {/* ТАБЛИЦА СОТРУДНИКОВ */}
            <div className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950/40">
                <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                        <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-500 uppercase tracking-wider">
                            <th className="p-4 font-normal">Сотрудник</th>
                            <th className="p-4 font-normal">Email</th>
                            <th className="p-4 font-normal">Роль</th> {/* Поставили перед действиями */}
                            <th className="p-4 font-normal text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                {/* colSpan теперь 4 */}
                                <td colSpan={4} className="p-8 text-center text-zinc-600 uppercase tracking-widest animate-pulse">
                                    Загрузка базы данных...
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                {/* colSpan теперь 4 */}
                                <td colSpan={4} className="p-8 text-center text-zinc-600 uppercase tracking-widest">
                                    Никого не найдено
                                </td>
                            </tr>
                        ) : (
                            employees.map(emp => (
                                <tr key={emp.id} className="border-b border-zinc-900/60 hover:bg-zinc-950/80 transition-colors group">
                                    <td className="p-4 text-zinc-200">
                                        <span className="font-bold">{emp.lastName}</span> {emp.firstName} {emp.middleName}
                                    </td>
                                    <td className="p-4 text-zinc-400">{emp.email}</td>

                                    {/* ВОТ СЮДА КРАСИВО ВСТАЕТ СТИЛИЗОВАННАЯ РОЛЬ */}
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${emp.role === 'Leader' ? 'bg-white text-black' :
                                            emp.role === 'ProjectManager' ? 'border border-zinc-500 text-zinc-300' : 'text-zinc-500'
                                            }`}>
                                            {emp.role || 'Employee'}
                                        </span>
                                    </td>

                                    <td className="p-4 text-right space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(emp)}
                                            className="text-zinc-400 hover:text-white border border-zinc-900 px-2 py-1 rounded transition-colors"
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id!)}
                                            className="text-red-500/70 hover:text-red-400 border border-zinc-900 px-2 py-1 rounded transition-colors"
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}