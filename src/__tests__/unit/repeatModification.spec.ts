import { Event } from '../../types';

// 반복 일정 수정/삭제 관련 함수들 (실제 구현이 필요함)
function modifyRepeatEvent(
  events: Event[],
  targetEventId: string,
  modifiedEvent: Partial<Event>
): Event[] {
  return events.map((event) => {
    if (event.id === targetEventId) {
      // 반복 일정을 단일 일정으로 변경
      return {
        ...event,
        ...modifiedEvent,
        repeat: { type: 'none', interval: 0 }, // 반복 정보 제거
      };
    }
    return event;
  });
}

function deleteRepeatEvent(events: Event[], targetEventId: string): Event[] {
  return events.filter((event) => event.id !== targetEventId);
}

function isRepeatEvent(event: Event): boolean {
  return event.repeat.type !== 'none';
}

function shouldShowRepeatIcon(event: Event): boolean {
  return isRepeatEvent(event);
}

function getRepeatEventInstances(events: Event[], baseEventId: string): Event[] {
  // 같은 반복 일정의 모든 인스턴스를 찾는 로직
  const baseEvent = events.find((event) => event.id === baseEventId);
  if (!baseEvent || !isRepeatEvent(baseEvent)) {
    return [];
  }

  return events.filter(
    (event) =>
      event.title === baseEvent.title &&
      event.startTime === baseEvent.startTime &&
      event.endTime === baseEvent.endTime &&
      event.repeat.type === baseEvent.repeat.type &&
      event.repeat.interval === baseEvent.repeat.interval
  );
}

function createRepeatEventInstances(baseEvent: Event, repeatDates: string[]): Event[] {
  return repeatDates.map((date, index) => ({
    ...baseEvent,
    id: `${baseEvent.id}_${index}`,
    date,
  }));
}

describe('반복 일정 수정/삭제 로직 단위 테스트', () => {
  const baseRepeatEvent: Event = {
    id: 'repeat_1',
    title: '데일리 회의',
    date: '2025-10-01',
    startTime: '09:00',
    endTime: '10:00',
    description: '매일 반복 회의',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'daily', interval: 1, endDate: '2025-10-05' },
    notificationTime: 10,
  };

  const repeatEventInstances: Event[] = [
    { ...baseRepeatEvent, id: 'repeat_1_0', date: '2025-10-01' },
    { ...baseRepeatEvent, id: 'repeat_1_1', date: '2025-10-02' },
    { ...baseRepeatEvent, id: 'repeat_1_2', date: '2025-10-03' },
    { ...baseRepeatEvent, id: 'repeat_1_3', date: '2025-10-04' },
    { ...baseRepeatEvent, id: 'repeat_1_4', date: '2025-10-05' },
  ];

  describe('modifyRepeatEvent', () => {
    it('반복 일정을 단일 일정으로 수정한다', () => {
      const modifiedEvent = {
        title: '수정된 회의',
        description: '수정된 설명',
      };

      const result = modifyRepeatEvent(repeatEventInstances, 'repeat_1_2', modifiedEvent);

      const modifiedEventResult = result.find((event) => event.id === 'repeat_1_2');
      expect(modifiedEventResult).toBeDefined();
      expect(modifiedEventResult!.title).toBe('수정된 회의');
      expect(modifiedEventResult!.description).toBe('수정된 설명');
      expect(modifiedEventResult!.repeat).toEqual({ type: 'none', interval: 0 });
    });

    it('수정되지 않은 반복 일정은 그대로 유지된다', () => {
      const modifiedEvent = {
        title: '수정된 회의',
      };

      const result = modifyRepeatEvent(repeatEventInstances, 'repeat_1_2', modifiedEvent);

      // 수정되지 않은 이벤트들 확인
      const unmodifiedEvents = result.filter((event) => event.id !== 'repeat_1_2');
      unmodifiedEvents.forEach((event) => {
        expect(event.repeat).toEqual({ type: 'daily', interval: 1, endDate: '2025-10-05' });
      });
    });

    it('존재하지 않는 이벤트 ID로 수정 시도 시 원본 배열을 반환한다', () => {
      const modifiedEvent = {
        title: '수정된 회의',
      };

      const result = modifyRepeatEvent(repeatEventInstances, 'nonexistent_id', modifiedEvent);

      expect(result).toEqual(repeatEventInstances);
    });

    it('모든 필드를 수정할 수 있다', () => {
      const modifiedEvent = {
        title: '완전히 수정된 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '완전히 수정된 설명',
        location: '회의실 B',
        category: '개인',
        notificationTime: 30,
      };

      const result = modifyRepeatEvent(repeatEventInstances, 'repeat_1_1', modifiedEvent);

      const modifiedEventResult = result.find((event) => event.id === 'repeat_1_1');
      expect(modifiedEventResult).toBeDefined();
      expect(modifiedEventResult!.title).toBe('완전히 수정된 회의');
      expect(modifiedEventResult!.date).toBe('2025-10-15');
      expect(modifiedEventResult!.startTime).toBe('14:00');
      expect(modifiedEventResult!.endTime).toBe('15:00');
      expect(modifiedEventResult!.description).toBe('완전히 수정된 설명');
      expect(modifiedEventResult!.location).toBe('회의실 B');
      expect(modifiedEventResult!.category).toBe('개인');
      expect(modifiedEventResult!.notificationTime).toBe(30);
      expect(modifiedEventResult!.repeat).toEqual({ type: 'none', interval: 0 });
    });
  });

  describe('deleteRepeatEvent', () => {
    it('지정된 반복 일정을 삭제한다', () => {
      const result = deleteRepeatEvent(repeatEventInstances, 'repeat_1_2');

      expect(result).toHaveLength(4);
      expect(result.find((event) => event.id === 'repeat_1_2')).toBeUndefined();
    });

    it('존재하지 않는 이벤트 ID로 삭제 시도 시 원본 배열을 반환한다', () => {
      const result = deleteRepeatEvent(repeatEventInstances, 'nonexistent_id');

      expect(result).toEqual(repeatEventInstances);
    });

    it('여러 반복 일정을 순차적으로 삭제한다', () => {
      let result = deleteRepeatEvent(repeatEventInstances, 'repeat_1_1');
      result = deleteRepeatEvent(result, 'repeat_1_3');

      expect(result).toHaveLength(3);
      expect(result.find((event) => event.id === 'repeat_1_1')).toBeUndefined();
      expect(result.find((event) => event.id === 'repeat_1_3')).toBeUndefined();
    });

    it('모든 반복 일정을 삭제한다', () => {
      let result = [...repeatEventInstances];

      repeatEventInstances.forEach((event) => {
        result = deleteRepeatEvent(result, event.id);
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('isRepeatEvent', () => {
    it('반복 일정을 올바르게 식별한다', () => {
      const repeatEvent: Event = {
        ...baseRepeatEvent,
        repeat: { type: 'daily', interval: 1 },
      };

      expect(isRepeatEvent(repeatEvent)).toBe(true);
    });

    it('단일 일정을 올바르게 식별한다', () => {
      const singleEvent: Event = {
        ...baseRepeatEvent,
        repeat: { type: 'none', interval: 0 },
      };

      expect(isRepeatEvent(singleEvent)).toBe(false);
    });

    it('다양한 반복 유형을 올바르게 식별한다', () => {
      const repeatTypes = ['daily', 'weekly', 'monthly', 'yearly'] as const;

      repeatTypes.forEach((type) => {
        const event: Event = {
          ...baseRepeatEvent,
          repeat: { type, interval: 1 },
        };
        expect(isRepeatEvent(event)).toBe(true);
      });
    });
  });

  describe('shouldShowRepeatIcon', () => {
    it('반복 일정에는 반복 아이콘을 표시한다', () => {
      const repeatEvent: Event = {
        ...baseRepeatEvent,
        repeat: { type: 'daily', interval: 1 },
      };

      expect(shouldShowRepeatIcon(repeatEvent)).toBe(true);
    });

    it('단일 일정에는 반복 아이콘을 표시하지 않는다', () => {
      const singleEvent: Event = {
        ...baseRepeatEvent,
        repeat: { type: 'none', interval: 0 },
      };

      expect(shouldShowRepeatIcon(singleEvent)).toBe(false);
    });

    it('수정된 반복 일정에는 반복 아이콘을 표시하지 않는다', () => {
      const modifiedEvent: Event = {
        ...baseRepeatEvent,
        title: '수정된 회의',
        repeat: { type: 'none', interval: 0 },
      };

      expect(shouldShowRepeatIcon(modifiedEvent)).toBe(false);
    });
  });

  describe('getRepeatEventInstances', () => {
    it('같은 반복 일정의 모든 인스턴스를 찾는다', () => {
      const result = getRepeatEventInstances(repeatEventInstances, 'repeat_1_0');

      expect(result).toHaveLength(5);
      result.forEach((event) => {
        expect(event.title).toBe('데일리 회의');
        expect(event.startTime).toBe('09:00');
        expect(event.endTime).toBe('10:00');
        expect(event.repeat.type).toBe('daily');
        expect(event.repeat.interval).toBe(1);
      });
    });

    it('존재하지 않는 이벤트 ID로 검색 시 빈 배열을 반환한다', () => {
      const result = getRepeatEventInstances(repeatEventInstances, 'nonexistent_id');

      expect(result).toEqual([]);
    });

    it('단일 일정으로 검색 시 빈 배열을 반환한다', () => {
      const singleEvent: Event = {
        ...baseRepeatEvent,
        repeat: { type: 'none', interval: 0 },
      };
      const events = [singleEvent];

      const result = getRepeatEventInstances(events, singleEvent.id);

      expect(result).toEqual([]);
    });

    it('다른 반복 일정과 구분하여 인스턴스를 찾는다', () => {
      const differentRepeatEvent: Event = {
        ...baseRepeatEvent,
        id: 'repeat_2_0',
        title: '주간 회의',
        repeat: { type: 'weekly', interval: 1 },
      };
      const mixedEvents = [...repeatEventInstances, differentRepeatEvent];

      const result = getRepeatEventInstances(mixedEvents, 'repeat_1_0');

      expect(result).toHaveLength(5);
      result.forEach((event) => {
        expect(event.title).toBe('데일리 회의');
        expect(event.repeat.type).toBe('daily');
      });
    });
  });

  describe('createRepeatEventInstances', () => {
    it('기본 이벤트로부터 반복 일정 인스턴스들을 생성한다', () => {
      const repeatDates = ['2025-10-01', '2025-10-02', '2025-10-03'];

      const result = createRepeatEventInstances(baseRepeatEvent, repeatDates);

      expect(result).toHaveLength(3);
      result.forEach((event, index) => {
        expect(event.id).toBe(`repeat_1_${index}`);
        expect(event.date).toBe(repeatDates[index]);
        expect(event.title).toBe(baseRepeatEvent.title);
        expect(event.startTime).toBe(baseRepeatEvent.startTime);
        expect(event.endTime).toBe(baseRepeatEvent.endTime);
        expect(event.repeat).toEqual(baseRepeatEvent.repeat);
      });
    });

    it('빈 날짜 배열로 호출 시 빈 배열을 반환한다', () => {
      const result = createRepeatEventInstances(baseRepeatEvent, []);

      expect(result).toEqual([]);
    });

    it('단일 날짜로 호출 시 단일 인스턴스를 반환한다', () => {
      const result = createRepeatEventInstances(baseRepeatEvent, ['2025-10-01']);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('repeat_1_0');
      expect(result[0].date).toBe('2025-10-01');
    });
  });

  describe('복합 시나리오', () => {
    it('반복 일정 수정 후 반복 아이콘이 사라지는지 확인한다', () => {
      const modifiedEvent = {
        title: '수정된 회의',
      };

      const result = modifyRepeatEvent(repeatEventInstances, 'repeat_1_2', modifiedEvent);
      const modifiedEventResult = result.find((event) => event.id === 'repeat_1_2');

      expect(modifiedEventResult).toBeDefined();
      expect(shouldShowRepeatIcon(modifiedEventResult!)).toBe(false);
    });

    it('반복 일정 삭제 후 인스턴스 검색이 올바르게 작동한다', () => {
      let events = [...repeatEventInstances];
      events = deleteRepeatEvent(events, 'repeat_1_2');

      const remainingInstances = getRepeatEventInstances(events, 'repeat_1_0');
      expect(remainingInstances).toHaveLength(4);
      expect(remainingInstances.find((event) => event.id === 'repeat_1_2')).toBeUndefined();
    });

    it('여러 반복 일정의 수정/삭제가 독립적으로 작동한다', () => {
      let events = [...repeatEventInstances];

      // 첫 번째 이벤트 수정
      events = modifyRepeatEvent(events, 'repeat_1_0', { title: '수정된 회의 1' });

      // 두 번째 이벤트 삭제
      events = deleteRepeatEvent(events, 'repeat_1_1');

      // 세 번째 이벤트 수정
      events = modifyRepeatEvent(events, 'repeat_1_2', { title: '수정된 회의 3' });

      expect(events).toHaveLength(4);

      const modifiedEvent1 = events.find((event) => event.id === 'repeat_1_0');
      const deletedEvent = events.find((event) => event.id === 'repeat_1_1');
      const modifiedEvent3 = events.find((event) => event.id === 'repeat_1_2');
      const unchangedEvent = events.find((event) => event.id === 'repeat_1_3');

      expect(modifiedEvent1!.title).toBe('수정된 회의 1');
      expect(modifiedEvent1!.repeat).toEqual({ type: 'none', interval: 0 });
      expect(deletedEvent).toBeUndefined();
      expect(modifiedEvent3!.title).toBe('수정된 회의 3');
      expect(modifiedEvent3!.repeat).toEqual({ type: 'none', interval: 0 });
      expect(unchangedEvent!.repeat).toEqual({ type: 'daily', interval: 1, endDate: '2025-10-05' });
    });
  });
});
