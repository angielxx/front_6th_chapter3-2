import { MAX_END_DATE, MAX_END_DATE_STRING } from '../../constants/repeat';
import { RepeatInfo, RepeatType } from '../../types';

// 반복 일정 검증 함수들 (실제 구현이 필요함)
function validateRepeatInfo(repeatInfo: RepeatInfo): { isValid: boolean; error?: string } {
  // 반복 유형 검증
  if (!['none', 'daily', 'weekly', 'monthly', 'yearly'].includes(repeatInfo.type)) {
    return { isValid: false, error: '유효하지 않은 반복 유형입니다.' };
  }

  // 간격 검증
  if (repeatInfo.interval < 0) {
    return { isValid: false, error: '반복 간격은 0 이상이어야 합니다.' };
  }

  // 종료일 검증
  if (repeatInfo.endDate) {
    const endDate = new Date(repeatInfo.endDate);
    if (isNaN(endDate.getTime())) {
      return { isValid: false, error: '유효하지 않은 종료일 형식입니다.' };
    }

    if (endDate > MAX_END_DATE) {
      return { isValid: false, error: `종료일은 ${MAX_END_DATE_STRING} 이전이어야 합니다.` };
    }
  }

  return { isValid: true };
}

function validateRepeatEndDate(
  endDate: string,
  startDate: string
): { isValid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: '유효하지 않은 날짜 형식입니다.' };
  }

  if (end <= start) {
    return { isValid: false, error: '종료일은 시작일보다 늦어야 합니다.' };
  }

  if (end > MAX_END_DATE) {
    return { isValid: false, error: `종료일은 ${MAX_END_DATE_STRING} 이전이어야 합니다.` };
  }

  return { isValid: true };
}

function validateRepeatInterval(
  interval: number,
  type: RepeatType
): { isValid: boolean; error?: string } {
  if (interval < 0) {
    return { isValid: false, error: '반복 간격은 0 이상이어야 합니다.' };
  }

  if (interval === 0 && type !== 'none') {
    return { isValid: false, error: '반복 간격은 1 이상이어야 합니다.' };
  }

  // 각 반복 유형별 최대 간격 제한
  const maxIntervals = {
    daily: 365,
    weekly: 52,
    monthly: 12,
    yearly: 10,
    none: 0,
  };

  if (interval > maxIntervals[type]) {
    return { isValid: false, error: `${type} 반복의 최대 간격은 ${maxIntervals[type]}입니다.` };
  }

  return { isValid: true };
}

describe('반복 일정 검증 로직 단위 테스트', () => {
  describe('validateRepeatInfo', () => {
    it('유효한 반복 정보를 검증한다', () => {
      const validRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-30',
      };

      const result = validateRepeatInfo(validRepeatInfo);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('유효하지 않은 반복 유형을 검증한다', () => {
      const invalidRepeatInfo: RepeatInfo = {
        type: 'invalid' as RepeatType,
        interval: 1,
        endDate: '2025-10-30',
      };

      const result = validateRepeatInfo(invalidRepeatInfo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('유효하지 않은 반복 유형입니다.');
    });

    it('음수 간격을 검증한다', () => {
      const invalidRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: -1,
        endDate: '2025-10-30',
      };

      const result = validateRepeatInfo(invalidRepeatInfo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('반복 간격은 0 이상이어야 합니다.');
    });

    it('유효하지 않은 종료일 형식을 검증한다', () => {
      const invalidRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endDate: 'invalid-date',
      };

      const result = validateRepeatInfo(invalidRepeatInfo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('유효하지 않은 종료일 형식입니다.');
    });

    it('최대 종료일을 초과하는 종료일을 검증한다', () => {
      const invalidRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endDate: '2025-11-01',
      };

      const result = validateRepeatInfo(invalidRepeatInfo);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`종료일은 ${MAX_END_DATE_STRING} 이전이어야 합니다.`);
    });

    it('종료일이 없는 반복 정보를 검증한다', () => {
      const validRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
      };

      const result = validateRepeatInfo(validRepeatInfo);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateRepeatEndDate', () => {
    it('유효한 종료일을 검증한다', () => {
      const result = validateRepeatEndDate('2025-10-30', '2025-10-01');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('시작일보다 이전인 종료일을 검증한다', () => {
      const result = validateRepeatEndDate('2025-09-30', '2025-10-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('종료일은 시작일보다 늦어야 합니다.');
    });

    it('시작일과 같은 종료일을 검증한다', () => {
      const result = validateRepeatEndDate('2025-10-01', '2025-10-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('종료일은 시작일보다 늦어야 합니다.');
    });

    it('최대 종료일을 초과하는 종료일을 검증한다', () => {
      const result = validateRepeatEndDate('2025-11-01', '2025-10-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(`종료일은 ${MAX_END_DATE_STRING} 이전이어야 합니다.`);
    });

    it('유효하지 않은 시작일 형식을 검증한다', () => {
      const result = validateRepeatEndDate('2025-10-30', 'invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('유효하지 않은 날짜 형식입니다.');
    });

    it('유효하지 않은 종료일 형식을 검증한다', () => {
      const result = validateRepeatEndDate('invalid-date', '2025-10-01');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('유효하지 않은 날짜 형식입니다.');
    });

    it('최대 종료일과 같은 종료일을 검증한다', () => {
      const result = validateRepeatEndDate(MAX_END_DATE_STRING, '2025-10-01');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateRepeatInterval', () => {
    it('유효한 매일 반복 간격을 검증한다', () => {
      const result = validateRepeatInterval(1, 'daily');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('유효한 매주 반복 간격을 검증한다', () => {
      const result = validateRepeatInterval(2, 'weekly');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('유효한 매월 반복 간격을 검증한다', () => {
      const result = validateRepeatInterval(3, 'monthly');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('유효한 매년 반복 간격을 검증한다', () => {
      const result = validateRepeatInterval(5, 'yearly');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('음수 간격을 검증한다', () => {
      const result = validateRepeatInterval(-1, 'daily');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('반복 간격은 0 이상이어야 합니다.');
    });

    it('0 간격을 검증한다 (none이 아닌 경우)', () => {
      const result = validateRepeatInterval(0, 'daily');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('반복 간격은 1 이상이어야 합니다.');
    });

    it('0 간격을 검증한다 (none인 경우)', () => {
      const result = validateRepeatInterval(0, 'none');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('매일 반복의 최대 간격을 초과하는 간격을 검증한다', () => {
      const result = validateRepeatInterval(366, 'daily');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('daily 반복의 최대 간격은 365입니다.');
    });

    it('매주 반복의 최대 간격을 초과하는 간격을 검증한다', () => {
      const result = validateRepeatInterval(53, 'weekly');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('weekly 반복의 최대 간격은 52입니다.');
    });

    it('매월 반복의 최대 간격을 초과하는 간격을 검증한다', () => {
      const result = validateRepeatInterval(13, 'monthly');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('monthly 반복의 최대 간격은 12입니다.');
    });

    it('매년 반복의 최대 간격을 초과하는 간격을 검증한다', () => {
      const result = validateRepeatInterval(11, 'yearly');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('yearly 반복의 최대 간격은 10입니다.');
    });

    it('각 반복 유형의 최대 간격을 검증한다', () => {
      const maxIntervals = [
        { type: 'daily' as RepeatType, max: 365 },
        { type: 'weekly' as RepeatType, max: 52 },
        { type: 'monthly' as RepeatType, max: 12 },
        { type: 'yearly' as RepeatType, max: 10 },
      ];

      maxIntervals.forEach(({ type, max }) => {
        const result = validateRepeatInterval(max, type);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('복합 검증 시나리오', () => {
    it('모든 검증을 통과하는 완전한 반복 정보를 검증한다', () => {
      const validRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-30',
      };

      const repeatValidation = validateRepeatInfo(validRepeatInfo);
      const endDateValidation = validateRepeatEndDate(validRepeatInfo.endDate!, '2025-10-01');
      const intervalValidation = validateRepeatInterval(
        validRepeatInfo.interval,
        validRepeatInfo.type
      );

      expect(repeatValidation.isValid).toBe(true);
      expect(endDateValidation.isValid).toBe(true);
      expect(intervalValidation.isValid).toBe(true);
    });

    it('여러 검증을 실패하는 반복 정보를 검증한다', () => {
      const invalidRepeatInfo: RepeatInfo = {
        type: 'invalid' as RepeatType,
        interval: -1,
        endDate: '2025-11-01',
      };

      const repeatValidation = validateRepeatInfo(invalidRepeatInfo);
      const endDateValidation = validateRepeatEndDate(invalidRepeatInfo.endDate!, '2025-10-01');
      const intervalValidation = validateRepeatInterval(
        invalidRepeatInfo.interval,
        invalidRepeatInfo.type
      );

      expect(repeatValidation.isValid).toBe(false);
      expect(endDateValidation.isValid).toBe(false);
      expect(intervalValidation.isValid).toBe(false);
    });
  });
});
