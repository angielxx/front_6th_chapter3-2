import { MAX_END_DATE } from '../../constants/repeat';
import { generateRepeatEvent } from '../../utils/eventUtils';

describe('반복 일정 로직 단위 테스트', () => {
  describe('generateRepeatEvent - 매일 반복', () => {
    it('매일 반복 시 시작일부터 종료일까지 모든 날짜가 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 1, 'daily', '2025-10-05');
      expect(result).toEqual([
        '2025-10-01',
        '2025-10-02',
        '2025-10-03',
        '2025-10-04',
        '2025-10-05',
      ]);
    });

    it('매일 반복 시 간격이 2일이면 2일마다 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 2, 'daily', '2025-10-07');
      expect(result).toEqual(['2025-10-01', '2025-10-03', '2025-10-05', '2025-10-07']);
    });

    it('매일 반복 시 시작일이 종료일보다 늦으면 빈 배열을 반환한다', () => {
      const result = generateRepeatEvent('2025-10-05', 1, 'daily', '2025-10-01');
      expect(result).toEqual([]);
    });

    it('매일 반복 시 종료일이 지정되지 않으면 MAX_END_DATE까지 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 1, 'daily');
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1]).toBe('2025-10-30'); // MAX_END_DATE
    });

    it('매일 반복 시 간격이 0이면 시작일만 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 0, 'daily', '2025-10-05');
      expect(result).toEqual(['2025-10-01']);
    });
  });

  describe('generateRepeatEvent - 매주 반복', () => {
    it('매주 반복 시 같은 요일마다 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 1, 'weekly', '2025-10-29');
      expect(result).toEqual([
        '2025-10-01', // 수요일
        '2025-10-08', // 수요일
        '2025-10-15', // 수요일
        '2025-10-22', // 수요일
        '2025-10-29', // 수요일
      ]);
    });

    it('매주 반복 시 간격이 2주이면 2주마다 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 2, 'weekly', '2025-10-29');
      expect(result).toEqual(['2025-10-01', '2025-10-15', '2025-10-29']);
    });

    it('매주 반복 시 종료일이 지정되지 않으면 MAX_END_DATE까지 생성된다', () => {
      const result = generateRepeatEvent('2025-10-01', 1, 'weekly');
      expect(result.length).toBeGreaterThan(0);
      const lastDate = new Date(result[result.length - 1]);
      expect(lastDate.getTime()).toBeLessThanOrEqual(MAX_END_DATE.getTime());
    });
  });

  describe('generateRepeatEvent - 매월 반복', () => {
    it('매월 반복 시 같은 날짜마다 생성된다', () => {
      const result = generateRepeatEvent('2025-01-15', 1, 'monthly', '2025-04-15');
      expect(result).toEqual(['2025-01-15', '2025-02-15', '2025-03-15', '2025-04-15']);
    });

    it('매월 반복 시 31일이 있는 달에만 31일 일정이 생성된다', () => {
      const result = generateRepeatEvent('2025-01-31', 1, 'monthly', '2025-08-31');
      expect(result).toEqual([
        '2025-01-31', // 31일 있음
        '2025-03-31', // 31일 있음
        '2025-05-31', // 31일 있음
        '2025-07-31', // 31일 있음
        '2025-08-31', // 31일 있음
      ]);
      // 2월, 4월, 6월은 31일이 없으므로 제외됨
    });

    it('매월 반복 시 30일이 있는 달에 31일 일정은 생성되지 않는다', () => {
      const result = generateRepeatEvent('2025-01-31', 1, 'monthly', '2025-04-30');
      expect(result).toEqual([
        '2025-01-31', // 31일 있음
        '2025-03-31', // 31일 있음
      ]);
      // 2월, 4월은 31일이 없으므로 제외됨
    });

    it('매월 반복 시 간격이 2개월이면 2개월마다 생성된다', () => {
      const result = generateRepeatEvent('2025-01-15', 2, 'monthly', '2025-07-15');
      expect(result).toEqual(['2025-01-15', '2025-03-15', '2025-05-15', '2025-07-15']);
    });
  });

  describe('generateRepeatEvent - 매년 반복', () => {
    it('매년 반복 시 같은 월/일마다 생성된다', () => {
      const result = generateRepeatEvent('2025-01-15', 1, 'yearly', '2028-01-15');
      expect(result).toEqual(['2025-01-15', '2026-01-15', '2027-01-15', '2028-01-15']);
    });

    it('매년 반복 시 윤년 2월 29일은 윤년에만 생성된다', () => {
      const result = generateRepeatEvent('2024-02-29', 1, 'yearly', '2028-02-29');
      expect(result).toEqual([
        '2024-02-29', // 윤년
        '2028-02-29', // 윤년
      ]);
      // 2025, 2026, 2027년은 평년이므로 2월 29일이 없음
    });

    it('매년 반복 시 간격이 2년이면 2년마다 생성된다', () => {
      const result = generateRepeatEvent('2025-01-15', 2, 'yearly', '2031-01-15');
      expect(result).toEqual(['2025-01-15', '2027-01-15', '2029-01-15', '2031-01-15']);
    });

    it('매년 반복 시 평년 2월 28일은 매년 생성된다', () => {
      const result = generateRepeatEvent('2025-02-28', 1, 'yearly', '2028-02-28');
      expect(result).toEqual(['2025-02-28', '2026-02-28', '2027-02-28', '2028-02-28']);
    });
  });

  describe('generateRepeatEvent - 엣지케이스', () => {
    it('시작일과 종료일이 같으면 시작일만 반환한다', () => {
      const result = generateRepeatEvent('2025-10-01', 1, 'daily', '2025-10-01');
      expect(result).toEqual(['2025-10-01']);
    });

    it('간격이 음수이면 시작일만 반환한다', () => {
      const result = generateRepeatEvent('2025-10-01', -1, 'daily', '2025-10-05');
      expect(result).toEqual(['2025-10-01']);
    });

    it('매월 반복 시 2월 30일은 생성되지 않는다', () => {
      const result = generateRepeatEvent('2025-01-30', 1, 'monthly', '2025-03-30');
      expect(result).toEqual(['2025-01-30', '2025-03-30']);
      // 2월은 30일이 없으므로 제외됨
    });

    it('매월 반복 시 4월 31일은 생성되지 않는다', () => {
      const result = generateRepeatEvent('2025-01-31', 1, 'monthly', '2025-05-31');
      expect(result).toEqual(['2025-01-31', '2025-03-31', '2025-05-31']);
      // 4월은 31일이 없으므로 제외됨
    });
  });

  describe('generateRepeatEvent - 날짜 형식', () => {
    it('Date 객체와 문자열 모두 입력으로 받을 수 있다', () => {
      const stringResult = generateRepeatEvent('2025-10-01', 1, 'daily', '2025-10-03');
      const dateResult = generateRepeatEvent(
        new Date('2025-10-01'),
        1,
        'daily',
        new Date('2025-10-03')
      );
      expect(stringResult).toEqual(dateResult);
    });

    it('반환되는 날짜는 YYYY-MM-DD 형식의 문자열이다', () => {
      const result = generateRepeatEvent('2025-10-01', 1, 'daily', '2025-10-03');
      result.forEach((date) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('generateRepeatEvent - 성능 테스트', () => {
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
