// components/ui/LevelSelector.js - УПРОЩЕННЫЙ
'use client';
import React from 'react';

export default function LevelSelector({ value, onChange, levels = [], disabled = false }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">Уровень</div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full border rounded px-3 py-2"
        disabled={disabled}
      >
        <option value="">Выберите уровень</option>
        {levels.map(level => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
    </label>
  );
}