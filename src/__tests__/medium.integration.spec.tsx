/* eslint-disable import/order */
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { act, render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import App from '../App';
import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import { server } from '../setupTests';
import { Event, RepeatInfo } from '../types';

const theme = createTheme();

const TEST_TODAY = '2025-10-01';

// ! Hard 여기 제공 안함
/**
 * 테스트 환경에서 컴포넌트를 렌더링하고, 사용자 이벤트를 시뮬레이션할 수 있는 userEvent 인스턴스를 반환하는 함수입니다.
 * ThemeProvider, CssBaseline, SnackbarProvider로 감싸서 App 등 실제 환경과 유사하게 렌더링합니다.
 *
 * @param element 테스트할 React 컴포넌트
 * @returns render 함수의 반환값과 userEvent 인스턴스를 포함한 객체
 */
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// ! Hard 여기 제공 안함
/**
 * saveSchedule 함수는 테스트 환경에서 새로운 일정을 추가하는 과정을 자동화합니다.
 * 주어진 사용자(user) 이벤트 인스턴스와 일정 정보(form)를 받아,
 * 각 입력 필드(제목, 날짜, 시간, 설명, 위치, 카테고리)에 값을 입력하고,
 * '일정 추가' 버튼을 클릭하여 일정을 저장하는 시나리오를 시뮬레이션합니다.
 *
 * @param user - userEvent 인스턴스 (사용자 상호작용 시뮬레이션)
 * @param form - id, notificationTime, repeat을 제외한 Event 객체의 필수 정보
 */
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>,
  // * optional로 추가
  repeat?: RepeatInfo
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  if (repeat) {
    // * 반복 체크박스 클릭 (true로 선택)
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;

    if (repeatCheckbox && !repeatCheckbox.checked) {
      await user.click(repeatCheckbox);
    }
    expect(repeatCheckbox).toBeChecked();

    // * 반복 유형 선택
    await user.click(screen.getByLabelText('반복 유형'));
    await user.click(within(screen.getByLabelText('반복 유형')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: `${repeat.type}-option` }));

    // * 반복 간격 선택
    await user.type(screen.getByLabelText('반복 간격'), repeat.interval.toString());

    // * 반복 종료일 선택
    await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate ?? '');
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

const selectView = async (user: UserEvent, viewType: 'week' | 'month') => {
  const viewOption = viewType === 'week' ? 'week-option' : 'month-option';
  const testId = viewType === 'week' ? 'week-view' : 'month-view';

  await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: viewOption }));

  return within(screen.getByTestId(testId));
};

const navigateToDate = (user: UserEvent, targetDate: string) => {
  const target = new Date(targetDate);
  const current = new Date(TEST_TODAY);

  return {
    week: async () => {
      // 주별 뷰에서 날짜 이동
      const weeksDiff = Math.ceil(
        (target.getTime() - current.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      // Next 버튼을 weeksDiff만큼 클릭
      for (let i = 0; i < weeksDiff; i++) {
        await user.click(screen.getByLabelText('Next'));
      }
    },
    month: async () => {
      // 월별 뷰에서 날짜 이동
      const monthsDiff = target.getMonth() - current.getMonth();

      // Next 버튼을 monthsDiff만큼 클릭
      for (let i = 0; i < monthsDiff; i++) {
        await user.click(screen.getByLabelText('Next'));
      }
    },
  };
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 1,
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: 2,
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

// 알림 기능 통합 테스트
describe('알림 기능', () => {
  it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
    vi.setSystemTime(new Date('2025-10-15 08:49:59'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
  });
});

// 반복 일정 통합 테스트
describe('반복 일정 기능', () => {
  describe('반복 일정 생성', () => {
    it('매일 반복 유형을 선택하고 일정을 생성하면 해당 주의 위클리뷰, 이벤트 목록에 표시된다.', async () => {
      // Given: 일정 생성 폼
      // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
      // Then: 입력한 정보대로 이벤ㅋ트 리스트에 반복 일정이 생성, 위클리뷰에 매일 표시된다.

      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await saveSchedule(
        user,
        {
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '13:30',
          endTime: '14:30',
          description: '주간 회의',
          location: '라운지',
          category: '업무',
        },
        {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-20',
        }
      );

      // 위클리뷰에 반복 일정 설정 날짜 이후로 매일 표시
      const weekView = await selectView(user, 'week');

      // 10월 15일이 있는 주로 이동 (현재 10월 1일에서 2주 후)
      await navigateToDate(user, '2025-10-15').week();

      // 반복 일정이 설정 날짜(2025-10-15) 이후로 매일 위클리뷰에 표시되는지 확인
      // 현재 주의 2025-10-15 ~ 2025-10-18 까지 반복 일정이 생성되어야 함
      const repeatDates = Array.from({ length: 18 - 15 + 1 }, (_, i) => {
        const date = new Date(2025, 9, 15 + i);
        return date.toISOString().slice(0, 10);
      });

      // 이벤트 목록에서 현재 주에서 반복되는 횟수만큼 표시되는지 확인
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getAllByText('반복 회의').length).toBe(repeatDates.length);

      // 날짜 셀만다 반복 일정이 존재하는지 확인
      for (const date of repeatDates) {
        const dateCell = weekView.getByText(date).closest('td')!;
        expect(within(dateCell).getByText('반복 회의')).toBeInTheDocument();
      }
    });

    it('매일 반복 유형을 선택하고 일정을 생성하면 먼슬리뷰에 오늘 이후로 매일 표시된다.', async () => {
      // Given: 일정 생성 폼
      // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
      // Then: 입력한 정보대로 이벤트 리스트에 반복 일정이 생성, 먼슬리뷰에 오늘 이후로 매일 표시

      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await saveSchedule(
        user,
        {
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '13:30',
          endTime: '14:30',
          description: '주간 회의',
          location: '라운지',
          category: '업무',
        },
        {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-20',
        }
      );

      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('반복 회의')).toBeInTheDocument();
      expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
      expect(eventList.getByText('13:30 - 14:30')).toBeInTheDocument();
      expect(eventList.getByText('주간 회의')).toBeInTheDocument();
      expect(eventList.getByText('라운지')).toBeInTheDocument();
      expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();

      // 먼슬리뷰에 반복 일정 설정 날짜 이후로 매일 표시
      const monthView = await selectView(user, 'month');

      // 10월 15일이 있는 주로 이동 (현재 10월 1일에서 2주 후)
      await navigateToDate(user, '2025-10-15').month();

      // 반복 일정이 설정 날짜(2025-10-15) 이후로 매일 먼슬리뷰에 표시되는지 확인
      // 2025-10-15 ~ 2025-10-30까지 반복 일정이 생성되어야 함
      const repeatDates = Array.from({ length: 30 - 15 + 1 }, (_, i) => {
        const date = new Date(2025, 9, 15 + i);
        return date.toISOString().slice(0, 10);
      });

      for (const date of repeatDates) {
        expect(monthView.getByText(date)).toBeInTheDocument();
        expect(monthView.getByText('반복 회의')).toBeInTheDocument();
      }
    });

    it('매주 반복 유형을 선택하고 일정을 생성하면 이벤트 리스트 및 캘린더에 바로 표시된다.', async () => {
      // Given: 일정 생성 폼
      // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
      // Then: 입력한 정보대로 이벤트 리스트에 반복 일정이 생성, 캘린더 먼슬리뷰/위클리뷰 확인
    });

    it('매월 반복 유형을 선택하고 일정을 생성하면 이벤트 리스트 및 캘린더에 바로 표시된다.', async () => {
      // Given: 일정 생성 폼
      // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
      // Then: 입력한 정보대로 이벤트 리스트에 반복 일정이 생성, 캘린더 먼슬리뷰/위클리뷰 확인
    });

    it('매년 반복 유형을 선택하고 일정을 생성하면 이벤트 리스트 및 캘린더에 바로 표시된다.', async () => {
      // Given: 일정 생성 폼
      // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
      // Then: 입력한 정보대로 이벤트 리스트에 반복 일정이 생성, 캘린더 먼슬리뷰/위클리뷰 확인
    });
  });

  //   describe('반복 일정 수정', () => {
  //     it('반복 일정을 수정하면 이벤트 리스트 및 캘린더에 바로 반영된다.', async () => {
  //       // Given: 일정 생성 폼
  //       // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
  //       // Then: 입력한 정보대로 이벤트 리스트에 반복 일정이 생성, 캘린더 먼슬리뷰/위클리뷰 확인
  //     });
  //   });

  //   describe('반복 일정 삭제', () => {
  //     it('반복 일정을 삭제하면 이벤트 리스트 및 캘린더에서 바로 제거된다.', async () => {
  //       // Given: 일정 생성 폼
  //       // When: 반복 유형 선택 (매일, 매주, 매월, 매년)하고 일정 생성
  //       // Then: 입력한 정보대로 이벤트 리스트에 반복 일정이 생성, 캘린더 먼슬리뷰/위클리뷰 확인
  //     });
  //   });

  //   describe('경곗값 테스트', () => {
  //     it('매월 31일을 선택하여 반복 일정을 생성하는 경우, 31일이 있는 달(1, 3, 5, 7, 8, 10, 12)에 일정이 생성된다.', async () => {
  //       // Given: 일정 생성 폼
  //       // When: 매월 31일로 반복일정 선택하여 일정 생성
  //       // Then: 31일이 있는 월에만 일정이 반복되는 것을 확인
  //     });

  //     it('매월 30일을 선택하여 반복 일정을 생성하는 경우, 30일이 있는 달(4, 6, 9, 11)에 일정이 생성된다.', async () => {
  //       // Given: 일정 생성 폼
  //       // When: 매월 30일로 반복일정 선택하여 일정 생성
  //       // Then: 30일이 있는 월에만 일정이 반복되는 것을 확인
  //     });

  //     it('29일을 선택하여 반복 일정을 생성하는 경우, 평년 2월은 제외하고 29일에 일정이 생성된다.', async () => {
  //       // Given: 일정 생성 폼
  //       // When: 29일로 반복일정 선택하여 일정 생성
  //       // Then: 평년 2월에는 일정이 생성되지 않는 것을 확인
  //     });
  //   });
});
