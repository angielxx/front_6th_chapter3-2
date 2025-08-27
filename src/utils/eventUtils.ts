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
  endDate: string | Date,
  interval: number,
  type: RepeatType
) {
  const dates: string[] = [];

  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;

  if (start > end) {
    return [];
  }

  if (type === 'daily') {
    while (start <= end) {
      dates.push(formatDate(start));
      start.setDate(start.getDate() + interval);
    }
  }

  if (type === 'weekly') {
    while (start <= end) {
      dates.push(formatDate(start));
      start.setDate(start.getDate() + 7 * interval);
    }
  }

  if (type === 'monthly') {
    while (start <= end) {
      dates.push(formatDate(start));
      start.setMonth(start.getMonth() + interval);
    }
  }

  if (type === 'yearly') {
    while (start <= end) {
      dates.push(formatDate(start));
      start.setFullYear(start.getFullYear() + interval);
    }
  }

  return dates;
}
