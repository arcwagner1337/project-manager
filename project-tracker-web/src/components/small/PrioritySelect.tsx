import React, { useState, useRef, useEffect } from 'react';

interface PriorityOption {
  value: string;
  label: string;
}

interface PrioritySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const options: PriorityOption[] = [
  { value: 'all', label: 'Все приоритеты' },
  { value: '1', label: 'Очень низкий' },
  { value: '2', label: 'Низкий' },
  { value: '3', label: 'Средний' },
  { value: '4', label: 'Высокий' },
  { value: '5', label: 'Очень высокий' },
];

export default function PrioritySelect({ value, onChange }: PrioritySelectProps) {
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
        Приоритет
      </label>
      
      {/* Кнопка открытия списка */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg bg-black p-2.5 text-xs text-white border border-zinc-800 transition-all hover:border-zinc-700 focus:border-zinc-400 text-left outline-none cursor-pointer"
      >
        <span>{selectedOption.label}</span>
        {/* Иконка стрелочки, которая аккуратно вращается при открытии */}
        <span className={`text-[10px] text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Выпадающий Ч/Б список */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full rounded-lg border border-zinc-800 bg-black py-1 shadow-xl shadow-black/80 animate-in fade-in duration-100">
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
                  ? 'bg-zinc-900 text-white font-medium' // Активный пункт — темно-серый фон
                  : 'text-zinc-400 hover:bg-zinc-950 hover:text-white' // При ховере легкий серый оттенок
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