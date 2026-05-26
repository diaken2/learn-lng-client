// app/module/[id]/page.jsx - обновленная версия
'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import LearningComponent from '../../learning/page';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function ModulePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        const moduleId = params.id;
        const studiedLanguage = searchParams.get('studied') || 'русский';
        const hintLanguage = searchParams.get('hint') || 'английский';
        const nextModuleId = searchParams.get('next'); // ← ПОЛУЧАЕМ ID СЛЕДУЮЩЕГО МОДУЛЯ
        
        console.log('Loading module:', moduleId);
        console.log('Next module:', nextModuleId);
        
        // Загружаем модуль
        const response = await fetch(`${API_BASE_URL}/learning/lexicon-module/${moduleId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`);
        
        if (!response.ok) {
          throw new Error('Failed to load module');
        }
        
        const data = await response.json();
        console.log('Module data loaded:', data);
        
        // Сохраняем nextModuleId в sessionStorage, чтобы LearningComponent мог его использовать
        if (nextModuleId) {
          sessionStorage.setItem('nextModuleId', nextModuleId);
          sessionStorage.setItem('currentLessonId', data._id);
          sessionStorage.setItem('studiedLanguage', studiedLanguage);
          sessionStorage.setItem('hintLanguage', hintLanguage);
        }
        
        // Перенаправляем на страницу обучения
        // Передаем nextModuleId как параметр URL
        router.push(`/learning?lesson=${data._id}&module=${moduleId}&studied=${studiedLanguage}&hint=${hintLanguage}${nextModuleId ? `&next=${nextModuleId}` : ''}`);
        
      } catch (err) {
        console.error('Error loading module:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [params.id, searchParams, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка модуля...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Ошибка: {error}</div>;
  }

  return null;
}