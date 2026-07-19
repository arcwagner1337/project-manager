import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface Employee {
  id: number;
  fullName: string;
  email: string;
}

interface EmployeeSearchSelectProps {
  label: string;
  placeholder?: string;
  onSelect: (employee: Employee) => void;
  excludeIds?: number[];
}

export default function EmployeeSearchSelect({
  label,
  placeholder = "Введите имя сотрудника...",
  onSelect,
  excludeIds = []
}: EmployeeSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ХИТРЫЙ ТРЮК: переводим массив ID в строку (например, "1,2,5").
  // Строка — это примитив. Она не меняет ссылку при перерендере родителя,
  // поэтому эффект сработает ТОЛЬКО если состав команды реально изменился.
  const excludeIdsKey = excludeIds.join(',');

  useEffect(() => {
    let isMounted = true; // Защита от race conditions (гонки запросов)

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!search.trim()) {
          // Сценарий 1. Загрузка списка по умолчанию (когда поиск пустой)
          // const res = await axios.get('https://localhost:7291/api/Employees');
          const res = await axios.get('/api/Employees');

          if (!isMounted) return;

          const mapped: Employee[] = res.data.map((e: any) => ({
            id: e.id,
            fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
            email: e.email
          }));

          const filtered = mapped.filter(emp => !excludeIds.includes(emp.id));
          setEmployees(filtered.slice(0, 5)); // Здесь жесткий лимит в 5 оставляем
        } else {
          // Сценарий 2. Живой AJAX-поиск по query
          // const res = await axios.get('https://localhost:7291/api/Employees/search', {
          const res = await axios.get('/api/Employees/search', {

            params: { query: search }
          });
          if (!isMounted) return;

          const mapped: Employee[] = res.data.map((e: any) => ({
            id: e.id,
            fullName: `${e.lastName} ${e.firstName} ${e.middleName || ''}`.trim(),
            email: e.email
          }));

          const filtered = mapped.filter(emp => !excludeIds.includes(emp.id));
          setEmployees(filtered); // ТУТ ЛИМИТА НЕТ — выводим вообще всех, кого нашел бэкенд!
        }
      } catch (err) {
        console.error("Ошибка при получении сотрудников:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Если строка пустая — дропаем дебаунс и грузим топ-5 мгновенно
    if (!search.trim()) {
      fetchData();
    } else {
      // Если пишем — дебаунсим на 300мс, чтобы не спамить бэкенд на каждую букву
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(delayDebounceFn);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [search, excludeIdsKey]); // Эффект железно следит за вводом и за составом команды

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg bg-black p-2.5 pl-9 text-xs text-white border border-zinc-800 transition-all focus:border-zinc-500 outline-none placeholder:text-zinc-650"
        />
        <span className="absolute left-3 top-3.5 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-zinc-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
          <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-zinc-600 font-mono border-b border-zinc-900/60 mb-1">
            {!search.trim() ? 'Быстрый выбор (топ-5)' : 'Результаты поиска'}
          </div>

          {loading ? (
            <div className="px-3 py-2 text-xs text-zinc-600 font-mono animate-pulse">Загрузка...</div>
          ) : employees.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-600 font-mono">Никого не найдено</div>
          ) : (
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    onSelect(emp);
                    setSearch('');
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer flex justify-between items-center"
                >
                  <span className="font-medium truncate max-w-[240px]">{emp.fullName}</span>
                  <span className="text-[10px] text-zinc-650 font-mono truncate max-w-[160px]">{emp.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}