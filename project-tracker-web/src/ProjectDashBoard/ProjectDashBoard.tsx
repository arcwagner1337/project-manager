import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PrioritySelect from '../components/small/PrioritySelect';
import ProjectDetailsModal from '../components/normal/ProjectDetailsModal';
import ProjectEditModal from '../components/normal/ProjectEditModal';
axios.defaults.withCredentials = true;

interface Employee {
    id: number;
    fullName: string;
    email: string;
}

interface Project {
    id: number;
    name: string;
    customerCompany: string;
    executorCompany: string;
    startDate: string;
    endDate: string;
    priority: number;
    projectManagerId: number | null;
    projectManagerName: string | null;
    employees: Employee[];
}

interface ProjectDashboardProps {
    onStartWizard: () => void;
    currentUser: any;
}

export default function ProjectDashboard({ onStartWizard, currentUser }: ProjectDashboardProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Стейты для фильтрации
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    useEffect(() => {
        fetchProjects();
    }, [currentUser]);

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            // Передаем параметры, как их просит Swagger. 
            // Если на бэке аргументы метода не Nullable, отсутствие этих параметров в GET-запросе как раз и вызывает 500!
            // const res = await axios.get('https://localhost:7291/api/Projects', {
            const res = await axios.get('/api/Projects', {

                params: {
                    startDateFrom: null,
                    startDateTo: null,
                    priority: null,
                    sortBy: null,
                    descending: false
                }
            });
            setProjects(res.data);
        } catch (err: any) {
            console.error("Ошибка загрузки проектов:", err);

            // Если бэк вернул 500, вытаскиваем детальное описание ошибки из эксепшена ASP.NET
            const apiError = err.response?.data;
            const detail = typeof apiError === 'string'
                ? apiError
                : apiError?.detail || apiError?.title || 'Ошибка сервера (500)';

            setError(`Не удалось загрузить проекты: ${detail}`);
        } finally {
            setLoading(false);
        }
    };


    const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
        // Останавливаем всплытие события, чтобы при клике на "Удалить" не открывалась модалка деталей
        e.stopPropagation();

        if (!window.confirm("Вы уверены, что хотите удалить этот проект и все связанные документы?")) {
            return;
        }

        try {
            // await axios.delete(`https://localhost:7291/api/Projects/${id}`);
            await axios.delete(`/api/Projects/${id}`);

            // Обновляем локальный стейт, убирая удаленный проект
            setProjects((prev) => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error("Ошибка при удалении проекта:", err);
            alert("Не удалось удалить проект. Ошибка сервера.");
        }
    };





    const getPriorityLabel = (prio: number) => {
        switch (prio) {
            case 1: return 'Очень низкий';
            case 2: return 'Низкий';
            case 3: return 'Средний';
            case 4: return 'Высокий';
            case 5: return 'Очень высокий';
            default: return 'Не указан';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Фильтрация проектов на клиенте
    const filteredProjects = projects.filter(proj => {
        const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            proj.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
            proj.executorCompany.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPriority = priorityFilter === 'all' || proj.priority.toString() === priorityFilter;

        return matchesSearch && matchesPriority;
    });

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4">

            {/* 1. ВЕРХНЯЯ ПАНЕЛЬ С АНАЛИТИКОЙ И КНОПКОЙ */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl font-light uppercase tracking-widest text-white">Панель проектов</h1>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
                        Всего проектов в системе: {projects.length}
                    </p>
                </div>
                <button
                    onClick={onStartWizard}
                    className="self-start sm:self-center rounded-lg bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
                >
                    + Создать проект
                </button>
            </div>

            {/* 2. БЛОК ФИЛЬТРОВ */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                {/* Поиск */}
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Поиск проекта</label>
                    <input
                        type="text"
                        placeholder="Название, заказчик, исполнитель..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 transition-all outline-none focus:border-zinc-400"
                    />
                </div>

                {/* Фильтр по приоритету */}
                <div className="space-y-1">
                    <PrioritySelect
                        value={priorityFilter}
                        onChange={(val) => setPriorityFilter(val)}
                    />
                </div>

                {/* Статистика на лету */}
                <div className="flex items-center justify-around border-l border-zinc-800 pl-4 hidden md:flex font-mono text-[11px]">
                    <div className="text-center">
                        <span className="block text-zinc-500 uppercase tracking-widest text-[9px] mb-1">Найдено</span>
                        <span className="text-lg text-white font-semibold">{filteredProjects.length}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-zinc-500 uppercase tracking-widest text-[9px] mb-1">Высокий приоритет</span>
                        <span className="text-lg text-white font-semibold">
                            {filteredProjects.filter(p => p.priority >= 4).length}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. СПИСОК ПРОЕКТОВ (ГРИД) */}
            {loading ? (
                <div className="text-center py-20 text-zinc-500 font-mono text-xs uppercase tracking-widest">
                    Загрузка проектов...
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500 border border-red-950/40 rounded-xl bg-red-950/10 text-xs font-mono">
                    {error}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-xl text-xs uppercase tracking-widest font-mono">
                    Проекты не найдены
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-zinc-500 hover:shadow-lg hover:shadow-white/5 cursor-pointer"
                        >
                            <div>
                                {/* Шапка карточки */}
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                        {getPriorityLabel(project.priority)} приоритет
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] text-zinc-600 font-mono mr-1">ID: {project.id}</span>
                                        {/* Иконка крестика удаления */}
                                        <button
                                            onClick={(e) => handleDeleteProject(project.id, e)}
                                            className="text-zinc-600 hover:text-red-500 transition-colors p-1 text-xs font-mono"
                                            title="Удалить проект"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Название */}
                                <h3 className="text-md font-medium text-white group-hover:text-zinc-300 transition-colors uppercase tracking-wide">
                                    {project.name}
                                </h3>

                                {/* Заказчик / Исполнитель */}
                                <div className="mt-3 space-y-1 text-xs border-t border-zinc-900 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Компания-Заказчик:</span>
                                        <span className="text-zinc-300 font-medium">{project.customerCompany}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Компания-Исполнитель:</span>
                                        <span className="text-zinc-300 font-medium">{project.executorCompany}</span>
                                    </div>
                                </div>

                                {/* Сроки */}
                                <div className="mt-3 flex justify-between bg-zinc-900/30 rounded px-2.5 py-1.5 text-[11px] font-mono text-zinc-400">
                                    <span>С: {formatDate(project.startDate)}</span>
                                    <span>По: {formatDate(project.endDate)}</span>
                                </div>
                            </div>

                            {/* Футер карточки (Менеджер и Команда) */}
                            <div className="mt-6 border-t border-zinc-900 pt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Руководитель</p>
                                    <p className="text-xs text-zinc-300 font-medium mt-0.5">
                                        {project.projectManagerName || 'Не назначен'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Команда</p>
                                    <p className="text-xs text-zinc-300 font-mono mt-0.5">
                                        {project.employees.length} чел.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedProject && (
                <ProjectDetailsModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    // Вот сюда мы и вставляем этот парт!
                    onEdit={(proj) => {
                        setSelectedProject(null); // Закрываем модалку деталей
                        setEditingProject(proj);  // Передаем проект в стейт редактирования (что автоматически откроет вторую модалку)
                    }}
                />
            )}

            {/* Модалка редактирования (откроется сразу после закрытия деталей, так как стейт изменился) */}
            {editingProject && (
                <ProjectEditModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={() => {
                        setEditingProject(null);
                        fetchProjects(); // Перезагружаем список с бэка после сохранения
                    }}
                />
            )}

        </div>
    );
}