'use client';
import React from 'react';

/**
 * Набор SVG для каждого слова (MVP).
 * Добавьте сюда новые SVG и подключайте к словам через _id.
 *
 * Каждый компонент принимает className и optional fill/stroke props.
 */

export function AppleSVG({ className = 'w-40 h-40', ...props }) {
  return (
    <svg viewBox="0 0 64 64" className={className} {...props} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="#3d8b46">
        <path d="M45.5 15.6c-2.2.2-5.1 1.4-6.7 3-1.8 1.8-2.6 4.2-2.9 5.6.2 0 .6-.1 1-.1 3.7 0 8.5-2.6 10.8-5.4-0.1-1.1-.4-2.9-2.2-3.1z"/>
        <path d="M47.6 26.3c-1.2-2.6-3-4.3-4.9-5.9-5.7-4.8-13-2.9-17.1 1.8-3.3 3.8-4.1 9.8-1.7 14.4 1.4 2.9 3.1 5.1 5.1 6.8 1.8 1.5 3.9 3 6.6 3 2.4 0 4.4-1.4 6.6-3.1 2.2-1.7 4.9-4.2 6.6-7.9 1.6-3.4 1.6-6.7 0-9.1z"/>
      </g>
    </svg>
  );
}

export function BananaSVG({ className = 'w-40 h-40', ...props }) {
  return (
    <svg viewBox="0 0 64 64" className={className} {...props} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M10 40c10 12 30 12 44-2 0 0-2-8-8-12-6-4-22-6-36 14z" fill="#f4d03f" stroke="#d6b43a" strokeWidth="1.5" />
    </svg>
  );
}

export function TableSVG({ className = 'w-40 h-40', ...props }) {
  return (
    <svg viewBox="0 0 64 64" className={className} {...props} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="6" y="14" width="52" height="26" rx="2" fill="#cba56b" stroke="#8b5a2b" strokeWidth="1.5" />
      <rect x="10" y="40" width="6" height="14" fill="#8b5a2b" />
      <rect x="48" y="40" width="6" height="14" fill="#8b5a2b" />
    </svg>
  );
}

export function ChairSVG({ className = 'w-40 h-40', ...props }) {
  return (
    <svg viewBox="0 0 64 64" className={className} {...props} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="10" y="20" width="44" height="8" rx="1" fill="#7f8c8d" />
      <rect x="14" y="28" width="8" height="24" fill="#636e72" />
      <rect x="42" y="28" width="8" height="24" fill="#636e72" />
      <rect x="22" y="18" width="20" height="16" fill="#95a5a6" />
    </svg>
  );
}

// Fallback SVG (если id нет)
export function FallbackSVG({ className = 'w-40 h-40', ...props }) {
  return (
    <svg viewBox="0 0 64 64" className={className} {...props} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="32" cy="32" r="20" fill="#d1d5db" />
      <text x="32" y="36" textAnchor="middle" fontSize="10" fill="#374151">no</text>
    </svg>
  );
}

/**
 * getWordSvg(wordId) -> React component
 * Связываем _id из localDb.words с нужным SVG.
 * Если хотите, используйте более «наглядный» ключ (slug).
 */
const MAP = {
  w1: AppleSVG,   // ЯБЛОКО
  w2: BananaSVG,  // БАНАН
  w3: TableSVG,   // СТОЛ
  w4: ChairSVG    // СТУЛ
};

export default function getWordSvg(id) {
  return MAP[id] ?? FallbackSVG;
}
