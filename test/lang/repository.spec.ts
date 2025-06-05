// test/lang/repository.spec.ts
import { test, expect } from 'vitest';
import LanguageRepository from '@/repositories/LanguageRepository';

test('loads manifest & specific language', async () => {
  const manifest = await LanguageRepository.manifest();
  expect(manifest.length).toBeGreaterThan(0);

  const code = manifest[0]!.code;
  const lang = await LanguageRepository.language(code);
  expect(lang.code).toBe(code);
  expect(lang.symbols.length).toBeGreaterThan(0);
});
