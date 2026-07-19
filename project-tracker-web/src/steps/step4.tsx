import React, { useState, useEffect } from 'react';
import { useWizard } from '../context/WizardContext';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface Employee {
  id: number;
  fullName: string;
  email: string;
}

export default function Step4Team() {
  const { formData, updateField, errors } = useWizard();
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedList, setSelectedList] = useState<Employee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Восстанавливаем карточки выбранных исполнителей при переключениях шагов "Назад-Вперед"
  useEffect(() => {
    if (formData.employeeIds.length > 0 && selectedList.length === 0) {
      // axios.get(`https://localhost:7291/api/Employees`)
      axios.get(`/api/Employees`)

        .then(res => {
          const mapped = res.data
            .filter((e: any) => formData.employeeIds.includes(e.id))
            .map((e: any) => ({
              id: e.id,
              fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
              email: e.email
            }));
          setSelectedList(mapped);
        })
        .catch(err => console.error("Ошибка восстановления состава команды:", err));
    }
  }, [formData.employeeIds]);

  // 2. AJAX-поиск исполнителей
  useEffect(() => {
    if (!searchQuery.trim()) {
      setEmployees([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsLoading(true);
      // axios.get(`https://localhost:7291/api/Employees/search`, {
      axios.get(`/api/Employees/search`, {

        params: { query: searchQuery }
      })
      .then(res => {
        const mapped: Employee[] = res.data.map((e: any) => ({
          id: e.id,
          fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
          email: e.email
        }));

        // БИЗНЕС-ЛОГИКА: 
        // Исключаем тех, кто уже в команде, И исключаем выбранного ПМ (чтобы он не стал обычным работягой)
        const filtered = mapped.filter(emp => 
          !formData.employeeIds.includes(emp.id) && 
          emp.id !== formData.projectManagerId
        );
        setEmployees(filtered);
      })
      .catch(err => console.error("Ошибка AJAX поиска исполнителей:", err))
      .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formData.employeeIds, formData.projectManagerId]);

  const handleAdd = (emp: Employee) => {
    if (!formData.employeeIds.includes(emp.id)) {
      updateField('employeeIds', [...formData.employeeIds, emp.id]);
      setSelectedList(prev => [...prev, emp]);
    }
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleRemove = (id: number) => {
    updateField('employeeIds', formData.employeeIds.filter(item => item !== id));
    setSelectedList(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white uppercase tracking-wider">Шаг 4. Команда исполнителей</h2>

      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Добавить исполнителей
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск сотрудников..."
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-black p-3 pr-16 text-sm text-white border border-zinc-800 transition-all outline-none focus:border-white"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
            {isLoading ? 'Загрузка...' : 'Поиск'}
          </span>
        </div>

        {isOpen && searchQuery.trim() && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-2xl max-h-60 overflow-y-auto">
            {employees.length === 0 ? (
              <div className="p-3 text-xs text-zinc-500 italic">Свободные сотрудники не найдены</div>
            ) : (
              employees.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleAdd(emp)}
                  className="w-full rounded-md px-4 py-2.5 text-left text-sm hover:bg-zinc-900 transition-colors flex justify-between items-center"
                >
                  <span className="text-zinc-200 truncate pr-2">{emp.fullName}</span>
                  <span className="text-[10px] text-zinc-500 font-mono truncate">{emp.email}</span>
                </button>
              ))
            )}
          </div>
        )}

        {errors.employeeIds && (
          <p className="mt-1.5 text-xs text-red-500">{errors.employeeIds}</p>
        )}

      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
          Состав команды ({selectedList.length})
        </label>
        {selectedList.length === 0 ? (
          <p className="text-sm text-zinc-600 italic">Исполнители не выбраны</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedList.map(emp => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
              >
                <div className="truncate pr-2">
                  <p className="text-xs font-medium text-white truncate">{emp.fullName}</p>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">{emp.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(emp.id)}
                  className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest pl-2 transition-colors font-mono"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}