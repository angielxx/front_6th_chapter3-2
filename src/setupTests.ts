import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';

import { handlers } from './__mocks__/handlers';

// ! Hard 여기 제공 안함
/* msw */
export const server = setupServer(...handlers);

vi.stubEnv('TZ', 'UTC');

beforeAll(() => {
  server.listen();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

beforeEach(() => {
  // expect.hasAssertions()는 각 테스트가 최소한 하나 이상의 assertion을 실행했는지 확인하여,
  // assertion이 누락된 테스트를 방지하기 위해 사용합니다.
  expect.hasAssertions();

  // 테스트의 일관성을 위해 시스템 시간을 고정합니다.
  vi.setSystemTime(new Date('2025-10-01'));
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  server.close();
});
