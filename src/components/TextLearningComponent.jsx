// app/text-learning/page.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function TextLearningComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const nextModuleId = searchParams?.get('next'); // ID следующего модуля (как запасной вариант)
  
  const [texts, setTexts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lessonInfo, setLessonInfo] = useState(null);

  // ===== НОВАЯ ФУНКЦИЯ: переход к следующему модулю =====
  const goToNextModule = useCallback(async () => {
    try {
      console.log('🔍 Text: Looking for next module after', moduleId);
      console.log('🔍 Text: Lesson ID', lessonId);
      console.log('🔍 Text: Languages', studiedLanguage, hintLanguage);
      
      // Загружаем актуальную структуру урока с языками
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const structure = data.structure || [];
      
      console.log('🔍 Text: Lesson structure loaded, length:', structure.length);
      console.log('🔍 Text: Structure items:', structure.map((s, i) => `${i+1}. ${s.title} (${s.type}) - ${s.moduleId}`));
      
      // Находим текущий модуль в структуре
      const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
      console.log('🔍 Text: Current index in structure:', currentIndex);
      
      // Определяем следующий модуль
      let actualNextModuleId = null;
      if (currentIndex >= 0 && currentIndex < structure.length - 1) {
        actualNextModuleId = structure[currentIndex + 1].moduleId;
        console.log('🔍 Text: Actual next module is', actualNextModuleId);
        console.log('🔍 Text: Next module title:', structure[currentIndex + 1]?.title);
        console.log('🔍 Text: Next module type:', structure[currentIndex + 1]?.type);
      } else {
        console.log('🔍 Text: This is the last module in the lesson');
        if (currentIndex === -1) {
          console.log('🔍 Text: WARNING - Current module not found in structure!');
        }
      }
      
      if (actualNextModuleId) {
        // Есть следующий модуль - переходим через ModuleFlow с актуальным ID
        const nextUrl = `/module-flow?module=${actualNextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`;
        console.log('🔍 Text: Redirecting to:', nextUrl);
        router.push(nextUrl);
      } else {
        // Нет следующего модуля - на главную
        console.log('🔍 Text: No next module, going to home');
        router.push('/');
      }
      
    } catch (error) {
      console.error('🔍 Text: Error loading lesson structure:', error);
      
      // Если не удалось загрузить структуру, пробуем использовать next из URL как запасной вариант
      if (nextModuleId) {
        console.log('🔍 Text: Falling back to next from URL:', nextModuleId);
        router.push(`/module-flow?module=${nextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      } else {
        router.push('/');
      }
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, nextModuleId, router]);

  useEffect(() => {
    const loadTexts = async () => {
      try {
        console.log('Loading texts for module:', moduleId);
        
        // Загружаем информацию об уроке
        if (lessonId) {
          let lessonResponse;
          if (lessonId.startsWith('table_')) {
            lessonResponse = await fetch(`${API_BASE_URL}/table-lessons/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`);
          } else {
            lessonResponse = await fetch(`${API_BASE_URL}/lessons/${lessonId}`);
          }
          
          if (lessonResponse.ok) {
            const lesson = await lessonResponse.json();
            setLessonInfo(lesson);
          }
        }
        
        // Загружаем тексты модуля
        const textsResponse = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/texts`);
        
        if (!textsResponse.ok) {
          throw new Error('Failed to load texts');
        }
        
        const textsData = await textsResponse.json();
        console.log('Texts loaded:', textsData);
        
        // Фильтруем только тексты с контентом
        const validTexts = textsData.filter(t => t.text && t.text.trim() !== '');
        
        if (validTexts.length === 0) {
          setError('В этом модуле нет текстов для отображения');
        } else {
          setTexts(validTexts);
        }
        
      } catch (err) {
        console.error('Error loading texts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      loadTexts();
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage]);

  const handleNext = () => {
    if (currentIndex < texts.length - 1) {
      // Есть еще тексты в этом модуле
      setCurrentIndex(currentIndex + 1);
    } else {
      // Все тексты в этом модуле закончились - переходим к следующему модулю
      goToNextModule();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBackToMain = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка текстов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goToNextModule}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Перейти к следующему модулю →
          </button>
        </div>
      </div>
    );
  }

  if (texts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-yellow-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Нет текстов</h2>
          <p className="text-gray-600 mb-6">В этом модуле пока нет текстов для изучения</p>
          <button
            onClick={goToNextModule}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Перейти к следующему модулю →
          </button>
        </div>
      </div>
    );
  }

  const currentText = texts[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Верхняя панель с информацией */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lessonInfo?.title || 'Модуль "Текст"'}
            </h1>
            <p className="text-sm text-gray-600">
              Текст {currentIndex + 1} из {texts.length}
            </p>
            {nextModuleId && (
              <p className="text-xs text-green-600 mt-1">
                После завершения: переход к следующему модулю
              </p>
            )}
          </div>
          <button
            onClick={handleBackToMain}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            На главную
          </button>
        </div>

        {/* Основной контент - картинка и текст */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Картинка сверху по центру (если есть) */}
          {currentText.image && (
            <div className="flex justify-center mb-8">
              <div className="relative w-full max-w-2xl h-auto rounded-lg overflow-hidden shadow-md">
                <img
                  src={currentText.image}
                  alt="Иллюстрация к тексту"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Текст */}
          <div className="prose prose-lg max-w-none">
            <div className="text-left whitespace-pre-wrap break-words font-sans text-gray-800 leading-relaxed">
              {currentText.text}
            </div>
          </div>

          {/* Счетчик символов */}
          <div className="mt-4 text-right text-sm text-gray-400">
            {currentText.text?.length || 0} знаков
          </div>
        </div>

        {/* Нижняя панель с навигацией */}
        <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            ← Предыдущий
          </button>
          
          <div className="flex gap-2">
            {texts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Перейти к тексту ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentIndex === texts.length - 1
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {currentIndex === texts.length - 1 
              ? 'Завершить и перейти к следующему →'
              : 'Следующий →'
            }
          </button>
        </div>

        {/* Индикатор прогресса */}
        <div className="mt-4 bg-white rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / texts.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}