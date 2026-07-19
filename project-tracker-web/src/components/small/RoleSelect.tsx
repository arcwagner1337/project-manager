import React, { useState, useRef, useEffect } from 'react';

interface RoleOption {
  value: string;
  label: string;
}

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const options: RoleOption[] = [
  { value: 'Employee', label: 'Employee (Исполнитель)' },
  { value: 'ProjectManager', label: 'ProjectManager (ПМ)' },
  { value: 'Leader', label: 'Leader (Руководитель)' },
];

export default function RoleSelect({ value, onChange }: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  // Закрываем дропдаун при клике вне его области
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
      <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
        Роль в системе
      </label>
      
      {/* Кнопка открытия */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full h-[38px] items-center justify-between rounded bg-black p-2.5 text-xs text-white border border-zinc-800 transition-all hover:border-zinc-700 focus:border-zinc-500 text-left outline-none cursor-pointer font-mono"
      >
        <span>{selectedOption.label}</span>
        <span className={`text-[9px] text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full rounded border border-zinc-800 bg-black py-1 shadow-xl shadow-black/80 font-mono">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs transition-colors cursor-pointer block ${
                option.value === value
                  ? 'bg-zinc-900 text-white font-medium'
                  : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}