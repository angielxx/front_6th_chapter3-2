import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { MAX_END_DATE } from '../constants/repeat';
import { Event, EventForm } from '../types';
import { generateRepeatEvent } from '../utils/eventUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;

      if (eventData.repeat && eventData.repeat.type !== 'none') {
        await createRepeatEvent(eventData);
        return;
      }

      if (editing) {
        response = await fetch(`/api/events/${(eventData as Event).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  const createRepeatEvent = async (eventData: EventForm) => {
    const { type, interval, endDate: repeatEndDate } = eventData.repeat;

    const startDate = new Date(eventData.date);
    const endDate = repeatEndDate
      ? new Date(Math.min(new Date(repeatEndDate).valueOf(), MAX_END_DATE.valueOf()))
      : MAX_END_DATE;

    const dates = generateRepeatEvent(startDate, endDate, interval, type);

    for (const date of dates) {
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...eventData, date }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create event for ${date}`);
        }
      } catch (error) {
        console.error('Error creating repeat event:', error);
        enqueueSnackbar('반복 일정 생성 실패', { variant: 'error' });
        break;
      }
    }

    // 반복 일정 생성 완료 후 이벤트 목록 새로고침
    await fetchEvents();
    enqueueSnackbar('반복 일정이 생성되었습니다.', { variant: 'success' });
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, fetchEvents, saveEvent, createRepeatEvent, deleteEvent };
};
