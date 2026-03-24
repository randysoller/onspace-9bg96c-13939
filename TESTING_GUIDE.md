# Testing Infrastructure Guide

Comprehensive testing setup for FretMaster with unit tests, component tests, and E2E tests.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

FretMaster uses a multi-layered testing strategy:

- **Unit Tests** (Vitest): Test individual functions and hooks
- **Component Tests** (React Testing Library): Test UI components in isolation
- **E2E Tests** (Playwright): Test complete user flows

## Installation

Testing dependencies should auto-install, but if needed:

```bash
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
npx playwright install
```

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage

# UI mode (interactive test runner)
npm test -- --ui
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Show test report
npx playwright show-report
```

## Test Structure

```
├── src/
│   ├── hooks/
│   │   └── __tests__/
│   │       └── usePitchDetection.test.ts
│   ├── lib/
│   │   └── __tests__/
│   │       ├── logger.test.ts
│   │       └── storage-manager.test.ts
│   └── test/
│       ├── setup.ts              # Vitest configuration
│       ├── test-utils.tsx        # Custom render utilities
│       └── mocks/
│           ├── audio.ts          # Web Audio API mocks
│           └── supabase.ts       # Supabase client mocks
├── e2e/
│   ├── auth.spec.ts              # Authentication flows
│   ├── practice-session.spec.ts  # Practice session
│   └── chord-editor.spec.ts      # Chord editor
├── vitest.config.ts
└── playwright.config.ts
```

## Writing Tests

### Unit Tests (Hooks & Utilities)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  beforeEach(() => {
    // Reset state before each test
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('should update value when called', async () => {
    const { result } = renderHook(() => useMyHook());
    
    result.current.setValue(42);
    
    await waitFor(() => {
      expect(result.current.value).toBe(42);
    });
  });
});
```

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should display loading state', () => {
    render(<MyComponent loading />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete user flow', async ({ page }) => {
    // Navigate
    await page.getByRole('link', { name: 'Practice' }).click();
    
    // Interact
    await page.getByLabel('Chord Name').fill('C Major');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Assert
    await expect(page.getByText('Chord saved')).toBeVisible();
  });
});
```

## Best Practices

### General

1. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
2. **Test Behavior, Not Implementation**: Focus on what users see and do
3. **Descriptive Names**: Use clear, specific test names
4. **Isolation**: Each test should be independent
5. **Mock External Dependencies**: Use mocks for API calls, audio, etc.

### Unit Tests

- Test edge cases and error conditions
- Use `beforeEach` for common setup
- Mock external dependencies (Supabase, Web Audio API)
- Test async operations with `waitFor`

### Component Tests

- Render with custom `render` from test-utils (includes providers)
- Query by role/label for accessibility
- Test user interactions with `fireEvent` or `userEvent`
- Verify ARIA attributes and keyboard navigation

### E2E Tests

- Test critical user flows only (signup, practice, save)
- Use data-testid sparingly, prefer semantic selectors
- Test across multiple browsers (Chromium, Firefox, WebKit)
- Include mobile viewports for responsive testing
- Use page object model for complex flows

## Mocking

### Web Audio API

```typescript
import { createMockAudioContext } from '@/test/mocks/audio';

const mockContext = createMockAudioContext();
```

### Supabase Client

```typescript
import { createMockSupabaseClient, seedMockData } from '@/test/mocks/supabase';

const mockClient = createMockSupabaseClient();
seedMockData('profiles', [{ id: '1', username: 'test' }]);
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage for utilities and hooks
- **Component Tests**: 70%+ coverage for UI components
- **E2E Tests**: Cover all critical user flows

Check coverage:
```bash
npm test -- --coverage
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Vitest UI
```bash
npm test -- --ui
```
Opens interactive test runner in browser

### Playwright Inspector
```bash
npx playwright test --debug
```
Step through tests with breakpoints

### VS Code Debugging
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest Current File",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${relativeFile}"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Tests timing out
- Increase timeout: `test('name', async () => {}, 10000)`
- Check for unresolved promises
- Verify mocks are working

### React Query issues
- Use test QueryClient with retry: false
- Clear cache between tests
- Wait for queries to settle with `waitFor`

### Playwright flaky tests
- Add explicit waits: `await expect(...).toBeVisible()`
- Use network idle: `await page.waitForLoadState('networkidle')`
- Increase timeout for slow operations

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Last Updated:** March 24, 2026  
**Maintained By:** FretMaster Development Team
