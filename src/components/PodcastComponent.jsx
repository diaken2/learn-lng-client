// app/podcast-learning/page.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';

export default function PodcastLearningPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  const studiedLanguage = searchParams?.get('studied') || 'русский';
  const hintLanguage = searchParams?.get('hint') || 'английский';
  const nextModuleId = searchParams?.get('next'); // ID следующего модуля (как запасной вариант)

  const [module, setModule] = useState(null);
  const [podcasts, setPodcasts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  
  // Состояния для управления последовательностью
  const [showTranscripts, setShowTranscripts] = useState(false);
  const [hasCompletedFirstListen, setHasCompletedFirstListen] = useState(false);

  const audioRef = useRef(null);
  const containerRef = useRef(null);

  // ===== НОВАЯ ФУНКЦИЯ: переход к следующему модулю =====
  const goToNextModule = useCallback(async () => {
    try {
      console.log('🔍 Podcast: Looking for next module after', moduleId);
      console.log('🔍 Podcast: Lesson ID', lessonId);
      console.log('🔍 Podcast: Languages', studiedLanguage, hintLanguage);
      
      // Загружаем актуальную структуру урока с языками
      const response = await fetch(
        `${API_BASE_URL}/learning/lesson-structure/${lessonId}?studiedLanguage=${studiedLanguage}&hintLanguage=${hintLanguage}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const structure = data.structure || [];
      
      console.log('🔍 Podcast: Lesson structure loaded, length:', structure.length);
      console.log('🔍 Podcast: Structure items:', structure.map((s, i) => `${i+1}. ${s.title} (${s.type}) - ${s.moduleId}`));
      
      // Находим текущий модуль в структуре
      const currentIndex = structure.findIndex(item => item.moduleId === moduleId);
      console.log('🔍 Podcast: Current index in structure:', currentIndex);
      
      // Определяем следующий модуль
      let actualNextModuleId = null;
      if (currentIndex >= 0 && currentIndex < structure.length - 1) {
        actualNextModuleId = structure[currentIndex + 1].moduleId;
        console.log('🔍 Podcast: Actual next module is', actualNextModuleId);
        console.log('🔍 Podcast: Next module title:', structure[currentIndex + 1]?.title);
        console.log('🔍 Podcast: Next module type:', structure[currentIndex + 1]?.type);
      } else {
        console.log('🔍 Podcast: This is the last module in the lesson');
        if (currentIndex === -1) {
          console.log('🔍 Podcast: WARNING - Current module not found in structure!');
        }
      }
      
      if (actualNextModuleId) {
        // Есть следующий модуль - переходим через ModuleFlow с актуальным ID
        const nextUrl = `/module-flow?module=${actualNextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`;
        console.log('🔍 Podcast: Redirecting to:', nextUrl);
        router.push(nextUrl);
      } else {
        // Нет следующего модуля - на главную
        console.log('🔍 Podcast: No next module, going to home');
        router.push('/');
      }
      
    } catch (error) {
      console.error('🔍 Podcast: Error loading lesson structure:', error);
      
      // Если не удалось загрузить структуру, пробуем использовать next из URL как запасной вариант
      if (nextModuleId) {
        console.log('🔍 Podcast: Falling back to next from URL:', nextModuleId);
        router.push(`/module-flow?module=${nextModuleId}&lesson=${lessonId}&studied=${studiedLanguage}&hint=${hintLanguage}`);
      } else {
        router.push('/');
      }
    }
  }, [moduleId, lessonId, studiedLanguage, hintLanguage, nextModuleId, router]);

  // Загружаем модуль и подкасты
  useEffect(() => {
    const loadModuleAndPodcasts = async () => {
      if (!moduleId) {
        setError('ID модуля не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [moduleResponse, podcastsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`),
          fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/podcasts`)
        ]);

        if (!moduleResponse.ok) throw new Error('Модуль не найден');
        if (!podcastsResponse.ok) throw new Error('Ошибка загрузки аудио');

        const [moduleData, podcastsData] = await Promise.all([
          moduleResponse.json(),
          podcastsResponse.json()
        ]);

        setModule(moduleData);
        setPodcasts(podcastsData);
        
        if (podcastsData.length === 0) {
          setError('В этом модуле пока нет аудио');
        }
        
      } catch (err) {
        console.error('Error loading module:', err);
        setError('Ошибка загрузки: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModuleAndPodcasts();
  }, [moduleId]);

  // Сброс состояния при смене подкаста
  useEffect(() => {
    if (currentPodcast) {
      setShowTranscripts(false);
      setHasCompletedFirstListen(false);
      setCurrentTime(0);
      
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [currentIndex]);

  const currentPodcast = podcasts[currentIndex];

  // Обработчики аудио
  useEffect(() => {
    if (!audioRef.current || !currentPodcast) return;

    const audio = audioRef.current;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPodcast]);

  // Управление аудио
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Play error:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleLoop = () => {
    if (!audioRef.current) return;
    audioRef.current.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpeedClick = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIdx = speeds.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % speeds.length;
    handlePlaybackRateChange(speeds[nextIdx]);
  };

  // ===== ОСНОВНАЯ ЛОГИКА НАВИГАЦИИ =====
  const goNext = () => {
    if (!hasCompletedFirstListen) {
      // Первый раз нажали "Далее" - включаем титры
      setShowTranscripts(true);
      setHasCompletedFirstListen(true);
      
      // Перематываем на начало и запускаем
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (!isPlaying) {
          audioRef.current.play().catch(e => console.error('Play error:', e));
          setIsPlaying(true);
        }
      }
    } else {
      // Второй раз нажали "Далее" - переходим к следующему подкасту
      if (currentIndex < podcasts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Все подкасты прослушаны - переходим к следующему модулю
        goToNextModule();
      }
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аудио...</p>
        </div>
      </div>
    );
  }

  if (error || podcasts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">🎧</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600 mb-4">{error || 'Нет доступных аудио'}</p>
          <button 
            onClick={goToNextModule}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Перейти к следующему модулю →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 flex flex-col"
    >
      {/* Аудио элемент */}
      <audio
        ref={audioRef}
        src={currentPodcast?.audioUrl}
        preload="metadata"
      />
      
      {/* Верхняя панель */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">{module?.title || 'Аудио'}</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} из {podcasts.length}
            </span>
            {nextModuleId && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                + следующий модуль
              </span>
            )}
          </div>
        </div>
        
        {/* Индикатор режима */}
        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
          showTranscripts 
            ? 'bg-purple-500 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {showTranscripts ? '📝 С титрами' : '🎧 Без титров'}
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 grid grid-rows-3 gap-4 max-h-[calc(100vh-140px)]">
        
        {/* Секция 1: Русские титры (верх) */}
        <AnimatePresence>
          {showTranscripts && (
            <motion.div
              key={`russian-${currentIndex}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded shadow"></div>
                  <h2 className="text-sm font-semibold text-gray-700">Русский</h2>
                </div>
                <div className="text-xs text-gray-500">
                  {currentPodcast?.title}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                  {currentPodcast?.originalTranscript || 'Титры не добавлены'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Секция 2: Плеер (середина) - всегда виден */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-4 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`player-${currentIndex}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              className="space-y-4"
            >
              {/* Индикатор прогресса изучения */}
              <div className="flex justify-center">
                <div className="bg-white/20 rounded-full px-4 py-1.5">
                  <span className="text-white text-xs font-medium">
                    {!hasCompletedFirstListen ? (
                      <>Шаг 1 из 2: Прослушивание без титров</>
                    ) : (
                      <>Шаг 2 из 2: Прослушивание с титрами</>
                    )}
                  </span>
                </div>
              </div>

              {/* Прогресс и время */}
              <div className="mb-2">
                <div className="flex justify-between text-white/90 text-xs mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative">
                  <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-white to-yellow-200 rounded-full"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
                  />
                  <motion.div 
                    className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg -translate-y-1/2"
                    style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
                    animate={{ scale: isPlaying ? 1.2 : 1 }}
                  />
                </div>
              </div>

              {/* Основные кнопки управления */}
              <div className="flex items-center justify-between px-2" style={{opacity:"1"}}>
                {/* Кнопка повтора */}
                <button
                  onClick={toggleLoop}
                  style={{opacity:0}}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isLooping 
                      ? 'bg-white text-purple-600' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Кнопка предыдущего */}
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentIndex === 0
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Главная кнопка Play/Pause */}
                <motion.button
                  onClick={togglePlayPause}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-white to-yellow-100 flex items-center justify-center shadow-2xl"
                >
                  {isPlaying ? (
                    <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </motion.button>

                {/* Кнопка следующего */}
                <button
                  onClick={goNext}
                  disabled={currentIndex === podcasts.length - 1 && hasCompletedFirstListen}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    (currentIndex === podcasts.length - 1 && hasCompletedFirstListen)
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Скорость воспроизведения */}
                <button
                  onClick={handleSpeedClick}
                  className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
                >
                  <span className="text-xs font-bold">{playbackRate}x</span>
                </button>
              </div>

              {/* Дополнительные элементы управления */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
                
                
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Секция 3: Перевод титров (низ) */}
        <AnimatePresence>
          {showTranscripts && (
            <motion.div
              key={`translation-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow"></div>
                  <h2 className="text-sm font-semibold text-gray-700">{hintLanguage}</h2>
                </div>
                <div className="text-xs text-gray-500">
                  {currentPodcast?.duration && `${formatTime(currentPodcast.duration)} • `}
                  {currentPodcast?.fileSize && `${(currentPodcast.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                  {currentPodcast?.hintTranscript || 'Перевод не добавлен'}
                </p>
                
                {/* Дополнительная подсказка */}
                {currentPodcast?.hint && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-3 pt-3 border-t border-blue-200"
                  >
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-600 text-xs">💡</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-yellow-800 mb-0.5">Подсказка</h4>
                        <p className="text-xs text-yellow-700">{currentPodcast.hint}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Основная кнопка навигации "Далее" */}
      {/* Основная кнопка навигации "Далее" */}
<div className="mt-4 flex justify-center">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={goNext}
    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium text-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
  >
    {!hasCompletedFirstListen ? (
      <>
        Прослушал без титров →
        <span className="block text-xs text-white/80 mt-0.5">Включить титры и прослушать ещё раз</span>
      </>
    ) : currentIndex < podcasts.length - 1 ? (
      <>
        Следующее аудио →
        <span className="block text-xs text-white/80 mt-0.5">Перейти к следующему</span>
      </>
    ) : (
      <>
        Завершить и продолжить →
        <span className="block text-xs text-white/80 mt-0.5">Перейти к следующему модулю</span>
      </>
    )}
  </motion.button>
</div>

      {/* Минимальная навигация внизу */}
      <div className="mt-3 flex items-center justify-center">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <span className="mx-4 text-xs text-gray-400">|</span>
        <button
          onClick={() => router.push('/')}
          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}