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

  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
  });

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

  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
  });

  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
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
  });

  describe('매주 반복', () => {
    it('매주 반복 유형이고 반복 간격이 1주일 때, 시작 날짜와 종료 날짜 사이의 모든 날짜를 배열로 반환한다.', () => {
      const result = generateRepeatEvent('2025-07-01', 1, 'weekly', '2025-07-10');
      expect(result).toHaveLength(2);
      expect(result).toEqual(['2025-07-01', '2025-07-08']);
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
  });
});
