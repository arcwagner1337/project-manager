import React, { createContext, useContext, useState } from 'react';

export interface WizardData {
  name: string;
  startDate: string;
  endDate: string;
  priority: number;
  customerCompany: string;
  executorCompany: string;
  projectManagerId: number | null;
  employeeIds: number[];
  documents?: File[];
}

interface WizardContextType {
  step: number;
  formData: WizardData;
  errors: { [key: string]: string };
  setStep: (step: number) => void;
  updateField: (name: keyof WizardData, value: any) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  resetWizard: () => void;
  setStepErrors: (errors: { [key: string]: string }) => void;
}

const defaultData: WizardData = {
  name: '',
  startDate: '',
  endDate: '',
  priority: 3,
  customerCompany: '',
  executorCompany: '',
  projectManagerId: null,
  employeeIds: [],
  documents: [],
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<WizardData>(defaultData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const updateField = (name: keyof WizardData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.name.trim()) tempErrors.name = 'Название проекта обязательно';
      if (!formData.startDate) tempErrors.startDate = 'Укажите дату начала';
      if (!formData.endDate) tempErrors.endDate = 'Укажите дату окончания';
      if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
        tempErrors.endDate = 'Дата окончания не может быть раньше даты начала';
      }
    } else if (step === 2) {
      if (!formData.customerCompany.trim()) tempErrors.customerCompany = 'Укажите компанию-заказчика';
      if (!formData.executorCompany.trim()) tempErrors.executorCompany = 'Укажите компанию-исполнителя';
    } else if (step === 3) {
      // Валидация Руководителя проекта
      if (!formData.projectManagerId) {
        tempErrors.projectManagerId = 'Необходимо выбрать руководителя проекта для перехода дальше';
      }
    } else if (step === 4) {
      // Валидация Команды исполнителей
      if (!formData.employeeIds || formData.employeeIds.length === 0) {
        tempErrors.employeeIds = 'Добавьте хотя бы одного исполнителя в команду проекта';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
      return true;
    }
    return false;
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  const resetWizard = () => {
    setFormData(defaultData);
    setErrors({});
    setStep(1);
  };

  return (
    <WizardContext.Provider value={{
      step,
      formData,
      errors,
      setStep,
      updateField,
      nextStep,
      prevStep,
      resetWizard,
      setStepErrors: setErrors
    }}>
      {children}
    </WizardContext.Provider>
  );
}

// Кастомный хук для быстрого доступа к контексту
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard должен использоваться внутри WizardProvider');
  }
  return context;
}