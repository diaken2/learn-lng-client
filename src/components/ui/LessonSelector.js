// components/ui/LessonSelector.js - БЕЗ ИЗМЕНЕНИЙ
'use client';
import React from 'react';

export default function LessonSelector({ levelId, lessons = [], value, onChange, loading = false }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">Урок</div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full border rounded px-3 py-2"
        disabled={loading || !levelId}
      >
        <option value="">
          {levelId ? 'Выберите урок' : 'Сначала выберите уровень'}
        </option>

        {lessons.length === 0 && levelId && (
          <option value="" disabled>
            Нет уроков для выбранных параметров
          </option>
        )}

        {lessons.map((lesson) => (
          <option key={lesson._id} value={lesson._id}>
            {lesson.title} {lesson.theme ? `(${lesson.theme})` : ''}
          </option>
        ))}
      </select>
      
      {levelId && (
        <div className="text-xs text-gray-500 mt-1">
          Найдено уроков: {lessons.length}
        </div>
      )}
    </label>
  );
}