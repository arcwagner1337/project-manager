import React, { useState } from 'react';
import { useWizard } from '../context/WizardContext';
import Step1 from '../steps/step1';
import Step2 from '../steps/step2';
import Step3 from '../steps/step3';
import Step4 from '../steps/step4';
import Step5 from '../steps/step5';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface ProjectWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProjectWizard({ onSuccess, onCancel }: ProjectWizardProps) {
    const { step, nextStep, prevStep, formData, resetWizard } = useWizard();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);


    const handleCreateProject = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Step 1 Create the project
            const projectPayload = {
                name: formData.name,
                customerCompany: formData.customerCompany,
                executorCompany: formData.executorCompany,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                priority: Number(formData.priority),
                projectManagerId: formData.projectManagerId,
                employeeIds: formData.employeeIds
            };

            const projectResponse = await axios.post('/api/Projects', projectPayload, {

                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const createdProjectId = projectResponse.data.projectId;

            console.log("ID созданного проекта:", createdProjectId);
            console.log("Файлы в formData:", formData.documents);

            // Step 2 If there are files, upload them to DocumentsController.
            if (formData.documents && formData.documents.length > 0 && createdProjectId) {

                const uploadPromises = formData.documents.map((file) => {
                    const fileFormData = new FormData();
                    fileFormData.append('file', file); 

                    return axios.post(`/api/Documents/upload/${createdProjectId}`, fileFormData, {

                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                });
                await Promise.all(uploadPromises);
            }

            setIsSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Ошибка при создании проекта или загрузке файлов:", err);

            const errorMessage = err.response?.data || 'Не удалось сохранить проект на сервере. Проверьте подключение.';
            setSubmitError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAnother = () => {
        resetWizard();
        setIsSuccess(false);
        setSubmitError(null);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return <Step1 />;
            case 2:
                return <Step2 />;
            case 3:
                return <Step3 />;
            case 4:
                return <Step4 />;
            case 5:
                return <Step5 />;
            default:
                return null;
        }
    };

    // SUCCESSFUL CREATION SCREEN 
    if (isSuccess) {
        return (
            <div className="mx-auto max-w-2xl rounded-xl bg-zinc-900 p-12 shadow-2xl border border-zinc-800 text-center text-zinc-100">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white bg-white text-black text-2xl font-bold">
                    ✓
                </div>
                <h2 className="text-xl font-light uppercase tracking-widest text-white mb-2">Проект успешно создан</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto mb-8 font-sans">
                    Все данные успешно записаны в базу данных, файлы загружены в хранилище. Проект готов к работе.
                </p>
                <button
                    onClick={handleCreateAnother}
                    className="rounded-lg bg-white px-6 py-3 text-xs font-semibold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all"
                >
                    Создать еще один проект
                </button>
            </div>
        );
    }


    return (
        <div className="mx-auto max-w-2xl rounded-xl bg-zinc-900 p-8 shadow-2xl border border-zinc-800 text-zinc-100">

            {/* Step scale */}
            <div className="mb-10">
                <div className="flex items-center justify-between">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="flex items-center">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300 ${step === num
                                    ? 'border-white bg-white text-black shadow-lg shadow-white/10'
                                    : step > num
                                        ? 'border-zinc-400 bg-zinc-800 text-zinc-200'
                                        : 'border-zinc-800 text-zinc-600'
                                }`}>
                                {num}
                            </div>
                            {num < 5 && (
                                <div className={`h-[1px] w-12 sm:w-16 md:w-20 transition-colors duration-300 ${step > num ? 'bg-zinc-400' : 'bg-zinc-800'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Displaying a global submission error */}
            {submitError && (
                <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-xs text-red-500 font-sans">
                    {submitError}
                </div>
            )}

            {/* Rendering the current component */}
            <div className="min-h-[280px]">
                {renderStepContent()}
            </div>

            {/* Control buttons */}
            <div className="mt-8 flex justify-between border-t border-zinc-800 pt-6">
                <button
                    onClick={prevStep}
                    disabled={step === 1 || isSubmitting}
                    className="rounded-lg bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Назад
                </button>

                <button
                        onClick={onCancel}
                        className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-500 border border-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
                    >
                        Отмена
                    </button>

                {step === 5 ? (
                    <button
                        onClick={handleCreateProject}
                        disabled={isSubmitting}
                        className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isSubmitting ? 'Сохранение...' : 'Создать проект'}
                    </button>
                ) : (
                    <button
                        onClick={nextStep}
                        className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-all"
                    >
                        Вперед
                    </button>
                )}
            </div>
        </div>
    );
}