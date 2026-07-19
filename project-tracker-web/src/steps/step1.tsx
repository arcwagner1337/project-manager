
import { useWizard } from '../context/WizardContext';

export default function Step1BasicInfo() {
  const { formData, errors, updateField } = useWizard();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white uppercase tracking-wider">Шаг 1. Основные параметры</h2>
      
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Название проекта</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Например, Редизайн CRM системы"
          className={`w-full rounded-lg bg-black p-3 text-sm text-white border transition-all outline-none focus:border-white ${
            errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800'
          }`}
        />
        {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Дата начала</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
            className={`w-full rounded-lg bg-black p-3 text-sm text-white border transition-all outline-none focus:border-white ${
              errors.startDate ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800'
            }`}
          />
          {errors.startDate && <p className="mt-1.5 text-xs text-red-500">{errors.startDate}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Дата окончания</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
            className={`w-full rounded-lg bg-black p-3 text-sm text-white border transition-all outline-none focus:border-white ${
              errors.endDate ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800'
            }`}
          />
          {errors.endDate && <p className="mt-1.5 text-xs text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Приоритет ({formData.priority})</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={formData.priority}
            onChange={(e) => updateField('priority', parseInt(e.target.value, 10))}
            // Стилизуем ползунок под белый цвет в вебките
            className="h-[2px] w-full cursor-pointer appearance-none bg-zinc-800 accent-white"
          />
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-bold text-white">
            {formData.priority}
          </span>
        </div>
      </div>
    </div>
  );
}