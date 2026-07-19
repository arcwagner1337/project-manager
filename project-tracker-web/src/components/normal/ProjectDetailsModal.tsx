import React, { useEffect, useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

interface Employee {
  id: number;
  fullName: string;
  email: string;
}

interface Project {
  id: number;
  name: string;
  customerCompany: string;
  executorCompany: string;
  startDate: string;
  endDate: string;
  priority: number;
  projectManagerId: number | null;
  projectManagerName: string | null;
  employees: Employee[];
}

interface AttachedDocument {
  id: number;
  fileName: string;
  uploadedAt: string;
}

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

export default function ProjectDetailsModal({ project, onClose, onEdit }: ProjectDetailsModalProps) {
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [project.id]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      // const res = await axios.get(`https://localhost:7291/api/Documents/project/${project.id}`);
      const res = await axios.get(`/api/Documents/project/${project.id}`);

      setDocuments(res.data);
    } catch (err) {
      console.error("Не удалось загрузить документы проекта:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Функция предпросмотра файла в новой вкладке
  const handlePreview = async (docId: number) => {
    try {
      // const response = await axios.get(`https://localhost:7291/api/Documents/download/${docId}`, {
      const response = await axios.get(`/api/Documents/download/${docId}`, {

        responseType: 'blob',
      });
      
      // response.data уже содержит правильный Blob с MIME-типом от сервера
      const blobUrl = window.URL.createObjectURL(response.data);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("Ошибка при предпросмотре файла:", err);
      alert("Не удалось открыть предпросмотр файла.");
    }
  };

  // Функция скачивания файла
  const handleDownload = async (docId: number, fileName: string) => {
    try {
      // const response = await axios.get(`https://localhost:7291/api/Documents/download/${docId}`, {
      const response = await axios.get(`/api/Documents/download/${docId}`, {

        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url); // Чистим память за собой
    } catch (err) {
      console.error("Ошибка при скачивании файла:", err);
      alert("Не удалось скачать файл.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 B';
  //   const k = 1024;
  //   const sizes = ['B', 'KB', 'MB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Затемненный бэкдроп */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Контейнер модалки */}
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Кнопка закрытия "крестик" */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors font-mono text-sm cursor-pointer"
        >
          ✕
        </button>

        {/* Название и ID */}
        <div className="mb-6">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Проект #{project.id}</span>
          <h2 className="text-xl font-light text-white uppercase tracking-wider mt-1">{project.name}</h2>
        </div>

        <div className="space-y-6">
          {/* Сроки и приоритет */}
          <div className="grid grid-cols-2 gap-4 border-y border-zinc-900 py-4 font-mono text-xs">
            <div>
              <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Период</p>
              <p className="text-zinc-300 mt-1">{formatDate(project.startDate)} — {formatDate(project.endDate)}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Приоритет</p>
              <p className="text-white mt-1 font-semibold">{project.priority} / 5</p>
            </div>
          </div>

          {/* Компании */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-zinc-500 uppercase tracking-wider font-mono text-[10px]">Компания-Заказчик</p>
              <p className="text-zinc-300 font-medium mt-1">{project.customerCompany}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-wider font-mono text-[10px]">Компания-Исполнитель</p>
              <p className="text-zinc-300 font-medium mt-1">{project.executorCompany}</p>
            </div>
          </div>

          {/* Руководитель и Команда */}
          <div className="space-y-3">
            <div>
              <p className="text-zinc-500 uppercase tracking-wider font-mono text-[10px]">Руководитель проекта</p>
              <p className="text-xs text-white font-medium mt-1">{project.projectManagerName || 'Не назначен'}</p>
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-wider font-mono text-[10px]">Команда исполнителей</p>
              <div className="mt-2 max-h-24 overflow-y-auto space-y-1.5 pr-2">
                {project.employees.map((emp) => (
                  <div key={emp.id} className="flex justify-between items-center text-xs bg-zinc-900/30 p-2 rounded border border-zinc-900">
                    <span className="text-zinc-300">{emp.fullName}</span>
                    <span className="text-zinc-600 font-mono text-[10px]">{emp.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Документы проекта */}
          <div className="border-t border-zinc-900 pt-4">
            <p className="text-zinc-500 uppercase tracking-wider font-mono text-[10px] mb-2">Документы проекта</p>
            {loadingDocs ? (
              <p className="text-xs text-zinc-600 font-mono">Загрузка файлов...</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono">Файлы отсутствуют</p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => handlePreview(doc.id)}
                    className="flex justify-between items-center text-xs bg-black hover:bg-zinc-900/40 p-2.5 rounded border border-zinc-900 cursor-pointer transition-colors group"
                  >
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-zinc-300 group-hover:text-white transition-colors truncate font-medium">
                        📄 {doc.fileName}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono mt-0.5 group-hover:text-zinc-500 transition-colors">
                        Кликните для предпросмотра
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatDate(doc.uploadedAt)}
                      </span> 
                      {/* {тут ошибка nan udefined} */}
                      {/* Изолированная кнопка скачивания */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Важно: предотвращаем запуск предпросмотра всей карточки
                          handleDownload(doc.id, doc.fileName);
                        }}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Скачать файл"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки действий внизу */}
        <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-end space-x-3">
          <button
            onClick={() => onEdit(project)}
            className="rounded-lg border border-zinc-800 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
          >
            Редактировать
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}