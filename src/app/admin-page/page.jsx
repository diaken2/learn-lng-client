
"use client"
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getAvailableThemes } from '@/utils/themeUtils'
import { normalizeSentence, normalizeWord } from '@/utils/normalize';
import AudioWordModal from '../../components/AudioWordModal'
import AudioAdjectiveModal from '@/components/AudioAdjectiveModal';
import AudioQuestionWordModal from '@/components/AudioQuestionWordModal';
import AudioPrepositionModal from '@/components/AudioPrepositionModal';
import AudioGerundModal from '@/components/AudioGerundModal';
import AudioVerbModal from '@/components/AudioVerbModal';
import AudioAdverbModal from '@/components/AudioAdverbModal';
import AudioParticipleModal from '@/components/AudioParticipleModal';
import AudioNumeralModal from '@/components/AudioNumeralModal';
import AudioPronounModal from '@/components/AudioPronounModal';
import TestCreationModal from '@/components/TestCreationModal';

const getDisplayLabel = (key, context = 'default') => {
  const labelMap = {
    // Заголовки таблиц
    'Урок название': 'Тема название',
    'Урок номер': 'Тема номер',
    
    // Лейблы в формах
    'Выбрать урок': 'Выбрать тему',
    'Тема урока': 'Тема',
    
    // В зависимости от контекста можно добавлять исключения
  };
  
  // Возвращаем маппированное значение или оригинал
  return labelMap[key] || key;
};
const API_BASE_URL = 'https://learn-lng-new-client-lrqy.onrender.com/api';
const getTableHeaderDisplay = (dbKey, activeTable) => {
  // Специальные случаи для точного совпадения (прилагательные, причастия и др.)
   if (dbKey === 'Урок название') return 'Тема название';
  if (dbKey === 'Урок номер') return 'Тема номер';
  const displayNameMap = {
    'База прилагательные базовая форма Русский': 'Русский',
    'База прилагательные аудио Русский': 'Аудио Русский',
    'База причастия базовая форма Русский': 'Русский',
    'База причастия аудио Русский': 'Аудио Русский',
    // Добавьте другие специальные случаи по необходимости
  };
  
  // Если есть точное совпадение — возвращаем из мапы
  if (displayNameMap[dbKey]) {
    return displayNameMap[dbKey];
  }
  
  // === ТАБЛИЦА СУЩЕСТВИТЕЛЬНЫХ ===
  if (activeTable === 'nouns') {
    // "База существительные слова {Язык}" → "{Язык} ед ч."
    const wordsMatch = dbKey.match(/^База существительные слова (.+)$/);
    if (wordsMatch) {
      return `${wordsMatch[1]} ед ч.`;
    }
    
    // "База существительные множественное {Язык}" → "{Язык} мн ч"
    const pluralMatch = dbKey.match(/^База существительные множественное (.+)$/);
    if (pluralMatch) {
      return `${pluralMatch[1]} мн ч`;
    }
    
    // "База существительные аудио {Язык}" → "Аудио {Язык}"
    const audioMatch = dbKey.match(/^База существительные аудио (.+)$/);
    if (audioMatch) {
      return `Аудио ${audioMatch[1]}`;
    }
    
    // "База существительные номер {Язык}" → "Номер {Язык}"
    const numberMatch = dbKey.match(/^База существительные номер (.+)$/);
    if (numberMatch) {
      return `Номер ${numberMatch[1]}`;
    }
  }
  
  // === ТАБЛИЦА ПРИЛАГАТЕЛЬНЫХ ===
  if (activeTable === 'adjectives') {
    // "База прилагательные базовая форма {Язык}" → "{Язык}"
    const baseMatch = dbKey.match(/^База прилагательные базовая форма (.+)$/);
    if (baseMatch) {
      return baseMatch[1];
    }
    // "База прилагательные аудио {Язык}" → "Аудио {Язык}"
    const adjAudioMatch = dbKey.match(/^База прилагательные аудио (.+)$/);
    if (adjAudioMatch) {
      return `Аудио ${adjAudioMatch[1]}`;
    }
  }
  
  // === ТАБЛИЦА ПРИЧАСТИЙ ===
  if (activeTable === 'participles') {
    // "База причастия базовая форма {Язык}" → "{Язык}"
    const partBaseMatch = dbKey.match(/^База причастия базовая форма (.+)$/);
    if (partBaseMatch) {
      return partBaseMatch[1];
    }
    // "База причастия аудио {Язык}" → "Аудио {Язык}"
    const partAudioMatch = dbKey.match(/^База причастия аудио (.+)$/);
    if (partAudioMatch) {
      return `Аудио ${partAudioMatch[1]}`;
    }
  }
  
  // === ТАБЛИЦА ГЛАГОЛОВ ===
  if (activeTable === 'verbs') {
    // "Инфинитив" → "Русский"
    if (dbKey === 'Инфинитив') {
      return 'Русский';
    }
    // "Аудио Инфинитив" → "Аудио Русский"
    if (dbKey === 'Аудио Инфинитив') {
      return 'Аудио Русский';
    }
    // Для остальных языков: если колонка совпадает с названием языка → оставляем как есть
    // (например, "Английский", "Турецкий" и т.д.)
    // Можно добавить обработку аудио для других языков при необходимости:
    const verbAudioMatch = dbKey.match(/^Аудио (.+)$/);
    if (verbAudioMatch) {
      return `Аудио ${verbAudioMatch[1]}`;
    }
  }
  
  // === ТАБЛИЦЫ С ПРОСТОЙ СТРУКТУРОЙ (деепричастия, наречия, вопросительные слова, предлоги, числительные, местоимения) ===
  // Для этих таблиц колонки обычно — просто названия языков: "Русский", "Английский" и т.д.
  // Или "Аудио {Язык}" → "Аудио {Язык}"
  const simpleAudioMatch = dbKey.match(/^Аудио (.+)$/);
  if (simpleAudioMatch) {
    return `Аудио ${simpleAudioMatch[1]}`;
  }
  
  // Если ничего не подошло — возвращаем оригинальный ключ
  return dbKey;
};
// Компонент для визуализации предложений
// Компонент SentenceTable
const getDatabaseDisplayName = (database) => {
  const databaseNames = {
    'nouns': 'Существительное',
    'adjectives': 'Прилагательное',
    'verbs': 'Глагол',
    'pronouns': 'Местоимение', 
    'numerals': 'Числительное',
    'adverbs': 'Наречие',  // ← ДОБАВЬТЕ
    'prepositions': 'предлог, частица',
    'question-words': 'Вопросительное слово',
    'gerunds': 'Деепричастие'
  };
  return databaseNames[database] || database;
};
// Создайте новый компонент SentenceColumn.jsx
const SentenceColumn = ({ 
  config, 
  columnIndex, 
  columnData,
  onColumnChange,
  lessonData,
  getThemesByDatabase,
  getAvailableThemes
}) => {
  
  // Определяем, нужно ли показывать фильтры для этой базы данных
  const showFilters = !['prepositions', 'question-words', 'gerunds'].includes(config.database);
  
  return (
    <div className="space-y-3">
      {/* Выбор урока - для всех кроме предлогов, вопрос.слов, деепричастий */}
      {
       config.database !== 'question-words' && 
       config.database !== 'prepositions' &&
       config.database !== 'pronouns' &&
       config.database !== 'numerals' && (
        <div>
          <label className="block text-sm font-medium mb-1">
  {getDisplayLabel('Выбрать урок')}
</label>
          <select
            value={columnData.lesson || ''}
            onChange={(e) => onColumnChange(columnIndex, 'lesson', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Выберите тему</option>
            {getThemesByDatabase(config.database).map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>
      )}

      {config.database === 'pronouns' && (
        <PronounFormSelector
          config={columnData}
          onConfigChange={(field, value) => {
            onColumnChange(columnIndex, field, value);
          }}
        />
      )}
      
      {config.database === 'pronouns' && columnData.wordData?.selectedForm && (
        <div className="text-xs text-indigo-600 mt-1">
          Форма: {columnData.wordData.selectedForm.person} л., 
          {columnData.wordData.selectedForm.number === 'ед' ? ' ед.ч' : ' мн.ч'}
          {columnData.wordData.selectedForm.gender && `, ${columnData.wordData.selectedForm.gender}`}
          {columnData.wordData.selectedForm.case && `, ${columnData.wordData.selectedForm.case}`}
        </div>
      )}

      {config.database === 'question-words' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => onColumnChange(columnIndex, 'number', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Род</label>
            <select
              value={columnData.gender || ''}
              onChange={(e) => onColumnChange(columnIndex, 'gender', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="мужской">Мужской</option>
              <option value="женский">Женский</option>
              <option value="средний">Средний</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => onColumnChange(columnIndex, 'case', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1 col-span-2">
            Вопросительные слова изменяются по падежам, родам и числам
          </p>
        </div>
      )}
      
      {/* ФИЛЬТРЫ ДЛЯ РАЗНЫХ ТИПОВ БАЗ ДАННЫХ */}
      {config.database === 'nouns' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => onColumnChange(columnIndex, 'number', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Род</label>
            <select
              value={columnData.gender || ''}
              onChange={(e) => onColumnChange(columnIndex, 'gender', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="мужской">Мужской</option>
              <option value="женский">Женский</option>
              <option value="средний">Средний</option>
            </select>
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => onColumnChange(columnIndex, 'case', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
        </div>
      )}

      {config.database === 'adjectives' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => onColumnChange(columnIndex, 'number', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Род</label>
            <select
              value={columnData.gender || ''}
              onChange={(e) => onColumnChange(columnIndex, 'gender', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="мужской">Мужской</option>
              <option value="женский">Женский</option>
              <option value="средний">Средний</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => onColumnChange(columnIndex, 'case', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
        </div>
      )}
      
      {config.database === 'participles' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => onColumnChange(columnIndex, 'number', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Род</label>
            <select
              value={columnData.gender || ''}
              onChange={(e) => onColumnChange(columnIndex, 'gender', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="мужской">Мужской</option>
              <option value="женский">Женский</option>
              <option value="средний">Средний</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => onColumnChange(columnIndex, 'case', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
        </div>
      )}
      
      {config.database === 'numerals' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => onColumnChange(columnIndex, 'case', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Числительные изменяются по падежам. Пример: восемь → восьми, восемью
            </p>
          </div>
        </div>
      )}

      {/* ФИЛЬТРЫ ДЛЯ ГЛАГОЛОВ */}
      {config.database === 'verbs' && (
        <div className="space-y-2 p-3 bg-purple-50 rounded border border-purple-200">
          <h5 className="font-medium text-sm text-purple-800">Форма глагола:</h5>
          
          <div>
            <label className="text-xs text-gray-600">Время</label>
            <select
              value={columnData.tense || ''}
              onChange={(e) => onColumnChange(columnIndex, 'tense', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Инфинитив</option>
              <option value="present">Настоящее время</option>
              <option value="past">Прошедшее время</option>
              <option value="future">Будущее время</option>
              <option value="imperative">Повелительное наклонение</option>
            </select>
          </div>

          {(columnData.tense === 'present' || columnData.tense === 'future') && (
            <div>
              <label className="text-xs text-gray-600">Лицо и число</label>
              <select
                value={columnData.person || ''}
                onChange={(e) => onColumnChange(columnIndex, 'person', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="Выбор">Выберите лицо и число</option>
                <option value="я">1 лицо ед.ч. (я)</option>
                <option value="ты">2 лицо ед.ч. (ты)</option>
                <option value="он">3 лицо ед.ч. муж.род (он)</option>
                <option value="она">3 лицо ед.ч. жен.род (она)</option>
                <option value="оно">3 лицо ед.ч. сред.род (оно)</option>
                <option value="мы">1 лицо мн.ч. (мы)</option>
                <option value="вы">2 лицо мн.ч. (вы)</option>
                <option value="они">3 лицо мн.ч. (они)</option>
              </select>
            </div>
          )}

          {columnData.tense === 'past' && (
            <>
              <div>
                <label className="text-xs text-gray-600">Лицо</label>
                <select
                  value={columnData.person || ''}
                  onChange={(e) => onColumnChange(columnIndex, 'person', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="Выбор">Выберите лицо и число</option>
                  <option value="я">1 лицо (я)</option>
                  <option value="ты">2 лицо (ты)</option>
                  <option value="он">3 лицо муж.род (он)</option>
                  <option value="она">3 лицо жен.род (она)</option>
                  <option value="оно">3 лицо сред.род (оно)</option>
                  <option value="мы">1 лицо мн.ч. (мы)</option>
                  <option value="вы">2 лицо мн.ч. (вы)</option>
                  <option value="они">3 лицо мн.ч. (они)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Род (для ед.ч.)</label>
                <select
                  value={columnData.verbGender || ''}
                  onChange={(e) => onColumnChange(columnIndex, 'verbGender', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="masculine">Мужской</option>
                  <option value="feminine">Женский</option>
                  <option value="neuter">Средний</option>
                </select>
              </div>
            </>
          )}

          {columnData.tense === 'imperative' && (
            <div>
              <label className="text-xs text-gray-600">Число</label>
              <select
                value={columnData.imperativeForm || ''}
                onChange={(e) => onColumnChange(columnIndex, 'imperativeForm', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="Выбор">Выберите наклонение</option>
                <option value="ты">Единственное (ты)</option>
                <option value="вы">Множественное (вы)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Выбор слова */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {config.database === 'prepositions' ? 'Выбрать предлог, частица' : 
           config.database === 'question-words' ? 'Выбрать вопросительное слово' : 
           config.database === 'gerunds' ? 'Выбрать деепричастие' :
           config.database === 'verbs' ? 'Выбрать глагол' : 
           'Выбрать слово'}
        </label>
        
        <WordSelector
          studiedLanguage={lessonData?.studiedLanguage || 'русский'}
          theme={columnData.lesson || ''}
          database={config.database}
          filters={{
            number: columnData.number,
            gender: columnData.gender,
            case: columnData.case,
            tense: columnData.tense,
            person: columnData.person,
            verbGender: columnData.verbGender,
            imperativeForm: columnData.imperativeForm
          }}
          onWordSelect={(selectedWord) => {
            const displayWord = selectedWord.displayWord || selectedWord.word || '';
            
            onColumnChange(columnIndex, 'word', displayWord);
            onColumnChange(columnIndex, 'wordData', {
              ...selectedWord,
              selectedFilters: {
                person: columnData.person,
                number: columnData.number,
                gender: columnData.gender,
                case: columnData.case
              }
            });
          }}
          selectedWord={columnData.wordData}
        />
      </div>

      {/* Отображение выбранного слова */}
      {columnData.word && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-green-800">
                Выбрано: {columnData.word}
              </span>
              {columnData.wordData?.imagePng && (
                <div className="mt-1">
                  <img
                    src={columnData.wordData.imagePng}
                    alt="Preview"
                    className="h-8 w-8 object-cover rounded"
                  />
                </div>
              )}
              
              {/* Отображение примененных фильтров */}
              {(columnData.number || columnData.gender || columnData.case || 
                columnData.tense || columnData.person || columnData.verbGender) && (
                <div className="text-xs text-gray-500 mt-1">
                  Фильтры: 
                  {columnData.number && ` Число: ${columnData.number}`}
                  {columnData.gender && ` Род: ${columnData.gender}`}
                  {columnData.case && ` Падеж: ${columnData.case}`}
                  {columnData.tense && ` Время: ${columnData.tense}`}
                  {columnData.person && ` Лицо: ${columnData.person}`}
                  {columnData.verbGender && ` Род гл.: ${columnData.verbGender}`}
                </div>
              )}
              
              {/* ★★★ ИСПРАВЛЕНИЕ: используем columnData вместо несуществующей переменной wordObj ★★★ */}
              {columnData.database === 'pronouns' && columnData.person && (
                <div className="text-xs text-indigo-600 mt-1">
                  Форма: {columnData.person} л., {columnData.number === 'ед' ? 'ед.ч' : 'мн.ч'}
                  {columnData.gender && `, ${columnData.gender}`}
                  {columnData.case && `, ${columnData.case}`}
                </div>
              )}
              
              {(columnData.number || columnData.gender || columnData.case) && (
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {columnData.number && (
                    <div>Число: {columnData.number}</div>
                  )}
                  {columnData.gender && (
                    <div>Род: {
                      columnData.gender === 'мужской' ? 'М' : 
                      columnData.gender === 'женский' ? 'Ж' : 
                      columnData.gender === 'средний' ? 'Ср' : columnData.gender
                    }</div>
                  )}
                  {columnData.case && (
                    <div>Падеж: {columnData.case}</div>
                  )}
                </div>
              )}
              
              {/* Для глаголов показываем форму */}
              {config.database === 'verbs' && columnData.wordData?.selectedForm && (
                <div className="text-xs text-purple-600 mt-1">
                  Форма: {
                    columnData.wordData.selectedForm.tense === 'present' ? 'наст.вр.' :
                    columnData.wordData.selectedForm.tense === 'past' ? 'прош.вр.' :
                    columnData.wordData.selectedForm.tense === 'future' ? 'буд.вр.' :
                    columnData.wordData.selectedForm.tense === 'imperative' ? 'повел.' :
                    'инф.'
                  }
                  {columnData.wordData.selectedForm.person && 
                    columnData.wordData.selectedForm.person !== 'он' && 
                    columnData.wordData.selectedForm.person !== 'она' && 
                    columnData.wordData.selectedForm.person !== 'оно' && 
                    `, ${columnData.wordData.selectedForm.person}`}
                  {columnData.wordData.selectedForm.gender && 
                    `, ${columnData.wordData.selectedForm.gender === 'masculine' ? 'муж.род' : 
                              columnData.wordData.selectedForm.gender === 'feminine' ? 'жен.род' : 'сред.род'}`}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                onColumnChange(columnIndex, 'word', '');
                onColumnChange(columnIndex, 'wordData', null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const AdjectiveCaseManagementModal = ({ isOpen, onClose, word, onSave, language = 'русский' }) => {
  const [cases, setCases] = useState({
    singular: {
      masculine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      feminine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      neuter: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      }
    },
    plural: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    }
  });

  useEffect(() => {
    if (word) {
      loadCases();
    }
  }, [word]);

  const loadCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/adjective-cases/${word.imageBase}`);
      const data = await response.json();
      if (data.singular || data.plural) {
        setCases({
          singular: data.singular || {
            masculine: {}, feminine: {}, neuter: {}
          },
          plural: data.plural || {}
        });
      }
    } catch (error) {
      console.error('Error loading adjective cases:', error);
    }
  };

 const handleSave = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/adjective-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase: word.imageBase,
        singular: cases.singular,
        plural: cases.plural,
        language: 'русский' // ← ДОБАВЬТЕ ЭТО ПОЛЕ
      })
    });
    
    if (response.ok) {
      const savedData = await response.json();
      console.log('Adjective cases saved successfully:', savedData);
      
      // Вызываем callback с обновленными данными
      if (onSave) {
        onSave(savedData);
      }
      
      // Показываем уведомление
      alert('Падежи прилагательного успешно сохранены!');
      
      onClose();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save adjective cases');
    }
  } catch (error) {
    console.error('Error saving adjective cases:', error);
    alert('Ошибка сохранения падежей: ' + error.message);
  }
};

  const handleCaseChange = (gender, number, caseType, value) => {
    if (gender) {
      setCases(prev => ({
        ...prev,
        singular: {
          ...prev.singular,
          [gender]: {
            ...prev.singular[gender],
            [caseType]: value
          }
        }
      }));
    } else {
      setCases(prev => ({
        ...prev,
        plural: {
          ...prev.plural,
          [caseType]: value
        }
      }));
    }
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный' },
    { key: 'genitive', label: 'Родительный' },
    { key: 'dative', label: 'Дательный' },
    { key: 'accusative', label: 'Винительный' },
    { key: 'instrumental', label: 'Творительный' },
    { key: 'prepositional', label: 'Предложный' }
  ];

  const genders = [
    { key: 'masculine', label: 'Мужской род' },
    { key: 'feminine', label: 'Женский род' },
    { key: 'neuter', label: 'Средний род' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения прилагательного: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
         <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <span className="font-medium">Язык падежей:</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language}
            </span>
            {language === 'русский' && (
              <span className="ml-2 text-sm text-gray-600">
                (полная поддержка родов, чисел и падежей)
              </span>
            )}
          </div>
        </div>
        {/* Таблица падежей */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              {/* Заголовок для единственного числа */}
              <tr>
                <th colSpan="19" className="border border-gray-300 p-2 text-center font-semibold bg-blue-100">
                  Единственное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th rowSpan="2" className="border border-gray-300 p-2 text-sm font-medium">Падеж</th>
                {genders.map(gender => (
                  <th key={gender.key} colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                    {gender.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <th key={`${gender.key}-${caseType.key}`} className="border border-gray-300 p-2 text-xs font-medium">
                      {caseType.label}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                  Формы
                </td>
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <td key={`input-${gender.key}-${caseType.key}`} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={cases.singular[gender.key]?.[caseType.key] || ''}
                        onChange={(e) => handleCaseChange(gender.key, 'singular', caseType.key, e.target.value)}
                        className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                        placeholder={`${gender.label.slice(0, 3)}. ${caseType.label}`}
                      />
                    </td>
                  ))
                ))}
              </tr>
            </tbody>
          </table>

          {/* Таблица для множественного числа */}
          <table className="min-w-full border-collapse border border-gray-300 mt-6">
            <thead>
              <tr>
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold bg-green-100">
                  Множественное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                {caseTypes.map(caseType => (
                  <th key={`plural-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    {caseType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {caseTypes.map(caseType => (
                  <td key={`plural-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.plural[caseType.key] || ''}
                      onChange={(e) => handleCaseChange(null, 'plural', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-green-50"
                      placeholder={`мн.ч. ${caseType.label}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Подсказки по падежам прилагательных:</h4>
          <div className="text-sm text-yellow-700">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Именительный:</strong> какой? какая? какое? (есть)</div>
              <div><strong>Родительный:</strong> какого? какой? какого? (нет)</div>
              <div><strong>Дательный:</strong> какому? какой? какому? (дать)</div>
              <div><strong>Винительный:</strong> какого? какую? какое? (вижу)</div>
              <div><strong>Творительный:</strong> каким? какой? каким? (горжусь)</div>
              <div><strong>Предложный:</strong> о каком? о какой? о каком? (думаю)</div>
            </div>
            <p className="mt-2 text-xs">Прилагательные согласуются с существительными в роде, числе и падеже.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить падежи
          </button>
        </div>
      </div>
    </div>
  );
};
const SentenceTable = ({ sentences, moduleConfig, onEdit, onDelete }) => {
  const columnConfigs = moduleConfig?.config?.columnConfigs || moduleConfig?.columnConfigs || [];
  
  if (!sentences || sentences.length === 0) {
    return <div className="text-center py-4 text-gray-500">Нет добавленных предложений</div>;
  }

  return (
    <div className="mt-4">
      <h5 className="font-semibold mb-2">Таблица фраз:</h5>
      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full border-collapse border border-gray-300 table-auto">
          <thead>
            <tr className="bg-gray-100">
              {columnConfigs.map((config, index) => (
                <th key={index} className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words">
                  Колонка {index + 1} ({getDatabaseDisplayName(config.database)})
                </th>
              ))}
              <th className="border border-gray-300 p-2 text-sm min-w-[100px] whitespace-normal break-words">Картинка</th>
              <th className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words">Перевод</th>
              <th className="border border-gray-300 p-2 text-sm min-w-[150px] sticky right-0 bg-gray-100 z-10">Действия</th>
            </tr>
          </thead>
          <tbody suppressHydrationWarning={true}>
            {sentences.map((sentence, rowIndex) => (
              <tr key={sentence._id || rowIndex} className="hover:bg-gray-50">
                {sentence.sentenceStructure && sentence.sentenceStructure.map((wordObj, colIndex) => {
                  // ★★★ ЗАЩИТА ОТ NULL ★★★
                  if (!wordObj) {
                    return (
                      <td key={colIndex} className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words text-gray-400">
                        —
                      </td>
                    );
                  }
                  
                  const displayWord = wordObj.word || wordObj.wordData?.word || '—';
                  const config = columnConfigs[colIndex];
                  
                  return (
                    <td key={colIndex} className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words">
                      <div className="font-medium">{displayWord}</div>
                      
                      {/* Отображение примененных фильтров */}
                      {(wordObj.number || wordObj.gender || wordObj.case) && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {wordObj.number && (
                            <div>Число: {wordObj.number}</div>
                          )}
                          {config?.database === 'adjectives' && wordObj.gender && (
                            <div>Род: {wordObj.gender}</div>
                          )}
                          {wordObj.case && (
                            <div>Падеж: {wordObj.case}</div>
                          )}
                        </div>
                      )}
                      
                      {wordObj.wordData && (
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {wordObj.wordData.imageBase}
                        </div>
                      )}
                      
                      {/* Отображение типа базы данных */}
                      {wordObj.database && (
                        <div className="text-xs text-green-600 mt-1">
                          {getDatabaseDisplayName(wordObj.database)}
                        </div>
                      )}
                    </td>
                  );
                })}
                
                {columnConfigs.slice(sentence.sentenceStructure?.length || 0).map((_, emptyIndex) => (
                  <td key={`empty-${emptyIndex}`} className="border border-gray-300 p-2 text-sm text-gray-400 min-w-[150px] whitespace-normal break-words">
                    —
                  </td>
                ))}
                
                <td className="border border-gray-300 p-2 min-w-[100px]">
                  {sentence.image ? (
                    <img
                      src={sentence.image}
                      alt="Preview"
                      className="h-10 w-10 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-xs text-gray-500">Нет изображения</div>
                  )}
                </td>
                
                {/* ★★★ НОВАЯ КОЛОНКА ДЛЯ ПЕРЕВОДА ★★★ */}
                <td className="border border-gray-300 p-2 text-sm min-w-[150px] whitespace-normal break-words">
                  {sentence.customTranslation || sentence.translation ? (
                    <div>
                      <div className="text-gray-700">{sentence.customTranslation || sentence.translation}</div>
                      {sentence.customTranslation && sentence.translation !== sentence.customTranslation && (
                        <div className="text-xs text-blue-500 mt-1">
                          (исправлен)
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                
                <td className="border border-gray-300 p-2 sticky right-0 bg-white z-10">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(sentence)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => onDelete(sentence._id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// ============================================
// Компонент ParticipleCaseManagementModal (копия AdjectiveCaseManagementModal)
// ============================================
const ParticipleCaseManagementModal = ({ isOpen, onClose, word, onSave, language = 'русский' }) => {
  const [cases, setCases] = useState({
    singular: {
      masculine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      feminine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      neuter: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      }
    },
    plural: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    }
  });

  useEffect(() => {
    if (word) {
      loadCases();
    }
  }, [word]);

  const loadCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/participle-cases/${word.imageBase}`);
      const data = await response.json();
      if (data.singular || data.plural) {
        setCases({
          singular: data.singular || {
            masculine: {}, feminine: {}, neuter: {}
          },
          plural: data.plural || {}
        });
      }
    } catch (error) {
      console.error('Error loading participle cases:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/participle-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: word.imageBase,
          singular: cases.singular,
          plural: cases.plural,
          language: 'русский'
        })
      });
      
      if (response.ok) {
        const savedData = await response.json();
        console.log('Participle cases saved successfully:', savedData);
        
        if (onSave) {
          onSave(savedData);
        }
        
        alert('Падежи причастия успешно сохранены!');
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save participle cases');
      }
    } catch (error) {
      console.error('Error saving participle cases:', error);
      alert('Ошибка сохранения падежей: ' + error.message);
    }
  };

  const handleCaseChange = (gender, number, caseType, value) => {
    if (gender) {
      setCases(prev => ({
        ...prev,
        singular: {
          ...prev.singular,
          [gender]: {
            ...prev.singular[gender],
            [caseType]: value
          }
        }
      }));
    } else {
      setCases(prev => ({
        ...prev,
        plural: {
          ...prev.plural,
          [caseType]: value
        }
      }));
    }
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный' },
    { key: 'genitive', label: 'Родительный' },
    { key: 'dative', label: 'Дательный' },
    { key: 'accusative', label: 'Винительный' },
    { key: 'instrumental', label: 'Творительный' },
    { key: 'prepositional', label: 'Предложный' }
  ];

  const genders = [
    { key: 'masculine', label: 'Мужской род' },
    { key: 'feminine', label: 'Женский род' },
    { key: 'neuter', label: 'Средний род' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения причастия: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
         <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <span className="font-medium">Язык падежей:</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language}
            </span>
            {language === 'русский' && (
              <span className="ml-2 text-sm text-gray-600">
                (полная поддержка родов, чисел и падежей)
              </span>
            )}
          </div>
        </div>
        {/* Таблица падежей */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              {/* Заголовок для единственного числа */}
              <tr>
                <th colSpan="19" className="border border-gray-300 p-2 text-center font-semibold bg-blue-100">
                  Единственное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th rowSpan="2" className="border border-gray-300 p-2 text-sm font-medium">Падеж</th>
                {genders.map(gender => (
                  <th key={gender.key} colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                    {gender.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <th key={`${gender.key}-${caseType.key}`} className="border border-gray-300 p-2 text-xs font-medium">
                      {caseType.label}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                  Формы
                </td>
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <td key={`input-${gender.key}-${caseType.key}`} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={cases.singular[gender.key]?.[caseType.key] || ''}
                        onChange={(e) => handleCaseChange(gender.key, 'singular', caseType.key, e.target.value)}
                        className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                        placeholder={`${gender.label.slice(0, 3)}. ${caseType.label}`}
                      />
                    </td>
                  ))
                ))}
              </tr>
            </tbody>
          </table>

          {/* Таблица для множественного числа */}
          <table className="min-w-full border-collapse border border-gray-300 mt-6">
            <thead>
              <tr>
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold bg-green-100">
                  Множественное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                {caseTypes.map(caseType => (
                  <th key={`plural-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    {caseType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {caseTypes.map(caseType => (
                  <td key={`plural-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.plural[caseType.key] || ''}
                      onChange={(e) => handleCaseChange(null, 'plural', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-green-50"
                      placeholder={`мн.ч. ${caseType.label}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Подсказки по падежам причастий:</h4>
          <div className="text-sm text-yellow-700">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Именительный:</strong> какой? какая? какое? (есть)</div>
              <div><strong>Родительный:</strong> какого? какой? какого? (нет)</div>
              <div><strong>Дательный:</strong> какому? какой? какому? (дать)</div>
              <div><strong>Винительный:</strong> какого? какую? какое? (вижу)</div>
              <div><strong>Творительный:</strong> каким? какой? каким? (горжусь)</div>
              <div><strong>Предложный:</strong> о каком? о какой? о каком? (думаю)</div>
            </div>
            <p className="mt-2 text-xs">Причастия согласуются с существительными в роде, числе и падеже.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить падежи
          </button>
        </div>
      </div>
    </div>
  );
};

const PronounDeclensionModal = ({ isOpen, onClose, word, onSave, language = 'русский' }) => {
  const [declensions, setDeclensions] = useState({
    nominative: {},
    genitive: {},
    dative: {},
    accusative: {},
    instrumental: {},
    prepositional: {}
  });

  // Колонки для таблицы
  const columns = [
    { key: '1л_ед', label: '1 л. ед.ч', description: 'я' },
    { key: '1л_мн', label: '1 л. мн.ч', description: 'мы' },
    { key: '2л_ед', label: '2 л. ед.ч', description: 'ты' },
    { key: '2л_мн', label: '2 л. мн.ч', description: 'вы' },
    { key: '3л_ед_м', label: '3 л. ед.ч (он)', description: 'он' },
    { key: '3л_ед_с', label: '3 л. ед.ч (оно)', description: 'оно' },
    { key: '3л_ед_ж', label: '3 л. ед.ч (она)', description: 'она' },
    { key: '3л_мн', label: '3 л. мн.ч', description: 'они' }
  ];

  const cases = [
    { key: 'nominative', label: 'Именительный', question: 'кто? что?' },
    { key: 'genitive', label: 'Родительный', question: 'кого? чего?' },
    { key: 'dative', label: 'Дательный', question: 'кому? чему?' },
    { key: 'accusative', label: 'Винительный', question: 'кого? что?' },
    { key: 'instrumental', label: 'Творительный', question: 'кем? чем?' },
    { key: 'prepositional', label: 'Предложный', question: 'о ком? о чём?' }
  ];

  useEffect(() => {
    if (word) {
      loadDeclensions();
    }
  }, [word]);

  const loadDeclensions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pronoun-declensions/${word.imageBase}`);
      const data = await response.json();
      if (data.declensions) {
        setDeclensions(data.declensions);
      }
    } catch (error) {
      console.error('Error loading pronoun declensions:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pronoun-declensions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: word.imageBase,
          declensions: declensions,
          language: language
        })
      });
      
      if (response.ok) {
        const savedData = await response.json();
        console.log('Pronoun declensions saved successfully:', savedData);
        
        if (onSave) {
          onSave(savedData);
        }
        
        alert('Склонения местоимения успешно сохранены!');
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save pronoun declensions');
      }
    } catch (error) {
      console.error('Error saving pronoun declensions:', error);
      alert('Ошибка сохранения склонений: ' + error.message);
    }
  };

  const handleChange = (caseKey, columnKey, value) => {
    setDeclensions(prev => ({
      ...prev,
      [caseKey]: {
        ...prev[caseKey],
        [columnKey]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения местоимения: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
        
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <span className="font-medium">Язык падежей:</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language}
            </span>
          </div>
        </div>

        {/* Таблица склонений */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-sm font-medium">Падеж</th>
                {columns.map(col => (
                  <th key={col.key} className="border border-gray-300 p-2 text-sm font-medium">
                    <div>{col.label}</div>
                    <div className="text-xs text-gray-500">{col.description}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map(caseItem => (
                <tr key={caseItem.key}>
                  <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                    <div>{caseItem.label}</div>
                    <div className="text-xs text-gray-500">{caseItem.question}</div>
                  </td>
                  {columns.map(col => (
                    <td key={`${caseItem.key}-${col.key}`} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={declensions[caseItem.key]?.[col.key] || ''}
                        onChange={(e) => handleChange(caseItem.key, col.key, e.target.value)}
                        className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                        placeholder={`${caseItem.label}, ${col.label}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Таблица склонений личных местоимений:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="p-1">Падеж</th>
                  <th className="p-1">1 л. ед.ч</th>
                  <th className="p-1">1 л. мн.ч</th>
                  <th className="p-1">2 л. ед.ч</th>
                  <th className="p-1">2 л. мн.ч</th>
                  <th className="p-1">3 л. ед.ч (он, оно)</th>
                  <th className="p-1">3 л. ед.ч (она)</th>
                  <th className="p-1">3 л. мн.ч</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1 font-medium">И.п</td>
                  <td className="p-1">я</td>
                  <td className="p-1">мы</td>
                  <td className="p-1">ты</td>
                  <td className="p-1">вы</td>
                  <td className="p-1">он, оно</td>
                  <td className="p-1">она</td>
                  <td className="p-1">они</td>
                </tr>
                <tr>
                  <td className="p-1 font-medium">Р.п</td>
                  <td className="p-1">меня</td>
                  <td className="p-1">нас</td>
                  <td className="p-1">тебя</td>
                  <td className="p-1">вас</td>
                  <td className="p-1">его</td>
                  <td className="p-1">её</td>
                  <td className="p-1">их</td>
                </tr>
                <tr>
                  <td className="p-1 font-medium">Д.п</td>
                  <td className="p-1">мне</td>
                  <td className="p-1">нам</td>
                  <td className="p-1">тебе</td>
                  <td className="p-1">вам</td>
                  <td className="p-1">ему</td>
                  <td className="p-1">ей</td>
                  <td className="p-1">им</td>
                </tr>
                <tr>
                  <td className="p-1 font-medium">В.п</td>
                  <td className="p-1">меня</td>
                  <td className="p-1">нас</td>
                  <td className="p-1">тебя</td>
                  <td className="p-1">вас</td>
                  <td className="p-1">его</td>
                  <td className="p-1">её</td>
                  <td className="p-1">их</td>
                </tr>
                <tr>
                  <td className="p-1 font-medium">Т.п</td>
                  <td className="p-1">мной</td>
                  <td className="p-1">нами</td>
                  <td className="p-1">тобой</td>
                  <td className="p-1">вами</td>
                  <td className="p-1">им</td>
                  <td className="p-1">ею</td>
                  <td className="p-1">ими</td>
                </tr>
                <tr>
                  <td className="p-1 font-medium">П.п</td>
                  <td className="p-1">обо мне</td>
                  <td className="p-1">о нас</td>
                  <td className="p-1">о тебе</td>
                  <td className="p-1">о вас</td>
                  <td className="p-1">о нём</td>
                  <td className="p-1">о ней</td>
                  <td className="p-1">о них</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить склонения
          </button>
        </div>
      </div>
    </div>
  );
};

const PronounFormSelector = ({ config, onConfigChange }) => {
  return (
    <div className="space-y-2 p-3 bg-indigo-50 rounded border border-indigo-200">
      <h5 className="font-medium text-sm text-indigo-800">Форма местоимения:</h5>
      
      {/* Лицо */}
      <div>
        <label className="text-xs text-gray-600">Лицо</label>
        <select
          value={config.person || ''}
          onChange={(e) => onConfigChange('person', e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">Любое лицо</option>
          <option value="1">1 лицо</option>
          <option value="2">2 лицо</option>
          <option value="3">3 лицо</option>
        </select>
      </div>

      {/* Число */}
      <div>
        <label className="text-xs text-gray-600">Число</label>
        <select
          value={config.number || ''}
          onChange={(e) => onConfigChange('number', e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">Любое число</option>
          <option value="ед">Единственное</option>
          <option value="мн">Множественное</option>
        </select>
      </div>

      {/* Род (активен только для 3 лица ед.ч) */}
      <div>
        <label className="text-xs text-gray-600">
          Род 
          {config.person === '3' && config.number === 'ед' && 
            <span className="text-indigo-600 ml-1">(для 3 л. ед.ч)</span>
          }
        </label>
        <select
          value={config.gender || ''}
          onChange={(e) => onConfigChange('gender', e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          disabled={!(config.person === '3' && config.number === 'ед')}
        >
          <option value="">Любой род</option>
          <option value="мужской">Мужской</option>
          <option value="женский">Женский</option>
          <option value="средний">Средний</option>
        </select>
        {config.person === '3' && config.number === 'ед' && (
          <p className="text-xs text-indigo-600 mt-1">
            Для 3 лица ед.ч: он (м.р), она (ж.р), оно (ср.р)
          </p>
        )}
      </div>

      {/* Падеж */}
      <div>
        <label className="text-xs text-gray-600">Падеж</label>
        <select
          value={config.case || ''}
          onChange={(e) => onConfigChange('case', e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">Любой падеж</option>
          <option value="именительный">Именительный</option>
          <option value="родительный">Родительный</option>
          <option value="дательный">Дательный</option>
          <option value="винительный">Винительный</option>
          <option value="творительный">Творительный</option>
          <option value="предложный">Предложный</option>
        </select>
      </div>

      {/* Предпросмотр выбранной комбинации */}
      {config.person && config.number && config.case && (
        <div className="mt-2 p-2 bg-white rounded border text-xs">
          <span className="font-medium">Выбрано: </span>
          {config.person} лицо, {config.number === 'ед' ? 'ед.ч' : 'мн.ч'}
          {config.gender && `, ${config.gender}`}
          {config.case && `, ${config.case} падеж`}
        </div>
      )}
      
    </div>
  );
}
export const WordSelector = ({ 
  theme, 
  database, 
  onWordSelect, 
  selectedWord, 
  selectedWords = [],
  filters = {}, 
  studiedLanguage = 'русский' 
}) => {
  // ========== ВСЕ ХУКИ НА ВЕРХНЕМ УРОВНЕ ==========
  const [availableWords, setAvailableWords] = useState([]);
  const [prepositions, setPrepositions] = useState([]);
  const [questionWords, setQuestionWords] = useState([]);
  const [gerunds, setGerunds] = useState([]);
  const [verbs, setVerbs] = useState([]);
  const [participles, setParticiples] = useState([]);
  const [numerals, setNumerals] = useState([]);
  const [pronouns, setPronouns] = useState([]);
  const [adverbs, setAdverbs] = useState([]);
  
  // Состояния для падежей/склонений (были внутри функций-рендереров)
  const [questionWordCases, setQuestionWordCases] = useState({});
  const [numeralCases, setNumeralCases] = useState({});
  const [pronounDeclensions, setPronounDeclensions] = useState({});
  const [participleCases, setParticipleCases] = useState({});
  const [verbConjugations, setVerbConjugations] = useState({});
  const [adjectiveCases, setAdjectiveCases] = useState({});

  const { 
    number, 
    gender, 
    case: caseType,
    tense,
    person,
    verbGender,
    imperativeForm 
  } = filters;
  
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // ========== ЗАГРУЗКА ДАННЫХ ДЛЯ РАЗНЫХ БД ==========
  
  // Загрузка местоимений
  useEffect(() => {
    const loadPronouns = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/pronouns-table`);
        const data = await response.json();
        setPronouns(data || []);
        console.log('Loaded pronouns:', data);
      } catch (error) {
        console.error('Error loading pronouns:', error);
        setPronouns([]);
      }
    };

    if (database === 'pronouns') {
      loadPronouns();
    }
  }, [database]);

  // Загрузка склонений местоимений
  useEffect(() => {
    const loadAllPronounDeclensions = async () => {
      const declensionsMap = {};
      for (const pronoun of pronouns) {
        try {
          const imageBase = pronoun['База изображение'];
          if (imageBase) {
            const response = await fetch(`${API_BASE_URL}/pronoun-declensions/${imageBase}`);
            if (response.ok) {
              const data = await response.json();
              declensionsMap[imageBase] = data;
            }
          }
        } catch (error) {
          console.error('Error loading pronoun declensions:', error);
        }
      }
      setPronounDeclensions(declensionsMap);
    };
    
    if (database === 'pronouns' && pronouns.length > 0) {
      loadAllPronounDeclensions();
    }
  }, [database, pronouns]);

  // Загрузка наречий
  useEffect(() => {
    const loadAdverbs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/adverbs-table`);
        const data = await response.json();
        
        const adverbsWithTranslations = (data || []).map(adverb => {
          const translations = {};
          
          Object.keys(adverb).forEach(key => {
            if (key === 'Русский') translations['russian'] = adverb[key];
            if (key === 'Английский') translations['english'] = adverb[key];
            if (key === 'Турецкий') translations['turkish'] = adverb[key];
            if (key !== 'Уровень изучения номер' && 
                key !== 'Урок номер' && 
                key !== 'Урок название' && 
                key !== 'База изображение' && 
                key !== 'Картинка' && 
                key !== 'Картинка png' &&
                key !== 'Русский' && 
                key !== 'Английский' && 
                key !== 'Турецкий') {
              translations[key.toLowerCase()] = adverb[key];
            }
          });
          
          return {
            ...adverb,
            translations: translations,
            imageBase: adverb['База изображение'],
            imagePng: adverb['Картинка png'] || adverb['Картинка'] || ''
          };
        });
        
        setAdverbs(adverbsWithTranslations || []);
      } catch (error) {
        console.error('Error loading adverbs:', error);
        setAdverbs([]);
      }
    };

    if (database === 'adverbs') {
      loadAdverbs();
    }
  }, [database]);

  // Загрузка числительных
  useEffect(() => {
    const loadNumerals = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/numerals-table`);
        const data = await response.json();
        setNumerals(data || []);
      } catch (error) {
        console.error('Error loading numerals:', error);
        setNumerals([]);
      }
    };

    if (database === 'numerals') {
      loadNumerals();
    }
  }, [database]);
// Добавьте эту функцию в WordSelector (после всех useState)
// ========== ФУНКЦИЯ ДЛЯ ПРОИГРЫВАНИЯ АУДИО ==========
const playAudio = async (imageBase, language, databaseType) => {
  try {
    let endpoint = '';
    
    if (databaseType === 'nouns') {
      endpoint = `${API_BASE_URL}/word-audio/${imageBase}/${language}`;
    } else if (databaseType === 'adjectives') {
      endpoint = `${API_BASE_URL}/adjective-audio/${imageBase}/${language}`;
    } else if (databaseType === 'question-words') {
      const wordId = imageBase.startsWith('question_word_') ? imageBase : `question_word_${imageBase.toLowerCase().replace(/[^a-zа-яё]/g, '_')}`;
      endpoint = `${API_BASE_URL}/question-word-audio/${wordId}/${language}`;
    } else if (databaseType === 'prepositions') {
      const wordId = imageBase.startsWith('preposition_') ? imageBase : `preposition_${imageBase.toLowerCase().replace(/[^a-zа-яё]/g, '_')}`;
      endpoint = `${API_BASE_URL}/preposition-audio/${wordId}/${language}`;
    } else if (databaseType === 'gerunds') {
      endpoint = `${API_BASE_URL}/gerund-audio/${imageBase}/${language}`;
    } else if (databaseType === 'verbs') {
      endpoint = `${API_BASE_URL}/verb-audio/${imageBase}/${language}`;
    } else if (databaseType === 'adverbs') {
      endpoint = `${API_BASE_URL}/adverb-audio/${imageBase}/${language}`;
    } else if (databaseType === 'participles') {
      endpoint = `${API_BASE_URL}/participle-audio/${imageBase}/${language}`;
    } else if (databaseType === 'numerals') {
      endpoint = `${API_BASE_URL}/numeral-audio/${imageBase}/${language}`;
    } else if (databaseType === 'pronouns') {
      endpoint = `${API_BASE_URL}/pronoun-audio/${imageBase}/${language}`;
    } else {
      return;
    }
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (data.audioUrl && data.audioUrl !== 'pending') {
      const audio = new Audio(data.audioUrl);
      audio.play().catch(err => console.error('Error playing audio:', err));
    }
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

// ========== ОПРЕДЕЛЯЕМ ЯЗЫК ДЛЯ АУДИО ==========
const audioLanguage = studiedLanguage === 'русский' ? 'Русский' :
                      studiedLanguage === 'english' ? 'Английский' :
                      studiedLanguage === 'turkish' ? 'Турецкий' :
                      studiedLanguage === 'spanish' ? 'Испанский' :
                      studiedLanguage === 'german' ? 'Немецкий' :
                      studiedLanguage === 'french' ? 'Французский' :
                      studiedLanguage === 'italian' ? 'Итальянский' :
                      studiedLanguage === 'chinese' ? 'Китайский' :
                      studiedLanguage === 'japanese' ? 'Японский' :
                      studiedLanguage === 'korean' ? 'Корейский' :
                      studiedLanguage === 'arabic' ? 'Арабский' :
                      studiedLanguage.charAt(0).toUpperCase() + studiedLanguage.slice(1);
  // Загрузка падежей числительных
  useEffect(() => {
    const loadAllNumeralCases = async () => {
      const casesMap = {};
      for (const numeral of numerals) {
        try {
          const imageBase = numeral['База изображение'];
          if (imageBase) {
            const response = await fetch(`${API_BASE_URL}/numeral-cases/${imageBase}`);
            if (response.ok) {
              const data = await response.json();
              casesMap[imageBase] = data;
            }
          }
        } catch (error) {
          console.error('Error loading numeral cases:', error);
        }
      }
      setNumeralCases(casesMap);
    };
    
    if (database === 'numerals' && numerals.length > 0) {
      loadAllNumeralCases();
    }
  }, [database, numerals]);

  // Загрузка причастий
  useEffect(() => {
    const loadParticiples = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/participles-table`);
        const data = await response.json();
        
        const participlesWithTranslations = (data || []).map(participle => {
          const translations = {};
          const forms = {};
          
          Object.keys(participle).forEach(key => {
            if (key.includes('мужской род')) {
              const lang = key.split(' ').pop();
              translations[lang.toLowerCase()] = participle[key];
              forms[`${lang.toLowerCase()}_masculine`] = participle[key];
            }
            if (key.includes('женский род')) {
              const lang = key.split(' ').pop();
              forms[`${lang.toLowerCase()}_feminine`] = participle[key];
            }
            if (key.includes('средний род')) {
              const lang = key.split(' ').pop();
              forms[`${lang.toLowerCase()}_neuter`] = participle[key];
            }
            if (key.includes('множественное число')) {
              const lang = key.split(' ').pop();
              forms[`${lang.toLowerCase()}_plural`] = participle[key];
            }
          });
          
          return {
            ...participle,
            translations: translations,
            forms: forms,
            imageBase: participle['База изображение'],
            imagePng: participle['Картинка png'] || ''
          };
        });
        
        setParticiples(participlesWithTranslations || []);
      } catch (error) {
        console.error('Error loading participles:', error);
        setParticiples([]);
      }
    };

    if (database === 'participles') {
      loadParticiples();
    }
  }, [database]);

  // Загрузка падежей причастий
  useEffect(() => {
    const loadAllParticipleCases = async () => {
      const casesMap = {};
      for (const participle of participles) {
        try {
          const imageBase = participle['База изображение'];
          if (imageBase) {
            const response = await fetch(`${API_BASE_URL}/participle-cases/${imageBase}`);
            if (response.ok) {
              const data = await response.json();
              casesMap[imageBase] = data;
            }
          }
        } catch (error) {
          console.error('Error loading participle cases:', error);
        }
      }
      setParticipleCases(casesMap);
    };
    
    if (database === 'participles' && participles.length > 0) {
      loadAllParticipleCases();
    }
  }, [database, participles]);

  // Загрузка глаголов
  useEffect(() => {
    const loadVerbs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/verbs-table`);
        const data = await response.json();
        
        const verbsWithTranslations = (data || []).map(verb => {
          const translations = {};
          
          Object.keys(verb).forEach(key => {
            if (key === 'Английский') translations['english'] = verb[key];
            if (key === 'Турецкий') translations['turkish'] = verb[key];
            if (key === 'Инфинитив') {
              translations['infinitive'] = verb[key];
              translations['russian'] = verb[key];
            }
          });
          
          return {
            ...verb,
            translations: translations
          };
        });
        
        setVerbs(verbsWithTranslations || []);
      } catch (error) {
        console.error('Error loading verbs:', error);
        setVerbs([]);
      }
    };

    if (database === 'verbs') {
      loadVerbs();
    }
  }, [database]);

  // Загрузка спряжений глаголов
  useEffect(() => {
    const loadAllVerbConjugations = async () => {
      const conjugationsMap = {};
      for (const verb of verbs) {
        try {
          const imageBase = verb['База изображение'];
          if (imageBase) {
            const response = await fetch(`${API_BASE_URL}/verb-conjugation/${imageBase}`);
            if (response.ok) {
              const data = await response.json();
              conjugationsMap[imageBase] = data;
            }
          }
        } catch (error) {
          console.error('Error loading verb conjugation:', error);
        }
      }
      setVerbConjugations(conjugationsMap);
    };
    
    if (database === 'verbs' && verbs.length > 0) {
      loadAllVerbConjugations();
    }
  }, [database, verbs]);

  // Загрузка деепричастий
  useEffect(() => {
    const loadGerunds = async () => {
      if (gerunds && gerunds.length > 0) {
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/gerunds-table`);
        const data = await response.json();
        
        const gerundsWithTranslations = (data || []).map(gerund => {
          const translations = {};
          
          Object.keys(gerund).forEach(key => {
            if (key === 'Английский') translations['english'] = gerund[key];
            if (key === 'Турецкий') translations['turkish'] = gerund[key];
            if (key === 'Русский') {
              translations['russian'] = gerund[key];
            }
          });
          
          return {
            ...gerund,
            translations: translations,
            imageBase: gerund['База изображение'] || `gerund_${Date.now()}`,
            imagePng: gerund['Картинка png'] || gerund['Картинка'] || ''
          };
        });
        
        setGerunds(gerundsWithTranslations || []);
      } catch (error) {
        console.error('Error loading gerunds:', error);
        setGerunds([]);
      }
    };

    if (database === 'gerunds') {
      loadGerunds();
    }
  }, [database, gerunds]);

  // Загрузка предлогов
  useEffect(() => {
    const loadPrepositions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/prepositions-table`);
        const data = await response.json();
        setPrepositions(data || []);
      } catch (error) {
        console.error('Error loading prepositions:', error);
        setPrepositions([]);
      }
    };

    const loadQuestionWords = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/question-words`);
        const data = await response.json();
        setQuestionWords(data || []);
      } catch (error) {
        console.error('Error loading question words:', error);
        setQuestionWords([]);
      }
    };

    if (database === 'prepositions') {
      loadPrepositions();
    } else if (database === 'question-words') {
      loadQuestionWords();
    }
  }, [database]);

  // Загрузка падежей вопросительных слов
  useEffect(() => {
    const loadAllQuestionWordCases = async () => {
      const casesMap = {};
      for (const word of questionWords) {
        try {
          const russianWord = word['Русский'] || '';
          if (russianWord) {
            const imageBase = `question_word_${russianWord.toLowerCase()}`;
            const response = await fetch(`${API_BASE_URL}/question-word-cases/${imageBase}`);
            if (response.ok) {
              const data = await response.json();
              casesMap[imageBase] = data;
            }
          }
        } catch (error) {
          console.error('Error loading question word cases:', error);
        }
      }
      setQuestionWordCases(casesMap);
    };
    
    if (database === 'question-words' && questionWords.length > 0) {
      loadAllQuestionWordCases();
    }
  }, [database, questionWords]);

  // Загрузка обычных слов (существительные, прилагательные)
  useEffect(() => {
    const loadWordsForTheme = async () => {
      if (database === 'prepositions' || database === 'question-words') {
        return;
      }

      try {
        const endpoint = database === 'nouns' ? '/table' : '/adjectives-table';
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const tableData = await response.json();
     
        if (!tableData || tableData.length === 0) {
          setAvailableWords([]);
          return;
        }

        const words = [];
        let collectingWords = false;
     
        for (let i = 0; i < tableData.length; i++) {
          const row = tableData[i];
          
          if (row['Урок название'] && row['Урок название'] === theme) {
            collectingWords = true;
            continue;
          }
       
          if (row['Урок название'] && row['Урок название'] !== theme) {
            collectingWords = false;
            continue;
          }
       
          if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
            const translations = {};
            const forms = {};
         
            Object.keys(row).forEach(col => {
              if (database === 'nouns') {
                const prefix = 'База существительные слова';
                const pluralPrefix = 'База существительные множественное';
               
                if (col.includes(prefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const translation = row[col] || '';
                  if (translation.trim() !== '') {
                    translations[language] = translation;
                    forms[`${language}_singular`] = translation;
                  }
                }
               
                if (col.includes(pluralPrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const pluralForm = row[col] || '';
                  if (pluralForm.trim() !== '') {
                    forms[`${language}_plural`] = pluralForm;
                  }
                }
              }
             
              if (database === 'adjectives') {
                const baseFormPrefix = 'База прилагательные базовая форма';
                
                if (col.includes(baseFormPrefix)) {
                  const language = col.split(' ').pop().toLowerCase();
                  const form = row[col] || '';
                  if (form.trim() !== '') {
                    translations[language] = form;
                    forms[`${language}_base`] = form;
                  }
                }
              }
            });
         
            const wordObj = {
              id: row['База изображение'],
              imageBase: row['База изображение'],
              imagePng: row['Картинка png'] || row['Картинка'] || '',
              translations: translations,
              forms: forms
            };
         
            words.push(wordObj);
          }
        }
     
        const filteredWords = [];
        for (const word of words) {
          const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
          if (filteredWord !== null) {
            filteredWords.push(filteredWord);
          }
        }
     
        setAvailableWords(filteredWords);
     
      } catch (error) {
        console.error('Error loading words for theme:', error);
        setAvailableWords([]);
      }
    };
   
    if (theme && theme.trim() !== '' && database !== 'prepositions' && database !== 'question-words') {
      loadWordsForTheme();
    } else {
      setAvailableWords([]);
    }
  }, [theme, database, memoizedFilters, studiedLanguage]);

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  
  const getStudiedText = (word, studiedLanguage = 'русский') => {
    if (!word) return '—';
    if (word.displayWord) return word.displayWord;
    if (word.translations) {
      const preferred = studiedLanguage.toLowerCase();
      const possibleKeys = [
        preferred,
        preferred.charAt(0).toUpperCase() + preferred.slice(1),
        'russian', 'english', 'turkish',
        'русский', 'английский', 'турецкий'
      ];
      for (const key of possibleKeys) {
        if (word.translations[key]) return word.translations[key];
      }
      const values = Object.values(word.translations);
      if (values.length > 0) return values[0];
    }
    if (word.word) return word.word;
    return '—';
  };

  const getHintText = (word, hintLanguage = 'english') => {
    if (!word || !word.translations) return '—';
    const translations = word.translations;
    if (hintLanguage && translations[hintLanguage]) {
      return translations[hintLanguage];
    }
    const hintKeys = ['английский', 'english', 'Английский'];
    for (const key of hintKeys) {
      if (translations[key]) return translations[key];
    }
    return Object.values(translations)[1] || Object.values(translations)[0] || '—';
  };

  const getDisplayTextForSpecialWords = (word, database) => {
    if (!word) return '';
    const lang = studiedLanguage || 'русский';
    const possibleKeys = [
      lang,
      lang.toLowerCase(),
      lang.toUpperCase(),
      'русский', 'Русский', 'russian', 'Russian'
    ];
    for (const key of possibleKeys) {
      if (word[key] && typeof word[key] === 'string' && word[key].trim() !== '') {
        return word[key];
      }
      if (word[key] && (typeof word[key] === 'number' || typeof word[key] === 'boolean')) {
        return String(word[key]);
      }
    }
    for (const key in word) {
      if (key !== 'Картинка' && word[key]) {
        if (typeof word[key] === 'string' && word[key].trim() !== '') {
          return word[key];
        }
        if (typeof word[key] === 'number' || typeof word[key] === 'boolean') {
          return String(word[key]);
        }
      }
    }
    return '';
  };

  const getHintForSpecialWords = (word, database) => {
    if (database === 'prepositions') {
      return word['Английский'] || word['english'] || '';
    } else if (database === 'question-words') {
      return word['Английский'] || word['english'] || '';
    }
    return '';
  };

  // ========== ФУНКЦИЯ ПРИМЕНЕНИЯ ФИЛЬТРОВ ==========
  const applyFiltersToWord = async (word, database, filters = {}, studiedLanguage = 'русский') => {
    const { number, gender, case: caseType } = filters || {};
    
    const langMap = {
      'русский': ['русский', 'russian'],
      'russian': ['russian', 'русский'],
      'английский': ['английский', 'english', 'English'],
      'english': ['english', 'английский', 'Английский'],
      'турецкий': ['турецкий', 'turkish', 'Турецкий'],
      'turkish': ['turkish', 'турецкий', 'Turkish'],
      'испанский': ['испанский', 'spanish', 'Spanish'],
      'spanish': ['spanish', 'испанский', 'Испанский'],
      'немецкий': ['немецкий', 'german', 'German'],
      'german': ['german', 'немецкий', 'Немецкий'],
      'французский': ['французский', 'french', 'French'],
      'french': ['french', 'французский', 'Французский'],
      'итальянский': ['итальянский', 'italian', 'Italian'],
      'italian': ['italian', 'итальянский', 'Итальянский'],
      'китайский': ['китайский', 'chinese', 'Chinese'],
      'chinese': ['chinese', 'китайский', 'Китайский'],
      'японский': ['японский', 'japanese', 'Japanese'],
      'japanese': ['japanese', 'японский', 'Японский'],
      'корейский': ['корейский', 'korean', 'Korean'],
      'korean': ['korean', 'корейский', 'Корейский'],
      'арабский': ['арабский', 'arabic', 'Arabic'],
      'arabic': ['arabic', 'арабский', 'Арабский']
    };
    
    const langKey = (studiedLanguage || 'русский').toLowerCase();
    const langCandidates = (langMap[langKey] || [langKey]).map(l => l.toLowerCase());
    
    const pickFromForms = (suffixes = [], fallbackSuffixes = []) => {
      if (!word.forms) return null;
      for (const lang of langCandidates) {
        for (const s of suffixes) {
          const key = (s ? `${lang}_${s}` : lang).toLowerCase();
          if (word.forms[key] && word.forms[key].trim() !== '') {
            return word.forms[key];
          }
        }
        for (const s of fallbackSuffixes) {
          const key = (s ? `${lang}_${s}` : lang).toLowerCase();
          if (word.forms[key] && word.forms[key].trim() !== '') {
            return word.forms[key];
          }
        }
      }
      return null;
    };

    // Для прилагательных
    if (database === 'adjectives' && caseType) {
      try {
        const langConfig = getAdjectiveLanguageConfig(studiedLanguage);
        if (langConfig.hasCases) {
          const response = await fetch(`${API_BASE_URL}/adjective-cases/${word.imageBase}`);
          if (response.ok) {
            const caseData = await response.json();
            if (caseData && (caseData.singular || caseData.plural)) {
              const caseMapping = {
                'именительный': 'nominative',
                'родительный': 'genitive', 
                'дательный': 'dative',
                'винительный': 'accusative',
                'творительный': 'instrumental',
                'предложный': 'prepositional'
              };
              const caseKey = caseMapping[caseType] || 'nominative';
              if (number && (number === 'множественное' || number === 'plural')) {
                if (caseData.plural && caseData.plural[caseKey]) {
                  return { ...word, displayWord: caseData.plural[caseKey] };
                }
              } else {
                const genderMapping = {
                  'мужской': 'masculine',
                  'женский': 'feminine',
                  'средний': 'neuter'
                };
                const genderKey = genderMapping[gender] || 'masculine';
                if (caseData.singular && caseData.singular[genderKey] && caseData.singular[genderKey][caseKey] !== undefined) {
                  const displayWord = caseData.singular[genderKey][caseKey];
                  if (displayWord && displayWord.trim() !== '') {
                    return { ...word, displayWord: displayWord };
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading adjective cases:', error);
      }
    }

    if (database === 'adjectives') {
      const langConfig = getAdjectiveLanguageConfig(studiedLanguage);
      if (number && (number === 'множественное' || number === 'plural')) {
        if (word.forms) {
          const studiedLangLower = studiedLanguage.toLowerCase();
          const pluralKeys = [
            `${studiedLangLower}_plural`,
            `${studiedLangLower}_множественное`,
            `plural_${studiedLangLower}`,
            `множественное_${studiedLangLower}`,
            'plural', 'множественное'
          ];
          for (const key of pluralKeys) {
            if (word.forms[key] && word.forms[key].trim() !== '') {
              return { ...word, displayWord: word.forms[key] };
            }
          }
        }
      }
      if (gender && langConfig.hasGender) {
        const genderMap = {
          'мужской': 'masculine',
          'женский': 'feminine',
          'средний': 'neuter'
        };
        const genderKey = genderMap[gender];
        if (genderKey && word.forms) {
          const studiedLangLower = studiedLanguage.toLowerCase();
          const genderFormKey = `${studiedLangLower}_${genderKey}`;
          if (word.forms[genderFormKey] && word.forms[genderFormKey].trim() !== '') {
            return { ...word, displayWord: word.forms[genderFormKey] };
          }
        }
      }
      const baseForm = word.translations?.[studiedLanguage.toLowerCase()] || word.translations?.russian || word.word || '—';
      return { ...word, displayWord: baseForm };
    }

    // Для причастий
    if (database === 'participles') {
      const targetLanguage = studiedLanguage || 'русский';
      if (word.translations) {
        const translationKey = targetLanguage === 'русский' ? 'russian' :
                              targetLanguage === 'английский' ? 'english' :
                              targetLanguage === 'турецкий' ? 'turkish' : targetLanguage;
        if (word.translations[translationKey]) {
          return { ...word, displayWord: word.translations[translationKey] };
        }
      }
      if (filters.case || filters.number || filters.gender) {
        try {
          const response = await fetch(`${API_BASE_URL}/participle-cases/${word.imageBase}`);
          if (response.ok) {
            const caseData = await response.json();
            if (caseData && (caseData.singular || caseData.plural)) {
              const caseMapping = {
                'именительный': 'nominative',
                'родительный': 'genitive', 
                'дательный': 'dative',
                'винительный': 'accusative',
                'творительный': 'instrumental',
                'предложный': 'prepositional'
              };
              const caseKey = filters.case ? caseMapping[filters.case] : 'nominative';
              if (filters.number && (filters.number === 'множественное' || filters.number === 'plural')) {
                if (caseData.plural && caseData.plural[caseKey]) {
                  return { ...word, displayWord: caseData.plural[caseKey] };
                }
              } else {
                const genderMapping = {
                  'мужской': 'masculine',
                  'женский': 'feminine',
                  'средний': 'neuter'
                };
                const genderKey = filters.gender ? genderMapping[filters.gender] : 'masculine';
                if (caseData.singular && caseData.singular[genderKey] && caseData.singular[genderKey][caseKey]) {
                  return { ...word, displayWord: caseData.singular[genderKey][caseKey] };
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading participle cases:', error);
        }
      }
      const langInTable = targetLanguage === 'русский' ? 'Русский' : 
                          targetLanguage === 'английский' ? 'Английский' :
                          targetLanguage === 'турецкий' ? 'Турецкий' : 
                          targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);
      const baseFormField = `База причастия базовая форма ${langInTable}`;
      if (word[baseFormField]) {
        return { ...word, displayWord: word[baseFormField] };
      }
      const fallback = word['База причастия базовая форма Русский'] || word.translations?.russian || word.word || '—';
      return { ...word, displayWord: fallback };
    }

    // Для числительных
    if (database === 'numerals' && caseType) {
      try {
        const response = await fetch(`${API_BASE_URL}/numeral-cases/${word.imageBase}`);
        if (response.ok) {
          const caseData = await response.json();
          if (caseData && caseData.cases) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = caseMapping[caseType];
            if (caseData.cases[caseKey]) {
              const displayWord = caseData.cases[caseKey];
              if (caseType === 'предложный' && caseData.prepositionalWithPreposition) {
                return { ...word, displayWord: caseData.prepositionalWithPreposition };
              }
              return { ...word, displayWord: displayWord };
            }
          }
        }
      } catch (error) {
        console.error('Error loading numeral cases:', error);
      }
    }

    // Для вопросительных слов
    if (database === 'question-words' && caseType) {
      try {
        const imageBase = `question_word_${(word['Русский'] || '').toLowerCase()}`;
        const response = await fetch(`${API_BASE_URL}/question-word-cases/${imageBase}`);
        if (response.ok) {
          const caseData = await response.json();
          if (caseData && (caseData.singular || caseData.plural)) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = caseMapping[caseType];
            if (number && (number === 'множественное' || number === 'plural')) {
              if (caseData.plural && caseData.plural[caseKey]) {
                return { ...word, displayWord: caseData.plural[caseKey] };
              }
            } else {
              const genderMapping = {
                'мужской': 'masculine',
                'женский': 'feminine',
                'средний': 'neuter'
              };
              const genderKey = genderMapping[gender] || 'masculine';
              if (caseData.singular && caseData.singular[genderKey] && caseData.singular[genderKey][caseKey]) {
                return { ...word, displayWord: caseData.singular[genderKey][caseKey] };
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading question word cases:', error);
      }
    }

    // Для местоимений
    if (database === 'pronouns') {
      try {
        const imageBase = word['База изображение'];
        const response = await fetch(`${API_BASE_URL}/pronoun-declensions/${imageBase}`);
        if (response.ok) {
          const declensions = await response.json();
          if (declensions && declensions.declensions) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = filters.case ? caseMapping[filters.case] : 'nominative';
            const personVal = filters.person?.toString().trim();
            const numberVal = filters.number?.toString().trim().toLowerCase();
            const genderVal = filters.gender?.toString().trim().toLowerCase();
            
            let columnKey = '';
            if (personVal === '1') {
              if (numberVal === 'ед' || numberVal === 'единственное') columnKey = '1л_ед';
              else if (numberVal === 'мн' || numberVal === 'множественное') columnKey = '1л_мн';
            } else if (personVal === '2') {
              if (numberVal === 'ед' || numberVal === 'единственное') columnKey = '2л_ед';
              else if (numberVal === 'мн' || numberVal === 'множественное') columnKey = '2л_мн';
            } else if (personVal === '3') {
              if (numberVal === 'мн' || numberVal === 'множественное') columnKey = '3л_мн';
              else if (numberVal === 'ед' || numberVal === 'единственное') {
                if (genderVal === 'мужской') columnKey = '3л_ед_м';
                else if (genderVal === 'женский') columnKey = '3л_ед_ж';
                else if (genderVal === 'средний') columnKey = '3л_ед_с';
                else columnKey = '3л_ед_м';
              }
            }
            
            if (caseKey && columnKey && declensions.declensions[caseKey] && declensions.declensions[caseKey][columnKey]) {
              const displayWord = declensions.declensions[caseKey][columnKey];
              return { ...word, displayWord: displayWord, declensions: declensions };
            }
          }
        }
      } catch (error) {
        console.error('Error loading pronoun declensions:', error);
      }
      const baseForm = word['Русский'] || word.translations?.russian || word.word || '—';
      return { ...word, displayWord: baseForm };
    }

    // Для существительных
    if (database === 'nouns') {
      if (filters.gender) {
        try {
          const genderResponse = await fetch(`${API_BASE_URL}/noun-gender/${word.imageBase}`);
          if (genderResponse.ok) {
            const genderData = await genderResponse.json();
            if (genderData.gender && genderData.gender !== filters.gender) {
              return null;
            }
          }
        } catch (error) {
          console.error('Error checking noun gender:', error);
        }
      }
      if (caseType) {
        try {
          const response = await fetch(`${API_BASE_URL}/noun-cases/${word.imageBase}`);
          if (response.ok) {
            const caseData = await response.json();
            if (caseData) {
              const caseMapping = {
                'именительный': 'nominative',
                'родительный': 'genitive', 
                'дательный': 'dative',
                'винительный': 'accusative',
                'творительный': 'instrumental',
                'предложный': 'prepositional'
              };
              const caseKey = caseMapping[caseType];
              if (number && (number === 'множественное' || number === 'plural')) {
                if (caseData.plural && caseData.plural[caseKey]) {
                  return { ...word, displayWord: caseData.plural[caseKey] };
                }
              } else {
                if (caseData.singular && caseData.singular[caseKey]) {
                  return { ...word, displayWord: caseData.singular[caseKey] };
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading noun cases:', error);
        }
      }
      if (number && (number === 'множественное' || number === 'plural')) {
        const plural = pickFromForms(['plural', 'множественное'], ['word']);
        if (plural) return { ...word, displayWord: plural };
      } else {
        const singular = pickFromForms(['singular', 'единственное', 'word'], ['']);
        if (singular) return { ...word, displayWord: singular };
      }
    }

    // Для глаголов
    if (database === 'verbs') {
      try {
        const response = await fetch(`${API_BASE_URL}/verb-conjugation/${word.imageBase}`);
        if (response.ok) {
          const conjugation = await response.json();
          const studiedLangLower = (studiedLanguage || 'русский').toLowerCase();
          let infinitive = '';
          if (word.translations) {
            infinitive = word.translations[studiedLangLower] || 
                        word.translations[studiedLangLower.charAt(0).toUpperCase() + studiedLangLower.slice(1)] ||
                        word.translations.russian ||
                        word.translations.english ||
                        word.translations.turkish ||
                        word.word || '';
          } else {
            infinitive = word[studiedLangLower.charAt(0).toUpperCase() + studiedLangLower.slice(1)] || 
                        word[studiedLangLower] ||
                        word['Русский'] ||
                        word['Инфинитив'] ||
                        word.word || '';
          }
          if (filters.tense && conjugation) {
            let displayWord = infinitive;
            if (filters.tense === 'present') {
              const personKey = filters.person || 'он';
              displayWord = conjugation.present?.[personKey] || infinitive;
            } else if (filters.tense === 'past') {
              if (filters.person === 'я' || filters.person === 'ты') {
                const genderKey = filters.verbGender === 'feminine' ? 'ж' : 
                                 filters.verbGender === 'neuter' ? 'с' : 'м';
                const key = `${filters.person}_${genderKey}`;
                displayWord = conjugation.past?.[key] || infinitive;
              } else {
                displayWord = conjugation.past?.[filters.person || 'он'] || infinitive;
              }
            } else if (filters.tense === 'future') {
              const personKey = filters.person || 'он';
              displayWord = conjugation.future?.[personKey] || infinitive;
            } else if (filters.tense === 'imperative') {
              const imperativeKey = filters.imperativeForm || 'ты';
              displayWord = conjugation.imperative?.[imperativeKey] || infinitive;
            }
            return { ...word, displayWord: displayWord, conjugation: conjugation };
          }
          return { ...word, displayWord: infinitive, conjugation: conjugation };
        }
      } catch (error) {
        console.error('Error loading verb conjugation:', error);
      }
      const studiedLangLower = (studiedLanguage || 'русский').toLowerCase();
      let translation = '';
      if (word.translations) {
        translation = word.translations[studiedLangLower] || 
                      word.translations[studiedLangLower.charAt(0).toUpperCase() + studiedLangLower.slice(1)] ||
                      word.translations.russian ||
                      word.translations.english ||
                      word.translations.turkish ||
                      word.word || '—';
      } else {
        translation = word[studiedLangLower.charAt(0).toUpperCase() + studiedLangLower.slice(1)] || 
                      word[studiedLangLower] ||
                      word['Русский'] ||
                      word['Инфинитив'] ||
                      word.word || '—';
      }
      return { ...word, displayWord: translation };
    }

    const fallback = getStudiedText(word, studiedLanguage);
    return { ...word, displayWord: fallback };
  };

  // ========== ОБРАБОТЧИК ВЫБОРА СЛОВА ==========
  const handleWordClick = async (word) => {
    let chosen;
    
    if (database === 'verbs') {
      const infinitive = word['Инфинитив'] || word.translations?.russian || word.russian || '';
      const englishWord = word['Английский'] || word.english || word.translations?.english || '';
      const turkishWord = word['Турецкий'] || word.turkish || word.translations?.turkish || '';
      
      let conjugation = null;
      let displayWord = infinitive;
      
      const translations = {
        russian: infinitive,
        english: englishWord,
        turkish: turkishWord,
        русский: infinitive,
        английский: englishWord,
        турецкий: turkishWord
      };
      
      try {
        const response = await fetch(`${API_BASE_URL}/verb-conjugation/${word.imageBase}`);
        if (response.ok) {
          conjugation = await response.json();
          if (tense && conjugation) {
            if (tense === 'present') {
              const personKey = person || 'он';
              displayWord = conjugation.present?.[personKey] || displayWord;
            } else if (tense === 'past') {
              if (person === 'я' || person === 'ты') {
                const genderKey = verbGender === 'feminine' ? 'ж' : verbGender === 'neuter' ? 'с' : 'м';
                const key = `${person}_${genderKey}`;
                displayWord = conjugation.past?.[key] || displayWord;
              } else {
                displayWord = conjugation.past?.[person || 'он'] || displayWord;
              }
            } else if (tense === 'future') {
              const personKey = person || 'он';
              displayWord = conjugation.future?.[personKey] || displayWord;
            } else if (tense === 'imperative') {
              const imperativeKey = imperativeForm || 'ты';
              displayWord = conjugation.imperative?.[imperativeKey] || displayWord;
            }
          }
        }
      } catch (error) {
        console.error('Error loading conjugation:', error);
      }
      
      chosen = {
        imageBase: word.imageBase,
        imagePng: word.imagePng || word['Картинка png'] || word['Картинка'] || '',
        word: displayWord,
        displayWord: displayWord,
        infinitive: infinitive,
        translations: translations,
        conjugation: conjugation,
        selectedForm: tense ? { tense, person, gender: verbGender, imperativeForm } : null,
        database: 'verbs',
        russian: infinitive,
        english: englishWord,
        turkish: turkishWord,
        sourceDatabase: 'nouns'
      };
    }
    else if (database === 'prepositions') {
      const displayWord = getDisplayTextForSpecialWords(word, database);
      const translations = {};
      Object.keys(word).forEach(key => {
        if (key !== 'Картинка' && word[key] && word[key].trim() !== '') {
          const langKey = key.toLowerCase();
          translations[langKey] = word[key];
        }
      });
      const imageUrl = word['Картинка'] || '';
      chosen = {
        id: `preposition_${Date.now()}_${Math.random()}`,
        imageBase: `preposition_${Date.now()}`,
        imagePng: imageUrl,
        word: displayWord,
        displayWord: displayWord,
        translations: translations,
        isSpecialWord: true,
        database: 'prepositions',
        originalImage: imageUrl,
        originalData: word
      };
    }
    else if (database === 'participles') {
      const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
      chosen = {
        ...filteredWord,
        displayWord: filteredWord.displayWord || getStudiedText(filteredWord, studiedLanguage),
        database: 'participles'
      };
    }
    else if (database === 'numerals') {
      const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
      chosen = {
        ...filteredWord,
        displayWord: filteredWord.displayWord || getStudiedText(filteredWord, studiedLanguage),
        database: 'numerals'
      };
    }
    else if (database === 'question-words') {
      const russianWord = word['Русский'] || word.russian || '';
      const englishWord = word['Английский'] || word.english || '';
      const turkishWord = word['Турецкий'] || word.turkish || '';
      const imageUrl = word['Картинка'] || word.imageUrl || '';
      const displayWord = word.displayWord || russianWord;
      
      chosen = {
        id: `question_word_${russianWord.toLowerCase()}_${Date.now()}`,
        imageBase: `question_word_${russianWord.toLowerCase()}`,
        imagePng: imageUrl,
        word: displayWord,
        displayWord: displayWord,
        translations: {
          russian: russianWord,
          english: englishWord,
          turkish: turkishWord,
          русский: russianWord,
          английский: englishWord,
          турецкий: turkishWord
        },
        isSpecialWord: true,
        database: 'question-words',
        hasFilters: word.hasFilters || false,
        appliedFilters: word.filters || null,
        baseForm: russianWord,
        originalData: word
      };
    }
    else if (database === 'gerunds') {
      const imageBase = word['База изображение'] || word.imageBase;
      const russianWord = word['Русский'] || word.russian || word.translations?.russian || '';
      const englishWord = word['Английский'] || word.english || word.translations?.english || '';
      const turkishWord = word['Турецкий'] || word.turkish || word.translations?.turkish || '';
      
      const translations = {
        russian: russianWord,
        english: englishWord,
        turkish: turkishWord,
        русский: russianWord,
        английский: englishWord,
        турецкий: turkishWord
      };
      
      chosen = {
        imageBase: imageBase,
        imagePng: word.imagePng || word['Картинка png'] || word['Картинка'] || '', 
        word: russianWord,
        displayWord: russianWord,
        baseForm: russianWord,
        translations: translations,
        russian: russianWord,
        english: englishWord,
        turkish: turkishWord,
        database: 'gerunds',
        originalData: word
      };
    }
    else if (database === 'nouns') {
      const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
      chosen = {
        ...filteredWord,
        displayWord: filteredWord.displayWord || getStudiedText(filteredWord, studiedLanguage),
        database: 'nouns'
      };
    }
    else if (database === 'adjectives') {
      const baseForm = word.translations?.russian || word.translations?.русский || word.word || '—';
      const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
      let cases = null;
      try {
        const response = await fetch(`${API_BASE_URL}/adjective-cases/${word.imageBase}`);
        if (response.ok) {
          cases = await response.json();
        }
      } catch (error) {
        console.error('Error loading cases for preview:', error);
      }
      chosen = {
        ...filteredWord,
        imageBase: word.imageBase,
        imagePng: word.imagePng || '',
        word: filteredWord.displayWord || baseForm,
        displayWord: filteredWord.displayWord || baseForm,
        baseForm: baseForm,
        translations: word.translations || {},
        forms: word.forms || {},
        cases: cases,
        selectedForm: memoizedFilters.case || memoizedFilters.gender || memoizedFilters.number ? {
          number: memoizedFilters.number,
          gender: memoizedFilters.gender,
          case: memoizedFilters.case
        } : null,
        database: 'adjectives'
      };
    }
    else if (database === 'adverbs') {
      const russianWord = word['Русский'] || word.russian || word.translations?.russian || '';
      const englishWord = word['Английский'] || word.english || word.translations?.english || '';
      const turkishWord = word['Турецкий'] || word.turkish || word.translations?.turkish || '';
      
      const studiedLangLower = (studiedLanguage || 'русский').toLowerCase();
      let displayWord = '';
      if (studiedLangLower === 'русский' || studiedLangLower === 'russian') {
        displayWord = russianWord;
      } else if (studiedLangLower === 'английский' || studiedLangLower === 'english') {
        displayWord = englishWord;
      } else if (studiedLangLower === 'турецкий' || studiedLangLower === 'turkish') {
        displayWord = turkishWord;
      } else {
        displayWord = russianWord;
      }
      
      const translations = {};
      Object.keys(word).forEach(key => {
        if (key !== 'Картинка' && key !== 'База изображение' && key !== 'Картинка png' &&
            key !== 'Уровень изучения номер' && key !== 'Урок номер' && key !== 'Урок название' &&
            word[key] !== undefined && word[key] !== null) {
          if (typeof word[key] === 'string' && word[key].trim() !== '') {
            const langKey = key.toLowerCase();
            translations[langKey] = word[key];
          } else if (typeof word[key] === 'number' || typeof word[key] === 'boolean') {
            const langKey = key.toLowerCase();
            translations[langKey] = String(word[key]);
          }
        }
      });
      
      const imageBase = word['База изображение'] || word.imageBase || `adverb_${Date.now()}`;
      const imagePng = word.imagePng || word['Картинка png'] || word['Картинка'] || ''
      
      chosen = {
        imageBase: imageBase,
        imagePng: imagePng,
        word: displayWord,
        displayWord: displayWord,
        baseForm: russianWord,
        translations: translations,
        russian: russianWord,
        english: englishWord,
        turkish: turkishWord,
        database: 'adverbs',
        originalData: word
      };
    }
    else if (database === 'pronouns') {
      const filteredWord = await applyFiltersToWord(word, database, memoizedFilters, studiedLanguage);
      chosen = {
        ...filteredWord,
        word: filteredWord.displayWord || filteredWord.word || getStudiedText(filteredWord, studiedLanguage),
        displayWord: filteredWord.displayWord || getStudiedText(filteredWord, studiedLanguage),
        database: 'pronouns',
        selectedForm: filteredWord.selectedForm || {
          person: memoizedFilters.person,
          number: memoizedFilters.number,
          gender: memoizedFilters.gender,
          case: memoizedFilters.case
        }
      };
    }
    else {
      const translations = {};
      Object.keys(word).forEach(key => {
        if (key !== 'Картинка' && word[key] && word[key].trim() !== '') {
          const langKey = key.toLowerCase();
          translations[langKey] = word[key];
        }
      });
      chosen = {
        id: `word_${Date.now()}_${Math.random()}`,
        imageBase: word['База изображение'] || `word_${Date.now()}`,
        imagePng: word['Картинка png'] || word['Картинка'] || '',
        word: getStudiedText(word, studiedLanguage),
        displayWord: getStudiedText(word, studiedLanguage),
        translations: translations,
        database: database
      };
    }
    
    if (onWordSelect) {
      onWordSelect(chosen);
    }
  };

  // ========== ФУНКЦИИ РЕНДЕРИНГА (без хуков внутри) ==========
  
 const renderPronounsList = () => {
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {pronouns.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Местоимения не найдены</div>
      ) : (
        pronouns.map((pronoun, index) => {
          const imageBase = pronoun['База изображение'];
          const baseForm = pronoun['Русский'] || '—';
          const decl = pronounDeclensions[imageBase];
          
          let displayWord = baseForm;
          if (decl && decl.declensions) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = filters.case ? caseMapping[filters.case] : 'nominative';
            const personVal = filters.person?.toString().trim();
            const numberVal = filters.number?.toString().trim().toLowerCase();
            const genderVal = filters.gender?.toString().trim().toLowerCase();
            
            let columnKey = '';
            if (personVal === '1') {
              if (numberVal === 'ед' || numberVal === 'единственное') columnKey = '1л_ед';
              else if (numberVal === 'мн' || numberVal === 'множественное') columnKey = '1л_мн';
            } else if (personVal === '2') {
              if (numberVal === 'ед' || numberVal === 'единственное') columnKey = '2л_ед';
              else if (numberVal === 'мн' || numberVal === 'множественное') columnKey = '2л_мн';
            } else if (personVal === '3') {
              if (numberVal === 'мн' || numberVal === 'множественное') columnKey = '3л_мн';
              else if (numberVal === 'ед' || numberVal === 'единственное') {
                if (genderVal === 'мужской') columnKey = '3л_ед_м';
                else if (genderVal === 'женский') columnKey = '3л_ед_ж';
                else if (genderVal === 'средний') columnKey = '3л_ед_с';
                else columnKey = '3л_ед_м';
              }
            }
            
            if (caseKey && columnKey && decl.declensions[caseKey] && decl.declensions[caseKey][columnKey]) {
              displayWord = decl.declensions[caseKey][columnKey];
            }
          }
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return swId === imageBase && swDatabase === 'pronouns';
              });
            }
            if (selectedWord) {
              const swId = selectedWord.imageBase || selectedWord.id;
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return swId === imageBase && swDatabase === 'pronouns';
            }
            return false;
          })();
          
          const translations = {};
          Object.keys(pronoun).forEach(key => {
            if (key === 'Русский') translations['russian'] = pronoun[key];
            if (key === 'Английский') translations['english'] = pronoun[key];
            if (key === 'Турецкий') translations['turkish'] = pronoun[key];
          });
          
          return (
            <div
              key={`pronoun_${index}_${imageBase}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                let currentDeclensions = decl;
                if (!currentDeclensions) {
                  fetch(`${API_BASE_URL}/pronoun-declensions/${imageBase}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => { if (data) currentDeclensions = data; })
                    .catch(console.error);
                }
                const pronounObject = {
                  imageBase: imageBase,
                  imagePng: pronoun['Картинка'] || '',
                  word: displayWord,
                  displayWord: displayWord,
                  baseForm: baseForm,
                  translations: translations,
                  declensions: currentDeclensions,
                  selectedForm: (filters.person || filters.number || filters.gender || filters.case) ? {
                    person: filters.person,
                    number: filters.number,
                    gender: filters.gender,
                    case: filters.case
                  } : null,
                  database: 'pronouns'
                };
                handleWordClick(pronounObject);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                <div className="text-sm text-gray-500 truncate">en: {pronoun['Английский'] || '—'}</div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'pronouns');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {pronoun['Картинка'] && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={pronoun['Картинка']} alt={baseForm} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

  const renderNumeralsList = () => {
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {numerals.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          {theme ? 'Числительные не найдены для выбранной темы' : 'Числительные не найдены'}
        </div>
      ) : (
        numerals.filter(numeral => {
          if (theme && numeral['Урок название'] && numeral['Урок название'] !== theme) return false;
          return true;
        }).map((numeral, index) => {
          const imageBase = numeral['База изображение'];
          const baseForm = numeral['Русский'] || '—';
          const cases = numeralCases[imageBase];
          
          let displayWord = baseForm;
          if (cases && cases.cases && filters.case) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = caseMapping[filters.case];
            if (cases.cases[caseKey]) {
              displayWord = cases.cases[caseKey];
              if (filters.case === 'предложный' && cases.prepositionalWithPreposition) {
                displayWord = cases.prepositionalWithPreposition;
              }
            }
          }
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => (sw.imageBase || sw.id) === imageBase);
            }
            if (selectedWord) {
              return (selectedWord.imageBase || selectedWord.id) === imageBase;
            }
            return false;
          })();
          
          const translations = {};
          Object.keys(numeral).forEach(key => {
            if (key === 'Русский') translations['russian'] = numeral[key];
            if (key === 'Английский') translations['english'] = numeral[key];
            if (key === 'Турецкий') translations['turkish'] = numeral[key];
          });
          
          return (
            <div
              key={`numeral_${index}_${imageBase}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                let numeralCases = null;
                fetch(`${API_BASE_URL}/numeral-cases/${imageBase}`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => { if (data) numeralCases = data; })
                  .catch(console.error);
                
                let finalDisplayWord = baseForm;
                if (numeralCases && numeralCases.cases && filters.case) {
                  const caseMapping = {
                    'именительный': 'nominative',
                    'родительный': 'genitive', 
                    'дательный': 'dative',
                    'винительный': 'accusative',
                    'творительный': 'instrumental',
                    'предложный': 'prepositional'
                  };
                  const caseKey = caseMapping[filters.case];
                  if (numeralCases.cases[caseKey]) {
                    finalDisplayWord = numeralCases.cases[caseKey];
                    if (filters.case === 'предложный' && numeralCases.prepositionalWithPreposition) {
                      finalDisplayWord = numeralCases.prepositionalWithPreposition;
                    }
                  }
                }
                
                const numeralObject = {
                  imageBase: imageBase,
                  imagePng: numeral['Картинка'] || '',
                  word: finalDisplayWord,
                  displayWord: finalDisplayWord,
                  baseForm: baseForm,
                  translations: translations,
                  cases: numeralCases,
                  selectedForm: filters.case ? { case: filters.case } : null,
                  database: 'numerals'
                };
                handleWordClick(numeralObject);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                <div className="text-sm text-gray-500 truncate">en: {numeral['Английский'] || '—'}</div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'numerals');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {numeral['Картинка'] && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={numeral['Картинка']} alt={baseForm} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

  const renderAdverbsList = () => {
  const filteredAdverbs = adverbs.filter(adverb => {
    if (!theme) return false;
    let currentTheme = null;
    for (const a of adverbs) {
      if (a['Урок название'] && a['Урок название'].trim() !== '') {
        currentTheme = a['Урок название'];
      }
      if (a === adverb) return currentTheme === theme;
    }
    return false;
  }).filter(adverb => adverb['База изображение']);
  
  const getDisplayText = (adverb) => {
    if (!adverb) return '';
    const lang = studiedLanguage || 'русский';
    const possibleKeys = [
      lang, lang.toLowerCase(), lang.toUpperCase(),
      lang === 'русский' ? 'Русский' : lang === 'russian' ? 'Русский' :
      lang === 'английский' ? 'Английский' : lang === 'english' ? 'Английский' :
      lang === 'турецкий' ? 'Турецкий' : lang === 'turkish' ? 'Турецкий' : lang
    ];
    for (const key of possibleKeys) {
      if (adverb[key] && typeof adverb[key] === 'string' && adverb[key].trim() !== '') {
        return adverb[key];
      }
    }
    if (adverb.translations) {
      for (const key of possibleKeys) {
        const lowerKey = key.toLowerCase();
        if (adverb.translations[lowerKey]) return adverb.translations[lowerKey];
      }
    }
    for (const key in adverb) {
      if (key !== 'Картинка' && key !== 'База изображение' && key !== 'Картинка png' &&
          key !== 'Уровень изучения номер' && key !== 'Урок номер' && key !== 'Урок название' &&
          adverb[key] && typeof adverb[key] === 'string' && adverb[key].trim() !== '') {
        return adverb[key];
      }
    }
    return '';
  };
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {!theme ? (
        <div className="text-center text-gray-500 py-4">Сначала выберите урок</div>
      ) : filteredAdverbs.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Наречия не найдены для выбранной темы</div>
      ) : (
        filteredAdverbs.map((adverb, index) => {
          const imageBase = adverb['База изображение'];
          const displayWord = getDisplayText(adverb);
          const russianWord = adverb['Русский'] || adverb.translations?.russian || '';
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return swId === imageBase && swDatabase === 'adverbs';
              });
            }
            if (selectedWord) {
              const swId = selectedWord.imageBase || selectedWord.id;
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return swId === imageBase && swDatabase === 'adverbs';
            }
            return false;
          })();
          
          const translations = {};
          Object.keys(adverb).forEach(key => {
            if (key === 'Русский') translations['russian'] = adverb[key];
            if (key === 'Английский') translations['english'] = adverb[key];
            if (key === 'Турецкий') translations['turkish'] = adverb[key];
            if (key !== 'Уровень изучения номер' && key !== 'Урок номер' && key !== 'Урок название' &&
                key !== 'База изображение' && key !== 'Картинка' && key !== 'Картинка png' &&
                key !== 'Русский' && key !== 'Английский' && key !== 'Турецкий') {
              translations[key.toLowerCase()] = adverb[key];
            }
          });
          
          return (
            <div
              key={`adverb_${index}_${imageBase}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                const adverbObject = {
                  imageBase: imageBase,
                  imagePng: adverb['Картинка png'] || adverb['Картинка'] || '',
                  word: displayWord,
                  displayWord: displayWord,
                  baseForm: russianWord,
                  translations: translations,
                  russian: russianWord,
                  english: adverb['Английский'] || '',
                  turkish: adverb['Турецкий'] || '',
                  database: 'adverbs',
                  originalData: adverb
                };
                handleWordClick(adverbObject);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{russianWord}</div>
                <div className="text-sm text-gray-500 truncate space-x-2">
                  {adverb['Английский'] && <span>en: {adverb['Английский']}</span>}
                  {adverb['Турецкий'] && <span className="ml-2">tr: {adverb['Турецкий']}</span>}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'adverbs');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {(adverb['Картинка png'] || adverb['Картинка']) && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={adverb['Картинка png'] || adverb['Картинка']} alt={russianWord} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

const renderVerbsList = () => {
  const filteredVerbs = verbs.filter(verb => {
    if (!theme) return false;
    let currentTheme = null;
    for (const v of verbs) {
      if (v['Урок название'] && v['Урок название'].trim() !== '') {
        currentTheme = v['Урок название'];
      }
      if (v === verb) return currentTheme === theme;
    }
    return false;
  }).filter(verb => verb['База изображение']);
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {filteredVerbs.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          {theme ? 'Глаголы не найдены для выбранной темы' : 'Глаголы не найдены'}
        </div>
      ) : (
        filteredVerbs.map((verb, index) => {
          const imageBase = verb['База изображение'];
          const infinitive = verb['Инфинитив'] || '';
          const englishTranslation = verb['Английский'] || '';
          const turkishTranslation = verb['Турецкий'] || '';
          const conjugation = verbConjugations[imageBase];
          
          let displayWord = infinitive;
          if (conjugation && filters.tense) {
            if (filters.tense === 'present') {
              const personKey = filters.person || 'он';
              displayWord = conjugation.present?.[personKey] || infinitive;
            } else if (filters.tense === 'past') {
              if (filters.person === 'я' || filters.person === 'ты') {
                const genderKey = filters.verbGender === 'feminine' ? 'ж' : filters.verbGender === 'neuter' ? 'с' : 'м';
                const key = `${filters.person}_${genderKey}`;
                displayWord = conjugation.past?.[key] || infinitive;
              } else {
                displayWord = conjugation.past?.[filters.person || 'он'] || infinitive;
              }
            } else if (filters.tense === 'future') {
              const personKey = filters.person || 'он';
              displayWord = conjugation.future?.[personKey] || infinitive;
            } else if (filters.tense === 'imperative') {
              const imperativeKey = filters.imperativeForm || 'ты';
              displayWord = conjugation.imperative?.[imperativeKey] || infinitive;
            }
          }
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return swId === imageBase && swDatabase === 'verbs';
              });
            }
            if (selectedWord) {
              const swId = selectedWord.imageBase || selectedWord.id;
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return swId === imageBase && swDatabase === 'verbs';
            }
            return false;
          })();
          
          const translations = {};
          Object.keys(verb).forEach(key => {
            if (key === 'Инфинитив') translations['russian'] = verb[key];
            if (key === 'Английский') translations['english'] = verb[key];
            if (key === 'Турецкий') translations['turkish'] = verb[key];
          });
          
          return (
            <div
              key={`verb_${index}_${imageBase}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                let conjugationData = null;
                let finalDisplayWord = infinitive;
                fetch(`${API_BASE_URL}/verb-conjugation/${imageBase}`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => {
                    if (data) {
                      conjugationData = data;
                      if (filters.tense && data) {
                        if (filters.tense === 'present') {
                          const personKey = filters.person || 'он';
                          finalDisplayWord = data.present?.[personKey] || infinitive;
                        } else if (filters.tense === 'past') {
                          if (filters.person === 'я' || filters.person === 'ты') {
                            const genderKey = filters.verbGender === 'feminine' ? 'ж' : filters.verbGender === 'neuter' ? 'с' : 'м';
                            const key = `${filters.person}_${genderKey}`;
                            finalDisplayWord = data.past?.[key] || infinitive;
                          } else {
                            finalDisplayWord = data.past?.[filters.person || 'он'] || infinitive;
                          }
                        } else if (filters.tense === 'future') {
                          const personKey = filters.person || 'он';
                          finalDisplayWord = data.future?.[personKey] || infinitive;
                        } else if (filters.tense === 'imperative') {
                          const imperativeKey = filters.imperativeForm || 'ты';
                          finalDisplayWord = data.imperative?.[imperativeKey] || infinitive;
                        }
                      }
                    }
                    const verbObject = {
                      imageBase: imageBase,
                      imagePng: verb['Картинка png'] || verb['Картинка'] || '',
                      word: finalDisplayWord,
                      displayWord: finalDisplayWord,
                      infinitive: infinitive,
                      translations: translations,
                      conjugation: conjugationData,
                      selectedForm: filters.tense ? { tense: filters.tense, person: filters.person, gender: filters.verbGender, imperativeForm: filters.imperativeForm } : null,
                      database: 'verbs',
                      russian: infinitive,
                      english: englishTranslation,
                      turkish: turkishTranslation
                    };
                    handleWordClick(verbObject);
                  })
                  .catch(console.error);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                <div className="text-sm text-gray-500 truncate">
                  {englishTranslation && `en: ${englishTranslation}`}
                  {turkishTranslation && ` tr: ${turkishTranslation}`}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'verbs');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {verb['Картинка png'] && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={verb['Картинка png']} alt={infinitive} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

  const renderGerundsList = () => {
  const filteredGerunds = gerunds.filter(gerund => {
    if (!theme) return false;
    let currentTheme = null;
    for (const g of gerunds) {
      if (g['Урок название'] && g['Урок название'].trim() !== '') {
        currentTheme = g['Урок название'];
      }
      if (g === gerund) return currentTheme === theme;
    }
    return false;
  }).filter(gerund => gerund['База изображение']);
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {!theme ? (
        <div className="text-center text-gray-500 py-4">Сначала выберите урок</div>
      ) : filteredGerunds.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Деепричастия не найдены для выбранной темы</div>
      ) : (
        filteredGerunds.map((gerund, index) => {
          const imageBase = gerund['База изображение'];
          const russianWord = gerund['Русский'] || '';
          const studiedLangLower = (studiedLanguage || 'русский').toLowerCase();
          
          const translations = {};
          Object.keys(gerund).forEach(key => {
            if (key === 'Русский') translations['russian'] = gerund[key];
            if (key === 'Английский') translations['english'] = gerund[key];
            if (key === 'Турецкий') translations['turkish'] = gerund[key];
          });
          
          let displayWord = translations[studiedLangLower] ||
                           translations[studiedLangLower.charAt(0).toUpperCase() + studiedLangLower.slice(1)] ||
                           translations.russian ||
                           translations.english ||
                           translations.turkish ||
                           russianWord ||
                           '';
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return swId === imageBase && swDatabase === 'gerunds';
              });
            }
            if (selectedWord) {
              const swId = selectedWord.imageBase || selectedWord.id;
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return swId === imageBase && swDatabase === 'gerunds';
            }
            return false;
          })();
          
          return (
            <div
              key={`gerund_${index}_${imageBase}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                const gerundObject = {
                  imageBase: imageBase,
                  imagePng: gerund['Картинка png'] || gerund['Картинка'] || '',
                  word: displayWord,
                  displayWord: displayWord,
                  baseForm: russianWord,
                  translations: translations,
                  database: 'gerunds',
                  originalData: gerund
                };
                handleWordClick(gerundObject);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{russianWord}</div>
                <div className="text-sm text-gray-500 truncate space-x-2">
                  {gerund['Английский'] && <span>en: {gerund['Английский']}</span>}
                  {gerund['Турецкий'] && <span className="ml-2">tr: {gerund['Турецкий']}</span>}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'gerunds');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {gerund['Картинка png'] && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={gerund['Картинка png']} alt={russianWord} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

 const renderParticiplesList = () => {
  const filteredParticiples = participles.filter(participle => {
    if (!theme) return false;
    let currentTheme = null;
    for (const p of participles) {
      if (p['Урок название'] && p['Урок название'].trim() !== '') {
        currentTheme = p['Урок название'];
      }
      if (p === participle) return currentTheme === theme;
    }
    return false;
  }).filter(participle => participle['База изображение']);
  
  const getTranslationForLanguage = (participle, targetLanguage) => {
    if (!participle) return '';
    targetLanguage = targetLanguage.toLowerCase();
    const languageMap = {
      'русский': 'Русский', 'russian': 'Русский',
      'английский': 'Английский', 'english': 'Английский',
      'турецкий': 'Турецкий', 'turkish': 'Турецкий'
    };
    const langKey = languageMap[targetLanguage] || (targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1));
    const baseFormField = `База причастия базовая форма ${langKey}`;
    if (participle[baseFormField] && participle[baseFormField].trim() !== '') {
      return participle[baseFormField];
    }
    if (participle.translations) {
      if (participle.translations[targetLanguage]) return participle.translations[targetLanguage];
      if (targetLanguage === 'русский' && participle.translations.russian) return participle.translations.russian;
      if (targetLanguage === 'английский' && participle.translations.english) return participle.translations.english;
      if (targetLanguage === 'турецкий' && participle.translations.turkish) return participle.translations.turkish;
    }
    return '';
  };
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {!theme ? (
        <div className="text-center text-gray-500 py-4">Сначала выберите урок</div>
      ) : filteredParticiples.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Причастия не найдены для выбранной темы</div>
      ) : (
        filteredParticiples.map((participle, index) => {
          const imageBase = participle['База изображение'];
          const targetLanguage = studiedLanguage || 'русский';
          const baseForm = getTranslationForLanguage(participle, targetLanguage) || 
                          participle['База причастия базовая форма Русский'] || '—';
          const cases = participleCases[imageBase];
          
          let displayWord = baseForm;
          if (cases) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = filters.case ? caseMapping[filters.case] : 'nominative';
            if (filters.number === 'множественное' || filters.number === 'plural') {
              if (cases.plural && cases.plural[caseKey]) {
                displayWord = cases.plural[caseKey];
              }
            } else {
              const genderMap = {
                'мужской': 'masculine',
                'женский': 'feminine',
                'средний': 'neuter'
              };
              const genderKey = filters.gender ? genderMap[filters.gender] : 'masculine';
              if (cases.singular && cases.singular[genderKey] && cases.singular[genderKey][caseKey] !== undefined &&
                  cases.singular[genderKey][caseKey].trim() !== '') {
                displayWord = cases.singular[genderKey][caseKey];
              }
            }
          }
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return swId === imageBase && swDatabase === 'participles';
              });
            }
            if (selectedWord) {
              const swId = selectedWord.imageBase || selectedWord.id;
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return swId === imageBase && swDatabase === 'participles';
            }
            return false;
          })();
          
          const translations = {};
          Object.keys(participle).forEach(key => {
            if (key.includes('База причастия базовая форма')) {
              const parts = key.split(' ');
              const lang = parts[parts.length - 1];
              translations[lang.toLowerCase()] = participle[key];
            }
          });
          
          return (
            <div
              key={`participle_${index}_${imageBase}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                let participleCases = null;
                let finalDisplayWord = baseForm;
                fetch(`${API_BASE_URL}/participle-cases/${imageBase}`)
                  .then(res => res.ok ? res.json() : null)
                  .then(data => {
                    if (data) participleCases = data;
                    if (participleCases && (filters.case || filters.number || filters.gender)) {
                      const caseMapping = {
                        'именительный': 'nominative',
                        'родительный': 'genitive', 
                        'дательный': 'dative',
                        'винительный': 'accusative',
                        'творительный': 'instrumental',
                        'предложный': 'prepositional'
                      };
                      const caseKey = filters.case ? caseMapping[filters.case] : 'nominative';
                      if (filters.number === 'множественное' || filters.number === 'plural') {
                        if (participleCases.plural && participleCases.plural[caseKey]) {
                          finalDisplayWord = participleCases.plural[caseKey];
                        }
                      } else {
                        const genderMap = {
                          'мужской': 'masculine',
                          'женский': 'feminine',
                          'средний': 'neuter'
                        };
                        const genderKey = filters.gender ? genderMap[filters.gender] : 'masculine';
                        if (participleCases.singular && participleCases.singular[genderKey] && participleCases.singular[genderKey][caseKey]) {
                          finalDisplayWord = participleCases.singular[genderKey][caseKey];
                        }
                      }
                    }
                    const participleObject = {
                      imageBase: imageBase,
                      imagePng: participle['Картинка png'] || '',
                      word: finalDisplayWord,
                      displayWord: finalDisplayWord,
                      baseForm: baseForm,
                      translations: translations,
                      cases: participleCases,
                      selectedForm: (filters.case || filters.number || filters.gender) ? { 
                        number: filters.number,
                        gender: filters.gender,
                        case: filters.case 
                      } : null,
                      database: 'participles',
                      originalData: participle
                    };
                    handleWordClick(participleObject);
                  })
                  .catch(console.error);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                <div className="text-sm text-gray-500 truncate space-x-2">
                  {Object.entries(translations).map(([lang, word]) => (
                    <span key={lang} className="inline-block">{lang}: {word}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'participles');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {participle['Картинка png'] && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={participle['Картинка png']} alt={baseForm} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

 const renderPrepositionsList = () => {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {prepositions.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Предлоги, частицы не найдены</div>
      ) : (
        prepositions.map((preposition, index) => {
          const russianWord = preposition['Русский'] || '';
          const displayWord = getDisplayTextForSpecialWords(preposition, 'prepositions');
          const imageBase = `preposition_${russianWord.toLowerCase().replace(/[^a-zа-яё]/g, '_')}`;
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swDisplayWord = sw.displayWord || sw.word;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return swDisplayWord === displayWord && swDatabase === 'prepositions';
              });
            }
            if (selectedWord) {
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return (selectedWord.displayWord === displayWord || selectedWord.word === displayWord) && swDatabase === 'prepositions';
            }
            return false;
          })();
          
          return (
            <div
              key={`preposition_${index}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleWordClick(preposition)}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                {getHintForSpecialWords(preposition, 'prepositions') && (
                  <div className="text-sm text-gray-500 truncate">{getHintForSpecialWords(preposition, 'prepositions')}</div>
                )}
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'prepositions');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

const renderQuestionWordsList = () => {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {questionWords.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Вопросительные слова не найдены</div>
      ) : (
        questionWords.map((questionWord, index) => {
          const russianWord = questionWord['Русский'] || '';
          const englishWord = questionWord['Английский'] || '';
          const turkishWord = questionWord['Турецкий'] || '';
          const imageUrl = questionWord['Картинка'] || '';
          const imageBase = `question_word_${russianWord.toLowerCase()}`;
          const cases = questionWordCases[imageBase];
          
          let displayWord = russianWord;
          if (cases && filters.case) {
            const caseMapping = {
              'именительный': 'nominative',
              'родительный': 'genitive', 
              'дательный': 'dative',
              'винительный': 'accusative',
              'творительный': 'instrumental',
              'предложный': 'prepositional'
            };
            const caseKey = caseMapping[filters.case];
            if (filters.number === 'множественное' || filters.number === 'plural') {
              if (cases.plural && cases.plural[caseKey]) {
                displayWord = cases.plural[caseKey];
              }
            } else {
              const genderMapping = {
                'мужской': 'masculine',
                'женский': 'feminine',
                'средний': 'neuter'
              };
              const genderKey = genderMapping[filters.gender] || 'masculine';
              if (cases.singular && cases.singular[genderKey] && cases.singular[genderKey][caseKey] &&
                  cases.singular[genderKey][caseKey].trim() !== '') {
                displayWord = cases.singular[genderKey][caseKey];
              }
            }
          }
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swDatabase = sw.database || sw.sourceDatabase || '';
                return sw.translations?.russian === russianWord && swDatabase === 'question-words';
              });
            }
            if (selectedWord) {
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              return selectedWord.translations?.russian === russianWord && swDatabase === 'question-words';
            }
            return false;
          })();
          
          return (
            <div
              key={`question_word_${index}`}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                const questionWordObject = {
                  'Русский': russianWord,
                  'Английский': englishWord,
                  'Турецкий': turkishWord,
                  'Картинка': imageUrl,
                  'displayWord': displayWord,
                  'hasFilters': !!(filters.case || filters.number || filters.gender),
                  'filters': filters
                };
                handleWordClick(questionWordObject);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                <div className="text-sm text-gray-500 truncate space-x-2">
                  <span>en: {englishWord}</span>
                  {turkishWord && <span className="ml-2">tr: {turkishWord}</span>}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(imageBase, audioLanguage, 'question-words');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              {imageUrl && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img src={imageUrl} alt={russianWord} className="w-full h-full object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

 const renderRegularWordsList = () => {
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {availableWords.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          {theme ? 'Слова не найдены для выбранной темы и фильтров' : 'Выберите урок для отображения слов'}
        </div>
      ) : (
        availableWords.map((word, index) => {
          const wordId = word.imageBase || word.id;
          const displayWord = word.displayWord || getStudiedText(word);
          
          const isSelected = (() => {
            if (selectedWords && selectedWords.length > 0) {
              return selectedWords.some(sw => {
                const swId = sw.imageBase || sw.id;
                const swDatabase = sw.database || sw.sourceDatabase || '';
                const currentDatabase = database || '';
                return swId === wordId && swDatabase === currentDatabase;
              });
            }
            if (selectedWord) {
              const swId = selectedWord.imageBase || selectedWord.id;
              const swDatabase = selectedWord.database || selectedWord.sourceDatabase || '';
              const currentDatabase = database || '';
              return swId === wordId && swDatabase === currentDatabase;
            }
            return false;
          })();
          
          return (
            <div
              key={wordId}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => {
                const wordObject = { ...word, imagePng: word.imagePng || '' };
                handleWordClick(wordObject);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{displayWord}</div>
                <div className="text-sm text-gray-500 truncate">{getHintText(word)}</div>
                <div className="text-xs text-gray-400 mt-1">ID: {word.imageBase} | Форма: {word.displayWord ? 'фильтрованная' : 'базовая'}</div>
              </div>
              
              {/* КНОПКА АУДИО */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await playAudio(word.imageBase, audioLanguage, database);
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors flex-shrink-0"
                title={`Прослушать на ${audioLanguage}`}
              >
                🎵
              </button>
              
              {(word.imagePng || word['Картинка png'] || word['Картинка']) && (
                <div className="w-10 h-10 flex-shrink-0">
                  <img
                    src={word.imagePng || word['Картинка png'] || word['Картинка']}
                    alt={displayWord}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

  // ========== ОСНОВНОЙ РЕНДЕР ==========
  if (database === 'prepositions') {
    return renderPrepositionsList();
  } else if (database === 'question-words') {
    return renderQuestionWordsList();
  } else if (database === 'gerunds') {
    return renderGerundsList();
  } else if (database === 'verbs') {
    return renderVerbsList();
  } else if (database === 'adverbs') {
    return renderAdverbsList();
  } else if (database === 'participles') {
    return renderParticiplesList();
  } else if (database === 'numerals') {
    return renderNumeralsList();
  } else if (database === 'pronouns') {
    return renderPronounsList();
  } else {
    return renderRegularWordsList();
  }
};


// Конфигурации языков для существительных
const baseLanguages = {
    russian: {
        number: 'База существительные номер Русский',
        word: 'База существительные слова Русский',
        plural: 'База существительные множественное Русский'
    },
    english: {
        number: 'База существительные номер Английский',
        word: 'База существительные слова Английский',
        plural: 'База существительные множественное Английский'
    },
    turkish: {
        number: 'База существительные номер Турецкий',
        word: 'База существительные слова Турецкий',
        plural: 'База существительные множественное Турецкий'
    }
};
const additionalLanguages = {
    spanish: {
        number: 'База существительные номер Испанский',
        word: 'База существительные слова Испанский',
        plural: 'База существительные множественное Испанский'
    },
    german: {
        number: 'База существительные номер Немецкий',
        word: 'База существительные слова Немецкий',
        plural: 'База существительные множественное Немецкий'
    },
    french: {
        number: 'База существительные номер Французский',
        word: 'База существительные слова Французский',
        plural: 'База существительные множественное Французский'
    },
    italian: {
        number: 'База существительные номер Итальянский',
        word: 'База существительные слова Итальянский',
        plural: 'База существительные множественное Итальянский'
    },
    chinese: {
        number: 'База существительные номер Китайский',
        word: 'База существительные слова Китайский',
        plural: 'База существительные множественное Китайский'
    },
    japanese: {
        number: 'База существительные номер Японский',
        word: 'База существительные слова Японский',
        plural: 'База существительные множественное Японский'
    },
    arabic: {
        number: 'База существительные номер Арабский',
        word: 'База существительные слова Арабский',
        plural: 'База существительные множественное Арабский'
    },
    portuguese: {
        number: 'База существительные номер Португальский',
        word: 'База существительные слова Португальский',
        plural: 'База существительные множественное Португальский'
    },
    korean: {
        number: 'База существительные номер Корейский',
        word: 'База существительные слова Корейский',
        plural: 'База существительные множественное Корейский'
    },
    hindi: {
        number: 'База существительные номер Хинди',
        word: 'База существительные слова Хинди',
        plural: 'База существительные множественное Хинди'
    },
    dutch: {
        number: 'База существительные номер Голландский',
        word: 'База существительные слова Голландский',
        plural: 'База существительные множественное Голландский'
    },
    swedish: {
        number: 'База существительные номер Шведский',
        word: 'База существительные слова Шведский',
        plural: 'База существительные множественное Шведский'
    },
    polish: {
        number: 'База существительные номер Польский',
        word: 'База существительные слова Польский',
        plural: 'База существительные множественное Польский'
    },
    greek: {
        number: 'База существительные номер Греческий',
        word: 'База существительные слова Греческий',
        plural: 'База существительные множественное Греческий'
    },
    hebrew: {
        number: 'База существительные номер Иврит',
        word: 'База существительные слова Иврит',
        plural: 'База существительные множественное Иврит'
    },
    vietnamese: {
        number: 'База существительные номер Вьетнамский',
        word: 'База существительные слова Вьетнамский',
        plural: 'База существительные множественное Вьетнамский'
    },
    indonesian: {
        number: 'База существительные номер Индонезийский',
        word: 'База существительные слова Индонезийский',
        plural: 'База существительные множественное Индонезийский'
    }
};
// Конфигурации языков для числительных
const numeralsBaseLanguages = {
  russian: {
    number: 'База числительные номер Русский',
    word: 'База числительные слова Русский'
  },
  english: {
    number: 'База числительные номер Английский',
    word: 'База числительные слова Английский'
  },
  turkish: {
    number: 'База числительные номер Турецкий',
    word: 'База числительные слова Турецкий'
  }
};

const numeralsAdditionalLanguages = {
  spanish: {
    number: 'База числительные номер Испанский',
    word: 'База числительные слова Испанский'
  },
  german: {
    number: 'База числительные номер Немецкий',
    word: 'База числительные слова Немецкий'
  },
  french: {
    number: 'База числительные номер Французский',
    word: 'База числительные слова Французский'
  },
  italian: {
    number: 'База числительные номер Итальянский',
    word: 'База числительные слова Итальянский'
  },
  chinese: {
    number: 'База числительные номер Китайский',
    word: 'База числительные слова Китайский'
  },
  japanese: {
    number: 'База числительные номер Японский',
    word: 'База числительные слова Японский'
  },
  korean: {
    number: 'База числительные номер Корейский',
    word: 'База числительные слова Корейский'
  },
  arabic: {
    number: 'База числительные номер Арабский',
    word: 'База числительные слова Арабский'
  }
};

const numeralsAllLanguages = { ...numeralsBaseLanguages, ...numeralsAdditionalLanguages };
// Конфигурации языков для прилагательных
const adjectivesBaseLanguages = {
    russian: {
        number: 'База прилагательные номер Русский',
        word: 'База прилагательные слова Русский',
        masculine: 'База прилагательные мужской род Русский',
        feminine: 'База прилагательные женский род Русский',
        neuter: 'База прилагательные средний род Русский',
        plural: 'База прилагательные множественное число Русский'
    },
    english: {
        number: 'База прилагательные номер Английский',
        word: 'База прилагательные слова Английский',
        masculine: 'База прилагательные мужской род Английский',
        feminine: 'База прилагательные женский род Английский',
        neuter: 'База прилагательные средний род Английский',
        plural: 'База прилагательные множественное число Английский'
    },
    turkish: {
        number: 'База прилагательные номер Турецкий',
        word: 'База прилагательные слова Турецкий',
        masculine: 'База прилагательные мужской род Турецкий',
        feminine: 'База прилагательные женский род Турецкий',
        neuter: 'База прилагательные средний род Турецкий',
        plural: 'База прилагательные множественное число Турецкий'
    }
};
const adjectivesAdditionalLanguages = {
    spanish: {
        number: 'База прилагательные номер Испанский',
        word: 'База прилагательные слова Испанский',
        masculine: 'База прилагательные мужской род Испанский',
        feminine: 'База прилагательные женский род Испанский',
        neuter: 'База прилагательные средний род Испанский',
        plural: 'База прилагательные множественное число Испанский'
    },
    german: {
        number: 'База прилагательные номер Немецкий',
        word: 'База прилагательные слова Немецкий',
        masculine: 'База прилагательные мужской род Немецкий',
        feminine: 'База прилагательные женский род Немецкий',
        neuter: 'База прилагательные средний род Немецкий',
        plural: 'База прилагательные множественное число Немецкий'
    },
    french: {
        number: 'База прилагательные номер Французский',
        word: 'База прилагательные слова Французский',
        masculine: 'База прилагательные мужской род Французский',
        feminine: 'База прилагательные женский род Французский',
        neuter: 'База прилагательные средний род Французский',
        plural: 'База прилагательные множественное число Французский'
    },
    italian: {
        number: 'База прилагательные номер Итальянский',
        word: 'База прилагательные слова Итальянский',
        masculine: 'База прилагательные мужской род Итальянский',
        feminine: 'База прилагательные женский род Итальянский',
        neuter: 'База прилагательные средний род Итальянский',
        plural: 'База прилагательные множественное число Итальянский'
    },
    chinese: {
        number: 'База прилагательные номер Китайский',
        word: 'База прилагательные слова Китайский',
        masculine: 'База прилагательные мужской род Китайский',
        feminine: 'База прилагательные женский род Китайский',
        neuter: 'База прилагательные средний род Китайский',
        plural: 'База прилагательные множественное число Китайский'
    },
    japanese: {
        number: 'База прилагательные номер Японский',
        word: 'База прилагательные слова Японский',
        masculine: 'База прилагательные мужской род Японский',
        feminine: 'База прилагательные женский род Японский',
        neuter: 'База прилагательные средний род Японский',
        plural: 'База прилагательные множественное число Японский'
    },
    arabic: {
        number: 'База прилагательные номер Арабский',
        word: 'База прилагательные слова Арабский',
        masculine: 'База прилагательные мужской род Арабский',
        feminine: 'База прилагательные женский род Арабский',
        neuter: 'База прилагательные средний род Арабский',
        plural: 'База прилагательные множественное число Арабский'
    },
    portuguese: {
        number: 'База прилагательные номер Португальский',
        word: 'База прилагательные слова Португальский',
        masculine: 'База прилагательные мужской род Португальский',
        feminine: 'База прилагательные женский род Португальский',
        neuter: 'База прилагательные средний род Португальский',
        plural: 'База прилагательные множественное число Португальский'
    },
    korean: {
        number: 'База прилагательные номер Корейский',
        word: 'База прилагательные слова Корейский',
        masculine: 'База прилагательные мужской род Корейский',
        feminine: 'База прилагательные женский род Корейский',
        neuter: 'База прилагательные средний род Корейский',
        plural: 'База прилагательные множественное число Корейский'
    },
    hindi: {
        number: 'База прилагательные номер Хинди',
        word: 'База прилагательные слова Хинди',
        masculine: 'База прилагательные мужской род Хинди',
        feminine: 'База прилагательные женский род Хинди',
        neuter: 'База прилагательные средний род Хинди',
        plural: 'База прилагательные множественное число Хинди'
    },
    dutch: {
        number: 'База прилагательные номер Голландский',
        word: 'База прилагательные слова Голландский',
        masculine: 'База прилагательные мужской род Голландский',
        feminine: 'База прилагательные женский род Голландский',
        neuter: 'База прилагательные средний род Голландский',
        plural: 'База прилагательные множественное число Голландский'
    },
    swedish: {
        number: 'База прилагательные номер Шведский',
        word: 'База прилагательные слова Шведский',
        masculine: 'База прилагательные мужской род Шведский',
        feminine: 'База прилагательные женский род Шведский',
        neuter: 'База прилагательные средний род Шведский',
        plural: 'База прилагательные множественное число Шведский'
    },
    polish: {
        number: 'База прилагательные номер Польский',
        word: 'База прилагательные слова Польский',
        masculine: 'База прилагательные мужской род Польский',
        feminine: 'База прилагательные женский род Польский',
        neuter: 'База прилагательные средний род Польский',
        plural: 'База прилагательные множественное число Польский'
    },
    greek: {
        number: 'База прилагательные номер Греческий',
        word: 'База прилагательные слова Греческий',
        masculine: 'База прилагательные мужской род Греческий',
        feminine: 'База прилагательные женский род Греческий',
        neuter: 'База прилагательные средний род Греческий',
        plural: 'База прилагательные множественное число Греческий'
    },
    hebrew: {
        number: 'База прилагательные номер Иврит',
        word: 'База прилагательные слова Иврит',
        masculine: 'База прилагательные мужской род Иврит',
        feminine: 'База прилагательные женский род Иврит',
        neuter: 'База прилагательные средний род Иврит',
        plural: 'База прилагательные множественное число Иврит'
    },
    vietnamese: {
        number: 'База прилагательные номер Вьетнамский',
        word: 'База прилагательные слова Вьетнамский',
        masculine: 'База прилагательные мужской род Вьетнамский',
        feminine: 'База прилагательные женский род Вьетнамский',
        neuter: 'База прилагательные средний род Вьетнамский',
        plural: 'База прилагательные множественное число Вьетнамский'
    },
    indonesian: {
        number: 'База прилагательные номер Индонезийский',
        word: 'База прилагательные слова Индонезийский',
        masculine: 'База прилагательные мужской род Индонезийский',
        feminine: 'База прилагательные женский род Индонезийский',
        neuter: 'База прилагательные средний род Индонезийский',
        plural: 'База прилагательные множественное число Индонезийский'
    }
};
const allLanguages = { ...baseLanguages, ...additionalLanguages };
const adjectivesAllLanguages = { ...adjectivesBaseLanguages, ...adjectivesAdditionalLanguages };
const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
];
const adjectivesBaseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
];
const adjectivesLanguageConfig = {
  // Русский язык - полная поддержка родов, чисел и падежей
  'russian': {
    hasGender: true,
    hasNumber: true,
    hasCases: true,
    columns: ['masculine', 'feminine', 'neuter', 'plural']
  },
  // Французский - род и число, но нет падежей
  'french': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine', 'plural']
  },
  // Немецкий - род, число и падежи
  'german': {
    hasGender: true,
    hasNumber: true,
    hasCases: true,
    columns: ['masculine', 'feminine', 'neuter', 'plural']
  },
  // Испанский - род и число, но нет падежей
  'spanish': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine', 'plural']
  },
  // Итальянский - род и число, но нет падежей
  'italian': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine', 'plural']
  },
  // Арабский - род и число, но нет падежей
  'arabic': {
    hasGender: true,
    hasNumber: true,
    hasCases: false,
    columns: ['masculine', 'feminine']
  },
  // Остальные языки - только базовое прилагательное
  'english': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'turkish': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'chinese': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'japanese': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  },
  'korean': {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  }
};
// Функция для получения конфигурации языка
// Функция для получения конфигурации языка
const getAdjectiveLanguageConfig = (language) => {
  // Приводим к нижнему регистру и убираем пробелы
  const langKey = language.toLowerCase().trim();
  
  // Маппинг русских названий на ключи
  const languageMap = {
    'русский': 'russian',
    'russian': 'russian',
    'английский': 'english',
    'english': 'english',
    'турецкий': 'turkish',
    'turkish': 'turkish',
    'испанский': 'spanish',
    'spanish': 'spanish',
    'немецкий': 'german',
    'german': 'german',
    'французский': 'french',
    'french': 'french',
    'итальянский': 'italian',
    'italian': 'italian',
    'китайский': 'chinese',
    'chinese': 'chinese',
    'японский': 'japanese',
    'japanese': 'japanese',
    'арабский': 'arabic',
    'arabic': 'arabic'
  };
  
  const mappedKey = languageMap[langKey] || langKey;
  
  return adjectivesLanguageConfig[mappedKey] || {
    hasGender: false,
    hasNumber: false,
    hasCases: false,
    columns: ['word']
  };
};

const CaseManagementModal = ({ isOpen, onClose, word, onSave }) => {
  const [cases, setCases] = useState({
    singular: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    },
    plural: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    }
  });
  
  // НОВОЕ: состояние для рода
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (word && word.imageBase) {
      loadData();
    }
  }, [word]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем падежи
      const casesResponse = await fetch(`${API_BASE_URL}/noun-cases/${word.imageBase}`);
      const casesData = await casesResponse.json();
      
      // Загружаем род (НОВЫЙ ЭНДПОИНТ)
      const genderResponse = await fetch(`${API_BASE_URL}/noun-gender/${word.imageBase}`);
      const genderData = await genderResponse.json();
      
      setCases({
        singular: casesData.singular || {
          nominative: '', genitive: '', dative: '', accusative: '', instrumental: '', prepositional: ''
        },
        plural: casesData.plural || {
          nominative: '', genitive: '', dative: '', accusative: '', instrumental: '', prepositional: ''
        }
      });
      
      setGender(genderData.gender || '');
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Сохраняем падежи (существующий эндпоинт)
      const casesResponse = await fetch(`${API_BASE_URL}/noun-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: word.imageBase,
          singular: cases.singular,
          plural: cases.plural
        })
      });
      
      if (!casesResponse.ok) {
        throw new Error('Failed to save cases');
      }
      
      // Сохраняем род (НОВЫЙ ЭНДПОИНТ)
      const genderResponse = await fetch(`${API_BASE_URL}/noun-gender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: word.imageBase,
          gender: gender
        })
      });
      
      if (!genderResponse.ok) {
        throw new Error('Failed to save gender');
      }
      
      setSaveSuccess(true);
      
      if (onSave) {
        onSave({ ...cases, gender });
      }
      
      alert('✅ Данные успешно сохранены!');
      onClose();
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('❌ Ошибка сохранения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseChange = (number, caseType, value) => {
    setCases(prev => ({
      ...prev,
      [number]: {
        ...prev[number],
        [caseType]: value
      }
    }));
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный', question: 'кто? что?' },
    { key: 'genitive', label: 'Родительный', question: 'кого? чего?' },
    { key: 'dative', label: 'Дательный', question: 'кому? чему?' },
    { key: 'accusative', label: 'Винительный', question: 'кого? что?' },
    { key: 'instrumental', label: 'Творительный', question: 'кем? чем?' },
    { key: 'prepositional', label: 'Предложный', question: 'о ком? о чём?' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения для: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
        
        {loading && (
          <div className="text-center py-4 text-blue-600">
            Загрузка...
          </div>
        )}
        
        {saveSuccess && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-green-700">
            ✓ Данные успешно загружены
          </div>
        )}
        
        {/* НОВЫЙ БЛОК - выбор рода */}
        <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
          <h4 className="font-semibold text-lg mb-4 text-blue-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Род существительного
          </h4>
          
          <div className="flex flex-wrap gap-6">
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              gender === 'мужской' 
                ? 'border-blue-500 bg-blue-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="nounGender"
                value="мужской"
                checked={gender === 'мужской'}
                onChange={(e) => setGender(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="text-lg font-medium">Мужской</span>
                <span className="ml-2 text-sm text-gray-500">(он)</span>
              </div>
              <span className="text-2xl ml-1">👨</span>
            </label>
            
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              gender === 'женский' 
                ? 'border-pink-500 bg-pink-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="nounGender"
                value="женский"
                checked={gender === 'женский'}
                onChange={(e) => setGender(e.target.value)}
                className="w-4 h-4 text-pink-600"
              />
              <div>
                <span className="text-lg font-medium">Женский</span>
                <span className="ml-2 text-sm text-gray-500">(она)</span>
              </div>
              <span className="text-2xl ml-1">👩</span>
            </label>
            
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              gender === 'средний' 
                ? 'border-green-500 bg-green-100' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="nounGender"
                value="средний"
                checked={gender === 'средний'}
                onChange={(e) => setGender(e.target.value)}
                className="w-4 h-4 text-green-600"
              />
              <div>
                <span className="text-lg font-medium">Средний</span>
                <span className="ml-2 text-sm text-gray-500">(оно)</span>
              </div>
              <span className="text-2xl ml-1">🧸</span>
            </label>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Важно:</strong> Род существительного определяет, как с ним будут согласовываться 
                прилагательные (красн<strong>ый</strong> дом, красн<strong>ая</strong> машина, красн<strong>ое</strong> яблоко) 
                и местоимения (он/она/оно).
              </span>
            </p>
          </div>
        </div>

        {/* Таблица падежей (без изменений) */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                  Единственное число
                </th>
                <th colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                  Множественное число
                </th>
              </tr>
              <tr className="bg-gray-50">
                {caseTypes.map((caseType) => (
                  <th key={`singular-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    <div>{caseType.label}</div>
                    <div className="text-xs text-gray-500">{caseType.question}</div>
                  </th>
                ))}
                {caseTypes.map((caseType) => (
                  <th key={`plural-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    <div>{caseType.label}</div>
                    <div className="text-xs text-gray-500">{caseType.question}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {caseTypes.map((caseType) => (
                  <td key={`singular-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.singular[caseType.key] || ''}
                      onChange={(e) => handleCaseChange('singular', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                      placeholder={`ед.ч. ${caseType.label}`}
                    />
                  </td>
                ))}
                {caseTypes.map((caseType) => (
                  <td key={`plural-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.plural[caseType.key] || ''}
                      onChange={(e) => handleCaseChange('plural', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                      placeholder={`мн.ч. ${caseType.label}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Подсказка по падежам */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Подсказки по падежам:</h4>
          <div className="text-sm text-yellow-700 grid grid-cols-2 gap-2">
            <div><strong>Именительный:</strong> кто? что? (есть)</div>
            <div><strong>Родительный:</strong> кого? чего? (нет)</div>
            <div><strong>Дательный:</strong> кому? чему? (дать)</div>
            <div><strong>Винительный:</strong> кого? что? (вижу)</div>
            <div><strong>Творительный:</strong> кем? чем? (горжусь)</div>
            <div><strong>Предложный:</strong> о ком? о чём? (думаю)</div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
            disabled={loading}
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// QuestionColumn.jsx (обновленная версия)
// В QuestionColumn.jsx обновите компонент
// QuestionColumn.jsx (обновленная версия с фильтрами для глаголов)
const QuestionColumn = ({ 
  config, 
  columnIndex, 
  structure, 
  onStructureChange, 
  lessonData, 
  isAnswer = false,
 getThemesByDatabase,
 getAvailableThemes
}) => {
  const columnData = structure[columnIndex] || {
    lesson: '',
    number: '',
    gender: '',
    case: '',
    tense: '',
    person: '',
    verbGender: '',
    imperativeForm: '',
    word: '',
    wordData: null
  };

  const updateColumnData = (updates) => {
    const updatedStructure = [...structure];
    updatedStructure[columnIndex] = { ...columnData, ...updates };
    onStructureChange(updatedStructure);
  };

  // Определяем, нужно ли показывать фильтры для этой базы данных
  const showFilters = !['prepositions', 'question-words', 'gerunds'].includes(config.database);

  return (
    <div className="space-y-3">
      {/* Выбор урока */}
      {
       config.database !== 'question-words' && 
        
        config.database !== 'pronouns' &&
    
        config.database !== 'prepositions' && config.database !== 'numerals' && (
        <div>
        <label className="block text-sm font-medium mb-1">
  {getDisplayLabel('Выбрать урок')}
</label>
          <select
            value={columnData.lesson || ''}
            onChange={(e) => updateColumnData({ lesson: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Выберите тему</option>
            {getThemesByDatabase(config.database).map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>
      )}
{config.database === 'pronouns' && (
  <PronounFormSelector
    config={columnData}
    onConfigChange={(field, value) => {
      // Используем updateColumnData, а не onColumnChange
      updateColumnData({ [field]: value });
    }}
  />
)}
{config.database === 'pronouns' && columnData.wordData?.selectedForm && (
  <div className="text-xs text-indigo-600 mt-1">
    Форма: {columnData.wordData.selectedForm.person} л., 
    {columnData.wordData.selectedForm.number === 'ед' ? ' ед.ч' : ' мн.ч'}
    {columnData.wordData.selectedForm.gender && `, ${columnData.wordData.selectedForm.gender}`}
    {columnData.wordData.selectedForm.case && `, ${columnData.wordData.selectedForm.case}`}
  </div>
)}

      {/* ФИЛЬТРЫ ДЛЯ СУЩЕСТВИТЕЛЬНЫХ */}
      {config.database === 'nouns' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => updateColumnData({ number: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => updateColumnData({ case: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
        </div>
      )}


      {config.database === 'question-words' && (
  <div className="grid grid-cols-2 gap-2">
    <div>
      <label className="block text-sm font-medium mb-1">Число</label>
      <select
        value={columnData.number || ''}
        onChange={(e) => updateColumnData({ number: e.target.value })}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любое</option>
        <option value="единственное">Единственное</option>
        <option value="множественное">Множественное</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Род</label>
      <select
        value={columnData.gender || ''}
        onChange={(e) => updateColumnData({ gender: e.target.value })}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="мужской">Мужской</option>
        <option value="женский">Женский</option>
        <option value="средний">Средний</option>
      </select>
    </div>
    <div className="col-span-2">
      <label className="block text-sm font-medium mb-1">Падеж</label>
      <select
        value={columnData.case || ''}
        onChange={(e) => updateColumnData({ case: e.target.value })}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
    </div>
    <p className="text-xs text-gray-500 mt-1 col-span-2">
      Вопросительные слова изменяются по падежам, родам и числам. Пример: КАКОЙ → КАКОГО, КАКОМУ
    </p>
  </div>
)}

      {/* ФИЛЬТРЫ ДЛЯ ПРИЛАГАТЕЛЬНЫХ */}
      {config.database === 'adjectives' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Число</label>
            <select
              value={columnData.number || ''}
              onChange={(e) => updateColumnData({ number: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любое</option>
              <option value="единственное">Единственное</option>
              <option value="множественное">Множественное</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Род</label>
            <select
              value={columnData.gender || ''}
              onChange={(e) => updateColumnData({ gender: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="мужской">Мужской</option>
              <option value="женский">Женский</option>
              <option value="средний">Средний</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Падеж</label>
            <select
              value={columnData.case || ''}
              onChange={(e) => updateColumnData({ case: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Любой</option>
              <option value="именительный">Именительный</option>
              <option value="родительный">Родительный</option>
              <option value="дательный">Дательный</option>
              <option value="винительный">Винительный</option>
              <option value="творительный">Творительный</option>
              <option value="предложный">Предложный</option>
            </select>
          </div>
        </div>
      )}
{/* В QuestionColumn, после блока для adjectives, добавьте: */}
{config.database === 'participles' && (
  <div className="grid grid-cols-2 gap-2">
    <div>
      <label className="block text-sm font-medium mb-1">Число</label>
      <select
        value={columnData.number || ''}
        onChange={(e) => updateColumnData({ number: e.target.value })}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любое</option>
        <option value="единственное">Единственное</option>
        <option value="множественное">Множественное</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Род</label>
      <select
        value={columnData.gender || ''}
        onChange={(e) => updateColumnData({ gender: e.target.value })}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="мужской">Мужской</option>
        <option value="женский">Женский</option>
        <option value="средний">Средний</option>
      </select>
    </div>
    <div className="col-span-2">
      <label className="block text-sm font-medium mb-1">Падеж</label>
      <select
        value={columnData.case || ''}
        onChange={(e) => updateColumnData({ case: e.target.value })}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
    </div>
  </div>
)}
{config.database === 'numerals' && (
  <div className="grid grid-cols-2 gap-2">
    <div className="col-span-2">
      <label className="block text-sm font-medium mb-1">Падеж</label>
      <select
        value={columnData.case || ''}
        onChange={(e) => updateColumnData({ case: e.target.value })}  // ← ИСПРАВЛЕНО
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Числительные изменяются по падежам. Пример: восемь → восьми, восемью
      </p>
    </div>
  </div>
)}
      {/* ФИЛЬТРЫ ДЛЯ ГЛАГОЛОВ - ВОТ ЭТО ДОБАВЛЕНО */}
      {config.database === 'verbs' && (
        <div className="space-y-2 p-3 bg-purple-50 rounded border border-purple-200">
          <h5 className="font-medium text-sm text-purple-800">Форма глагола:</h5>
          
          {/* Время */}
          <div>
            <label className="text-xs text-gray-600">Время</label>
            <select
              value={columnData.tense || ''}
              onChange={(e) => updateColumnData({ tense: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Инфинитив</option>
              <option value="present">Настоящее время</option>
              <option value="past">Прошедшее время</option>
              <option value="future">Будущее время</option>
              <option value="imperative">Повелительное наклонение</option>
            </select>
          </div>

          {/* Лицо для настоящего/будущего времени */}
          {(columnData.tense === 'present' || columnData.tense === 'future') && (
            <div>
              <label className="text-xs text-gray-600">Лицо и число</label>
              <select
                value={columnData.person || ''}
                onChange={(e) => updateColumnData({ person: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                                <option value="Выбор">Выберите лицо и число</option>

                <option value="я">1 лицо ед.ч. (я)</option>
                <option value="ты">2 лицо ед.ч. (ты)</option>
                <option value="он">3 лицо ед.ч. муж.род (он)</option>
                <option value="она">3 лицо ед.ч. жен.род (она)</option>
                <option value="оно">3 лицо ед.ч. сред.род (оно)</option>
                <option value="мы">1 лицо мн.ч. (мы)</option>
                <option value="вы">2 лицо мн.ч. (вы)</option>
                <option value="они">3 лицо мн.ч. (они)</option>
              </select>
            </div>
          )}

          {/* Род для прошедшего времени */}
          {columnData.tense === 'past' && (
            <>
              <div>
                <label className="text-xs text-gray-600">Лицо</label>
                <select
                  value={columnData.person || ''}
                  onChange={(e) => updateColumnData({ person: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                                  <option value="Выбор">Выберите лицо и число</option>

                  <option value="я">1 лицо (я)</option>
                  <option value="ты">2 лицо (ты)</option>
                  <option value="он">3 лицо муж.род (он)</option>
                  <option value="она">3 лицо жен.род (она)</option>
                  <option value="оно">3 лицо сред.род (оно)</option>
                  <option value="мы">1 лицо мн.ч. (мы)</option>
                  <option value="вы">2 лицо мн.ч. (вы)</option>
                  <option value="они">3 лицо мн.ч. (они)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Род (для ед.ч.)</label>
                <select
                  value={columnData.verbGender || ''}
                  onChange={(e) => updateColumnData({ verbGender: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="masculine">Мужской</option>
                  <option value="feminine">Женский</option>
                  <option value="neuter">Средний</option>
                </select>
              </div>
            </>
          )}

          {/* Число для повелительного наклонения */}
          {columnData.tense === 'imperative' && (
            <div>
              <label className="text-xs text-gray-600">Число</label>
              <select
                value={columnData.imperativeForm || ''}
                onChange={(e) => updateColumnData({ imperativeForm: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                                <option value="Выбор">Выберите наклонение</option>

                <option value="ты">Единственное (ты)</option>
                <option value="вы">Множественное (вы)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Выбор слова с учетом фильтров */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {config.database === 'prepositions' ? 'Выбрать предлог, частица' : 
           config.database === 'question-words' ? 'Выбрать вопросительное слово' : 
           config.database === 'gerunds' ? 'Выбрать деепричастие' :
           config.database === 'verbs' ? 'Выбрать глагол' : 
           'Выбрать слово'}
        </label>
<WordSelector
  studiedLanguage={lessonData?.studiedLanguage || 'русский'} // Это должно быть 'english' для вашего примера
  theme={columnData.lesson || ''}
  database={config.database}
  filters={{
    number: columnData.number,
    gender: columnData.gender,
    case: columnData.case,
    tense: columnData.tense,
    person: columnData.person,
    verbGender: columnData.verbGender,
    imperativeForm: columnData.imperativeForm
  }}
  onWordSelect={(selectedWord) => {
    console.log('WordSelector onWordSelect received:', selectedWord);
    
    // ВАЖНО: Используем displayWord или word для отображения
    const displayWord = selectedWord.displayWord || selectedWord.word || '';
    
    updateColumnData({ 
      word: displayWord,  // Сохраняем само слово, не imageBase
      wordData: {
        ...selectedWord,
        selectedFilters: {
          person: columnData.person,
          number: columnData.number,
          gender: columnData.gender,
          case: columnData.case
        }
      }
    });
  }}
  selectedWord={columnData.wordData}
/>
        
        {/* Индикатор выбранного слова */}
        {columnData.word && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-green-800">
                  Выбрано: {columnData.word}
                </span>
                {columnData.wordData?.imagePng && (
                  <div className="mt-1">
                    <img
                      src={columnData.wordData.imagePng}
                      alt="Preview"
                      className="h-8 w-8 object-cover rounded"
                    />
                  </div>
                )}
                {/* Отображение примененных фильтров */}
                {(columnData.number || columnData.gender || columnData.case || 
                  columnData.tense || columnData.person || columnData.verbGender) && (
                  <div className="text-xs text-gray-500 mt-1">
                    Фильтры: 
                    {columnData.number && ` Число: ${columnData.number}`}
                    {columnData.gender && ` Род: ${columnData.gender}`}
                    {columnData.case && ` Падеж: ${columnData.case}`}
                    {columnData.tense && ` Время: ${columnData.tense}`}
                    {columnData.person && ` Лицо: ${columnData.person}`}
                    {columnData.verbGender && ` Род гл.: ${columnData.verbGender}`}
                  </div>
                )}
                {config.database === 'verbs' && columnData.wordData?.selectedForm && (
                  <div className="text-xs text-purple-600 mt-1">
                    Форма: {
                      columnData.wordData.selectedForm.tense === 'present' ? 'наст.вр.' :
                      columnData.wordData.selectedForm.tense === 'past' ? 'прош.вр.' :
                      columnData.wordData.selectedForm.tense === 'future' ? 'буд.вр.' :
                      columnData.wordData.selectedForm.tense === 'imperative' ? 'повел.' :
                      'инф.'
                    }
                    {columnData.wordData.selectedForm.person && 
                      columnData.wordData.selectedForm.person !== 'он' && 
                      columnData.wordData.selectedForm.person !== 'она' && 
                      columnData.wordData.selectedForm.person !== 'оно' && 
                      `, ${columnData.wordData.selectedForm.person}`}
                    {columnData.wordData.selectedForm.gender && 
                      `, ${columnData.wordData.selectedForm.gender === 'masculine' ? 'муж.род' : 
                                columnData.wordData.selectedForm.gender === 'feminine' ? 'жен.род' : 'сред.род'}`}
                  </div>
                )}
              </div>
              <button
                onClick={() => updateColumnData({
                  word: '',
                  wordData: null
                })}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const VerbConjugationModal = ({ isOpen, onClose, word, onSave }) => {
  const [conjugation, setConjugation] = useState({
    present: {
      я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
    },
    past: {
      я_м: '', я_ж: '', я_с: '',
      ты_м: '', ты_ж: '', ты_с: '',
      он: '', она: '', оно: '',
      мы: '', вы: '', они: ''
    },
    future: {
      я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
    },
    imperative: {
      ты: '', вы: ''
    },
    infinitive: '',
    baseForm: ''
  });

  useEffect(() => {
    if (word) {
      loadConjugation();
    }
  }, [word]);

  const loadConjugation = async () => {
    try {
      if (!word?.imageBase) {
        console.log('No imageBase for verb');
        return;
      }

      console.log('Loading conjugation for:', word.imageBase);
      
      const response = await fetch(`${API_BASE_URL}/verb-conjugation/${word.imageBase}`);
      
      if (!response.ok) {
        console.error('Error response:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Loaded conjugation data:', data);
      
      // Проверяем, есть ли сохраненные данные
      if (data && (Object.keys(data.present || {}).length > 0 || 
                   Object.keys(data.past || {}).length > 0 || 
                   Object.keys(data.future || {}).length > 0)) {
        setConjugation({
          present: data.present || {
            я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
          },
          past: data.past || {
            я_м: '', я_ж: '', я_с: '',
            ты_м: '', ты_ж: '', ты_с: '',
            он: '', она: '', оно: '',
            мы: '', вы: '', они: ''
          },
          future: data.future || {
            я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
          },
          imperative: data.imperative || {
            ты: '', вы: ''
          },
          infinitive: data.infinitive || '',
          baseForm: data.baseForm || ''
        });
      } else {
        console.log('No existing conjugation data found');
        // Используем инфинитив из переданного слова
        const infinitive = word.translations?.russian || word.word || '';
        setConjugation(prev => ({
          ...prev,
          infinitive: infinitive,
          baseForm: infinitive
        }));
      }
    } catch (error) {
      console.error('Error loading conjugation:', error);
    }
  };

  const handleSave = async () => {
    try {
      // ВАЖНО: Используем imageBase из переданного слова
      if (!word?.imageBase) {
        alert('Ошибка: отсутствует идентификатор глагола');
        return;
      }

      console.log('Saving conjugation for:', word.imageBase, conjugation);

      const response = await fetch(`${API_BASE_URL}/verb-conjugation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: word.imageBase, // ИСПРАВЛЕНО: используем переданный imageBase
          present: conjugation.present,
          past: conjugation.past,
          future: conjugation.future,
          imperative: conjugation.imperative,
          infinitive: conjugation.infinitive || word.translations?.russian || word.word || '',
          baseForm: conjugation.baseForm || word.translations?.russian || word.word || ''
        })
      });
      
      if (response.ok) {
        const savedData = await response.json();
        console.log('Verb conjugation saved successfully:', savedData);
        
        // Вызываем callback с обновленными данными
        if (onSave) {
          onSave(savedData);
        }
        
        alert('✅ Спряжение глагола успешно сохранено!');
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save verb conjugation');
      }
    } catch (error) {
      console.error('Error saving conjugation:', error);
      alert('❌ Ошибка сохранения спряжения: ' + error.message);
    }
  };

  const handleChange = (tense, person, value) => {
    setConjugation(prev => ({
      ...prev,
      [tense]: {
        ...prev[tense],
        [person]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Спряжение глагола: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>

        {/* Инфинитив */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium mb-1">Инфинитив</label>
          <input
            type="text"
            value={conjugation.infinitive}
            onChange={(e) => setConjugation({...conjugation, infinitive: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Инфинитив глагола (например: бежать)"
          />
        </div>

        {/* НАСТОЯЩЕЕ ВРЕМЯ */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3 bg-blue-100 p-2 rounded">Настоящее время</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">я</label>
              <input
                type="text"
                value={conjugation.present.я}
                onChange={(e) => handleChange('present', 'я', e.target.value)}
                className="p-2 border rounded"
                placeholder="бегу"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">ты</label>
              <input
                type="text"
                value={conjugation.present.ты}
                onChange={(e) => handleChange('present', 'ты', e.target.value)}
                className="p-2 border rounded"
                placeholder="бежишь"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">он</label>
              <input
                type="text"
                value={conjugation.present.он}
                onChange={(e) => handleChange('present', 'он', e.target.value)}
                className="p-2 border rounded"
                placeholder="бежит"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">она</label>
              <input
                type="text"
                value={conjugation.present.она}
                onChange={(e) => handleChange('present', 'она', e.target.value)}
                className="p-2 border rounded"
                placeholder="бежит"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">оно</label>
              <input
                type="text"
                value={conjugation.present.оно}
                onChange={(e) => handleChange('present', 'оно', e.target.value)}
                className="p-2 border rounded"
                placeholder="бежит"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">мы</label>
              <input
                type="text"
                value={conjugation.present.мы}
                onChange={(e) => handleChange('present', 'мы', e.target.value)}
                className="p-2 border rounded"
                placeholder="бежим"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">вы</label>
              <input
                type="text"
                value={conjugation.present.вы}
                onChange={(e) => handleChange('present', 'вы', e.target.value)}
                className="p-2 border rounded"
                placeholder="бежите"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">они</label>
              <input
                type="text"
                value={conjugation.present.они}
                onChange={(e) => handleChange('present', 'они', e.target.value)}
                className="p-2 border rounded"
                placeholder="бегут"
              />
            </div>
          </div>
        </div>

        {/* Прошедшее время */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3 bg-green-100 p-2 rounded">Прошедшее время</h4>
          
          <div>
            {/* Левая колонка - я, ты с родами */}
            <div className="space-y-3">
              <div className="font-medium text-sm">Я</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">мужской</label>
                  <input
                    type="text"
                    value={conjugation.past.я_м || ''}
                    onChange={(e) => handleChange('past', 'я_м', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежал"
                  />
                </div>
                <div>
                  <label className="text-xs">женский</label>
                  <input
                    type="text"
                    value={conjugation.past.я_ж || ''}
                    onChange={(e) => handleChange('past', 'я_ж', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежала"
                  />
                </div>
                <div>
                  <label className="text-xs">средний</label>
                  <input
                    type="text"
                    value={conjugation.past.я_с || ''}
                    onChange={(e) => handleChange('past', 'я_с', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежало"
                  />
                </div>
              </div>

              <div className="font-medium text-sm mt-2">Ты</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">мужской</label>
                  <input
                    type="text"
                    value={conjugation.past.ты_м || ''}
                    onChange={(e) => handleChange('past', 'ты_м', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежал"
                  />
                </div>
                <div>
                  <label className="text-xs">женский</label>
                  <input
                    type="text"
                    value={conjugation.past.ты_ж || ''}
                    onChange={(e) => handleChange('past', 'ты_ж', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежала"
                  />
                </div>
                <div>
                  <label className="text-xs">средний</label>
                  <input
                    type="text"
                    value={conjugation.past.ты_с || ''}
                    onChange={(e) => handleChange('past', 'ты_с', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежало"
                  />
                </div>
              </div>
            </div>

            {/* Правая колонка - он, она, оно, мы, вы, они */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm">он</label>
                  <input
                    type="text"
                    value={conjugation.past.он || ''}
                    onChange={(e) => handleChange('past', 'он', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежал"
                  />
                </div>
                <div>
                  <label className="text-sm">она</label>
                  <input
                    type="text"
                    value={conjugation.past.она || ''}
                    onChange={(e) => handleChange('past', 'она', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежала"
                  />
                </div>
                <div>
                  <label className="text-sm">оно</label>
                  <input
                    type="text"
                    value={conjugation.past.оно || ''}
                    onChange={(e) => handleChange('past', 'оно', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежало"
                  />
                </div>
                <div>
                  <label className="text-sm">мы</label>
                  <input
                    type="text"
                    value={conjugation.past.мы || ''}
                    onChange={(e) => handleChange('past', 'мы', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежали"
                  />
                </div>
                <div>
                  <label className="text-sm">вы</label>
                  <input
                    type="text"
                    value={conjugation.past.вы || ''}
                    onChange={(e) => handleChange('past', 'вы', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежали"
                  />
                </div>
                <div>
                  <label className="text-sm">они</label>
                  <input
                    type="text"
                    value={conjugation.past.они || ''}
                    onChange={(e) => handleChange('past', 'они', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="бежали"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* БУДУЩЕЕ ВРЕМЯ */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3 bg-yellow-100 p-2 rounded">Будущее время</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">я</label>
              <input
                type="text"
                value={conjugation.future.я}
                onChange={(e) => handleChange('future', 'я', e.target.value)}
                className="p-2 border rounded"
                placeholder="побегу"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">ты</label>
              <input
                type="text"
                value={conjugation.future.ты}
                onChange={(e) => handleChange('future', 'ты', e.target.value)}
                className="p-2 border rounded"
                placeholder="побежишь"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">он</label>
              <input
                type="text"
                value={conjugation.future.он}
                onChange={(e) => handleChange('future', 'он', e.target.value)}
                className="p-2 border rounded"
                placeholder="побежит"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">она</label>
              <input
                type="text"
                value={conjugation.future.она}
                onChange={(e) => handleChange('future', 'она', e.target.value)}
                className="p-2 border rounded"
                placeholder="побежит"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">оно</label>
              <input
                type="text"
                value={conjugation.future.оно}
                onChange={(e) => handleChange('future', 'оно', e.target.value)}
                className="p-2 border rounded"
                placeholder="побежит"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">мы</label>
              <input
                type="text"
                value={conjugation.future.мы}
                onChange={(e) => handleChange('future', 'мы', e.target.value)}
                className="p-2 border rounded"
                placeholder="побежим"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">вы</label>
              <input
                type="text"
                value={conjugation.future.вы}
                onChange={(e) => handleChange('future', 'вы', e.target.value)}
                className="p-2 border rounded"
                placeholder="побежите"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">они</label>
              <input
                type="text"
                value={conjugation.future.они}
                onChange={(e) => handleChange('future', 'они', e.target.value)}
                className="p-2 border rounded"
                placeholder="побегут"
              />
            </div>
          </div>
        </div>

        {/* Повелительное наклонение */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-3 bg-purple-100 p-2 rounded">Повелительное наклонение</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ты (ед.ч.)</label>
              <input
                type="text"
                value={conjugation.imperative.ты || ''}
                onChange={(e) => handleChange('imperative', 'ты', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="беги"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">вы (мн.ч.)</label>
              <input
                type="text"
                value={conjugation.imperative.вы || ''}
                onChange={(e) => handleChange('imperative', 'вы', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="бегите"
              />
            </div>
          </div>
        </div>

        {/* Подсказки */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">Подсказки по временам:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Настоящее:</strong> что делает?</p>
              <p className="text-xs text-gray-600">бежит, говорит, читает</p>
            </div>
            <div>
              <p><strong>Прошедшее:</strong> что делал?</p>
              <p className="text-xs text-gray-600">бежал, говорил, читал</p>
            </div>
            <div>
              <p><strong>Будущее:</strong> что будет делать?</p>
              <p className="text-xs text-gray-600">побежит, скажет, прочитает</p>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <p><strong>Повелительное:</strong> команда, просьба</p>
            <p className="text-xs text-gray-600">беги, говори, читай</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить спряжение
          </button>
        </div>
      </div>
    </div>
  );
};
// Добавьте этот компонент перед AdminPage
// Модальное окно для управления падежами числительных
// Компонент для выбора рода в виде трех чекбоксов
// Компонент для выбора рода
const GenderCheckboxes = ({ imageBase, currentGender, onGenderChange }) => {
  const [loading, setLoading] = useState(false);

  const handleGenderClick = async (selectedGender) => {
    // Если кликнули по уже выбранному - снимаем выбор
    const newGender = currentGender === selectedGender ? '' : selectedGender;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/noun-gender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase, gender: newGender })
      });
      
      if (response.ok) {
        onGenderChange(imageBase, newGender); // Сообщаем родителю об изменении
      }
    } catch (error) {
      console.error('Error saving gender:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {/* Мужской род */}
      <button
        onClick={() => handleGenderClick('мужской')}
        disabled={loading}
        className={`w-6 h-6 rounded flex items-center justify-center transition-all
          ${currentGender === 'мужской' 
            ? 'bg-blue-500 text-white hover:bg-blue-600' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-300'}`}
        title="Мужской род"
      >
        {currentGender === 'мужской' ? '✓' : ''}
      </button>
      
      {/* Женский род */}
      <button
        onClick={() => handleGenderClick('женский')}
        disabled={loading}
        className={`w-6 h-6 rounded flex items-center justify-center transition-all
          ${currentGender === 'женский' 
            ? 'bg-pink-500 text-white hover:bg-pink-600' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-300'}`}
        title="Женский род"
      >
        {currentGender === 'женский' ? '✓' : ''}
      </button>
      
      {/* Средний род */}
      <button
        onClick={() => handleGenderClick('средний')}
        disabled={loading}
        className={`w-6 h-6 rounded flex items-center justify-center transition-all
          ${currentGender === 'средний' 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-300'}`}
        title="Средний род"
      >
        {currentGender === 'средний' ? '✓' : ''}
      </button>
      
      {loading && <span className="text-xs text-gray-400">...</span>}
    </div>
  );
};
const NumeralCaseManagementModal = ({ isOpen, onClose, word, onSave, language = 'русский' }) => {
  const [cases, setCases] = useState({
    nominative: '',
    genitive: '',
    dative: '',
    accusative: '',
    instrumental: '',
    prepositional: ''
  });
  const [prepositionalWithPreposition, setPrepositionalWithPreposition] = useState('');

  useEffect(() => {
    if (word) {
      loadCases();
    }
  }, [word]);

  const loadCases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/numeral-cases/${word.imageBase}`);
      const data = await response.json();
      if (data.cases) {
        setCases(data.cases);
        setPrepositionalWithPreposition(data.prepositionalWithPreposition || '');
      } else {
        // Если нет сохраненных падежей, используем именительный как базовый
        const baseForm = word.translations?.russian || word.word || '';
        setCases(prev => ({ ...prev, nominative: baseForm }));
      }
    } catch (error) {
      console.error('Error loading numeral cases:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/numeral-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: word.imageBase,
          cases: cases,
          prepositionalWithPreposition: prepositionalWithPreposition,
          language: 'русский'
        })
      });
      
      if (response.ok) {
        const savedData = await response.json();
        console.log('Numeral cases saved successfully:', savedData);
        
        if (onSave) {
          onSave(savedData);
        }
        
        alert('Падежи числительного успешно сохранены!');
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save numeral cases');
      }
    } catch (error) {
      console.error('Error saving numeral cases:', error);
      alert('Ошибка сохранения падежей: ' + error.message);
    }
  };

  const handleCaseChange = (caseType, value) => {
    setCases(prev => ({
      ...prev,
      [caseType]: value
    }));
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный', question: 'кто? что?' },
    { key: 'genitive', label: 'Родительный', question: 'кого? чего?' },
    { key: 'dative', label: 'Дательный', question: 'кому? чему?' },
    { key: 'accusative', label: 'Винительный', question: 'кого? что?' },
    { key: 'instrumental', label: 'Творительный', question: 'кем? чем?' },
    { key: 'prepositional', label: 'Предложный', question: 'о ком? о чём?' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения числительного: <span className="text-blue-600">{word?.translations?.russian || word?.word}</span>
        </h3>
        
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <span className="font-medium">Язык падежей:</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language}
            </span>
          </div>
        </div>

        {/* Таблица падежей */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-sm font-medium w-1/4">Падеж</th>
                <th className="border border-gray-300 p-2 text-sm font-medium w-1/4">Вопросы</th>
                <th className="border border-gray-300 p-2 text-sm font-medium w-1/2">Форма</th>
              </tr>
            </thead>
            <tbody>
              {caseTypes.map((caseType) => (
                <tr key={caseType.key}>
                  <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                    {caseType.label}
                  </td>
                  <td className="border border-gray-300 p-2 text-sm text-gray-600">
                    {caseType.question}
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases[caseType.key] || ''}
                      onChange={(e) => handleCaseChange(caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                      placeholder={`${caseType.label} падеж`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Специальное поле для предложного падежа с предлогом */}
        {/* <div className="mt-4 p-4 border rounded bg-yellow-50">
          <h4 className="font-semibold text-yellow-800 mb-2">Предложный падеж с предлогом</h4>
          <p className="text-sm text-yellow-700 mb-2">
            Например: "о восьми", "в пяти", "на двух"
          </p>
          <input
            type="text"
            value={prepositionalWithPreposition}
            onChange={(e) => setPrepositionalWithPreposition(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="о восьми, в пяти, на двух..."
          />
        </div> */}

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-semibold text-green-800 mb-1">Примеры склонения числительных:</h4>
          <div className="text-sm text-green-700">
            <div><strong>Именительный:</strong> восемь (есть)</div>
            <div><strong>Родительный:</strong> восьми (нет)</div>
            <div><strong>Дательный:</strong> восьми (дать)</div>
            <div><strong>Винительный:</strong> восемь (вижу)</div>
            <div><strong>Творительный:</strong> восемью (горжусь)</div>
            <div><strong>Предложный:</strong> о восьми (думаю)</div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить падежи
          </button>
        </div>
      </div>
    </div>
  );
};
const VerbFormSelector = ({ config, onConfigChange }) => {
  console.log('VerbFormSelector received config:', config);
  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded mt-2">
      <h5 className="font-medium text-sm">Форма глагола:</h5>
      
      {/* Выбор времени */}
      <div>
        <label className="text-xs text-gray-600">Время</label>
        <select
          value={config.tense || ''}
          onChange={(e) => onConfigChange('tense', e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          <option value="">Инфинитив</option>
          <option value="present">Настоящее время</option>
          <option value="past">Прошедшее время</option>
          <option value="future">Будущее время</option>
          <option value="imperative">Повелительное наклонение</option>
        </select>
      </div>

      {/* Для настоящего/будущего времени - выбор лица */}
      {(config.tense === 'present' || config.tense === 'future') && (
        <div>
          <label className="text-xs text-gray-600">Лицо и число</label>
          <select
            value={config.person || ''}
            onChange={(e) => onConfigChange('person', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
                <option value="Выбор">Выберите лицо и число</option>
            <option value="я">1 лицо ед.ч. (я)</option>
            <option value="ты">2 лицо ед.ч. (ты)</option>
            <option value="он">3 лицо ед.ч. муж.род (он)</option>
            <option value="она">3 лицо ед.ч. жен.род (она)</option>
            <option value="оно">3 лицо ед.ч. сред.род (оно)</option>
            <option value="мы">1 лицо мн.ч. (мы)</option>
            <option value="вы">2 лицо мн.ч. (вы)</option>
            <option value="они">3 лицо мн.ч. (они)</option>
          </select>
        </div>
      )}

      {/* Для прошедшего времени - выбор рода */}
      {config.tense === 'past' && (
        <>
          <div>
            <label className="text-xs text-gray-600">Лицо</label>
            <select
              value={config.person || ''}
              onChange={(e) => onConfigChange('person', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
                <option value="Выбор">Выберите лицо и число</option>
              <option value="я">1 лицо (я)</option>
              <option value="ты">2 лицо (ты)</option>
              <option value="он">3 лицо муж.род (он)</option>
              <option value="она">3 лицо жен.род (она)</option>
              <option value="оно">3 лицо сред.род (оно)</option>
              <option value="мы">1 лицо мн.ч. (мы)</option>
              <option value="вы">2 лицо мн.ч. (вы)</option>
              <option value="они">3 лицо мн.ч. (они)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Род (для ед.ч.)</label>
            <select
              value={config.gender || ''}
              onChange={(e) => onConfigChange('gender', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="">Мужской</option>
              <option value="masculine">Мужской</option>
              <option value="feminine">Женский</option>
              <option value="neuter">Средний</option>
            </select>
          </div>
        </>
      )}

      {/* Для повелительного наклонения */}
      {config.tense === 'imperative' && (
        <div>
          <label className="text-xs text-gray-600">Число</label>
          <select
            value={config.imperativeForm || ''}
            onChange={(e) => onConfigChange('imperativeForm', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
                                            <option value="Выбор">Выберите наклонение</option>

            <option value="ты">Единственное (ты)</option>
            <option value="вы">Множественное (вы)</option>
          </select>
        </div>
      )}
    </div>
  );
};

// ============================================
// Компонент QuestionWordCaseManagementModal - падежи для вопросительных слов
// ============================================
const QuestionWordCaseManagementModal = ({ isOpen, onClose, word, onSave, language = 'русский' }) => {
  const [cases, setCases] = useState({
    singular: {
      masculine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      feminine: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      },
      neuter: {
        nominative: '',
        genitive: '',
        dative: '',
        accusative: '',
        instrumental: '',
        prepositional: ''
      }
    },
    plural: {
      nominative: '',
      genitive: '',
      dative: '',
      accusative: '',
      instrumental: '',
      prepositional: ''
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && word) {
      console.log('Modal opened with word:', word);
      loadCases();
    } else {
      // Сбрасываем состояние при закрытии
      setSaveSuccess(false);
    }
  }, [isOpen, word]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      
      // ВАЖНО: Используем правильный imageBase
      // Если у слова есть реальный imageBase из таблицы, используем его
      // Иначе используем временный
      const imageBase = word.imageBase || word.id || `question_word_${Date.now()}`;
      
      console.log(`Loading cases for imageBase: ${imageBase}`);
      
      const response = await fetch(`${API_BASE_URL}/question-word-cases/${imageBase}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded data:', data);
      
      if (data && (data.singular || data.plural)) {
        setCases({
          singular: data.singular || {
            masculine: {}, feminine: {}, neuter: {}
          },
          plural: data.plural || {}
        });
      } else {
        // Если данных нет, оставляем пустую форму
        console.log('No existing cases found');
      }
      
    } catch (error) {
      console.error('Error loading question word cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // ВАЖНО: Используем тот же imageBase, что и при загрузке
      const imageBase = word.imageBase || word.id || `question_word_${Date.now()}`;
      
      console.log(`Saving cases for imageBase: ${imageBase}`);
      console.log('Cases data:', cases);
      
      const response = await fetch(`${API_BASE_URL}/question-word-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase: imageBase,
          singular: cases.singular,
          plural: cases.plural,
          language: 'русский'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save question word cases');
      }
      
      const savedData = await response.json();
      console.log('Save response:', savedData);
      
      setSaveSuccess(true);
      
      if (onSave) {
        onSave(savedData);
      }
      
      alert('✅ Падежи вопросительного слова успешно сохранены!');
      
    } catch (error) {
      console.error('Error saving question word cases:', error);
      alert('❌ Ошибка сохранения падежей: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseChange = (gender, number, caseType, value) => {
    if (gender) {
      setCases(prev => ({
        ...prev,
        singular: {
          ...prev.singular,
          [gender]: {
            ...prev.singular[gender],
            [caseType]: value
          }
        }
      }));
    } else {
      setCases(prev => ({
        ...prev,
        plural: {
          ...prev.plural,
          [caseType]: value
        }
      }));
    }
  };

  if (!isOpen) return null;

  const caseTypes = [
    { key: 'nominative', label: 'Именительный', question: 'кто? что?' },
    { key: 'genitive', label: 'Родительный', question: 'кого? чего?' },
    { key: 'dative', label: 'Дательный', question: 'кому? чему?' },
    { key: 'accusative', label: 'Винительный', question: 'кого? что?' },
    { key: 'instrumental', label: 'Творительный', question: 'кем? чем?' },
    { key: 'prepositional', label: 'Предложный', question: 'о ком? о чём?' }
  ];

  const genders = [
    { key: 'masculine', label: 'Мужской род' },
    { key: 'feminine', label: 'Женский род' },
    { key: 'neuter', label: 'Средний род' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          Склонения вопросительного слова: <span className="text-blue-600">{word?.translations?.russian || word?.word || 'КАКОЙ'}</span>
        </h3>
        
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium">ID:</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                {word?.imageBase || word?.id || 'новый'}
              </span>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Базовая форма в таблице: мужской род, единственное число, именительный падеж
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-4 text-blue-600">
            Загрузка...
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-green-700">
            ✓ Данные успешно загружены из базы
          </div>
        )}

        {/* Таблица падежей */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              {/* Заголовок для единственного числа */}
              <tr>
                <th colSpan="19" className="border border-gray-300 p-2 text-center font-semibold bg-blue-100">
                  Единственное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th rowSpan="2" className="border border-gray-300 p-2 text-sm font-medium">Падеж</th>
                {genders.map(gender => (
                  <th key={gender.key} colSpan="6" className="border border-gray-300 p-2 text-center font-semibold">
                    {gender.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <th key={`${gender.key}-${caseType.key}`} className="border border-gray-300 p-2 text-xs font-medium">
                      {caseType.label}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                  Формы
                </td>
                {genders.map(gender => (
                  caseTypes.map(caseType => (
                    <td key={`input-${gender.key}-${caseType.key}`} className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={cases.singular[gender.key]?.[caseType.key] || ''}
                        onChange={(e) => handleCaseChange(gender.key, 'singular', caseType.key, e.target.value)}
                        className="w-full p-2 border-none focus:outline-none focus:bg-blue-50"
                        placeholder={`${gender.label.slice(0, 3)}. ${caseType.label}`}
                      />
                    </td>
                  ))
                ))}
              </tr>
            </tbody>
          </table>

          {/* Таблица для множественного числа */}
          <table className="min-w-full border-collapse border border-gray-300 mt-6">
            <thead>
              <tr>
                <th colSpan="7" className="border border-gray-300 p-2 text-center font-semibold bg-green-100">
                  Множественное число
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-sm font-medium">Падеж</th>
                {caseTypes.map(caseType => (
                  <th key={`plural-${caseType.key}`} className="border border-gray-300 p-2 text-sm font-medium">
                    {caseType.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                  Вопросы
                </td>
                {caseTypes.map(caseType => (
                  <td key={`plural-question-${caseType.key}`} className="border border-gray-300 p-2 text-xs text-gray-600">
                    {caseType.question}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                  Формы
                </td>
                {caseTypes.map(caseType => (
                  <td key={`plural-input-${caseType.key}`} className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={cases.plural[caseType.key] || ''}
                      onChange={(e) => handleCaseChange(null, 'plural', caseType.key, e.target.value)}
                      className="w-full p-2 border-none focus:outline-none focus:bg-green-50"
                      placeholder={`мн.ч. ${caseType.label}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Подсказка */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-1">Примеры склонения вопросительных слов:</h4>
          <div className="text-sm text-yellow-700">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Именительный:</strong> какой? какая? какое? какие?</div>
              <div><strong>Родительный:</strong> какого? какой? какого? каких?</div>
              <div><strong>Дательный:</strong> какому? какой? какому? каким?</div>
              <div><strong>Винительный:</strong> какого? какую? какое? какие?</div>
              <div><strong>Творительный:</strong> каким? какой? каким? какими?</div>
              <div><strong>Предложный:</strong> о каком? о какой? о каком? о каких?</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={isLoading}
          >
            Отмена
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'Сохранение...' : 'Сохранить падежи'}
          </button>
        </div>
      </div>
    </div>
  );
};
// ============================================
// Компонент TextModuleTable (Таблица текстов)
// ============================================
const TextModuleTable = ({ texts, onEdit, onDelete }) => {
  if (!texts || texts.length === 0) {
    return <div className="text-center py-4 text-gray-500">Нет добавленных текстов</div>;
  }

  return (
    <div className="mt-6">
      <h5 className="font-semibold mb-2">Список текстов в модуле:</h5>
      <div className="space-y-4">
        {texts.map((text, index) => (
          <div key={text._id || index} className="border rounded-lg p-4 bg-gray-50 relative">
            <button
              onClick={() => onDelete(text._id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
              title="Удалить текст"
            >
              ×
            </button>
            <div className="flex gap-4">
              {text.image && (
                <div className="flex-shrink-0">
                  <img
                    src={text.image}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded border"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-gray-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                  {text.text || <span className="text-gray-400">(текст отсутствует)</span>}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Символов: {text.text?.length || 0}/2000
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onEdit(text)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// ============================================
// Компонент VideoTable (Таблица видео)
// ============================================
const VideoTable = ({ videos, onEdit, onDelete }) => {
  if (!videos || videos.length === 0) {
    return <div className="text-center py-4 text-gray-500">Нет добавленных видео</div>;
  }

  return (
    <div className="mt-8">
      <h4 className="font-semibold mb-3">Существующие видео:</h4>
      <div className="space-y-4">
        {videos.map((video, index) => (
          <div key={video._id} className="border rounded-lg p-4 bg-gray-50 relative">
            <button
              onClick={() => onDelete(video._id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
              title="Удалить видео"
            >
              ×
            </button>
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-medium">{video.title}</h5>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  {video.duration > 0 && (
                    <>
                      <span>Длительность: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      <span>•</span>
                    </>
                  )}
                  {video.fileSize && (
                    <span>{(video.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  )}
                </div>
              </div>
            </div>
            
            {video.videoUrl && video.videoUrl !== 'pending' && (
              <div className="mt-3">
                <video controls className="w-full max-h-64 rounded">
                  <source src={video.videoUrl} type={video.mimeType || 'video/mp4'} />
                  Ваш браузер не поддерживает видео тег.
                </video>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <h6 className="text-sm font-medium mb-1">Оригинальные титры:</h6>
                <p className="text-sm text-gray-600 line-clamp-3">{video.originalTranscript}</p>
              </div>
              
              {video.hintTranscript && (
                <div>
                  <h6 className="text-sm font-medium mb-1">Перевод:</h6>
                  <p className="text-sm text-gray-600 line-clamp-3">{video.hintTranscript}</p>
                </div>
              )}
            </div>
            
            {video.hint && (
              <div className="mt-2 pt-2 border-t">
                <h6 className="text-sm font-medium mb-1">Подсказка:</h6>
                <p className="text-sm text-gray-600">{video.hint}</p>
              </div>
            )}
            
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onEdit(video)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// ============================================
// Компонент GrammarTableCell (Ячейка таблицы с выбором слова)
// ============================================
// ============================================
// Компонент GrammarTableCell (Ячейка таблицы с выбором слова)
// ============================================
// ============================================
// Компонент GrammarTableCell (Ячейка таблицы с выбором слова)
// ============================================
// ============================================
// Компонент GrammarTableCell (Ячейка таблицы с полной поддержкой фильтров)
// ============================================
// ============================================
// Компонент GrammarTableCell (Ячейка таблицы с полной поддержкой фильтров)
// ============================================
const GrammarTableCell = ({ 
  value, 
  onSelect, 
  onClear, 
  database, 
  filters, 
  rowIndex, 
  colIndex, 
  lessonData,
  onLessonChange, // НОВОЕ: функция для изменения темы
  getThemesByDatabase // НОВОЕ: список доступных тем
}) => {
  const [showWordSelector, setShowWordSelector] = useState(false);
  const [cellFilters, setCellFilters] = useState(filters || {});
  const [cellLesson, setCellLesson] = useState(value?.lesson || '');
  
  // Обновляем локальное состояние при изменении value извне
  useEffect(() => {
    setCellLesson(value?.lesson || '');
  }, [value?.lesson]);
  
  const handleLessonChange = (e) => {
    const newLesson = e.target.value;
    setCellLesson(newLesson);
    if (onLessonChange) {
      onLessonChange(rowIndex, colIndex, newLesson);
    }
  };
  
  return (
    <div className="relative">
      {value?.word ? (
        <div className="p-2 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-green-800">{value.word}</span>
            <button
              onClick={onClear}
              className="text-red-500 hover:text-red-700 ml-2 text-sm"
            >
              ×
            </button>
          </div>
          
          {/* Отображение выбранной темы */}
          {value.lesson && (
            <div className="text-xs text-blue-600 mb-1">
              Тема: {value.lesson}
            </div>
          )}
          
          {/* Отображение примененных фильтров */}
          {(value.number || value.gender || value.case || value.tense || value.person) && (
            <div className="text-xs text-gray-600 mt-1 space-y-0.5">
              {value.number && <div>Число: {value.number}</div>}
              {value.gender && <div>Род: {value.gender}</div>}
              {value.case && <div>Падеж: {value.case}</div>}
              {value.tense && <div>Время: {value.tense}</div>}
              {value.person && <div>Лицо: {value.person}</div>}
            </div>
          )}
          
          {value.database && (
            <span className="text-xs text-green-600 mt-1 block">
              ({getDatabaseDisplayName(value.database)})
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Выбор темы (урока) - показываем всегда, кроме специальных БД */}
          {database && database !== 'prepositions' && database !== 'question-words'  && database !== 'pronouns' && database !== 'numerals' && database !== 'numeral' && (
            <select
              value={cellLesson}
              onChange={handleLessonChange}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Выберите тему</option>
              {getThemesByDatabase(database).map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          )}
          
          {/* Фильтры в зависимости от типа базы данных */}
          {database && database !== 'prepositions' && database !== 'question-words' && (
            <div className="grid grid-cols-2 gap-1 text-xs">
              {/* Для существительных */}
              {database === 'nouns' && (
                <>
                  <select
                    value={cellFilters.number || ''}
                    onChange={(e) => setCellFilters({...cellFilters, number: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="">Число</option>
                    <option value="единственное">Ед.ч</option>
                    <option value="множественное">Мн.ч</option>
                  </select>
                  <select
                    value={cellFilters.case || ''}
                    onChange={(e) => setCellFilters({...cellFilters, case: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="">Падеж</option>
                    <option value="именительный">Им.</option>
                    <option value="родительный">Род.</option>
                    <option value="дательный">Дат.</option>
                    <option value="винительный">Вин.</option>
                    <option value="творительный">Тв.</option>
                    <option value="предложный">Пр.</option>
                  </select>
                  <select
                    value={cellFilters.gender || ''}
                    onChange={(e) => setCellFilters({...cellFilters, gender: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                  >
                    <option value="">Род</option>
                    <option value="мужской">Муж.</option>
                    <option value="женский">Жен.</option>
                    <option value="средний">Ср.</option>
                  </select>
                </>
              )}
              
              {/* Для прилагательных */}
              {database === 'adjectives' && (
                <>
                  <select
                    value={cellFilters.number || ''}
                    onChange={(e) => setCellFilters({...cellFilters, number: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="">Число</option>
                    <option value="единственное">Ед.ч</option>
                    <option value="множественное">Мн.ч</option>
                  </select>
                  <select
                    value={cellFilters.gender || ''}
                    onChange={(e) => setCellFilters({...cellFilters, gender: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="">Род</option>
                    <option value="мужской">Муж.</option>
                    <option value="женский">Жен.</option>
                    <option value="средний">Ср.</option>
                  </select>
                  <select
                    value={cellFilters.case || ''}
                    onChange={(e) => setCellFilters({...cellFilters, case: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                  >
                    <option value="">Падеж</option>
                    <option value="именительный">Им.</option>
                    <option value="родительный">Род.</option>
                    <option value="дательный">Дат.</option>
                    <option value="винительный">Вин.</option>
                    <option value="творительный">Тв.</option>
                    <option value="предложный">Пр.</option>
                  </select>
                </>
              )}
              
              {/* Для глаголов */}
              {database === 'verbs' && (
                <>
                  <select
                    value={cellFilters.tense || ''}
                    onChange={(e) => setCellFilters({...cellFilters, tense: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                  >
                    <option value="">Время</option>
                    <option value="present">Наст.</option>
                    <option value="past">Прош.</option>
                    <option value="future">Буд.</option>
                    <option value="imperative">Повел.</option>
                  </select>
                  {cellFilters.tense && cellFilters.tense !== 'imperative' && (
                    <select
                      value={cellFilters.person || ''}
                      onChange={(e) => setCellFilters({...cellFilters, person: e.target.value})}
                      className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                    >
                      <option value="">Лицо</option>
                      <option value="я">я</option>
                      <option value="ты">ты</option>
                      <option value="он">он</option>
                      <option value="она">она</option>
                      <option value="оно">оно</option>
                      <option value="мы">мы</option>
                      <option value="вы">вы</option>
                      <option value="они">они</option>
                    </select>
                  )}
                  {cellFilters.tense === 'past' && (
                    <select
                      value={cellFilters.verbGender || ''}
                      onChange={(e) => setCellFilters({...cellFilters, verbGender: e.target.value})}
                      className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                    >
                      <option value="">Род</option>
                      <option value="masculine">Муж.</option>
                      <option value="feminine">Жен.</option>
                      <option value="neuter">Ср.</option>
                    </select>
                  )}
                  {cellFilters.tense === 'imperative' && (
                    <select
                      value={cellFilters.imperativeForm || ''}
                      onChange={(e) => setCellFilters({...cellFilters, imperativeForm: e.target.value})}
                      className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                    >
                      <option value="">Число</option>
                      <option value="ты">ед.ч</option>
                      <option value="вы">мн.ч</option>
                    </select>
                  )}
                </>
              )}
              
              {/* Для местоимений */}
              {database === 'pronouns' && (
                <div className="col-span-2">
                  <PronounFormSelector
                    config={cellFilters}
                    onConfigChange={(field, value) => setCellFilters({...cellFilters, [field]: value})}
                  />
                </div>
              )}
              
              {/* Для числительных */}
              {database === 'numerals' && (
                <select
                  value={cellFilters.case || ''}
                  onChange={(e) => setCellFilters({...cellFilters, case: e.target.value})}
                  className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                >
                  <option value="">Падеж</option>
                  <option value="именительный">Им.</option>
                  <option value="родительный">Род.</option>
                  <option value="дательный">Дат.</option>
                  <option value="винительный">Вин.</option>
                  <option value="творительный">Тв.</option>
                  <option value="предложный">Пр.</option>
                </select>
              )}
              
              {/* Для причастий */}
              {database === 'participles' && (
                <>
                  <select
                    value={cellFilters.number || ''}
                    onChange={(e) => setCellFilters({...cellFilters, number: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="">Число</option>
                    <option value="единственное">Ед.ч</option>
                    <option value="множественное">Мн.ч</option>
                  </select>
                  <select
                    value={cellFilters.gender || ''}
                    onChange={(e) => setCellFilters({...cellFilters, gender: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                  >
                    <option value="">Род</option>
                    <option value="мужской">Муж.</option>
                    <option value="женский">Жен.</option>
                    <option value="средний">Ср.</option>
                  </select>
                  <select
                    value={cellFilters.case || ''}
                    onChange={(e) => setCellFilters({...cellFilters, case: e.target.value})}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs col-span-2"
                  >
                    <option value="">Падеж</option>
                    <option value="именительный">Им.</option>
                    <option value="родительный">Род.</option>
                    <option value="дательный">Дат.</option>
                    <option value="винительный">Вин.</option>
                    <option value="творительный">Тв.</option>
                    <option value="предложный">Пр.</option>
                  </select>
                </>
              )}
            </div>
          )}
          
          {/* Кнопка выбора слова (показываем только если выбрана БД и тема (где нужно)) */}
          {database && (
            <button
              onClick={() => {
                // Для БД, где нужна тема, проверяем её наличие
                const needsTheme = !['prepositions', 'question-words', 'gerunds','pronoun','numerals', 'numeral', 'pronouns'].includes(database);
                if (needsTheme && !cellLesson) {
                  alert('Сначала выберите урок');
                  return;
                }
                setShowWordSelector(true);
              }}
              className="w-full p-2 border border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-gray-500 text-sm"
            >
              + Выбрать слово
            </button>
          )}
        </div>
      )}
      
      {showWordSelector && (
        <div className="absolute z-50 mt-1 p-4 bg-white border rounded-lg shadow-lg min-w-[350px] max-h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Выберите слово</h4>
            <button
              onClick={() => setShowWordSelector(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <WordSelector
            studiedLanguage={lessonData?.studiedLanguage || 'русский'}
            theme={cellLesson} // Передаем выбранную тему
            database={database || 'nouns'}
            filters={cellFilters}
            onWordSelect={(selectedWord) => {
              onSelect(selectedWord, rowIndex, colIndex, cellFilters, cellLesson);
              setShowWordSelector(false);
            }}
            selectedWord={value?.wordData}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// Компонент GrammarTable (Таблица для редактирования)
// ============================================
// ============================================
// Компонент GrammarTable (Таблица для редактирования)
// ============================================
// ============================================
// Компонент GrammarTable (Таблица для редактирования)
// ============================================
// ============================================
// Компонент GrammarTable (Таблица для редактирования с поддержкой фильтров)
// ============================================
// ============================================
// Компонент GrammarTable (Таблица для редактирования с поддержкой тем)
// ============================================
const GrammarTable = ({ config, onConfigChange, lessonData, getAvailableThemes, getThemesByDatabase }) => {
  const { rows, columns, data } = config;
  const availableThemes = getAvailableThemes ? getAvailableThemes() : [];

  const handleWordSelect = (selectedWord, rowIndex, colIndex, filters, lesson) => {
    const newData = [...data];
    if (!newData[rowIndex]) newData[rowIndex] = [];
    
    newData[rowIndex][colIndex] = {
      word: selectedWord.displayWord || selectedWord.word,
      wordData: selectedWord,
      database: selectedWord.database || newData[rowIndex][colIndex]?.database || 'nouns',
      lesson: lesson || '',
      // Сохраняем примененные фильтры
      number: filters?.number || '',
      gender: filters?.gender || '',
      case: filters?.case || '',
      tense: filters?.tense || '',
      person: filters?.person || '',
      verbGender: filters?.verbGender || '',
      imperativeForm: filters?.imperativeForm || ''
    };
    
    onConfigChange({
      ...config,
      data: newData
    });
  };

  const handleClearCell = (rowIndex, colIndex) => {
    const newData = [...data];
    if (newData[rowIndex] && newData[rowIndex][colIndex]) {
      newData[rowIndex][colIndex] = {
        word: '',
        wordData: null,
        database: newData[rowIndex][colIndex]?.database || '',
        lesson: '',
        number: '',
        gender: '',
        case: '',
        tense: '',
        person: '',
        verbGender: '',
        imperativeForm: ''
      };
      onConfigChange({
        ...config,
        data: newData
      });
    }
  };

  const handleDatabaseChange = (rowIndex, colIndex, database) => {
    const newData = [...data];
    if (!newData[rowIndex]) newData[rowIndex] = [];
    if (!newData[rowIndex][colIndex]) {
      newData[rowIndex][colIndex] = {
        word: '',
        wordData: null,
        database: database,
        lesson: '',
        number: '',
        gender: '',
        case: '',
        tense: '',
        person: '',
        verbGender: '',
        imperativeForm: ''
      };
    } else {
      newData[rowIndex][colIndex].database = database;
      // Сбрасываем тему и фильтры при смене базы данных
      newData[rowIndex][colIndex].lesson = '';
      newData[rowIndex][colIndex].number = '';
      newData[rowIndex][colIndex].gender = '';
      newData[rowIndex][colIndex].case = '';
      newData[rowIndex][colIndex].tense = '';
      newData[rowIndex][colIndex].person = '';
      newData[rowIndex][colIndex].verbGender = '';
      newData[rowIndex][colIndex].imperativeForm = '';
      newData[rowIndex][colIndex].word = '';
      newData[rowIndex][colIndex].wordData = null;
    }
    onConfigChange({
      ...config,
      data: newData
    });
  };

  const handleLessonChange = (rowIndex, colIndex, lesson) => {
    const newData = [...data];
    if (newData[rowIndex] && newData[rowIndex][colIndex]) {
      newData[rowIndex][colIndex].lesson = lesson;
      // Сбрасываем слово при смене темы
      newData[rowIndex][colIndex].word = '';
      newData[rowIndex][colIndex].wordData = null;
      onConfigChange({
        ...config,
        data: newData
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Строка / Столбец</th>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <th key={colIndex} className="border border-gray-300 p-2">
                Столбец {colIndex + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                Строка {rowIndex + 1}
              </td>
              {Array.from({ length: columns }).map((_, colIndex) => {
                const cellData = data[rowIndex]?.[colIndex] || {};
                return (
                  <td key={colIndex} className="border border-gray-300 p-2">
                    <div className="space-y-2">
                      <select
                        value={cellData.database || ''}
                        onChange={(e) => handleDatabaseChange(rowIndex, colIndex, e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Выберите БД</option>
                        <option value="nouns">Существительные</option>
                        <option value="adjectives">Прилагательные</option>
                        <option value="verbs">Глаголы</option>
                        <option value="pronouns">Местоимения</option>
                        <option value="numerals">Числительные</option>
                        <option value="adverbs">Наречия</option>
                        <option value="prepositions">Предлоги, частицы</option>
                        <option value="question-words">Вопросительные слова</option>
                        <option value="gerunds">Деепричастия</option>
                        <option value="participles">Причастия</option>
                      </select>
                      
                      <GrammarTableCell
                        value={cellData}
                        onSelect={handleWordSelect}
                        onClear={() => handleClearCell(rowIndex, colIndex)}
                        onLessonChange={handleLessonChange}
                        database={cellData.database}
                        filters={{
                          number: cellData.number,
                          gender: cellData.gender,
                          case: cellData.case,
                          tense: cellData.tense,
                          person: cellData.person,
                          verbGender: cellData.verbGender,
                          imperativeForm: cellData.imperativeForm
                        }}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        lessonData={lessonData}
                        getThemesByDatabase={getThemesByDatabase}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// Компонент GrammarTable (для просмотра сохраненных данных)

const GrammarViewTable = ({ tableConfig }) => {
  const { rows, columns, data } = tableConfig;

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2"></th>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <th key={colIndex} className="border border-gray-300 p-2">
                Столбец {colIndex + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                Строка {rowIndex + 1}
              </td>
              {Array.from({ length: columns }).map((_, colIndex) => {
                const cell = data[rowIndex]?.[colIndex];
                return (
                  <td key={colIndex} className="border border-gray-300 p-2 align-top">
                    {cell?.word ? (
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        <div className="font-medium text-green-800">{cell.word}</div>
                        
                        {/* ОТОБРАЖЕНИЕ КАРТИНКИ */}
                        {cell.wordData?.imagePng && (
                          <div className="mt-2 flex justify-center">
                            <img
                              src={cell.wordData.imagePng}
                              alt={cell.word}
                              className="h-16 w-16 object-cover rounded border border-green-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Отображение темы */}
                        {cell.lesson && (
                          <div className="text-xs text-blue-600 mt-1">
                            Тема: {cell.lesson}
                          </div>
                        )}
                        
                        {/* Отображение примененных фильтров */}
                        {(cell.number || cell.gender || cell.case || cell.tense || cell.person) && (
                          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            {cell.number && <div>Число: {cell.number}</div>}
                            {cell.gender && <div>Род: {cell.gender}</div>}
                            {cell.case && <div>Падеж: {cell.case}</div>}
                            {cell.tense && <div>Время: {cell.tense}</div>}
                            {cell.person && <div>Лицо: {cell.person}</div>}
                          </div>
                        )}
                        
                        {/* Отображение типа базы данных */}
                        {cell.database && (
                          <span className="text-xs text-green-600 mt-1 block">
                            ({getDatabaseDisplayName(cell.database)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
// Компонент TestTable (добавьте перед return в AdminPage)
const TestTable = ({ tests, onEdit, onDelete }) => {
  if (!tests || tests.length === 0) {
    return <div className="text-center py-4 text-gray-500">Нет добавленных тестов</div>;
  }

  return (
    <div className="mt-6">
      <h5 className="font-semibold mb-2">Список тестов в модуле:</h5>
      <div className="space-y-4">
        {tests.map((test, index) => (
          <div key={test._id || index} className="border rounded-lg p-4 bg-gray-50 relative">
            <button
              onClick={() => onDelete(test._id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
              title="Удалить тест"
            >
              ×
            </button>
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-lg">Тест {index + 1}</h4>
                <div className="text-sm text-gray-500 mt-1">
                  Сетка: {test.config?.rows} × {test.config?.columns} = {test.config?.answerOptions?.length || 0} вариантов
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-1">Вопрос:</h5>
                <p className="text-gray-700">{test.config?.questionText || '—'}</p>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-1">Правильных ответов:</h5>
                <p className="text-green-600 font-medium">
                  {test.config?.answerOptions?.filter(opt => opt.isCorrect).length || 0}
                </p>
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onEdit(test)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default function AdminPage() {
const [newTestModuleConfig, setNewTestModuleConfig] = useState({
  rows: 3,
  columns: 2,
  questionColumnConfigs: [
    { database: 'nouns', filters: {} },
    { database: 'adjectives', filters: {} },
    { database: 'verbs', filters: {} }
  ]
});
  const [showTestModal, setShowTestModal] = useState(false);
const [moduleTests, setModuleTests] = useState([]);
const [editingTest, setEditingTest] = useState(null);
const [moduleTestQuestions, setModuleTestQuestions] = useState([]);
const [showTestWordSelector, setShowTestWordSelector] = useState(false);
const [currentTestOptionIndex, setCurrentTestOptionIndex] = useState(0);
  const [showPronounAudioModal, setShowPronounAudioModal] = useState(false);
  const [lexiconAddForm, setLexiconAddForm] = useState({
  database: 'nouns',
  theme: ''
});
const [newTestQuestion, setNewTestQuestion] = useState({
  questionStructure: [],
  questionText: '',
  questionImage: '',
  gridRows: 3,
  gridCols: 2,
  options: [],
  hint: '',
  translation: '',
  questionColumnConfigs: [] // Будет заполняться из конфигурации модуля
});
// Состояние для формы создания теста
const [testCreationForm, setTestCreationForm] = useState({
  studiedLanguage: 'русский',
  hintLanguage: 'english',
  level: 'A1',
  theme: '',
  selectedWords: [],
  wordCount: 8
});

// Состояние для выбора слов внутри формы теста
const [testLexiconAddForm, setTestLexiconAddForm] = useState({
  database: 'nouns',
  theme: ''
});
const [searchTerm, setSearchTerm] = useState('');
const [selectedLetter, setSelectedLetter] = useState('');
const [showFilterDropdown, setShowFilterDropdown] = useState(false);

// Список букв для фильтрации (русский алфавит)
const russianAlphabet = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'];
const englishAlphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const [selectedPronounForAudio, setSelectedPronounForAudio] = useState(null);
const [selectedPronounLanguage, setSelectedPronounLanguage] = useState(null);
  const [showNumeralAudioModal, setShowNumeralAudioModal] = useState(false);
const [selectedNumeralForAudio, setSelectedNumeralForAudio] = useState(null);
const [selectedNumeralLanguage, setSelectedNumeralLanguage] = useState(null);
  const [showParticipleAudioModal, setShowParticipleAudioModal] = useState(false);
const [selectedParticipleForAudio, setSelectedParticipleForAudio] = useState(null);
const [selectedParticipleLanguage, setSelectedParticipleLanguage] = useState(null);
  const [showAdverbAudioModal, setShowAdverbAudioModal] = useState(false);
const [selectedAdverbForAudio, setSelectedAdverbForAudio] = useState(null);
const [selectedAdverbLanguage, setSelectedAdverbLanguage] = useState(null);
  const [showVerbAudioModal, setShowVerbAudioModal] = useState(false);
const [selectedVerbForAudio, setSelectedVerbForAudio] = useState(null);
const [selectedVerbLanguage, setSelectedVerbLanguage] = useState(null);
  const [showGerundAudioModal, setShowGerundAudioModal] = useState(false);
const [selectedGerundForAudio, setSelectedGerundForAudio] = useState(null);
const [selectedGerundLanguage, setSelectedGerundLanguage] = useState(null);
  const [showPrepositionAudioModal, setShowPrepositionAudioModal] = useState(false);
const [selectedPrepositionForAudio, setSelectedPrepositionForAudio] = useState(null);
const [selectedPrepositionLanguage, setSelectedPrepositionLanguage] = useState(null);
  const [showQuestionWordAudioModal, setShowQuestionWordAudioModal] = useState(false);
const [selectedQuestionWordForAudio, setSelectedQuestionWordForAudio] = useState(null);
const [selectedQuestionWordLanguage, setSelectedQuestionWordLanguage] = useState(null);
  const [showAdjectiveAudioModal, setShowAdjectiveAudioModal] = useState(false);
const [selectedAdjectiveForAudio, setSelectedAdjectiveForAudio] = useState(null);
const [selectedAdjectiveLanguage, setSelectedAdjectiveLanguage] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
const [selectedWordForAudio, setSelectedWordForAudio] = useState(null);
const [selectedLanguageForAudio, setSelectedLanguageForAudio] = useState(null);
const [showAdjectiveCaseModal, setShowAdjectiveCaseModal] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [editingQuestion, setEditingQuestion] = useState(null);
const [newLexiconModule, setNewLexiconModule] = useState({
  // Убираем database и theme из общего состояния
  selectedWords: [] // Каждое слово будет хранить свою БД
});
const [showGrammarModal, setShowGrammarModal] = useState(false);
const [moduleGrammar, setModuleGrammar] = useState([]);
const [editingGrammar, setEditingGrammar] = useState(null);

// Ref'ы для отслеживания автоматически установленных картинок


// ========== ХЕЛПЕРЫ ДЛЯ АВТОКАРТИНОК ==========
const extractImageFromWordData = (data) => {
  if (!data) return null;
  
  // Проверяем и wordData, и сам data на всякий случай
  const wd = data.wordData || data;
  
  const candidates = [
    wd.imagePng,
    wd.image,
    wd.originalImage,
    wd['Картинка png'],
    wd['Картинка'],
    wd.originalData?.['Картинка png'],
    wd.originalData?.['Картинка'],
    wd.originalData?.imagePng,
    wd.originalData?.image,
  ];
  
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() !== '') {
      return c;
    }
  }
  return null;
};

const extractDatabaseFromData = (data) => {
  if (!data) return '';
  
  // Проверяем ВСЕ возможные места где может лежать database
  const candidates = [
    data.database,
    data.wordData?.database,
    data.wordData?.sourceDatabase,
    data.config?.database,
  ];
  
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() !== '') {
      return c;
    }
  }
  return '';
};

const findBestImage = (structureArray) => {
  if (!structureArray || !Array.isArray(structureArray)) return null;

  let nounImage = null;
  let adjOrVerbImage = null;
  let firstImage = null;

  for (const data of structureArray) {
    const img = extractImageFromWordData(data);
    if (!img) continue;

    if (!firstImage) firstImage = img;

    const db = extractDatabaseFromData(data);
    if (db === 'nouns' && !nounImage) {
      nounImage = img;
      break; // существительное — высший приоритет
    }
    if (!adjOrVerbImage && (db === 'adjectives' || db === 'verbs')) {
      adjOrVerbImage = img;
    }
  }

  return nounImage || adjOrVerbImage || firstImage;
};
// ========== КОНЕЦ ХЕЛПЕРОВ ==========
const updateOptionsCount = (rows, cols, currentOptions) => {
  const newCount = rows * cols;
  if (currentOptions.length === newCount) return currentOptions;
  if (currentOptions.length < newCount) {
    const newOptions = [...currentOptions];
    for (let i = currentOptions.length; i < newCount; i++) {
      newOptions.push({ 
        structure: [], 
        text: '', 
        isCorrect: false,
        tempDatabase: 'nouns',   // ← ДОБАВЛЕНО
        tempTheme: ''            // ← ДОБАВЛЕНО
      });
    }
    return newOptions;
  } else {
    return currentOptions.slice(0, newCount);
  }
};

// Добавление пустой опции
const addTestOption = () => {
  setNewTestQuestion(prev => ({
    ...prev,
    options: [...prev.options, { 
      structure: [], 
      text: '', 
      isCorrect: false,
      tempDatabase: 'nouns',   // ← ДОБАВЛЕНО
      tempTheme: ''            // ← ДОБАВЛЕНО
    }]
  }));
};

// Удаление опции
const removeTestOption = (index) => {
  const updatedOptions = [...newTestQuestion.options];
  updatedOptions.splice(index, 1);
  setNewTestQuestion({ ...newTestQuestion, options: updatedOptions });
};

// Обновление опции
const updateTestOption = (index, field, value) => {
  const updatedOptions = [...newTestQuestion.options];
  updatedOptions[index] = { ...updatedOptions[index], [field]: value };
  setNewTestQuestion({ ...newTestQuestion, options: updatedOptions });
};

// Проверка валидности вопроса
const isTestQuestionValid = () => {
  // Проверяем, что есть вопрос (текст или структура)
  const hasQuestion = newTestQuestion.questionText.trim() !== '' || 
                      (newTestQuestion.questionStructure[0]?.word && newTestQuestion.questionStructure[0].word.trim() !== '');
  
  if (!hasQuestion) return false;
  
  // Проверяем, что все опции заполнены
  const totalOptions = newTestQuestion.gridRows * newTestQuestion.gridCols;
  if (newTestQuestion.options.length !== totalOptions) return false;
  
  // Проверяем, что у каждой опции есть текст или структура
  const allOptionsFilled = newTestQuestion.options.every(opt => 
    (opt.text && opt.text.trim() !== '') || (opt.structure && opt.structure.length > 0)
  );
  
  if (!allOptionsFilled) return false;
  
  // Проверяем, что есть хотя бы один правильный ответ
  const hasCorrect = newTestQuestion.options.some(opt => opt.isCorrect);
  
  return hasCorrect;
};

// Сброс формы вопроса теста
const resetTestQuestionForm = () => {
  setNewTestQuestion({
    questionStructure: [],
    questionText: '',
    questionImage: '',
    gridRows: 3,
    gridCols: 2,
    options: [],
    hint: '',
    translation: ''
  });
  setEditingTest(null);
};

// Загрузка вопросов теста для модуля
const loadModuleTestQuestions = async (moduleId) => {
  try {
    console.log('Loading test questions for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/test-questions`);
    if (response.ok) {
      const questions = await response.json();
      console.log('Loaded test questions:', questions.length);
      setModuleTestQuestions(questions);
    } else {
      console.error('Failed to load test questions');
      setModuleTestQuestions([]);
    }
  } catch (error) {
    console.error('Error loading test questions:', error);
    setModuleTestQuestions([]);
  }
};

// Открытие модалки создания/редактирования вопроса теста
const openTestQuestionModal = async (module, testQuestion = null) => {
  console.log('Opening test question modal for module:', module);
  
  setCurrentLessonForModule(module);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    if (lessonResponse.ok) {
      const lesson = await lessonResponse.json();
      setLessonData(lesson);
    }
  } catch (error) {
    console.error('Error loading lesson:', error);
  }
  
  if (testQuestion) {
    // Редактирование существующего вопроса
    console.log('Editing existing test question:', testQuestion);
    setNewTestQuestion(testQuestion);
    setEditingTest(testQuestion);
  } else {
    // Создание нового вопроса
    resetTestQuestionForm();
    
    // Получаем конфигурацию из модуля или используем значения по умолчанию
    const questionConfigs = module.config?.questionColumnConfigs || [
      { database: 'nouns', filters: {} },
      { database: 'adjectives', filters: {} },
      { database: 'verbs', filters: {} }
    ];
    
    const totalOptions = (module.config?.gridRows || 3) * (module.config?.gridCols || 2);
   const initialOptions = [];
for (let i = 0; i < totalOptions; i++) {
  initialOptions.push({ 
    structure: [], 
    text: '', 
    isCorrect: false,
    tempDatabase: 'nouns',   // ← ДОБАВЛЕНО
    tempTheme: ''            // ← ДОБАВЛЕНО
  });
}
    
    setNewTestQuestion(prev => ({
      ...prev,
      gridRows: module.config?.gridRows || 3,
      gridCols: module.config?.gridCols || 2,
      questionColumnConfigs: questionConfigs,
      options: initialOptions
    }));
    setEditingTest(null);
  }
  
  setShowTestModal(true);
  await loadModuleTestQuestions(module._id);
};

// Сохранение вопроса теста
const addOrUpdateTestQuestion = async () => {
  try {
    console.log('Saving test question...');
    
    const questionData = {
      moduleId: currentLessonForModule._id,
      questionStructure: newTestQuestion.questionStructure,
      questionText: newTestQuestion.questionText,
      questionImage: newTestQuestion.questionImage,
      gridRows: newTestQuestion.gridRows,
      gridCols: newTestQuestion.gridCols,
      options: newTestQuestion.options,
      hint: newTestQuestion.hint,
      translation: newTestQuestion.translation,
      order: moduleTestQuestions.length
    };
    
    const endpoint = editingTest && editingTest._id
      ? `${API_BASE_URL}/test-questions/${editingTest._id}`
      : `${API_BASE_URL}/test-questions`;
    const method = editingTest && editingTest._id ? 'PUT' : 'POST';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });
    
    if (response.ok) {
      const savedQuestion = await response.json();
      console.log('Test question saved successfully:', savedQuestion);
      
      await loadModuleTestQuestions(currentLessonForModule._id);
      alert(editingTest ? 'Вопрос теста обновлен!' : 'Вопрос теста добавлен!');
      
      // Сбрасываем форму
      resetTestQuestionForm();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save test question');
    }
  } catch (error) {
    console.error('Error saving test question:', error);
    alert('Ошибка сохранения вопроса теста: ' + error.message);
  }
};
// Функция загрузки изображения для теста
const handleTestImageUpload = async (event, type) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  setUploadingImageType(type);

  try {
    let processedFile = file;
    if (file.size > 300 * 1024) {
      processedFile = await compressImage(file, 800, 0.7);
    }

    const base64 = await fileToBase64(processedFile);
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setNewTestQuestion(prev => ({
          ...prev,
          [type === 'test-question' ? 'questionImage' : 'answerImage']: result.imageUrl
        }));
        alert(`✅ Изображение загружено!`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка сервера');
    }
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    alert('❌ Ошибка загрузки изображения: ' + error.message);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
    if (event.target) {
      event.target.value = '';
    }
  }
};
// Удаление вопроса теста
const deleteTestQuestion = async (questionId) => {
  if (!confirm('Удалить этот вопрос теста?')) return;
  try {
    await fetch(`${API_BASE_URL}/test-questions/${questionId}`, { method: 'DELETE' });
    await loadModuleTestQuestions(currentLessonForModule._id);
    alert('Вопрос теста удален!');
  } catch (error) {
    console.error('Error deleting test question:', error);
    alert('Ошибка удаления: ' + error.message);
  }
};
// Функция для инициализации пустой таблицы с поддержкой всех полей
const initializeTableData = (rows, cols) => {
  const data = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        word: '',
        wordData: null,
        database: '',
        lesson: '', // ДОБАВЛЕНО: тема/урок для фильтрации
        number: '',
        gender: '',
        case: '',
        tense: '',
        person: '',
        verbGender: '',
        imperativeForm: ''
      });
    }
    data.push(row);
  }
  return data;
};
const [newGrammar, setNewGrammar] = useState({
  mediaType: 'image', // 'image' или 'video'
  image: '',
  video: '',
  videoFile: null,
  videoPreview: null,
  explanation: '',
  tableConfig: {
    rows: 4,
    columns: 2,
    theme: '',
    data: initializeTableData(4, 2)
  }
});
const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [moduleTexts, setModuleTexts] = useState([]);
  const [editingText, setEditingText] = useState(null);
  const [newText, setNewText] = useState({
    image: '',
    text: ''
  });
  
const [isAddingGerundLesson, setIsAddingGerundLesson] = useState(false);
const [numeralsTableData, setNumeralsTableData] = useState([]);
const [nounGenders, setNounGenders] = useState({});
const [editingModule, setEditingModule] = useState(null);
const [showEditModuleModal, setShowEditModuleModal] = useState(false);
const [editLexiconModule, setEditLexiconModule] = useState({
  database: 'nouns',
  selectedWords: [],
  theme: ''
});
const [editLexiconAddForm, setEditLexiconAddForm] = useState({
  database: 'nouns',
  theme: ''
});
const [showNumeralCaseModal, setShowNumeralCaseModal] = useState(false);
const [selectedNumeral, setSelectedNumeral] = useState(null);
const [showVideoModal, setShowVideoModal] = useState(false);
const [moduleVideos, setModuleVideos] = useState([]);
const [editingVideo, setEditingVideo] = useState(null);
const [newVideo, setNewVideo] = useState({
  title: '',
  videoFile: null,
  videoPreview: null,
  originalTranscript: '',
  hintTranscript: '',
  hint: '',
  duration: 0
});
const [pronounsTableData, setPronounsTableData] = useState([]);
const [showQuestionWordCaseModal, setShowQuestionWordCaseModal] = useState(false);
const [selectedQuestionWord, setSelectedQuestionWord] = useState(null);
const [gerundsTableData, setGerundsTableData] = useState([]);
const [isUploading, setIsUploading] = useState(false);
const [adverbsTableData, setAdverbsTableData] = useState([]);
const [showPronounDeclensionModal, setShowPronounDeclensionModal] = useState(false);
const [uploadingImageType, setUploadingImageType] = useState(null); 
const [selectedAdjective, setSelectedAdjective] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [participlesTableData, setParticiplesTableData] = useState([]);
const [showParticipleCaseModal, setShowParticipleCaseModal] = useState(false);
const [selectedParticiple, setSelectedParticiple] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
  const [lessonData, setLessonData] = useState(null);
    // Table data states
    const [activeTable, setActiveTable] = useState('nouns');
    const [tableData, setTableData] = useState([]);
    const [adjectivesTableData, setAdjectivesTableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState(null);

const [questionWordsData, setQuestionWordsData] = useState([]); // ← ДОБАВЬ ЭТО
const [prepositionsTableData, setPrepositionsTableData] = useState([]);

    // Modal states
    const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
    const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
    const [showCreateTestModal, setShowCreateTestModal] = useState(false);
    const [showAddWordModal, setShowAddWordModal] = useState(false);
    const [showImageUploadModal, setShowImageUploadModal] = useState(false);
    const [showFlagsModal, setShowFlagsModal] = useState(false);
    const [showLessonsModal, setShowLessonsModal] = useState(false);
    const [showTestsModal, setShowTestsModal] = useState(false);
  
    // Image upload state
    const [showCaseModal, setShowCaseModal] = useState(false);
const [selectedWord, setSelectedWord] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [currentImageRow, setCurrentImageRow] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
  
    // Words selection state
    const [selectedWords, setSelectedWords] = useState([]);
  
    // Flags state
    const [flags, setFlags] = useState([]);
    const [uploadingFlag, setUploadingFlag] = useState(null);
    const [tableLanguages, setTableLanguages] = useState([]);
  
    // Lessons and tests state
    const [lessons, setLessons] = useState([]);
    const [tests, setTests] = useState([]);
  // В AdminPage.js, найдите инициализацию newQuestionModule
// В AdminPage.js, обновите состояние newQuestionModule

const [newQuestionModule, setNewQuestionModule] = useState({
  typeId: 4,
  title: '',
  questionColumnsCount: 3,
  answerColumnsCount: 3,
  requiresPairAnswer: true,
  
  // НОВОЕ ПОЛЕ: ID модуля, после которого идут эти вопросы
  relatedToModuleId: null, // null означает "не привязан" или будет добавлен позже
  
  // ПОЛЕ ДЛЯ ОТОБРАЖЕНИЯ (не сохраняется в БД)
  relatedToModuleType: 'phrases', // только для фильтрации в UI
  
  questionColumnConfigs: [
    { database: 'question-words', filters: {} },
    { database: 'nouns', filters: {} },
    { database: 'adjectives', filters: {} }
  ],
  answerColumnConfigs: [
    { database: 'nouns', filters: {} },
    { database: 'prepositions', filters: {} },
    { database: 'nouns', filters: {} }
  ]
});

const [newQuestion, setNewQuestion] = useState({
  questionStructure: [],
  answerStructure: [],
  questionImage: '',
  answerImage: '',
  hint: '',
  requiresPairAnswer: true,
  englishQuestion: '',
  englishAnswer: ''
});
const [newPodcast, setNewPodcast] = useState({
  title: '',
  audioFile: null,
  audioPreview: null,
  originalTranscript: '',
  hintTranscript: '',
  hint: '',
  duration: 0
});
const [newTestModule, setNewTestModule] = useState({
  sourceLexiconModuleId: '', // ← вместо database/theme
  wordCount: 8,
  selectedWords: []          // для предпросмотра в UI
});


const [showPodcastModal, setShowPodcastModal] = useState(false);
const [modulePodcasts, setModulePodcasts] = useState([]);

const [moduleQuestions, setModuleQuestions] = useState([]);
const [showQuestionModal, setShowQuestionModal] = useState(false);
// В AdminPage.js, добавьте эти функции

const loadModuleTests = async (moduleId) => {
  try {
    console.log('Loading tests for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/tests`);
    if (response.ok) {
      const tests = await response.json();
      console.log('Loaded tests:', tests);
      setModuleTests(tests);
    } else {
      console.error('Failed to load tests');
      setModuleTests([]);
    }
  } catch (error) {
    console.error('Error loading module tests:', error);
    setModuleTests([]);
  }
};

const openTestModal = async (module, test = null) => {
  console.log('Opening test modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleTests([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    if (lessonResponse.ok) {
      const lesson = await lessonResponse.json();
      setLessonData(lesson);
    }
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }
  
  setEditingTest(test);
  setShowTestModal(true);
  await loadModuleTests(module._id);
};

const addOrUpdateTest = async (testData) => {
  try {
    const endpoint = editingTest && editingTest._id
      ? `${API_BASE_URL}/test-module-contents/${editingTest._id}`
      : `${API_BASE_URL}/test-module-contents`;
    const method = editingTest && editingTest._id ? 'PUT' : 'POST';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      await loadModuleTests(currentLessonForModule._id);
      alert(editingTest ? 'Тест обновлён!' : 'Тест создан!');
      setEditingTest(null);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save test');
    }
  } catch (error) {
    console.error('Error saving test:', error);
    alert('Ошибка сохранения теста: ' + error.message);
  }
};

const deleteTestAnswer = async (testId) => {
  if (!confirm('Удалить этот тест?')) return;
  try {
    await fetch(`${API_BASE_URL}/test-module-contents/${testId}`, { method: 'DELETE' });
    await loadModuleTests(currentLessonForModule._id);
    alert('Тест удалён!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
// === МАППЕР ДЛЯ ОТОБРАЖЕНИЯ: УРОК → ТЕМА (только для фронта) ===

const loadModuleVideos = async (moduleId) => {
  try {
    console.log('Loading videos for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/videos`);
    if (response.ok) {
      const videos = await response.json();
      console.log('Loaded videos:', videos);
      setModuleVideos(videos);
    } else {
      console.error('Failed to load videos');
      setModuleVideos([]);
    }
  } catch (error) {
    console.error('Error loading module videos:', error);
    setModuleVideos([]);
  }
};
// ========== ФУНКЦИИ ДЛЯ МОДУЛЯ "ГРАММАТИКА" ==========
const loadModuleGrammar = async (moduleId) => {
  try {
    console.log('Loading grammar for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/grammar`);
    if (response.ok) {
      const grammar = await response.json();
      console.log('Loaded grammar:', grammar);
      setModuleGrammar(grammar);
    } else {
      console.error('Failed to load grammar');
      setModuleGrammar([]);
    }
  } catch (error) {
    console.error('Error loading module grammar:', error);
    setModuleGrammar([]);
  }
};

const hasThemes = (database) => {
  // Базы данных, у которых есть темы (уроки)
  const databasesWithThemes = ['nouns', 'adjectives', 'verbs', 'gerunds', 'participles', 'adverbs'];
  return databasesWithThemes.includes(database);
};
// В AdminPage.js, добавьте вспомогательные функции
const getThemesByDatabase = (database) => {
  if (database === 'nouns') {
    return tableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index) // уникальные
      .sort();
  }
  
  if (database === 'adjectives') {
    return adjectivesTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  if (database === 'verbs') {
    return verbsTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  if (database === 'gerunds') {
    return gerundsTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  if (database === 'participles') {
    return participlesTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  if (database === 'adverbs') {
    return adverbsTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  if (database === 'numerals') {
    return numeralsTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  if (database === 'pronouns') {
    return pronounsTableData
      .filter(row => row['Урок название'] && row['Урок название'].trim() !== '')
      .map(row => row['Урок название'])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }
  
  // Для таблиц без уроков возвращаем пустой массив
  return [];
};
const getModuleTypeName = (typeId) => {
  const typeMap = {
    1: 'lexicon',
    2: 'test',
    3: 'phrases',
    4: 'questions',
    5: 'audio',
    6: 'text',
    7: 'video',
    8: 'grammar'
  };
  return typeMap[typeId] || 'unknown';
};
const createStandaloneTest = async () => {
  try {
    if (testCreationForm.selectedWords.length < 2) {
      alert('Выберите минимум 2 слова для теста');
      return;
    }

    if (!testCreationForm.theme) {
      alert('Введите тему теста');
      return;
    }

    const wordCount = Math.min(testCreationForm.wordCount, testCreationForm.selectedWords.length);
    const wordsToUse = testCreationForm.selectedWords.slice(0, wordCount);

    const testData = {
      lessonId: `standalone_test_${Date.now()}`,
      studiedLanguage: testCreationForm.studiedLanguage.toLowerCase(),
      hintLanguage: testCreationForm.hintLanguage.toLowerCase(),
      level: testCreationForm.level,
      theme: testCreationForm.theme,
      fontColor: '#000000',
      bgColor: '#ffffff',
      words: wordsToUse.map(word => ({
        imageBase: word.imageBase || word.id,
        imagePng: word.imagePng || '',
        displayWord: word.displayWord || word.word || '',
        database: word.database || word.sourceDatabase || 'nouns',
        translations: word.translations || {}
      })),
      wordIds: wordsToUse.map(w => w.imageBase || w.id)
    };

    console.log('Creating standalone test:', testData);

    const response = await fetch(`${API_BASE_URL}/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const savedTest = await response.json();
      alert(`✅ Тест "${testCreationForm.theme}" создан успешно! Слов: ${wordCount}`);
      
      setShowCreateTestModal(false);
      setTestCreationForm({
        studiedLanguage: 'русский',
        hintLanguage: 'english',
        level: 'A1',
        theme: '',
        selectedWords: [],
        wordCount: 8
      });
      setTestLexiconAddForm({ database: 'nouns', theme: '' });
      
      await loadTests();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Server error');
    }
  } catch (error) {
    console.error('Error creating test:', error);
    alert('Ошибка создания теста: ' + error.message);
  }
};
const getModuleDisplayType = (typeId) => {
  const typeMap = {
    1: 'Лексика',
    2: 'Тест',
    3: 'Фразы',
    4: 'Вопросы',
    5: 'Аудио',
    6: 'Текст',
    7: 'Видео',
    8: 'Грамматика'
  };
  return typeMap[typeId] || 'Неизвестно';
};
// В AdminPage.js, найдите функцию openGrammarModal и добавьте в неё загрузку урока

const openGrammarModal = async (module, grammar = null) => {
  console.log('Opening grammar modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleGrammar([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    if (lessonResponse.ok) {
      const lesson = await lessonResponse.json();
      setLessonData(lesson);
    }
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  if (grammar) {
    // Редактирование существующего
    console.log('Editing existing grammar:', grammar);
    setNewGrammar({
      mediaType: grammar.mediaType || 'image',
      image: grammar.image || '',
      video: grammar.video || '',
      videoFile: null,
      videoPreview: null,
      explanation: grammar.explanation || '',
      tableConfig: grammar.tableConfig || {
        rows: 4,
        columns: 2,
        theme: '',
        data: initializeTableData(4, 2)
      }
    });
    setEditingGrammar(grammar);
  } else {
    // Создание нового
    const initialData = initializeTableData(4, 2);
    setNewGrammar({
      mediaType: 'image',
      image: '',
      video: '',
      videoFile: null,
      videoPreview: null,
      explanation: '',
      tableConfig: {
        rows: 4,
        columns: 2,
        theme: '',
        data: initialData
      }
    });
    setEditingGrammar(null);
  }
  
  setShowGrammarModal(true);
  
  // Загружаем существующие грамматические модули
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${module._id}/grammar`);
    if (response.ok) {
      const grammarList = await response.json();
      console.log('Loaded grammar:', grammarList);
      setModuleGrammar(grammarList);
    } else {
      console.error('Failed to load grammar, status:', response.status);
      setModuleGrammar([]);
    }
  } catch (error) {
    console.error('Error loading module grammar:', error);
    setModuleGrammar([]);
  }
};

// Функция для загрузки картинки в грамматический модуль
const handleGrammarImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  setUploadingImageType('grammar');

  try {
    console.log(`Загрузка изображения для грамматики: ${file.name}, размер: ${(file.size / 1024).toFixed(1)}KB`);
    
    // Сжимаем изображение если нужно
    let processedFile = file;
    if (file.size > 300 * 1024) { // > 300KB
      console.log('Сжимаем изображение...');
      processedFile = await compressImage(file, 800, 0.7);
      console.log(`Сжатый размер: ${(processedFile.size / 1024).toFixed(1)}KB`);
    }

    // Конвертируем в base64
    const base64 = await fileToBase64(processedFile);
    
    // Извлекаем только base64 часть
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    console.log(`Отправляем на сервер (длина base64: ${base64Data.length})`);

    // Отправляем на сервер
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name,
        originalSize: file.size,
        compressedSize: processedFile.size
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        // Обновляем поле image в newGrammar
        setNewGrammar(prev => ({
          ...prev,
          image: result.imageUrl
        }));
        
        alert(`✅ Изображение загружено! (сжато с ${(file.size / 1024).toFixed(0)}KB до ${(processedFile.size / 1024).toFixed(0)}KB)`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка сервера');
    }
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    alert('❌ Ошибка загрузки изображения: ' + error.message);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
    if (event.target) {
      event.target.value = '';
    }
  }
};

// Функция для инициализации пустой таблицы
// Функция для инициализации пустой таблицы с поддержкой всех полей


// Функция для загрузки видео (как в модуле видео)
const handleGrammarVideoUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Проверка размера (макс 200MB)
  if (file.size > 200 * 1024 * 1024) {
    alert('Видео файл слишком большой. Максимальный размер 200MB');
    return;
  }

  setUploadingVideo(true);

  try {
    console.log('Uploading grammar video:', file.name);
    
    // Получаем presigned URL
    const urlResponse = await fetch(`${API_BASE_URL}/videos/generate-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        moduleId: currentLessonForModule._id,
        title: 'Grammar video',
        duration: 0
      })
    });

    if (!urlResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { success, videoId, uploadUrl, key } = await urlResponse.json();
    
    if (!success) {
      throw new Error('Failed to get upload URL');
    }

    // Загружаем видео
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-amz-acl': 'public-read'
      }
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video');
    }

    // Получаем URL видео
    const bucketName = process.env.NEXT_PUBLIC_YANDEX_BUCKET || 'id-langlearn';
    const videoUrl = `https://${bucketName}.storage.yandexcloud.net/${key}`;

    setNewGrammar(prev => ({
      ...prev,
      video: videoUrl,
      videoFile: file,
      videoPreview: URL.createObjectURL(file)
    }));

    alert('✅ Видео загружено успешно!');
  } catch (error) {
    console.error('Error uploading video:', error);
    alert('Ошибка загрузки видео: ' + error.message);
  } finally {
    setUploadingVideo(false);
  }
};

// Функция для сохранения грамматического модуля
// Функция для сохранения грамматического модуля
const addOrUpdateGrammar = async () => {
  try {
    console.log('=== SAVING GRAMMAR ===');
    
    if (!newGrammar.explanation.trim()) {
      alert('Введите объяснение');
      return;
    }

    // Подготавливаем данные таблицы, убеждаясь что все поля сохранены
    const preparedTableData = newGrammar.tableConfig.data.map(row => 
      row.map(cell => ({
        word: cell.word || '',
        wordData: cell.wordData || null,
        database: cell.database || '',
        number: cell.number || '',
        gender: cell.gender || '',
        case: cell.case || '',
        tense: cell.tense || '',
        person: cell.person || '',
        verbGender: cell.verbGender || '',
        imperativeForm: cell.imperativeForm || ''
      }))
    );

    const grammarData = {
      moduleId: currentLessonForModule._id,
      mediaType: newGrammar.mediaType,
      image: newGrammar.image || '',
      video: newGrammar.video || '',
      explanation: newGrammar.explanation.trim(),
      tableConfig: {
        rows: newGrammar.tableConfig.rows,
        columns: newGrammar.tableConfig.columns,
        theme: newGrammar.tableConfig.theme || '',
        data: preparedTableData
      }
    };

    console.log('Saving grammar data:', grammarData);

    const endpoint = editingGrammar && editingGrammar._id
      ? `${API_BASE_URL}/grammar-module-contents/${editingGrammar._id}`
      : `${API_BASE_URL}/grammar-module-contents`;
    const method = editingGrammar && editingGrammar._id ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grammarData)
    });

    if (response.ok) {
      const savedGrammar = await response.json();
      console.log('Grammar saved successfully:', savedGrammar);

      await loadModuleGrammar(currentLessonForModule._id);
      alert('Грамматический модуль сохранен!');

      // Сбрасываем форму
      setNewGrammar({
        mediaType: 'image',
        image: '',
        video: '',
        videoFile: null,
        videoPreview: null,
        explanation: '',
        tableConfig: {
          rows: 4,
          columns: 2,
          theme: '',
          data: initializeTableData(4, 2)
        }
      });
      setEditingGrammar(null);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save grammar');
    }
  } catch (error) {
    console.error('Error saving grammar:', error);
    alert('Ошибка сохранения: ' + error.message);
  }
};

const deleteGrammar = async (grammarId) => {
  if (!confirm('Удалить этот грамматический модуль?')) return;
  try {
    await fetch(`${API_BASE_URL}/grammar-module-contents/${grammarId}`, { method: 'DELETE' });
    await loadModuleGrammar(currentLessonForModule._id);
    alert('Грамматический модуль удален!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
const openVideoModal = async (module, video = null) => {
  console.log('Opening video modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleVideos([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  if (video) {
    // Редактирование существующего
    console.log('Editing existing video:', video);
    setNewVideo({
      title: video.title || '',
      videoFile: null,
      videoPreview: null,
      originalTranscript: video.originalTranscript || '',
      hintTranscript: video.hintTranscript || '',
      hint: video.hint || '',
      duration: video.duration || 0
    });
    setEditingVideo(video);
  } else {
    // Создание нового
    setNewVideo({
      title: '',
      videoFile: null,
      videoPreview: null,
      originalTranscript: '',
      hintTranscript: '',
      hint: '',
      duration: 0
    });
    setEditingVideo(null);
  }
  
  setShowVideoModal(true);
  await loadModuleVideos(module._id);
};

const addVideo = async () => {
  try {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Проверка обязательных полей
    if (!newVideo.title.trim()) {
      alert('Введите название видео');
      return;
    }

    if (!newVideo.videoFile) {
      alert('Выберите видео файл');
      return;
    }

    if (!newVideo.originalTranscript.trim()) {
      alert('Введите титры на оригинальном языке');
      return;
    }

    // 1. Получаем presigned URL для загрузки (как в аудио)
    console.log('Getting upload URL for video...');
    const urlResponse = await fetch(`${API_BASE_URL}/videos/generate-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: newVideo.videoFile.name,
        fileType: newVideo.videoFile.type,
        moduleId: currentLessonForModule._id,
        title: newVideo.title,
        duration: newVideo.duration || 0,
        originalTranscript: newVideo.originalTranscript,
        hintTranscript: newVideo.hintTranscript || '',
        hint: newVideo.hint || ''
      })
    });

    if (!urlResponse.ok) {
      const errorText = await urlResponse.text();
      throw new Error(errorText || 'Failed to get upload URL');
    }

    const { success, videoId, uploadUrl, key } = await urlResponse.json();
    
    if (!success) {
      throw new Error('Failed to get upload URL from server');
    }
console.log('Upload URL type:', typeof uploadUrl);
console.log('Upload URL length:', uploadUrl.length);
console.log('Upload URL starts with:', uploadUrl.substring(0, 50));
    console.log('Got upload URL, starting direct upload to S3...');
    console.log('Video file type:', newVideo.videoFile.type);
console.log('Video file size:', newVideo.videoFile.size);
    // 2. Загружаем файл напрямую в Yandex S3 (точно как в аудио)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: newVideo.videoFile,
      headers: {
        'Content-Type': newVideo.videoFile.type,
        'x-amz-acl': 'public-read'
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('File uploaded to S3, notifying backend...');
    
    // 3. Уведомляем бэкенд об успешной загрузке
    const completeResponse = await fetch(`${API_BASE_URL}/videos/complete-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        key
      })
    });

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      throw new Error(errorText || 'Failed to complete upload');
    }

    const completeResult = await completeResponse.json();
    
    if (completeResult.success) {
      console.log('Video saved successfully:', completeResult.video);
      
      // Обновляем список видео
      await loadModuleVideos(currentLessonForModule._id);
      alert('Видео добавлено успешно!');
      
      // Сбрасываем форму
      if (newVideo.videoPreview) {
        URL.revokeObjectURL(newVideo.videoPreview);
      }
      setNewVideo({
        title: '',
        videoFile: null,
        videoPreview: null,
        originalTranscript: '',
        hintTranscript: '',
        hint: '',
        duration: 0
      });
    } else {
      throw new Error(completeResult.error || 'Failed to save video');
    }
  } catch (error) {
    console.error('Error saving video:', error);
    alert('Ошибка сохранения видео: ' + error.message);
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};

const deleteVideo = async (videoId) => {
  if (!confirm('Удалить видео?')) return;
  try {
    await fetch(`${API_BASE_URL}/videos/${videoId}`, { method: 'DELETE' });
    await loadModuleVideos(currentLessonForModule._id);
    alert('Видео удалено!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
// ========== ФУНКЦИИ ДЛЯ МОДУЛЯ "ТЕКСТ" ==========
const loadModuleTexts = async (moduleId) => {
  try {
    console.log('Loading texts for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/texts`);
    if (response.ok) {
      const texts = await response.json();
      console.log('Loaded texts:', texts);
      setModuleTexts(texts);
    } else {
      console.error('Failed to load texts');
      setModuleTexts([]);
    }
  } catch (error) {
    console.error('Error loading module texts:', error);
    setModuleTexts([]);
  }
};

const openTextModal = async (module, text = null) => {
  console.log('Opening text modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleTexts([]);
  
  // Загружаем урок для получения языка (на всякий случай, если понадобится)
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  if (text) {
    // Редактирование существующего
    console.log('Editing existing text:', text);
    setNewText({
      image: text.image || '',
      text: text.text || ''
    });
    setEditingText(text);
  } else {
    // Создание нового
    setNewText({
      image: '',
      text: ''
    });
    setEditingText(null);
  }
  
  setShowTextModal(true);
  await loadModuleTexts(module._id);
};

const addOrUpdateText = async () => {
  try {
    console.log('=== SAVING TEXT ===');
    
    // Проверка на заполненность текста
    if (!newText.text.trim()) {
      alert('Введите текст (до 2000 знаков)');
      return;
    }

    if (newText.text.length > 2000) {
      alert('Текст не должен превышать 2000 знаков');
      return;
    }

    const textData = {
      moduleId: currentLessonForModule._id,
      image: newText.image || '',
      text: newText.text.trim()
    };

    console.log('Saving text data:', textData);

    const endpoint = editingText && editingText._id
      ? `${API_BASE_URL}/text-module-contents/${editingText._id}`
      : `${API_BASE_URL}/text-module-contents`;
    
    // ВАЖНО: используем endpoint напрямую, без конкатенации с API_BASE_URL
    const response = await fetch(endpoint, {
      method: editingText && editingText._id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textData)
    });

    if (response.ok) {
      const savedText = await response.json();
      console.log('Text saved successfully:', savedText);

      await loadModuleTexts(currentLessonForModule._id);
      alert('Текст сохранен!');

      // Сбрасываем форму
      setNewText({
        image: '',
        text: ''
      });
      setEditingText(null);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save text');
    }
  } catch (error) {
    console.error('Error saving text:', error);
    alert('Ошибка сохранения текста: ' + error.message);
  }
};

const deleteText = async (textId) => {
  if (!confirm('Удалить этот текст?')) return;
  try {
    await fetch(`${API_BASE_URL}/text-module-contents/${textId}`, { method: 'DELETE' });
    await loadModuleTexts(currentLessonForModule._id);
    alert('Текст удален!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};

// Функция для загрузки картинки (можно использовать существующую handleOptimizedImageUpload, но адаптировать)
const handleTextImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  setUploadingImageType('text'); // Специальный тип

  try {
    console.log(`Загрузка изображения для текста: ${file.name}, размер: ${(file.size / 1024).toFixed(1)}KB`);
    
    let processedFile = file;
    if (file.size > 300 * 1024) {
      console.log('Сжимаем изображение...');
      processedFile = await compressImage(file, 800, 0.7);
      console.log(`Сжатый размер: ${(processedFile.size / 1024).toFixed(1)}KB`);
    }

    const base64 = await fileToBase64(processedFile);
    
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        setNewText(prev => ({
          ...prev,
          image: result.imageUrl
        }));
        
        alert(`✅ Изображение загружено!`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка сервера');
    }
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    alert('❌ Ошибка загрузки изображения: ' + error.message);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
    if (event.target) {
      event.target.value = '';
    }
  }
};
// =================================================
// Добавьте эту функцию в AdminPage
const isLexiconModuleValid = () => {
  return newLexiconModule.selectedWords.length > 0;
};

// Добавьте эту функцию для сохранения модуля "Лексика"
const createLexiconModule = async () => {
  try {
    if (!isLexiconModuleValid()) {
      alert('Выберите хотя бы одно слово для модуля');
      return;
    }

    const selectedType = lessonTypes.find(t => t.typeId === 1);
    if (!selectedType) {
      alert('Выбран неверный тип урока');
      return;
    }

    const moduleData = {
      lessonId: currentLessonForModule._id,
      typeId: 1,
      title: newModule.title,
      order: lessonModules.length + 1,
      content: [],
      isActive: true,
      config: {
        // ★★★ Убираем database и theme из общего config ★★★
        words: newLexiconModule.selectedWords.map(word => {
          // Создаем правильную структуру слова с сохранением всех данных
          const wordObj = {
            imageBase: word.imageBase || word.id,
            imagePng: word.imagePng || '',
            displayWord: word.displayWord || word.word || '',
            database: word.database || word.sourceDatabase || 'nouns',  // ← ВАЖНО: сохраняем БД
            translations: {},
            originalData: word.originalData || null,
            fullTranslations: word.fullTranslations || null,
            cases: word.cases || null,
            declensions: word.declensions || null,
            conjugation: word.conjugation || null
          };
          
          // Копируем все переводы
          if (word.translations) {
            wordObj.translations = { ...word.translations };
          } else if (word.wordData?.translations) {
            wordObj.translations = { ...word.wordData.translations };
          }
          
          // Для специальных типов данных
          if (word.database === 'participles' && word.fullTranslations) {
            wordObj.fullTranslations = word.fullTranslations;
          }
          if (word.database === 'verbs' && word.conjugation) {
            wordObj.conjugation = word.conjugation;
          }
          if (word.database === 'pronouns' && word.declensions) {
            wordObj.declensions = word.declensions;
          }
          if (word.database === 'numerals' && word.cases) {
            wordObj.cases = word.cases;
          }
          
          return wordObj;
        })
      }
    };

    console.log('Creating lexicon module:', moduleData);

    const response = await fetch(`${API_BASE_URL}/lesson-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData)
    });

    if (response.ok) {
      const savedModule = await response.json();
      alert(`Модуль "${newModule.title}" создан успешно! Слов: ${newLexiconModule.selectedWords.length}`);
      setShowCreateModuleModal(false);
      setNewModule({
  typeId: 1,
  title: '',
  columnsCount: 2,
  columnConfigs: []
});
setNewTestModuleConfig({ rows: 3, columns: 2 }); 
      
      // Сброс форм
      setNewModule({
        typeId: 1,
        title: '',
        columnsCount: 2,
        columnConfigs: []
      });
      setNewLexiconModule({
        selectedWords: []
      });
      setLexiconAddForm({
        database: 'nouns',
        theme: ''
      });

      // Обновляем список модулей
      await loadLessonModules(currentLessonForModule._id);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create module');
    }
  } catch (error) {
    console.error('Error creating lexicon module:', error);
    alert('Ошибка создания модуля: ' + error.message);
  }
};

const loadNounGenders = async () => {
  try {
    // Получаем все imageBase из текущей таблицы существительных
    const imageBases = tableData
      .filter(row => row['База изображение'] && row['База изображение'].trim() !== '')
      .map(row => row['База изображение']);
    
    if (imageBases.length === 0) return;
    
    // Загружаем роды для всех слов
    const response = await fetch(`${API_BASE_URL}/noun-gender/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBases })
    });
    
    if (response.ok) {
      const genderMap = await response.json();
      setNounGenders(genderMap);
    }
  } catch (error) {
    console.error('Error loading noun genders:', error);
  }
};
// Добавьте useEffect для загрузки родов
// В AdminPage, найдите или создайте два useEffect:

// 1. useEffect для автоматической установки картинки ВОПРОСА
// Автоматическая установка картинки ВОПРОСА
useEffect(() => {
  if (!showQuestionModal || !newQuestion.questionStructure) return;

  let nounImg = null;
  let adjVerbImg = null;
  let firstImg = null;

  for (let i = 0; i < newQuestion.questionStructure.length; i++) {
    const col = newQuestion.questionStructure[i];
    const wd = col?.wordData;
    if (!wd) continue;

    const img = wd.imagePng || wd.image || wd.originalImage ||
      wd.originalData?.['Картинка png'] || wd.originalData?.['Картинка'] || '';

    if (!img || typeof img !== 'string' || img.trim() === '') continue;
    if (!firstImg) firstImg = img;

    const db = wd.database || wd.sourceDatabase || col.database || '';

    if (db === 'nouns' && !nounImg) { nounImg = img; break; }
    if ((db === 'adjectives' || db === 'verbs') && !adjVerbImg) { adjVerbImg = img; }
  }

  const selected = nounImg || adjVerbImg || firstImg;
  if (selected) {
    setNewQuestion(prev => ({ ...prev, questionImage: selected }));
  }
}, [newQuestion.questionStructure, showQuestionModal]);

// Автоматическая установка картинки ОТВЕТА
useEffect(() => {
  if (!showQuestionModal || !newQuestion.answerStructure) return;

  let nounImg = null;
  let adjVerbImg = null;
  let firstImg = null;

  for (let i = 0; i < newQuestion.answerStructure.length; i++) {
    const col = newQuestion.answerStructure[i];
    const wd = col?.wordData;
    if (!wd) continue;

    const img = wd.imagePng || wd.image || wd.originalImage ||
      wd.originalData?.['Картинка png'] || wd.originalData?.['Картинка'] || '';

    if (!img || typeof img !== 'string' || img.trim() === '') continue;
    if (!firstImg) firstImg = img;

    const db = wd.database || wd.sourceDatabase || col.database || '';

    if (db === 'nouns' && !nounImg) { nounImg = img; break; }
    if ((db === 'adjectives' || db === 'verbs') && !adjVerbImg) { adjVerbImg = img; }
  }

  const selected = nounImg || adjVerbImg || firstImg;
  if (selected) {
    setNewQuestion(prev => ({ ...prev, answerImage: selected }));
  }
}, [newQuestion.answerStructure, showQuestionModal]);

// 2. useEffect для автоматической установки картинки ОТВЕТА
// useEffect(() => {
//   if (!showQuestionModal || !newQuestion.answerStructure) return;

//   const hasAnyWord = newQuestion.answerStructure.some(d => d?.word || d?.wordData);
//   if (!hasAnyWord) return;

//   const selectedImage = findBestImage(newQuestion.answerStructure);

//   const structureImages = new Set();
//   newQuestion.answerStructure.forEach(d => {
//     const img = extractImageFromWordData(d);
//     if (img) structureImages.add(img);
//   });

//   setNewQuestion(prev => {
//     const shouldUpdate =
//       !prev.answerImage ||
//       prev.answerImage === autoAnswerImageRef.current ||
//       structureImages.has(prev.answerImage);

//     if (shouldUpdate && selectedImage) {
//       if (prev.answerImage !== selectedImage) {
//         autoAnswerImageRef.current = selectedImage;
//         console.log('🖼️ [ОТВЕТ] Авто-картинка установлена');
//         return { ...prev, answerImage: selectedImage };
//       }
//     }
//     return prev;
//   });
// }, [newQuestion.answerStructure, showQuestionModal]);

// 2. useEffect для автоматической установки картинки ОТВЕТА
useEffect(() => {
  // Автоматически устанавливаем картинку ответа ТОЛЬКО если есть существительное
  // И только если картинка ещё не задана вручную
  if (showQuestionModal && newQuestion.answerStructure && !newQuestion.answerImage) {
    
    // Ищем существительное в структуре ответа
    const nounInAnswer = newQuestion.answerStructure.find(data =>
      data?.wordData?.database === 'nouns' && data?.wordData?.imagePng
    );
    
    if (nounInAnswer) {
      console.log('✅ [ОТВЕТ] Найдено существительное, устанавливаем его картинку');
      setNewQuestion(prev => ({
        ...prev,
        answerImage: nounInAnswer.wordData.imagePng
      }));
    } else {
      console.log('ℹ️ [ОТВЕТ] Существительных нет, картинка не устанавливается автоматически');
      // Оставляем answerImage пустым
    }
  }
}, [
  newQuestion.answerStructure, 
  showQuestionModal, 
  newQuestion.answerImage
]);

// 3. (Опционально) Если нужна более сложная логика: сначала ищем в вопросе, потом в ответе
// для картинки вопроса, но это уже сделано выше отдельно
useEffect(() => {
  if (activeTable === 'nouns' && tableData.length > 0) {
    loadNounGenders();
  }
}, [activeTable, tableData]);
  const loadNumeralsTable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/numerals-table`);
    const data = await response.json();
    setNumeralsTableData(data || []);
  } catch (error) {
    console.error('Error loading numerals table:', error);
    setNumeralsTableData([]);
  }
};

useEffect(() => {
  if (activeTable === 'nouns') {
    loadAllNounGenders();
  }
}, [activeTable, tableData]); // Перезагружаем при изменении данных
const handleSentenceImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  setUploadingImageType('sentence');

  try {
    console.log(`Загрузка изображения для предложения: ${file.name}, размер: ${(file.size / 1024).toFixed(1)}KB`);
    
    // Сжимаем изображение если нужно
    let processedFile = file;
    if (file.size > 300 * 1024) { // > 300KB
      console.log('Сжимаем изображение...');
      processedFile = await compressImage(file, 800, 0.7);
      console.log(`Сжатый размер: ${(processedFile.size / 1024).toFixed(1)}KB`);
    }

    // Конвертируем в base64
    const base64 = await fileToBase64(processedFile);
    
    // Извлекаем только base64 часть
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    console.log(`Отправляем на сервер (длина base64: ${base64Data.length})`);

    // Отправляем на сервер
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name,
        originalSize: file.size,
        compressedSize: processedFile.size
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        // Обновляем поле image в newSentence
        setNewSentence(prev => ({
          ...prev,
          image: result.imageUrl
        }));
        
        alert(`✅ Изображение загружено! (сжато с ${(file.size / 1024).toFixed(0)}KB до ${(processedFile.size / 1024).toFixed(0)}KB)`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка сервера');
    }
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    alert('❌ Ошибка загрузки изображения: ' + error.message);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
    if (event.target) {
      event.target.value = '';
    }
  }
};
const loadAllNounGenders = async () => {
  try {
    // Получаем все imageBase из текущей таблицы
    const imageBases = tableData
      .filter(row => row['База изображение'] && row['База изображение'].trim() !== '')
      .map(row => row['База изображение']);
    
    if (imageBases.length === 0) return;
    
    // Загружаем роды для всех слов
    const response = await fetch(`${API_BASE_URL}/noun-gender/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBases })
    });
    
    if (response.ok) {
      const genderMap = await response.json();
      setNounGenders(genderMap);
    }
  } catch (error) {
    console.error('Error loading noun genders:', error);
  }
};

const addNewNumeralLesson = async () => {
  const maxLessonNumber = getMaxLessonNumber();
  const newLessonNumber = (maxLessonNumber + 0.1).toFixed(1);
  const currentData = getActiveTableData();
  
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    columns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'Картинка png',
      'База числительные номер Русский',
      'База числительные слова Русский',
      'База числительные номер Английский',
      'База числительные слова Английский',
      'База числительные номер Турецкий',
      'База числительные слова Турецкий'
    ];
  }
  
  const newLessonRow = {};
  columns.forEach(col => {
    newLessonRow[col] = '';
  });
  
  newLessonRow['Уровень изучения номер'] = 'A1';
  newLessonRow['Урок номер'] = newLessonNumber;
  newLessonRow['Урок название'] = `Новый урок ${newLessonNumber}`;
  
  const newTableData = [...currentData, newLessonRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
};
// // Добавление нового числительного
const addNewNumeral = async () => {
  const currentData = getActiveTableData();
  
  // Определяем колонки - теперь включаем База изображение
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    columns = ['База изображение', 'Картинка', 'Русский', 'Английский', 'Турецкий'];
  }
  
  // Генерируем новый imageBase
  const maxImageBase = currentData
    .map(row => row['База изображение'])
    .filter(id => id && id.startsWith('numeral_'))
    .map(id => {
      const match = id.match(/numeral_(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        return parseInt(match[3]);
      }
      return 0;
    })
    .reduce((max, current) => Math.max(max, current), 0);
  
  const newImageBase = `numeral_1.1.${maxImageBase + 1}`;
  
  const newRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newRow[col] = newImageBase;
    } else {
      newRow[col] = '';
    }
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
  
  alert(`✅ Новое числительное добавлено с imageBase: ${newImageBase}`);
};
const addNewNumeralWord = async () => {
  const currentData = getActiveTableData();
  
  // Определяем колонки
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    columns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png',
      'База числительные номер Русский',
      'База числительные слова Русский',
      'База числительные номер Английский',
      'База числительные слова Английский',
      'База числительные номер Турецкий',
      'База числительные слова Турецкий'
    ];
  }
  
  // Генерируем новый imageBase
  const maxImageBase = currentData
    .map(row => row['База изображение'])
    .filter(id => id && id.match(/\d+\.\d+\.\d+/))
    .map(id => {
      const parts = id.split('.');
      return parseInt(parts[parts.length - 1] || '0');
    })
    .reduce((max, current) => Math.max(max, current), 0);
  
  const newImageBase = `1.1.${maxImageBase + 1}`;
  
  const newRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newRow[col] = newImageBase;
    } else if (col.includes('База числительные номер')) {
      const language = col.split(' ').pop();
      const languageNumber = getLanguageNumber(language);
      newRow[col] = `${newImageBase}.${languageNumber}`;
    } else {
      newRow[col] = '';
    }
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
  
  alert(`Новое числительное добавлено с imageBase: ${newImageBase}`);
};

// Инициализация таблицы числительных
const initializeNumeralsTable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/numerals-table/init`);
    const result = await response.json();
    if (result.success) {
      await loadNumeralsTable();
      alert(`Таблица числительных инициализирована! Добавлено ${result.count} числительных.`);
    }
  } catch (error) {
    console.error('Error initializing numerals table:', error);
    alert('Ошибка инициализации таблицы: ' + error.message);
  }
};
    // Form states
    const [newLanguage, setNewLanguage] = useState('');
const [newLesson, setNewLesson] = useState({
  studiedLanguage: 'русский',
  hintLanguage: 'турецкий',
  level: 'A1',
  theme: '',
  lessonType: 1,
  lessonNumber: '',
  fontColor: '#000000',
  bgColor: '#ffffff',
  columnsCount: 2,
  columnConfigs: [{ database: 'nouns', filters: {} }, { database: 'nouns', filters: {} }],
  checkDatabase: 'nouns' // Добавляем это поле
});
    const [currentLesson, setCurrentLesson] = useState(null);
  
    const [translationCheck, setTranslationCheck] = useState({
        isValid: true,
        missingWords: [],
        message: ''
    });
    const [testTranslationCheck, setTestTranslationCheck] = useState({
        isValid: true,
        missingWords: [],
        message: ''
    });
    // НОВЫЕ СОСТОЯНИЯ ДЛЯ МОДУЛЕЙ
    const [lessonTypes, setLessonTypes] = useState([]);
    const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
    const [showSentenceModal, setShowSentenceModal] = useState(false);
    const [currentLessonForModule, setCurrentLessonForModule] = useState(null);
    const [lessonModules, setLessonModules] = useState([]);
    const [moduleSentences, setModuleSentences] = useState([]);
    const [editingSentence, setEditingSentence] = useState(null);
    const [verbsTableData, setVerbsTableData] = useState([]);
    console.log('🔄 AdminPage РЕРЕНДЕР, activeTable:', activeTable);
console.log('📊 verbsTableData:', verbsTableData);
const [showVerbConjugationModal, setShowVerbConjugationModal] = useState(false);
const [selectedVerb, setSelectedVerb] = useState(null);
const [verbConjugation, setVerbConjugation] = useState({
  present: {
    я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
  },
  past: {
    я_м: '', я_ж: '', я_с: '',
    ты_м: '', ты_ж: '', ты_с: '',
    он: '', она: '', оно: '',
    мы: '', вы: '', они: ''
  },
  future: {
    я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
  },
  imperative: {
    ты: '', вы: ''
  },
  infinitive: '',
  baseForm: ''
});
// Функция для создания таблицы глаголов с правильной структурой
// Замените существующую createInitialVerbsTable
const createInitialVerbsTable = () => {
  return [
    {
      'База изображение': 'verb_1.1.1',  // <- ОБЯЗАТЕЛЬНО
      'Картинка png': '',
      'Инфинитив': 'бежать',
      'Русский': 'бежать',
      'Английский': 'to run',
      'Турецкий': 'koşmak'
    },
    {
      'База изображение': 'verb_1.1.2',  // <- ОБЯЗАТЕЛЬНО
      'Картинка png': '',
      'Инфинитив': 'говорить',
      'Русский': 'говорить',
      'Английский': 'to speak',
      'Турецкий': 'konuşmak'
    },
    {
      'База изображение': 'verb_1.1.3',  // <- ОБЯЗАТЕЛЬНО
      'Картинка png': '',
      'Инфинитив': 'читать',
      'Русский': 'читать',
      'Английский': 'to read',
      'Турецкий': 'okumak'
    },
    {
      'База изображение': 'verb_1.1.4',  // <- ОБЯЗАТЕЛЬНО
      'Картинка png': '',
      'Инфинитив': 'писать',
      'Русский': 'писать',
      'Английский': 'to write',
      'Турецкий': 'yazmak'
    },
    {
      'База изображение': 'verb_1.1.5',  // <- ОБЯЗАТЕЛЬНО
      'Картинка png': '',
      'Инфинитив': 'есть',
      'Русский': 'есть',
      'Английский': 'to eat',
      'Турецкий': 'yemek'
    }
  ];
};
    const uploadWithProgress = async (url, file) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.send(file);
  });
};
 useEffect(() => {
  if (newLesson.theme && newLesson.studiedLanguage && newLesson.hintLanguage) {
    const check = checkTranslationsForTheme(
      newLesson.theme,
      newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1),
      newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1),
      newLesson.checkDatabase || activeTable
    );
    setTranslationCheck(check);
  } else {
    setTranslationCheck({ isValid: true, missingWords: [], message: '' });
  }
}, [newLesson.theme, newLesson.studiedLanguage, newLesson.hintLanguage, newLesson.checkDatabase, activeTable]);
    // Состояния для создания модуля
    const [newModule, setNewModule] = useState({
        typeId: 1,
        title: '',
        columnsCount: 2,
        columnConfigs: [{database: 'nouns', filters: {}}, {database: 'adjectives', filters: {}}]
    });
    // Состояния для создания предложения
    const [newSentence, setNewSentence] = useState({
  columnData: [],
  image: '',
  // НОВЫЕ ПОЛЯ ДЛЯ ПЕРЕВОДОВ
  customTranslation: '', // Ручной перевод фразы
  autoTranslation: ''     // Автоматический перевод (будет генерироваться)
});
    // Предыдущие настройки для колонок
    const [previousColumnSettings, setPreviousColumnSettings] = useState([]);
    // Автоматическая генерация перевода фразы
// Автоматическая генерация перевода фразы
// Автоматическая генерация перевода фразы
useEffect(() => {
  if (newSentence.columnData && newSentence.columnData.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    
    // Проверяем, есть ли хоть одно слово
    const hasAnyWord = newSentence.columnData.some(data => data?.word && data.word.trim() !== '');
    
    if (!hasAnyWord) {
      setNewSentence(prev => ({
        ...prev,
        autoTranslation: ''
      }));
      return;
    }
    
    // Собираем структуру фразы для перевода - ВАЖНО: используем правильную структуру
    const sentenceStructure = newSentence.columnData.map((data, index) => {
      // Получаем правильное слово для перевода
      let wordForTranslation = '';
      
      if (data.wordData) {
        // Пытаемся найти перевод на язык подсказки
        if (data.wordData.translations) {
          const translations = data.wordData.translations;
          // Ищем перевод на язык подсказки
          const possibleKeys = [
            hintLanguage,
            hintLanguage.toLowerCase(),
            hintLanguage === 'english' ? 'английский' : 
            hintLanguage === 'английский' ? 'english' : hintLanguage,
            'english', 'English', 'английский', 'Английский'
          ];
          
          for (const key of possibleKeys) {
            if (translations[key] && typeof translations[key] === 'string') {
              wordForTranslation = translations[key];
              break;
            }
          }
        }
        
        // Если не нашли перевод, используем displayWord
        if (!wordForTranslation && data.wordData.displayWord) {
          wordForTranslation = data.wordData.displayWord;
        }
        // Если нет displayWord, используем word
        else if (!wordForTranslation && data.word) {
          wordForTranslation = data.word;
        }
      }
      
      // Если всё ещё нет слова, используем data.word
      if (!wordForTranslation) {
        wordForTranslation = data.word || '';
      }
      
      return {
        word: wordForTranslation,
        wordData: data.wordData,
        database: data.database || 'nouns',
        lesson: data.lesson || '',
        number: data.number || '',
        gender: data.gender || '',
        case: data.case || '',
        tense: data.tense || '',
        person: data.person || '',
        verbGender: data.verbGender || '',
        imperativeForm: data.imperativeForm || ''
      };
    }).filter(item => item.word && item.word.trim() !== ''); // Убираем пустые слова
    
    if (sentenceStructure.length === 0) {
      setNewSentence(prev => ({
        ...prev,
        autoTranslation: ''
      }));
      return;
    }
    
    console.log('Generating translation for structure:', sentenceStructure);
    
    // Генерируем автоматический перевод
    const autoTranslation = generateAutoTranslation(sentenceStructure, hintLanguage, false);
    
    console.log('Generated auto translation:', autoTranslation);
    
    // Обновляем состояние
    setNewSentence(prev => {
      const shouldUpdateCustom = !prev.customTranslation || prev.customTranslation.trim() === '';
      
      return {
        ...prev,
        autoTranslation: autoTranslation,
        ...(shouldUpdateCustom && { customTranslation: autoTranslation })
      };
    });
  }
}, [newSentence.columnData, lessonData?.hintLanguage]);
    // Загрузка типов уроков
    useEffect(() => {
        if (isAuthenticated) {
            loadLessonTypes();
        }
    }, [isAuthenticated]);
 const loadModuleSentences = async (moduleId) => {
  try {
    console.log('Loading sentences for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/sentences`);
    if (response.ok) {
      const sentences = await response.json();
      console.log('Loaded sentences:', sentences);
      setModuleSentences(sentences);
    } else {
      console.error('Failed to load sentences');
      setModuleSentences([]);
    }
  } catch (error) {
    console.error('Error loading module sentences:', error);
    setModuleSentences([]);
  }
};
const [autoTranslations, setAutoTranslations] = useState({
  question: '',
  answer: ''
});
const openPodcastModal = async (module) => {
  console.log('Opening podcast modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModulePodcasts([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  // Сбрасываем форму
  setNewPodcast({
    title: '',
    audioFile: null,
    audioPreview: null,
    originalTranscript: '',
    hintTranscript: '',
    hint: '',
    duration: 0
  });
  
  setShowPodcastModal(true);
  
  // Загружаем существующие подкасты модуля
  await loadModulePodcasts(module._id);
};

const loadModulePodcasts = async (moduleId) => {
  try {
    console.log('Loading podcasts for module:', moduleId);
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/podcasts`);
    if (response.ok) {
      const podcasts = await response.json();
      console.log('Loaded podcasts:', podcasts);
      setModulePodcasts(podcasts);
    } else {
      console.error('Failed to load podcasts');
      setModulePodcasts([]);
    }
  } catch (error) {
    console.error('Error loading module podcasts:', error);
    setModulePodcasts([]);
  }
};
const addPodcast = async () => {
  try {
      setIsUploading(true);
    setUploadProgress(0);
    // Проверка обязательных полей
    if (!newPodcast.title.trim()) {
      alert('Введите название Аудио');
      return;
    }

    if (!newPodcast.audioFile) {
      alert('Выберите аудио файл');
      return;
    }

    if (!newPodcast.originalTranscript.trim()) {
      alert('Введите титры на оригинальном языке');
      return;
    }

    // 1. Получаем presigned URL для загрузки
    console.log('Getting upload URL for podcast...');
    const urlResponse = await fetch(`${API_BASE_URL}/podcasts/generate-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: newPodcast.audioFile.name,
        fileType: newPodcast.audioFile.type,
        moduleId: currentLessonForModule._id,
        title: newPodcast.title,
        duration: newPodcast.duration || 0,
        originalTranscript: newPodcast.originalTranscript,
        hintTranscript: newPodcast.hintTranscript || '',
        hint: newPodcast.hint || ''
      })
    });

    if (!urlResponse.ok) {
      const errorText = await urlResponse.text();
      throw new Error(errorText || 'Failed to get upload URL');
    }

    const { success, podcastId, uploadUrl, key } = await urlResponse.json();
    
    if (!success) {
      throw new Error('Failed to get upload URL from server');
    }

    console.log('Got upload URL, starting direct upload to S3...');
    
    // 2. Загружаем файл напрямую в Yandex S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: newPodcast.audioFile,
      headers: {
        'Content-Type': newPodcast.audioFile.type,
        'x-amz-acl': 'public-read'
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('File uploaded to S3, notifying backend...');
    
    // 3. Уведомляем бэкенд об успешной загрузке
    const completeResponse = await fetch(`${API_BASE_URL}/podcasts/complete-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        podcastId,
        key
      })
    });

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      throw new Error(errorText || 'Failed to complete upload');
    }

    const completeResult = await completeResponse.json();
    
    if (completeResult.success) {
      console.log('Podcast saved successfully:', completeResult.podcast);
      
      // Обновляем список подкастов
      await loadModulePodcasts(currentLessonForModule._id);
      alert('Аудио добавлен успешно!');
      
      // Сбрасываем форму
      setNewPodcast({
        title: '',
        audioFile: null,
        audioPreview: null,
        originalTranscript: '',
        hintTranscript: '',
        hint: '',
        duration: 0
      });
    } else {
      throw new Error(completeResult.error || 'Failed to save podcast');
    }
  } catch (error) {
    console.error('Error saving podcast:', error);
    alert('Ошибка сохранения Аудио: ' + error.message);
  }
  finally{
    setIsUploading(false);
    setUploadProgress(0);
  }
};
const deletePodcast = async (podcastId) => {
  if (!confirm('Удалить Аудио?')) return;
  try {
    await fetch(`${API_BASE_URL}/podcasts/${podcastId}`, { method: 'DELETE' });
    await loadModulePodcasts(currentLessonForModule._id);
    alert('Аудио удален!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
// Функция для автоматического перевода структуры
// Улучшенная функция перевода с учетом порядка слов
// Улучшенная функция перевода с учетом языка подсказки
// Улучшенная функция перевода с учетом языка подсказки
// Улучшенная функция перевода с фильтрацией URL
// Улучшенная функция перевода с автоматическим добавлением вопросительного знака
// Улучшенная функция перевода с разделением вопроса и ответа
const generateAutoTranslation = (structure, targetLanguage, isQuestion = true) => {
  
  if (!structure || !Array.isArray(structure)) return '';
    console.log('=== generateAutoTranslation START ===');
  console.log('Structure:', JSON.stringify(structure, (key, value) => {
    if (key === 'wordData' && value) {
      return {
        ...value,
        translations: value.translations ? 'TRANSLATIONS_OBJECT' : null,
        fullTranslations: value.fullTranslations ? 'FULL_TRANSLATIONS_OBJECT' : null
      };
    }
    return value;
  }, 2));
  console.log('Target language:', targetLanguage);
  console.log('Is question:', isQuestion);
  console.log('generateAutoTranslation called with:', { structure, targetLanguage, isQuestion });
  
  const words = structure
    .map((item, index) => {
      // Пропускаем URL картинок
      if (!item.word || 
          item.word.startsWith('http') || 
          item.word.includes('i.ibb.co') ||
          item.word.includes('.jpg') ||
          item.word.includes('.png') ||
          item.word.includes('.jpeg')) {
        return null;
      }
      
      let translatedWord = '';
      
      // Для глаголов - особая обработка
      if (item.database === 'verbs') {
        console.log('Processing verb item:', item);
        
        if (item.wordData?.translations) {
          const translations = item.wordData.translations;
          console.log('Verb translations:', translations);
          
          // Пробуем найти перевод на целевой язык
          // targetLanguage может быть 'английский' или 'english'
          const possibleKeys = [
            targetLanguage,                          // 'английский'
            targetLanguage.toLowerCase(),            // 'английский'
            targetLanguage.toUpperCase(),            // 'АНГЛИЙСКИЙ'
            targetLanguage === 'английский' ? 'english' : targetLanguage,  // 'english'
            targetLanguage === 'english' ? 'английский' : targetLanguage,  // 'английский'
            'english',                                // всегда пробуем english
            'English',
            'английский',
            'Английский'
          ];
          
          for (const key of possibleKeys) {
            if (translations[key]) {
              translatedWord = translations[key];
              console.log(`Found translation for key "${key}":`, translatedWord);
              break;
            }
          }
          
          // Если не нашли, берем любой перевод
          if (!translatedWord) {
            const values = Object.values(translations);
            if (values.length > 0) {
              translatedWord = values[0];
              console.log('Using first available translation:', translatedWord);
            }
          }
        } else {
          translatedWord = item.word || '';
        }
      }
      // Для специальных слов (Предлоги, частицы, вопросительные слова)
      else if (item.wordData?.isSpecialWord) {
        const translations = item.wordData.translations || {};
        translatedWord = translations[targetLanguage] || 
                        translations[targetLanguage.toLowerCase()] ||
                        translations[targetLanguage.toUpperCase()] ||
                        Object.values(translations)[0] || 
                        item.word || '';
      } 
      // Для обычных слов
   // Для обычных слов
else if (item.wordData?.translations) {
  const translations = item.wordData.translations;
  console.log('Processing regular word with translations:', translations);
  
  // Пробуем разные варианты ключей
  const possibleKeys = [
    targetLanguage,
    targetLanguage.toLowerCase(),
    targetLanguage.toUpperCase(),
    targetLanguage === 'английский' ? 'english' : 
    targetLanguage === 'english' ? 'английский' : 
    targetLanguage === 'русский' ? 'russian' :
    targetLanguage === 'russian' ? 'русский' :
    targetLanguage === 'турецкий' ? 'turkish' :
    targetLanguage === 'turkish' ? 'турецкий' : targetLanguage
  ];
  
  // Добавляем проверку на наличие переводов в разных форматах
  for (const key of possibleKeys) {
    if (translations[key]) {
      translatedWord = translations[key];
      console.log(`Found translation for key "${key}":`, translatedWord);
      break;
    }
  }
  
  // Если не нашли, проверяем fullTranslations (для причастий)
  if (!translatedWord && item.wordData.fullTranslations) {
    console.log('Checking fullTranslations:', item.wordData.fullTranslations);
    const langMap = {
      'турецкий': 'Турецкий',
      'turkish': 'Турецкий',
      'русский': 'Русский',
      'russian': 'Русский',
      'английский': 'Английский',
      'english': 'Английский'
    };
    
    const targetKey = langMap[targetLanguage] || 
                      (targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1));
    
    if (item.wordData.fullTranslations[targetKey]) {
      const langData = item.wordData.fullTranslations[targetKey];
      console.log('Found in fullTranslations:', langData);
      if (langData.род) {
        translatedWord = langData.род;
      } else if (langData.masculine) {
        translatedWord = langData.masculine;
      } else if (langData.мужской) {
        translatedWord = langData.мужской;
      }
    }
  }
  
  // Если все еще не нашли, берем любой перевод
  if (!translatedWord) {
    const values = Object.values(translations);
    if (values.length > 0) {
      // Пробуем найти строковое значение
      for (const value of values) {
        if (typeof value === 'string' && value.trim() !== '') {
          translatedWord = value;
          console.log('Using first string value:', value);
          break;
        }
      }
    }
  }
}else {
        translatedWord = item.word || '';
      }
      
      return {
        word: translatedWord,
        isFirstWord: index === 0
      };
    })
    .filter(item => item && item.word && item.word.trim() !== '');

  // Собираем текст с нормализацией
  let normalizedText = '';
  
  if (isQuestion) {
    // Для вопросов: первое слово с заглавной, остальные строчные
    normalizedText = words.map((item, index) => {
      if (index === 0) {
        return item.word.charAt(0).toUpperCase() + item.word.slice(1).toLowerCase();
      }
      return item.word.toLowerCase();
    }).join(' ');
    
    // Добавляем вопросительный знак если его нет
    if (normalizedText && !normalizedText.endsWith('?')) {
      normalizedText += '?';
    }
  } else {
    // Для ответов: первое слово с заглавной, остальные как есть
    normalizedText = words.map((item, index) => {
      if (index === 0) {
        return item.word.charAt(0).toUpperCase() + item.word.slice(1);
      }
      return item.word;
    }).join(' ');
    
    // Добавляем точку если нет знака препинания
    if (normalizedText && !/[.!?]$/.test(normalizedText)) {
      normalizedText += '.';
    }
  }
  
  console.log('Generated translation:', normalizedText);
  return normalizedText || '—';
};
// В useEffect для перевода вопроса
// В useEffect для перевода вопроса
// В AdminPage.js, функция openEditModuleModal для модулей вопросов

const openEditModuleModal = async (module) => {
  console.log('Opening edit modal for module:', module);
  
  setEditingModule(module);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    if (!lessonResponse.ok) {
      throw new Error('Failed to load lesson');
    }
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
    
    if (module.typeId === 1) {
      // Для модуля ЛЕКСИКА
      console.log('Loading lexicon module for editing:', module);
      
      // Загружаем данные модуля
      const moduleResponse = await fetch(`${API_BASE_URL}/lesson-modules/${module._id}`);
      if (!moduleResponse.ok) {
        throw new Error('Failed to load module data');
      }
      const fullModule = await moduleResponse.json();
      
      // ★★★ ИСПРАВЛЕНИЕ: Добавляем sourceDatabase к каждому слову ★★★
      const wordsWithSourceDatabase = (fullModule.config?.words || []).map(word => ({
        ...word,
        sourceDatabase: word.database || 'nouns',  // Добавляем sourceDatabase
        database: word.database || 'nouns'          // Убеждаемся, что database есть
      }));
      
      // Заполняем форму для лексики
      setEditLexiconModule({
        database: fullModule.config?.database || 'nouns',
        theme: fullModule.config?.theme || '',
        selectedWords: wordsWithSourceDatabase  // ← Используем слова с sourceDatabase
      });
      
      setShowEditModuleModal(true);
      
    } else if (module.typeId === 4) {
      // Для модуля вопросов
      setNewQuestionModule({
        typeId: 4,
        title: module.title,
        questionColumnsCount: module.config?.questionColumnsCount || 3,
        answerColumnsCount: module.config?.answerColumnsCount || 3,
        requiresPairAnswer: module.config?.requiresPairAnswer !== false,
        relatedToModuleId: module.config?.relatedToModuleId || null,
        relatedToModuleType: module.config?.relatedToModuleType || '',
        questionColumnConfigs: module.config?.questionColumnConfigs || [
          { database: 'question-words', filters: {} },
          { database: 'nouns', filters: {} },
          { database: 'adjectives', filters: {} }
        ],
        answerColumnConfigs: module.config?.answerColumnConfigs || [
          { database: 'nouns', filters: {} },
          { database: 'prepositions', filters: {} },
          { database: 'nouns', filters: {} }
        ]
      });
      
      setShowEditModuleModal(true);
    }
    
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    alert('Ошибка загрузки данных модуля: ' + error.message);
  }
};
const updateLexiconModule = async () => {
  try {
    if (editLexiconModule.selectedWords.length === 0) {
      alert('Выберите хотя бы одно слово для модуля');
      return;
    }

    const moduleData = {
      title: editingModule.title,
      config: {
        database: editLexiconModule.database,
        theme: editLexiconModule.theme,
        words: editLexiconModule.selectedWords.map(word => {
          // Создаем правильную структуру слова с сохранением всех данных
          const wordObj = {
            imageBase: word.imageBase || word.id,
            imagePng: word.imagePng || '',
            displayWord: word.displayWord || word.word || '',
            database: word.database || word.sourceDatabase || editLexiconModule.database,
            translations: {},
            originalData: word.originalData || null,
            fullTranslations: word.fullTranslations || null,
            cases: word.cases || null,
            declensions: word.declensions || null,
            conjugation: word.conjugation || null
          };
          
          // Копируем все переводы
          if (word.translations) {
            wordObj.translations = { ...word.translations };
          } else if (word.wordData?.translations) {
            wordObj.translations = { ...word.wordData.translations };
          }
          
          // Для специальных типов данных
          if (word.database === 'participles' && word.fullTranslations) {
            wordObj.fullTranslations = word.fullTranslations;
          }
          if (word.database === 'verbs' && word.conjugation) {
            wordObj.conjugation = word.conjugation;
          }
          if (word.database === 'pronouns' && word.declensions) {
            wordObj.declensions = word.declensions;
          }
          if (word.database === 'numerals' && word.cases) {
            wordObj.cases = word.cases;
          }
          
          return wordObj;
        })
      }
    };

    console.log('Updating lexicon module:', moduleData);

    const response = await fetch(`${API_BASE_URL}/lesson-modules/${editingModule._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData)
    });

    if (response.ok) {
      const updatedModule = await response.json();
      alert(`Модуль "${editingModule.title}" обновлен успешно! Слов: ${editLexiconModule.selectedWords.length}`);
      setShowEditModuleModal(false);
      
      // Обновляем список модулей
      await loadLessonModules(editingModule.lessonId);
      
      // Сбрасываем форму
      setEditingModule(null);
      setEditLexiconModule({
        database: 'nouns',
        selectedWords: [],
        theme: ''
      });
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update module');
    }
  } catch (error) {
    console.error('Error updating lexicon module:', error);
    alert('Ошибка обновления модуля: ' + error.message);
  }
};
useEffect(() => {
  if (newQuestion && newQuestion.questionStructure && newQuestion.questionStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    console.log('Generating auto translation for question with:', {
      structure: newQuestion.questionStructure.map(item => ({
        word: item.word,
        database: item.database,
        translations: item.wordData?.translations
      })),
      hintLanguage,
      lessonData
    });
    
    const autoQuestion = generateAutoTranslation(newQuestion.questionStructure, hintLanguage, true);
    console.log('Auto translation result:', autoQuestion);
    
    setAutoTranslations(prev => ({
      ...prev,
      question: autoQuestion
    }));
  }
}, [newQuestion?.questionStructure, lessonData?.hintLanguage]);

// В useEffect для перевода ответа
useEffect(() => {
  if (newQuestion && newQuestion.answerStructure && newQuestion.answerStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoAnswer = generateAutoTranslation(newQuestion.answerStructure, hintLanguage);
    setAutoTranslations(prev => ({
      ...prev,
      answer: autoAnswer
    }));
  }
}, [newQuestion?.answerStructure, lessonData?.hintLanguage]);

// При изменении структуры вопроса/ответа генерируем автоматический перевод
useEffect(() => {
  if (newQuestion.questionStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoQuestion = generateAutoTranslation(newQuestion.questionStructure, hintLanguage, true);
    setAutoTranslations(prev => ({
      ...prev,
      question: autoQuestion || ''
    }));
  }
}, [newQuestion.questionStructure, lessonData?.hintLanguage]);

useEffect(() => {
  if (newQuestion.answerStructure.length > 0) {
    const hintLanguage = lessonData?.hintLanguage || 'english';
    const autoAnswer = generateAutoTranslation(newQuestion.answerStructure, hintLanguage, false);
    setAutoTranslations(prev => ({
      ...prev,
      answer: autoAnswer || ''
    }));
  }
}, [newQuestion.answerStructure, lessonData?.hintLanguage]);
const checkAndAddQuestionType = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-types/add-missing`, {
      method: 'POST'
    });
    const result = await response.json();
    console.log('Question type check:', result);
    
    // Перезагружаем типы уроков
    await loadLessonTypes();
  } catch (error) {
    console.error('Error checking question type:', error);
  }
};

// Вызовите эту функцию после загрузки приложения
useEffect(() => {
  if (isAuthenticated) {
    loadLessonTypes();
    checkAndAddQuestionType(); // Добавьте этот вызов
  }
}, [isAuthenticated]);

// Добавьте эту функцию в WordSelector, после других вспомогательных функций
const getTranslationForLanguage = (wordData, targetLanguage) => {
  if (!wordData) return '';
  
  targetLanguage = targetLanguage.toLowerCase();
  
  // Пробуем найти перевод в translations
  if (wordData.translations) {
    const possibleKeys = [
      targetLanguage,
      targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1),
      targetLanguage === 'english' ? 'английский' : 
      targetLanguage === 'english' ? 'Английский' :
      targetLanguage === 'russian' ? 'русский' :
      targetLanguage === 'russian' ? 'Русский' :
      targetLanguage === 'turkish' ? 'турецкий' :
      targetLanguage === 'turkish' ? 'Турецкий' : targetLanguage
    ];
    
    for (const key of possibleKeys) {
      if (wordData.translations[key]) {
        return wordData.translations[key];
      }
    }
  }
  
  // Если не нашли в translations, возвращаем displayWord или word
  return wordData.displayWord || wordData.word || '';
};
// Функция фильтрации данных по поиску и букве
const getFilteredData = () => {
  const currentData = getActiveTableData();
  
  // Если нет фильтров, возвращаем все данные
  if (!searchTerm && !selectedLetter) {
    return currentData;
  }
  
  // Определяем, какие колонки проверять для поиска
  let searchColumns = [];
  if (activeTable === 'nouns') {
    searchColumns = ['База существительные слова Русский', 'База существительные слова Английский', 'База существительные слова Турецкий'];
  } else if (activeTable === 'adjectives') {
    searchColumns = ['База прилагательные базовая форма Русский', 'База прилагательные базовая форма Английский', 'База прилагательные базовая форма Турецкий'];
  } else if (activeTable === 'verbs') {
    searchColumns = ['Инфинитив', 'Английский', 'Турецкий'];
  } else {
    // Для других таблиц ищем по всем колонкам
    return currentData.filter(row => {
      if (!searchTerm) return true;
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }
  
  return currentData.filter(row => {
    // Пропускаем заголовки уроков (строки с Урок название)
    if (row['Урок название'] && row['Урок название'].trim() !== '') {
      return true;
    }
    
    // Фильтр по первой букве
    if (selectedLetter) {
      let hasMatchingLetter = false;
      for (const col of searchColumns) {
        const value = row[col];
        if (value && String(value).trim() !== '') {
          const firstLetter = String(value).trim().charAt(0).toUpperCase();
          if (firstLetter === selectedLetter) {
            hasMatchingLetter = true;
            break;
          }
        }
      }
      if (!hasMatchingLetter) return false;
    }
    
    // Поиск по тексту
    if (searchTerm) {
      let hasMatch = false;
      for (const col of searchColumns) {
        const value = row[col];
        if (value && String(value).toLowerCase().includes(searchTerm.toLowerCase())) {
          hasMatch = true;
          break;
        }
      }
      return hasMatch;
    }
    
    return true;
  });
};
 const loadLessonTypes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lesson-types`);
    let types = [];
    
    if (response.ok) {
      types = await response.json();
      console.log('Types from backend:', types);
    }
    
    // ВРЕМЕННО: Если тип "Вопрос" отсутствует, добавляем его на фронтенде
    if (!types.some(t => t.typeId === 4)) {
      console.log('Adding question type on frontend temporarily');
      types.push({
        typeId: 4,
        name: 'вопрос',
        description: 'Урок с вопросами и ответами',
        config: {
          requiresPairAnswer: true,
          questionColumns: 3,
          answerColumns: 3,
          availableDatabases: ['nouns', 'adjectives', 'verbs', 'pronouns', 'numerals', 'adverbs', 'prepositions', 'question-words', 'gerunds', 'participles']
        }
      });
    }
    if (!types.some(t => t.typeId === 5)) {
      console.log('Adding podcast type on frontend temporarily');
      types.push({
        typeId: 5,
        name: 'Аудио',
        description: 'Аудио урок с титрами и подсказками',
        config: {
          hasAudio: true,
          requiresTranscript: true,
          supportsMultipleLanguages: true
        }
      });
    }



        if (!types.some(t => t.typeId === 6)) {
      console.log('Adding podcast type on frontend temporarily');
      types.push( {
        typeId: 6,
        name: 'Текст',
        description: 'Модуль с картинкой и текстом',
        config: {
          hasImage: true,
          hasText: true,
          maxTextLength: 2000
        }
      });
    }
      if (!types.some(t => t.typeId === 7)) {
      console.log('Adding podcast type on frontend temporarily');
      types.push(   {
        typeId: 7,
        name: 'Видео',
        description: 'Видео урок с титрами и подсказками',
        config: {
          hasVideo: true,
          requiresTranscript: true,
          supportsMultipleLanguages: true,
          maxFileSize: 200 * 1024 * 1024 // 200MB для видео
        }
      });
    }

     if (!types.some(t => t.typeId === 8)) {
      console.log('Adding podcast type on frontend temporarily');
      types.push(   {
        typeId: 8,
        name: 'Грамматика',
        description: 'Грамматические правила с таблицами примеров',
        config: {
          hasMedia: true,
          hasExplanation: true,
          hasTable: true,
          maxRows: 20,
          maxColumns: 10,
          availableDatabases: ['nouns', 'adjectives', 'verbs', 'pronouns', 'numerals', 'adverbs', 'prepositions', 'question-words', 'gerunds', 'participles']
        }
      });
    }
 if (!types.some(t => t.typeId === 9)) {
  types.push({
    typeId: 9,
    name: 'Тест',
    description: 'Универсальный тест с вариантами ответов',
    config: {
      supportsMultipleCorrect: true,
      maxRows: 10,
      maxColumns: 10
    }
  });
}
    setLessonTypes(types);
    console.log('Final lesson types:', types);
    
  } catch (error) {
    console.error('Error loading lesson types:', error);
    // Fallback types с numerals
    const fallbackTypes = [
      {
        typeId: 1,
        name: 'Лексика',
        description: 'Урок с отдельными словами и картинками'
      },
      {
        typeId: 2,
        name: 'Тест лексика',
        description: 'Тест на знание слов (интегрированный в модули)',
        config: {
          supportsWordSelection: true,
          requiresWordCount: true,
          availableDatabases: ['nouns', 'adjectives', 'adverbs', 'question-words', 'prepositions', 'gerunds', 'verbs', 'numerals', 'participles']
        }
      },
      {
        typeId: 3,
        name: 'Фразы',
        description: 'Урок с составлением предложений',
        config: {
          maxColumns: 20,
          availableDatabases: ['nouns', 'adjectives', 'adverbs', 'pronouns', 'numerals', 'adverbs', 'prepositions', 'question-words', 'gerunds', 'verbs', 'participles']
        }
      },
      {
        typeId: 4,
        name: 'Вопрос',
        description: 'Урок с вопросами и ответами',
        config: {
          requiresPairAnswer: true,
          questionColumns: 3,
          answerColumns: 3,
          availableDatabases: ['nouns', 'adjectives', 'verbs', 'pronouns', 'numerals', 'adverbs', 'prepositions', 'question-words', 'gerunds', 'participles']
        }
      },
    ];
    setLessonTypes(fallbackTypes);
  }
};

const loadModuleQuestions = async (moduleId) => {
  try {
    console.log('Loading questions for module:', moduleId);
    // ИСПРАВЛЕННЫЙ URL - используйте тот, который есть в бэкенде
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}/questions`);
    if (response.ok) {
      const questions = await response.json();
      console.log('Loaded questions:', questions);
      setModuleQuestions(questions);
    } else {
      console.error('Failed to load questions');
      setModuleQuestions([]);
    }
  } catch (error) {
    console.error('Error loading module questions:', error);
    setModuleQuestions([]);
  }
};

const getLanguageFromColumn = (columnName) => {
  if (columnName.includes('Русский')) return 'русский';
  if (columnName.includes('Английский')) return 'английский';
  if (columnName.includes('Турецкий')) return 'турецкий';
  if (columnName.includes('Испанский')) return 'испанский';
  if (columnName.includes('Немецкий')) return 'немецкий';
  if (columnName.includes('Французский')) return 'французский';
  if (columnName.includes('Итальянский')) return 'итальянский';
  if (columnName.includes('Китайский')) return 'китайский';
  if (columnName.includes('Японский')) return 'японский';
  if (columnName.includes('Корейский')) return 'корейский';
  if (columnName.includes('Арабский')) return 'арабский';
  return columnName.split(' ').pop();
};
// Сохраняем настройки для следующего вопроса
const saveQuestionSettings = () => {
  const questionSettings = newQuestion.questionStructure.map(data => ({
    lesson: data.lesson || '',
    number: data.number || '',
    gender: data.gender || '',
    case: data.case || ''
  }));
  
  const answerSettings = newQuestion.answerStructure.map(data => ({
    lesson: data.lesson || '',
    number: data.number || '',
    gender: data.gender || '',
    case: data.case || ''
  }));
  
  // Сохраняем в localStorage или state для использования в следующем вопросе
  localStorage.setItem('questionSettings', JSON.stringify(questionSettings));
  localStorage.setItem('answerSettings', JSON.stringify(answerSettings));
};

// Сбрасываем форму с сохранением настроек
const resetQuestionFormWithSettings = () => {
  const savedQuestionSettings = JSON.parse(localStorage.getItem('questionSettings') || '[]');
  const savedAnswerSettings = JSON.parse(localStorage.getItem('answerSettings') || '[]');
  
  const questionColumnCount = currentLessonForModule?.config?.questionColumnConfigs?.length || 3;
  const answerColumnCount = currentLessonForModule?.config?.answerColumnConfigs?.length || 3;
  
  const initialQuestionStructure = Array.from({ length: questionColumnCount }, (_, index) => {
    const saved = savedQuestionSettings[index] || {};
    return {
      lesson: saved.lesson || '',
      number: saved.number || '',
      gender: saved.gender || '',
      case: saved.case || '',
      word: '',
      wordData: null
    };
  });
  
  const initialAnswerStructure = Array.from({ length: answerColumnCount }, (_, index) => {
    const saved = savedAnswerSettings[index] || {};
    return {
      lesson: saved.lesson || '',
      number: saved.number || '',
      gender: saved.gender || '',
      case: saved.case || '',
      word: '',
      wordData: null
    };
  });
  
  setNewQuestion({
    questionStructure: initialQuestionStructure,
    answerStructure: initialAnswerStructure,
    questionImage: '',
    answerImage: '',
    hint: '',
    requiresPairAnswer: true, // ← Добавьте это
    englishQuestion: '',
    englishAnswer: ''
  });

};

// Полный сброс формы
const resetQuestionForm = () => {
  const questionColumnCount = currentLessonForModule?.config?.questionColumnConfigs?.length || 3;
  const answerColumnCount = currentLessonForModule?.config?.answerColumnConfigs?.length || 3;
  
  const initialQuestionStructure = Array.from({ length: questionColumnCount }, (_, index) => ({
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  }));
  
  const initialAnswerStructure = Array.from({ length: answerColumnCount }, (_, index) => ({
    lesson: '',
    number: '',
    gender: '',
    case: '',
    word: '',
    wordData: null
  }));
  
  setNewQuestion({
    questionStructure: initialQuestionStructure,
    answerStructure: initialAnswerStructure,
    questionImage: '',
    answerImage: '',
    hint: '',
    requiresPairAnswer: true, // ← Значение по умолчанию
    englishQuestion: '',
    englishAnswer: ''
  });
};
// Добавьте этот код где-нибудь в начале компонента AdminPage, например после других функций
const getDatabaseDisplayName = (database) => {
  const databaseNames = {
    'nouns': 'Существительное',
    'adjectives': 'Прилагательное',
    'verbs': 'Глагол',
    'pronouns': 'Местоимение', 
    'numerals': 'Числительное',  // ← ДОБАВЬТЕ
    'adverbs': 'Наречие',
    'prepositions': 'предлог, частица',
    'question-words': 'Вопросительное слово',
    'gerunds': 'Деепричастие',
    'participles': 'Причастие'
  };
  return databaseNames[database] || database;
};
// В AdminPage.js, замените функцию openQuestionModal на эту:

const openQuestionModal = async (module, question = null) => {
  console.log('Opening question modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleQuestions([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  // Инициализация структуры с учетом фильтров
  const questionColumnCount = module.config?.questionColumnConfigs?.length || 3;
  const answerColumnCount = module.config?.answerColumnConfigs?.length || 3;
  
  if (question) {
    // Редактирование существующего вопроса
    console.log('Editing existing question:', question);
    setNewQuestion({
      questionStructure: question.questionStructure || [],
      answerStructure: question.answerStructure || [],
      questionImage: question.questionImage || '',
      answerImage: question.answerImage || '',
      hint: question.hint || '',
      requiresPairAnswer: question.requiresPairAnswer !== false,
      englishQuestion: question.englishQuestion || '',
      englishAnswer: question.englishAnswer || '',
      // Информация о привязке из модуля
      relatedToModuleType: module.config?.relatedToModuleType || 'phrases'
    });
    setEditingQuestion(question); // ← ИСПРАВЛЕНО: используем правильное состояние
  } else {
    // Создание нового с предзаполнением
    const initialQuestionStructure = Array.from({ length: questionColumnCount }, (_, index) => ({
      lesson: '',
      number: '',
      gender: '',
      case: '',
      word: '',
      wordData: null
    }));

    const initialAnswerStructure = Array.from({ length: answerColumnCount }, (_, index) => ({
      lesson: '',
      number: '',
      gender: '',
      case: '',
      word: '',
      wordData: null
    }));

    setNewQuestion({
      questionStructure: initialQuestionStructure,
      answerStructure: initialAnswerStructure,
      questionImage: '',
      answerImage: '',
      hint: '',
      requiresPairAnswer: module.config?.requiresPairAnswer !== false,
      englishQuestion: '',
      englishAnswer: '',
      // Информация о привязке из модуля
      relatedToModuleType: module.config?.relatedToModuleType || 'phrases'
    });
    setEditingQuestion(null); // ← ИСПРАВЛЕНО: сбрасываем состояние редактирования
  }
  
  setShowQuestionModal(true);
  await loadModuleQuestions(module._id);
};
const deleteQuestion = async (questionId) => {
  if (!confirm('Удалить вопрос?')) return;
  try {
    await fetch(`${API_BASE_URL}/questions/${questionId}`, { method: 'DELETE' });
    await loadModuleQuestions(currentLessonForModule._id);
    alert('Вопрос удален!');
  } catch (error) {
    alert('Ошибка удаления: ' + error.message);
  }
};
   const loadLessonModules = async (lessonId) => {
    try {
        console.log('Loading modules for lesson:', lessonId);
        const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/modules`);
        if (response.ok) {
            const modules = await response.json();
            console.log('Loaded modules:', modules);
           setLessonModules(prev => {
  const prevArray = Array.isArray(prev) ? prev : [];
  const filtered = prevArray.filter(m => m.lessonId !== lessonId);
  return [...filtered, ...modules];
});
            return modules; // Возвращаем модули для использования
        } else {
            console.error('Failed to load modules');
            setLessonModules([]);
            return [];
        }
    } catch (error) {
        console.error('Error loading lesson modules:', error);
        setLessonModules([]);
        return [];
    }
};
 
    // Модалка создания модуля
   const openCreateModuleModal = async (lesson) => {
    
     if (lesson._id && lesson._id.startsWith('table_')) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/create-from-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableLessonId: lesson._id,
          studiedLanguage: lesson.studiedLanguage,
          hintLanguage: lesson.hintLanguage
        })
      });
      
      if (response.ok) {
        const dbLesson = await response.json();
        lesson = dbLesson; // Заменяем табличный урок на урок из базы данных
        console.log('Created lesson in database:', dbLesson);
      }
    } catch (error) {
      console.error('Error creating lesson from table:', error);
      alert('Ошибка создания урока в базе данных: ' + error.message);
      return;
    }
  }
    setCurrentLessonForModule(lesson);
  
    // Загружаем модули для этого урока и ждем завершения
    const modules = await loadLessonModules(lesson._id);
  
    // Инициализируем конфигурации колонок на основе загруженных модулей
    const initialColumnConfigs = Array.from({ length: newModule.columnsCount }, (_, i) =>
        newModule.columnConfigs[i] || {database: 'nouns', filters: {}}
    );
   const maxOrder = lessonModules
    .filter(m => m.lessonId === lesson._id)
    .reduce((max, m) => Math.max(max, m.order || 0), 0);
  
  // Новый модуль получает order = maxOrder + 10
  setNewModule({
    ...newModule,
    title: `${lesson.title} - модуль`,
    order: maxOrder + 10, // ← добавляем order
    columnConfigs: initialColumnConfigs
  });
  
  setShowCreateModuleModal(true);
    if (newModule.typeId === 2) {
  // Инициализируем конфигурацию теста
  setNewTestModule({
    database: 'nouns',
    wordCount: 8,
    theme: '',
    selectedWords: []
  });
}
  
    setShowCreateModuleModal(true);
};
 useEffect(() => {
    if (showCreateLessonModal && newLesson.theme) {
      const currentData = getActiveTableData();
      let foundNumber = '';
      for (const row of currentData) {
        if (row['Урок название'] === newLesson.theme) {
          foundNumber = row['Урок номер'];
          break;
        }
      }
      setNewLesson(prev => ({ ...prev, lessonNumber: foundNumber }));
    }
  }, [newLesson.theme, showCreateLessonModal, activeTable]);  
  
  // Функция для вставки модуля после определенного модуля

const insertModuleAfter = async (targetModuleId) => {
  const modules = lessonModules
    .filter(m => m.lessonId === currentLessonForModule._id)
    .sort((a, b) => a.order - b.order);
  
  const targetIndex = modules.findIndex(m => m._id === targetModuleId);
  
  if (targetIndex === -1) return;
  
  // Вычисляем новый order (среднее между текущим и следующим)
  const currentOrder = modules[targetIndex].order;
  const nextOrder = targetIndex < modules.length - 1 ? modules[targetIndex + 1].order : currentOrder + 20;
  const newOrder = Math.floor((currentOrder + nextOrder) / 2);
  
  // Открываем модалку создания модуля с предустановленным order
  setNewModule({
    ...newModule,
    order: newOrder
  });
  setShowCreateModuleModal(true);
};
  
  // Создание модуля
const createModule = async () => {
  try {
    const selectedType = lessonTypes.find(t => t.typeId === newModule.typeId);
    if (!selectedType) {
      alert('Выбран неверный тип урока');
      return;
    }

    let moduleData = {
      lessonId: currentLessonForModule._id,
      typeId: newModule.typeId,
      title: newModule.title,
      order: newModule.order,
      content: [],
      isActive: true
    };
    
    console.log('Creating module with data:', moduleData);

    // Добавляем конфигурацию в зависимости от типа
    if (newModule.typeId === 3) {
      moduleData.config = {
        columnsCount: newModule.columnsCount,
        columnConfigs: newModule.columnConfigs.map(config => ({
          database: config.database,
          filters: {
            number: config.filters?.number || '',
            gender: config.filters?.gender || '',
            case: config.filters?.case || ''
          }
        }))
      };
    } 
    else if (newModule.typeId === 4) {
      // ★★★ ИСПРАВЛЕНИЕ: Загружаем существующие модули перед созданием ★★★
      let existingModules = [];
      try {
        // Загружаем модули текущего урока
        const modulesResponse = await fetch(`${API_BASE_URL}/lessons/${currentLessonForModule._id}/modules`);
        if (modulesResponse.ok) {
          existingModules = await modulesResponse.json();
          console.log('Loaded existing modules for question config:', existingModules.length);
        }
      } catch (error) {
        console.error('Error loading modules for question config:', error);
      }
      
      moduleData.config = {
        questionColumnsCount: newQuestionModule.questionColumnsCount,
        answerColumnsCount: newQuestionModule.answerColumnsCount,
        requiresPairAnswer: newQuestionModule.requiresPairAnswer,
        relatedToModuleId: newQuestionModule.relatedToModuleId || null,
        relatedToModuleType: newQuestionModule.relatedToModuleType || '',
        questionColumnConfigs: newQuestionModule.questionColumnConfigs.map(config => ({
          database: config.database,
          filters: {
            number: config.filters?.number || '',
            gender: config.filters?.gender || '',
            case: config.filters?.case || ''
          }
        })),
        answerColumnConfigs: newQuestionModule.answerColumnConfigs.map(config => ({
          database: config.database,
          filters: {
            number: config.filters?.number || '',
            gender: config.filters?.gender || '',
            case: config.filters?.case || ''
          }
        }))
      };
    }
else if (newModule.typeId === 9) {
  moduleData.config = {
    rows: newTestModuleConfig.rows || 3,
    columns: newTestModuleConfig.columns || 2,
    questionColumnConfigs: newTestModuleConfig.questionColumnConfigs || [
      { database: 'nouns', filters: {} },
      { database: 'adjectives', filters: {} },
      { database: 'verbs', filters: {} }
    ]
  };
}
  else if (newModule.typeId === 2) {
  // Проверяем, что выбран лексика-модуль
  if (!newTestModule.sourceLexiconModuleId) {
    alert('Выберите модуль "Лексика" как источник слов для теста');
    return;
  }
  if (newTestModule.selectedWords.length === 0) {
    alert('В выбранном модуле "Лексика" нет слов');
    return;
  }

  moduleData.config = {
    sourceLexiconModuleId: newTestModule.sourceLexiconModuleId,
    wordCount: newTestModule.wordCount,
    // Сохраняем снимок слов на момент создания (бэкенд всё равно возьмёт актуальные)
    words: newTestModule.selectedWords
  };
}


    console.log('Creating module:', moduleData);
    const response = await fetch(`${API_BASE_URL}/lesson-modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moduleData)
    });

    if (response.ok) {
      const savedModule = await response.json();
      alert(`Модуль "${newModule.title}" создан успешно!`);
      setShowCreateModuleModal(false);
     setNewTestModule({
  sourceLexiconModuleId: '',
  wordCount: 8,
  selectedWords: []
});
      
      // Сброс форм
      setNewModule({
        typeId: 1,
        title: '',
        columnsCount: 2,
        columnConfigs: []
      });
      setNewQuestionModule({
        typeId: 4,
        title: '',
        questionColumnsCount: 3,
        answerColumnsCount: 3,
        requiresPairAnswer: true,
        relatedToModuleId: null,
        relatedToModuleType: '',
        questionColumnConfigs: [
          { database: 'question-words', filters: {} },
          { database: 'nouns', filters: {} },
          { database: 'adjectives', filters: {} }
        ],
        answerColumnConfigs: [
          { database: 'nouns', filters: {} },
          { database: 'prepositions', filters: {} },
          { database: 'nouns', filters: {} }
        ]
      });

      // Немедленно обновляем список модулей
      await loadLessonModules(currentLessonForModule._id);

      // Если это модуль вопросов, открываем модалку для добавления вопросов
      if (newModule.typeId === 4) {
        setCurrentLessonForModule(savedModule);
        setShowQuestionModal(true);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create module');
    }
  } catch (error) {
    console.error('Error creating module:', error);
    alert('Ошибка создания модуля: ' + error.message);
  }
};
useEffect(() => {
  if (showLessonsModal && lessons && lessons.length > 0) {
    lessons.forEach(l => {
      const already = lessonModules && lessonModules.some(m => m.lessonId === l._id);
      if (!already) {
        loadLessonModules(l._id);
      }
    });
  }
}, [showLessonsModal, lessons]);
    // Удаление модуля
const deleteModule = async (moduleId, moduleTitle, lessonId) => { 

  if (!confirm(`Вы уверены, что хотите удалить модуль "${moduleTitle}"?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await loadLessonModules(lessonId);  
      alert('Модуль удален успешно!');
    } else {
      throw new Error('Failed to delete module');
    }
  } catch (error) {
    console.error('Error deleting module:', error);
    alert('Ошибка удаления модуля: ' + error.message);
  }
};
    // Обновление конфигурации колонки
 const updateColumnConfig = (columnIndex, field, value) => {
  const updatedConfigs = [...newModule.columnConfigs];
  
  // Если обновляем filters
  if (field === 'filters') {
    updatedConfigs[columnIndex] = {
      ...updatedConfigs[columnIndex],
      filters: {
        ...updatedConfigs[columnIndex].filters,
        ...value
      }
    };
  } else {
    updatedConfigs[columnIndex] = {
      ...updatedConfigs[columnIndex],
      [field]: value
    };
  }
  
  setNewModule({
    ...newModule,
    columnConfigs: updatedConfigs
  });
  
  console.log('Updated config:', updatedConfigs[columnIndex]); // Добавьте для отладки
};
const openSentenceModal = async (module, sentence = null) => {
  console.log('Opening sentence modal for module:', module);
  
  setCurrentLessonForModule(module);
  setModuleSentences([]);
  
  // Загружаем урок для получения языка
  try {
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${module.lessonId}`);
    const lesson = await lessonResponse.json();
    setLessonData(lesson);
  } catch (error) {
    console.error('Error loading lesson for module:', error);
    setLessonData(null);
  }

  // Инициализация структуры с учетом фильтров
  const columnCount = module.config?.columnConfigs?.length || 2;
  
  if (sentence) {
    // Редактирование существующего
    console.log('Editing existing sentence:', sentence);
    setNewSentence({
      ...sentence,
      columnData: sentence.sentenceStructure || [],
      customTranslation: sentence.customTranslation || sentence.translation || '', // ← Загружаем сохраненный перевод
      autoTranslation: sentence.autoTranslation || ''  // ← Загружаем автоматический перевод
    });
    setEditingSentence(true);
  } else {
    // Создание нового с предзаполнением фильтров
    const initialColumnData = Array.from({ length: columnCount }, (_, index) => {
      const prev = previousColumnSettings[index] || {};
      return {
        lesson: prev.lesson || '',
        number: prev.number || '',
        gender: prev.gender || '',
        case: prev.case || '',
        word: '',
        wordData: null
      };
    });

    setNewSentence({
      columnData: initialColumnData,
      image: '',
      customTranslation: '',  // ← Пустой ручной перевод
      autoTranslation: ''      // ← Пустой автоматический
    });
    setEditingSentence(false);
  }
  
  setShowSentenceModal(true);
  loadModuleSentences(module._id);
};
// Автоматическая установка картинки для ФРАЗЫ с правильным приоритетом
// Автоматическая установка картинки для ФРАЗЫ с приоритетом:
// 1) существительное → 2) прилагательное/глагол → 3) первое слово с картинкой
// Автоматическая установка картинки для ФРАЗЫ с приоритетом:
// 1) существительное → 2) прилагательное ИЛИ глагол → 3) первое слово с картинкой
useEffect(() => {
  if (!newSentence.columnData || newSentence.columnData.length === 0) return;

  let nounImg = null;
  let adjVerbImg = null;
  let firstImg = null;

  for (let i = 0; i < newSentence.columnData.length; i++) {
    const col = newSentence.columnData[i];
    const wd = col?.wordData;
    if (!wd) continue;

    // Ищем картинку во всех возможных местах
    const img = wd.imagePng || wd.image || wd.originalImage ||
      wd.originalData?.['Картинка png'] || wd.originalData?.['Картинка'] || '';

    if (!img || typeof img !== 'string' || img.trim() === '') continue;

    // Запоминаем первую найденную картинку

    // Определяем базу данных
    const db = wd.database || wd.sourceDatabase || col.database || '';

    console.log(`🔍 [ФРАЗА] Колонка ${i + 1}: db="${db}", img="${img.substring(0, 50)}..."`);
    if (!firstImg) firstImg = img;

    // Приоритет 1: существительное
    if (db === 'nouns' && !nounImg) {
      nounImg = img;
      console.log('✅ [ФРАЗА] Нашёл существительное — останавливаю поиск');
      break;
    }

    // Приоритет 2: прилагательное или глагол
    if ((db === 'adjectives' || db === 'verbs') && !adjVerbImg) {
      adjVerbImg = img;
      console.log(`✅ [ФРАЗА] Нашёл ${db === 'adjectives' ? 'прилагательное' : 'глагол'}`);
    }
  }

  const selected = nounImg || adjVerbImg || firstImg;
  const source = nounImg ? 'существительное' : adjVerbImg ? 'прил/глаг' : firstImg ? 'первое слово' : 'нет';

  console.log(`🖼️ [ФРАЗА] Итог: ${source}`);

  if (selected) {
    setNewSentence(prev => ({ ...prev, image: selected }));
  }
}, [newSentence.columnData]); // Убрали newSentence.image из зависимостей
const debugModuleStructure = (module) => {
  console.log('Module structure:', {
    id: module._id,
    title: module.title,
    typeId: module.typeId,
    config: module.config,
    columnConfigs: module.config?.columnConfigs,
    hasConfig: !!module.config,
    hasColumnConfigs: !!module.config?.columnConfigs,
    columnCount: module.config?.columnConfigs?.length || 0
  });
};
const normalizeTranslations = (translations) => {
  const normalized = {};
  
  // Создаем маппинг английских ключей на русские и наоборот
  const keyMap = {
    'russian': ['русский', 'Русский', 'ru'],
    'русский': ['russian', 'Russian', 'ru'],
    'english': ['английский', 'Английский', 'en'],
    'английский': ['english', 'English', 'en'],
    'turkish': ['турецкий', 'Турецкий', 'tr'],
    'турецкий': ['turkish', 'Turkish', 'tr']
  };
  
  // Копируем все существующие переводы
  Object.entries(translations).forEach(([key, value]) => {
    normalized[key] = value;
    
    // Добавляем альтернативные ключи
    const keyLower = key.toLowerCase();
    if (keyMap[keyLower]) {
      keyMap[keyLower].forEach(altKey => {
        if (!normalized[altKey]) {
          normalized[altKey] = value;
        }
      });
    }
  });
  
  return normalized;
};

const addOrUpdateSentence = async () => {
  try {
    console.log('=== SAVING SENTENCE ===');
    
    // Проверка, что все колонки заполнены
    const isFormValid = newSentence.columnData.every((data, index) => {
      const hasWord = !!data?.wordData;
      console.log(`Column ${index + 1}:`, { hasWord, word: data?.word, config: currentLessonForModule.config?.columnConfigs?.[index] });
      return hasWord;
    });

    if (!isFormValid) {
      const invalidColumns = newSentence.columnData
        .map((data, index) => ({ index, valid: !!data?.wordData }))
        .filter(col => !col.valid)
        .map(col => col.index + 1);
      
      alert(`Выберите слова для колонок: ${invalidColumns.join(', ')}`);
      return;
    }

    // Получаем язык из урока
    const studiedLanguage = lessonData?.studiedLanguage || 'русский';
    const hintLanguage = lessonData?.hintLanguage || 'english';
    
    console.log('Saving sentence with languages:', { studiedLanguage, hintLanguage });

    // Функция для сбора ВСЕХ переводов
    const collectAllTranslations = (wordData, database) => {
      if (!wordData) return {};
      
      const translations = {};
      
      console.log(`Collecting translations for database: ${database}`);
      console.log('WordData:', wordData);

      // 1. Копируем существующие translations
      if (wordData.translations) {
        Object.entries(wordData.translations).forEach(([key, value]) => {
          if (typeof value === 'object') {
            translations[key] = value;
          } else {
            translations[key] = value;
          }
        });
      }
      
      // 2. Для глаголов - добавляем conjugation
      if (database === 'verbs' && wordData.conjugation) {
        translations.conjugation = wordData.conjugation;
        if (wordData.conjugation.infinitive && !translations.russian) {
          translations.russian = wordData.conjugation.infinitive;
        }
      }
      
      // 3. Для причастий
      if (database === 'participles') {
        if (wordData.fullTranslations) {
          translations.fullTranslations = wordData.fullTranslations;
        }
        if (wordData.originalData) {
          translations.originalData = wordData.originalData;
        }
      }
      
      // 4. Для вопросительных слов
      if (database === 'question-words') {
        if (wordData.originalData) {
          Object.entries(wordData.originalData).forEach(([key, value]) => {
            if (key === 'Русский' || key === 'russian') translations['russian'] = value;
            if (key === 'Английский' || key === 'english') translations['english'] = value;
            if (key === 'Турецкий' || key === 'turkish') translations['turkish'] = value;
          });
        }
        if (wordData.translations) {
          Object.entries(wordData.translations).forEach(([key, value]) => {
            translations[key] = value;
          });
        }
        if (wordData.russian || wordData.english || wordData.turkish) {
          if (wordData.russian) translations['russian'] = wordData.russian;
          if (wordData.english) translations['english'] = wordData.english;
          if (wordData.turkish) translations['turkish'] = wordData.turkish;
        }
      }
      
      // 5. Для числительных
      if (database === 'numerals') {
        if (wordData.originalData) {
          Object.entries(wordData.originalData).forEach(([key, value]) => {
            if (key === 'Русский') translations['russian'] = value;
            if (key === 'Английский') translations['english'] = value;
            if (key === 'Турецкий') translations['turkish'] = value;
          });
        }
        if (wordData.cases) {
          translations.cases = wordData.cases;
        }
      }
      
      // 6. Для местоимений
      if (database === 'pronouns') {
        if (wordData.originalData) {
          Object.entries(wordData.originalData).forEach(([key, value]) => {
            if (key === 'Русский') translations['russian'] = value;
            if (key === 'Английский') translations['english'] = value;
            if (key === 'Турецкий') translations['turkish'] = value;
          });
        }
        if (wordData.declensions) {
          translations.declensions = wordData.declensions;
        }
      }
      
      // 7. Для существительных - добавляем падежи
      if (database === 'nouns' && wordData.cases) {
        translations.cases = wordData.cases;
      }
      
      // 8. Для прилагательных - добавляем падежи
      if (database === 'adjectives' && wordData.cases) {
        translations.cases = wordData.cases;
      }
      
      // 9. Для деепричастий
      if (database === 'gerunds') {
        if (wordData.originalData) {
          Object.entries(wordData.originalData).forEach(([key, value]) => {
            if (key === 'Русский' || key === 'russian') {
              translations['russian'] = value;
              translations['русский'] = value;
            }
            if (key === 'Английский' || key === 'english') {
              translations['english'] = value;
              translations['английский'] = value;
            }
            if (key === 'Турецкий' || key === 'turkish') {
              translations['turkish'] = value;
              translations['турецкий'] = value;
            }
          });
        }
        if (wordData.translations) {
          Object.entries(wordData.translations).forEach(([key, value]) => {
            translations[key] = value;
          });
        }
        if (wordData.russian) translations['russian'] = wordData.russian;
        if (wordData.english) translations['english'] = wordData.english;
        if (wordData.turkish) translations['turkish'] = wordData.turkish;
        if (wordData.baseForm) {
          translations.baseForm = wordData.baseForm;
        }
      }
      
      // 10. Для наречий
      if (database === 'adverbs') {
        if (wordData.originalData) {
          Object.entries(wordData.originalData).forEach(([key, value]) => {
            if (key === 'Русский' || key === 'russian') {
              translations['russian'] = value;
              translations['русский'] = value;
            }
            if (key === 'Английский' || key === 'english') {
              translations['english'] = value;
              translations['английский'] = value;
            }
            if (key === 'Турецкий' || key === 'turkish') {
              translations['turkish'] = value;
              translations['турецкий'] = value;
            }
          });
        }
        if (wordData.translations) {
          Object.entries(wordData.translations).forEach(([key, value]) => {
            translations[key] = value;
          });
        }
        if (wordData.russian) {
          translations['russian'] = wordData.russian;
          translations['русский'] = wordData.russian;
        }
        if (wordData.english) {
          translations['english'] = wordData.english;
          translations['английский'] = wordData.english;
        }
        if (wordData.turkish) {
          translations['turkish'] = wordData.turkish;
          translations['турецкий'] = wordData.turkish;
        }
        if (wordData.baseForm) {
          translations.baseForm = wordData.baseForm;
        }
      }
      
      return translations;
    };

    // Подготовка структуры предложения
    const sentenceStructure = newSentence.columnData.map((data, index) => {
      const columnConfig = currentLessonForModule.config?.columnConfigs?.[index];
      const database = columnConfig?.database || data.database || 'nouns';
      
      // Определяем, на каком языке сохранять слово для отображения
      const targetLanguage = studiedLanguage;
      
      // Получаем ИТОГОВУЮ форму из wordData
      let displayWord = '';
      
      if (data.wordData) {
        console.log(`Processing word for column ${index}, database: ${database}`);
        console.log('WordData:', data.wordData);
        
        // Сначала проверяем displayWord (это уже применённая форма)
        if (data.wordData.displayWord) {
          displayWord = data.wordData.displayWord;
          console.log('✅ Using displayWord from wordData:', displayWord);
        }
        // Если нет displayWord, проверяем word
        else if (data.wordData.word) {
          displayWord = data.wordData.word;
          console.log('Using word from wordData:', displayWord);
        }
        // Если нет ни того, ни другого, пробуем translations
        else if (data.wordData.translations) {
          const possibleKeys = [
            targetLanguage,
            targetLanguage.toLowerCase(),
            targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1),
            targetLanguage === 'русский' ? 'russian' : 
            targetLanguage === 'russian' ? 'русский' :
            targetLanguage === 'английский' ? 'english' :
            targetLanguage === 'english' ? 'английский' :
            targetLanguage === 'турецкий' ? 'turkish' :
            targetLanguage === 'turkish' ? 'турецкий' : targetLanguage,
            'russian', 'english', 'turkish',
            'Русский', 'Английский', 'Турецкий'
          ];
          
          for (const key of possibleKeys) {
            if (data.wordData.translations[key]) {
              displayWord = data.wordData.translations[key];
              console.log(`Found translation for key "${key}":`, displayWord);
              break;
            }
          }
        }
        
        // Для глаголов - особый случай
        if (database === 'verbs' && data.wordData.conjugation && data.tense) {
          let verbForm = null;
          
          if (data.tense === 'present') {
            const personKey = data.person || 'он';
            verbForm = data.wordData.conjugation.present?.[personKey];
          } else if (data.tense === 'past') {
            if (data.person === 'я' || data.person === 'ты') {
              const genderKey = data.verbGender === 'feminine' ? 'ж' : 
                               data.verbGender === 'neuter' ? 'с' : 'м';
              const key = `${data.person}_${genderKey}`;
              verbForm = data.wordData.conjugation.past?.[key];
            } else {
              verbForm = data.wordData.conjugation.past?.[data.person || 'он'];
            }
          } else if (data.tense === 'future') {
            const personKey = data.person || 'он';
            verbForm = data.wordData.conjugation.future?.[personKey];
          } else if (data.tense === 'imperative') {
            const imperativeKey = data.imperativeForm || 'ты';
            verbForm = data.wordData.conjugation.imperative?.[imperativeKey];
          }
          
          if (verbForm) {
            displayWord = verbForm;
            console.log('✅ Using verb conjugation form:', displayWord);
          }
        }
        
        // Для прилагательных с падежами
        if (database === 'adjectives' && data.case && data.wordData.cases) {
          if (data.wordData.displayWord) {
            displayWord = data.wordData.displayWord;
          }
        }
        
        // Для существительных с падежами
        if (database === 'nouns' && data.case && data.wordData.cases) {
          if (data.wordData.displayWord) {
            displayWord = data.wordData.displayWord;
          }
        }
        
        // Для местоимений с падежами
        if (database === 'pronouns' && data.wordData.displayWord) {
          displayWord = data.wordData.displayWord;
        }
        
        // Для числительных с падежами
        if (database === 'numerals' && data.wordData.displayWord) {
          displayWord = data.wordData.displayWord;
        }
        
        // Для причастий с падежами
        if (database === 'participles' && data.wordData.displayWord) {
          displayWord = data.wordData.displayWord;
        }
      }
      
      // Если всё ещё нет слова, используем data.word
      if (!displayWord) {
        displayWord = data.word || '';
        console.log('Using data.word as last resort:', displayWord);
      }
      
      // Нормализуем слово
      let normalizedWord = displayWord;
      if (index === 0 && displayWord) {
        normalizedWord = displayWord.charAt(0).toUpperCase() + displayWord.slice(1);
      } else if (displayWord) {
        normalizedWord = displayWord.toLowerCase();
      }
      
      // Собираем все переводы
      const allTranslations = collectAllTranslations(data.wordData, database);
      
      return {
        word: normalizedWord,
        wordData: {
          ...data.wordData,
          translations: allTranslations,
          displayWord: displayWord,
          savedTranslation: displayWord,
          database: database,
          conjugation: data.wordData?.conjugation || null,
          fullTranslations: data.wordData?.fullTranslations || null,
          declensions: data.wordData?.declensions || null,
          cases: data.wordData?.cases || null,
          originalData: data.wordData?.originalData || null,
          baseForm: data.wordData?.baseForm || null
        },
        database: database,
        lesson: data.lesson || '',
        number: data.number || '',
        gender: data.gender || '',
        case: data.case || '',
        tense: data.tense || '',
        person: data.person || '',
        verbGender: data.verbGender || '',
        imperativeForm: data.imperativeForm || ''
      };
    });

    // ★★★ ОПРЕДЕЛЯЕМ ФИНАЛЬНЫЙ ПЕРЕВОД ★★★
    let finalTranslation = newSentence.customTranslation;
    
    // Если ручной перевод пустой, генерируем автоматический из структуры
    if (!finalTranslation || finalTranslation.trim() === '') {
      // Собираем слова для перевода
      const translationWords = sentenceStructure.map(item => {
        // Пытаемся найти перевод на язык подсказки
        if (item.wordData?.translations) {
          const possibleKeys = [
            hintLanguage,
            hintLanguage.toLowerCase(),
            hintLanguage === 'english' ? 'английский' : 
            hintLanguage === 'английский' ? 'english' : hintLanguage,
            'english', 'English', 'английский', 'Английский'
          ];
          
          for (const key of possibleKeys) {
            if (item.wordData.translations[key] && typeof item.wordData.translations[key] === 'string') {
              return item.wordData.translations[key];
            }
          }
        }
        return item.word;
      }).filter(w => w && w.trim() !== '');
      
      // Собираем текст
      if (translationWords.length > 0) {
        finalTranslation = translationWords.map((word, idx) => {
          if (idx === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word.toLowerCase();
        }).join(' ');
        
        // Добавляем точку если нет знака препинания
        if (finalTranslation && !/[.!?]$/.test(finalTranslation)) {
          finalTranslation += '.';
        }
      } else {
        finalTranslation = '';
      }
      
      console.log('Generated translation from words:', finalTranslation);
    } else {
      console.log('Using manual translation:', finalTranslation);
    }

    // Автоматическая установка картинки
    const image = newSentence.image || newSentence.columnData[0]?.wordData?.imagePng || '';
    
    const sentenceData = {
      moduleId: currentLessonForModule._id,
      sentenceStructure: sentenceStructure,
      image: image,
      language: studiedLanguage,
      translation: finalTranslation,
      autoTranslation: newSentence.autoTranslation || '',
      customTranslation: newSentence.customTranslation || ''
    };

    console.log('Saving sentence data:', JSON.stringify(sentenceData, null, 2));

    // Сохранение
    const endpoint = editingSentence && newSentence._id
      ? `/sentences/${newSentence._id}`
      : '/sentences';
    const method = editingSentence && newSentence._id ? 'PUT' : 'POST';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sentenceData)
    });

    if (response.ok) {
      const savedSentence = await response.json();
      console.log('Sentence saved successfully:', savedSentence);

      // Сохраняем настройки для следующего предложения
      const savedSettings = newSentence.columnData.map(data => ({
        lesson: data.lesson || '',
        number: data.number || '',
        gender: data.gender || '',
        case: data.case || '',
        tense: data.tense || '',
        person: data.person || '',
        verbGender: data.verbGender || '',
        imperativeForm: data.imperativeForm || ''
      }));

      setPreviousColumnSettings(savedSettings);
      await loadModuleSentences(currentLessonForModule._id);
      alert('Фраза сохранена!');

      // Сбрасываем форму
      resetSentenceForm(savedSettings);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save sentence');
    }
  } catch (error) {
    console.error('Error saving sentence:', error);
    alert('Ошибка сохранения предложения: ' + error.message);
  }
};
    // Функция сброса формы
const resetSentenceForm = (prevSettings = null) => {
  const settingsToUse = prevSettings || previousColumnSettings;

  const columnCount = currentLessonForModule.config?.columnConfigs?.length || 2;
  const initialColumnData = Array.from({ length: columnCount }, (_, index) => {
    const prev = settingsToUse[index] || {};
    return {
      lesson: prev.lesson || '',
      number: prev.number || '',
      gender: prev.gender || '',
      case: prev.case || '',
      tense: prev.tense || '',
      person: prev.person || '',
      verbGender: prev.verbGender || '',
      imperativeForm: prev.imperativeForm || '',
      word: '',
      wordData: null
    };
  });

  setNewSentence({
    columnData: initialColumnData,
    image: '',
    customTranslation: '',  // ← Сбрасываем ручной перевод
    autoTranslation: ''      // ← Сбрасываем автоматический
  });
  setEditingSentence(false);
};
    const deleteSentence = async (sentenceId) => {
        if (!confirm('Удалить строку?')) return;
        try {
            await fetch(`${API_BASE_URL}/sentences/${sentenceId}`, { method: 'DELETE' });
            await loadModuleSentences(currentLessonForModule._id);
            alert('Строка удалена!');
        } catch (error) {
            alert('Ошибка удаления: ' + error.message);
        }
    };
    // Визуализация модулей урока
    
const renderLessonModules = (lesson) => {
 const lessonModulesList = lessonModules
    .filter(m => m.lessonId === lesson._id)
    .sort((a, b) => (a.order || 0) - (b.order || 0)); // Сортируем по order
  console.log(`📋 Rendering modules for lesson ${lesson._id}. Sorted order:`, lessonModulesList.map(m => ({ title: m.title, order: m.order })));

  // Функция для перемещения модуля
 const moveModule = async (moduleId, direction) => {
  const modules = [...lessonModulesList].sort((a, b) => (a.order || 0) - (b.order || 0));
  const index = modules.findIndex(m => m._id === moduleId);
  
  if ((direction === 'up' && index === 0) || (direction === 'down' && index === modules.length - 1)) {
    return; // Нельзя переместить дальше
  }

  try {
    if (direction === 'up') {
      // Перемещаем вверх
      const prevModule = modules[index - 1];
      const currentModule = modules[index];
      
      // Вычисляем новый order
      let newOrder;
      if (index === 1) {
        // Если это второй модуль, ставим перед первым
        newOrder = prevModule.order / 2;
      } else {
        // Иначе ставим между предыдущим и пред-предыдущим
        const prevPrevOrder = modules[index - 2]?.order || 0;
        newOrder = (prevPrevOrder + prevModule.order) / 2;
      }
      
      await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      
    } else if (direction === 'down') {
      // Перемещаем вниз
      const nextModule = modules[index + 1];
      const currentModule = modules[index];
      
      let newOrder;
      if (index === modules.length - 2) {
        // Если это предпоследний модуль, ставим после последнего
        newOrder = nextModule.order + 10;
      } else {
        // Иначе ставим между следующим и следующим-после-следующего
        const nextNextOrder = modules[index + 2]?.order || nextModule.order + 20;
        newOrder = (nextModule.order + nextNextOrder) / 2;
      }
      
      await fetch(`${API_BASE_URL}/lesson-modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
    }
    
    // После перемещения загружаем обновленный список
    await loadLessonModules(lesson._id);
    
    // Опционально: оптимизируем order'ы если они стали слишком близкими
    await optimizeModuleOrders(lesson._id);
    
  } catch (error) {
    console.error('Error moving module:', error);
    alert('Ошибка при перемещении модуля');
  }
};

// Функция для оптимизации order'ов (пересчет с шагом 10)
const optimizeModuleOrders = async (lessonId) => {
  try {
    const modules = await loadLessonModules(lessonId);
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Пересчитываем order'ы с шагом 10
    const updates = sortedModules.map((module, index) => {
      const newOrder = (index + 1) * 10;
      return fetch(`${API_BASE_URL}/lesson-modules/${module._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
    });
    
    await Promise.all(updates);
    await loadLessonModules(lessonId);
    
  } catch (error) {
    console.error('Error optimizing orders:', error);
  }
};
 
  console.log('Rendering modules for lesson:', lesson._id, 'found:', lessonModulesList.length);

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-3">Модули урока:</h4>
      <div className="space-y-2">
        {lessonModulesList.map((module, index) => (
  <div 
    key={module._id} 
    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    {/* Основной контейнер с большими отступами */}
    <div className="p-5">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        
        {/* ЛЕВАЯ ЧАСТЬ - ИНФОРМАЦИЯ О МОДУЛЕ */}
        <div className="flex-1 min-w-0">
          {/* Кнопки перемещения и название */}
          <div className="flex items-start gap-3">
            {/* Кнопки перемещения - увеличены и стилизованы */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => moveModule(module._id, 'up')}
                disabled={index === 0}
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                  ${index === 0 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 hover:shadow-sm'
                  }
                `}
                title="Переместить вверх"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveModule(module._id, 'down')}
                disabled={index === lessonModulesList.length - 1}
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                  ${index === lessonModulesList.length - 1 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 hover:shadow-sm'
                  }
                `}
                title="Переместить вниз"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Название и тип модуля */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="text-lg font-semibold text-gray-900 break-words">
                  {module.title}
                </h4>
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                  ${module.typeId === 1 ? 'bg-green-100 text-green-700' : ''}
                  ${module.typeId === 2 ? 'bg-orange-100 text-orange-700' : ''}
                  ${module.typeId === 3 ? 'bg-blue-100 text-blue-700' : ''}
                  ${module.typeId === 4 ? 'bg-purple-100 text-purple-700' : ''}
                  ${module.typeId === 5 ? 'bg-pink-100 text-pink-700' : ''}
                  ${module.typeId === 6 ? 'bg-indigo-100 text-indigo-700' : ''}
                  ${module.typeId === 7 ? 'bg-red-100 text-red-700' : ''}
                  ${module.typeId === 8 ? 'bg-yellow-100 text-yellow-700' : ''}
                `}>
                  {lessonTypes.find(t => t.typeId === module.typeId)?.name || `Тип ${module.typeId}`}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  order: {module.order}
                </span>
              </div>

              {/* Дополнительная информация */}
              <div className="mt-3 space-y-2">
                {/* Для модуля Вопросов */}
                {module.typeId === 4 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {module.config?.relatedToModuleId ? (
                      (() => {
                        const targetModule = lessonModules.find(m => m._id === module.config.relatedToModuleId);
                        return (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm text-blue-700">
                              после: <span className="font-medium">{targetModule ? targetModule.title : 'неизвестный модуль'}</span>
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">в конце урока</span>
                      </div>
                    )}
                    
                    {module.config?.requiresPairAnswer === false && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="text-sm text-yellow-700">без ответа</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Для модуля Лексика */}
                {module.typeId === 1 && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>Слов: <span className="font-semibold text-gray-900">{module.config?.words?.length || 0}</span></span>
                    </div>
                    {module.config?.words?.length > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">
                          {module.config.words.slice(0, 3).map(w => w.displayWord || w.word).join(', ')}
                          {module.config.words.length > 3 && ` +${module.config.words.length - 3}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Для модуля Фразы */}
                {module.typeId === 3 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Колонок: <span className="font-semibold text-gray-900">{module.config?.columnsCount || module.config?.columnConfigs?.length || 0}</span></span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ - КНОПКИ ДЕЙСТВИЙ */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {/* Кнопка редактирования для Лексики */}
          {module.typeId === 1 && (
            <button
              onClick={() => openEditModuleModal(module)}
              className="group px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Редактировать модуль"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </button>
          )}
          
          {/* Кнопка для модуля Вопросов */}
          {module.typeId === 4 && (
            <button
              onClick={() => openQuestionModal(module)}
              className="group px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Добавить вопрос"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Добавить вопрос
            </button>
          )}
          
          {/* Кнопка для модуля Аудио */}
          {module.typeId === 5 && (
            <button
              onClick={() => openPodcastModal(module)}
              className="group px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Добавить аудио"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Добавить аудио
            </button>
          )}
          
          {/* Кнопка для модуля Фраз */}
          {module.typeId === 3 && (
            <button
              onClick={() => openSentenceModal(module)}
              className="group px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Добавить фразу"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Добавить фразу
            </button>
          )}
          
          {/* Кнопка для модуля Текст */}
          {module.typeId === 6 && (
            <button
              onClick={() => openTextModal(module)}
              className="group px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Редактировать текст"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </button>
          )}
          
          {/* Кнопка для модуля Грамматика */}
          {module.typeId === 8 && (
            <button
              onClick={() => openGrammarModal(module)}
              className="group px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Редактировать грамматику"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Грамматика
            </button>
          )}
      {/* Кнопка для модуля Тест */}
{module.typeId === 9 && (
  <button
    onClick={() => openTestQuestionModal(module)}
    className="group px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
    title="Добавить вопрос теста"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Добавить вопрос
  </button>
)}
          
          {/* Кнопка для модуля Видео */}
          {module.typeId === 7 && (
            <button
              onClick={() => openVideoModal(module)}
              className="group px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              title="Добавить видео"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Добавить видео
            </button>
          )}
          
          {/* Кнопка удаления для всех типов */}
          <button
            onClick={() => deleteModule(module._id, module.title, lesson._id)}
            className="group px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            title="Удалить модуль"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
))}
        {lessonModulesList.length === 0 && (
          <div className="text-center py-2 text-gray-500">
            Нет добавленных модулей
          </div>
        )}
      </div>
      <button
        onClick={() => openCreateModuleModal(lesson)}
        className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        + Добавить модуль
      </button>
    </div>
  );
};
    useEffect(() => {
        const checkAuth = () => {
            const savedAuth = localStorage.getItem('adminAuth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    const sessionTime = 24 * 60 * 60 * 1000;
                    const currentTime = new Date().getTime();
                 
                    if (currentTime - authData.timestamp < sessionTime) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('adminAuth');
                    }
                } catch (error) {
                    console.error('Error parsing auth data:', error);
                    localStorage.removeItem('adminAuth');
                }
            }
        };
        checkAuth();
    }, []);
    useEffect(() => {
        if (!isAuthenticated) return;
        console.log('ВЫЗЫВАЛСЯ ЛОАДДАТАФРОМЮБЭККК')
        loadDataFromBackend(true);
        loadFlags();
        loadTableLanguages();
        loadLessons();
        loadTests();
    }, [isAuthenticated]);
    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'eatapple88') {
            setIsAuthenticated(true);
            setAuthError('');
         
            const authData = {
                isAuthenticated: true,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('adminAuth', JSON.stringify(authData));
        } else {
            setAuthError('Неверный логин или пароль');
        }
    };
    const handleLogout = () => {
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
        localStorage.removeItem('adminAuth');
    };
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center">Авторизация</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Логин</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Пароль</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        {authError && <p className="text-red-500 text-sm">{authError}</p>}
                        <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Войти
                        </button>
                    </form>
                </div>
            </div>
        );
    }
 const addNewQuestionWord = async () => {
  const currentData = getActiveTableData();
  const columns = currentData.length > 0 
    ? Object.keys(currentData[0]) 
    : ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  const newRow = {};
  columns.forEach(col => {
    newRow[col] = ''; // Создаем пустую строку
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
};
    const createRow = (columns, values = {}) => {
        const row = {};
        columns.forEach(col => {
            row[col] = values[col] ?? '';
        });
        return row;
    };
    const createInitialGerundsTable = () => {
  const baseColumns = ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'Картинка': '',
      'Русский': 'Читая',
      'Английский': 'Reading',
      'Турецкий': 'Okuyarak'
    },
    {
      'Картинка': '',
      'Русский': 'Пиша',
      'Английский': 'Writing',
      'Турецкий': 'Yazarak'
    },
    {
      'Картинка': '',
      'Русский': 'Говоря',
      'Английский': 'Speaking',
      'Турецкий': 'Konuşarak'
    },
    {
      'Картинка': '',
      'Русский': 'Слушая',
      'Английский': 'Listening',
      'Турецкий': 'Dinleyerek'
    }
  ];
};
const createInitialQuestionWordsTable = () => {
  const baseColumns = ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'Картинка': '',
      'Русский': 'Что',
      'Английский': 'What',
      'Турецкий': 'Ne'
    },
    {
      'Картинка': '',
      'Русский': 'Это',
      'Английский': 'This', 
      'Турецкий': 'Bu'
    },
    {
      'Картинка': '',
      'Русский': 'Где',
      'Английский': 'Where',
      'Турецкий': 'Nerede'
    },
    {
      'Картинка': '',
      'Русский': 'Кто',
      'Английский': 'Who',
      'Турецкий': 'Kim'
    },
    {
      'Картинка': '',
      'Русский': 'Когда',
      'Английский': 'When',
      'Турецкий': 'Ne zaman'
    }
  ];
};
const compressImage = async (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // Если файл маленький (< 300KB), не сжимаем
    if (file.size < 300 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Если изображение слишком широкое, уменьшаем
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Рисуем сжатое изображение
      ctx.drawImage(img, 0, 0, width, height);
      
      // Конвертируем в Blob с качеством
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Не удалось сжать изображение'));
            return;
          }
          
          // Создаем новый File из Blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          console.log(`Сжатие: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      console.warn('Не удалось загрузить изображение для сжатия, использую оригинал');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const fileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};
const handleOptimizedImageUpload = async (event, imageType) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  setUploadingImageType(imageType);

  try {
    console.log(`Загрузка изображения для ${imageType}...`);
    
    let processedFile = file;
    if (file.size > 300 * 1024) {
      console.log('Сжимаем изображение...');
      processedFile = await compressImage(file, 800, 0.7);
    }

    const base64 = await fileToBase64(processedFile);
    
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        // ★★★ ИСПРАВЛЕНИЕ: используем функциональное обновление с гарантией актуального состояния ★★★
        setNewQuestion(prev => {
          const updated = {
            ...prev,
            ...(imageType === 'question' ? { questionImage: result.imageUrl } : { answerImage: result.imageUrl })
          };
          console.log('Updated newQuestion, hint preserved:', updated.hint);
          return updated;
        });
        
        alert(`✅ Изображение загружено!`);
      }
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Ошибка сервера');
    }
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    alert('Ошибка загрузки изображения: ' + error.message);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
    if (event.target) {
      event.target.value = '';
    }
  }
};



// Вспомогательная функция конвертации в base64

const handleAddLanguageToQuestionWords = async () => {
  if (!newLanguage) { 
    alert('Выберите язык'); 
    return; 
  }

  const languageName = newLanguage.split(' ').pop(); // "Русский", "Английский" и т.д.
  
  const currentData = getActiveTableData();
  const newTableData = currentData.map(row => {
    const newRow = { ...row };
    newRow[languageName] = ''; // Добавляем новую колонку с пустыми значениями
    return newRow;
  });

  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);

  alert(`Язык "${languageName}" добавлен успешно!`);
  
};

// ============================================
// Функция создания начальной таблицы причастий
// ============================================
// ============================================
// Функция создания начальной таблицы причастий (УПРОЩЕННАЯ)
// ============================================
const createInitialParticiplesTable = () => {
  // Базовая структура - ТОЛЬКО нужные колонки
  const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
  ];
  
  // Колонки для языков - только базовая форма (мужской род, ед.ч., им.пад.)
  const languageColumns = [
    'База причастия базовая форма Русский',  // ← ТОЛЬКО ЭТО
    'База причастия базовая форма Английский',
    'База причастия базовая форма Турецкий'
  ];
  
  const allColumns = [...baseColumns, ...languageColumns];
  
  return [
    // Заголовок урока "Действия"
    {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.1',
      'Урок название': 'Действия',
      'База изображение': '',
      'Картинка png': '',
      'База причастия базовая форма Русский': '',
      'База причастия базовая форма Английский': '',
      'База причастия базовая форма Турецкий': ''
    },
    // Причастия для темы "Действия"
    {
      'Уровень изучения номер': '',
      'Урок номер': '',
      'Урок название': '',
      'База изображение': '1.1.1',
      'Картинка png': '',
      'База причастия базовая форма Русский': 'БЕГУЩИЙ',
      'База причастия базовая форма Английский': 'running',
      'База причастия базовая форма Турецкий': 'koşan'
    },
    {
      'Уровень изучения номер': '',
      'Урок номер': '',
      'Урок название': '',
      'База изображение': '1.1.2',
      'Картинка png': '',
      'База причастия базовая форма Русский': 'ЧИТАЮЩИЙ',
      'База причастия базовая форма Английский': 'reading',
      'База причастия базовая форма Турецкий': 'okuyan'
    },
    {
      'Уровень изучения номер': '',
      'Урок номер': '',
      'Урок название': '',
      'База изображение': '1.1.3',
      'Картинка png': '',
      'База причастия базовая форма Русский': 'ГОВОРЯЩИЙ',
      'База причастия базовая форма Английский': 'speaking',
      'База причастия базовая форма Турецкий': 'konuşan'
    },
    {
      'Уровень изучения номер': '',
      'Урок номер': '',
      'Урок название': '',
      'База изображение': '1.1.4',
      'Картинка png': '',
      'База причастия базовая форма Русский': 'ПИШУЩИЙ',
      'База причастия базовая форма Английский': 'writing',
      'База причастия базовая форма Турецкий': 'yazan'
    },
    {
      'Уровень изучения номер': '',
      'Урок номер': '',
      'Урок название': '',
      'База изображение': '1.1.5',
      'Картинка png': '',
      'База причастия базовая форма Русский': 'СЛУШАЮЩИЙ',
      'База причастия базовая форма Английский': 'listening',
      'База причастия базовая форма Турецкий': 'dinleyen'
    }
  ];
};
const createInitialPronounsTable = () => {
  // Добавляем База изображение в колонки
  const baseColumns = ['База изображение', 'Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'База изображение': 'pronoun_1.1.1',  // Уникальный идентификатор
      'Картинка': '',
      'Русский': 'я',
      'Английский': 'I',
      'Турецкий': 'ben'
    },
    {
      'База изображение': 'pronoun_1.1.2',
      'Картинка': '',
      'Русский': 'ты',
      'Английский': 'you',
      'Турецкий': 'sen'
    },
    {
      'База изображение': 'pronoun_1.1.3',
      'Картинка': '',
      'Русский': 'он',
      'Английский': 'he',
      'Турецкий': 'o'
    },
    {
      'База изображение': 'pronoun_1.1.4',
      'Картинка': '',
      'Русский': 'она',
      'Английский': 'she',
      'Турецкий': 'o'
    },
    {
      'База изображение': 'pronoun_1.1.5',
      'Картинка': '',
      'Русский': 'оно',
      'Английский': 'it',
      'Турецкий': 'o'
    },
    {
      'База изображение': 'pronoun_1.1.6',
      'Картинка': '',
      'Русский': 'мы',
      'Английский': 'we',
      'Турецкий': 'biz'
    },
    {
      'База изображение': 'pronoun_1.1.7',
      'Картинка': '',
      'Русский': 'вы',
      'Английский': 'you',
      'Турецкий': 'siz'
    },
    {
      'База изображение': 'pronoun_1.1.8',
      'Картинка': '',
      'Русский': 'они',
      'Английский': 'they',
      'Турецкий': 'onlar'
    }
  ];
};

const createInitialPrepositionsTable = () => {
  const baseColumns = ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'Картинка': '',
      'Русский': 'В',
      'Английский': 'In',
      'Турецкий': 'İçinde'
    },
    {
      'Картинка': '',
      'Русский': 'На',
      'Английский': 'On',
      'Турецкий': 'Üzerinde'
    },
    {
      'Картинка': '',
      'Русский': 'Под',
      'Английский': 'Under',
      'Турецкий': 'Altında'
    },
    {
      'Картинка': '',
      'Русский': 'За',
      'Английский': 'Behind',
      'Турецкий': 'Arkasında'
    },
    {
      'Картинка': '',
      'Русский': 'Перед',
      'Английский': 'In front of',
      'Турецкий': 'Önünde'
    }
  ];
};
    const createInitialNounsTable = () => {
        const allColumns = [...baseColumns];
        Object.values(baseLanguages).forEach(lang => {
            allColumns.push(lang.number);
            allColumns.push(lang.word);
        });
        return [
            createRow(allColumns, {
                'Уровень изучения номер': 'A1',
                'Урок номер': '1.1',
                'Урок название': 'Еда'
            }),
            createRow(allColumns, {
                'База изображение': '1.1.1',
                'База существительные номер Русский': '1.1.1.1',
                'База существительные слова Русский': 'ЯБЛОКО',
                'База существительные номер Английский': '1.1.2.1',
                'База существительные слова Английский': 'An apple',
                'База существительные номер Турецкий': '1.1.3.1',
                'База существительные слова Турецкий': 'elma'
            }),
            createRow(allColumns, {
                'База изображение': '1.1.2',
                'База существительные номер Русский': '1.1.1.2',
                'База существительные слова Русский': 'БАНАН',
                'База существительные номер Английский': '1.1.2.2',
                'База существительные слова Английский': 'A banana',
                'База существительные номер Турецкий': '1.1.3.2',
                'База существительные слова Турецкий': 'muz'
            })
        ];
    };
    const shouldShowCaseButton = (language) => {
  const langConfig = getAdjectiveLanguageConfig(language);
  return langConfig.hasCases;
};

// Функция для получения доступных языков с падежами
const getLanguagesWithCases = () => {
  return Object.entries(adjectivesLanguageConfig)
    .filter(([lang, config]) => config.hasCases)
    .map(([lang]) => lang);
};

// Функция для отображения только нужных колонок при редактировании
// Функция для отображения только нужных колонок при редактировании
const getVisibleColumnsForLanguage = (language) => {
  const config = getAdjectiveLanguageConfig(language);
  
  // Сначала получаем базовое название языка (без пробелов и в правильном регистре)
  const langKey = language.toLowerCase().trim();
  const languageMap = {
    'russian': 'Русский',
    'english': 'Английский',
    'turkish': 'Турецкий',
    'spanish': 'Испанский',
    'german': 'Немецкий',
    'french': 'Французский',
    'italian': 'Итальянский',
    'chinese': 'Китайский',
    'japanese': 'Японский',
    'arabic': 'Арабский'
  };
  
  const displayLanguage = languageMap[langKey] || language;
  
  const columnMap = {
    'word': `База прилагательные слова ${displayLanguage}`,
    'masculine': `База прилагательные мужской род ${displayLanguage}`,
    'feminine': `База прилагательные женский род ${displayLanguage}`,
    'neuter': `База прилагательные средний род ${displayLanguage}`,
    'plural': `База прилагательные множественное число ${displayLanguage}`
  };
  
  return config.columns.map(col => columnMap[col]);
};// Функция создания начальной таблицы числительных
const createInitialNumeralsTable = () => {
  const baseColumns = [ 'Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      
      'Картинка': '',
      'Русский': 'ноль',
      'Английский': 'zero',
      'Турецкий': 'sıfır'
    },
    {
     
      'Картинка': '',
      'Русский': 'один',
      'Английский': 'one',
      'Турецкий': 'bir'
    },
    {
    
      'Картинка': '',
      'Русский': 'два',
      'Английский': 'two',
      'Турецкий': 'iki'
    },
    {
      
      'Картинка': '',
      'Русский': 'три',
      'Английский': 'three',
      'Турецкий': 'üç'
    },
    {
      
      'Картинка': '',
      'Русский': 'четыре',
      'Английский': 'four',
      'Турецкий': 'dört'
    },
    {
     
      'Картинка': '',
      'Русский': 'пять',
      'Английский': 'five',
      'Турецкий': 'beş'
    },
    {
     
      'Картинка': '',
      'Русский': 'шесть',
      'Английский': 'six',
      'Турецкий': 'altı'
    },
    {
      
      'Картинка': '',
      'Русский': 'семь',
      'Английский': 'seven',
      'Турецкий': 'yedi'
    },
    {
    
      'Картинка': '',
      'Русский': 'восемь',
      'Английский': 'eight',
      'Турецкий': 'sekiz'
    },
    {
    
      'Картинка': '',
      'Русский': 'девять',
      'Английский': 'nine',
      'Турецкий': 'dokuz'
    },
    {
      
      'Картинка': '',
      'Русский': 'десять',
      'Английский': 'ten',
      'Турецкий': 'on'
    }
  ];
};
const createInitialAdjectivesTable = () => {
  // Базовые колонки
  const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
  ];
  
  // Колонки для базовых форм языков
  const languageColumns = [
    'База прилагательные базовая форма Русский',
    'База прилагательные базовая форма Английский',
    'База прилагательные базовая форма Турецкий',
    'База прилагательные базовая форма Испанский',
    'База прилагательные базовая форма Немецкий',
    'База прилагательные базовая форма Французский',
    'База прилагательные базовая форма Итальянский',
    'База прилагательные базовая форма Китайский',
    'База прилагательные базовая форма Японский',
    'База прилагательные базовая форма Корейский',
    'База прилагательные базовая форма Арабский'
  ];
  
  const allColumns = [...baseColumns, ...languageColumns];
  
  return [
    // Заголовок урока "Цвета"
    {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.1',
      'Урок название': 'Цвета',
      'База изображение': '',
      'Картинка png': '',
      'База прилагательные базовая форма Русский': '',
      'База прилагательные базовая форма Английский': '',
      'База прилагательные базовая форма Турецкий': '',
      'База прилагательные базовая форма Испанский': '',
      'База прилагательные базовая форма Немецкий': '',
      'База прилагательные базовая форма Французский': '',
      'База прилагательные базовая форма Итальянский': '',
      'База прилагательные базовая форма Китайский': '',
      'База прилагательные базовая форма Японский': '',
      'База прилагательные базовая форма Корейский': '',
      'База прилагательные базовая форма Арабский': ''
    },
    // Слова для темы "Цвета" - только базовая форма
    {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.1',
      'Урок название': 'Цвета',
      'База изображение': '1.1.1',
      'Картинка png': '',
      'База прилагательные базовая форма Русский': 'КРАСНЫЙ',
      'База прилагательные базовая форма Английский': 'red',
      'База прилагательные базовая форма Турецкий': 'kırmızı',
      'База прилагательные базовая форма Испанский': 'rojo',
      'База прилагательные базовая форма Немецкий': 'rot',
      'База прилагательные базовая форма Французский': 'rouge',
      'База прилагательные базовая форма Итальянский': 'rosso',
      'База прилагательные базовая форма Китайский': '红色',
      'База прилагательные базовая форма Японский': '赤い',
      'База прилагательные базовая форма Корейский': '빨간',
      'База прилагательные базовая форма Арабский': 'أحمر'
    },
    {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.1',
      'Урок название': 'Цвета',
      'База изображение': '1.1.2',
      'Картинка png': '',
      'База прилагательные базовая форма Русский': 'СИНИЙ',
      'База прилагательные базовая форма Английский': 'blue',
      'База прилагательные базовая форма Турецкий': 'mavi',
      'База прилагательные базовая форма Испанский': 'azul',
      'База прилагательные базовая форма Немецкий': 'blau',
      'База прилагательные базовая форма Французский': 'bleu',
      'База прилагательные базовая форма Итальянский': 'blu',
      'База прилагательные базовая форма Китайский': '蓝色',
      'База прилагательные базовая форма Японский': '青い',
      'База прилагательные базовая форма Корейский': '파란',
      'База прилагательные базовая форма Арабский': 'أزرق'
    },
    // Заголовок урока "Характеристики"
    {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.2',
      'Урок название': 'Характеристики',
      'База изображение': '',
      'Картинка png': '',
      'База прилагательные базовая форма Русский': '',
      'База прилагательные базовая форма Английский': '',
      'База прилагательные базовая форма Турецкий': '',
      'База прилагательные базовая форма Испанский': '',
      'База прилагательные базовая форма Немецкий': '',
      'База прилагательные базовая форма Французский': '',
      'База прилагательные базовая форма Итальянский': '',
      'База прилагательные базовая форма Китайский': '',
      'База прилагательные базовая форма Японский': '',
      'База прилагательные базовая форма Корейский': '',
      'База прилагательные базовая форма Арабский': ''
    },
    // Слова для темы "Характеристики"
    {
      'Уровень изучения номер': 'A1',
      'Урок номер': '1.2',
      'Урок название': 'Характеристики',
      'База изображение': '1.2.1',
      'Картинка png': '',
      'База прилагательные базовая форма Русский': 'БОЛЬШОЙ',
      'База прилагательные базовая форма Английский': 'big',
      'База прилагательные базовая форма Турецкий': 'büyük',
      'База прилагательные базовая форма Испанский': 'grande',
      'База прилагательные базовая форма Немецкий': 'groß',
      'База прилагательные базовая форма Французский': 'grand',
      'База прилагательные базовая форма Итальянский': 'grande',
      'База прилагательные базовая форма Китайский': '大',
      'База прилагательные базовая форма Японский': '大きい',
      'База прилагательные базовая форма Корейский': '큰',
      'База прилагательные базовая форма Арабский': 'كبير'
    }
  ];
};
const initializeAdjectivesLanguages = async () => {
    try {
        const currentData = getActiveTableData();
        if (currentData.length === 0) return;
        // Создаем базовые колонки для прилагательных
        const baseLanguagesToAdd = ['Русский', 'Английский', 'Турецкий'];
        const newTableData = currentData.map(row => {
            const newRow = { ...row };
          
            baseLanguagesToAdd.forEach(language => {
                // Добавляем все необходимые колонки для каждого языка
                newRow[`База прилагательные номер ${language}`] = '';
                newRow[`База прилагательные слова ${language}`] = '';
                newRow[`База прилагательные мужской род ${language}`] = '';
                newRow[`База прилагательные женский род ${language}`] = '';
                newRow[`База прилагательные средний род ${language}`] = '';
                newRow[`База прилагательные множественное число ${language}`] = '';
              
                // Заполняем номер если есть база изображения
                if (row['База изображение'] && row['База изображение'].trim() !== '') {
                    const languageNumber = getLanguageNumber(language);
                    newRow[`База прилагательные номер ${language}`] = `${row['База изображение']}.${languageNumber}`;
                }
            });
          
            return newRow;
        });
        setActiveTableData(newTableData);
        await saveActiveTable(newTableData);
        alert('Базовые языки для прилагательных инициализированы!');
    } catch (error) {
        console.error('Error initializing adjectives languages:', error);
        alert('Ошибка инициализации языков: ' + error.message);
    }
};
const createInitialAdverbsTable = () => {
  const baseColumns = ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  return [
    {
      'Картинка': '',
      'Русский': 'Быстро',
      'Английский': 'Quickly',
      'Турецкий': 'Hızlıca'
    },
    {
      'Картинка': '',
      'Русский': 'Медленно',
      'Английский': 'Slowly',
      'Турецкий': 'Yavaşça'
    },
    {
      'Картинка': '',
      'Русский': 'Хорошо',
      'Английский': 'Well',
      'Турецкий': 'İyi'
    },
    {
      'Картинка': '',
      'Русский': 'Плохо',
      'Английский': 'Badly',
      'Турецкий': 'Kötü'
    },
    {
      'Картинка': '',
      'Русский': 'Громко',
      'Английский': 'Loudly',
      'Турецкий': 'Yüksek sesle'
    },
    {
      'Картинка': '',
      'Русский': 'Тихо',
      'Английский': 'Quietly',
      'Турецкий': 'Sessizce'
    },
    {
      'Картинка': '',
      'Русский': 'Всегда',
      'Английский': 'Always',
      'Турецкий': 'Her zaman'
    },
    {
      'Картинка': '',
      'Русский': 'Никогда',
      'Английский': 'Never',
      'Турецкий': 'Asla'
    },
    {
      'Картинка': '',
      'Русский': 'Сегодня',
      'Английский': 'Today',
      'Турецкий': 'Bugün'
    },
    {
      'Картинка': '',
      'Русский': 'Завтра',
      'Английский': 'Tomorrow',
      'Турецкий': 'Yarın'
    }
  ];
};
const loadDataFromBackend = async (skipIfDataExists = false) => {
  console.log('ВЫЗЫВАЛСЯ ЛОАДДАТАФРОМЮБЭККК')
   if (skipIfDataExists) {
    const currentData = getActiveTableData();
    if (currentData && currentData.length > 0) {
      console.log('📥 Пропускаем загрузку, данные уже есть:', currentData.length, 'строк');
      return;
    }
  }
  try {
    setLoading(true);
    console.log('📥 Loading data from backend...');
    
    const res = await fetch(`${API_BASE_URL}/db`);
    
    if (!res.ok) {
      console.log('❌ Backend response not OK, creating initial tables...');
      
      // Создаем начальные данные для всех таблиц
      const initialNounsTable = createInitialNounsTable();
      const initialAdjectivesTable = createInitialAdjectivesTable();
      const initialQuestionWordsTable = createInitialQuestionWordsTable();
    
      
      console.log('✅ All initial tables created');
      return;
    }
    
    const data = await res.json();
    // В функции loadDataFromBackend, после получения данных:
console.log('📥 DATA FROM BACKEND:', {
  hasTable: !!data.table,
  tableLength: data.table?.length,
  hasAdjectives: !!data.adjectivesTable,
  adjectivesLength: data.adjectivesTable?.length,
  hasQuestionWords: !!data.questionWords,
  questionWordsLength: data.questionWords?.length,
  hasPrepositions: !!data.prepositionsTable,
  prepositionsLength: data.prepositionsTable?.length,
  hasGerunds: !!data.gerundsTable,
  gerundsLength: data.gerundsTable?.length,
  hasVerbs: !!data.verbsTable,
  verbsLength: data.verbsTable?.length, // ← Проверь это значение
  hasAdverbs: !!data.adverbsTable,
  adverbsLength: data.adverbsTable?.length,
  hasParticiples: !!data.participlesTable,
  participlesLength: data.participlesTable?.length,
  hasNumerals: !!data.numeralsTable,
  numeralsLength: data.numeralsTable?.length,
  hasPronouns: !!data.pronounsTable,
  pronounsLength: data.pronounsTable?.length
});
    // ВАЖНО: Добавьте подробное логирование
    console.log('📥 DATA FROM BACKEND:', {
      hasTable: !!data.table,
      tableLength: data.table?.length,
      hasAdjectives: !!data.adjectivesTable,
      adjectivesLength: data.adjectivesTable?.length,
      hasQuestionWords: !!data.questionWords,
      questionWordsLength: data.questionWords?.length,
      hasPrepositions: !!data.prepositionsTable,
      prepositionsLength: data.prepositionsTable?.length,
      hasGerunds: !!data.gerundsTable,
      gerundsLength: data.gerundsTable?.length,
      hasVerbs: !!data.verbsTable,
      verbsLength: data.verbsTable?.length,
      hasAdverbs: !!data.adverbsTable,
      adverbsLength: data.adverbsTable?.length,
      hasParticiples: !!data.participlesTable,
      participlesLength: data.participlesTable?.length,
      hasNumerals: !!data.numeralsTable,
      numeralsLength: data.numeralsTable?.length,
      hasPronouns: !!data.pronounsTable, // ← ДОБАВЛЕНО
      pronounsLength: data.pronounsTable?.length // ← ДОБАВЛЕНО
    });
    
    // Устанавливаем данные для всех таблиц
    setTableData(Array.isArray(data.table) ? data.table : []);
    setAdjectivesTableData(Array.isArray(data.adjectivesTable) ? data.adjectivesTable : []);
    setQuestionWordsData(Array.isArray(data.questionWords) ? data.questionWords : []);
    setPrepositionsTableData(Array.isArray(data.prepositionsTable) ? data.prepositionsTable : []);
    setGerundsTableData(Array.isArray(data.gerundsTable) ? data.gerundsTable : []);
    setVerbsTableData(Array.isArray(data.verbsTable) ? data.verbsTable : []);
    setAdverbsTableData(Array.isArray(data.adverbsTable) ? data.adverbsTable : []);
    setParticiplesTableData(Array.isArray(data.participlesTable) ? data.participlesTable : []);
    setNumeralsTableData(Array.isArray(data.numeralsTable) ? data.numeralsTable : []);
    setPronounsTableData(Array.isArray(data.pronounsTable) ? data.pronounsTable : []); // ← ДОБАВЛЕНО
    
    console.log('✅ Data loaded successfully');
    console.log('🔢 Pronouns table data:', Array.isArray(data.pronounsTable) ? data.pronounsTable.length : 0, 'rows');
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    
  
    
    // Пытаемся сохранить таблицы
    try {

    } catch (saveError) {
      console.error('❌ Error saving initial tables:', saveError);
    }
    
  } finally {
    setLoading(false);
  }
};

// ========================================1====
// Функция добавления нового причастия
// ============================================
const addNewParticiple = async () => {
  const currentData = getActiveTableData();
  
  // Определяем колонки - ТОЛЬКО нужные
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    // Если таблица пустая, создаем правильную структуру
    columns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png',
      'База причастия базовая форма Русский',
      'База причастия базовая форма Английский',
      'База причастия базовая форма Турецкий'
    ];
  }
  
  // Генерируем новый imageBase
  const maxImageBase = currentData
    .map(row => row['База изображение'])
    .filter(id => id && id.match(/\d+\.\d+\.\d+/))
    .map(id => {
      const parts = id.split('.');
      return parseInt(parts[parts.length - 1] || '0');
    })
    .reduce((max, current) => Math.max(max, current), 0);
  
  const newImageBase = `1.1.${maxImageBase + 1}`;
  
  const newRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newRow[col] = newImageBase;
    } else {
      newRow[col] = ''; // Пустые значения для остальных колонок
    }
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
  
  alert(`✅ Новое причастие добавлено с imageBase: ${newImageBase}`);
  
  // Сразу открываем модальное окно для ввода падежей
  // setTimeout(() => {
  //   setSelectedParticiple({
  //     imageBase: newImageBase,
  //     translations: { 
  //       russian: '',
  //       english: '',
  //       turkish: ''
  //     },
  //     word: 'Новое причастие'
  //   });
  //   setShowParticipleCaseModal(true);
  // }, 500);
};
const saveTableToDatabase = async (dataToSave, tableType = 'nouns') => {
  try {
    let endpoint = '/table';
    if (tableType === 'adjectives') endpoint = '/adjectives-table';
    if (tableType === 'question-words') endpoint = '/question-words';
    if (tableType === 'prepositions') endpoint = '/prepositions-table';
    if (tableType === 'gerunds') endpoint = '/gerunds-table';
    if (tableType === 'verbs') endpoint = '/verbs-table';
    if (tableType === 'adverbs') endpoint = '/adverbs-table'; 
    if (tableType === 'participles') endpoint = '/participles-table';
    if (tableType === 'numerals') endpoint = '/numerals-table';
        if (tableType === 'pronouns') endpoint = '/pronouns-table';

    console.log(`📤 Sending to ${endpoint} with ${dataToSave.length} rows`);
    console.log('First row sample:', dataToSave[0]);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableData: dataToSave })
    });
    
    console.log(`📥 Response status:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Failed to save table data: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Save result:', result);
    
  } catch (error) {
    console.error('❌ Error saving table:', error);
    alert('Ошибка сохранения данных: ' + error.message);
  }
};
const syncThemesToAdjectives = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/adjectives-table/sync-themes`, {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            // Обновляем состояние таблицы прилагательных новыми данными
            setAdjectivesTableData(result.data || []);
            alert(`Темы синхронизированы! Добавлено: ${result.addedCount} новых тем`);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error syncing themes:', error);
        alert('Ошибка синхронизации тем: ' + error.message);
    }
};
const getActiveTableData = () => {
  if (activeTable === 'nouns') return tableData;
  if (activeTable === 'adjectives') return adjectivesTableData;
  if (activeTable === 'question-words') return questionWordsData;
  if (activeTable === 'prepositions') return prepositionsTableData;
  if (activeTable === 'gerunds') return gerundsTableData;
  if (activeTable === 'verbs') return verbsTableData;
  if (activeTable === 'adverbs') return adverbsTableData;
  if (activeTable === 'participles') return participlesTableData;
  if (activeTable === 'numerals') return numeralsTableData;
  if (activeTable === 'pronouns') return pronounsTableData;  // ← ДОБАВЬТЕ ЭТО
  return tableData;
};
const setActiveTableData = (data) => {
    console.log(`🟡 SETTING ${activeTable} data with ${data.length} rows`);
     console.trace();
  if (activeTable === 'nouns') {
    setTableData(data);
  } else if (activeTable === 'adjectives') {
    setAdjectivesTableData(data);
  } else if (activeTable === 'question-words') {
    setQuestionWordsData(data);
  } else if (activeTable === 'prepositions') {
    setPrepositionsTableData(data);
  } else if (activeTable === 'gerunds') {
    console.log('🟢🟢🟢 УСТАНАВЛИВАЕМ ДАННЫЕ ДЛЯ ДЕЕПРИЧАСТИЙ:', data);
        setGerundsTableData(data);
  } else if (activeTable === 'verbs') {
    setVerbsTableData(data);
  } else if (activeTable === 'adverbs') {
    setAdverbsTableData(data);
  } else if (activeTable === 'participles') {
    setParticiplesTableData(data);
  } else if (activeTable === 'numerals') {
    setNumeralsTableData(data);
  } else if (activeTable === 'pronouns') {  // ← ДОБАВЬТЕ ЭТО
    setPronounsTableData(data);
  }
};

const saveActiveTable = async (data) => {
  console.log(`🔵 SAVING ${activeTable} with ${data.length} rows:`, data);
   if (!data || data.length === 0) {
    console.error('❌ Попытка сохранить пустые данные!');
    return;
  }
  
  console.log('🔍 Первая строка для сохранения:', data[0]);
  if (activeTable === 'nouns') {
    await saveTableToDatabase(data, 'nouns');
  } else if (activeTable === 'adjectives') {
    await saveTableToDatabase(data, 'adjectives');
  } else if (activeTable === 'question-words') {
    await saveTableToDatabase(data, 'question-words');
  } else if (activeTable === 'prepositions') {
    await saveTableToDatabase(data, 'prepositions');
  } else if (activeTable === 'gerunds') {
    await saveTableToDatabase(data, 'gerunds');
  } else if (activeTable === 'verbs') {
    await saveTableToDatabase(data, 'verbs');
  } else if (activeTable === 'adverbs') {
    await saveTableToDatabase(data, 'adverbs');
  } else if (activeTable === 'participles') {
    await saveTableToDatabase(data, 'participles');
  } else if (activeTable === 'numerals') {
    await saveTableToDatabase(data, 'numerals');
  } else if (activeTable === 'pronouns') {  // ← ДОБАВЬТЕ ЭТО
    await saveTableToDatabase(data, 'pronouns');
  }
  
  console.log(`🟢 Saved ${activeTable} successfully`);
};
const loadVerbConjugation = async (imageBase) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verb-conjugation/${imageBase}`);
    const data = await response.json();
    setVerbConjugation({
      present: data.present || {
        я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
      },
      past: data.past || {
        я_м: '', я_ж: '', я_с: '',
        ты_м: '', ты_ж: '', ты_с: '',
        он: '', она: '', оно: '',
        мы: '', вы: '', они: ''
      },
      future: data.future || {
        я: '', ты: '', он: '', она: '', оно: '', мы: '', вы: '', они: ''
      },
      imperative: data.imperative || {
        ты: '', вы: ''
      },
      infinitive: data.infinitive || '',
      baseForm: data.baseForm || ''
    });
  } catch (error) {
    console.error('Error loading verb conjugation:', error);
  }
};
const saveVerbConjugation = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/verb-conjugation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase: selectedVerb.imageBase,
        present: verbConjugation.present,
        past: verbConjugation.past,
        future: verbConjugation.future,
        imperative: verbConjugation.imperative,
        infinitive: verbConjugation.infinitive,
        baseForm: verbConjugation.baseForm
      })
    });
    
    if (response.ok) {
      alert('Спряжение глагола сохранено успешно!');
      setShowVerbConjugationModal(false);
    } else {
      throw new Error('Failed to save verb conjugation');
    }
  } catch (error) {
    console.error('Error saving verb conjugation:', error);
    alert('Ошибка сохранения спряжения: ' + error.message);
  }
};
// Замените существующую addNewVerb
const addNewAdverb = async () => {
  const currentData = getActiveTableData();
  
  // Определяем колонки - для наречий простая структура как у деепричастий
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    // Если таблица пустая, создаем правильную структуру
    columns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png',
      'Русский',
      'Английский',
      'Турецкий'
    ];
  }
  
  // Генерируем новый imageBase
  const maxImageBase = currentData
    .map(row => row['База изображение'])
    .filter(id => id && id.match(/\d+\.\d+\.\d+/))
    .map(id => {
      const parts = id.split('.');
      return parseInt(parts[parts.length - 1] || '0');
    })
    .reduce((max, current) => Math.max(max, current), 0);
  
  const newImageBase = `1.1.${maxImageBase + 1}`;
  
  const newRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newRow[col] = newImageBase;
    } else {
      newRow[col] = '';
    }
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
  
  alert(`✅ Новое наречие добавлено с imageBase: ${newImageBase}`);
};
// ЗАМЕНИ существующую функцию addNewVerb на эту:
const addNewVerb = async () => {
  const currentData = getActiveTableData();
  
  // Определяем колонки - ТОЛЬКО НУЖНЫЕ, без 'Русский'
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    // Если таблица пустая, создаем правильную структуру
    columns = [
     
      'Картинка png', 
      'Инфинитив',      // ← ТОЛЬКО ЭТО
      'Английский', 
      'Турецкий'
    ];
  }
  
  // Генерируем новый imageBase
  const maxImageBase = currentData
    .map(row => row['База изображение'])
    .filter(id => id && id.startsWith('verb_'))
    .map(id => {
      const match = id.match(/verb_(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        return parseInt(match[3]);
      }
      return 0;
    })
    .reduce((max, current) => Math.max(max, current), 0);
  
  const newImageBase = `verb_1.1.${maxImageBase + 1}`;
  
  const newRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newRow[col] = newImageBase;
    } else {
      newRow[col] = ''; // Пустые значения для остальных колонок
    }
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
  
  alert(`Новый глагол добавлен с imageBase: ${newImageBase}`);
};
const addNewGerund = async () => {
  const currentData = getActiveTableData();
  const columns = currentData.length > 0 
    ? Object.keys(currentData[0]) 
    : ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  const newRow = {};
  columns.forEach(col => {
    newRow[col] = '';
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
};
const handleCellEdit = async (rowIndex, colKey, value) => {
  console.log(`✏️ Editing cell: row ${rowIndex}, col ${colKey}, value:`, value);
  
  const currentData = getActiveTableData();
  const newData = [...currentData];
  newData[rowIndex] = { ...newData[rowIndex], [colKey]: value };
  setActiveTableData(newData);
  await saveActiveTable(newData);
};
const deleteRow = async (rowIndex) => {
  if (!confirm('Вы уверены, что хотите удалить эту строку?')) return;
  
  const currentData = getActiveTableData();
  const row = currentData[rowIndex];
  const imageBase = row?.['База изображение'];
  
  // Удаляем падежи/склонения на бэкенде (убираем "призраков")
  if (imageBase && !isLessonHeader(row)) {
    try {
      if (activeTable === 'nouns') {
        await fetch(`${API_BASE_URL}/noun-cases/${imageBase}`, { method: 'DELETE' });
        console.log(`🗑️ Удалены падежи существительного: ${imageBase}`);
      } else if (activeTable === 'adjectives') {
        await fetch(`${API_BASE_URL}/adjective-cases/${imageBase}`, { method: 'DELETE' });
        console.log(`🗑️ Удалены падежи прилагательного: ${imageBase}`);
      } else if (activeTable === 'participles') {
        await fetch(`${API_BASE_URL}/participle-cases/${imageBase}`, { method: 'DELETE' });
        console.log(`🗑️ Удалены падежи причастия: ${imageBase}`);
      } else if (activeTable === 'numerals') {
        await fetch(`${API_BASE_URL}/numeral-cases/${imageBase}`, { method: 'DELETE' });
        console.log(`🗑️ Удалены падежи числительного: ${imageBase}`);
      } else if (activeTable === 'pronouns') {
        await fetch(`${API_BASE_URL}/pronoun-declensions/${imageBase}`, { method: 'DELETE' });
        console.log(`🗑️ Удалены склонения местоимения: ${imageBase}`);
      } else if (activeTable === 'question-words') {
        // Для вопросительных слов imageBase может быть сгенерирован
        const qImageBase = imageBase || `question_word_${(row['Русский'] || '').toLowerCase()}`;
        await fetch(`${API_BASE_URL}/question-word-cases/${qImageBase}`, { method: 'DELETE' });
        console.log(`🗑️ Удалены падежи вопросительного слова: ${qImageBase}`);
      }
    } catch (error) {
      console.error('Ошибка удаления падежей:', error);
    }
  }
  
  const newData = currentData.filter((_, index) => index !== rowIndex);
  setActiveTableData(newData);
  await saveActiveTable(newData);
  alert('Строка удалена успешно!');
};
    const deleteColumn = async (colKey) => {
        if (!confirm(`Вы уверены, что хотите удалить колонку "${colKey}"?`)) return;
      
        const currentData = getActiveTableData();
        const newData = currentData.map(row => {
            const newRow = { ...row };
            delete newRow[colKey];
            return newRow;
        });
        setActiveTableData(newData);
        await saveActiveTable(newData);
        alert('Колонка удалена успешно!');
    };
    const isTestFormValid = () => {
        return (
            newLesson.studiedLanguage &&
            newLesson.hintLanguage &&
            newLesson.level &&
            newLesson.theme &&
            newLesson.studiedLanguage !== newLesson.hintLanguage &&
            selectedWords.length >= 2 &&
            testTranslationCheck.isValid
        );
    };
const addNewPronoun = async () => {
  const currentData = getActiveTableData();
  
  // ✅ Берём ВСЕ колонки из текущей таблицы, а не только базовые
  let columns = [];
  if (currentData.length > 0) {
    columns = Object.keys(currentData[0]);
  } else {
    // Если таблица пустая, создаём базовую структуру
    columns = [
      'База изображение',
      'Картинка',
      'Русский',
      'Английский',
      'Турецкий'
    ];
  }
  
  // Генерируем новый imageBase
  const maxImageBase = currentData
    .map(row => row['База изображение'])
    .filter(id => id && id.startsWith('pronoun_'))
    .map(id => {
      const match = id.match(/pronoun_(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        return parseInt(match[3]);
      }
      return 0;
    })
    .reduce((max, current) => Math.max(max, current), 0);
  const newImageBase = `pronoun_1.1.${maxImageBase + 1}`;
  
  // ✅ Создаём новую строку со ВСЕМИ колонками из таблицы
  const newRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newRow[col] = newImageBase;
    } else {
      newRow[col] = ''; // Пустые значения для всех остальных колонок
    }
  });
  
  // Добавляем строку в данные
  const newTableData = [...currentData, newRow];
  
  // Обновляем состояние и сохраняем
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
  alert(`✅ Новое местоимение добавлено с imageBase: ${newImageBase}`);
};

   const addNewPreposition = async () => {
  const currentData = getActiveTableData();
  const columns = currentData.length > 0 
    ? Object.keys(currentData[0]) 
    : ['Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  const newRow = {};
  columns.forEach(col => {
    newRow[col] = ''; // Создаем пустую строку
  });
  
  const newTableData = [...currentData, newRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);
};
const addNewLesson = async () => {
    console.log('🚀 ========== НАЧАЛО addNewLesson ==========');
  console.log('1. activeTable:', activeTable);
  console.log('2. newLesson:', newLesson);
 const maxLessonNumber = getMaxLessonNumber();
  console.log('3. maxLessonNumber:', maxLessonNumber);
  
  const newLessonNumber = (maxLessonNumber + 0.1).toFixed(1);
  console.log('4. newLessonNumber:', newLessonNumber);
  
  const currentData = getActiveTableData();
  console.log('5. currentData длина:', currentData?.length);
  console.log('5a. Первая строка currentData:', currentData[0]);
  
  let columns = [];
  let newLessonRow = {};
  
  // Для существительных
  if (activeTable === 'nouns') {
    columns = currentData.length > 0 
      ? Object.keys(currentData[0]) 
      : Object.keys(createInitialNounsTable()[0]);
    
    newLessonRow = createRow(columns, {
      'Уровень изучения номер': newLesson.level || 'A1',
      'Урок номер': newLessonNumber,
      'Урок название': `Новый урок ${newLessonNumber}`
    });
  } 
  // Для прилагательных (НОВАЯ СТРУКТУРА)
  else if (activeTable === 'adjectives') {
    // Определяем колонки для новой структуры прилагательных
    // Базовая форма для каждого языка + стандартные колонки
    const baseColumns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png'
    ];
    
    // Получаем все добавленные языки
    const addedLangs = getAddedLanguages();
    
    // Если языков нет, добавляем хотя бы русский
    if (addedLangs.length === 0) {
      addedLangs.push('Русский');
    }
    
    // Создаем колонки для базовых форм каждого языка
    const languageColumns = addedLangs.map(lang => 
      `База прилагательные базовая форма ${lang}`
    );
    
    columns = [...baseColumns, ...languageColumns];
    
    // Создаем строку для нового урока
    newLessonRow = {};
    columns.forEach(col => {
      if (col === 'Уровень изучения номер') {
        newLessonRow[col] = newLesson.level || 'A1';
      } else if (col === 'Урок номер') {
        newLessonRow[col] = newLessonNumber;
      } else if (col === 'Урок название') {
        newLessonRow[col] = `Новый урок ${newLessonNumber}`;
      } else if (col === 'База изображение') {
        newLessonRow[col] = ''; // Пусто для заголовка урока
      } else if (col === 'Картинка png') {
        newLessonRow[col] = ''; // Пусто для заголовка урока
      } else if (col.includes('База прилагательные базовая форма')) {
        newLessonRow[col] = ''; // Пусто для заголовка урока
      } else {
        newLessonRow[col] = ''; // На всякий случай
      }
    });
  }

  // В функции addNewLesson, после секции для глаголов, добавьте:
// В функции addNewLesson, найдите секцию для деепричастий и ЗАМЕНИТЕ её:

else if (activeTable === 'gerunds') {
    console.log('🎯 ====== ВЕТКА ДЕЕПРИЧАСТИЙ ======');
    
    const baseColumns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png'
    ];
    
    const addedLangs = getAddedLanguages();
    console.log('6. addedLangs:', addedLangs);
    
    const languageColumns = ['Русский', ...addedLangs.filter(lang => lang !== 'Русский')];
    console.log('7. languageColumns:', languageColumns);
    
    const columns = [...baseColumns, ...languageColumns];
    console.log('8. Все колонки:', columns);
    
    newLessonRow = {};
    columns.forEach(col => {
      if (col === 'Уровень изучения номер') {
        newLessonRow[col] = newLesson.level || 'A1';
      } else if (col === 'Урок номер') {
        newLessonRow[col] = newLessonNumber;
      } else if (col === 'Урок название') {
        newLessonRow[col] = `Новый урок ${newLessonNumber}`;
      } else {
        newLessonRow[col] = '';
      }
    });
    
    console.log('9. Созданная строка урока:', newLessonRow);
    
    const newTableData = [...currentData, newLessonRow];
    console.log('10. Новые данные (длина):', newTableData.length);
    console.log('10a. Последняя строка:', newTableData[newTableData.length - 1]);
    
    console.log('11. Вызываем setActiveTableData...');
    setActiveTableData(newTableData);
    
    console.log('12. Вызываем saveActiveTable...');
    await saveActiveTable(newTableData);
    
    console.log('13. saveActiveTable завершен');
    
    alert(`✅ Новый урок "${newLessonRow['Урок название']}" создан!`);
    console.log('14. Первый alert показан');
    console.log('15. ========== КОНЕЦ addNewLesson ==========');
  }
  // В функции addNewLesson, после секции для прилагательных, добавь:
// В функции addNewLesson, найди эту секцию и ЗАМЕНИ её:
// В функции addNewLesson, найди секцию для глаголов и ЗАМЕНИ её:

 else if (activeTable === 'verbs') {
    console.log('🎯 ====== ВЕТКА ГЛАГОЛОВ ======');
    
    const baseColumns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png'
    ];
    
    const addedLangs = getAddedLanguages();
    console.log('6. addedLangs:', addedLangs);
    
    const languageColumns = ['Инфинитив', ...addedLangs.filter(lang => lang !== 'Инфинитив')];
    console.log('7. languageColumns:', languageColumns);
    
    const columns = [...baseColumns, ...languageColumns];
    console.log('8. Все колонки:', columns);
    
    newLessonRow = {};
    columns.forEach(col => {
      if (col === 'Уровень изучения номер') {
        newLessonRow[col] = newLesson.level || 'A1';
      } else if (col === 'Урок номер') {
        newLessonRow[col] = newLessonNumber;
      } else if (col === 'Урок название') {
        newLessonRow[col] = `Новый урок ${newLessonNumber}`;
      } else {
        newLessonRow[col] = '';
      }
    });
    
    console.log('9. Созданная строка урока:', newLessonRow);
    
    const newTableData = [...currentData, newLessonRow];
    console.log('10. Новые данные (длина):', newTableData.length);
    console.log('10a. Последняя строка:', newTableData[newTableData.length - 1]);
    
    console.log('11. Вызываем setActiveTableData...');
    setActiveTableData(newTableData);
    
    console.log('12. Вызываем saveActiveTable...');
    await saveActiveTable(newTableData);
    
    console.log('13. saveActiveTable завершен');
    
    // Здесь происходит ПЕРВЫЙ alert
    alert(`✅ Новый урок "${newLessonRow['Урок название']}" создан!`);
    console.log('14. Первый alert показан');
    console.log('15. ========== КОНЕЦ addNewLesson ==========');
  }
  // Для вопросительных слов
  else if (activeTable === 'question-words') {
    columns = currentData.length > 0 
      ? Object.keys(currentData[0]) 
      : questionWordsBaseColumns;
    
    newLessonRow = createRow(columns, {
      'Уровень изучения номер': newLesson.level || 'A1',
      'Урок номер': newLessonNumber,
      'Урок название': `Новый урок ${newLessonNumber}`
    });
  }

  const newTableData = [...currentData, newLessonRow];
  setActiveTableData(newTableData);
  await saveActiveTable(newTableData);

  if (activeTable === 'nouns') {
    await autoSyncWithAdjectives(newLessonRow['Урок название']);
  }
  // В функции addNewLesson, найдите эту секцию и ЗАМЕНИТЕ:

else if (activeTable === 'participles') {
  console.log('🎯 ====== ВЕТКА ПРИЧАСТИЙ (УПРОЩЕННАЯ) ======');
  
  // Базовая структура колонок для причастий - ТОЛЬКО НУЖНЫЕ
  const baseColumns = [
    'Уровень изучения номер',
    'Урок номер',
    'Урок название',
    'База изображение',
    'Картинка png'
  ];
  
  // Получаем все добавленные языки для причастий
  const addedLangs = getAddedLanguages();
  console.log('6. addedLangs для причастий:', addedLangs);
  
  // Если языков нет, добавляем хотя бы русский
  const languageColumns = addedLangs.length > 0 
    ? addedLangs.map(lang => `База причастия базовая форма ${lang}`)
    : ['База причастия базовая форма Русский'];
  
  console.log('7. languageColumns:', languageColumns);
  
  const allColumns = [...baseColumns, ...languageColumns];
  console.log('8. Все колонки для причастий:', allColumns);
  
  // Создаем строку для нового урока
  newLessonRow = {};
  allColumns.forEach(col => {
    if (col === 'Уровень изучения номер') {
      newLessonRow[col] = newLesson.level || 'A1';
    } else if (col === 'Урок номер') {
      newLessonRow[col] = newLessonNumber;
    } else if (col === 'Урок название') {
      newLessonRow[col] = `Новый урок ${newLessonNumber}`;
    } else {
      newLessonRow[col] = ''; // Пусто для остальных колонок
    }
  });
  
  console.log('9. Созданная строка урока причастий:', newLessonRow);
  
  const newTableData = [...currentData, newLessonRow];
  console.log('10. Новые данные (длина):', newTableData.length);
  console.log('10a. Последняя строка:', newTableData[newTableData.length - 1]);
  
  console.log('11. Вызываем setActiveTableData...');
  setActiveTableData(newTableData);
  
  console.log('12. Вызываем saveActiveTable...');
  await saveActiveTable(newTableData);
  
  console.log('13. saveActiveTable завершен');
  
  alert(`✅ Новый урок "${newLessonRow['Урок название']}" создан!`);
  console.log('14. ========== КОНЕЦ addNewLesson ==========');
}
    else if (activeTable === 'adverbs') {
        console.log('🎯 ====== ВЕТКА НАРЕЧИЙ ======');
        
        // Базовая структура колонок для наречий (как у деепричастий)
        const baseColumns = [
            'Уровень изучения номер',
            'Урок номер',
            'Урок название',
            'База изображение',
            'Картинка png'
        ];
        
        // Получаем все добавленные языки для наречий
        const addedLangs = getAddedLanguages();
        console.log('6. addedLangs для наречий:', addedLangs);
        
        // Если языков нет, добавляем базовые
        const languageColumns = addedLangs.length > 0 ? addedLangs : ['Русский', 'Английский', 'Турецкий'];
        console.log('7. languageColumns:', languageColumns);
        
        // Создаем колонки для языков (простая структура, как у деепричастий)
        const columns = [...baseColumns, ...languageColumns];
        console.log('8. Все колонки для наречий:', columns);
        
        // Создаем строку для нового урока
        newLessonRow = {};
        columns.forEach(col => {
            if (col === 'Уровень изучения номер') {
                newLessonRow[col] = newLesson.level || 'A1';
            } else if (col === 'Урок номер') {
                newLessonRow[col] = newLessonNumber;
            } else if (col === 'Урок название') {
                newLessonRow[col] = `Новый урок ${newLessonNumber}`;
            } else {
                newLessonRow[col] = ''; // Пусто для остальных колонок
            }
        });
        
        console.log('9. Созданная строка урока наречий:', newLessonRow);
        
        const newTableData = [...currentData, newLessonRow];
        console.log('10. Новые данные (длина):', newTableData.length);
        console.log('10a. Последняя строка:', newTableData[newTableData.length - 1]);
        
        console.log('11. Вызываем setActiveTableData...');
        setActiveTableData(newTableData);
        
        console.log('12. Вызываем saveActiveTable...');
        await saveActiveTable(newTableData);
        
        console.log('13. saveActiveTable завершен');
        
        alert(`✅ Новый урок "${newLessonRow['Урок название']}" создан!`);
        console.log('14. ========== КОНЕЦ addNewLesson ==========');
    }
  alert(`✅ Новый урок "${newLessonRow['Урок название']}" создан!`);
};

    const addColumn = async () => {
        const newColName = prompt('Название новой колонки:');
        if (!newColName) return;
        const currentData = getActiveTableData();
        const updated = currentData.map(row => ({ ...row, [newColName]: '' }));
        setActiveTableData(updated);
        await saveActiveTable(updated);
    };
    const autoSyncWithAdjectives = async (newTheme) => {
    try {
        const response = await fetch(`${API_BASE_URL}/adjectives-table/sync-themes`, {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            // Обновляем таблицу прилагательных
            setAdjectivesTableData(result.data || []);
            console.log(`Автоматически синхронизирована тема: ${newTheme}`);
        }
    } catch (error) {
        console.error('Error auto-syncing themes:', error);
        // Не показываем ошибку пользователю при автоматической синхронизации
    }
};
const handleAddLanguage = async () => {
  if (!newLanguage) { 
    alert('Выберите язык'); 
    return; 
  }
  
  const languageName = newLanguage;
  const currentData = getActiveTableData();
  
  // Для таблиц с простой структурой (вопросительные слова, Предлоги, частицы, деепричастия, наречия, глаголы)
  if (activeTable === 'question-words' || 
      activeTable === 'prepositions' || 
      activeTable === 'gerunds' ||
      activeTable === 'adverbs' 
     ) {
    
    // Проверяем, есть ли колонка "Картинка"
 
    
    const newTableData = currentData.map(row => {
      const newRow = { ...row };
      
      // Если нет колонки "Картинка", добавляем её
     
      
      // Добавляем новую языковую колонку
      newRow[languageName] = '';
      return newRow;
    });
const audioCol = `Аудио ${newLanguage}`;
    for (let i = 0; i < newTableData.length; i++) {
        if (!newTableData[i].hasOwnProperty(audioCol)) {
            newTableData[i][audioCol] = '';
        }
    }
    setActiveTableData(newTableData);
    setShowAddLanguageModal(false);
    setNewLanguage('');
    await saveActiveTable(newTableData);

    alert(`Язык "${languageName}" добавлен успешно!`);
    return;
  }
  
  // Для причастий (нужна специальная структура как у прилагательных)
  // В функции handleAddLanguage, для причастий
// В функции handleAddLanguage, для причастий
else if (activeTable === 'participles') {
  // Создаем только одну колонку для нового языка - базовую форму
  const newColumn = `База причастия базовая форма ${languageName}`;
  
  // Проверяем, есть ли уже такая колонка
  if (currentData.length > 0 && currentData[0].hasOwnProperty(newColumn)) {
    alert(`Язык "${languageName}" уже существует`);
    return;
  }
  
  // Сохраняем существующие колонки
  const existingColumns = currentData.length > 0 
    ? Object.keys(currentData[0])
    : ['Уровень изучения номер', 'Урок номер', 'Урок название', 'База изображение', 'Картинка png'];
  
  // Добавляем новую колонку
  const allColumns = [...existingColumns, newColumn];
  
  // Перестраиваем все строки
  const newTableData = currentData.map(row => {
    const newRow = {};
    allColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        newRow[col] = row[col] || '';
      } else {
        newRow[col] = ''; // Новая колонка - пустая
      }
    });
    return newRow;
  });
  
  // Если таблица пустая, создаем базовую строку
  if (newTableData.length === 0) {
    const newRow = {};
    allColumns.forEach(col => {
      newRow[col] = '';
    });
    newTableData.push(newRow);
  }
  const audioCol = `Аудио ${newLanguage}`;
    for (let i = 0; i < newTableData.length; i++) {
        if (!newTableData[i].hasOwnProperty(audioCol)) {
            newTableData[i][audioCol] = '';
        }
    }
  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);
  
  alert(`Язык "${languageName}" добавлен успешно! Создана колонка базовой формы.`);
  return;
}
  // В функции handleAddLanguage, НАЙДИ этот блок и УБЕДИСЬ, что он выглядит так:
else if (activeTable === 'verbs') {
  // Проверяем, есть ли уже такая колонка
  if (currentData.length > 0 && currentData[0].hasOwnProperty(newLanguage)) {
    alert(`Язык "${newLanguage}" уже существует`);
    return;
  }
  
  const newTableData = currentData.map(row => {
    const newRow = { ...row };
    newRow[newLanguage] = ''; // Добавляем новую языковую колонку
    return newRow;
  });
 const audioCol = `Аудио ${newLanguage}`;
    for (let i = 0; i < newTableData.length; i++) {
        if (!newTableData[i].hasOwnProperty(audioCol)) {
            newTableData[i][audioCol] = '';
        }
    }
  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);

  alert(`Язык "${newLanguage}" добавлен успешно!`);
  return;
}
// В функции handleAddLanguage, после блока для числительных, добавьте:

else if (activeTable === 'pronouns') {
  console.log('🎯 Adding language to pronouns table:', newLanguage);
  
  const currentData = getActiveTableData();
  
  // Проверяем, есть ли уже такая колонка
  if (currentData.length > 0 && currentData[0].hasOwnProperty(newLanguage)) {
    alert(`Язык "${newLanguage}" уже существует`);
    return;
  }
  
  // Сохраняем существующие колонки
  const existingColumns = currentData.length > 0 
    ? Object.keys(currentData[0])
    : ['База изображение', 'Картинка', 'Русский', 'Английский', 'Турецкий'];
  
  // Добавляем новую колонку
  const allColumns = [...existingColumns, newLanguage];
  
  // Перестраиваем все строки с новым набором колонок
  const newTableData = currentData.map(row => {
    const newRow = {};
    allColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        newRow[col] = row[col] || '';
      } else {
        newRow[col] = ''; // Новая колонка - пустая
      }
    });
    return newRow;
  });
  
  // Если таблица пустая, создаём базовую строку
  if (newTableData.length === 0) {
    const newRow = {};
    allColumns.forEach(col => {
      newRow[col] = '';
    });
    newTableData.push(newRow);
  }
  
  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);
  
  // Автоматически создаём колонку для аудио нового языка
  const audioColumnName = `Аудио ${newLanguage}`;
  if (!newTableData[0].hasOwnProperty(audioColumnName)) {
    const updatedData = [...newTableData];
    for (let i = 0; i < updatedData.length; i++) {
      if (!updatedData[i][audioColumnName]) {
        updatedData[i][audioColumnName] = '';
      }
    }
    setActiveTableData(updatedData);
    await saveActiveTable(updatedData);
  }
  
  alert(`Язык "${newLanguage}" добавлен успешно!`);
  return;
}
  // ЛОГИКА ДЛЯ ЧИСЛИТЕЛЬНЫХ
// ЛОГИКА ДЛЯ ЧИСЛИТЕЛЬНЫХ (упрощенная как у глаголов)
else if (activeTable === 'numerals') {
  // Проверяем, есть ли уже такая колонка
  if (currentData.length > 0 && currentData[0].hasOwnProperty(newLanguage)) {
    alert(`Язык "${newLanguage}" уже существует`);
    return;
  }
  
  const newTableData = currentData.map(row => {
    const newRow = { ...row };
    newRow[newLanguage] = '';
    return newRow;
  });

  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);

  alert(`Язык "${newLanguage}" добавлен успешно!`);
  return;
}

  // ЛОГИКА ДЛЯ СУЩЕСТВИТЕЛЬНЫХ
  else if (activeTable === 'nouns') {
    // Определяем конфигурацию языков для существительных
    const languagesConfig = allLanguages;
    
    // Ищем конфигурацию по названию языка
    let languageConfig = null;
    for (const [key, config] of Object.entries(languagesConfig)) {
      const languageNameFromConfig = config.number.split(' ').pop();
      if (languageNameFromConfig === newLanguage) {
        languageConfig = config;
        break;
      }
    }
    
    if (!languageConfig) { 
      alert(`Язык "${newLanguage}" не найден в конфигурации для существительных`); 
      return; 
    }

    // Функция для получения следующего номера языка
    const getNextLanguageNumber = () => {
      const existingLanguages = getAddedLanguages();
      const languageNumbers = {
        'Русский': 1,
        'Английский': 2,
        'Турецкий': 3,
        'Испанский': 4,
        'Немецкий': 5,
        'Французский': 6,
        'Итальянский': 7,
        'Китайский': 8,
        'Японский': 9,
        'Корейский': 10,
        'Арабский': 11,
        'Хинди': 12,
        'Португальский': 13,
        'Голландский': 14,
        'Шведский': 15,
        'Польский': 16,
        'Греческий': 17,
        'Иврит': 18,
        'Вьетнамский': 19,
        'Индонезийский': 20
      };
   
      if (languageNumbers[languageName]) {
        return languageNumbers[languageName];
      }
   
      let maxNumber = 0;
      existingLanguages.forEach(lang => {
        const langNumber = languageNumbers[lang] || 0;
        if (langNumber > maxNumber) maxNumber = langNumber;
      });
   
      return maxNumber + 1;
    };

    const languageNumber = getNextLanguageNumber();

    // Колонки для существительных (номер и слово)
    const newColumns = Object.values(languageConfig);

    const newTableData = currentData.map(row => {
      const newRow = { ...row };
   
      // Добавляем новые пустые колонки
      newColumns.forEach(colName => {
        newRow[colName] = '';
      });
   
      // Заполняем номер для существующих слов
      if (row['База изображение'] && row['База изображение'].trim() !== '') {
        const imageBase = row['База изображение'];
        newRow[languageConfig.number] = `${imageBase}.${languageNumber}`;
      }
   
      return newRow;
    });
 const audioCol = `Аудио ${newLanguage}`;
    for (let i = 0; i < newTableData.length; i++) {
        if (!newTableData[i].hasOwnProperty(audioCol)) {
            newTableData[i][audioCol] = '';
        }
    }
    setActiveTableData(newTableData);
    setShowAddLanguageModal(false);
    setNewLanguage('');
    await saveActiveTable(newTableData);

    alert(`Язык "${languageName}" добавлен успешно!`);
    return;
  }
  
  // ЛОГИКА ДЛЯ ПРИЛАГАТЕЛЬНЫХ
  else if (activeTable === 'adjectives') {
  console.log('🎯 Adding language to adjectives table:', newLanguage);
  
  const currentData = getActiveTableData();
  
  // Правильное имя колонки для нового языка
  const newColumnName = `База прилагательные базовая форма ${newLanguage}`;
  
  // Проверяем, есть ли уже такая колонка
  if (currentData.length > 0 && currentData[0].hasOwnProperty(newColumnName)) {
    alert(`Язык "${newLanguage}" уже существует`);
    return;
  }
  
  // Сохраняем существующие колонки
  const existingColumns = currentData.length > 0 
    ? Object.keys(currentData[0])
    : [
        'Уровень изучения номер',
        'Урок номер',
        'Урок название',
        'База изображение',
        'Картинка png'
      ];
  
  // Добавляем новую колонку
  const allColumns = [...existingColumns, newColumnName];
  
  // Перестраиваем все строки с новым набором колонок
  const newTableData = currentData.map(row => {
    const newRow = {};
    allColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        newRow[col] = row[col] || '';
      } else {
        newRow[col] = ''; // Новая колонка - пустая
      }
    });
    return newRow;
  });
  
  // Если таблица пустая, создаём базовую строку
  if (newTableData.length === 0) {
    const newRow = {};
    allColumns.forEach(col => {
      newRow[col] = '';
    });
    newTableData.push(newRow);
  }
   const audioCol = `Аудио ${newLanguage}`;
    for (let i = 0; i < newTableData.length; i++) {
        if (!newTableData[i].hasOwnProperty(audioCol)) {
            newTableData[i][audioCol] = '';
        }
    }
  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);
  
  alert(`Язык "${newLanguage}" добавлен успешно! Создана колонка: ${newColumnName}`);
  return;
}
  // В функции handleAddLanguage добавьте:
else if (activeTable === 'pronouns') {
  // Проверяем, есть ли уже такая колонка
  if (currentData.length > 0 && currentData[0].hasOwnProperty(newLanguage)) {
    alert(`Язык "${newLanguage}" уже существует`);
    return;
  }
  
  // Сохраняем существующие колонки, добавляя новую
  const existingColumns = currentData.length > 0 
    ? Object.keys(currentData[0]).filter(col => 
        col !== 'База изображение' && col !== 'Картинка'
      )
    : [];
  
  // Создаем правильный набор колонок: базовые + все языки
  const baseColumns = ['База изображение', 'Картинка'];
  const languageColumns = [...existingColumns, newLanguage].sort();
  const allColumns = [...baseColumns, ...languageColumns];
  
  // Перестраиваем все строки с новым набором колонок
  const newTableData = currentData.map(row => {
    const newRow = {};
    allColumns.forEach(col => {
      if (baseColumns.includes(col)) {
        // Базовые колонки сохраняем как есть
        newRow[col] = row[col] || '';
      } else {
        // Языковые колонки - либо старые значения, либо пустые для новых
        newRow[col] = row[col] || '';
      }
    });
    return newRow;
  });
  
  // Если таблица пустая, создаем строку с правильными колонками
  if (newTableData.length === 0) {
    const newRow = {};
    allColumns.forEach(col => {
      newRow[col] = '';
    });
    newTableData.push(newRow);
  }
   const audioCol = `Аудио ${newLanguage}`;
    for (let i = 0; i < newTableData.length; i++) {
        if (!newTableData[i].hasOwnProperty(audioCol)) {
            newTableData[i][audioCol] = '';
        }
    }
  setActiveTableData(newTableData);
  setShowAddLanguageModal(false);
  setNewLanguage('');
  await saveActiveTable(newTableData);
  
  alert(`Язык "${newLanguage}" добавлен успешно!`);
  return;
}
};
 const deleteLanguage = async (language) => {
  if (!confirm(`Вы уверены, что хотите удалить язык "${language}"? Будут удалены все связанные колонки.`)) return;

  const currentData = getActiveTableData();
  
  // Для таблиц с простой структурой
  if (activeTable === 'question-words' || activeTable === 'prepositions' || activeTable === 'gerunds') {
    const newData = currentData.map(row => {
      const newRow = { ...row };
      delete newRow[language];
      return newRow;
    });
    
    setActiveTableData(newData);
    await saveActiveTable(newData);
  } 
  // Для существительных и прилагательных - старая логика
  else {
    // ... логика для существительных и прилагательных
  }
  
  alert(`Язык "${language}" удален успешно!`);
};
    const loadFlags = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/flags`);
            if (response.ok) {
                const flagsData = await response.json();
                setFlags(flagsData);
            }
        } catch (error) {
            console.error('Error loading flags:', error);
        }
    };
    const loadTableLanguages = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/table-languages`);
            if (response.ok) {
                const languages = await response.json();
                setTableLanguages(languages);
            }
        } catch (error) {
            console.error('Error loading table languages:', error);
        }
    };
    const syncFlagsWithTable = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/flags/sync`, {
                method: 'POST'
            });
         
            if (response.ok) {
                const result = await response.json();
                setFlags(result.flags);
                alert(`Флаги синхронизированы! Добавлено: ${result.added}, Удалено: ${result.removed}`);
            } else {
                throw new Error('Failed to sync flags');
            }
        } catch (error) {
            console.error('Error syncing flags:', error);
            alert('Ошибка синхронизации флагов: ' + error.message);
        }
    };
    const saveFlag = async (flagData) => {
        try {
            let response;
            if (flagData._id) {
                response = await fetch(`${API_BASE_URL}/flags/${flagData._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(flagData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/flags`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(flagData)
                });
            }
            if (response.ok) {
                await loadFlags();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving flag:', error);
            return false;
        }
    };
    const deleteFlag = async (flagId, language) => {
        if (!confirm(`Вы уверены, что хотите удалить флаг для языка "${language}"?`)) return;
     
        try {
            const response = await fetch(`${API_BASE_URL}/flags/${flagId}`, {
                method: 'DELETE'
            });
         
            if (response.ok) {
                await loadFlags();
                alert('Флаг удален успешно!');
            } else {
                throw new Error('Failed to delete flag');
            }
        } catch (error) {
            console.error('Error deleting flag:', error);
            alert('Ошибка удаления флага: ' + error.message);
        }
    };
    const uploadImageToImgbb = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const dataUrl = reader.result;
                    if (!dataUrl) return reject(new Error('Empty file read'));
                    const base64Only = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
                    const response = await fetch(`${API_BASE_URL}/upload-image`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: base64Only })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        resolve(result.imageUrl);
                    } else {
                        reject(new Error(result.error || 'Upload failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };
    const handleFlagImageUpload = async (flag, file) => {
        try {
            setUploadingFlag(flag._id);
            const imageUrl = await uploadImageToImgbb(file);
         
            const updatedFlag = { ...flag, image: imageUrl };
            const success = await saveFlag(updatedFlag);
         
            if (success) {
                alert('Изображение флага успешно обновлено!');
            } else {
                alert('Ошибка при сохранении флага');
            }
        } catch (error) {
            console.error('Error uploading flag image:', error);
            alert('Ошибка загрузки изображения: ' + error.message);
        } finally {
            setUploadingFlag(null);
        }
    };
    const initializeFlags = async () => {
        const defaultFlags = [
            { language: 'Русский', image: '🇷🇺' },
            { language: 'Английский', image: '🇺🇸' },
            { language: 'Турецкий', image: '🇹🇷' }
        ];
        for (const flag of defaultFlags) {
            await saveFlag(flag);
        }
        alert('Стандартные флаги инициализированы!');
    };
    const loadLessons = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/lessons`);
            if (response.ok) {
                const lessonsData = await response.json();
                setLessons(lessonsData);
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
        }
    };
    const deleteLesson = async (lessonId, lessonTitle) => {
        if (!confirm(`Вы уверены, что хотите удалить урок "${lessonTitle}"?`)) return;
     
        try {
            const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
                method: 'DELETE'
            });
         
            if (response.ok) {
                await loadLessons();
                alert('Урок удален успешно!');
            } else {
                throw new Error('Failed to delete lesson');
            }
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Ошибка удаления урока: ' + error.message);
        }
    };
    
    const loadTests = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tests`);
            if (response.ok) {
                const testsData = await response.json();
                setTests(testsData);
            }
        } catch (error) {
            console.error('Error loading tests:', error);
        }
    };
    const deleteTest = async (testId, testTheme) => {
        if (!confirm(`Вы уверены, что хотите удалить тест "${testTheme}"?`)) return;
     
        try {
            const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
                method: 'DELETE'
            });
         
            if (response.ok) {
                await loadTests();
                alert('Тест удален успешно!');
            } else {
                throw new Error('Failed to delete test');
            }
        } catch (error) {
            console.error('Error deleting test:', error);
            alert('Ошибка удаления теста: ' + error.message);
        }
    };
const checkTranslationsForTheme = (theme, studiedLang, hintLang, database = 'nouns') => {
  // Используем переданную базу данных без изменения состояния
  const currentData = database === 'adjectives' ? adjectivesTableData : tableData;
  
  const words = getWordsForThemeFromData(theme, currentData, database);
  if (words.length === 0) {
    return { isValid: false, missingWords: [], message: 'В теме нет слов в выбранной базе данных' };
  }

  const missingWords = [];
  let hasAllTranslations = true;

  words.forEach((word, index) => {
    const hasStudiedTranslation = word.translations[studiedLang?.toLowerCase()];
    const hasHintTranslation = word.translations[hintLang?.toLowerCase()];
 
    if (!hasStudiedTranslation || !hasHintTranslation) {
      hasAllTranslations = false;
      missingWords.push({
        word: word.imageBase,
        missingStudied: !hasStudiedTranslation,
        missingHint: !hasHintTranslation,
      });
    }
  });

  return {
    isValid: hasAllTranslations,
    missingWords,
    message: hasAllTranslations ? 'Все переводы присутствуют' : 'Отсутствуют переводы для некоторых слов'
  };
};

// Новая функция для получения слов из конкретных данных
const getWordsForThemeFromData = (theme, data, database) => {
  const words = [];
  let currentTheme = null;
  let collectingWords = false;
  
  // Для прилагательных используем мужской род как основной источник
  const wordPrefix = database === 'nouns' 
    ? 'База существительные слова' 
    : 'База прилагательные мужской род';

  data.forEach((row, index) => {
    if (row['Урок название'] && row['Урок название'] === theme) {
      currentTheme = theme;
      collectingWords = true;
      return;
    }
 
    if (row['Урок название'] && row['Урок название'] !== theme) {
      currentTheme = null;
      collectingWords = false;
      return;
    }
 
    if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
      const translations = {};
     
      Object.keys(row).forEach(col => {
        if (col.includes(wordPrefix)) {
          const language = col.split(' ').pop().toLowerCase();
          const translation = row[col] || '';
          if (translation.trim() !== '') {
            translations[language] = translation;
          }
        }
      });
     
      const wordObj = {
        imageBase: row['База изображение'],
        imagePng: row['Картинка png'] || '',
        translations: translations
      };
     
      words.push(wordObj);
    }
  });

  return words;
};
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };
    const handleOptimizedImageUploadToUrl = async (file, type, callback) => {
  setUploadingImage(true);
  setUploadingImageType(type);

  try {
    let processedFile = file;
    if (file.size > 300 * 1024) {
      processedFile = await compressImage(file, 800, 0.7);
    }

    const base64 = await fileToBase64(processedFile);
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      const matches = base64.match(/^data:.+\/(.+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      }
    }

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageBase64: base64Data,
        fileName: processedFile.name
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && callback) {
        callback(result.imageUrl);
      }
    }
  } catch (error) {
    console.error('Error uploading image:', error);
  } finally {
    setUploadingImage(false);
    setUploadingImageType(null);
  }
};
const handleImageUpload = async () => {
  if (!selectedFile || currentImageRow === null) return;
  
  try {
    setUploadingImage(true);
    
    // Сжимаем изображение
    let processedFile = selectedFile;
    if (selectedFile.size > 300 * 1024) {
      console.log('Сжимаем изображение...');
      processedFile = await compressImage(selectedFile, 800, 0.7);
    }
    
    // Загружаем на сервер
    const imageUrl = await uploadImageToImgbb(processedFile);
    
    // Получаем текущие данные
    const currentData = getActiveTableData();
    const newTableData = [...currentData];
    
    // Определяем правильное имя колонки для картинки
    let imageColumnName = 'Картинка'; // по умолчанию
    if (activeTable === 'nouns' || activeTable === 'adverbs' || activeTable === 'verbs' || activeTable === 'gerunds' || activeTable === 'adjectives' || activeTable === 'participles') {
      imageColumnName = 'Картинка png';
    }
   
    
    console.log('📸 Сохраняем картинку в колонку:', imageColumnName);
    
    // Копируем строку
    const updatedRow = { ...newTableData[currentImageRow] };
    
    // ВАЖНО: если нужной колонки нет в строке, мы её создадим.
    // Но чтобы не плодить новые колонки, мы должны убедиться, что такая колонка есть во ВСЕХ строках таблицы.
    // Для этого сначала проверим, есть ли эта колонка в структуре (по первой строке).
    if (currentData.length > 0) {
      const firstRow = currentData[0];
      if (!firstRow.hasOwnProperty(imageColumnName)) {
        // Если в первой строке нет такой колонки, значит её вообще нет в таблице.
        // Добавляем эту колонку во все строки, чтобы сохранить единообразие.
        console.log(`⚠️ Колонка "${imageColumnName}" отсутствует в таблице. Добавляем её во все строки.`);
        for (let i = 0; i < newTableData.length; i++) {
          if (!newTableData[i].hasOwnProperty(imageColumnName)) {
            newTableData[i][imageColumnName] = '';
          }
        }
        // После этого обновляем ссылку на updatedRow, так как newTableData изменилась
        updatedRow[imageColumnName] = imageUrl;
      } else {
        // Колонка уже есть, просто присваиваем
        updatedRow[imageColumnName] = imageUrl;
        newTableData[currentImageRow] = updatedRow;
      }
    } else {
      // Таблица пуста – просто создаём строку с нужной колонкой
      updatedRow[imageColumnName] = imageUrl;
      newTableData[currentImageRow] = updatedRow;
    }
    
    // Сохраняем
    setActiveTableData(newTableData);
    await saveActiveTable(newTableData);
    
    // Сброс
    setShowImageUploadModal(false);
    setSelectedFile(null);
    setImagePreview(null);
    setCurrentImageRow(null);
    setUploadingImageType(null);
    
    alert('✅ Изображение успешно загружено!');
    
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    alert('❌ Ошибка загрузки изображения: ' + (error.message || error));
  } finally {
    setUploadingImage(false);
  }
};
const openImageUploadModal = (rowIndex) => {
  setCurrentImageRow(rowIndex);
  
  let imageColumnName = 'Картинка';
  if (activeTable === 'nouns' || activeTable === 'adverbs' || activeTable === 'nouns' ||  activeTable === 'gerunds' || activeTable === 'adjectives' || activeTable === 'participles') {
    imageColumnName = 'Картинка png';
  }
 
  
  console.log(`🖼️ Открытие загрузки для ${activeTable}, колонка: ${imageColumnName}`);
  setUploadingImageType(imageColumnName);
  setShowImageUploadModal(true);
};
    const getAvailableLevels = () => {
        const currentData = getActiveTableData();
        const levels = new Set();
        currentData.forEach(row => {
            const v = row['Уровень изучения номер'];
            if (v && String(v).trim()) levels.add(v);
        });
        return Array.from(levels).sort();
    };
const getAvailableThemes = () => {
  const nounsThemes = new Set();
  tableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) nounsThemes.add(v);
  });

  const adjThemes = new Set();
  adjectivesTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) adjThemes.add(v);
  });

  const verbsThemes = new Set();
  verbsTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) verbsThemes.add(v);
  });

  const gerundsThemes = new Set();
  gerundsTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) gerundsThemes.add(v);
  });

  const participlesThemes = new Set();
  participlesTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) participlesThemes.add(v);
  });

  // ДОБАВЛЯЕМ темы из наречий
  const adverbsThemes = new Set();
  adverbsTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) adverbsThemes.add(v);
  });

  const allThemes = new Set([
    ...nounsThemes, 
    ...adjThemes, 
    ...verbsThemes,
    ...gerundsThemes,
    ...participlesThemes,
    ...adverbsThemes  // ← ДОБАВЛЕНО
  ]);
  
  return Array.from(allThemes).sort();
};
const isLessonFormValid = () => {
  if (
    !newLesson.studiedLanguage ||
    !newLesson.hintLanguage ||
    !newLesson.level ||
    !(newLesson.theme || '').trim() ||
    newLesson.studiedLanguage === newLesson.hintLanguage
  ) {
    return false;
  }

  // Если тема уже существует в таблицах — проверяем переводы
  const existingThemes = getAvailableThemes();
  if (existingThemes.includes(newLesson.theme)) {
    const check = checkTranslationsForTheme(
      newLesson.theme,
      newLesson.studiedLanguage.charAt(0).toUpperCase() + newLesson.studiedLanguage.slice(1),
      newLesson.hintLanguage.charAt(0).toUpperCase() + newLesson.hintLanguage.slice(1),
      newLesson.checkDatabase || activeTable
    );
    return check.isValid;
  }

  // Произвольная новая тема — разрешаем создание без слов
  return true;
};

 const createLesson = async () => {
  if (!isLessonFormValid()) {
    const { missingWords, message } = checkTranslationsForTheme(
      newLesson.theme,
      newLesson.studiedLanguage?.charAt(0).toUpperCase() + newLesson.studiedLanguage?.slice(1),
      newLesson.hintLanguage?.charAt(0).toUpperCase() + newLesson.hintLanguage?.slice(1),
      newLesson.checkDatabase || activeTable
    );
    if (missingWords.length > 0) {
      const missingDetails = missingWords.map(w =>
        `Слово "${w.word}": ${w.missingStudied ? `отсутствует перевод для ${newLesson.studiedLanguage}` : ''}${w.missingStudied && w.missingHint ? ', ' : ''}${w.missingHint ? `отсутствует перевод для ${newLesson.hintLanguage}` : ''}`
      ).join('\n');
      alert(`Нельзя создать урок:\n${message}\n\nДетали:\n${missingDetails}`);
      return;
    }
    alert('Заполните все поля корректно');
    return;
  }

  try {
    const currentData = getActiveTableData();
    let lessonNumber = '';
    let themeExistsInTable = false;
    
    console.log('Creating lesson with data:', newLesson); // ИСПРАВЛЕНО: используем newLesson вместо lessonData

    // Для вопросительных слов используем другую логику
    if (activeTable === 'question-words') {
      // Генерируем номер для вопросительных слов
      lessonNumber = generateNewLessonNumber();
    } else {
      // Старая логика для существительных и прилагательных
      for (const row of currentData) {
        if (row['Урок название'] === newLesson.theme) {
          lessonNumber = row['Урок номер'];
          themeExistsInTable = true;
          break;
        }
      }

      if (!themeExistsInTable) {
        lessonNumber = generateNewLessonNumber();
        const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [...baseColumns];
        const newRow = {};
        columns.forEach(col => { newRow[col] = ''; });
        newRow['Уровень изучения номер'] = newLesson.level;
        newRow['Урок номер'] = lessonNumber;
        newRow['Урок название'] = newLesson.theme;

        const newTableData = [...currentData, newRow];
        setActiveTableData(newTableData);
        await saveActiveTable(newTableData);
      }
    }

    // Собираем данные для урока - ИСПРАВЛЕНО: переименовали переменную
  const lessonPayload = {
  title: newLesson.theme,
  level: newLesson.level,
  theme: newLesson.theme,
  studiedLanguage: newLesson.studiedLanguage.toLowerCase(),
  hintLanguage: newLesson.hintLanguage.toLowerCase(),
  fontColor: newLesson.fontColor,
  bgColor: newLesson.bgColor,
  lessonNumber: lessonNumber,
  words: getWordsForTheme(newLesson.theme), // вернёт [] для новой темы — ОК
  lessonType: newLesson.lessonType || 1
};

    // Добавляем конфигурацию для типа урока 3 (предложения)
    if (newLesson.lessonType === 3) {
      lessonPayload.config = {
        columnsCount: newLesson.columnsCount || 2,
        columnConfigs: newLesson.columnConfigs || [
          { database: 'nouns', filters: {} }, 
          { database: 'nouns', filters: {} }
        ]
      };
    }

    console.log('Creating lesson with payload:', lessonPayload);

    // Вызов API для сохранения урока
    const response = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonPayload)
    });

    if (response.ok) {
      const savedLesson = await response.json();
      
      // Закрываем модальное окно и сбрасываем форму
      setShowCreateLessonModal(false);
      setNewLesson({
        studiedLanguage: 'русский',
        hintLanguage: 'турецкий',
        level: 'A1',
        theme: '',
        lessonType: 1,
        lessonNumber: '',
        fontColor: '#000000',
        bgColor: '#ffffff',
        columnsCount: 2,
        columnConfigs: [{ database: 'nouns', filters: {} }, { database: 'nouns', filters: {} }],
        checkDatabase: 'nouns'
      });
      
      // Обновляем список уроков
      await loadLessons();
      
      alert(`Урок "${newLesson.theme}" создан успешно!`);
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create lesson');
    }

  } catch (error) {
    console.error('Error creating lesson:', error);
    alert('Ошибка создания урока: ' + error.message);
  }
};
const isLessonHeader = (row) => {
  // Для всех типов таблиц проверяем наличие полей урока
  return row && 
         row['Уровень изучения номер'] && 
         row['Уровень изучения номер'].trim() !== '' &&
         row['Урок номер'] && 
         row['Урок номер'].trim() !== '' &&
         row['Урок название'] && 
         row['Урок название'].trim() !== '';
};

const getMaxLessonNumber = () => {
  const currentData = getActiveTableData();
  let maxLessonNumber = 0;
  currentData.forEach(row => {
    if (isLessonHeader(row) && row['Урок номер']) {
      // ожидаем формат типа "1.1" или "2.3" — берём первую пару как число
      const raw = String(row['Урок номер']).replace(',', '.').trim();
      // парсим только первую часть с одной точкой: например "1.1" -> 1.1, "1.1.2" -> 1.1
      const parts = raw.split('.');
      if (parts.length >= 2) {
        // возьмём первые две части: major.minor
        const major = parts[0];
        const minor = parts[1];
        const combined = parseFloat(`${major}.${minor}`);
        if (!isNaN(combined) && combined > maxLessonNumber) maxLessonNumber = combined;
      } else {
        const num = parseFloat(raw) || 0;
        if (num > maxLessonNumber) maxLessonNumber = num;
      }
    }
  });
  return maxLessonNumber;
};
const getNounCases = async (imageBase) => {
  try {
    const response = await fetch(`${API_BASE_URL}/noun-cases/${imageBase}`);
    return await response.json();
  } catch (error) {
    return { singular: {}, plural: {} };
  }
};
const generateNewLessonNumber = () => {
  const max = getMaxLessonNumber();
  // +0.1 и оставляем одну цифру после запятой (строка)
  return (max + 0.1).toFixed(1);
};
const getAddedLanguages = () => {
  const currentData = getActiveTableData();
  if (currentData.length === 0) return [];
  
  // Для причастий
  if (activeTable === 'participles') {
    const languages = new Set();
    Object.keys(currentData[0] || {}).forEach(col => {
      // Исключаем служебные колонки и колонки с аудио
      if (col.includes('База причастия базовая форма') && !col.startsWith('Аудио')) {
        const parts = col.split(' ');
        const language = parts[parts.length - 1];
        if (language && language.trim() !== '') {
          languages.add(language);
        }
      }
    });
    return Array.from(languages).sort();
  }
  
  // Для прилагательных
  if (activeTable === 'adjectives') {
    const languages = new Set();
    Object.keys(currentData[0] || {}).forEach(col => {
      // Исключаем служебные колонки и колонки с аудио
      if ((col.includes('База прилагательные базовая форма') || col.includes('База прилагательные слова')) && !col.startsWith('Аудио')) {
        const lang = col.split(' ').pop();
        languages.add(lang);
      }
    });
    return Array.from(languages).sort();
  }
  
  // Для существительных
  if (activeTable === 'nouns') {
    const languages = new Set();
    const prefix = 'База существительные номер';
    Object.keys(currentData[0] || {}).forEach(col => {
      if (col.includes(prefix) && !col.startsWith('Аудио')) {
        const lang = col.split(' ').pop();
        languages.add(lang);
      }
    });
    return Array.from(languages);
  }
  
  // Для глаголов
  if (activeTable === 'verbs') {
    const languages = new Set();
    const excludeColumns = ['Картинка', 'Картинка png', 'База изображение', 'Уровень изучения номер', 'Урок номер', 'Урок название', 'Инфинитив'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      // Исключаем служебные колонки и колонки с аудио
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для деепричастий
  if (activeTable === 'gerunds') {
    const languages = new Set();
    const excludeColumns = ['Картинка', 'Картинка png', 'База изображение', 'Уровень изучения номер', 'Урок номер', 'Урок название'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для наречий
  if (activeTable === 'adverbs') {
    const languages = new Set();
    const excludeColumns = ['Картинка', 'Картинка png', 'База изображение', 'Уровень изучения номер', 'Урок номер', 'Урок название'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для вопросительных слов
  if (activeTable === 'question-words') {
    const languages = new Set();
    const excludeColumns = ['Картинка', 'База изображение'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для предлогов
  if (activeTable === 'prepositions') {
    const languages = new Set();
    const excludeColumns = ['Картинка', 'База изображение'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для числительных
  if (activeTable === 'numerals') {
    const languages = new Set();
    const excludeColumns = ['Картинка', 'База изображение'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для местоимений
  if (activeTable === 'pronouns') {
    const languages = new Set();
    const excludeColumns = ['База изображение', 'Картинка'];
    
    Object.keys(currentData[0] || {}).forEach(col => {
      if (!excludeColumns.includes(col) && !col.startsWith('Аудио') && !col.includes('Аудио')) {
        languages.add(col);
      }
    });
    
    return Array.from(languages).sort();
  }
  
  // Для остальных таблиц (fallback)
  const languages = new Set();
  Object.keys(currentData[0]).forEach(col => {
    if (col !== 'Картинка' && col !== 'База изображение' && col !== 'Картинка png' && !col.startsWith('Аудио') && !col.includes('Аудио')) {
      languages.add(col);
    }
  });
  return Array.from(languages).sort();
};
const getAvailableLanguages = () => {
  const added = getAddedLanguages();
  
  // Базовый список всех доступных языков
  const allLanguagesList = [
    'Русский', 'Английский', 'Турецкий', 'Испанский', 'Немецкий', 
    'Французский', 'Итальянский', 'Китайский', 'Японский', 'Корейский',
    'Арабский', 'Хинди', 'Португальский', 'Голландский', 'Шведский',
    'Польский', 'Греческий', 'Иврит', 'Вьетнамский', 'Индонезийский'
  ];
  
  // Для простых таблиц
  if (activeTable === 'question-words' || 
      activeTable === 'prepositions' || 
      activeTable === 'gerunds' ||
      activeTable === 'adverbs') {
    
    return allLanguagesList
      .filter(lang => !added.includes(lang))
      .map(lang => [lang, { number: lang, word: lang }]);
  }
  
  // Для глаголов
  else if (activeTable === 'verbs') {
    return allLanguagesList
      .filter(lang => !added.includes(lang))
      .map(lang => [lang, { number: lang, word: lang }]);
  }
  
  // Для причастий
 // Для причастий
// В функции getAvailableLanguages, для причастий
// В функции getAvailableLanguages, для причастий
else if (activeTable === 'participles') {
  // Получаем уже добавленные языки
  const added = getAddedLanguages();
  
  // Базовый список всех доступных языков
  const allLanguagesList = [
    'Русский', 'Английский', 'Турецкий', 'Испанский', 'Немецкий', 
    'Французский', 'Итальянский', 'Китайский', 'Японский', 'Корейский',
    'Арабский', 'Хинди', 'Португальский', 'Голландский', 'Шведский',
    'Польский', 'Греческий', 'Иврит', 'Вьетнамский', 'Индонезийский'
  ];
  
  // Возвращаем только те языки, которых ещё нет в таблице
  return allLanguagesList
    .filter(lang => !added.includes(lang))
    .map(lang => [lang, { 
      number: `База причастия базовая форма ${lang}`,
      word: `База причастия базовая форма ${lang}`
    }]);
}
  
  // Для числительных
 else if (activeTable === 'numerals') {
  return allLanguagesList
    .filter(lang => !added.includes(lang))
    .map(lang => [lang, { number: lang, word: lang }]);
}
else if (activeTable === 'pronouns') {
  const added = getAddedLanguages();
  const allLanguagesList = [
    'Русский', 'Английский', 'Турецкий', 'Испанский', 'Немецкий', 
    'Французский', 'Итальянский', 'Китайский', 'Японский', 'Корейский',
    'Арабский', 'Хинди', 'Португальский', 'Голландский', 'Шведский',
    'Польский', 'Греческий', 'Иврит', 'Вьетнамский', 'Индонезийский'
  ];
  
  return allLanguagesList
    .filter(lang => !added.includes(lang))
    .map(lang => [lang, { number: lang, word: lang }]);
}
  
  // Для существительных и прилагательных
  else if (activeTable === 'nouns' || activeTable === 'adjectives') {
    const languagesConfig = activeTable === 'nouns' ? allLanguages : adjectivesAllLanguages;
    const available = Object.entries(languagesConfig).filter(([key, config]) =>
      !added.includes(config.number.split(' ').pop())
    );
    
    return available.map(([key, config]) => {
      const languageName = config.number.split(' ').pop();
      return [languageName, config];
    });
  }
  
  return [];
};
const addQuestion = async () => {
  try {
    console.log('=== НАЧАЛО СОХРАНЕНИЯ ВОПРОСА ===');
    
    // Проверка заполненности вопроса
    const isQuestionValid = newQuestion.questionStructure.every((data, index) => 
      data?.word && data.word.trim() !== ''
    );
    
    const isAnswerValid = newQuestion.requiresPairAnswer 
      ? newQuestion.answerStructure.every((data, index) => data?.word && data.word.trim() !== '')
      : true;

    if (!isQuestionValid || !isAnswerValid) {
      alert('Заполните все обязательные поля' + (newQuestion.requiresPairAnswer ? ' в вопросе и ответе' : ' в вопросе'));
      return;
    }

    const studiedLanguage = lessonData?.studiedLanguage || 'русский';
    const hintLanguage = lessonData?.hintLanguage || 'english';
    
    console.log('studiedLanguage (язык вопроса):', studiedLanguage);
    console.log('hintLanguage (язык подсказки):', hintLanguage);
    
    // --- Функция для получения правильной формы слова ---
    const getCorrectWordForm = (data) => {
      if (!data || !data.wordData) return data?.word || '';
      
      console.log('Getting word form for:', data.wordData);
      
      // ВАЖНО: Сначала проверяем displayWord (это уже применённая форма)
      if (data.wordData.displayWord) {
        console.log('✅ Using displayWord:', data.wordData.displayWord);
        return data.wordData.displayWord;
      }
      
      // Для глаголов - проверяем conjugation и выбранные фильтры
      if (data.database === 'verbs' && data.wordData.conjugation && data.tense) {
        console.log('Verb detected with conjugation, finding form');
        
        let verbForm = null;
        
        if (data.tense === 'present') {
          const personKey = data.person || 'он';
          verbForm = data.wordData.conjugation.present?.[personKey];
        } else if (data.tense === 'past') {
          if (data.person === 'я' || data.person === 'ты') {
            const genderKey = data.verbGender === 'feminine' ? 'ж' : 
                             data.verbGender === 'neuter' ? 'с' : 'м';
            const key = `${data.person}_${genderKey}`;
            verbForm = data.wordData.conjugation.past?.[key];
          } else {
            verbForm = data.wordData.conjugation.past?.[data.person || 'он'];
          }
        } else if (data.tense === 'future') {
          const personKey = data.person || 'он';
          verbForm = data.wordData.conjugation.future?.[personKey];
        } else if (data.tense === 'imperative') {
          const imperativeKey = data.imperativeForm || 'ты';
          verbForm = data.wordData.conjugation.imperative?.[imperativeKey];
        }
        
        if (verbForm) {
          console.log('✅ Using verb conjugation form:', verbForm);
          return verbForm;
        }
      }
      
      // Для прилагательных с падежами
      if (data.database === 'adjectives' && data.case && data.wordData.cases) {
        if (data.wordData.displayWord) {
          return data.wordData.displayWord;
        }
      }
      
      // Для существительных с падежами
      if (data.database === 'nouns' && data.case && data.wordData.cases) {
        if (data.wordData.displayWord) {
          return data.wordData.displayWord;
        }
      }
      
      // Для местоимений с падежами
      if (data.database === 'pronouns' && data.wordData.displayWord) {
        return data.wordData.displayWord;
      }
      
      // Для числительных с падежами
      if (data.database === 'numerals' && data.wordData.displayWord) {
        return data.wordData.displayWord;
      }
      
      // Для причастий с падежами
      if (data.database === 'participles' && data.wordData.displayWord) {
        console.log('✅ Using participle displayWord:', data.wordData.displayWord);
        return data.wordData.displayWord;
      }
      
      // Для причастий - проверяем translations
      if (data.database === 'participles' && data.wordData.translations) {
        console.log('Checking participle translations:', data.wordData.translations);
        
        const possibleKeys = [
          studiedLanguage,
          studiedLanguage.toLowerCase(),
          studiedLanguage.charAt(0).toUpperCase() + studiedLanguage.slice(1),
          studiedLanguage === 'русский' ? 'russian' : 
          studiedLanguage === 'russian' ? 'русский' :
          studiedLanguage === 'английский' ? 'english' :
          studiedLanguage === 'english' ? 'английский' :
          studiedLanguage === 'турецкий' ? 'turkish' :
          studiedLanguage === 'turkish' ? 'турецкий' : studiedLanguage,
          'russian', 'english', 'turkish',
          'Русский', 'Английский', 'Турецкий'
        ];
        
        for (const key of possibleKeys) {
          if (data.wordData.translations[key]) {
            console.log(`Found participle translation for key "${key}":`, data.wordData.translations[key]);
            return data.wordData.translations[key];
          }
        }
      }
      
      // Fallback на translations или word
      if (data.wordData.translations) {
        const possibleKeys = [
          studiedLanguage,
          studiedLanguage.toLowerCase(),
          studiedLanguage.charAt(0).toUpperCase() + studiedLanguage.slice(1),
          studiedLanguage === 'русский' ? 'russian' : 
          studiedLanguage === 'russian' ? 'русский' :
          studiedLanguage === 'английский' ? 'english' :
          studiedLanguage === 'english' ? 'английский' :
          studiedLanguage === 'турецкий' ? 'turkish' :
          studiedLanguage === 'turkish' ? 'турецкий' : studiedLanguage,
          'english', 'English', 'английский', 'Английский'
        ];
        
        for (const key of possibleKeys) {
          if (data.wordData.translations[key]) {
            console.log(`Found translation for key "${key}":`, data.wordData.translations[key]);
            return data.wordData.translations[key];
          }
        }
      }
      
      return data.word || '';
    };
    
    // НОРМАЛИЗАЦИЯ ВОПРОСА
    const normalizedQuestionStructure = newQuestion.questionStructure.map((data, index) => {
      const wordForStudiedLanguage = getCorrectWordForm(data);
      
      let normalizedWord = wordForStudiedLanguage;
      if (index === 0) {
        normalizedWord = wordForStudiedLanguage.charAt(0).toUpperCase() + wordForStudiedLanguage.slice(1);
      } else {
        normalizedWord = wordForStudiedLanguage.toLowerCase();
      }
      
      return {
        word: normalizedWord,
        wordData: {
          ...data.wordData,
          translations: data.wordData?.translations || {},
          savedForm: wordForStudiedLanguage
        },
        database: data.database || '',
        lesson: data.lesson || '',
        number: data.number || '',
        gender: data.gender || '',
        case: data.case || '',
        tense: data.tense || '',
        person: data.person || '',
        verbGender: data.verbGender || '',
        imperativeForm: data.imperativeForm || ''
      };
    });

    // НОРМАЛИЗАЦИЯ ОТВЕТА
    const normalizedAnswerStructure = newQuestion.requiresPairAnswer 
      ? newQuestion.answerStructure.map((data, index) => {
          const wordForStudiedLanguage = getCorrectWordForm(data);
          
          let normalizedWord = wordForStudiedLanguage;
          if (index === 0) {
            normalizedWord = wordForStudiedLanguage.charAt(0).toUpperCase() + wordForStudiedLanguage.slice(1);
          }
          
          return {
            word: normalizedWord,
            wordData: {
              ...data.wordData,
              translations: data.wordData?.translations || {},
              savedForm: wordForStudiedLanguage
            },
            database: data.database || '',
            lesson: data.lesson || '',
            number: data.number || '',
            gender: data.gender || '',
            case: data.case || '',
            tense: data.tense || '',
            person: data.person || '',
            verbGender: data.verbGender || '',
            imperativeForm: data.imperativeForm || ''
          };
        })
      : [];

    // ★★★ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ★★★
    // Используем РУЧНОЙ перевод, если он есть
    // Если ручной перевод пустой, генерируем автоматический
    let finalQuestionTranslation = newQuestion.englishQuestion;
    let finalAnswerTranslation = newQuestion.englishAnswer;
    
    // Если ручной перевод вопроса пустой, генерируем автоматический
    if (!finalQuestionTranslation || finalQuestionTranslation.trim() === '') {
      finalQuestionTranslation = generateAutoTranslation(normalizedQuestionStructure, hintLanguage, true);
      console.log('Generated auto question translation:', finalQuestionTranslation);
    } else {
      console.log('Using manual question translation:', finalQuestionTranslation);
    }
    
    // Если ручной перевод ответа пустой, генерируем автоматический (только если требуется ответ)
    if (newQuestion.requiresPairAnswer) {
      if (!finalAnswerTranslation || finalAnswerTranslation.trim() === '') {
        finalAnswerTranslation = generateAutoTranslation(normalizedAnswerStructure, hintLanguage, false);
        console.log('Generated auto answer translation:', finalAnswerTranslation);
      } else {
        console.log('Using manual answer translation:', finalAnswerTranslation);
      }
    }

    console.log('Вопрос (на изучаемом языке):', normalizedQuestionStructure.map(item => item.word).join(' '));
    console.log('Перевод вопроса (на языке подсказки):', finalQuestionTranslation);
    console.log('Ответ (на изучаемом языке):', normalizedAnswerStructure.map(item => item.word).join(' '));
    console.log('Перевод ответа (на языке подсказки):', finalAnswerTranslation);

    const questionData = {
      moduleId: currentLessonForModule._id,
      questionStructure: normalizedQuestionStructure,
      answerStructure: normalizedAnswerStructure,
      questionImage: newQuestion.questionImage,
      answerImage: newQuestion.answerImage,
      hint: newQuestion.hint,
      requiresPairAnswer: newQuestion.requiresPairAnswer !== false,
      hintQuestion: finalQuestionTranslation,
      hintAnswer: finalAnswerTranslation,
      englishQuestion: finalQuestionTranslation,
      englishAnswer: finalAnswerTranslation,
      translationLanguage: hintLanguage
    };

    console.log('Сохраняем вопрос с переводами:', {
      manualQuestion: newQuestion.englishQuestion,
      manualAnswer: newQuestion.englishAnswer,
      finalQuestion: finalQuestionTranslation,
      finalAnswer: finalAnswerTranslation
    });

    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });

    if (response.ok) {
      const savedQuestion = await response.json();
      console.log('✅ Вопрос сохранен успешно:', savedQuestion);
      
      await loadModuleQuestions(currentLessonForModule._id);
      alert('Вопрос добавлен успешно!');
      
      saveQuestionSettings();
      resetQuestionFormWithSettings();
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to save question');
    }
  } catch (error) {
    console.error('❌ Ошибка сохранения вопроса:', error);
    alert('Ошибка сохранения вопроса: ' + error.message);
  }
};
   const addWordToLesson = async (lessonRowIndex) => {
  const currentData = getActiveTableData();
  const lessonRow = currentData[lessonRowIndex];
  const lessonNumber = lessonRow['Урок номер'] || '0.0';
  
  // Считаем сколько уже слов в этом уроке
  let wordCount = 0;
  for (let i = lessonRowIndex + 1; i < currentData.length; i++) {
    const r = currentData[i];
    // Если встретили новый заголовок урока - останавливаемся
    if (r['Урок номер'] && r['Урок название']) break;
    // Если это слово с imageBase - увеличиваем счетчик
    if (r['База изображение'] && r['База изображение'].trim() !== '') wordCount++;
  }
  
  const wordNumber = wordCount + 1;
  const imageBase = `${lessonNumber}.${wordNumber}`;
  
  // Создаем новую строку слова
  const wordValues = { 'База изображение': imageBase };
  
  // Для существительных
  if (activeTable === 'nouns') {
    const addedLangs = getAddedLanguages();
    
    addedLangs.forEach(lang => {
      const languageNumber = getLanguageNumber(lang);
      wordValues[`База существительные номер ${lang}`] = `${imageBase}.${languageNumber}`;
      wordValues[`База существительные слова ${lang}`] = '';
      wordValues[`База существительные множественное ${lang}`] = '';
    });
  } 
  // Для прилагательных (НОВАЯ СТРУКТУРА)
  else if (activeTable === 'adjectives') {
    const addedLangs = getAddedLanguages();
    
    addedLangs.forEach(lang => {
      // В новой структуре только базовая форма
      wordValues[`База прилагательные базовая форма ${lang}`] = '';
    });
    
    // Сразу открываем модальное окно для ввода падежей для русского языка
   // Сразу открываем модальное окно для ввода падежей для русского языка
// if (addedLangs.includes('Русский')) {
//   setTimeout(async () => {
//     // Очищаем "призрачные" падежи на бэкенде (на случай переиспользования imageBase)
//     try {
//       if (activeTable === 'adjectives') {
//         await fetch(`${API_BASE_URL}/adjective-cases/${imageBase}`, { method: 'DELETE' });
//         console.log(`🧹 Очищены призрачные падежи прилагательного: ${imageBase}`);
//       } else if (activeTable === 'participles') {
//         await fetch(`${API_BASE_URL}/participle-cases/${imageBase}`, { method: 'DELETE' });
//         console.log(`🧹 Очищены призрачные падежи причастия: ${imageBase}`);
//       }
//     } catch (error) {
//       console.error('Ошибка очистки падежей:', error);
//     }
    
//     setSelectedAdjective({
//       imageBase: imageBase,
//       translations: { russian: '' },
//       word: 'Новое прилагательное'
//     });
//     setShowAdjectiveCaseModal(true);
//   }, 500);
// }
  }
  // В функции addWordToLesson, после секции для прилагательных, добавь:
// В функции addWordToLesson, после секции для прилагательных, добавь:
else if (activeTable === 'verbs') {
  const currentData = getActiveTableData(); // ← Убедись, что это есть
  const lessonRow = currentData[lessonRowIndex];
  const lessonNumber = lessonRow['Урок номер'] || '0.0';
  
  // Считаем сколько уже слов в этом уроке
  let wordCount = 0;
  for (let i = lessonRowIndex + 1; i < currentData.length; i++) {
    const r = currentData[i];
    if (r['Урок номер'] && r['Урок название']) break;
    if (r['База изображение'] && r['База изображение'].trim() !== '') wordCount++;
  }
  
  const wordNumber = wordCount + 1;
  const imageBase = `${lessonNumber}.${wordNumber}`;
  
  // Получаем все колонки из первой строки таблицы
  const columns = Object.keys(currentData[0] || {});
  
  // Создаем новую строку
  const newWordRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newWordRow[col] = imageBase;
    } else {
      newWordRow[col] = '';
    }
  });
  
  // Вставляем строку после заголовка урока
  const newTableData = [...currentData];
  
  let insertIndex = lessonRowIndex + 1;
  while (insertIndex < newTableData.length && 
         !newTableData[insertIndex]['Урок номер'] && 
         !newTableData[insertIndex]['Урок название']) {
    insertIndex++;
  }
  
  newTableData.splice(insertIndex, 0, newWordRow);
  setActiveTableData(newTableData);
  setShowAddWordModal(false);
  setCurrentLesson(null);
  await saveActiveTable(newTableData);
  
  alert(`✅ Новый глагол добавлен с imageBase: ${imageBase}`);
}
// В функции addWordToLesson, добавьте секцию для причастий
else if (activeTable === 'participles') {
  const currentData = getActiveTableData();
  const lessonRow = currentData[lessonRowIndex];
  const lessonNumber = lessonRow['Урок номер'] || '0.0';
  
  // Считаем сколько уже слов в этом уроке
  let wordCount = 0;
  for (let i = lessonRowIndex + 1; i < currentData.length; i++) {
    const r = currentData[i];
    if (r['Урок номер'] && r['Урок название']) break;
    if (r['База изображение'] && r['База изображение'].trim() !== '') wordCount++;
  }
  
  const wordNumber = wordCount + 1;
  const imageBase = `${lessonNumber}.${wordNumber}`;
  
  // Получаем все колонки из первой строки таблицы
  const columns = Object.keys(currentData[0] || {});
  
  // Создаем новую строку
  const newWordRow = {};
  columns.forEach(col => {
    if (col === 'База изображение') {
      newWordRow[col] = imageBase;
    } else {
      newWordRow[col] = ''; // Пустые значения для остальных колонок
    }
  });
  
  // Вставляем строку после заголовка урока
  const newTableData = [...currentData];
  
  let insertIndex = lessonRowIndex + 1;
  while (insertIndex < newTableData.length && 
         !newTableData[insertIndex]['Урок номер'] && 
         !newTableData[insertIndex]['Урок название']) {
    insertIndex++;
  }
  
  newTableData.splice(insertIndex, 0, newWordRow);
  setActiveTableData(newTableData);
  setShowAddWordModal(false);
  setCurrentLesson(null);
  await saveActiveTable(newTableData);
  
  alert(`✅ Новое причастие добавлено с imageBase: ${imageBase}`);
  
  // // Сразу открываем модальное окно для ввода падежей
  // setTimeout(() => {
  //   setSelectedParticiple({
  //     imageBase: imageBase,
  //     translations: { 
  //       russian: '',
  //       english: '',
  //       turkish: ''
  //     },
  //     word: 'Новое причастие'
  //   });
  //   setShowParticipleCaseModal(true);
  // }, 500);
}
// В функции addWordToLesson, добавьте:
else if (activeTable === 'gerunds') {
  console.log('=== СОЗДАНИЕ НОВОГО УРОКА ДЕЕПРИЧАСТИЙ (С ЗАЩИТОЙ) ===');
  
  // ЗАЩИТА ОТ ДВОЙНОГО ВЫЗОВА - ИСПОЛЬЗУЕМ ТУ ЖЕ ЛОГИКУ, ЧТО И ДЛЯ ГЛАГОЛОВ
  if (window._addingGerundLesson) {
    console.log('⛔ Предотвращаем двойной вызов addNewLesson для деепричастий');
    return;
  }
  window._addingGerundLesson = true;
  
  try {
    const currentData = getActiveTableData();
    console.log('Текущие данные до создания:', currentData);
    
    // Если данных нет, создаем структуру с нуля
    let baseStructure = [];
    
    if (currentData.length === 0) {
      // Создаем базовую структуру если таблица пуста
      baseStructure = [{
        'Уровень изучения номер': newLesson.level || 'A1',
        'Урок номер': '1.1',
        'Урок название': 'Действия',
        'База изображение': '',
        'Картинка png': '',
        'Русский': '',
        'Английский': '',
        'Турецкий': ''
      }];
    }
    
    const maxLessonNumber = getMaxLessonNumber();
    const newLessonNumber = (maxLessonNumber + 0.1).toFixed(1);
    
    // Определяем колонки для деепричастий
    const baseColumns = [
      'Уровень изучения номер',
      'Урок номер',
      'Урок название',
      'База изображение',
      'Картинка png'
    ];
    
    // Получаем все добавленные языки
    const addedLangs = getAddedLanguages();
    console.log('Добавленные языки:', addedLangs);
    
    // Создаем колонки для языков
    const languageColumns = addedLangs.length > 0 ? addedLangs : ['Русский', 'Английский', 'Турецкий'];
    
    const columns = [...baseColumns, ...languageColumns];
    console.log('Все колонки:', columns);
    
    // Создаем новую строку урока
    const newLessonRow = {};
    columns.forEach(col => {
      if (col === 'Уровень изучения номер') {
        newLessonRow[col] = newLesson.level || 'A1';
      } else if (col === 'Урок номер') {
        newLessonRow[col] = newLessonNumber;
      } else if (col === 'Урок название') {
        newLessonRow[col] = `Новый урок ${newLessonNumber}`;
      } else {
        newLessonRow[col] = ''; // Пусто для остальных колонок
      }
    });
    
    console.log('Новая строка урока:', newLessonRow);
    
    // Если currentData пуст, используем baseStructure
    const dataToUse = currentData.length === 0 ? baseStructure : currentData;
    const newTableData = [...dataToUse, newLessonRow];
    
    console.log('Новые данные для сохранения:', newTableData);
    
    // Обновляем состояние
    setActiveTableData(newTableData);
    
    // Сохраняем в базу и ЖДЕМ завершения
    await saveActiveTable(newTableData);
    console.log('Сохранение успешно');
    
    alert(`✅ Новый урок "${newLessonRow['Урок название']}" создан!`);
    
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    alert('❌ Ошибка при создании урока: ' + error.message);
  } finally {
    // Сбрасываем флаг через небольшую задержку, чтобы гарантировать, 
    // что все асинхронные операции завершились
    setTimeout(() => {
      window._addingGerundLesson = false;
      console.log('🔓 Флаг _addingGerundLesson сброшен');
    }, 1000);
  }
}

  // Получаем все колонки из первой строки таблицы
  const columns = Object.keys(currentData[0] || {});
  
  // Создаем новую строку с правильными колонками
  const newWordRow = {};
  columns.forEach(col => {
    if (wordValues[col] !== undefined) {
      newWordRow[col] = wordValues[col];
    } else {
      newWordRow[col] = ''; // Заполняем пустыми значениями для остальных колонок
    }
  });

  // Вставляем строку после заголовка урока
  const newTableData = [...currentData];
  
  let insertIndex = lessonRowIndex + 1;
  while (insertIndex < newTableData.length && 
         !newTableData[insertIndex]['Урок номер'] && 
         !newTableData[insertIndex]['Урок название']) {
    insertIndex++;
  }
  
  newTableData.splice(insertIndex, 0, newWordRow);
  setActiveTableData(newTableData);
  setShowAddWordModal(false);
  setCurrentLesson(null);
  await saveActiveTable(newTableData);
  
  alert(`✅ Новое слово добавлено с imageBase: ${imageBase}`);
};
    const getLanguageNumber = (language) => {
  const languageNumbers = {
    'Русский': '1',
    'Английский': '2',
    'Турецкий': '3',
    'Испанский': '4',
    'Немецкий': '5',
    'Французский': '6',
    'Итальянский': '7',
    'Китайский': '8',
    'Японский': '9',
    'Корейский': '10',
    'Арабский': '11',
    'Хинди': '12',
    'Португальский': '13',
    'Голландский': '14',
    'Шведский': '15',
    'Польский': '16',
    'Греческий': '17',
    'Иврит': '18',
    'Вьетнамский': '19',
    'Индонезийский': '20'
  };
  
  if (languageNumbers[language]) {
    return languageNumbers[language];
  }
  
  const existingLanguages = getAddedLanguages();
  let maxNumber = 0;
  
  existingLanguages.forEach(lang => {
    const langNumber = parseInt(languageNumbers[lang] || '0');
    if (langNumber > maxNumber) maxNumber = langNumber;
  });
  
  return (maxNumber + 1).toString();
};
 const getWordsForTheme = (theme) => {
    const currentData = getActiveTableData();
    
    // Для вопросительных слов используем другую логику
    if (activeTable === 'question-words') {
        const words = [];
        let currentTheme = null;
        let collectingWords = false;
        
        currentData.forEach((row, index) => {
            if (row['Урок название'] && row['Урок название'] === theme) {
                currentTheme = theme;
                collectingWords = true;
                return;
            }
         
            if (row['Урок название'] && row['Урок название'] !== theme) {
                currentTheme = null;
                collectingWords = false;
                return;
            }
         
            if (collectingWords && row['Картинка'] && row['Картинка'].trim() !== '') {
                const translations = {};
             
                Object.keys(row).forEach(col => {
                    if (col.includes('Вопросительное слово')) {
                        const language = col.split(' ').pop().toLowerCase();
                        const translation = row[col] || '';
                        if (translation.trim() !== '') {
                            translations[language] = translation;
                        }
                    }
                });
             
                const wordObj = {
                    imageBase: row['Картинка'], // используем Картинка как ID
                    imagePng: row['Картинка'] || '',
                    translations: translations
                };
             
                words.push(wordObj);
            }
        });
     
        return words;
    } else {
        // Старая логика для существительных и прилагательных
        const words = [];
        let currentTheme = null;
        let collectingWords = false;
        
        const wordPrefix = activeTable === 'nouns' 
            ? 'База существительные слова' 
            : 'База прилагательные мужской род';

        currentData.forEach((row, index) => {
            if (row['Урок название'] && row['Урок название'] === theme) {
                currentTheme = theme;
                collectingWords = true;
                return;
            }
         
            if (row['Урок название'] && row['Урок название'] !== theme) {
                currentTheme = null;
                collectingWords = false;
                return;
            }
         
            if (collectingWords && row['База изображение'] && row['База изображение'].trim() !== '') {
                const translations = {};
             
                Object.keys(row).forEach(col => {
                    if (col.includes(wordPrefix)) {
                        const language = col.split(' ').pop().toLowerCase();
                        const translation = row[col] || '';
                        if (translation.trim() !== '') {
                            translations[language] = translation;
                        }
                    }
                });
             
                const wordObj = {
                    imageBase: row['База изображение'],
                    imagePng: row['Картинка png'] || '',
                    translations: translations
                };
             
                words.push(wordObj);
            }
        });
 
        return words;
    }
};
    const createTest = async () => {
        try {
            const selectedWordIds = selectedWords.map(word => word.imageBase || word.id);
            const testData = {
                lessonId: `table_${newLesson.theme}_${Date.now()}`,
                studiedLanguage: newLesson.studiedLanguage,
                hintLanguage: newLesson.hintLanguage,
                level: newLesson.level,
                theme: newLesson.theme,
                fontColor: newLesson.fontColor,
                bgColor: newLesson.bgColor,
                wordIds: selectedWordIds,
                words: selectedWords
            };
          
            const response = await fetch(`${API_BASE_URL}/tests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            if (!isTestFormValid()) {
                if (testTranslationCheck.missingWords.length > 0) {
                    const missingDetails = testTranslationCheck.missingWords.map(w =>
                        `Слово "${w.word}": ${w.missingStudied ? `отсутствует перевод для ${newLesson.studiedLanguage}` : ''}${w.missingStudied && w.missingHint ? ', ' : ''}${w.missingHint ? ` отсутствует перевод для ${newLesson.hintLanguage}` : ''}`
                    ).join('\n');
                    alert(`Нельзя создать тест:\n${testTranslationCheck.message}\n\nДетали:\n${missingDetails}`);
                } else {
                    alert('Заполните все поля корректно и выберите минимум 2 слова');
                }
                return;
            }
            if (response.ok) {
                setShowCreateTestModal(false);
                setNewLesson({
                    studiedLanguage: 'русский',
                    hintLanguage: 'турецкий',
                    level: 'A1',
                    theme: '',
                    fontColor: '#000000',
                    bgColor: '#ffffff'
                });
                setSelectedWords([]);
                alert(`Тест "${newLesson.theme}" создан успешно! Слов: ${selectedWords.length}`);
                loadTests();
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('Error creating test:', error);
            alert('Ошибка создания теста: ' + error.message);
        }
    };
    const refreshLessonModules = async (lessonId) => {
    console.log('Refreshing modules for lesson:', lessonId);
    await loadLessonModules(lessonId);
};
    const createTestFromLesson = async (lesson) => {
        if (lesson.words.length < 2) {
            alert('В уроке меньше 2 слов. Нельзя создать тест.');
            return;
        }
        try {
            const testData = {
                lessonId: lesson._id,
                studiedLanguage: lesson.studiedLanguage,
                hintLanguage: lesson.hintLanguage,
                level: lesson.level,
                theme: lesson.theme,
                fontColor: lesson.fontColor,
                bgColor: lesson.bgColor,
                wordIds: lesson.words.map(word => word.imageBase || word.id),
                words: lesson.words
            };
            const response = await fetch(`${API_BASE_URL}/tests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });
            if (response.ok) {
                alert(`Тест "${lesson.theme}" автогенерирован успешно! Слов: ${lesson.words.length}`);
                loadTests();
                loadLessons();
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('Error auto-generating test:', error);
            alert('Ошибка автогенерации теста: ' + error.message);
        }
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Загрузка данных...</div>
            </div>
        );
    }
    const availableLanguages = getAvailableLanguages();
    const addedLanguages = getAddedLanguages();
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Админка - Управление базой данных</h1>
                <div className="flex gap-2 flex-wrap">
                    {/* Кнопка переключения таблиц */}
                    <div className="flex bg-white rounded-lg border mr-4">
                        <button
                            onClick={() => setActiveTable('nouns')}
                            className={`px-4 py-2 rounded-l-lg ${
                                activeTable === 'nouns'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Существительные
                        </button>
                        <button
                            onClick={() => setActiveTable('adjectives')}
                            className={`px-4 py-2 rounded-r-lg ${
                                activeTable === 'adjectives'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            Прилагательные
                        </button>
                        
                        <button
    onClick={() => setActiveTable('question-words')}
    className={`px-4 py-2 rounded-r-lg ${
      activeTable === 'question-words'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    Вопросительные слова
  </button>
   <button
    onClick={() => setActiveTable('prepositions')}
    className={`px-4 py-2 rounded-r-lg ${
      activeTable === 'prepositions'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    Предлоги, частицы
  </button>
  <button
    onClick={() => setActiveTable('gerunds')}
    className={`px-4 py-2 rounded-r-lg ${
        activeTable === 'gerunds'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
    }`}
>
    Деепричастия
</button>
<button
    onClick={() => setActiveTable('verbs')}
    className={`px-4 py-2 rounded-r-lg ${
        activeTable === 'verbs'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
    }`}
>
    Глаголы
</button>
<button
  onClick={() => setActiveTable('adverbs')}
  className={`px-4 py-2 rounded-r-lg ${
    activeTable === 'adverbs'
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700'
  }`}
>
  Наречия
</button>
<button
  onClick={() => setActiveTable('participles')}  // ← ДОБАВЛЕНО
  className={`px-4 py-2 rounded-r-lg ${
    activeTable === 'participles'
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700'
  }`}
>
  Причастия
</button>
<button
  onClick={() => setActiveTable('numerals')}
  className={`px-4 py-2 rounded-r-lg ${
    activeTable === 'numerals'
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700'
  }`}
>
  Числительные
</button>
<button
  onClick={() => setActiveTable('pronouns')}
  className={`px-4 py-2 rounded-r-lg ${
    activeTable === 'pronouns'
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700'
  }`}
>
  Местоимения
</button>
                    </div>
                    {/* Кнопка синхронизации тем */}
                  {/* {activeTable === 'adjectives' && (
    <>
        <button
            onClick={syncThemesToAdjectives}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            title="Синхронизировать темы из таблицы существительных"
        >
            🔄 Синхронизировать темы
        </button>
  
    </>
)} */}
                    <button
                        onClick={() => setShowFlagsModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Управление флагами
                    </button>
                    <button
                        onClick={() => setShowLessonsModal(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                        Управление уроками
                    </button>
                    <button
                        onClick={() => setShowTestsModal(true)}
                        className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                    >
                        Управление тестами
                    </button>
                    <button onClick={()=>loadDataFromBackend(false)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Обновить</button>
                    <button onClick={() => setShowCreateLessonModal(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Создать урок</button>
                    <button onClick={() => setShowCreateTestModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Создать тест</button>
                    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2 inline-flex items-center gap-2"
      title="Открыть главную страницу в новой вкладке"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      На главную
    </a>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
                        title="Выйти из системы"
                    >
                        Выйти
                    </button>
                </div>
            </div>
     {/* Показываем секцию языков для всех таблиц кроме тех, где не нужно */}
{(activeTable === 'nouns' || activeTable === 'adjectives' || activeTable === 'participles' || activeTable === 'pronouns') && (
  <section className="mb-4 p-3 bg-white rounded-lg border">
    <h3 className="font-semibold mb-2">Добавленные языки:</h3>
    <div className="flex flex-wrap gap-2">
      {addedLanguages.map(lang => (
        <div key={lang} className="flex items-center gap-1">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{lang}</span>
          <button
            onClick={() => deleteLanguage(lang)}
            className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            title={`Удалить язык ${lang}`}
          >
            ×
          </button>
        </div>
      ))}
      {availableLanguages.length > 0 && (
        <button 
          onClick={() => setShowAddLanguageModal(true)} 
          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200"
        >
          + Добавить язык
        </button>
      )}
    </div>
    
    {/* Информация о структуре для разных типов таблиц */}
    {activeTable === 'participles' && addedLanguages.length > 0 && (
      <div className="mt-2 text-xs text-gray-500">
        <p>Для каждого языка создаются колонки: номер, мужской род, женский род, средний род, множественное число</p>
      </div>
    )}
  </section>
)}


{/* Для таблиц вопросительных слов и предлогов показываем упрощенную секцию */}
{(activeTable === 'question-words' || activeTable === 'prepositions' || activeTable === 'gerunds' || activeTable === 'verbs' || activeTable === 'adverbs' || activeTable === 'numerals') && (
  <section className="mb-4 p-3 bg-white rounded-lg border">
    <h3 className="font-semibold mb-2">Добавленные языки:</h3>
    <div className="flex flex-wrap gap-2">
      {addedLanguages.map(lang => (
        <div key={lang} className="flex items-center gap-1">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{lang}</span>
          <button
            onClick={() => deleteLanguage(lang)}
            className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            title={`Удалить язык ${lang}`}
          >
            ×
          </button>
        </div>
      ))}
      {availableLanguages.length > 0 && (
        <button onClick={() => setShowAddLanguageModal(true)} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200">+ Добавить язык</button>
      )}
    </div>
    
    {/* Информация о структуре для простых таблиц */}
    {activeTable === 'verbs' && addedLanguages.length > 0 && (
      <div className="mt-2 text-xs text-gray-500">
        <p>Для глаголов добавляется простая колонка перевода</p>
      </div>
    )}
    
    {activeTable === 'adverbs' && addedLanguages.length > 0 && (
      <div className="mt-2 text-xs text-gray-500">
        <p>Для наречий добавляется простая колонка перевода</p>
      </div>
    )}
    
    {activeTable === 'numerals' && addedLanguages.length > 0 && (
      <div className="mt-2 text-xs text-gray-500">
        <p>Для числительных добавляется простая колонка перевода</p>
      </div>
    )}
  </section>
)}
{/* Фильтры для таблиц существительных, прилагательных, глаголов */}
{(activeTable === 'nouns' || activeTable === 'adjectives' || activeTable === 'verbs') && (
  <div className="mb-4 flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border">
    {/* Поле поиска */}
    <div className="flex-1 min-w-[200px]">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="🔍 Поиск по словам... (введите первые буквы)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Поиск по русским, английским и турецким словам
      </p>
    </div>
    
    {/* Кнопка фильтра по букве */}
    <div className="relative">
      <button
        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
          selectedLetter 
            ? 'bg-blue-500 text-white border-blue-600' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        {selectedLetter ? `По букве: ${selectedLetter}` : 'Фильтр по алфавиту'}
        {selectedLetter && (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLetter('');
            }}
            className="ml-1 text-white hover:text-gray-200"
          >
            ✕
          </span>
        )}
      </button>
      
      {/* Выпадающий список букв */}
      {showFilterDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
          <div className="p-2 border-b bg-gray-50">
            <button
              onClick={() => {
                setSelectedLetter('');
                setShowFilterDropdown(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Сбросить фильтр
            </button>
          </div>
          <div className="p-2 grid grid-cols-7 gap-1">
            {/* Для русского языка */}
            <div className="col-span-7 text-xs text-gray-500 mb-1">Русский алфавит</div>
            {russianAlphabet.map(letter => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(letter);
                  setShowFilterDropdown(false);
                }}
                className={`px-2 py-1 text-center rounded hover:bg-blue-100 transition-colors ${
                  selectedLetter === letter ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {letter}
              </button>
            ))}
            
            <div className="col-span-7 text-xs text-gray-500 mt-2 mb-1">Латинский алфавит</div>
            {englishAlphabet.map(letter => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(letter);
                  setShowFilterDropdown(false);
                }}
                className={`px-2 py-1 text-center rounded hover:bg-blue-100 transition-colors ${
                  selectedLetter === letter ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    
    {/* Статистика фильтрации */}
  {(searchTerm || selectedLetter) && (
  <div className="text-sm text-gray-500">
    Найдено слов: {getActiveTableData().filter(row => {
      if (isLessonHeader(row)) return false;
      // та же логика что выше
    }).length}
  </div>
)}
  </div>
)}
            <section className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
               <div className="flex justify-between items-center mb-4">
   <h3 className="font-semibold">
  {activeTable === 'nouns' ? 'Таблица существительных' : 
   activeTable === 'adjectives' ? 'Таблица прилагательных' : 
   activeTable === 'question-words' ? 'Таблица вопросительных слов' :
   activeTable === 'prepositions' ? 'Таблица предлогов' :
   activeTable === 'gerunds' ? 'Таблица деепричастий' :
   activeTable === 'verbs' ? 'Таблица глаголов' :
   activeTable === 'adverbs' ? 'Таблица наречий' :  
   activeTable === 'participles' ? 'Таблица причастий': // ← ДОБАВЬТЕ
   'Таблица'
  }
</h3>
    <div className="flex gap-2 flex-wrap">
        {/* Показываем кнопку "Новый урок" только для существительных и прилагательных */}
        {activeTable !== 'question-words' && activeTable !== 'prepositions' && activeTable !== 'numerals' && activeTable !== 'pronouns' && (
            <button onClick={addNewLesson} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Новый урок</button>
        )}
        {/* {activeTable === 'gerunds' && (
    <button onClick={addNewGerund} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        + Добавить деепричастие
    </button>
)} */}
{activeTable === 'numerals' && (
  <>
    <button onClick={addNewNumeral} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
      + Добавить числительное
    </button>
  
  </>
)}
 {/* {activeTable === 'participles' && (  // ← ДОБАВЛЕНО
    <button onClick={addNewParticiple} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        + Добавить причастие
    </button>
)} */}
{/* {activeTable === 'verbs' && (
    <button onClick={addNewVerb} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        + Добавить глагол
    </button>
)} */}
{/* {activeTable === 'adverbs' && (
  <button onClick={addNewAdverb} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
    + Добавить наречие
  </button>
)} */}
{activeTable === 'pronouns' && (
  <button onClick={addNewPronoun} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
    + Добавить местоимение
  </button>
)}
        
        {/* Кнопка добавления языка для всех таблиц */}
       
        
        {/* Для вопросительных слов - кнопка добавления строки */}
        {activeTable === 'question-words' && (
            <button onClick={addNewQuestionWord} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Добавить слово</button>
        )}
        
        {/* Для предлогов - кнопка добавления строки */}
        {activeTable === 'prepositions' && (
            <button onClick={addNewPreposition} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Добавить предлог, частица</button>
        )}
    </div>
</div>
                <div className="overflow-auto border rounded-lg" style={{ maxHeight: '70vh' }}>
                    <div className="min-w-full inline-block">
                        <table className="min-w-full border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className="border p-2 bg-gray-100 sticky left-0 z-20 whitespace-nowrap">Действия</th>
                                    {getActiveTableData().length > 0 && Object.keys(getActiveTableData()[0]).map(key => (
<th 
    key={key} 
    className="border p-2 bg-gray-100 group relative"
    style={{
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        minWidth: '120px',
        maxWidth: '250px',
        verticalAlign: 'top'
    }}
>
    <div className="flex items-start justify-between gap-2">
      <span
  className="break-words flex-1"
  style={{ whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.3' }}
>
  {getTableHeaderDisplay(key, activeTable)}
</span>
        <button
            onClick={() => deleteColumn(key)}
            className="w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 flex-shrink-0 mt-0.5"
            title={`Удалить колонку ${key}`}
        >
            ×
        </button>
    </div>
</th>
                                    ))}

                                      {/* {activeTable === 'nouns' && (
      <th className="border p-2 bg-gray-100 whitespace-nowrap min-w-16">
        <div className="flex items-center justify-center">
          <span className="font-medium">Род</span>
        </div>
      </th>
    )} */}
    
  {activeTable === 'nouns' && (
      <th className="border p-2 bg-gray-100 text-center" colSpan="3">
        <div className="flex justify-center gap-4">
          <span className="w-6 text-center font-bold text-blue-600">М</span>
          <span className="w-6 text-center font-bold text-pink-600">Ж</span>
          <span className="w-6 text-center font-bold text-green-600">Ср</span>
        </div>
      </th>
    )}
                                </tr>
                            </thead>
                            <tbody>
                            
          {getActiveTableData().map((row, originalIndex) => {
  // Проверяем, должна ли строка отображаться
  const shouldShow = (() => {
    if (!searchTerm && !selectedLetter) return true;
    
    // Пропускаем заголовки уроков
    if (isLessonHeader(row)) return true;
    
    // Определяем колонки для поиска
    let searchColumns = [];
    if (activeTable === 'nouns') {
      searchColumns = ['База существительные слова Русский', 'База существительные слова Английский', 'База существительные слова Турецкий'];
    } else if (activeTable === 'adjectives') {
      searchColumns = ['База прилагательные базовая форма Русский', 'База прилагательные базовая форма Английский', 'База прилагательные базовая форма Турецкий'];
    } else if (activeTable === 'verbs') {
      searchColumns = ['Инфинитив', 'Английский', 'Турецкий'];
    } else {
      return true;
    }
    
    // Фильтр по первой букве
    if (selectedLetter) {
      let hasMatchingLetter = false;
      for (const col of searchColumns) {
        const value = row[col];
        if (value && String(value).trim() !== '') {
          const firstLetter = String(value).trim().charAt(0).toUpperCase();
          if (firstLetter === selectedLetter) {
            hasMatchingLetter = true;
            break;
          }
        }
      }
      if (!hasMatchingLetter) return false;
    }
    
    // Поиск по тексту
    if (searchTerm) {
      let hasMatch = false;
      for (const col of searchColumns) {
        const value = row[col];
        if (value && String(value).toLowerCase().includes(searchTerm.toLowerCase())) {
          hasMatch = true;
          break;
        }
      }
      return hasMatch;
    }
    
    return true;
  })();
  
  if (!shouldShow) return null;

                                    return(<tr key={originalIndex} className={isLessonHeader(row) ? 'bg-blue-50' : ''}>
                               <td className="border p-1 bg-white sticky left-0 z-10">
  <div className="flex flex-col gap-1 min-w-24">
    
    {/* ===== 1. СНАЧАЛА ПРОВЕРЯЕМ, ЭТО ЗАГОЛОВОК УРОКА ===== */}
    {/* ===== 1. СНАЧАЛА ПРОВЕРЯЕМ, ЭТО ЗАГОЛОВОК УРОКА ===== */}
{isLessonHeader(row) && (
  <div className="space-y-1">
    <button
      // ИСПРАВЛЕНО: rowIndex -> originalIndex
      onClick={() => { setCurrentLesson(originalIndex); setShowAddWordModal(true); }} 
      className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 w-full"
    >
      + Слово
    </button>
    <button
      // ИСПРАВЛЕНО: rowIndex -> originalIndex
      onClick={() => deleteRow(originalIndex)} 
      className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
    >
      Удалить тему
    </button>
  </div>
)}
    
    {/* ===== 2. ЕСЛИ НЕ ЗАГОЛОВОК, ТОГДА ПРОВЕРЯЕМ ТИПЫ ТАБЛИЦ ===== */}
    {!isLessonHeader(row) && (
      <>
        {/* ДЛЯ ВОПРОСИТЕЛЬНЫХ СЛОВ - ДОБАВЛЕНО */}
        {activeTable === 'question-words' && (
          <>
            <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
              📷 Картинка
            </button>
            <button
              onClick={() => deleteRow(originalIndex)}
              className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
            >
              Удалить
            </button>
            <button
              onClick={() => {
                setSelectedWord({
                  imageBase: row['База изображение'] || `question_word_${row['Русский']?.toLowerCase()}`,
                  translations: { 
                    russian: row['Русский'] || '',
                    english: row['Английский'] || '',
                    turkish: row['Турецкий'] || ''
                  },
                  word: row['Русский'] || 'Вопросительное слово'
                });
                setShowQuestionWordCaseModal(true);
              }}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
              title="Управление падежами"
            >
              📝 Падежи (русский)
            </button>
          </>
        )}

        {/* Для наречий */}
        {activeTable === 'adverbs' && (
          <>
            <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
              📷 Картинка
            </button>
            <button
              onClick={() => deleteRow(originalIndex)}
              className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
            >
              Удалить
            </button>
          </>
        )}
        
        {/* Для местоимений */}
        {activeTable === 'pronouns' && (
          <>
            <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
              📷 Картинка
            </button>
            <button
              onClick={() => deleteRow(originalIndex)}
              className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
            >
              Удалить
            </button>
            <button
              onClick={() => {
                setSelectedWord({
                  imageBase: row['База изображение'],
                  translations: { 
                    russian: row['Русский'] || '',
                    english: row['Английский'] || '',
                    turkish: row['Турецкий'] || ''
                  },
                  word: row['Русский'] || 'Местоимение'
                });
                setShowPronounDeclensionModal(true);
              }}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
              title="Управление склонениями"
            >
              📝 Склонения(русский)
            </button>
          </>
        )}
        
        {/* Для числительных */}
        {activeTable === 'numerals' && (
          <>
            <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
              📷 Картинка
            </button>
            <button
              onClick={() => deleteRow(originalIndex)}
              className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
            >
              Удалить
            </button>
            {(
              <button
                onClick={() => {
                  setSelectedNumeral({
                    imageBase: row['База изображение'],
                    translations: { 
                      russian: row['Русский'] || '',
                      english: row['Английский'] || '',
                      turkish: row['Турецкий'] || ''
                    },
                    word: row['Русский'] || 'Числительное'
                  });
                  setShowNumeralCaseModal(true);
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
                title="Управление падежами"
              >
                📝 Падежи (русский)
              </button>
            )}
          </>
        )}
        
        {/* Для причастий */}
       {/* Для причастий - показываем только базовую форму */}
{activeTable === 'participles' && !isLessonHeader(row) && row['База изображение'] && (
  <div className="space-y-1">
    <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
      📷 Картинка
    </button>
    <button
      onClick={() => deleteRow(originalIndex)}
      className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
    >
      Удалить
    </button>
    <button
      onClick={() => {
        const displayWord = row['База причастия базовая форма Русский'] || 
                           row['База причастия базовая форма Русский'] || 
                           'Причастие';
        setSelectedParticiple({
          imageBase: row['База изображение'],
          translations: { 
            russian: displayWord,
            english: row['База причастия базовая форма Английский'] || '',
            turkish: row['База причастия базовая форма Турецкий'] || ''
          },
          word: displayWord
        });
        setShowParticipleCaseModal(true);
      }}
      className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
      title="Управление падежами"
    >
      📝 Падежи (русский)
    </button>
  </div>
)}
        
        {/* Для простых таблиц (предлоги, деепричастия, глаголы) */}
        {(activeTable === 'prepositions' || activeTable === 'gerunds' || activeTable === 'verbs') && (
          <>
            <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
              📷 Картинка
            </button>
            <button
              onClick={() => deleteRow(originalIndex)}
              className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
            >
              Удалить
            </button>
            
            {/* Для глаголов добавляем кнопку спряжения */}
            {activeTable === 'verbs' && (
              <button
                onClick={async () => {
                  const imageBase = row['База изображение'];
                  
                  if (!imageBase) {
                    alert('У этого глагола нет imageBase. Сначала сохраните строку.');
                    return;
                  }
                  
                  console.log('Opening conjugation for:', imageBase);
                  
                  const translations = {};
                  const infinitive = row['Инфинитив'] || '';
                  
                  Object.keys(row).forEach(col => {
                    if (col === 'Инфинитив') {
                      translations['russian'] = row[col];
                      translations['infinitive'] = row[col];
                    } else if (col === 'Английский') {
                      translations['english'] = row[col];
                    } else if (col === 'Турецкий') {
                      translations['turkish'] = row[col];
                    }
                    else if (col !== 'Картинка' && 
                             col !== 'База изображение' && 
                             col !== 'Картинка png' &&
                             col !== 'Уровень изучения номер' &&
                             col !== 'Урок номер' &&
                             col !== 'Урок название') {
                      translations[col.toLowerCase()] = row[col];
                    }
                  });
                  
                  const verbObject = {
                    imageBase: imageBase,
                    translations: translations,
                    word: infinitive || translations['russian'] || '',
                    rowData: row
                  };
                  
                  setSelectedVerb(verbObject);
                  setShowVerbConjugationModal(true);
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
                title="Управление спряжением"
              >
                📝 Спряжение
              </button>
            )}
          </>
        )}
        
        {/* Для обычных слов (существительные, прилагательные) */}
        {!isLessonHeader(row) && row['База изображение'] && 
         (activeTable === 'nouns' || activeTable === 'adjectives') && (
          <div className="space-y-1">
            <button onClick={() => openImageUploadModal(originalIndex)} className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 w-full">
              📷 Картинка
            </button>
            <button
              onClick={() => deleteRow(originalIndex)}
              className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full"
            >
              Удалить
            </button>
            {activeTable === 'nouns' && (
              <button
                onClick={() => {
                  setSelectedWord({
                    imageBase: row['База изображение'],
                    translations: { russian: row['База существительные слова Русский'] },
                    word: row['База существительные слова Русский']
                  });
                  setShowCaseModal(true);
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
                title="Управление падежами"
              >
                📝 Падежи (русский)
              </button>
            )}
            {activeTable === 'adjectives' && (
              <button
                onClick={() => {
                  const displayWord = row['База прилагательные базовая форма Русский'] || 
                                     row['База прилагательные базовая форма Русский'] || 
                                     'Прилагательное';
                  
                  console.log('Opening adjective cases for:', {
                    imageBase: row['База изображение'],
                    word: displayWord,
                    row: row
                  });
                  
                  setSelectedAdjective({
                    imageBase: row['База изображение'],
                    translations: { 
                      russian: displayWord,
                      english: row['База прилагательные базовая форма Английский'] || '',
                      turkish: row['База прилагательные базовая форма Турецкий'] || ''
                    },
                    word: displayWord
                  });
                  setShowAdjectiveCaseModal(true);
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 w-full"
                title="Управление падежами"
              >
                📝 Падежи (русский)
              </button>
            )}
          </div>
        )}
        
        {/* Для пустых строк или других случаев */}
        {!isLessonHeader(row) && !row['База изображение'] && 
         activeTable !== 'adverbs' && activeTable !== 'numerals' && 
         activeTable !== 'participles' && activeTable !== 'question-words' && 
         activeTable !== 'prepositions' && activeTable !== 'gerunds' && 
         activeTable !== 'verbs' && (
          <div className="text-xs text-gray-400">—</div>
        )}
      </>
    )}
  </div>
</td>
  {Object.keys(row).map(colKey => (
  <td key={colKey} className="border p-1 min-w-32">
    {/* ДЛЯ СУЩЕСТВИТЕЛЬНЫХ */}
   {activeTable === 'nouns' && colKey.includes('База существительные слова') ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
    {/* Кнопка озвучки удалена отсюда */}
  </div>
) : activeTable === 'nouns' && colKey.toLowerCase().includes('аудио') ? (
  !isLessonHeader(row) ? (
    <div className="flex flex-col items-center justify-center gap-1 p-1">
      <button
        onClick={() => {
          const lang = colKey.split(' ').pop();
          const wordKey = colKey.replace('аудио', 'слова');
          setSelectedWordForAudio({
            imageBase: row['База изображение'],
            displayWord: row[wordKey] || 'Слово'
          });
          setSelectedLanguageForAudio(lang);
          setShowAudioModal(true);
        }}
        className={`px-3 py-1.5 text-xs rounded font-medium transition-all shadow-sm flex items-center gap-1.5 ${
          row[colKey]
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        🎵 {row[colKey] ? 'Прослушать' : 'Добавить'}
      </button>
      {row[colKey] && (
        <audio controls className="h-6 w-full max-w-[110px] rounded-sm">
          <source src={row[colKey]} type="audio/mpeg" />
        </audio>
      )}
    </div>
  ) : null
)

: activeTable === 'pronouns' && !['База изображение', 'Картинка', 'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
 
  </div>
)
: activeTable === 'numerals' && !['Картинка', 'База изображение', 'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
   
  </div>
)

: activeTable === 'participles' && (colKey.includes('База причастия базовая форма')) ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
   
  </div>
)
  : activeTable === 'adjectives' && (colKey.includes('База прилагательные базовая форма') || colKey.includes('База прилагательные слова')) ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
    {/* Кнопка озвучки удалена отсюда */}
  </div>
) : activeTable === 'adjectives' && colKey.toLowerCase().includes('аудио') ? (
  !isLessonHeader(row) ? (
    <div className="flex flex-col items-center justify-center gap-1 p-1">
      <button
        onClick={() => {
          const lang = colKey.split(' ').pop();
          const wordKey = colKey.replace('аудио', 'базовая форма');
          setSelectedAdjectiveForAudio({
            imageBase: row['База изображение'],
            displayWord: row[wordKey] || 'Слово'
          });
          setSelectedAdjectiveLanguage(lang);
          setShowAdjectiveAudioModal(true);
        }}
        className={`px-3 py-1.5 text-xs rounded font-medium transition-all shadow-sm flex items-center gap-1.5 ${
          row[colKey]
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        🎵 {row[colKey] ? 'Прослушать' : 'Добавить'}
      </button>
      {row[colKey] && (
        <audio controls className="h-6 w-full max-w-[110px] rounded-sm">
          <source src={row[colKey]} type="audio/mpeg" />
        </audio>
      )}
    </div>
  ) : null
)
    : activeTable === 'adverbs' && !['Картинка', 'Картинка png', 'База изображение', 'Уровень изучения номер', 'Урок номер', 'Урок название', 'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
  
  </div>
)
    
: activeTable === 'verbs' && !['Картинка', 'Картинка png', 'База изображение', 'Уровень изучения номер', 'Урок номер', 'Урок название',  'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}
 
  </div>
)
  
    : activeTable === 'question-words' && !['Картинка', 'База изображение', 'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
      <div className="flex items-center justify-between gap-2">
        {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
          <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
        ) : (
          <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
            {row[colKey] || ''}
          </span>
        )}
   
      </div>
    )
    
    : activeTable === 'prepositions' && !['Картинка', 'База изображение', 'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
      <div className="flex items-center justify-between gap-2">
        {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
          <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
        ) : (
          <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
            {row[colKey] || ''}
          </span>
        )}

      </div>
    )
    
: activeTable === 'gerunds' && !['Картинка', 'Картинка png', 'База изображение', 'Уровень изучения номер', 'Урок номер', 'Урок название', 'Аудио'].includes(colKey) && !colKey.startsWith('Аудио') ? (
  <div className="flex items-center justify-between gap-2">
    {editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
      <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded flex-1" />
    ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded flex-1 truncate">
        {row[colKey] || ''}
      </span>
    )}

  </div>
)
        : colKey.startsWith('Аудио ') ? (
  !isLessonHeader(row) ? (
    <div className="flex flex-col items-center justify-center gap-1 p-1">
      <button
        onClick={() => {
          const lang = colKey.replace('Аудио ', '');
          const modals = {
            nouns: () => { setSelectedWordForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedLanguageForAudio(lang); setShowAudioModal(true); },
            adjectives: () => { setSelectedAdjectiveForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedAdjectiveLanguage(lang); setShowAdjectiveAudioModal(true); },
            verbs: () => { setSelectedVerbForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedVerbLanguage(lang); setShowVerbAudioModal(true); },
            pronouns: () => { setSelectedPronounForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedPronounLanguage(lang); setShowPronounAudioModal(true); },
            numerals: () => { setSelectedNumeralForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedNumeralLanguage(lang); setShowNumeralAudioModal(true); },
            adverbs: () => { setSelectedAdverbForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedAdverbLanguage(lang); setShowAdverbAudioModal(true); },
            participles: () => { setSelectedParticipleForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedParticipleLanguage(lang); setShowParticipleAudioModal(true); },
            'question-words': () => { setSelectedQuestionWordForAudio({ displayWord: row[colKey], russianWord: row['Русский'] || '' }); setSelectedQuestionWordLanguage(lang); setShowQuestionWordAudioModal(true); },
            prepositions: () => { setSelectedPrepositionForAudio({ displayWord: row[colKey], russianWord: row['Русский'] || '' }); setSelectedPrepositionLanguage(lang); setShowPrepositionAudioModal(true); },
            gerunds: () => { setSelectedGerundForAudio({ imageBase: row['База изображение'], displayWord: row[colKey] }); setSelectedGerundLanguage(lang); setShowGerundAudioModal(true); },
          };
          if (modals[activeTable]) modals[activeTable]();
        }}
        className={`px-3 py-1.5 text-xs rounded font-medium transition-all shadow-sm flex items-center gap-1.5 ${
          row[colKey]
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        🎵 {row[colKey] ? 'Прослушать' : 'Добавить'}
      </button>
      {row[colKey] && (
        <audio controls className="h-6 w-full max-w-[110px] rounded-sm">
          <source src={row[colKey]} type="audio/mpeg" />
        </audio>
      )}
    </div>
  ) : null
) : editingCell?.originalIndex === originalIndex && editingCell?.colKey === colKey ? (
         <input value={row[colKey] || ''} onChange={(e) => handleCellEdit(originalIndex, colKey, e.target.value)} onBlur={() => setEditingCell(null)} autoFocus className="w-full p-1 border rounded" />
       ) : (
      <span onClick={() => setEditingCell({ originalIndex, colKey })} className="cursor-pointer hover:bg-yellow-100 block p-1 rounded min-h-6">
        {(colKey === 'Картинка' || colKey === 'Картинка png') && row[colKey] ? (
          <img src={row[colKey]} alt="Preview" className="h-8 w-8 object-cover rounded mx-auto" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <span className="block truncate max-w-xs">{row[colKey] || ''}</span>
        )}
      </span>
    )}
  </td>
))}
{activeTable === 'nouns' && !isLessonHeader(row) && row['База изображение'] && (
  <>
    <td className="border p-1 text-center w-16">
      <GenderCheckboxes 
        imageBase={row['База изображение']}
        currentGender={nounGenders[row['База изображение']] || ''}
        onGenderChange={(imageBase, newGender) => {
          // Обновляем состояние
          setNounGenders(prev => ({
            ...prev,
            [imageBase]: newGender
          }));
        }}
      />
    </td>
  </>
)}


{/* Для заголовков уроков добавляем пустые ячейки */}
{activeTable === 'nouns' && isLessonHeader(row) && (
  <td className="border p-1 bg-blue-50 w-16"></td>
)}
                                    </tr>
)})}
                            </tbody>
                        </table>
                    </div>
                </div>
                {getActiveTableData().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Таблица пуста. Нажмите "Обновить" для загрузки данных.</p>
                    </div>
                )}
            </section>
            {/* Модальные окна остаются без изменений */}
            {showFlagsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[80vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6 text-center">Управление флагами</h3>
                     
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800">Языки в таблице</h4>
                                <p className="text-2xl font-bold text-blue-600">{tableLanguages.length}</p>
                                <p className="text-sm text-blue-600">{tableLanguages.join(', ')}</p>
                            </div>
                         
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-800">Флагов в системе</h4>
                                <p className="text-2xl font-bold text-green-600">{flags.length}</p>
                            </div>
                         
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-800">Действия</h4>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={syncFlagsWithTable}
                                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                    >
                                        Синхронизировать
                                    </button>
                                    <button
                                        onClick={initializeFlags}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        Стандартные
                                    </button>
                                    <button
                                        onClick={loadFlags}
                                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                    >
                                        Обновить
                                    </button>
                                 
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {flags.map((flag, index) => (
                                <div key={flag._id || index} className="border rounded-lg p-4 bg-gray-50 relative">
                                    <button
                                        onClick={() => deleteFlag(flag._id, flag.language)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                                        title={`Удалить флаг ${flag.language}`}
                                    >
                                        ×
                                    </button>
                                 
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Язык</label>
                                            <input
                                                type="text"
                                                value={flag.language}
                                                onChange={(e) => {
                                                    const newFlags = [...flags];
                                                    newFlags[index] = { ...newFlags[index], language: e.target.value };
                                                    setFlags(newFlags);
                                                }}
                                                className="w-full border rounded px-3 py-2"
                                                placeholder="Например: Русский"
                                            />
                                        </div>
                                     
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Изображение флага</label>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-16 h-12 border rounded overflow-hidden flex items-center justify-center bg-white">
                                                    {flag.image && flag.image.startsWith('http') ? (
                                                        <img
                                                            src={flag.image}
                                                            alt={flag.language}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : null}
                                                    <span className={`text-2xl ${flag.image && !flag.image.startsWith('http') ? 'flex' : 'hidden'} items-center justify-center w-full h-full`}>
                                                        {flag.image}
                                                    </span>
                                                    {!flag.image && (
                                                        <span className="text-gray-400 text-sm">Нет изображения</span>
                                                    )}
                                                </div>
                                             
                                                <div className="flex-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleFlagImageUpload(flag, file);
                                                            }
                                                        }}
                                                        className="w-full text-sm"
                                                        disabled={uploadingFlag === flag._id}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {uploadingFlag === flag._id ? 'Загрузка...' : 'Выберите файл изображения'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                     
                                        <button
                                            onClick={async () => {
                                                const success = await saveFlag(flag);
                                                if (success) {
                                                    alert('Флаг сохранен успешно!');
                                                } else {
                                                    alert('Ошибка при сохранении флага');
                                                }
                                            }}
                                            disabled={uploadingFlag === flag._id}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {uploadingFlag === flag._id ? 'Сохранение...' : 'Сохранить изменения'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {flags.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>Флаги не найдены. Нажмите "Синхронизировать" чтобы создать флаги для всех языков из таблицы.</p>
                            </div>
                        )}
                        {tableLanguages.length > 0 && (
                            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                                <h4 className="font-semibold text-yellow-800 mb-2">Языки из таблицы, для которых нет флагов:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tableLanguages
                                        .filter(lang => !flags.some(flag => flag.language === lang))
                                        .map(lang => (
                                            <span key={lang} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                                {lang}
                                            </span>
                                        ))}
                                </div>
                                <p className="text-sm text-yellow-600 mt-2">
                                    Нажмите "Синхронизировать" чтобы автоматически создать флаги для этих языков.
                                </p>
                            </div>
                        )}
                        <div className="mt-6 flex gap-2 justify-end">
                            <button
                                onClick={() => setShowFlagsModal(false)}
                                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
     {showLessonsModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <button
        onClick={() => setShowLessonsModal(false)}
        className="absolute top-4 right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="Закрыть"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
            <h3 className="text-2xl font-bold mb-6 text-center">Управление уроками</h3>
         
            <div className="mb-4">
                <button
                    onClick={() => setShowCreateLessonModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    + Создать новый урок
                </button>
            </div>
           
            <div >
                {lessons.map(lesson => (
                    <div key={lesson._id} className="border rounded-lg p-4 bg-gray-50 relative">
                        <button
                            onClick={() => deleteLesson(lesson._id, lesson.title)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                            title={`Удалить урок ${lesson.title}`}
                        >
                            ×
                        </button>
                   
                        <h4 className="font-semibold text-lg mb-2">{lesson.title}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Уровень:</strong> {lesson.level}</p>
                            <p><strong>Тема:</strong> {lesson.theme}</p>
                            <p><strong>Изучаемый язык:</strong> {lesson.studiedLanguage}</p>
                            <p><strong>Язык подсказки:</strong> {lesson.hintLanguage}</p>
                            <p><strong>Количество слов:</strong> {lesson.words?.length || 0}</p>
                            <p><strong>Номер урока:</strong> {lesson.lessonNumber}</p>
                        </div>
                   
                        {/* <div className="mt-3 flex gap-2">
                            <button
                                onClick={() => createTestFromLesson(lesson)}
                                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                            >
                                Быстрый тест по уроку
                            </button>
                        </div> */}
                       
                        {/* Рендерим модули для этого урока */}
                        {renderLessonModules(lesson)}
                    </div>
                )).reverse()}
            </div>
           
            {lessons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>Уроки не найдены. Создайте первый урок!</p>
                </div>
            )}
           
            <div className="mt-6 flex gap-2 justify-end">
                <button
                    onClick={() => setShowLessonsModal(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Закрыть
                </button>
            </div>
        </div>
    </div>
)}
{showAdjectiveCaseModal && (
  <AdjectiveCaseManagementModal
    isOpen={showAdjectiveCaseModal}
    onClose={() => setShowAdjectiveCaseModal(false)}
    word={selectedAdjective}
    onSave={() => {
      console.log('Падежи прилагательного сохранены');
    }}
     language="русский" 
  />
)}
      {showTestsModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto relative">
      {/* Кнопка закрытия */}
      <button
        onClick={() => setShowTestsModal(false)}
        className="absolute top-4 right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-all duration-200"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 className="text-2xl font-bold mb-6 text-center pr-8">Управление тестами</h3>
      
      {/* Кнопка создания нового теста */}
      <div className="mb-4">
        <button
          onClick={() => setShowCreateTestModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Создать новый тест
        </button>
      </div>

      {/* Список существующих тестов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(test => (
          <div key={test._id} className="border rounded-lg p-4 bg-gray-50 relative">
            <button
              onClick={() => deleteTest(test._id, test.theme)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
            <h4 className="font-semibold text-lg mb-2">{test.theme}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Уровень:</strong> {test.level}</p>
              <p><strong>Изучаемый язык:</strong> {test.studiedLanguage}</p>
              <p><strong>Язык подсказки:</strong> {test.hintLanguage}</p>
              <p><strong>Количество слов:</strong> {test.words?.length || 0}</p>
            
            </div>
            <div className="mt-3">
            
            </div>
          </div>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Тесты не найдены. Создайте первый тест!</p>
        </div>
      )}

      <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => setShowTestsModal(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
)}
{showCreateTestModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-[900px] max-h-[90vh] overflow-y-auto relative">
      {/* Кнопка закрытия */}
      <button
        onClick={() => {
          setShowCreateTestModal(false);
          setTestCreationForm({
            studiedLanguage: 'русский',
            hintLanguage: 'english',
            level: 'A1',
            theme: '',
            selectedWords: [],
            wordCount: 8
          });
          setTestLexiconAddForm({ database: 'nouns', theme: '' });
        }}
        className="absolute top-4 right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-all duration-200"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 className="text-2xl font-bold mb-6 text-center pr-8">Создать новый тест</h3>

      <div className="space-y-6">
        {/* Изучаемый язык */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Изучаемый язык</label>
          <select
            value={testCreationForm.studiedLanguage}
            onChange={(e) => setTestCreationForm({...testCreationForm, studiedLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="русский">Русский</option>
            <option value="english">English</option>
            <option value="turkish">Türkçe</option>
            <option value="spanish">Español</option>
            <option value="german">Deutsch</option>
            <option value="french">Français</option>
            <option value="italian">Italiano</option>
          </select>
        </div>

        {/* Язык подсказки */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Язык подсказки</label>
          <select
            value={testCreationForm.hintLanguage}
            onChange={(e) => setTestCreationForm({...testCreationForm, hintLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="русский">Русский</option>
            <option value="english">English</option>
            <option value="turkish">Türkçe</option>
            <option value="spanish">Español</option>
            <option value="german">Deutsch</option>
            <option value="french">Français</option>
          </select>
        </div>

        {/* Уровень сложности */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Уровень (Сложность)</label>
          <select
            value={testCreationForm.level}
            onChange={(e) => setTestCreationForm({...testCreationForm, level: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
          >
            <option value="A0">A0 - Начинающий</option>
            <option value="A0+">A0+ - Начинающий +</option>
            <option value="A1">A1 - Элементарный</option>
            <option value="A2">A2 - Базовый</option>
            <option value="A2+">A2+ - Базовый +</option>
            <option value="B1">B1 - Средний</option>
            <option value="B1+">B1+ - Средний +</option>
            <option value="B2">B2 - Выше среднего</option>
            <option value="C1">C1 - Продвинутый</option>
            <option value="C2">C2 - Профессиональный</option>
          </select>
        </div>

        {/* Тема теста */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Тема урока</label>
          <input
            type="text"
            value={testCreationForm.theme}
            onChange={(e) => setTestCreationForm({...testCreationForm, theme: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
            placeholder="Например: Еда, Город, Семья, Цвета..."
          />
        </div>

        {/* ===== СЕКЦИЯ ВЫБОРА СЛОВ (КАК В МОДУЛЕ ЛЕКСИКА) ===== */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">Выберите слова для теста из любых баз данных:</h4>
          
          {/* Выбор базы данных и темы */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">База данных</label>
              <select
                value={testLexiconAddForm.database}
                onChange={(e) => {
                  setTestLexiconAddForm({
                    database: e.target.value,
                    theme: ''
                  });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="nouns">📚 Существительные</option>
                <option value="adjectives">🎨 Прилагательные</option>
                <option value="verbs">⚡ Глаголы</option>
                <option value="pronouns">👤 Местоимения</option>
                <option value="numerals">🔢 Числительные</option>
                <option value="adverbs">📝 Наречия</option>
                <option value="prepositions">📍 Предлоги, частицы</option>
                <option value="question-words">❓ Вопросительные слова</option>
                <option value="gerunds">🏃 Деепричастия</option>
                <option value="participles">📖 Причастия</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Тема (урок)</label>
              <select
                value={testLexiconAddForm.theme}
                onChange={(e) => setTestLexiconAddForm({...testLexiconAddForm, theme: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={!testLexiconAddForm.database || ['prepositions', 'question-words', 'pronouns', 'numerals'].includes(testLexiconAddForm.database)}
              >
                <option value="">-- Выберите тему --</option>
                {testLexiconAddForm.database && getThemesByDatabase(testLexiconAddForm.database).map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* WordSelector для добавления слов */}
          {testLexiconAddForm.database && (
            <div className="border rounded-lg p-4 bg-white">
              <h6 className="font-medium mb-2 text-sm">Выберите слова для добавления в тест:</h6>
              <WordSelector
                studiedLanguage={testCreationForm.studiedLanguage || 'русский'}
                theme={testLexiconAddForm.theme}
                database={testLexiconAddForm.database}  // ← ДИНАМИЧЕСКАЯ БД!
                filters={{}}
                onWordSelect={(selectedWord) => {
                  setTestCreationForm(prev => {
                    const wordId = `${selectedWord.database || testLexiconAddForm.database}_${selectedWord.imageBase || selectedWord.id}`;
                    const isSelected = prev.selectedWords.some(w => 
                      `${w.database}_${w.imageBase || w.id}` === wordId
                    );
                    
                    if (!isSelected) {
                      return {
                        ...prev,
                        selectedWords: [...prev.selectedWords, {
                          ...selectedWord,
                          database: selectedWord.database || testLexiconAddForm.database,
                          sourceDatabase: testLexiconAddForm.database
                        }]
                      };
                    }
                    return prev;
                  });
                }}
                selectedWord={null}
                selectedWords={testCreationForm.selectedWords}
              />
            </div>
          )}
        </div>

        {/* Отображение выбранных слов с группировкой по БД */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h5 className="font-semibold mb-3">
            📋 Выбранные слова для теста ({testCreationForm.selectedWords.length}):
          </h5>
          
          {testCreationForm.selectedWords.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed">
              <p>Нет выбранных слов</p>
              <p className="text-sm mt-1">Выберите слова из базы данных выше</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(
                testCreationForm.selectedWords.reduce((groups, word) => {
                  const db = word.database || word.sourceDatabase || 'nouns';
                  if (!groups[db]) groups[db] = [];
                  groups[db].push(word);
                  return groups;
                }, {})
              ).map(([database, words]) => (
                <div key={database} className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-100 px-3 py-2 font-medium text-sm">
                    {getDatabaseDisplayName(database)} ({words.length})
                  </div>
                  <div className="p-2 space-y-1 bg-white">
                    {words.map((word, idx) => (
                      <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium text-green-800">
                            {word.displayWord || word.word || word.translations?.russian || ''}
                          </span>
                          {word.imagePng && (
                            <img
                              src={word.imagePng}
                              alt="Preview"
                              className="h-6 w-6 object-cover rounded"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => setTestCreationForm(prev => ({
                            ...prev,
                            selectedWords: prev.selectedWords.filter((_, i) => {
                              const currentWord = prev.selectedWords[i];
                              const isSame = (currentWord.imageBase || currentWord.id) === (word.imageBase || word.id) &&
                                            (currentWord.database || currentWord.sourceDatabase) === database;
                              return !isSame;
                            })
                          }))}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Статистика */}
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <strong>Всего слов:</strong> {testCreationForm.selectedWords.length}
              {testCreationForm.selectedWords.length < 2 && (
                <span className="text-red-500 ml-2">⚠️ Нужно минимум 2 слова</span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {Object.keys(testCreationForm.selectedWords.reduce((groups, word) => {
                const db = word.database || word.sourceDatabase || 'nouns';
                groups[db] = true;
                return groups;
              }, {})).length} различных баз данных
            </div>
          </div>
        </div>

        {/* Количество слов в тесте */}
        {testCreationForm.selectedWords.length >= 2 && (
          <div className="grid grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-right">Количество слов в тесте</label>
            <select
              value={testCreationForm.wordCount || Math.min(8, testCreationForm.selectedWords.length)}
              onChange={(e) => setTestCreationForm({
                ...testCreationForm,
                wordCount: parseInt(e.target.value)
              })}
              className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white"
            >
              {[4, 6, 8, 10, 12, 14, 16, 18, 20]
                .filter(n => n <= testCreationForm.selectedWords.length)
                .map(num => (
                  <option key={num} value={num}>{num} слов</option>
                ))}
              <option value={testCreationForm.selectedWords.length}>
                Все слова ({testCreationForm.selectedWords.length})
              </option>
            </select>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex justify-center pt-4 gap-5">
          <button
            onClick={() => {
              setShowCreateTestModal(false);
              setTestCreationForm({
                studiedLanguage: 'русский',
                hintLanguage: 'english',
                level: 'A1',
                theme: '',
                selectedWords: [],
                wordCount: 8
              });
              setTestLexiconAddForm({ database: 'nouns', theme: '' });
            }}
            className="px-8 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={createStandaloneTest}
            disabled={testCreationForm.selectedWords.length < 2 || !testCreationForm.theme}
            className="px-8 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Создать тест
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{showCreateLessonModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
      <h3 className="text-2xl font-bold mb-4 text-center">Создать урок</h3>
   
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {/* Изучаемый язык */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Изучаемый язык</label>
          <select
            value={newLesson.studiedLanguage}
            onChange={(e) => setNewLesson({...newLesson, studiedLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="">-- Выберите язык --</option>
            {addedLanguages.map(lang => (
              <option key={lang} value={lang.toLowerCase()}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        {/* Язык подсказки */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Язык подсказки</label>
          <select
            value={newLesson.hintLanguage}
            onChange={(e) => setNewLesson({...newLesson, hintLanguage: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="">-- Выберите язык --</option>
            {addedLanguages.map(lang => (
              <option key={lang} value={lang.toLowerCase()}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        {/* Уровень сложности */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Уровень</label>
          <select
            value={newLesson.level}
            onChange={(e) => setNewLesson({...newLesson, level: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
          >
            <option value="">-- Выберите уровень --</option>
            {['A0','A0+','A1','A2','A2+', 'B1', 'B1+','B2', 'C1', 'C2'].map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        {/* Тема урока */}
       <div className="grid grid-cols-3 gap-4 items-center">
  <label className="text-sm font-medium text-right">Тема урока</label>
  <select
    value={newLesson.theme || ''}
    onChange={(e) => setNewLesson({...newLesson, theme: e.target.value})}
    className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
  >
    <option value="">-- Выберите тему --</option>
    {getAvailableThemes().map(theme => (
      <option key={theme} value={theme}>{theme}</option>
    ))}
  </select>
</div>

        
        {/* БАЗА ДАННЫХ ДЛЯ ПРОВЕРКИ СЛОВ */}
<div className="grid grid-cols-3 gap-4 items-start">
  <label className="text-sm font-medium text-right pt-2">Тема урока(вручную)</label>
  <div className="col-span-2">
    <div className="relative">
      <input
        type="text"
        list="lesson-themes-datalist"
        value={newLesson.theme || ''}
        onChange={(e) => setNewLesson({...newLesson, theme: e.target.value})}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        placeholder="Введите тему или выберите из списка..."
      />
      <datalist id="lesson-themes-datalist">
        {getAvailableThemes().map(theme => (
          <option key={theme} value={theme} />
        ))}
      </datalist>
    </div>
    {newLesson.theme && !getAvailableThemes().includes(newLesson.theme) && (
      <p className="text-xs text-amber-600 mt-1">
        ⚠️ Новая тема — слова для неё нужно добавить в таблицу отдельно.
        Урок будет создан пустым, модули можно добавить позже.
      </p>
    )}
  </div>
</div>
        {/* Номер урока */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Номер урока</label>
          <input
            type="text"
            value={newLesson.lessonNumber || ''}
            onChange={(e) => setNewLesson({...newLesson, lessonNumber: e.target.value})}
            className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
            placeholder="Автоматически генерируется"
            disabled
          />
        </div>
        {/* Для типа 3: Количество колонок и БД */}
        {newLesson.lessonType === 3 && (
          <>
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-medium text-right">Количество колонок</label>
              <input
                type="number"
                min="2"
                max="10"
                value={newLesson.columnsCount || ''}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 2;
                  const newConfigs = Array.from({ length: count }, (_, i) =>
                    newLesson.columnConfigs[i] || { database: 'nouns', filters: {} }
                  );
                  setNewLesson({
                    ...newLesson,
                    columnsCount: count,
                    columnConfigs: newConfigs
                  });
                }}
                className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
              />
            </div>
            {Array.from({ length: newLesson.columnsCount || 2 }).map((_, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-right">Колонка {index + 1} БД</label>
                <select
                  value={newLesson.columnConfigs[index]?.database || 'nouns'}
                  onChange={(e) => {
                    const updatedConfigs = [...newLesson.columnConfigs];
                    updatedConfigs[index] = {
                      ...updatedConfigs[index],
                      database: e.target.value,
                      filters: {}
                    };
                    setNewLesson({
                      ...newLesson,
                      columnConfigs: updatedConfigs
                    });
                  }}
                  className="col-span-2 border border-gray-300 rounded px-3 py-2 bg-white text-sm"
                >
                  <option value="nouns">Существительные</option>
                  <option value="adjectives">Прилагательные</option>
                  <option value="verbs">Глаголы</option>
                </select>
              </div>
            ))}
          </>
        )}
        {/* Проверка переводов */}
      {newLesson.theme && (
  <div className="border rounded-lg p-3 bg-gray-50">
    {getAvailableThemes().includes(newLesson.theme) ? (
      <>
        <h4 className="font-semibold mb-2 text-sm">
          Проверка переводов для темы «{newLesson.theme}»
          <span className="text-xs font-normal text-gray-600 ml-2">
            (из базы: {newLesson.checkDatabase === 'nouns' ? 'существительные' : 'прилагательные'})
          </span>
        </h4>
        {(() => {
          const check = checkTranslationsForTheme(
            newLesson.theme,
            newLesson.studiedLanguage?.charAt(0).toUpperCase() + newLesson.studiedLanguage?.slice(1),
            newLesson.hintLanguage?.charAt(0).toUpperCase() + newLesson.hintLanguage?.slice(1),
            newLesson.checkDatabase || activeTable
          );
          return check.isValid ? (
            <p className="text-green-600 text-sm">✓ Все переводы присутствуют</p>
          ) : (
            <>
              <p className="text-red-600 mb-2 text-sm">{check.message}</p>
              {check.missingWords.length > 0 ? (
                <ul className="list-disc pl-4 text-xs text-red-600 max-h-20 overflow-y-auto">
                  {check.missingWords.map((w, index) => (
                    <li key={index} className="mb-1">
                      Слово «{w.word}»:
                      {w.missingStudied ? ` нет ${newLesson.studiedLanguage}` : ''}
                      {w.missingStudied && w.missingHint ? ', ' : ''}
                      {w.missingHint ? ` нет ${newLesson.hintLanguage}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600 text-sm">
                  В выбранной теме нет слов в указанной базе данных
                </p>
              )}
              <p className="text-gray-600 mt-2 text-xs">
                Исправьте переводы в таблице или выберите другую базу данных
              </p>
            </>
          );
        })()}
      </>
    ) : (
      <>
        <h4 className="font-semibold mb-2 text-sm text-amber-700">
          Новая тема «{newLesson.theme}»
        </h4>
        <div className="space-y-1">
          <p className="text-amber-600 text-sm flex items-start gap-1">
            <span>⚠️</span>
            <span>
              Эта тема не найдена в таблицах. Урок будет создан <strong>без слов</strong>.
            </span>
          </p>
          <p className="text-gray-500 text-xs">
            После создания урока вы сможете добавить к нему модули (Лексика, Фразы и др.)
            через кнопку «+ Добавить модуль» в разделе «Управление уроками».
          </p>
          <p className="text-green-600 text-xs font-medium">
            ✓ Создание разрешено
          </p>
        </div>
      </>
    )}
  </div>
)}

        {/* Цвет шрифта */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Цвет шрифта</label>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="color"
              value={newLesson.fontColor}
              onChange={(e) => setNewLesson({...newLesson, fontColor: e.target.value})}
              className="h-8 w-12 cursor-pointer"
            />
            <span className="text-xs text-gray-600">{newLesson.fontColor}</span>
          </div>
        </div>
        {/* Цвет фона */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-right">Цвет фона</label>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="color"
              value={newLesson.bgColor}
              onChange={(e) => setNewLesson({...newLesson, bgColor: e.target.value})}
              className="h-8 w-12 cursor-pointer"
            />
            <span className="text-xs text-gray-600">{newLesson.bgColor}</span>
          </div>
        </div>
      </div>
      {/* Кнопки - фиксированные внизу */}
      <div className="flex justify-center pt-4 gap-4 border-t mt-4">
        <button
          onClick={() => setShowCreateLessonModal(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600"
        >
          Отмена
        </button>
     
        <button
          onClick={createLesson}
          disabled={!isLessonFormValid()}
          className="px-6 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Создать урок
        </button>
      </div>
    </div>
  </div>
)}{showCaseModal && (
  <CaseManagementModal
    isOpen={showCaseModal}
    onClose={() => setShowCaseModal(false)}
    word={selectedWord}
    onSave={() => {
      // Можно добавить обновление данных если нужно
      console.log('Падежи сохранены');
    }}
  />
)}
       {showImageUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Загрузка изображения</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Выберите файл изображения</label>
                                <input type="file" accept="image/*" onChange={handleFileSelect} className="w-full border rounded p-2" />
                            </div>
                            {imagePreview && <div><label className="block text-sm font-medium mb-2">Предпросмотр:</label><img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded border" /></div>}
                            <div className="text-sm text-gray-600"><p>Изображение будет загружено на imgbb и сохранено в базе данных.</p></div>
                        </div>
                        <div className="mt-6 flex gap-2 justify-end">
                            <button onClick={() => { setShowImageUploadModal(false); setSelectedFile(null); setImagePreview(null); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" disabled={uploadingImage}>Отмена</button>
                            <button onClick={handleImageUpload} disabled={!selectedFile || uploadingImage} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">{uploadingImage ? 'Загрузка...' : 'Загрузить'}</button>
                        </div>
                    </div>
                </div>
            )}
    {showAddLanguageModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-96">
      <h3 className="text-lg font-semibold mb-4">Добавить новый язык</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Выберите язык</label>
          <select 
            value={newLanguage} 
            onChange={(e) => setNewLanguage(e.target.value)} 
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Выберите язык --</option>
            
            {/* Для всех типов таблиц показываем полный список языков */}
            {[
              'Русский', 'Английский', 'Турецкий', 'Испанский', 'Немецкий', 
              'Французский', 'Итальянский', 'Китайский', 'Японский', 'Корейский',
              'Арабский', 'Хинди', 'Португальский', 'Голландский', 'Шведский',
              'Польский', 'Греческий', 'Иврит', 'Вьетнамский', 'Индонезийский'
            ].map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        
        {/* Предпросмотр для причастий */}
        {newLanguage && activeTable === 'participles' && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Будут созданы колонки:</p>
            <p className="text-blue-600 font-semibold text-sm">{`База причастия номер ${newLanguage}`}</p>
            <p className="text-green-600 font-semibold text-sm">{`База причастия мужской род ${newLanguage}`}</p>
            <p className="text-green-600 font-semibold text-sm">{`База причастия женский род ${newLanguage}`}</p>
            <p className="text-green-600 font-semibold text-sm">{`База причастия средний род ${newLanguage}`}</p>
            <p className="text-green-600 font-semibold text-sm">{`База причастия множественное число ${newLanguage}`}</p>
          </div>
        )}
        
        {/* Предпросмотр для глаголов и наречий */}
        {newLanguage && (activeTable === 'verbs' || activeTable === 'adverbs') && (
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium">Будет создана колонка:</p>
            <p className="text-green-600 font-semibold text-sm">{newLanguage}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex gap-2 justify-end">
        <button 
          onClick={() => setShowAddLanguageModal(false)} 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button 
          onClick={handleAddLanguage}
          disabled={!newLanguage} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Добавить язык
        </button>
      </div>
    </div>
  </div>
)}
      {showAddWordModal && currentLesson !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Добавить слово к уроку: {tableData[currentLesson]?.['Урок название']}</h3>
            <p className="text-gray-600 mb-4">Будет создено новое слово с автоматической нумерацией для всех добавленных языков.</p>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => { setShowAddWordModal(false); setCurrentLesson(null); }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Отмена</button>
              <button onClick={() => addWordToLesson(currentLesson)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Добавить слово</button>
            </div>
          </div>
        </div>
      )}
      {showPodcastModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Добавить аудио</h3>
      
      <div className="space-y-6">
        {/* Название подкаста */}
        <div>
          <label className="block text-sm font-medium mb-2">Название аудио</label>
          <input
            type="text"
            value={newPodcast.title}
            onChange={(e) => setNewPodcast({...newPodcast, title: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Введите название аудио"
          />
        </div>

        {/* Загрузка аудио файла */}
        <div>
          <label className="block text-sm font-medium mb-2">Аудио файл</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewPodcast({
                    ...newPodcast,
                    audioFile: file,
                    audioPreview: URL.createObjectURL(file)
                  });
                  
                  // Можно добавить автоматическое определение длительности
                  const audio = new Audio(URL.createObjectURL(file));
                  audio.onloadedmetadata = () => {
                    setNewPodcast(prev => ({
                      ...prev,
                      duration: Math.round(audio.duration)
                    }));
                  };
                }
              }}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer block">
              {newPodcast.audioFile ? (
                <div className="space-y-2">
                  <div className="text-green-600">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-medium">{newPodcast.audioFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(newPodcast.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {newPodcast.duration > 0 && (
                    <p className="text-sm text-gray-500">
                      Длительность: {Math.floor(newPodcast.duration / 60)}:{(newPodcast.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                  {newPodcast.audioPreview && (
                    <div className="mt-4">
                      <audio controls className="w-full">
                        <source src={newPodcast.audioPreview} type={newPodcast.audioFile.type} />
                      </audio>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-medium">Нажмите для загрузки аудио файла</p>
                  <p className="text-sm text-gray-500">
                    Поддерживаемые форматы: MP3, WAV, OGG, M4A
                  </p>
                  <p className="text-sm text-gray-500">Максимальный размер: 50MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Титры на оригинальном языке */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Титры на {lessonData?.studiedLanguage ? lessonData.studiedLanguage.toUpperCase() : 'ОРГИГИНАЛЬНОМ'} языке
          </label>
          <textarea
            value={newPodcast.originalTranscript}
            onChange={(e) => setNewPodcast({...newPodcast, originalTranscript: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            placeholder="Введите текст титров..."
          />
        </div>

        {/* Титры на языке подсказки */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Титры на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКОМ'} языке
            <span className="text-gray-500 text-sm font-normal ml-2">(необязательно)</span>
          </label>
          <textarea
            value={newPodcast.hintTranscript}
            onChange={(e) => setNewPodcast({...newPodcast, hintTranscript: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            placeholder="Введите перевод титров..."
          />
        </div>

        {/* Подсказка */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Подсказка
            <span className="text-gray-500 text-sm font-normal ml-2">(необязательно)</span>
          </label>
          <textarea
            value={newPodcast.hint}
            onChange={(e) => setNewPodcast({...newPodcast, hint: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-32"
            placeholder="Введите подсказку для студента..."
          />
        </div>

        {/* Кнопки управления */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowPodcastModal(false);
              if (newPodcast.audioPreview) {
                URL.revokeObjectURL(newPodcast.audioPreview);
              }
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={addPodcast}
            disabled={!newPodcast.title || !newPodcast.audioFile || !newPodcast.originalTranscript}
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Добавить аудио
          </button>
         
        </div>
         {isUploading && (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm font-medium text-blue-700">
        Загрузка аудио файла...
      </span>
      <span className="text-sm font-medium text-blue-700">
        {uploadProgress}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${uploadProgress}%` }}
      ></div>
    </div>
    <p className="text-xs text-blue-600 mt-1">
      Пожалуйста, не закрывайте это окно...
    </p>
  </div>
)}

        {/* Список существующих подкастов */}
        <div className="mt-8">
          <h4 className="font-semibold mb-3">Существующие аудио:</h4>
          {modulePodcasts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Нет добавленных аудио
            </div>
          ) : (
            <div className="space-y-4">
              {modulePodcasts.map((podcast, index) => (
                <div key={podcast._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">{podcast.title}</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>Длительность: {Math.floor(podcast.duration / 60)}:{(podcast.duration % 60).toString().padStart(2, '0')}</span>
                        <span>•</span>
                        <span>{(podcast.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePodcast(podcast._id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Удалить
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <audio controls className="w-full">
                      <source src={podcast.audioUrl} type={podcast.mimeType} />
                    </audio>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <h6 className="text-sm font-medium mb-1">Оригинальные титры:</h6>
                      <p className="text-sm text-gray-600 line-clamp-3">{podcast.originalTranscript}</p>
                    </div>
                    
                    {podcast.hintTranscript && (
                      <div>
                        <h6 className="text-sm font-medium mb-1">Перевод:</h6>
                        <p className="text-sm text-gray-600 line-clamp-3">{podcast.hintTranscript}</p>
                      </div>
                    )}
                  </div>
                  
                  {podcast.hint && (
                    <div className="mt-2 pt-2 border-t">
                      <h6 className="text-sm font-medium mb-1">Подсказка:</h6>
                      <p className="text-sm text-gray-600">{podcast.hint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

      <div className="text-sm text-gray-500 mt-4">Данные автоматически сохраняются в MongoDB при изменении</div>
  {showQuestionModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Добавить вопрос</h3>
      
      {/* ПЕРЕКЛЮЧАТЕЛЬ ТРЕБУЕТСЯ ЛИ ОТВЕТ */}
      <div className="mb-6 p-4 border rounded bg-blue-50">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold text-lg">Тип вопроса</h4>
      <p className="text-sm text-gray-600">
        {newQuestion.requiresPairAnswer 
          ? 'Вопрос требует парного ответа (вопрос-ответ)' 
          : 'Вопрос не требует ответа (одиночный вопрос)'}
      </p>
    </div>
    <div className="flex items-center">
      <span className="mr-3 text-sm font-medium">
        {newQuestion.requiresPairAnswer ? 'С ответом' : 'Без ответа'}
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={newQuestion.requiresPairAnswer}
          onChange={(e) => setNewQuestion({
            ...newQuestion,
            requiresPairAnswer: e.target.checked
          })}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  </div>
</div>

      <div className="grid grid-cols-2 gap-6">
        {/* Левая колонка - Вопрос */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg border-b pb-2">Вопрос</h4>
          
          {currentLessonForModule.config?.questionColumnConfigs?.map((config, index) => (
            <div key={index} className="p-4 border rounded bg-gray-50">
              <h5 className="font-medium mb-3">
                Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
              </h5>
              
              <QuestionColumn 
                config={config}
                columnIndex={index}
                structure={newQuestion.questionStructure}
                onStructureChange={(updatedStructure) => setNewQuestion({
                  ...newQuestion,
                  questionStructure: updatedStructure
                })}
                lessonData={lessonData}
                isAnswer={false}
                 getAvailableThemes={getAvailableThemes}
                 getThemesByDatabase={getThemesByDatabase}
              />
            </div>
          ))}
          
          {/* Картинка вопроса */}
          <div className="p-4 border rounded bg-gray-50">
  <h5 className="font-medium mb-2">Картинка вопроса</h5>
  <div className="space-y-3">
    {newQuestion.questionImage && (
      <div className="relative inline-block">
        <img
          src={newQuestion.questionImage}
          alt="Preview"
          className="h-32 w-32 object-cover rounded border"
        />
        <button
          onClick={() => setNewQuestion({...newQuestion, questionImage: ''})}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
        >
          ×
        </button>
      </div>
    )}
    
  {/* В модальном окне вопроса, в секции загрузки изображения */}
<div className="flex items-center gap-3">
  <div className="flex-1">
    <input
      type="text"
      value={newQuestion.questionImage}
      onChange={(e) => setNewQuestion({...newQuestion, questionImage: e.target.value})}
      placeholder="URL картинки или загрузите файл"
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
  <div className="relative">
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => await handleOptimizedImageUpload(e, 'question')}
      className="hidden"
      id={`upload-question-image-${Date.now()}`}
    />
    <label 
      htmlFor={`upload-question-image-${Date.now()}`}
      className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"
    >
      {uploadingImage && uploadingImageType === 'question' ? (
        <>
          <span className="animate-spin">⏳</span> Загрузка...
        </>
      ) : (
        <>
          <span>📁</span> Загрузить
        </>
      )}
    </label>
  </div>
</div>
  </div>
</div>

        </div>

        {/* Правая колонка - Ответ (показывается только если requiresPairAnswer = true) */}
    <div className="space-y-4">
  <h4 className="font-semibold text-lg border-b pb-2">
    Ответ {!newQuestion.requiresPairAnswer && <span className="text-sm text-gray-500">(сохраняется, но не показывается)</span>}
  </h4>
  
  {!newQuestion.requiresPairAnswer && (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
      <p className="text-sm text-yellow-700">
        ⓘ Ответ будет сохранён в базе данных, но не будет показан пользователю в приложении
      </p>
    </div>
  )}
  
  {currentLessonForModule.config?.answerColumnConfigs?.map((config, index) => (
    <div key={index} className="p-4 border rounded bg-gray-50">
      <h5 className="font-medium mb-3">
        Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
      </h5>
      
      <QuestionColumn 
        config={config}
        columnIndex={index}
        structure={newQuestion.answerStructure}
        onStructureChange={(updatedStructure) => setNewQuestion({
          ...newQuestion,
          answerStructure: updatedStructure
        })}
        lessonData={lessonData}
        isAnswer={true}
        getAvailableThemes={getAvailableThemes}
        getThemesByDatabase={getThemesByDatabase}
      />
    </div>
  ))}
  
  {/* Картинка ответа */}
  <div className="p-4 border rounded bg-gray-50">
  <h5 className="font-medium mb-2">Картинка ответа</h5>
  <div className="space-y-3">
    {newQuestion.answerImage && (
      <div className="relative inline-block">
        <img
          src={newQuestion.answerImage}
          alt="Preview"
          className="h-32 w-32 object-cover rounded border"
        />
        <button
          onClick={() => setNewQuestion({...newQuestion, answerImage: ''})}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
        >
          ×
        </button>
      </div>
    )}
    
  <div className="flex items-center gap-3">
  <div className="flex-1">
    <input
      type="text"
      value={newQuestion.answerImage}
      onChange={(e) => setNewQuestion({...newQuestion, answerImage: e.target.value})}
      placeholder="URL картинки или загрузите файл"
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>
  <div className="relative">
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => await handleOptimizedImageUpload(e, 'answer')}
      className="hidden"
      id={`upload-answer-image-${Date.now()}`}
    />
    <label 
      htmlFor={`upload-answer-image-${Date.now()}`}
      className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap flex items-center gap-2"
    >
      {uploadingImage && uploadingImageType === 'answer' ? (
        <>
          <span className="animate-spin">⏳</span> Загрузка...
        </>
      ) : (
        <>
          <span>📁</span> Загрузить
        </>
      )}
    </label>
  </div>
</div>
  </div>
</div>
</div>
      </div>

      {/* Секции перевода (обновленные) */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Перевод вопроса */}
      <div className="p-4 border rounded bg-blue-50">
  <h5 className="font-medium mb-2">
    Перевод вопроса на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКИЙ'}
  </h5>
  
  {/* Автоматический перевод */}
  {/* <div className="mb-3 p-2 bg-white rounded border">
    <label className="text-sm text-gray-600 mb-1 block">Автоматический перевод:</label>
    <div className="text-gray-800 p-2 bg-gray-50 rounded">
      {autoTranslations.question || '—'}
    </div>
    <div className="text-xs text-green-600 mt-1">
      ✓ Вопросительный знак добавлен автоматически
    </div>
  </div> */}
  
  {/* Редактируемое поле */}
  <div>
    <label className="text-sm text-gray-600 mb-1 block">Исправленный перевод:</label>
    <textarea
        value={newQuestion.englishQuestion || autoTranslations.question || ''}
      onChange={(e) => setNewQuestion({
        ...newQuestion, 
        englishQuestion: e.target.value
      })}
      placeholder={`Введите исправленный перевод на ${lessonData?.hintLanguage || 'английский'}`}
      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
    />
    <p className="text-xs text-gray-500 mt-1">
      Вопросительный знак будет добавлен автоматически при сохранении
    </p>
  </div>
</div>

        {/* Перевод ответа (только если есть ответ) */}
        {newQuestion.requiresPairAnswer && (
          <div className="p-4 border rounded bg-green-50">
            <h5 className="font-medium mb-2">
              Перевод ответа на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКИЙ'}
            </h5>
            <textarea
             value={newQuestion.englishAnswer || autoTranslations.answer || ''} 
              onChange={(e) => setNewQuestion({
                ...newQuestion, 
                englishAnswer: e.target.value
              })}
              placeholder={`Введите перевод на ${lessonData?.hintLanguage || 'английский'}`}
              className="w-full border border-gray-300 rounded px-3 py-2 h-20"
            />
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <h5 className="font-medium mb-2">Подсказка</h5>
        <textarea
          value={newQuestion.hint}
          onChange={(e) => setNewQuestion({...newQuestion, hint: e.target.value})}
          placeholder="Введите подсказку (необязательно)"
          className="w-full border border-gray-300 rounded px-3 py-2 h-20"
        />
      </div>

      {/* Кнопки управления */}
      <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => {
            setShowQuestionModal(false);
            resetQuestionForm();
           
          }}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
          onClick={addQuestion}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Добавить вопрос
        </button>
      </div>

      {/* Таблица существующих вопросов */}
      <div className="mt-6">
        <h4 className="font-semibold mb-3">Существующие вопросы:</h4>
        {moduleQuestions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Нет добавленных вопросов
          </div>
        ) : (
          <div className="space-y-4">
            {moduleQuestions.map((question, index) => (
              <div key={question._id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium">Вопрос {index + 1}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${
                      question.requiresPairAnswer === false 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {question.requiresPairAnswer === false ? 'Без ответа' : 'С ответом'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteQuestion(question._id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Удалить
                  </button>
                </div>
                
                <div className={`${question.requiresPairAnswer === false ? 'grid-cols-1' : 'grid-cols-2'} grid gap-4`}>
                  <div>
                    <h6 className="text-sm font-medium mb-1">Вопрос:</h6>
                 <div className="flex flex-wrap gap-1">
  {question.questionStructure && question.questionStructure.map((item, idx) => (
    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
      {item.word}
      {item.database === 'pronouns' && item.person && (
        <span className="text-xs text-indigo-600 ml-1">
          ({item.person}л.{item.number === 'ед' ? 'ед' : 'мн'}{item.gender ? `,${item.gender}` : ''})
        </span>
      )}
    </span>
  ))}
</div>
                 {question.englishQuestion && (
  <div className="mt-1 text-xs text-gray-600">
    {lessonData?.hintLanguage?.toUpperCase() || 'EN'}: {question.englishQuestion}
  </div>
)}
                  </div>
                  
                  {question.requiresPairAnswer !== false && (
                    <div>
                      <h6 className="text-sm font-medium mb-1">Ответ:</h6>
                     <div className="flex flex-wrap gap-1">
  {question.answerStructure && question.answerStructure.map((item, idx) => (
    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
      {item.word}
      {item.database === 'pronouns' && item.person && (
        <span className="text-xs text-indigo-600 ml-1">
          ({item.person}л.{item.number === 'ед' ? 'ед' : 'мн'}{item.gender ? `,${item.gender}` : ''})
        </span>
      )}
    </span>
  ))}
</div>
                    {question.englishAnswer && (
  <div className="mt-1 text-xs text-gray-600">
    {lessonData?.hintLanguage?.toUpperCase() || 'EN'}: {question.englishAnswer}
  </div>
)}
                    </div>
                  )}
                </div>
                
                {question.hint && (
                  <div className="mt-2">
                    <h6 className="text-sm font-medium mb-1">Подсказка:</h6>
                    <p className="text-sm text-gray-600">{question.hint}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
   {showCreateModuleModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">Создать модуль урока</h3>
    
      <div className="space-y-6">
        {/* Тип урока */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <label className="text-sm font-medium text-right">Тип модуля</label>
          <select
            value={newModule.typeId}
            onChange={(e) => {
              const typeId = parseInt(e.target.value);
              setNewModule({
                ...newModule,
                typeId: typeId,
                // Сброс конфигурации при смене типа
                columnsCount: typeId === 3 ? 2 : 0,
                columnConfigs: typeId === 3 ? [{ database: 'nouns', filters: {} }, { database: 'adjectives', filters: {} }] : []
              });
            }}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">-- Выберите тип --</option>
            {lessonTypes.map(type => (
              <option key={type.typeId} value={type.typeId}>
                {type.typeId} - {type.name}
              </option>
            ))}
              

          </select>
        </div>

        {/* Название модуля */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <label className="text-sm font-medium text-right">Название модуля</label>
          <input
            type="text"
            value={newModule.title}
            onChange={(e) => setNewModule({...newModule, title: e.target.value})}
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Введите название модуля"
          />
        </div>

        {/* Конфигурация для типа "вопрос" */}
        {newModule.typeId === 4 && (
          <div className="space-y-6 border-t pt-4">
            <h4 className="font-semibold text-lg">Конфигурация модуля "Вопрос"</h4>

            <div className="mb-4 p-4 border rounded bg-yellow-50">
      <h5 className="font-medium mb-2">Привязка вопросов</h5>
      <p className="text-sm text-gray-600 mb-3">
        Выберите, после какого модуля должны идти эти вопросы.
        Если оставить пустым, вопросы будут в конце урока.
      </p>
      
      <div className="grid grid-cols-2 gap-4 items-center">
        <label className="text-sm font-medium">После модуля</label>
        <select
          value={newQuestionModule.relatedToModuleId || ''}
          onChange={(e) => {
            const moduleId = e.target.value;
            const selectedModule = lessonModules.find(m => m._id === moduleId);
            setNewQuestionModule({
              ...newQuestionModule,
              relatedToModuleId: moduleId || null,
              // Сохраняем тип для информации
              relatedToModuleType: selectedModule ? getModuleTypeName(selectedModule.typeId) : ''
            });
          }}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">-- В конце урока --</option>
         {lessonModules
            .filter(m => m.lessonId === currentLessonForModule?._id && m.typeId !== 4)
            .map(module => (
              <option key={module._id} value={module._id}>
                {module.title} ({getModuleDisplayType(module.typeId)})
              </option>
            ))}
        </select>
      </div>
      
      {newQuestionModule.relatedToModuleId && (
        <div className="mt-2 text-xs text-green-600">
          ✓ Вопросы появятся сразу после выбранного модуля
        </div>
      )}
    </div>
            
            {/* Требуется ответ в пару */}
         

            {/* Количество колонок в таблице Вопрос */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-right">Количество колонок в таблице Вопрос</label>
              <select
                value={newQuestionModule.questionColumnsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  const newConfigs = Array.from({ length: count }, (_, i) =>
                    newQuestionModule.questionColumnConfigs[i] || { database: '', filters: {} }
                  );
                  setNewQuestionModule({
                    ...newQuestionModule,
                    questionColumnsCount: count,
                    questionColumnConfigs: newConfigs
                  });
                }}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Конфигурации колонок вопроса */}
            <div className="space-y-4">
              <h5 className="font-medium">Конфигурация колонок вопроса:</h5>
              {newQuestionModule.questionColumnConfigs.map((config, index) => (
                <div key={index} className="p-4 border rounded bg-gray-50">
                  <h6 className="font-medium mb-2">Колонка вопроса {index + 1}</h6>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium">База данных</label>
                    <select
  value={config.database}
  onChange={(e) => {
    const updatedConfigs = [...newQuestionModule.questionColumnConfigs];
    updatedConfigs[index] = {
      ...updatedConfigs[index],
      database: e.target.value,
      filters: {}
    };
    setNewQuestionModule({
      ...newQuestionModule,
      questionColumnConfigs: updatedConfigs
    });
  }}
  className="border border-gray-300 rounded px-3 py-2"
>
  <option value="">-- Выберите БД --</option>
  <option value="nouns">Существительные</option>
  <option value="adjectives">Прилагательные</option>
 <option value="verbs">Глаголы</option>
  <option value="pronouns">Местоимения</option>
  <option value="numerals">Числительные</option>
  <option value="adverbs">Наречия</option>
  <option value="prepositions">Предлоги, частицы</option>
  <option value="question-words">Вопросительные слова</option>
  <option value="gerunds">Деепричастия</option> 
  <option value="participles">Причастия</option>{/* ← ДОБАВЬТЕ ЭТО */}
</select>
                  </div>
                </div>
              ))}
            </div>

            {/* Количество колонок в таблице Ответ */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="text-sm font-medium text-right">Количество колонок в таблице Ответ</label>
              <select
                value={newQuestionModule.answerColumnsCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  const newConfigs = Array.from({ length: count }, (_, i) =>
                    newQuestionModule.answerColumnConfigs[i] || { database: '', filters: {} }
                  );
                  setNewQuestionModule({
                    ...newQuestionModule,
                    answerColumnsCount: count,
                    answerColumnConfigs: newConfigs
                  });
                }}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Конфигурации колонок ответа */}
            <div className="space-y-4">
              <h5 className="font-medium">Конфигурация колонок ответа:</h5>
              {newQuestionModule.answerColumnConfigs.map((config, index) => (
                <div key={index} className="p-4 border rounded bg-gray-50">
                  <h6 className="font-medium mb-2">Колонка ответа {index + 1}</h6>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium">База данных</label>
                   <select
  value={config.database}
  onChange={(e) => {
    const updatedConfigs = [...newQuestionModule.answerColumnConfigs];
    updatedConfigs[index] = {
      ...updatedConfigs[index],
      database: e.target.value,
      filters: {}
    };
    setNewQuestionModule({
      ...newQuestionModule,
      answerColumnConfigs: updatedConfigs
    });
  }}
  className="border border-gray-300 rounded px-3 py-2"
>
  <option value="">-- Выберите БД --</option>
  <option value="nouns">Существительные</option>
  <option value="adjectives">Прилагательные</option>
  <option value="verbs">Глаголы</option>
  <option value="pronouns">Местоимения</option>
  <option value="numerals">Числительные</option>
  <option value="adverbs">Наречия</option>
  <option value="prepositions">Предлоги, частицы</option>
  <option value="question-words">Вопросительные слова</option>
  <option value="gerunds">Деепричастия</option> 
  <option value="participles">Причастия</option>{/* ← ДОБАВЬТЕ ЭТО */}
</select>
                  </div>
                   {/* {config.database === 'question-words' && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                    <h6 className="text-xs font-medium mb-1">Фильтры для вопросительного слова:</h6>
                    <div className="grid grid-cols-3 gap-2">
                        <select
                            value={config.filters?.number || ''}
                            onChange={(e) => {
                                const updatedConfigs = [...newQuestionModule.questionColumnConfigs];
                                updatedConfigs[index] = {
                                    ...updatedConfigs[index],
                                    filters: {
                                        ...updatedConfigs[index].filters,
                                        number: e.target.value
                                    }
                                };
                                setNewQuestionModule({
                                    ...newQuestionModule,
                                    questionColumnConfigs: updatedConfigs
                                });
                            }}
                            className="text-xs border rounded px-1 py-1"
                        >
                            <option value="">Число</option>
                            <option value="единственное">Ед.ч</option>
                            <option value="множественное">Мн.ч</option>
                        </select>
                        <select
                            value={config.filters?.gender || ''}
                            onChange={(e) => {
                                const updatedConfigs = [...newQuestionModule.questionColumnConfigs];
                                updatedConfigs[index] = {
                                    ...updatedConfigs[index],
                                    filters: {
                                        ...updatedConfigs[index].filters,
                                        gender: e.target.value
                                    }
                                };
                                setNewQuestionModule({
                                    ...newQuestionModule,
                                    questionColumnConfigs: updatedConfigs
                                });
                            }}
                            className="text-xs border rounded px-1 py-1"
                        >
                            <option value="">Род</option>
                            <option value="мужской">Муж.</option>
                            <option value="женский">Жен.</option>
                            <option value="средний">Ср.</option>
                        </select>
                        <select
                            value={config.filters?.case || ''}
                            onChange={(e) => {
                                const updatedConfigs = [...newQuestionModule.questionColumnConfigs];
                                updatedConfigs[index] = {
                                    ...updatedConfigs[index],
                                    filters: {
                                        ...updatedConfigs[index].filters,
                                        case: e.target.value
                                    }
                                };
                                setNewQuestionModule({
                                    ...newQuestionModule,
                                    questionColumnConfigs: updatedConfigs
                                });
                            }}
                            className="text-xs border rounded px-1 py-1"
                        >
                            <option value="">Падеж</option>
                            <option value="именительный">Им.</option>
                            <option value="родительный">Род.</option>
                            <option value="дательный">Дат.</option>
                            <option value="винительный">Вин.</option>
                            <option value="творительный">Тв.</option>
                            <option value="предложный">Пр.</option>
                        </select>
                    </div>
                </div>
            )}
                  {config.database === 'verbs' && (
            <VerbFormSelector
              config={config.filters || {}}
              onConfigChange={(field, value) => {
                const updatedConfigs = [...newQuestionModule.answerColumnConfigs];
                updatedConfigs[index] = {
                  ...updatedConfigs[index],
                  filters: {
                    ...updatedConfigs[index].filters,
                    [field]: value
                  }
                };
                setNewQuestionModule({
                  ...newQuestionModule,
                  answerColumnConfigs: updatedConfigs
                });
              }}
            />
          )} */}
                </div>
              ))}
            </div>
          </div>
        )}
{/* В модальном окне создания модуля, для типа 2 (Тест лексика) */}
{newModule.typeId === 2 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Тест лексика"</h4>
    
    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
      <p className="text-sm text-blue-700">
        ℹ️ Тест автоматически использует слова из модуля "Лексика" этого урока.
        При обновлении слов в лексике — тест тоже обновится.
      </p>
    </div>

    {/* Выбор модуля Лексика */}
    <div>
      <label className="block text-sm font-medium mb-1">
        Источник слов — модуль "Лексика"
      </label>
      <select
        value={newTestModule.sourceLexiconModuleId}
        onChange={(e) => {
          const moduleId = e.target.value;
          const lexiconModule = lessonModules.find(
            m => m._id === moduleId && m.lessonId === currentLessonForModule?._id
          );
          const words = lexiconModule?.config?.words || [];
          setNewTestModule({
            ...newTestModule,
            sourceLexiconModuleId: moduleId,
            selectedWords: words
          });
        }}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">-- Выберите модуль Лексика --</option>
        {lessonModules
          .filter(m => 
            m.lessonId === currentLessonForModule?._id && 
            m.typeId === 1
          )
          .map(m => (
            <option key={m._id} value={m._id}>
              {m.title} ({m.config?.words?.length || 0} слов)
            </option>
          ))
        }
      </select>
      {lessonModules.filter(m => 
        m.lessonId === currentLessonForModule?._id && m.typeId === 1
      ).length === 0 && (
        <p className="text-sm text-red-500 mt-1">
          ⚠️ Нет модулей "Лексика" в этом уроке. Сначала создайте модуль "Лексика".
        </p>
      )}
    </div>

    {/* Количество слов */}
    {newTestModule.sourceLexiconModuleId && (
      <div>
        <label className="block text-sm font-medium mb-1">
          Количество слов в тесте
          <span className="text-gray-500 font-normal ml-2">
            (всего доступно: {newTestModule.selectedWords.length})
          </span>
        </label>
        <select
          value={newTestModule.wordCount}
          onChange={(e) => setNewTestModule({
            ...newTestModule,
            wordCount: parseInt(e.target.value)
          })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          {[4, 6, 8, 10, 12, 16, 20]
            .filter(n => n <= newTestModule.selectedWords.length)
            .map(num => (
              <option key={num} value={num}>{num}</option>
            ))
          }
          <option value={newTestModule.selectedWords.length}>
            Все ({newTestModule.selectedWords.length})
          </option>
        </select>
      </div>
    )}

    {/* Предпросмотр слов */}
    {newTestModule.selectedWords.length > 0 && (
      <div className="p-3 bg-green-50 border border-green-200 rounded">
        <h5 className="font-medium text-sm mb-2">
          Слова из модуля ({newTestModule.selectedWords.length}):
        </h5>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {newTestModule.selectedWords.map((word, idx) => (
            <span key={idx} className="px-2 py-1 bg-white border rounded text-sm">
              {word.displayWord || word.word}
              {word.imagePng && (
                <img 
                  src={word.imagePng} 
                  alt="" 
                  className="inline-block ml-1 h-4 w-4 object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
)}

{/* КОНФИГУРАЦИЯ ДЛЯ ТИПА 6 - ТЕКСТ */}
{newModule.typeId === 6 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Текст"</h4>
    <p className="text-sm text-gray-600 mb-4">
      Модуль "Текст" позволяет добавлять тексты с картинками. Максимальная длина текста: 2000 знаков.
    </p>
    {/* Никаких дополнительных настроек не требуется */}
  </div>
)}
{newModule.typeId === 8 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Грамматика"</h4>
    <p className="text-sm text-gray-600 mb-4">
      Модуль "Грамматика" позволяет создавать объяснения с таблицами примеров.
      Можно добавить картинку или видео для наглядности.
    </p>
  </div>
)}
{/* КОНФИГУРАЦИЯ ДЛЯ ТИПА 9 - ТЕСТ */}
{/* КОНФИГУРАЦИЯ ДЛЯ ТИПА 9 - ТЕСТ */}
{newModule.typeId === 9 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Тест"</h4>
    <p className="text-sm text-gray-600 mb-4">
      Настройте, из каких слов будет состоять вопрос теста.
    </p>
    
    {/* Настройки сетки ответов */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Количество строк (вариантов по вертикали)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={newTestModuleConfig.rows}
          onChange={(e) => setNewTestModuleConfig({
            ...newTestModuleConfig,
            rows: parseInt(e.target.value) || 3
          })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Количество столбцов (вариантов по горизонтали)
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={newTestModuleConfig.columns}
          onChange={(e) => setNewTestModuleConfig({
            ...newTestModuleConfig,
            columns: parseInt(e.target.value) || 2
          })}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
    </div>
    
    {/* ===== НОВАЯ СЕКЦИЯ: КОЛОНКИ ВОПРОСА ===== */}
    <div className="border-t pt-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium">Колонки вопроса (из каких слов состоит вопрос)</h5>
        <button
          onClick={() => {
            const newConfigs = [...newTestModuleConfig.questionColumnConfigs];
            newConfigs.push({ database: 'nouns', filters: {} });
            setNewTestModuleConfig({
              ...newTestModuleConfig,
              questionColumnConfigs: newConfigs
            });
          }}
          className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          + Добавить колонку
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mb-3">
        Каждая колонка будет одним словом в вопросе. Можно выбрать разные базы данных для каждой колонки.
      </p>
      
      {newTestModuleConfig.questionColumnConfigs.map((config, index) => (
        <div key={index} className="mb-3 p-3 border rounded bg-gray-50 relative">
          {newTestModuleConfig.questionColumnConfigs.length > 1 && (
            <button
              onClick={() => {
                const newConfigs = [...newTestModuleConfig.questionColumnConfigs];
                newConfigs.splice(index, 1);
                setNewTestModuleConfig({
                  ...newTestModuleConfig,
                  questionColumnConfigs: newConfigs
                });
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          )}
          
          <h6 className="font-medium text-sm mb-2">Колонка вопроса {index + 1}</h6>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">База данных</label>
              <select
                value={config.database}
                onChange={(e) => {
                  const newConfigs = [...newTestModuleConfig.questionColumnConfigs];
                  newConfigs[index] = { ...newConfigs[index], database: e.target.value };
                  setNewTestModuleConfig({
                    ...newTestModuleConfig,
                    questionColumnConfigs: newConfigs
                  });
                }}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="nouns">Существительные</option>
                <option value="adjectives">Прилагательные</option>
                <option value="verbs">Глаголы</option>
                <option value="pronouns">Местоимения</option>
                <option value="numerals">Числительные</option>
                <option value="adverbs">Наречия</option>
                <option value="prepositions">Предлоги, частицы</option>
                <option value="question-words">Вопросительные слова</option>
                <option value="gerunds">Деепричастия</option>
                <option value="participles">Причастия</option>
              </select>
            </div>
            
            {/* Фильтры для выбранной БД */}
            {config.database === 'nouns' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Фильтры</label>
                <select
                  value={config.filters?.case || ''}
                  onChange={(e) => {
                    const newConfigs = [...newTestModuleConfig.questionColumnConfigs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      filters: { ...newConfigs[index].filters, case: e.target.value }
                    };
                    setNewTestModuleConfig({
                      ...newTestModuleConfig,
                      questionColumnConfigs: newConfigs
                    });
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Падеж (любой)</option>
                  <option value="именительный">Именительный</option>
                  <option value="родительный">Родительный</option>
                  <option value="дательный">Дательный</option>
                  <option value="винительный">Винительный</option>
                  <option value="творительный">Творительный</option>
                  <option value="предложный">Предложный</option>
                </select>
              </div>
            )}
            
            {config.database === 'adjectives' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Фильтры</label>
                <select
                  value={config.filters?.case || ''}
                  onChange={(e) => {
                    const newConfigs = [...newTestModuleConfig.questionColumnConfigs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      filters: { ...newConfigs[index].filters, case: e.target.value }
                    };
                    setNewTestModuleConfig({
                      ...newTestModuleConfig,
                      questionColumnConfigs: newConfigs
                    });
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Падеж (любой)</option>
                  <option value="именительный">Именительный</option>
                  <option value="родительный">Родительный</option>
                  <option value="дательный">Дательный</option>
                  <option value="винительный">Винительный</option>
                  <option value="творительный">Творительный</option>
                  <option value="предложный">Предложный</option>
                </select>
              </div>
            )}
            
            {config.database === 'verbs' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Время глагола</label>
                <select
                  value={config.filters?.tense || ''}
                  onChange={(e) => {
                    const newConfigs = [...newTestModuleConfig.questionColumnConfigs];
                    newConfigs[index] = {
                      ...newConfigs[index],
                      filters: { ...newConfigs[index].filters, tense: e.target.value }
                    };
                    setNewTestModuleConfig({
                      ...newTestModuleConfig,
                      questionColumnConfigs: newConfigs
                    });
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Инфинитив</option>
                  <option value="present">Настоящее</option>
                  <option value="past">Прошедшее</option>
                  <option value="future">Будущее</option>
                </select>
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded mt-3">
        <p className="text-sm text-blue-700">
          ℹ️ Вопрос будет состоять из выбранных колонок в указанном порядке.
          Например: [Существительное] + [Глагол] + [Прилагательное] = "Кошка бежит быстро"
        </p>
      </div>
    </div>
    
    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
      <p className="text-sm text-blue-700">
        ℹ️ Всего вариантов ответов: <strong>{newTestModuleConfig.rows * newTestModuleConfig.columns}</strong>
      </p>
    </div>
  </div>
)}
{newModule.typeId === 7 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Видео"</h4>
    <p className="text-sm text-gray-600 mb-4">
      Модуль "Видео" позволяет добавлять видеоуроки с титрами и подсказками.
      Максимальный размер файла: 200MB.
    </p>
  </div>
)}
{/* КОНФИГУРАЦИЯ ДЛЯ ТИПА 1 - ЛЕКСИКА */}
{/* КОНФИГУРАЦИЯ ДЛЯ ТИПА 1 - ЛЕКСИКА */}
{newModule.typeId === 1 && (
  <div className="space-y-6 border-t pt-4">
    <h4 className="font-semibold text-lg">Конфигурация модуля "Лексика"</h4>
    <p className="text-sm text-gray-600 mb-4">
      Выберите слова из любых баз данных в произвольном порядке и количестве
    </p>
    
    {/* Выбор базы данных и темы для добавления новых слов */}
    <div className="p-4 border rounded bg-gray-50">
      <h5 className="font-medium mb-3">Добавить слова из базы данных:</h5>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">База данных</label>
          <select
            value={lexiconAddForm.database}
            onChange={(e) => {
              setLexiconAddForm({
                database: e.target.value,
                theme: ''
              });
            }}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="nouns">Существительные</option>
            <option value="adjectives">Прилагательные</option>
            <option value="verbs">Глаголы</option>
            <option value="pronouns">Местоимения</option>
            <option value="numerals">Числительные</option>
            <option value="adverbs">Наречие</option>
            <option value="prepositions">Предлоги, частицы</option>
            <option value="question-words">Вопросительные слова</option>
            <option value="gerunds">Деепричастия</option>
            <option value="participles">Причастия</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
  {getDisplayLabel('Тема урока')}
</label>
          <select
            value={lexiconAddForm.theme}
            onChange={(e) => setLexiconAddForm({...lexiconAddForm, theme: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={!lexiconAddForm.database || ['prepositions', 'question-words', 'pronouns', 'numerals'].includes(lexiconAddForm.database)}
          >
            <option value="">-- Выберите тему --</option>
            {lexiconAddForm.database && getThemesByDatabase(lexiconAddForm.database).map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* WordSelector для добавления слов */}
      {lexiconAddForm.database && (
        <div className="border rounded-lg p-4 bg-white">
          <h6 className="font-medium mb-2 text-sm">Выберите слова для добавления:</h6>
          <WordSelector
            studiedLanguage={currentLessonForModule?.studiedLanguage || 'русский'}
            theme={lexiconAddForm.theme}
            database={lexiconAddForm.database}
            filters={{}}
            onWordSelect={(selectedWord) => {
              setNewLexiconModule(prev => {
                const wordId = `${selectedWord.database || lexiconAddForm.database}_${selectedWord.imageBase || selectedWord.id}`;
                const isSelected = prev.selectedWords.some(w => 
                  `${w.database}_${w.imageBase || w.id}` === wordId
                );
                
                if (!isSelected) {
                  // Добавляем слово с указанием его базы данных
                  return {
                    ...prev,
                    selectedWords: [...prev.selectedWords, {
                      ...selectedWord,
                      database: selectedWord.database || lexiconAddForm.database,
                      sourceDatabase: lexiconAddForm.database // Сохраняем исходную БД
                    }]
                  };
                }
                return prev;
              });
            }}
            selectedWord={null}
            selectedWords={newLexiconModule.selectedWords}
          />
        </div>
      )}
    </div>

    {/* Отображение выбранных слов с группировкой по БД */}
    <div className="border rounded-lg p-4 bg-gray-50">
      <h5 className="font-medium mb-3">
        Выбранные слова ({newLexiconModule.selectedWords.length}):
      </h5>
      
      {newLexiconModule.selectedWords.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Выберите слова из списка выше
        </div>
      ) : (
       
<div className="space-y-4">
  {Object.entries(
    editLexiconModule.selectedWords.reduce((groups, word) => {
      const db = word.database || word.sourceDatabase || 'nouns';
      if (!groups[db]) groups[db] = [];
      groups[db].push(word);
      return groups;
    }, {})
  ).map(([database, words]) => (
    <div key={database} className="border rounded-lg overflow-hidden">
      <div className="bg-blue-100 px-3 py-2 font-medium text-sm">
        {getDatabaseDisplayName(database)}
      </div>
      <div className="p-2 space-y-1">
        {words.map((word, idx) => (
          <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-medium text-green-800">
                {word.displayWord || word.word || word.translations?.russian || ''}
              </span>
              {word.imagePng && (
                <img
                  src={word.imagePng}
                  alt="Preview"
                  className="h-6 w-6 object-cover rounded"
                />
              )}
            </div>
            <button
              onClick={() => setEditLexiconModule(prev => ({
                ...prev,
                selectedWords: prev.selectedWords.filter((_, i) => i !== idx)
              }))}
              className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
      )}
    </div>

    {/* Информация о типах слов */}
    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
      <h6 className="font-medium text-sm text-blue-800 mb-1">Доступные типы слов:</h6>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-white rounded">Существительные</span>
        <span className="px-2 py-1 bg-white rounded">Прилагательные</span>
        <span className="px-2 py-1 bg-white rounded">Глаголы</span>
        <span className="px-2 py-1 bg-white rounded">Местоимения</span>
        <span className="px-2 py-1 bg-white rounded">Числительные</span>
        <span className="px-2 py-1 bg-white rounded">Наречия</span>
        <span className="px-2 py-1 bg-white rounded">Предлоги, частицы</span>
        <span className="px-2 py-1 bg-white rounded">Вопросительные слова</span>
        <span className="px-2 py-1 bg-white rounded">Деепричастия</span>
        <span className="px-2 py-1 bg-white rounded">Причастия</span>
      </div>
    </div>
  </div>
)}
                           
                            {/* Конфигурация для типа "лексика предложение" */}
                            {newModule.typeId === 3 && (
                                <>
                                    {/* Количество колонок */}
                                    <div className="grid grid-cols-2 gap-4 items-center">
                                        <label className="text-sm font-medium text-right">Количество колонок</label>
                                      <select
  value={newModule.columnsCount}
  onChange={(e) => {
    const count = parseInt(e.target.value);
    const newConfigs = Array.from({ length: count }, (_, i) =>
      newModule.columnConfigs[i] || { database: '', filters: {} }
    );
    setNewModule({
      ...newModule,
      columnsCount: count,
      columnConfigs: newConfigs
    });
  }}
  className="border border-gray-300 rounded px-3 py-2"
>
  {[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(num => (  // <-- Измените здесь на 2-20
    <option key={num} value={num}>{num}</option>
  ))}
</select>
                                    </div>
                                    {/* Конфигурации колонок */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Конфигурация колонок:</h4>
                                        {newModule.columnConfigs.map((config, index) => (
                                            <div key={index} className="p-4 border rounded bg-gray-50">
                                                <h5 className="font-medium mb-2">Колонка {index + 1}</h5>
                                              
                                                {/* Выбор базы данных */}
                                                <div className="grid grid-cols-2 gap-4 items-center mb-2">
                                                    <label className="text-sm font-medium">База данных</label>
                                                   <select
  value={config.database}
  onChange={(e) => updateColumnConfig(index, 'database', e.target.value)}
  className="border border-gray-300 rounded px-3 py-2"
>
  <option value="">-- Выберите БД --</option>
  <option value="nouns">Существительные</option>
  <option value="adjectives">Прилагательные</option>
  <option value="verbs">Глаголы</option>
  <option value="pronouns">Местоимения</option>
  <option value="numerals">Числительные</option>
  <option value="adverbs">Наречия</option>
  <option value="prepositions">Предлоги, частицы</option>
  <option value="question-words">Вопросительные слова</option>
  <option value="gerunds">Деепричастия</option> 
  <option value="participles">Причастия</option>{/* ← ДОБАВЬТЕ ЭТО */}
</select>
                                                </div>
                                                {/* Фильтры в зависимости от типа БД */}
                                              {config.database === 'nouns' && (
  <>
    <div className="grid grid-cols-2 gap-4 items-center mb-2">
      <label className="text-sm font-medium">Число</label>
      <select
        value={config.filters.number || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          number: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любое</option>
        <option value="единственное">Единственное</option>
        <option value="множественное">Множественное</option>
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium">Падеж</label>
      <select
        value={config.filters.case || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          case: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
    </div>
  </>
)}

                                               {config.database === 'adjectives' && (
  <>
    <div className="grid grid-cols-2 gap-4 items-center mb-2">
      <label className="text-sm font-medium">Число</label>
      <select
        value={config.filters.number || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          number: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любое</option>
        <option value="единственное">Единственное</option>
        <option value="множественное">Множественное</option>
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4 items-center mb-2">
      <label className="text-sm font-medium">Род</label>
      <select
        value={config.filters.gender || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          gender: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="мужской">Мужской</option>
        <option value="женский">Женский</option>
        <option value="средний">Средний</option>
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4 items-center">
      <label className="text-sm font-medium">Падеж</label>
      <select
        value={config.filters.case || ''}
        onChange={(e) => updateColumnConfig(index, 'filters', {
          ...config.filters,
          case: e.target.value
        })}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Любой</option>
        <option value="именительный">Именительный</option>
        <option value="родительный">Родительный</option>
        <option value="дательный">Дательный</option>
        <option value="винительный">Винительный</option>
        <option value="творительный">Творительный</option>
        <option value="предложный">Предложный</option>
      </select>
    </div>
  </>
)}
   {config.database === 'question-words' && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                    <h6 className="text-xs font-medium mb-1">Фильтры для вопросительного слова:</h6>
                    <div className="grid grid-cols-3 gap-2">
                        <select
                            value={config.filters?.number || ''}
                            onChange={(e) => updateColumnConfig(index, 'filters', {
                                ...config.filters,
                                number: e.target.value
                            })}
                            className="text-xs border rounded px-1 py-1"
                        >
                            <option value="">Число</option>
                            <option value="единственное">Ед.ч</option>
                            <option value="множественное">Мн.ч</option>
                        </select>
                        <select
                            value={config.filters?.gender || ''}
                            onChange={(e) => updateColumnConfig(index, 'filters', {
                                ...config.filters,
                                gender: e.target.value
                            })}
                            className="text-xs border rounded px-1 py-1"
                        >
                            <option value="">Род</option>
                            <option value="мужской">Муж.</option>
                            <option value="женский">Жен.</option>
                            <option value="средний">Ср.</option>
                        </select>
                        <select
                            value={config.filters?.case || ''}
                            onChange={(e) => updateColumnConfig(index, 'filters', {
                                ...config.filters,
                                case: e.target.value
                            })}
                            className="text-xs border rounded px-1 py-1"
                        >
                            <option value="">Падеж</option>
                            <option value="именительный">Им.</option>
                            <option value="родительный">Род.</option>
                            <option value="дательный">Дат.</option>
                            <option value="винительный">Вин.</option>
                            <option value="творительный">Тв.</option>
                            <option value="предложный">Пр.</option>
                        </select>
                    </div>
                </div>
            )}
{config.database === 'verbs' && (
  <VerbFormSelector
    config={config.filters || {}}
    onConfigChange={(field, value) => {
      updateColumnConfig(index, 'filters', {
        ...config.filters,
        [field]: value
      });
    }}
  />
)}

          {config.database === 'pronouns' && (
  <PronounFormSelector
    config={config.filters || {}}
    onConfigChange={(field, value) => {
      updateColumnConfig(index, 'filters', {
        ...config.filters,
        [field]: value
      });
    }}
  />
)}                                  </div>
                                        ))}
                                    </div>
                                </>
                            )}

                        </div>
                        <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => setShowCreateModuleModal(false)}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
           onClick={() => {
    if (newModule.typeId === 1) {
      createLexiconModule();
    } else if (newModule.typeId === 2) {
      // существующая логика для теста
      createModule();
    } else if (newModule.typeId === 3) {
      // существующая логика для фраз
      createModule();
    } else if (newModule.typeId === 4) {
      // существующая логика для вопросов
      createModule();
    } else {
      createModule();
    }
  }}
          disabled={
    !newModule.title || 
    !newModule.typeId || 
    (newModule.typeId === 1 && newLexiconModule.selectedWords.length === 0)
  }
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Создать модуль
        </button>
      </div>
                    </div>
                </div>
            )}
       
            {/* Модальное окно добавления предложения */}
{showSentenceModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {editingSentence ? 'Редактировать фразу' : 'Добавить фразу'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {currentLessonForModule.config?.columnConfigs?.map((config, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-3 text-lg">
              Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
            </h4>
            
            <SentenceColumn
              config={config}
              columnIndex={index}
              columnData={newSentence.columnData[index] || {}}
              onColumnChange={(colIndex, field, value) => {
                const updatedData = [...newSentence.columnData];
                if (!updatedData[colIndex]) {
                  updatedData[colIndex] = {};
                }
                updatedData[colIndex] = { ...updatedData[colIndex], [field]: value };
                
                // Если очищаем слово, очищаем и wordData
                if (field === 'word' && !value) {
                  updatedData[colIndex].wordData = null;
                }
                
                setNewSentence({...newSentence, columnData: updatedData});
              }}
              lessonData={lessonData}
              
               getAvailableThemes={getAvailableThemes}
  getThemesByDatabase={getThemesByDatabase}
            />
            
            {/* Индикатор выбранного слова */}
            {newSentence.columnData[index]?.word && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-green-800">
                      Выбрано: {newSentence.columnData[index].word}
                    </span>
                    {(newSentence.columnData[index].number || 
                      newSentence.columnData[index].gender || 
                      newSentence.columnData[index].case) && (
                      <div className="text-xs text-gray-600 mt-1">
                        {newSentence.columnData[index].number && `Число: ${newSentence.columnData[index].number} `}
                        {newSentence.columnData[index].gender && `Род: ${newSentence.columnData[index].gender} `}
                        {newSentence.columnData[index].case && `Падеж: ${newSentence.columnData[index].case}`}
                      </div>
                    )}
                    {newSentence.columnData[index]?.wordData?.imagePng && (
                      <div className="mt-1">
                        <img
                          src={newSentence.columnData[index].wordData.imagePng}
                          alt="Preview"
                          className="h-10 w-10 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const updatedData = [...newSentence.columnData];
                      updatedData[index] = {
                        lesson: updatedData[index]?.lesson || '',
                        number: '',
                        gender: '',
                        case: '',
                        word: '',
                        wordData: null
                      };
                      setNewSentence({
                        ...newSentence,
                        columnData: updatedData
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {/* Секция перевода фразы */}

          </div>
        ))}
        {/* Секция перевода фразы */}
<div className="mb-6 p-4 border rounded bg-blue-50">
  <h4 className="font-semibold mb-2">
    Перевод фразы на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКИЙ'}
  </h4>
  
  {/* Автоматический перевод (информационный) */}
 
  
  {/* Редактируемое поле для ручного перевода */}
  <div>
    <label className="text-sm text-gray-600 mb-1 block">Исправленный перевод:</label>
    <textarea
      value={newSentence.customTranslation || ''}
      onChange={(e) => setNewSentence({
        ...newSentence,
        customTranslation: e.target.value
      })}
      placeholder={`Введите исправленный перевод на ${lessonData?.hintLanguage || 'английский'}`}
      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
    />
    <p className="text-xs text-gray-500 mt-1">
      Если оставить пустым, будет использован автоматический перевод
    </p>
  </div>
</div>
      </div>

      {/* Картинка предложения */}
     {/* Картинка предложения */}
<div className="mb-6 p-4 border rounded bg-gray-50">
  <h4 className="font-semibold mb-2">Картинка предложения</h4>
  <div className="space-y-3">
    {newSentence.image && (
      <div className="relative inline-block">
        <img
          src={newSentence.image}
          alt="Preview"
          className="h-32 w-32 object-cover rounded border"
        />
        <button
          onClick={() => setNewSentence({...newSentence, image: ''})}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
        >
          ×
        </button>
      </div>
    )}
    
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <input
          type="text"
          value={newSentence.image}
          onChange={(e) => setNewSentence({...newSentence, image: e.target.value})}
          placeholder="URL картинки или загрузите файл"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          {!newSentence.image ? 
            'Автоматически будет использована картинка первого слова' : 
            'Указана пользовательская картинка'}
        </p>
      </div>
      
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleSentenceImageUpload}
          className="hidden"
          id={`upload-sentence-image-${Date.now()}`}
          disabled={uploadingImage}
        />
        <label 
          htmlFor={`upload-sentence-image-${Date.now()}`}
          className={`cursor-pointer px-4 py-2 rounded whitespace-nowrap flex items-center gap-2 ${
            uploadingImage && uploadingImageType === 'sentence'
              ? 'bg-gray-400 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploadingImage && uploadingImageType === 'sentence' ? (
            <>
              <span className="animate-spin">⏳</span> Загрузка...
            </>
          ) : (
            <>
              <span>📁</span> Загрузить
            </>
          )}
        </label>
      </div>
    </div>
    
    {/* Индикатор автоматической картинки */}
    {!newSentence.image && newSentence.columnData[0]?.wordData?.imagePng && (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
        <p className="text-xs text-green-600 flex items-center gap-1">
          <span>ℹ️</span>
          Будет использована картинка первого слова
        </p>
      </div>
    )}
  </div>
</div>

      {/* Предварительный просмотр предложения */}
     

      {/* Таблица существующих предложений */}
      <SentenceTable
        sentences={moduleSentences}
        moduleConfig={currentLessonForModule}
       onEdit={(sentence) => {
  console.log('Editing sentence:', sentence);
  setEditingSentence(sentence);
  
  // Преобразуем структуру предложения в формат columnData
  const columnData = sentence.sentenceStructure.map(wordObj => ({
    lesson: wordObj.lesson || '',
    number: wordObj.number || '',
    gender: wordObj.gender || '',
    case: wordObj.case || '',
    word: wordObj.word || '',
    wordData: wordObj.wordData || null
  }));
  
  // Дополняем до нужного количества колонок
  const columnCount = currentLessonForModule.config?.columnConfigs?.length || 2;
  while (columnData.length < columnCount) {
    columnData.push({
      lesson: '',
      number: '',
      gender: '',
      case: '',
      word: '',
      wordData: null
    });
  }
  
  setNewSentence({
    columnData: columnData,
    image: sentence.image || '',
    _id: sentence._id
  });
}}
        onDelete={deleteSentence}
      />

      <div className="mt-6 flex gap-2 justify-end">
        <button
          onClick={() => {
            setShowSentenceModal(false);
            setEditingSentence(null);
            setModuleSentences([]);
            resetSentenceForm();
          }}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
          onClick={addOrUpdateSentence}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {editingSentence ? 'Сохранить изменения' : 'Добавить фразу'}
        </button>
      </div>
    </div>
  </div>
)}
{showVerbConjugationModal && (
    <VerbConjugationModal
        isOpen={showVerbConjugationModal}
        onClose={() => setShowVerbConjugationModal(false)}
        word={selectedVerb}
        onSave={() => {
            console.log('Спряжение глагола сохранено');
        }}
    />
)}
{showParticipleCaseModal && (
  <ParticipleCaseManagementModal
    isOpen={showParticipleCaseModal}
    onClose={() => setShowParticipleCaseModal(false)}
    word={selectedParticiple}
    onSave={() => {
      console.log('Падежи причастия сохранены');
    }}
    language="русский"
  />
)}
{showNumeralCaseModal && (
  <NumeralCaseManagementModal
    isOpen={showNumeralCaseModal}
    onClose={() => setShowNumeralCaseModal(false)}
    word={selectedNumeral}
    onSave={() => {
      console.log('Падежи числительного сохранены');
    }}
    language="русский"
  />
)}
{showPronounDeclensionModal && (
  <PronounDeclensionModal
    isOpen={showPronounDeclensionModal}
    onClose={() => setShowPronounDeclensionModal(false)}
    word={selectedWord}
    onSave={() => {
      console.log('Склонения местоимения сохранены');
    }}
    language="русский"
  />
)}
{showQuestionWordCaseModal && (
  <QuestionWordCaseManagementModal
    isOpen={showQuestionWordCaseModal}
    onClose={() => setShowQuestionWordCaseModal(false)}
    word={selectedWord}
    onSave={() => {
      console.log('Падежи вопросительного слова сохранены');
    }}
    language="русский"
  />
)}
{/* Модальное окно редактирования модуля Лексика */}
{/* Модальное окно редактирования модуля Лексика */}
{showEditModuleModal && editingModule && editingModule.typeId === 1 && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        Редактировать модуль: {editingModule.title}
      </h3>
      
      <div className="space-y-6">
        {/* Информация о модуле */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Текущее количество слов:</strong> {editLexiconModule.selectedWords.length}
          </p>
        </div>

        {/* Выбор базы данных и темы для добавления новых слов */}
        <div className="p-4 border rounded bg-gray-50">
          <h5 className="font-medium mb-3">Добавить слова из базы данных:</h5>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">База данных</label>
              <select
                value={editLexiconAddForm.database}
                onChange={(e) => {
                  setEditLexiconAddForm({
                    database: e.target.value,
                    theme: ''
                  });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="nouns">Существительные</option>
                <option value="adjectives">Прилагательные</option>
                <option value="verbs">Глаголы</option>
                <option value="pronouns">Местоимения</option>
                <option value="numerals">Числительные</option>
                <option value="adverbs">Наречие</option>
                <option value="prepositions">Предлоги, частицы</option>
                <option value="question-words">Вопросительные слова</option>
                <option value="gerunds">Деепричастия</option>
                <option value="participles">Причастия</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Тема урока</label>
              <select
                value={editLexiconAddForm.theme}
                onChange={(e) => setEditLexiconAddForm({...editLexiconAddForm, theme: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                disabled={!editLexiconAddForm.database || ['prepositions', 'question-words', 'pronouns', 'numerals'].includes(editLexiconAddForm.database)}
              >
                <option value="">-- Выберите тему --</option>
                {editLexiconAddForm.database && getThemesByDatabase(editLexiconAddForm.database).map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* WordSelector для добавления слов */}
          {editLexiconAddForm.database && (
            <div className="border rounded-lg p-4 bg-white">
              <h6 className="font-medium mb-2 text-sm">Выберите слова для добавления:</h6>
              <WordSelector
                studiedLanguage={lessonData?.studiedLanguage || 'русский'}
                theme={editLexiconAddForm.theme}
                database={editLexiconAddForm.database}
                filters={{}}
                onWordSelect={(selectedWord) => {
                  setEditLexiconModule(prev => {
                    const wordId = `${selectedWord.database || editLexiconAddForm.database}_${selectedWord.imageBase || selectedWord.id}`;
                    const isSelected = prev.selectedWords.some(w => 
                      `${w.database || w.sourceDatabase}_${w.imageBase || w.id}` === wordId
                    );
                    
                    if (!isSelected) {
                      return {
                        ...prev,
                        selectedWords: [...prev.selectedWords, {
                          ...selectedWord,
                          database: selectedWord.database || editLexiconAddForm.database,
                          sourceDatabase: editLexiconAddForm.database
                        }]
                      };
                    }
                    return prev;
                  });
                }}
                selectedWord={null}
                selectedWords={editLexiconModule.selectedWords}
              />
            </div>
          )}
        </div>

        {/* Отображение выбранных слов с группировкой по БД */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h5 className="font-medium mb-3">
            Выбранные слова ({editLexiconModule.selectedWords.length}):
          </h5>
          
          {editLexiconModule.selectedWords.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Нет выбранных слов. Добавьте слова из базы данных выше.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                editLexiconModule.selectedWords.reduce((groups, word) => {
                  const db = word.database || word.sourceDatabase || 'nouns';
                  if (!groups[db]) groups[db] = [];
                  groups[db].push(word);
                  return groups;
                }, {})
              ).map(([database, words]) => (
                <div key={database} className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-100 px-3 py-2 font-medium text-sm">
                    {getDatabaseDisplayName(database)}
                  </div>
                  <div className="p-2 space-y-1">
                    {words.map((word, idx) => (
                      <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium text-green-800">
                            {word.displayWord || word.word || word.translations?.russian || ''}
                          </span>
                          {word.imagePng && (
                            <img
                              src={word.imagePng}
                              alt="Preview"
                              className="h-6 w-6 object-cover rounded"
                            />
                          )}
                        </div>
                      <button
  onClick={() => {
    const wordToRemove = word;
    const wordId = wordToRemove.imageBase || wordToRemove.id;
    const wordDatabase = wordToRemove.database || wordToRemove.sourceDatabase;
    
    console.log('Removing word:', { wordId, wordDatabase, wordToRemove });
    
    setEditLexiconModule(prev => ({
      ...prev,
      selectedWords: prev.selectedWords.filter(w => {
        const currentId = w.imageBase || w.id;
        const currentDatabase = w.database || w.sourceDatabase;
        // Удаляем только то слово, которое совпадает по ID и БД
        return !(currentId === wordId && currentDatabase === wordDatabase);
      })
    }));
  }}
  className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
>
  ×
</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Информация о типах слов */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <h6 className="font-medium text-sm text-blue-800 mb-1">Доступные типы слов:</h6>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-white rounded">Существительные</span>
            <span className="px-2 py-1 bg-white rounded">Прилагательные</span>
            <span className="px-2 py-1 bg-white rounded">Глаголы</span>
            <span className="px-2 py-1 bg-white rounded">Местоимения</span>
            <span className="px-2 py-1 bg-white rounded">Числительные</span>
            <span className="px-2 py-1 bg-white rounded">Наречия</span>
            <span className="px-2 py-1 bg-white rounded">Предлоги, частицы</span>
            <span className="px-2 py-1 bg-white rounded">Вопросительные слова</span>
            <span className="px-2 py-1 bg-white rounded">Деепричастия</span>
            <span className="px-2 py-1 bg-white rounded">Причастия</span>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowEditModuleModal(false);
              setEditingModule(null);
              setEditLexiconModule({
                selectedWords: []
              });
              setEditLexiconAddForm({
                database: 'nouns',
                theme: ''
              });
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={updateLexiconModule}
            disabled={editLexiconModule.selectedWords.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* МОДАЛЬНОЕ ОКНО ДЛЯ МОДУЛЯ "ТЕКСТ" */}
{showTextModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {editingText ? 'Редактировать текст' : 'Добавить текст'}
      </h3>
      
      <div className="space-y-6">
        {/* Картинка */}
        <div className="p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Картинка (опционально)</h4>
          <div className="space-y-3">
            {newText.image && (
              <div className="relative inline-block">
                <img
                  src={newText.image}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded border"
                />
                <button
                  onClick={() => setNewText({...newText, image: ''})}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newText.image}
                  onChange={(e) => setNewText({...newText, image: e.target.value})}
                  placeholder="URL картинки или загрузите файл"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTextImageUpload}
                  className="hidden"
                  id={`upload-text-image-${Date.now()}`}
                  disabled={uploadingImage}
                />
                <label 
                  htmlFor={`upload-text-image-${Date.now()}`}
                  className={`cursor-pointer px-4 py-2 rounded whitespace-nowrap flex items-center gap-2 ${
                    uploadingImage && uploadingImageType === 'text'
                      ? 'bg-gray-400 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploadingImage && uploadingImageType === 'text' ? (
                    <>
                      <span className="animate-spin">⏳</span> Загрузка...
                    </>
                  ) : (
                    <>
                      <span>📁</span> Загрузить
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Текст */}
        <div className="p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-2">Текст (макс. 2000 знаков)</h4>
          <textarea
            value={newText.text}
            onChange={(e) => setNewText({...newText, text: e.target.value})}
            placeholder="Введите текст..."
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            maxLength={2000}
          />
          <div className="flex justify-between mt-1 text-sm">
            <span className="text-gray-500">Символов: {newText.text.length}/2000</span>
            {newText.text.length > 2000 && (
              <span className="text-red-500">Превышен лимит!</span>
            )}
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowTextModal(false);
              setNewText({ image: '', text: '' });
              setEditingText(null);
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={addOrUpdateText}
            disabled={!newText.text.trim() || newText.text.length > 2000}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {editingText ? 'Сохранить изменения' : 'Добавить текст'}
          </button>
        </div>

        {/* Таблица существующих текстов */}
        <TextModuleTable
          texts={moduleTexts}
          onEdit={(text) => {
            setEditingText(text);
            setNewText({
              image: text.image || '',
              text: text.text || ''
            });
          }}
          onDelete={deleteText}
        />
      </div>
    </div>
  </div>
)}
{/* МОДАЛЬНОЕ ОКНО ДЛЯ МОДУЛЯ "ВИДЕО" */}
{showVideoModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {editingVideo ? 'Редактировать видео' : 'Добавить видео'}
      </h3>
      
      <div className="space-y-6">
        {/* Название видео */}
        <div>
          <label className="block text-sm font-medium mb-2">Название видео</label>
          <input
            type="text"
            value={newVideo.title}
            onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Введите название видео"
          />
        </div>

        {/* Загрузка видео файла */}
        <div>
          <label className="block text-sm font-medium mb-2">Видео файл</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewVideo({
                    ...newVideo,
                    videoFile: file,
                    videoPreview: URL.createObjectURL(file)
                  });
                  
                  // Автоматическое определение длительности
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    setNewVideo(prev => ({
                      ...prev,
                      duration: Math.round(video.duration)
                    }));
                  };
                  video.src = URL.createObjectURL(file);
                }
              }}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer block">
              {newVideo.videoFile ? (
                <div className="space-y-2">
                  <div className="text-green-600">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-medium">{newVideo.videoFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(newVideo.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {newVideo.duration > 0 && (
                    <p className="text-sm text-gray-500">
                      Длительность: {Math.floor(newVideo.duration / 60)}:{(newVideo.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                  {newVideo.videoPreview && (
                    <div className="mt-4">
                      <video controls className="w-full max-h-64 rounded">
                        <source src={newVideo.videoPreview} type={newVideo.videoFile.type} />
                      </video>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-medium">Нажмите для загрузки видео файла</p>
                  <p className="text-sm text-gray-500">
                    Поддерживаемые форматы: MP4, WebM, OGV
                  </p>
                  <p className="text-sm text-gray-500">Максимальный размер: 200MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Титры на оригинальном языке */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Титры на {lessonData?.studiedLanguage ? lessonData.studiedLanguage.toUpperCase() : 'ОРИГИНАЛЬНОМ'} языке
          </label>
          <textarea
            value={newVideo.originalTranscript}
            onChange={(e) => setNewVideo({...newVideo, originalTranscript: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            placeholder="Введите текст титров..."
          />
        </div>

        {/* Титры на языке подсказки */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Титры на {lessonData?.hintLanguage ? lessonData.hintLanguage.toUpperCase() : 'АНГЛИЙСКОМ'} языке
            <span className="text-gray-500 text-sm font-normal ml-2">(необязательно)</span>
          </label>
          <textarea
            value={newVideo.hintTranscript}
            onChange={(e) => setNewVideo({...newVideo, hintTranscript: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-40"
            placeholder="Введите перевод титров..."
          />
        </div>

        {/* Подсказка */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Подсказка
            <span className="text-gray-500 text-sm font-normal ml-2">(необязательно)</span>
          </label>
          <textarea
            value={newVideo.hint}
            onChange={(e) => setNewVideo({...newVideo, hint: e.target.value})}
            className="w-full border border-gray-300 rounded px-3 py-2 h-32"
            placeholder="Введите подсказку для студента..."
          />
        </div>

        {/* Индикатор загрузки */}
        {isUploading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-700">
                Загрузка видео файла...
              </span>
              <span className="text-sm font-medium text-blue-700">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Пожалуйста, не закрывайте это окно...
            </p>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowVideoModal(false);
              if (newVideo.videoPreview) {
                URL.revokeObjectURL(newVideo.videoPreview);
              }
              setNewVideo({
                title: '',
                videoFile: null,
                videoPreview: null,
                originalTranscript: '',
                hintTranscript: '',
                hint: '',
                duration: 0
              });
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={addVideo}
            disabled={!newVideo.title || !newVideo.videoFile || !newVideo.originalTranscript}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Добавить видео
          </button>
        </div>

        {/* Таблица существующих видео */}
        <VideoTable
          videos={moduleVideos}
          onEdit={(video) => {
            setEditingVideo(video);
            setNewVideo({
              title: video.title || '',
              videoFile: null,
              videoPreview: null,
              originalTranscript: video.originalTranscript || '',
              hintTranscript: video.hintTranscript || '',
              hint: video.hint || '',
              duration: video.duration || 0
            });
          }}
          onDelete={deleteVideo}
        />
      </div>
    </div>
  </div>
)}
{/* МОДАЛЬНОЕ ОКНО ДЛЯ МОДУЛЯ "ГРАММАТИКА" */}
{showGrammarModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {editingGrammar ? 'Редактировать грамматический модуль' : 'Создать грамматический модуль'}
      </h3>
      
      <div className="space-y-6">
        {/* Выбор типа медиа */}
        <div className="p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Тип медиа для объяснения</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mediaType"
                value="image"
                checked={newGrammar.mediaType === 'image'}
                onChange={(e) => setNewGrammar({...newGrammar, mediaType: e.target.value})}
              />
              <span>Картинка</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mediaType"
                value="video"
                checked={newGrammar.mediaType === 'video'}
                onChange={(e) => setNewGrammar({...newGrammar, mediaType: e.target.value})}
              />
              <span>Видео</span>
            </label>
          </div>
        </div>

        {/* Загрузка медиа */}
       {newGrammar.mediaType === 'image' ? (
  <div className="p-4 border rounded bg-gray-50">
    <h4 className="font-semibold mb-3">Картинка для объяснения</h4>
    <div className="space-y-3">
      {newGrammar.image && (
        <div className="relative inline-block">
          <img
            src={newGrammar.image}
            alt="Preview"
            className="h-32 w-32 object-cover rounded border"
          />
          <button
            onClick={() => setNewGrammar({...newGrammar, image: ''})}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={newGrammar.image}
            onChange={(e) => setNewGrammar({...newGrammar, image: e.target.value})}
            placeholder="URL картинки или загрузите файл"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleGrammarImageUpload}
            className="hidden"
            id={`upload-grammar-image-${Date.now()}`}
            disabled={uploadingImage}
          />
          <label 
            htmlFor={`upload-grammar-image-${Date.now()}`}
            className={`cursor-pointer px-4 py-2 rounded whitespace-nowrap flex items-center gap-2 ${
              uploadingImage && uploadingImageType === 'grammar'
                ? 'bg-gray-400 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploadingImage && uploadingImageType === 'grammar' ? (
              <>
                <span className="animate-spin">⏳</span> Загрузка...
              </>
            ) : (
              <>
                <span>📁</span> Загрузить
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  </div>
) : (
          <div className="p-4 border rounded bg-gray-50">
            <h4 className="font-semibold mb-3">Видео для объяснения</h4>
            <div className="space-y-3">
              {newGrammar.video && (
                <div className="relative">
                  <video controls className="w-full max-h-64 rounded">
                    <source src={newGrammar.video} type="video/mp4" />
                  </video>
                  <button
                    onClick={() => setNewGrammar({...newGrammar, video: '', videoFile: null, videoPreview: null})}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {newGrammar.videoPreview && !newGrammar.video && (
                <div className="relative">
                  <video controls className="w-full max-h-64 rounded">
                    <source src={newGrammar.videoPreview} type={newGrammar.videoFile?.type} />
                  </video>
                  <button
                    onClick={() => setNewGrammar({...newGrammar, videoFile: null, videoPreview: null})}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleGrammarVideoUpload}
                  className="hidden"
                  id={`upload-grammar-video-${Date.now()}`}
                  disabled={uploadingVideo}
                />
                <label 
                  htmlFor={`upload-grammar-video-${Date.now()}`}
                  className={`cursor-pointer px-4 py-2 rounded whitespace-nowrap inline-block ${
                    uploadingVideo
                      ? 'bg-gray-400 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {uploadingVideo ? 'Загрузка...' : 'Загрузить видео'}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Текстовое объяснение */}
        <div className="p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Текстовое объяснение</h4>
          <textarea
            value={newGrammar.explanation}
            onChange={(e) => setNewGrammar({...newGrammar, explanation: e.target.value})}
            placeholder="Введите объяснение грамматического правила..."
            className="w-full border border-gray-300 rounded px-3 py-2 h-32"
          />
        </div>

        {/* Настройки таблицы */}
       {/* Настройки таблицы */}
<div className="p-4 border rounded bg-gray-50">
  <h4 className="font-semibold mb-3">Настройки таблицы примеров</h4>
  
  {/* Добавляем выбор темы для всей таблицы */}
  {/* <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Тема для слов</label>
    <select
      value={newGrammar.tableConfig.theme || ''}
      onChange={(e) => {
        const theme = e.target.value;
        setNewGrammar({
          ...newGrammar,
          tableConfig: {
            ...newGrammar.tableConfig,
            theme: theme
          }
        });
      }}
      className="w-full border border-gray-300 rounded px-3 py-2"
    >
      <option value="">Все темы (покажет все слова)</option>
      {getAvailableThemes().map(theme => (
        <option key={theme} value={theme}>{theme}</option>
      ))}
    </select>
    <p className="text-xs text-gray-500 mt-1">
      Выберите тему, чтобы фильтровать слова. Если оставить пустым, будут показаны все слова из выбранной базы данных.
    </p>
  </div> */}
  
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <label className="block text-sm font-medium mb-1">Количество строк</label>
      <input
        type="number"
        min="1"
        max="20"
        value={newGrammar.tableConfig.rows}
        onChange={(e) => {
          const rows = parseInt(e.target.value) || 1;
          const newData = initializeTableData(rows, newGrammar.tableConfig.columns);
          setNewGrammar({
            ...newGrammar,
            tableConfig: {
              ...newGrammar.tableConfig,
              rows,
              data: newData
            }
          });
        }}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Количество столбцов</label>
      <input
        type="number"
        min="1"
        max="10"
        value={newGrammar.tableConfig.columns}
        onChange={(e) => {
          const columns = parseInt(e.target.value) || 1;
          const newData = initializeTableData(newGrammar.tableConfig.rows, columns);
          setNewGrammar({
            ...newGrammar,
            tableConfig: {
              ...newGrammar.tableConfig,
              columns,
              data: newData
            }
          });
        }}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
    </div>
  </div>

  {/* Таблица для редактирования */}
  <GrammarTable
  config={newGrammar.tableConfig}
  onConfigChange={(newConfig) => setNewGrammar({
    ...newGrammar,
    tableConfig: newConfig
  })}
  lessonData={lessonData}
  getAvailableThemes={getAvailableThemes} // ← ДОБАВЛЕНО
  getThemesByDatabase={getThemesByDatabase}
/>
</div>

        {/* Кнопки управления */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowGrammarModal(false);
              setEditingGrammar(null);
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={addOrUpdateGrammar}
            disabled={!newGrammar.explanation.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {editingGrammar ? 'Сохранить изменения' : 'Создать модуль'}
          </button>
        </div>

        {/* Список существующих грамматических модулей */}
        <div className="mt-8">
          <h4 className="font-semibold mb-3">Существующие грамматические модули:</h4>
          {moduleGrammar.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Нет добавленных грамматических модулей
            </div>
          ) : (
            <div className="space-y-4">
              {moduleGrammar.map((grammar, index) => (
                <div key={grammar._id} className="border rounded-lg p-4 bg-gray-50 relative">
                  <button
                    onClick={() => deleteGrammar(grammar._id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">Грамматический модуль {index + 1}</h5>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {grammar.mediaType === 'image' ? 'С картинкой' : 'С видео'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
  <div>
    <h6 className="text-sm font-medium mb-1">Медиа:</h6>
    {grammar.mediaType === 'image' && grammar.image && (
      <img 
        src={grammar.image} 
        alt="Preview" 
        className="h-20 w-20 object-cover rounded border"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    )}
    {grammar.mediaType === 'video' && grammar.video && (
      <video controls className="w-full max-h-32 rounded">
        <source src={grammar.video} type="video/mp4" />
      </video>
    )}
    {!grammar.image && !grammar.video && (
      <span className="text-sm text-gray-500">Нет медиа</span>
    )}
  </div>
  <div>
    <h6 className="text-sm font-medium mb-1">Объяснение:</h6>
    <p className="text-sm text-gray-600 line-clamp-3">{grammar.explanation}</p>
  </div>
</div>
                  
                  <GrammarViewTable tableConfig={grammar.tableConfig} />
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => openGrammarModal(currentLessonForModule, grammar)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
{/* Модальное окно для озвучки слов */}
{showAudioModal && selectedWordForAudio && selectedLanguageForAudio && (
  <AudioWordModal
    isOpen={showAudioModal}
    onClose={() => {
      setShowAudioModal(false);
      setSelectedWordForAudio(null);
      setSelectedLanguageForAudio(null);
    }}
    word={selectedWordForAudio}
    language={selectedLanguageForAudio}
    onAudioSaved={async () => {
      console.log('Audio saved, reloading table...');
      
      // 1. Перезагружаем данные с сервера
      const response = await fetch(`${API_BASE_URL}/db`);
      const data = await response.json();
      
      // 2. Обновляем таблицу существительных
      if (data.table && Array.isArray(data.table)) {
        setTableData(data.table);
        
        // 3. Если сейчас открыта таблица существительных - обновляем отображение
        if (activeTable === 'nouns') {
          setActiveTableData(data.table);
        }
      }
      
      console.log('Table reloaded successfully');
    }}
  />
)}
{/* Модальное окно для озвучки прилагательных */}
{showAdjectiveAudioModal && selectedAdjectiveForAudio && selectedAdjectiveLanguage && (
  <AudioAdjectiveModal
    isOpen={showAdjectiveAudioModal}
    onClose={() => {
      setShowAdjectiveAudioModal(false);
      setSelectedAdjectiveForAudio(null);
      setSelectedAdjectiveLanguage(null);
    }}
    word={selectedAdjectiveForAudio}
    language={selectedAdjectiveLanguage}
    onAudioSaved={async () => {
      console.log('Adjective audio saved, reloading table...');
      
      // Перезагружаем таблицу прилагательных
      const response = await fetch(`${API_BASE_URL}/adjectives-table`);
      const freshData = await response.json();
      setAdjectivesTableData(freshData);
      
      if (activeTable === 'adjectives') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{showQuestionWordAudioModal && selectedQuestionWordForAudio && selectedQuestionWordLanguage && (
  <AudioQuestionWordModal
    isOpen={showQuestionWordAudioModal}
    onClose={() => {
      setShowQuestionWordAudioModal(false);
      setSelectedQuestionWordForAudio(null);
      setSelectedQuestionWordLanguage(null);
    }}
    word={selectedQuestionWordForAudio}
    language={selectedQuestionWordLanguage}
    onAudioSaved={async () => {
      console.log('Question word audio saved, reloading table...');
      
      // Перезагружаем таблицу вопросительных слов
      const response = await fetch(`${API_BASE_URL}/question-words`);
      const freshData = await response.json();
      setQuestionWordsData(freshData);
      
      if (activeTable === 'question-words') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки предлогов и частиц */}
{showPrepositionAudioModal && selectedPrepositionForAudio && selectedPrepositionLanguage && (
  <AudioPrepositionModal
    isOpen={showPrepositionAudioModal}
    onClose={() => {
      setShowPrepositionAudioModal(false);
      setSelectedPrepositionForAudio(null);
      setSelectedPrepositionLanguage(null);
    }}
    word={selectedPrepositionForAudio}
    language={selectedPrepositionLanguage}
    onAudioSaved={async () => {
      console.log('Preposition audio saved, reloading table...');
      
      // Перезагружаем таблицу предлогов
      const response = await fetch(`${API_BASE_URL}/prepositions-table`);
      const freshData = await response.json();
      setPrepositionsTableData(freshData);
      
      if (activeTable === 'prepositions') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки деепричастий */}
{showGerundAudioModal && selectedGerundForAudio && selectedGerundLanguage && (
  <AudioGerundModal
    isOpen={showGerundAudioModal}
    onClose={() => {
      setShowGerundAudioModal(false);
      setSelectedGerundForAudio(null);
      setSelectedGerundLanguage(null);
    }}
    word={selectedGerundForAudio}
    language={selectedGerundLanguage}
    onAudioSaved={async () => {
      console.log('Gerund audio saved, reloading table...');
      
      // Перезагружаем таблицу деепричастий
      const response = await fetch(`${API_BASE_URL}/gerunds-table`);
      const freshData = await response.json();
      setGerundsTableData(freshData);
      
      if (activeTable === 'gerunds') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки глаголов */}
{showVerbAudioModal && selectedVerbForAudio && selectedVerbLanguage && (
  <AudioVerbModal
    isOpen={showVerbAudioModal}
    onClose={() => {
      setShowVerbAudioModal(false);
      setSelectedVerbForAudio(null);
      setSelectedVerbLanguage(null);
    }}
    word={selectedVerbForAudio}
    language={selectedVerbLanguage}
    onAudioSaved={async () => {
      console.log('Verb audio saved, reloading table...');
      
      // Перезагружаем таблицу глаголов
      const response = await fetch(`${API_BASE_URL}/verbs-table`);
      const freshData = await response.json();
      setVerbsTableData(freshData);
      
      if (activeTable === 'verbs') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки наречий */}
{showAdverbAudioModal && selectedAdverbForAudio && selectedAdverbLanguage && (
  <AudioAdverbModal
    isOpen={showAdverbAudioModal}
    onClose={() => {
      setShowAdverbAudioModal(false);
      setSelectedAdverbForAudio(null);
      setSelectedAdverbLanguage(null);
    }}
    word={selectedAdverbForAudio}
    language={selectedAdverbLanguage}
    onAudioSaved={async () => {
      console.log('Adverb audio saved, reloading table...');
      
      // Перезагружаем таблицу наречий
      const response = await fetch(`${API_BASE_URL}/adverbs-table`);
      const freshData = await response.json();
      setAdverbsTableData(freshData);
      
      if (activeTable === 'adverbs') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки причастий */}
{showParticipleAudioModal && selectedParticipleForAudio && selectedParticipleLanguage && (
  <AudioParticipleModal
    isOpen={showParticipleAudioModal}
    onClose={() => {
      setShowParticipleAudioModal(false);
      setSelectedParticipleForAudio(null);
      setSelectedParticipleLanguage(null);
    }}
    word={selectedParticipleForAudio}
    language={selectedParticipleLanguage}
    onAudioSaved={async () => {
      console.log('Participle audio saved, reloading table...');
      
      // Перезагружаем таблицу причастий
      const response = await fetch(`${API_BASE_URL}/participles-table`);
      const freshData = await response.json();
      setParticiplesTableData(freshData);
      
      if (activeTable === 'participles') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки числительных */}
{showNumeralAudioModal && selectedNumeralForAudio && selectedNumeralLanguage && (
  <AudioNumeralModal
    isOpen={showNumeralAudioModal}
    onClose={() => {
      setShowNumeralAudioModal(false);
      setSelectedNumeralForAudio(null);
      setSelectedNumeralLanguage(null);
    }}
    word={selectedNumeralForAudio}
    language={selectedNumeralLanguage}
    onAudioSaved={async () => {
      console.log('Numeral audio saved, reloading table...');
      
      // Перезагружаем таблицу числительных
      const response = await fetch(`${API_BASE_URL}/numerals-table`);
      const freshData = await response.json();
      setNumeralsTableData(freshData);
      
      if (activeTable === 'numerals') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для озвучки местоимений */}
{showPronounAudioModal && selectedPronounForAudio && selectedPronounLanguage && (
  <AudioPronounModal
    isOpen={showPronounAudioModal}
    onClose={() => {
      setShowPronounAudioModal(false);
      setSelectedPronounForAudio(null);
      setSelectedPronounLanguage(null);
    }}
    word={selectedPronounForAudio}
    language={selectedPronounLanguage}
    onAudioSaved={async () => {
      console.log('Pronoun audio saved, reloading table...');
      
      // Перезагружаем таблицу местоимений
      const response = await fetch(`${API_BASE_URL}/pronouns-table`);
      const freshData = await response.json();
      setPronounsTableData(freshData);
      
      if (activeTable === 'pronouns') {
        setActiveTableData(freshData);
      }
      
      alert('✅ Озвучка сохранена, таблица обновлена');
    }}
  />
)}
{/* Модальное окно для модуля "Тест" */}
{showTestModal && currentLessonForModule && (
  <TestCreationModal
    isOpen={showTestModal}
    onClose={() => {
      setShowTestModal(false);
      setEditingTest(null);
    }}
    onSave={addOrUpdateTest}
    moduleId={currentLessonForModule._id}
    lessonData={lessonData}
    getThemesByDatabase={getThemesByDatabase}
  />
)}

{/* Таблица существующих тестов (добавьте в модальное окно после создания) */}
{/* Лучше добавить в отдельной секции после модального окна */}
{/* МОДАЛЬНОЕ ОКНО ДЛЯ СОЗДАНИЯ ВОПРОСОВ ТЕСТА (typeId: 9) */}
{showTestModal && currentLessonForModule && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6 text-center">
        {editingTest ? 'Редактировать вопрос теста' : 'Добавить вопрос теста'}
      </h3>
      
      <div className="space-y-6">
        {/* ========== ЧАСТЬ 1: ВОПРОС (как в модуле Вопросы) ========== */}
       {/* ВОПРОС - как в модуле Вопросы */}
{/* ВОПРОС - как в модуле Вопросы */}
<div className="p-4 border rounded bg-gray-50">
  <h4 className="font-semibold mb-3">Вопрос</h4>
  
  {/* Простой текст вопроса (опционально) */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Текст вопроса (опционально)</label>
    <textarea
      value={newTestQuestion.questionText}
      onChange={(e) => setNewTestQuestion({...newTestQuestion, questionText: e.target.value})}
      placeholder="Введите текст вопроса, или используйте структуру ниже"
      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
    />
  </div>
  
  {/* Или структурированный вопрос - НЕСКОЛЬКО КОЛОНОК как в Вопросах */}
  {/* Или структурированный вопрос - из конфигурации модуля */}
<div className="mt-4">
  <label className="block text-sm font-medium mb-2">
    Или составьте вопрос из слов (несколько колонок):
  </label>
  <div className="border rounded p-4 bg-white">
    {(currentLessonForModule?.config?.questionColumnConfigs || newTestQuestion.questionColumnConfigs).map((config, index) => (
      <div key={index} className="mb-4 p-3 border rounded bg-gray-50">
        <h6 className="font-medium mb-2 text-sm">
          Колонка {index + 1} - {getDatabaseDisplayName(config.database)}
        </h6>
        <QuestionColumn
          config={config}
          columnIndex={index}
          structure={newTestQuestion.questionStructure}
          onStructureChange={(updatedStructure) => {
            setNewTestQuestion({
              ...newTestQuestion,
              questionStructure: updatedStructure
            });
          }}
          lessonData={lessonData}
          getThemesByDatabase={getThemesByDatabase}
        />
      </div>
    ))}
  </div>
</div>
  
  {/* Картинка вопроса */}
  <div className="mt-4">
    <label className="block text-sm font-medium mb-1">Картинка вопроса</label>
    <div className="flex items-center gap-3">
      {newTestQuestion.questionImage && (
        <img src={newTestQuestion.questionImage} alt="Preview" className="h-16 w-16 object-cover rounded border" />
      )}
      <input
        type="text"
        value={newTestQuestion.questionImage}
        onChange={(e) => setNewTestQuestion({...newTestQuestion, questionImage: e.target.value})}
        placeholder="URL картинки"
        className="flex-1 border border-gray-300 rounded px-3 py-2"
      />
      <button
        onClick={() => document.getElementById('test-question-image-upload').click()}
        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Загрузить
      </button>
      <input
        id="test-question-image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files[0];
          if (file) {
            await handleOptimizedImageUploadToUrl(file, 'test-question', (url) => {
              setNewTestQuestion({...newTestQuestion, questionImage: url});
            });
          }
        }}
      />
    </div>
  </div>
</div>

        {/* ========== ЧАСТЬ 2: НАСТРОЙКИ СЕТКИ ОТВЕТОВ ========== */}
        <div className="p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Сетка вариантов ответов</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Количество строк</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newTestQuestion.gridRows}
                onChange={(e) => {
                  const rows = parseInt(e.target.value) || 1;
                  setNewTestQuestion({
                    ...newTestQuestion,
                    gridRows: rows,
                    // Обновляем количество опций
                    options: updateOptionsCount(rows, newTestQuestion.gridCols, newTestQuestion.options)
                  });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Количество столбцов</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newTestQuestion.gridCols}
                onChange={(e) => {
                  const cols = parseInt(e.target.value) || 1;
                  setNewTestQuestion({
                    ...newTestQuestion,
                    gridCols: cols,
                    options: updateOptionsCount(newTestQuestion.gridRows, cols, newTestQuestion.options)
                  });
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Всего вариантов ответов: <strong>{newTestQuestion.gridRows * newTestQuestion.gridCols}</strong>
          </div>
        </div>

        {/* ========== ЧАСТЬ 3: ВАРИАНТЫ ОТВЕТОВ ========== */}
        {/* ВАРИАНТЫ ОТВЕТОВ */}
<div className="p-4 border rounded bg-gray-50">
  <h4 className="font-semibold mb-3">Варианты ответов</h4>
  <p className="text-sm text-gray-600 mb-3">
    Для каждого варианта можно добавить несколько слов из разных баз данных.
    Можно отметить несколько правильных ответов.
  </p>
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {newTestQuestion.options.map((option, optIndex) => (
      <div key={optIndex} className="p-3 border rounded bg-white relative">
        {/* Кнопка удаления */}
        {newTestQuestion.options.length > 1 && (
          <button
            onClick={() => removeTestOption(optIndex)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        )}
        
        {/* Чекбокс "правильный ответ" */}
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={option.isCorrect}
            onChange={(e) => updateTestOption(optIndex, 'isCorrect', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Правильный ответ</span>
        </label>
        
        {/* Выбор слов для ответа - несколько слов */}
        <div className="space-y-3">
          <label className="block text-xs text-gray-500 font-medium">Слова в ответе:</label>
          
          {/* Список уже выбранных слов */}
          <div className="flex flex-wrap gap-1 min-h-[40px] p-2 bg-gray-50 rounded border">
            {option.structure && option.structure.length > 0 ? (
              option.structure.map((word, wordIdx) => (
                <div key={wordIdx} className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  <span>{word.word || word.displayWord}</span>
                  <button
                    onClick={() => {
                      const updatedOptions = [...newTestQuestion.options];
                      updatedOptions[optIndex].structure.splice(wordIdx, 1);
                      if (updatedOptions[optIndex].structure.length === 0) {
                        updatedOptions[optIndex].text = '';
                      }
                      setNewTestQuestion({...newTestQuestion, options: updatedOptions});
                    }}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-400">Нет слов</span>
            )}
          </div>
          
          {/* Форма добавления нового слова */}
          <div className="border-t pt-2 mt-1">
            <div className="grid grid-cols-3 gap-1 mb-1">
              <select
                value={option.tempDatabase || 'nouns'}
                onChange={(e) => {
                  const updatedOptions = [...newTestQuestion.options];
                  updatedOptions[optIndex] = { 
                    ...updatedOptions[optIndex], 
                    tempDatabase: e.target.value,
                    tempTheme: '' 
                  };
                  setNewTestQuestion({...newTestQuestion, options: updatedOptions});
                }}
                className="text-xs border rounded px-1 py-1 col-span-1"
              >
                <option value="nouns">Существительные</option>
                <option value="adjectives">Прилагательные</option>
                <option value="verbs">Глаголы</option>
                <option value="pronouns">Местоимения</option>
                <option value="numerals">Числительные</option>
                <option value="adverbs">Наречия</option>
                <option value="prepositions">Предлоги</option>
                <option value="question-words">Вопрос.слова</option>
                <option value="gerunds">Деепричастия</option>
                <option value="participles">Причастия</option>
              </select>
              
              <select
  value={option.tempTheme || ''}
  onChange={(e) => {
    const updatedOptions = [...newTestQuestion.options];
    updatedOptions[optIndex] = { ...updatedOptions[optIndex], tempTheme: e.target.value };
    setNewTestQuestion({...newTestQuestion, options: updatedOptions});
  }}
  disabled={['prepositions', 'question-words', 'pronouns', 'numerals'].includes(option.tempDatabase || 'nouns')}
>
  <option value="">-- Тема --</option>
  {getThemesByDatabase(option.tempDatabase || 'nouns').map(theme => (
    <option key={theme} value={theme}>{theme}</option>
  ))}
</select>
            </div>
            
            <div className="flex gap-1">
           <button
  onClick={() => {
    setCurrentTestOptionIndex(optIndex);
    setShowTestWordSelector(true);
  }}
  className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
  disabled={
    !option.tempTheme && 
    !['prepositions', 'question-words', 'pronouns', 'numerals'].includes(option.tempDatabase || 'nouns')
  }
>
  + Добавить слово
</button>
              
              {/* Кнопка для простого текста */}
              <button
                onClick={() => {
                  const text = prompt('Введите текст ответа:');
                  if (text && text.trim()) {
                    updateTestOption(optIndex, 'text', text.trim());
                    updateTestOption(optIndex, 'structure', []);
                  }
                }}
                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              >
                📝 Текст
              </button>
            </div>
          </div>
          
          {/* Отображение простого текста если есть */}
          {option.text && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <span className="font-medium">Текст:</span> {option.text}
              <button
                onClick={() => {
                  updateTestOption(optIndex, 'text', '');
                }}
                className="ml-2 text-red-500"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
  
  {/* Кнопка добавления варианта */}
  {newTestQuestion.options.length < newTestQuestion.gridRows * newTestQuestion.gridCols && (
    <div className="mt-3 text-center">
      <button
        onClick={addTestOption}
        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
      >
        + Добавить вариант ответа
      </button>
      <p className="text-xs text-gray-500 mt-1">
        Нужно добавить еще {newTestQuestion.gridRows * newTestQuestion.gridCols - newTestQuestion.options.length} вариантов
      </p>
    </div>
  )}
</div>

        {/* ========== ПОДСКАЗКА И ПЕРЕВОД ========== */}
      {/* ПОДСКАЗКА И ПЕРЕВОД */}
<div className="p-4 border rounded bg-gray-50">
  <h4 className="font-semibold mb-3">Дополнительно</h4>
  
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Подсказка</label>
    <textarea
      value={newTestQuestion.hint}
      onChange={(e) => setNewTestQuestion({...newTestQuestion, hint: e.target.value})}
      placeholder="Подсказка для студента"
      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
    />
  </div>
  
  {/* ПЕРЕВОД ВОПРОСА - УБЕДИТЕСЬ, ЧТО ЭТОТ БЛОК ЕСТЬ */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Перевод вопроса на {lessonData?.hintLanguage?.toUpperCase() || 'АНГЛИЙСКИЙ'}
    </label>
    <textarea
      value={newTestQuestion.translation}
      onChange={(e) => setNewTestQuestion({...newTestQuestion, translation: e.target.value})}
      placeholder={`Введите перевод вопроса на ${lessonData?.hintLanguage || 'английский'}`}
      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
    />
    <p className="text-xs text-gray-500 mt-1">
      Этот перевод будет показан после того, как студент ответит на вопрос
    </p>
  </div>
</div>

        {/* ========== КНОПКИ ========== */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={() => {
              setShowTestModal(false);
              setEditingTest(null);
              resetTestQuestionForm();
            }}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={addOrUpdateTestQuestion}
            disabled={!isTestQuestionValid()}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {editingTest ? 'Сохранить изменения' : 'Добавить вопрос'}
          </button>
        </div>

        {/* ========== ТАБЛИЦА СУЩЕСТВУЮЩИХ ВОПРОСОВ ТЕСТА ========== */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Существующие вопросы теста:</h4>
          {moduleTestQuestions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Нет добавленных вопросов</div>
          ) : (
            <div className="space-y-4">
              {moduleTestQuestions.map((question, index) => (
                <div key={question._id} className="border rounded-lg p-4 bg-gray-50 relative">
                  <button
                    onClick={() => deleteTestQuestion(question._id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Вопрос {index + 1}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {question.questionText || (question.questionStructure[0]?.word || '—')}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Сетка: {question.gridRows}×{question.gridCols}, Ответов: {question.options.length}
                        {question.options.filter(o => o.isCorrect).length > 0 && (
                          <span className="text-green-600 ml-2">
                            ✓ Правильных: {question.options.filter(o => o.isCorrect).length}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openTestQuestionModal(currentLessonForModule, question)}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

{/* WordSelector для выбора слов в вариантах ответа */}
{showTestWordSelector && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-96">
      <h3 className="text-lg font-semibold mb-4">Выберите слово</h3>
      <WordSelector
        studiedLanguage={lessonData?.studiedLanguage || 'русский'}
        theme={newTestQuestion.options[currentTestOptionIndex]?.tempTheme || ''}
        database={newTestQuestion.options[currentTestOptionIndex]?.tempDatabase || 'nouns'}
        filters={{}}
        onWordSelect={(selectedWord) => {
          const updatedOptions = [...newTestQuestion.options];
          if (!updatedOptions[currentTestOptionIndex].structure) {
            updatedOptions[currentTestOptionIndex].structure = [];
          }
          updatedOptions[currentTestOptionIndex].structure.push({
            word: selectedWord.displayWord || selectedWord.word,
            wordData: selectedWord,
            database: selectedWord.database || newTestQuestion.options[currentTestOptionIndex].tempDatabase
          });
          setNewTestQuestion({...newTestQuestion, options: updatedOptions});
          setShowTestWordSelector(false);
        }}
        selectedWord={null}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowTestWordSelector(false)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Отмена
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
