import QuestionLearningComponent from '@/components/QuestionLearningComponent';

import { Suspense } from 'react';


export default function SentenceLearningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Загрузка модуля...</div>
      </div>
    }>
      <QuestionLearningComponent/>
    </Suspense>
  );
}