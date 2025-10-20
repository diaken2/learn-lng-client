// components/ui/LanguageSelector.js - УПРОЩЕННЫЙ
'use client';
import React from 'react';

export default function LanguageSelector({ label, value, onChange, languages = [], disabled = false }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2"
        disabled={disabled}
      >
        <option value="">Выберите язык</option>
        {languages.map(lang => (
          <option key={lang} value={lang}>
            {lang === 'русский' ? 'Русский' : 
             lang === 'english' ? 'English' : 
             lang === 'турецкий' ? 'Турецкий' : lang}
          </option>
        ))}
      </select>
    </label>
  );
}