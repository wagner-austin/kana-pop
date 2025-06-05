// src/types/lang-imports.d.ts
declare module '@/data/lang/index.json' {
  const value: Array<{ code: string; name: string; direction: 'ltr' | 'rtl' }>;
  export default value;
}
