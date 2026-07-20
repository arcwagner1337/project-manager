import React, { useState, useEffect } from 'react';
import { useWizard } from '../context/WizardContext';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface Employee {
  id: number;
  fullName: string;
  email: string;
}

export default function Step3() {
  const { formData, errors, updateField } = useWizard();
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (formData.projectManagerId && !selectedManager) {
      axios.get(`/api/employees`)

        .then(res => {
          const found = res.data.find((e: any) => e.id === formData.projectManagerId);
          if (found) {
            setSelectedManager({
              id: found.id,
              fullName: `${found.lastName} ${found.firstName} ${found.middleName || ''}`.trim(),
              email: found.email
            });
          }
        })
        .catch(err => console.error("Ошибка при восстановлении ПМ:", err));
    }
  }, [formData.projectManagerId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setEmployees([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsLoading(true);
      axios.get(`/api/employees/search`, {

        params: { query: searchQuery }
      })
      .then(res => {
        const mapped: Employee[] = res.data.map((e: any) => ({
          id: e.id,
          fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
          email: e.email
        }));
        const filtered = mapped.filter(emp => !formData.employeeIds.includes(emp.id));
        setEmployees(filtered);
      })
      .catch(err => console.error("Ошибка AJAX поиска:", err))
      .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formData.employeeIds]);

  const handleSelect = (emp: Employee) => {
    updateField('projectManagerId', emp.id);
    setSelectedManager(emp);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    updateField('projectManagerId', null);
    setSelectedManager(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white uppercase tracking-wider">Шаг 3. Руководитель проекта</h2>

      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Поиск руководителя (AJAX)
        </label>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Введите фамилию или имя..."
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg bg-black p-3 pr-16 text-sm text-white border transition-all outline-none focus:border-white ${
              errors.projectManagerId ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
            {isLoading ? 'Загрузка...' : 'Поиск'}
          </span>
        </div>

        {isOpen && searchQuery.trim() && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-2xl max-h-60 overflow-y-auto">
            {employees.length === 0 ? (
              <div className="p-3 text-xs text-zinc-500 italic">Сотрудники не найдены (или они уже в команде)</div>
            ) : (
              employees.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="w-full rounded-md px-4 py-2.5 text-left text-sm hover:bg-zinc-900 transition-colors flex justify-between items-center"
                >
                  <span className="text-zinc-200 truncate pr-2">{emp.fullName}</span>
                  <span className="text-[10px] text-zinc-500 font-mono truncate">{emp.email}</span>
                </button>
              ))
            )}
          </div>
        )}

        {errors.projectManagerId && <p className="mt-1.5 text-xs text-red-500">{errors.projectManagerId}</p>}
      </div>

      {selectedManager && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Выбранный ПМ</p>
            <p className="mt-1 text-sm font-medium text-white">{selectedManager.fullName}</p>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedManager.email}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest transition-colors font-mono"
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}