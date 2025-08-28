import { MAX_END_DATE } from '../constants/repeat';
import { Event, RepeatType } from '../types';
import { formatDate, getWeekDates, isDateInRange } from './dateUtils';

function filterEventsByDateRange(events: Event[], start: Date, end: Date): Event[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return isDateInRange(eventDate, start, end);
  });
}

function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

function filterEventsByDateRangeAtWeek(events: Event[], start: Date) {
  const weekDates = getWeekDates(start);
  return filterEventsByDateRange(events, weekDates[0], weekDates[6]);
}

function filterEventsByDateRangeAtMonth(events: Event[], start: Date) {
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return filterEventsByDateRange(events, monthStart, monthEnd);
}

export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  start: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);

  if (view === 'week') {
    return filterEventsByDateRangeAtWeek(searchedEvents, start);
  }

  if (view === 'month') {
    return filterEventsByDateRangeAtMonth(searchedEvents, start);
  }

  return searchedEvents;
}

// ? 통합테스트를 위한 구현/리팩토링 중 생성한 유틸함수에 대한 단위테스트는 어느 시점에 작성해야할까?
// ? 1) 통합테스트에 대한 리팩토링 완료 후
// ? 2) 통합테스트에 대한 리팩토링 중 유틸함수 생성 직후

export function generateRepeatEvent(
  startDate: string | Date,
  interval: number,
  type: RepeatType,
  endDate: string | Date = MAX_END_DATE
) {
  const dates: string[] = [];

  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  let current = typeof startDate === 'string' ? new Date(startDate) : startDate;

  if (current > end) {
    return [];
  }

  if (type === 'daily') {
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + interval);
    }
  }

  if (type === 'weekly') {
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 7 * interval);
    }
  }

  if (type === 'monthly') {
    while (current <= end) {
      dates.push(formatDate(current));

      // 다음 월의 같은 날짜로 이동
      const nextMonth = new Date(
        current.getFullYear(),
        current.getMonth() + interval,
        current.getDate()
      );

      // 유효한 날짜인지 확인 (원래 의도한 날짜와 실제 날짜가 같은지)
      const intendedDay = current.getDate();
      const actualDay = nextMonth.getDate();

      if (intendedDay === actualDay) {
        // 유효한 날짜
        current = nextMonth;
      } else {
        // 유효하지 않은 날짜는 건너뛰고 다음 월의 동일 날짜로 이동
        current = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), current.getDate());
      }
    }
  }

  if (type === 'yearly') {
    const year = current.getFullYear();
    const month = current.getMonth();
    const day = current.getDate();

    let currentYear = year;
    const endYear = end.getFullYear();

    while (currentYear <= endYear) {
      const nextYearDate = new Date(currentYear, month, day);
      const isValid = nextYearDate.getMonth() === month && nextYearDate.getDate() === day;

      if (isValid) {
        dates.push(formatDate(nextYearDate));
        currentYear += interval;
      } else {
        currentYear++;
      }
    }
  }

  return dates;
}
