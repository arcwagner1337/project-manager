import React, { useState, useRef } from 'react';
import { useWizard } from '../context/WizardContext';

interface LocalFile {
    id: string;
    name: string;
    size: string;
}

export default function Step5Documents() {
    const { formData, updateField } = useWizard();
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Достаем файлы из глобального стейта (если их нет, берем пустой массив)
    const currentFiles = formData.documents || [];

    // Форматирование размера файла
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFiles = (fileList: FileList) => {
        const newFilesArray: File[] = [];
        for (let i = 0; i < fileList.length; i++) {
            newFilesArray.push(fileList[i]);
        }

        // Объединяем старые файлы из контекста с новыми и пушим обратно в контекст
        updateField('documents', [...currentFiles, ...newFilesArray]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFiles(e.target.files);
            e.target.value = ''; // Сброс инпута, чтобы убрать фокус с проводника
        }
    };

    const removeFile = (indexToRemove: number) => {
        const filteredFiles = currentFiles.filter((_, index) => index !== indexToRemove);
        updateField('documents', filteredFiles);
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-medium text-white uppercase tracking-wider">Шаг 5. Документы проекта</h2>

            {/* Зона Drag & Drop */}
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-all ${dragActive
                        ? 'border-white bg-zinc-900/50'
                        : 'border-zinc-800 bg-black hover:border-zinc-700'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                {/* Иконка */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
                    <span className="text-sm font-semibold text-white">↑</span>
                </div>

                <p className="text-sm font-medium text-zinc-300">
                    Перетащите файлы сюда или{' '}
                    <button
                        type="button"
                        onClick={onButtonClick}
                        className="text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
                    >
                        выберите на компьютере
                    </button>
                </p>
                <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest font-mono">PDF, DOCX, XLSX до 10MB</p>
            </div>

            {/* Список загруженных файлов */}
            {currentFiles.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Загруженные файлы ({currentFiles.length})
                    </label>
                    <div className="divide-y divide-zinc-900 rounded-lg border border-zinc-800 bg-black">
                        {currentFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3">
                                <div className="flex items-center space-x-3 truncate">
                                    <span className="text-xs text-zinc-500 font-mono">FILE</span>
                                    <div className="truncate">
                                        <p className="text-xs font-medium text-white truncate">{file.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono">{formatBytes(file.size)}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest pl-2 transition-colors"
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}