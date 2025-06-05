# Kana Pop!

<!-- Project description will go here -->

## Architecture

### Cross-environment Services

Kana Pop is designed to run in multiple environments (browser, tests, CI) which may have different capabilities. The following services provide environment-agnostic abstractions:

- **StorageService**: A unified storage wrapper that safely handles persistence across environments
  - Automatically detects availability of `localStorage`
  - Falls back to in-memory storage when necessary (Node/tests or Safari private mode)
  - Provides consistent API (`get`, `set`, `remove`, `clear`) regardless of environment
  - Logs diagnostic information when falling back to in-memory storage

Never use raw Web Storage APIs (`localStorage`, `sessionStorage`) directly in your code. Always use these service abstractions to ensure code works consistently across all environments.

## Gameplay Features

### Bubble Interaction

- **Tap Feedback**: When a bubble is tapped, it provides visual and haptic feedback:
  - **Visual**: The bubble quickly shrinks to 85% of its size (`BUBBLE_TAP_SCALE = 0.85`) and then smoothly animates back to its original scale. It also flashes a white rim.
  - **Haptic**: If supported by the browser and not disabled by user preference (`prefers-reduced-motion`), a subtle vibration occurs (`HAPTIC_DURATION_MS`).

## Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing. The test suite is designed to cover core logic, services, and UI interactions.

### Running Tests

- **Run all tests once**:
  ```bash
  pnpm test
  ```
- **Run tests in watch mode** (re-runs tests automatically when files change):
  ```bash
  pnpm test:watch
  ```
- **Generate a coverage report**:
  ```bash
  pnpm test:coverage
  ```
  This command outputs a coverage summary to the terminal and generates a detailed HTML report in the `./coverage/` directory. Open `./coverage/index.html` in your browser to explore the report.

### Test Structure and Helpers

- **Note on `jest-canvas-mock` and `happy-dom`:**
  The test stack uses `jest-canvas-mock`, which brings in `happy-dom`.
  `happy-dom` depends on ES2021 types (`WeakRef`).
  Our `tsconfig.json` therefore targets ES2021 or explicitly includes `es2021.weakref` in the `lib` option.

- **Global Test Setup**: The file `test/setup.ts` is used for global test configurations, such as importing Jest DOM matchers (`@testing-library/jest-dom`) and polyfilling browser APIs (like `devicePixelRatio` and `matchMedia`) to ensure services like `ResizeService` function correctly in the test environment.
- **Unit Tests**: Located in `test/core/`, `test/entities/`, `test/services/`, and `test/utils/`.
- **Integration Tests**: Located in `test/screens/`.

### Debugging Tests in VS Code

A launch configuration is provided in `.vscode/launch.json` named "Vitest Run". This allows you to run your tests with the VS Code debugger, set breakpoints, and step through your test code.

### Environment Variables for Tests

Vitest automatically sets `import.meta.env.VITEST = true` and `process.env.VITEST = 'true'` during test execution. You can use these variables in your application code if you need to enable test-specific logic or debug helpers.

For example, if you wanted to expose certain internal states or functions only during testing:

```javascript
// In your application code (e.g., a game module)
if (import.meta.env.VITEST) {
  // Expose debug utilities or log additional info
  console.log('Running in Vitest test mode');
}
```

### Coverage Configuration

Coverage options, including reporters and thresholds, are configured in `vitest.config.ts` under the `test.coverage` property.

To set coverage thresholds (e.g., requiring 80% coverage for lines, functions, branches, and statements), you can modify the configuration like this:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    setupFiles: './test/setup.ts',
    coverage: {
      reporter: ['text', 'html'],
      // Uncomment and adjust these lines to enforce coverage thresholds
      // lines: 80,
      // functions: 80,
      // branches: 80,
      // statements: 80,
    },
  },
});
```

For more details on coverage options, refer to the [Vitest documentation](https://vitest.dev/guide/coverage.html).
