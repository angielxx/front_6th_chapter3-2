import { Page, expect, test } from '@playwright/test';

test.describe('반복 종료일 설정 시나리오', () => {
  // 각 테스트 전에 데이터 초기화
  test.beforeEach(async ({ page }) => {
    // 페이지 로드
    await page.goto('http://localhost:5173');

    // Mock 서버 초기화를 위한 API 호출
    await page.evaluate(async () => {
      // Mock 서버 리셋을 위한 특별한 엔드포인트 호출
      await fetch('/api/reset', { method: 'POST' });
    });

    // 페이지 새로고침으로 초기 상태로 복원
    await page.reload();

    // 앱 로딩 대기
    await page.waitForSelector('[data-testid="event-list"]');

    // Mock 데이터 상태 확인
    const mockStatus = await page.evaluate(async () => {
      const response = await fetch('/api/events');
      const data = await response.json();
      return {
        eventCount: data.events.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: data.events.map((e: any) => ({ id: e.id, title: e.title, date: e.date })),
      };
    });

    console.log('Mock data status after reset:', mockStatus);
  });

  // 각 테스트 후 정리
  test.afterEach(async ({ page }) => {
    // 테스트 후 Mock 서버 정리
    await page.evaluate(async () => {
      await fetch('/api/reset', { method: 'POST' });
    });
  });

  test('반복 종료일을 설정하여 제한된 기간 반복 일정 생성', async ({ page }) => {
    // Given: 반복 일정 생성 폼
    // When: 반복 종료일 설정 후 생성
    // Then: 설정된 종료일까지만 반복 일정 생성
    await createRepeatEventWithEndDate(page, '2025-10-15');

    // month 뷰를 10월까지 옮기기
    // (예: 오른쪽 화살표 클릭을 반복하여 10월이 보일 때까지 이동)
    while (!(await page.locator('[data-testid="month-title"]').textContent())?.includes('10월')) {
      await page.click('[data-testid="calendar-next"]');
      // 혹시 렌더링이 느릴 수 있으니 약간 대기
      await page.waitForTimeout(100);
    }

    await verifyLimitedRepeatEvents(page, '2025-10-15');
  });
});

// Material-UI 컴포넌트를 위한 헬퍼 함수들
async function selectRepeatType(page: Page, repeatType: string) {
  // Select 컴포넌트 클릭하여 드롭다운 열기
  await page.click('[data-testid="repeat-type-select"]');

  // 드롭다운이 열릴 때까지 대기
  await page.waitForSelector(`[aria-label="${repeatType}-option"]`, { state: 'visible' });

  // 해당 옵션 클릭
  await page.click(`[aria-label="${repeatType}-option"]`);
}

async function fillTextField(page: Page, testId: string, value: string) {
  // Material-UI TextField의 실제 input 엘리먼트에 접근
  await page.fill(`[data-testid="${testId}"] input`, value);
}

async function confirmOverlapWarningModal(page: Page) {
  // 일정 겹침 경고 모달이 나타나면 확인 버튼 클릭
  const overlapModal = await page.$('[data-testid="overlap-warning-modal"]');
  if (overlapModal) {
    await page.click('[data-testid="overlap-warning-confirm-button"]');
  }
}

async function createRepeatEventWithEndDate(page: Page, endDate: string) {
  // 기본 일정 정보 입력
  await page.fill('[data-testid="title-input"] input', '제한된 반복 회의');
  await page.fill('[data-testid="date-input"] input', '2025-10-01');
  await page.fill('[data-testid="start-time-input"] input', '09:00');
  await page.fill('[data-testid="end-time-input"] input', '10:00');
  await page.fill('[data-testid="description-input"] input', '종료일이 설정된 반복 회의');
  await page.fill('[data-testid="location-input"] input', '회의실 A');

  // 반복 일정 설정
  await page.check('[data-testid="repeat-checkbox"]');
  await selectRepeatType(page, 'daily');
  await fillTextField(page, 'repeat-interval-input', '1');
  await fillTextField(page, 'repeat-end-date-input', endDate);

  // 일정 저장
  await page.click('[data-testid="event-submit-button"]');

  await confirmOverlapWarningModal(page);

  // 저장 완료 대기
  await page.waitForSelector('text=생성되었습니다.');
}

async function verifyLimitedRepeatEvents(page: Page, endDate: string) {
  // 설정된 종료일까지만 반복 일정이 생성되었는지 확인
  const endDateObj = new Date(endDate);
  const startDateObj = new Date('2025-10-01');
  const expectedDays =
    Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Month 뷰 내에서만 이벤트 검색
  const monthView = page.locator('[data-testid="month-view"]');
  const repeatEvents = await monthView.locator('text=/제한된.*회의/').count();

  // 디버깅을 위한 로그 추가
  console.log(`Expected: ${expectedDays}, Actual: ${repeatEvents}`);

  expect(repeatEvents).toBe(expectedDays);

  // 종료일 이후에는 반복 일정이 생성되지 않았는지 확인
  const afterEndDate = new Date(endDate);
  afterEndDate.setDate(afterEndDate.getDate() + 1);
  const afterEndDateStr = afterEndDate.toISOString().split('T')[0];

  // 캘린더에서 종료일 이후 날짜 확인
  await page.goto(`http://localhost:5173?date=${afterEndDateStr}`);
  await page.waitForSelector('[data-testid="event-list"]');

  const eventsAfterEndDate = await countEventsInMonthView(page, 'text=/제한된.*회의/');
  expect(eventsAfterEndDate).toBe(0);
}

async function countEventsInMonthView(page: Page, locator: string) {
  const monthView = page.locator('[data-testid="month-view"]');
  const eventsAfterEndDate = await monthView.locator(locator).count();

  return eventsAfterEndDate;
}
