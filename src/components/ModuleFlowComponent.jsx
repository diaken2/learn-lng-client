// app/module-flow/page.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ (добавлен typeId: 9)
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function ModuleFlowComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleId || !lessonId) {
      router.push('/');
      return;
    }

    console.log('ModuleFlow: loading module', moduleId);
    console.log('ModuleFlow: lessonId', lessonId);
    
    // Загружаем структуру урока, чтобы знать следующий модуль
    fetch(`${API_BASE_URL}/learning/lesson-structure/${lessonId}`)
      .then(res => res.json())
      .then(data => {
        const structure = data.structure || [];
   
        console.log('🚀 ModuleFlow: lesson structure from API', structure); 
        // Находим текущий модуль в структуре
        const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
        console.log('ModuleFlow: current index', currentIndex);
        
        // Определяем следующий модуль (если есть)
        let nextModuleId = null;
        if (currentIndex < structure.length - 1) {
          nextModuleId = structure[currentIndex + 1].moduleId;
          console.log('ModuleFlow: next module found', nextModuleId);
        } else {
          console.log('ModuleFlow: this is the last module');
        }
        
        // Теперь загружаем текущий модуль чтобы узнать его тип
        return fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`)
          .then(res => res.json())
          .then(module => {
            console.log('ModuleFlow: module loaded', module);
            console.log('Module typeId:', module.typeId);
            
            // Формируем базовые параметры
            const baseParams = `module=${moduleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`;
            const nextParam = nextModuleId ? `&next=${nextModuleId}` : '';
            
            // Определяем путь в зависимости от типа модуля
            let path;
            switch (module.typeId) {
              case 1: // Лексика
                path = `/learning?${baseParams}${nextParam}`;
                break;
              case 2: // Тест лексика
                path = `/module-test?${baseParams}${nextParam}`;
                break;
              case 3: // Фразы
                path = `/sentence-learning?${baseParams}${nextParam}`;
                break;
              case 4: // Вопросы
                path = `/question-learning?${baseParams}${nextParam}`;
                break;
              case 5: // Аудио (подкаст)
                path = `/podcast-learning?${baseParams}${nextParam}`;
                break;
              case 6: // Текст
                path = `/text-learning?${baseParams}${nextParam}`;
                break;
              case 7: // Видео
                path = `/video-learning?${baseParams}${nextParam}`;
                break;
              case 8: // Грамматика
                path = `/grammar-learning?${baseParams}${nextParam}`;
                break;
              case 9: // ★ НОВЫЙ ТИП: Универсальный тест ★
                path = `/test-module?${baseParams}${nextParam}`;
                break;
              default:
                console.warn('Unknown module typeId:', module.typeId);
                path = '/';
            }
            
            console.log('ModuleFlow: redirecting to', path);
            router.push(path);
          });
      })
      .catch(error => {
        console.error('Error in ModuleFlow:', error);
        router.push('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Загрузка модуля...</div>
    </div>
  );
}