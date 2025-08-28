import { Event } from '../../types';
import { generateRepeatEvent, getFilteredEvents } from '../../utils/eventUtils';

describe('getFilteredEvents', () => {
  const events: Event[] = [
    {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '이벤트 2',
      date: '2025-07-05',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '3',
      title: '이벤트 3',
      date: '2025-07-10',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
  ];

  describe('검색 기능', () => {
    it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
      const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('이벤트 2');
    });

    it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
      const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(3);
    });

    it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
      const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('이벤트 2');
    });

    it('제목, 설명, 위치에서 검색이 작동한다', () => {
      const eventsWithDetails: Event[] = [
        {
          id: '1',
          title: '회의',
          date: '2025-07-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '프로젝트 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        {
          id: '2',
          title: '점심',
          date: '2025-07-01',
          startTime: '12:00',
          endTime: '13:00',
          description: '팀 점심',
          location: '식당',
          category: '개인',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ];

      // 제목으로 검색
      const titleResult = getFilteredEvents(
        eventsWithDetails,
        '회의',
        new Date('2025-07-01'),
        'month'
      );
      expect(titleResult).toHaveLength(1);
      expect(titleResult[0].title).toBe('회의');

      // 설명으로 검색
      const descResult = getFilteredEvents(
        eventsWithDetails,
        '프로젝트',
        new Date('2025-07-01'),
        'month'
      );
      expect(descResult).toHaveLength(1);
      expect(descResult[0].description).toBe('프로젝트 회의');

      // 위치로 검색
      const locationResult = getFilteredEvents(
        eventsWithDetails,
        '회의실',
        new Date('2025-07-01'),
        'month'
      );
      expect(locationResult).toHaveLength(1);
      expect(locationResult[0].location).toBe('회의실 A');
    });

    it('부분 검색이 작동한다', () => {
      const result = getFilteredEvents(events, '이벤트', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(3);
    });
  });

  describe('뷰 필터링', () => {
    it('주간 뷰에서 2025-07-01 주의 이벤트만 반환한다', () => {
      const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'week');
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
    });

    it('월간 뷰에서 2025년 7월의 모든 이벤트를 반환한다', () => {
      const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(3);
      expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
    });

    it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
      const result = getFilteredEvents(events, '이벤트', new Date('2025-07-01'), 'week');
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
    });

    it('월의 경계에 있는 이벤트를 올바르게 필터링한다', () => {
      const borderEvents: Event[] = [
        {
          id: '4',
          title: '6월 마지막 날 이벤트',
          date: '2025-06-30',
          startTime: '23:00',
          endTime: '23:59',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        ...events,
        {
          id: '5',
          title: '8월 첫 날 이벤트',
          date: '2025-08-01',
          startTime: '00:00',
          endTime: '01:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ];
      const result = getFilteredEvents(borderEvents, '', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(3);
      expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
    });

    it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
      const result = getFilteredEvents([], '', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(0);
    });

    it('다른 월의 이벤트는 필터링된다', () => {
      const crossMonthEvents: Event[] = [
        {
          id: '1',
          title: '7월 이벤트',
          date: '2025-07-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        {
          id: '2',
          title: '8월 이벤트',
          date: '2025-08-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ];

      const result = getFilteredEvents(crossMonthEvents, '', new Date('2025-07-01'), 'month');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('7월 이벤트');
    });
  });

  describe('복합 시나리오', () => {
    it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', () => {
      const result1 = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
      expect(result1).toHaveLength(1);

      const result2 = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
      expect(result2).toHaveLength(3);
    });

    it('뷰를 변경해도 검색 결과가 유지된다', () => {
      const searchTerm = '이벤트';

      const weekResult = getFilteredEvents(events, searchTerm, new Date('2025-07-01'), 'week');
      const monthResult = getFilteredEvents(events, searchTerm, new Date('2025-07-01'), 'month');

      expect(weekResult.length).toBeLessThanOrEqual(monthResult.length);
      expect(weekResult.every((event) => event.title.includes('이벤트'))).toBe(true);
      expect(monthResult.every((event) => event.title.includes('이벤트'))).toBe(true);
    });
  });
});

describe('generateRepeatEvent', () => {
  describe('매일 반복', () => {
    it('시작 날짜가 종료 날짜보다 미래인 경우, 빈 배열을 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-03', 1, 'daily', '2025-07-01');
      expect(result).toHaveLength(0);
    });

    it('매일 반복 유형이고 반복 간격이 1일 때, 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'daily', '2025-07-03');
      expect(result).toHaveLength(3);
      expect(result).toEqual(['2025-07-01', '2025-07-02', '2025-07-03']);
    });

    it('매일 반복 유형이고 반복 간격이 2일 때, 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 2, 'daily', '2025-07-03');
      expect(result).toHaveLength(2);
      expect(result).toEqual(['2025-07-01', '2025-07-03']);
    });

    it('매일 반복 유형이고 반복 간격이 시작 날짜와 종료 날짜 간격보다 클 때, 시작 날짜만 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 4, 'daily', '2025-07-03');
      expect(result).toHaveLength(1);
      expect(result).toEqual(['2025-07-01']);
    });

    it('시작일과 종료일이 같으면 시작일만 반환한다', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'daily', '2025-07-01');
      expect(result).toEqual(['2025-07-01']);
    });

    it('간격이 0이면 시작일만 반환한다', () => {
      const result = generateRepeatEvent('2025-07-01', 0, 'daily', '2025-07-03');
      expect(result).toEqual(['2025-07-01']);
    });
  });

  describe('매주 반복', () => {
    it('매주 반복 유형이고 반복 간격이 1주일 때, 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'weekly', '2025-07-10');
      expect(result).toHaveLength(2);
      expect(result).toEqual(['2025-07-01', '2025-07-08']);
    });

    it('매주 반복 유형이고 반복 간격이 2주일 때, 2주마다 생성된다', () => {
      const result = generateRepeatEvent('2025-07-01', 2, 'weekly', '2025-07-15');
      expect(result).toHaveLength(2);
      expect(result).toEqual(['2025-07-01', '2025-07-15']);
    });

    it('같은 요일마다 생성되는지 확인한다', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'weekly', '2025-07-29');
      expect(result).toEqual([
        '2025-07-01',
        '2025-07-08',
        '2025-07-15',
        '2025-07-22',
        '2025-07-29',
      ]);

      // 모든 날짜가 같은 요일(화요일)인지 확인
      result.forEach((date) => {
        const dayOfWeek = new Date(date).getDay();
        expect(dayOfWeek).toBe(2); // 화요일
      });
    });
  });

  describe('매월 반복', () => {
    it('매월 반복 유형이고 반복 간격이 1개월 때, 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'monthly', '2025-09-01');
      expect(result).toHaveLength(3);
      expect(result).toEqual(['2025-07-01', '2025-08-01', '2025-09-01']);
    });

    it('매월 반복 유형이고 반복 일정 날짜가 31일일 때, 31일이 있는 달에만 일정이 생성된다.', () => {
      const result = generateRepeatEvent('2025-07-31', 1, 'monthly', '2025-10-31');
      expect(result).toHaveLength(3);
      expect(result).toEqual(['2025-07-31', '2025-08-31', '2025-10-31']);
    });

    it('매월 반복 시 간격이 2개월이면 2개월마다 생성된다', () => {
      const result = generateRepeatEvent('2025-01-15', 2, 'monthly', '2025-07-15');
      expect(result).toEqual(['2025-01-15', '2025-03-15', '2025-05-15', '2025-07-15']);
    });

    it('30일이 있는 달에 31일 일정은 생성되지 않는다', () => {
      const result = generateRepeatEvent('2025-01-31', 1, 'monthly', '2025-04-30');
      expect(result).toEqual(['2025-01-31', '2025-03-31']);
    });
  });

  describe('매년 반복', () => {
    it('매년 반복 유형이고 반복 간격이 1년 때, 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'yearly', '2028-07-01');
      expect(result).toHaveLength(4);
      expect(result).toEqual(['2025-07-01', '2026-07-01', '2027-07-01', '2028-07-01']);
    });

    it('매년 반복 유형이고 반복 일정 날짜가 2월 29일일 때, 윤년 2월에만 일정이 생성된다.', () => {
      const result = generateRepeatEvent('2024-02-29', 1, 'yearly', '2028-02-29');
      expect(result).toHaveLength(2);
      expect(result).toEqual(['2024-02-29', '2028-02-29']);
    });

    it('매년 반복 시 간격이 2년이면 2년마다 생성된다', () => {
      const result = generateRepeatEvent('2025-01-15', 2, 'yearly', '2031-01-15');
      expect(result).toEqual(['2025-01-15', '2027-01-15', '2029-01-15', '2031-01-15']);
    });

    it('평년 2월 28일은 매년 생성된다', () => {
      const result = generateRepeatEvent('2025-02-28', 1, 'yearly', '2028-02-28');
      expect(result).toEqual(['2025-02-28', '2026-02-28', '2027-02-28', '2028-02-28']);
    });
  });

  describe('엣지케이스', () => {
    it('간격이 음수이면 시작일만 반환한다', () => {
      const result = generateRepeatEvent('2025-07-01', -1, 'daily', '2025-07-03');
      expect(result).toEqual(['2025-07-01']);
    });

    it('Date 객체와 문자열 모두 입력으로 받을 수 있다', () => {
      const stringResult = generateRepeatEvent('2025-07-01', 1, 'daily', '2025-07-03');
      const dateResult = generateRepeatEvent(
        new Date('2025-07-01'),
        1,
        'daily',
        new Date('2025-07-03')
      );
      expect(stringResult).toEqual(dateResult);
    });

    it('반환되는 날짜는 YYYY-MM-DD 형식의 문자열이다', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'daily', '2025-07-03');
      result.forEach((date) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('성능 테스트', () => {
    it('짧은 기간의 반복 일정을 효율적으로 생성한다', () => {
      const startTime = performance.now();
      const result = generateRepeatEvent('2025-10-01', 1, 'daily', '2025-10-07');
      const endTime = performance.now();

      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10); // 10ms 이내
    });

    it('매월 반복 시 짧은 기간 일정을 효율적으로 생성한다', () => {
      const startTime = performance.now();
      const result = generateRepeatEvent('2025-01-31', 1, 'monthly', '2025-03-31');
      const endTime = performance.now();

      expect(result.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10); // 10ms 이내
    });
  });
});
