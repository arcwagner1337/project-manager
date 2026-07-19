import React from 'react';
import { useWizard } from '../context/WizardContext';

export default function Step2() {
  const { formData, errors, updateField } = useWizard();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white uppercase tracking-wider">Шаг 2. Компании контрагенты</h2>
      
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Компания-заказчик</label>
        <input
          type="text"
          value={formData.customerCompany}
          onChange={(e) => updateField('customerCompany', e.target.value)}
          placeholder="Например, ПАО Сбербанк"
          className={`w-full rounded-lg bg-black p-3 text-sm text-white border transition-all outline-none focus:border-white ${
            errors.customerCompany ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800'
          }`}
        />
        {errors.customerCompany && <p className="mt-1.5 text-xs text-red-500">{errors.customerCompany}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Компания-исполнитель</label>
        <input
          type="text"
          value={formData.executorCompany}
          onChange={(e) => updateField('executorCompany', e.target.value)}
          placeholder="Например, Loft Project Customs"
          className={`w-full rounded-lg bg-black p-3 text-sm text-white border transition-all outline-none focus:border-white ${
            errors.executorCompany ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800'
          }`}
        />
        {errors.executorCompany && <p className="mt-1.5 text-xs text-red-500">{errors.executorCompany}</p>}
      </div>
    </div>
  );
}