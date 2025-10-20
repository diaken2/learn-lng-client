'use client';

import React from 'react';
import Image from 'next/image';

export default function RenderCell({ cell, db, studiedLanguage, hintLanguage }) {
if (!cell) return null;


if (cell.type === 'words') {
const w = db.words.find(x => x._id === cell.id);
if (!w) return <div className="text-sm">[слово не найдено]</div>;
return (
<div className="text-center">
<div className="font-bold text-lg">{w.translations[studiedLanguage]}</div>
<div className="text-sm text-gray-500">{w.translations[hintLanguage]}</div>
</div>
);
}


if (cell.type === 'images') {
const i = db.images.find(x => x._id === cell.id);
if (!i) return <div className="text-sm">[картинка не найдена]</div>;
return (
<div className="text-center">
    
<Image
        src={i.src}
        alt={i.label}
        width={80} // Укажите ширину изображения
        height={80} // Укажите высоту изображения
        className="max-h-20 mx-auto mb-2"
      />
<div className="text-sm">{i.label}</div>
</div>
);
}


if (cell.type === 'numbers') {
// In MVP we stored numbers by id=value for simplicity
return <div className="text-3xl font-semibold">{cell.id}</div>;
}


return null;
}