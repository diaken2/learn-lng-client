import TestModulePage from '@/components/TestModuleComponent';
import { Suspense } from 'react';


export default function TestModule() {
  return (
    <Suspense fallback={<div>Загрузка теста...</div>}>
      <TestModulePage />
    </Suspense>
  );
}