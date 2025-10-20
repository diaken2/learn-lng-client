// src/app/test/page.js
import { Suspense } from 'react';
import LearningComponent from '@/components/LearningComponent';

export default function LearningPage() {
  return (
    <Suspense fallback={<div>Загрузка теста...</div>}>
      <LearningComponent/>
    </Suspense>
  );
}