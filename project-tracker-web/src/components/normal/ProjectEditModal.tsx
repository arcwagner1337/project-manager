import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PrioritySelect from '../small/PrioritySelect';
import EmployeeSearchSelect from '../small/EmployeeSearchSelect';
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

interface ProjectEditModalProps {
    project: Project;
    onClose: () => void;
    onSave: () => void;
}

interface ProjectDocument {
    id: number;
    fileName: string;
    uploadedAt: string;
}

export default function ProjectEditModal({ project, onClose, onSave }: ProjectEditModalProps) {
    const [name, setName] = useState(project.name);
    const [customerCompany, setCustomerCompany] = useState(project.customerCompany);
    const [executorCompany, setExecutorCompany] = useState(project.executorCompany);
    const [startDate, setStartDate] = useState(project.startDate.split('T')[0]);
    const [endDate, setEndDate] = useState(project.endDate.split('T')[0]);
    const [priority, setPriority] = useState(project.priority.toString());

    // Docs states
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [uploading, setUploading] = useState(false);

    // For PM select
    const [pm, setPm] = useState<{ id: number; fullName: string } | null>(
        project.projectManagerId
            ? { id: project.projectManagerId, fullName: project.projectManagerName || 'Неизвестный менеджер' }
            : null
    );
    const [isChangingPm, setIsChangingPm] = useState(false);

    // For Team select 
    const [employees, setEmployees] = useState<Employee[]>(project.employees);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // load project files on mount using project.id
    useEffect(() => {
        if (project.id) {
            loadProjectDocuments();
        }
    }, [project.id]);

    const loadProjectDocuments = async () => {
        try {
            const res = await axios.get(`/api/documents/project/${project.id}`);

            setDocuments(res.data);
        } catch (err) {
            console.error("Не удалось загрузить документы проекта:", err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await axios.post(`/api/documents/upload/${project.id}`, formData, {

                headers: { 'Content-Type': 'multipart/form-data' }
            });
            e.target.value = ''; 
            await loadProjectDocuments(); 
        } catch (err) {
            console.error("Ошибка при загрузке файла:", err);
            setError("Не удалось загрузить файл");
        } finally {
            setUploading(false);
        }
    };

    const handleFileDelete = async (docId: number) => {
        if (!window.confirm("Удалить этот документ?")) return;

        try {
            await axios.delete(`/api/documents/${docId}`);

            setDocuments(prev => prev.filter(doc => doc.id !== docId));
        } catch (err) {
            console.error("Ошибка при удалении файла:", err);
            setError("Не удалось удалить файл");
        }
    };

    const handleAddTeamMember = (emp: Employee) => {
        if (pm && emp.id === pm.id) {
            setError("Руководитель проекта не может быть членом команды исполнителей");
            return;
        }

        if (!employees.some(e => e.id === emp.id)) {
            setEmployees(prev => [...prev, emp]);
            setError(null); 
        }
    };

    const handleRemoveTeamMember = (id: number) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        if (!pm) {
            setError("Необходимо выбрать руководителя проекта");
            setSaving(false);
            return;
        }
        if (employees.length === 0) {
            setError("В команде должен быть как минимум один исполнитель");
            setSaving(false);
            return;
        }
        if (employees.some(e => e.id === pm.id)) {
            setError("Ошибка: Руководитель проекта не может дублироваться в списке исполнителей");
            setSaving(false);
            return;
        }

        const payload = {
            id: project.id,
            name,
            customerCompany,
            executorCompany,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            priority: Number(priority),
            projectManagerId: pm.id,
            employeeIds: employees.map(e => e.id)
        };

        try {
            await axios.put(`/api/Projects/${project.id}`, payload);

            onSave();
        } catch (err: any) {
            console.error("Ошибка при обновлении проекта:", err);
            setError(err.response?.data || "Не удалось сохранить изменения");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">

                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white font-mono text-sm cursor-pointer">
                    ✕
                </button>

                <div className="mb-6">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Редактирование</span>
                    <h2 className="text-xl font-light text-white uppercase tracking-wider mt-1">Параметры проекта</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-950/20 border border-red-900 rounded text-xs text-red-400 font-mono">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-5">

                    {/* Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Название проекта</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 focus:border-zinc-400 outline-none"
                        />
                    </div>

                    {/* Companies */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Компания-Заказчик</label>
                            <input
                                type="text"
                                required
                                value={customerCompany}
                                onChange={(e) => setCustomerCompany(e.target.value)}
                                className="w-full rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 focus:border-zinc-400 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Компания-Исполнитель</label>
                            <input
                                type="text"
                                required
                                value={executorCompany}
                                onChange={(e) => setExecutorCompany(e.target.value)}
                                className="w-full rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 focus:border-zinc-400 outline-none"
                            />
                        </div>
                    </div>

                    {/* Dates and priority */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Начало</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 focus:border-zinc-400 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Окончание</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 focus:border-zinc-400 outline-none"
                            />
                        </div>
                        <div>
                            <PrioritySelect value={priority} onChange={setPriority} />
                        </div>
                    </div>

                    <hr className="border-zinc-900 my-2" />

                    {/* Project Manager */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono block">Руководитель проекта</span>

                        {pm && !isChangingPm ? (
                            <div className="flex items-center justify-between rounded-lg bg-zinc-900/40 border border-zinc-800 p-3">
                                <div>
                                    <p className="text-xs text-white font-medium">{pm.fullName}</p>
                                    <p className="text-[10px] text-zinc-550 font-mono mt-0.5">ID: {pm.id}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsChangingPm(true)}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-black border border-zinc-800 hover:border-zinc-500 transition-colors text-xs text-zinc-400 hover:text-white cursor-pointer"
                                >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    <span className="font-mono text-[11px] uppercase tracking-wider">Изменить</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <EmployeeSearchSelect
                                    label=""
                                    placeholder="Найти нового руководителя..."
                                    onSelect={(emp) => {
                                        setPm({ id: emp.id, fullName: emp.fullName });
                                        setIsChangingPm(false);
                                        setError(null);
                                        
                                        setEmployees(prev => prev.filter(e => e.id !== emp.id));
                                    }}
                                />
                                {pm && (
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingPm(false)}
                                        className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
                                    >
                                        ← Оставить прежнего ({pm.fullName})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Team */}
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono block">Команда проекта</span>

                        <div className="flex flex-wrap gap-2 mb-2 max-h-32 overflow-y-auto p-1 border border-zinc-900 rounded bg-black/20 custom-scrollbar">
                            {employees.length === 0 ? (
                                <p className="text-xs text-zinc-600 font-mono p-2">Команда пуста. Добавьте участников ниже.</p>
                            ) : (
                                employees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white"
                                    >
                                        <span>{emp.fullName}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTeamMember(emp.id)}
                                            className="text-zinc-500 hover:text-red-400 transition-colors ml-1 font-mono font-bold cursor-pointer"
                                            title="Удалить из команды"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <EmployeeSearchSelect
                            label="Добавить сотрудника в команду"
                            placeholder="Введите имя для добавления..."
                            onSelect={handleAddTeamMember}
                            excludeIds={pm ? [...employees.map(e => e.id), pm.id] : employees.map(e => e.id)}
                        />
                    </div>

                    {/* PROJECT DOCUMENTATION SECTION */}
                    <div className="mt-6 border-t border-zinc-900 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                                Документация проекта
                            </label>
                            
                            <label className={`cursor-pointer inline-flex items-center text-[10px] uppercase tracking-wider font-mono px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-650 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? 'Загрузка...' : 'Добавить файл'}
                                <input 
                                    type="file" 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        {documents.length === 0 ? (
                            <div className="text-xs text-zinc-600 italic p-3 text-center bg-black/40 rounded-lg border border-zinc-900">
                                К проекту еще не прикреплено ни одного документа
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                                {documents.map((doc) => (
                                    <div 
                                        key={doc.id} 
                                        className="flex items-center justify-between p-2.5 bg-black rounded-lg border border-zinc-900 hover:border-zinc-800 transition-colors"
                                    >
                                        <div className="flex flex-col truncate pr-4">
                                            <span className="text-xs text-zinc-300 truncate font-medium">
                                                {doc.fileName}
                                            </span>
                                            <span className="text-[9px] text-zinc-600 font-mono mt-0.5">
                                                Загружен: {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleFileDelete(doc.id)}
                                                className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                                                title="Удалить"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-zinc-800 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Сохранение...' : 'Применить'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}