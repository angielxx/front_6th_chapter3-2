# 현재 작성된 모든 테스트케이스 정리

## 🏗️ **통합 테스트 (Integration Tests)**

### `src/__tests__/medium.integration.spec.tsx` (343 lines)

#### **1. 일정 CRUD 및 기본 기능**

- ✅ **일정 생성**: 입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장
- ✅ **일정 수정**: 기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영
- ✅ **일정 삭제**: 일정을 삭제하고 더 이상 조회되지 않는지 확인

#### **2. 일정 뷰**

- ✅ **주별 뷰 (빈 상태)**: 주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않음
- ✅ **주별 뷰 (일정 있음)**: 주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시
- ✅ **월별 뷰 (빈 상태)**: 월별 뷰에 일정이 없으면, 일정이 표시되지 않음
- ✅ **월별 뷰 (일정 있음)**: 월별 뷰에 일정이 정확히 표시되는지 확인
- ✅ **공휴일 표시**: 달력에 1월 1일(신정)이 공휴일로 표시되는지 확인

#### **3. 검색 기능**

- ✅ **검색 결과 없음**: 검색 결과가 없으면, "검색 결과가 없습니다."가 표시
- ✅ **검색 결과 있음**: '팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출
- ✅ **검색어 초기화**: 검색어를 지우면 모든 일정이 다시 표시

#### **4. 일정 충돌**

- ✅ **새 일정 충돌**: 겹치는 시간에 새 일정을 추가할 때 경고가 표시
- ✅ **기존 일정 수정 충돌**: 기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출

#### **5. 알림 기능**

- ✅ **알림 표시**: notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출

---

## 🧩 **단위 테스트 (Unit Tests)**

### `src/__tests__/unit/easy.dateUtils.spec.ts` (301 lines)

#### **1. getDaysInMonth**

- ✅ 1월은 31일 수를 반환
- ✅ 4월은 30일 일수를 반환
- ✅ 윤년의 2월에 대해 29일을 반환
- ✅ 평년의 2월에 대해 28일을 반환
- ✅ 유효하지 않은 월에 대해 적절히 처리

#### **2. getWeekDates**

- ✅ 주중의 날짜(수요일)에 대해 올바른 주의 날짜들을 반환
- ✅ 주의 시작(월요일)에 대해 올바른 주의 날짜들을 반환
- ✅ 주의 끝(일요일)에 대해 올바른 주의 날짜들을 반환
- ✅ 연도를 넘어가는 주의 날짜를 정확히 처리 (연말)
- ✅ 연도를 넘어가는 주의 날짜를 정확히 처리 (연초)
- ✅ 윤년의 2월 29일을 포함한 주를 올바르게 처리
- ✅ 월의 마지막 날짜를 포함한 주를 올바르게 처리

#### **3. getWeeksAtMonth**

- ✅ 2025년 7월 1일의 올바른 주 정보를 반환
- ✅ 월의 시작이 일요일이 아닌 경우 올바르게 처리
- ✅ 월의 끝이 토요일이 아닌 경우 올바르게 처리

#### **4. formatDate**

- ✅ 날짜를 'YYYY-MM-DD' 형식으로 포맷팅
- ✅ 단일 자리 월/일을 두 자리로 변환

#### **5. formatMonth**

- ✅ 날짜를 'YYYY년 M월' 형식으로 포맷팅

#### **6. formatWeek**

- ✅ 주의 시작과 끝 날짜를 'YYYY년 M월 D일 ~ YYYY년 M월 D일' 형식으로 포맷팅

#### **7. getEventsForDay**

- ✅ 특정 날짜의 이벤트들을 필터링하여 반환
- ✅ 날짜 형식이 다른 경우도 올바르게 처리

#### **8. isDateInRange**

- ✅ 날짜가 범위 내에 있는지 확인
- ✅ 범위 경계값 처리

#### **9. fillZero**

- ✅ 단일 자리 숫자를 두 자리로 변환

### `src/__tests__/unit/easy.eventOverlap.spec.ts` (219 lines)

#### **1. findOverlappingEvents**

- ✅ 완전히 겹치는 일정 감지
- ✅ 부분적으로 겹치는 일정 감지
- ✅ 시작 시간이 겹치는 일정 감지
- ✅ 종료 시간이 겹치는 일정 감지
- ✅ 겹치지 않는 일정은 감지하지 않음
- ✅ 같은 날짜의 다른 시간대 일정은 겹치지 않음으로 처리
- ✅ 다른 날짜의 일정은 겹치지 않음으로 처리

### `src/__tests__/unit/easy.eventUtils.spec.ts` (117 lines)

#### **1. generateEventId**

- ✅ 고유한 ID 생성
- ✅ 연속 호출 시 다른 ID 반환

#### **2. validateEvent**

- ✅ 유효한 이벤트 검증
- ✅ 필수 필드 누락 시 에러 반환
- ✅ 시간 형식 오류 시 에러 반환
- ✅ 시작 시간이 종료 시간보다 늦을 때 에러 반환

### `src/__tests__/unit/easy.fetchHolidays.spec.ts` (36 lines)

#### **1. fetchHolidays**

- ✅ API 호출 성공 시 휴일 데이터 반환
- ✅ API 호출 실패 시 빈 객체 반환

### `src/__tests__/unit/easy.notificationUtils.spec.ts` (93 lines)

#### **1. createNotification**

- ✅ 알림 객체 생성
- ✅ 메시지 포맷팅

#### **2. checkNotifications**

- ✅ 현재 시간 기준으로 알림이 필요한 이벤트 감지
- ✅ 알림 시간이 지난 이벤트는 감지하지 않음
- ✅ 알림 시간이 미래인 이벤트는 감지하지 않음

### `src/__tests__/unit/easy.timeValidation.spec.ts` (52 lines)

#### **1. validateTime**

- ✅ 유효한 시간 형식 검증
- ✅ 잘못된 시간 형식 에러 처리
- ✅ 시간 범위 검증

#### **2. getTimeErrorMessage**

- ✅ 시작 시간이 종료 시간보다 늦을 때 에러 메시지 반환
- ✅ 유효한 시간일 때 null 반환

---

## 🪝 **훅 테스트 (Hook Tests)**

### `src/__tests__/hooks/easy.useCalendarView.spec.ts` (97 lines)

#### **1. 초기 상태**

- ✅ view는 "month"이어야 함
- ✅ currentDate는 오늘 날짜인 "2025-10-01"이어야 함
- ✅ holidays는 10월 휴일인 개천절, 한글날, 추석이 지정되어 있어야 함

#### **2. 뷰 변경**

- ✅ view를 'week'으로 변경 시 적절하게 반영

#### **3. 네비게이션**

- ✅ 주간 뷰에서 다음으로 navigate시 7일 후 '2025-10-08' 날짜로 지정
- ✅ 주간 뷰에서 이전으로 navigate시 7일 후 '2025-09-24' 날짜로 지정
- ✅ 월간 뷰에서 다음으로 navigate시 한 달 후 '2025-11-01' 날짜
- ✅ 월간 뷰에서 이전으로 navigate시 한 달 전 '2025-09-01' 날짜

#### **4. 휴일 업데이트**

- ✅ currentDate가 '2025-03-01' 변경되면 3월 휴일 '삼일절'로 업데이트

### `src/__tests__/hooks/easy.useSearch.spec.ts` (160 lines)

#### **1. 검색 기능**

- ✅ 검색어가 없을 때 모든 이벤트 반환
- ✅ 제목으로 검색
- ✅ 설명으로 검색
- ✅ 위치로 검색
- ✅ 대소문자 구분 없이 검색
- ✅ 부분 일치 검색

### `src/__tests__/hooks/medium.useEventOperations.spec.ts` (174 lines)

#### **1. 이벤트 CRUD**

- ✅ 이벤트 생성
- ✅ 이벤트 수정
- ✅ 이벤트 삭제
- ✅ 에러 처리

### `src/__tests__/hooks/medium.useNotifications.spec.ts` (100 lines)

#### **1. 알림 관리**

- ✅ 알림 추가
- ✅ 알림 제거
- ✅ 알림 상태 관리

---

## 📊 **테스트 통계**

- **총 테스트 파일**: 10개
- **통합 테스트**: 1개 (343 lines)
- **단위 테스트**: 6개 (818 lines)
- **훅 테스트**: 4개 (531 lines)
- **총 테스트케이스**: 약 50+ 개
- **테스트 커버리지**: 주요 기능 모두 포함

## 🎯 **테스트 특징**

1. **계층적 구조**: 단위 → 훅 → 통합 테스트로 구성
2. **실용적 접근**: 실제 사용 시나리오 기반 테스트
3. **에러 케이스**: 정상 케이스와 에러 케이스 모두 포함
4. **시간 관련**: 날짜/시간 처리 로직 철저히 테스트
5. **사용자 인터랙션**: 실제 사용자 행동 시뮬레이션

## 📁 **파일 구조**

```
src/__tests__/
├── medium.integration.spec.tsx    # 통합 테스트
├── utils.ts                       # 테스트 유틸리티
├── unit/                          # 단위 테스트
│   ├── easy.dateUtils.spec.ts
│   ├── easy.eventOverlap.spec.ts
│   ├── easy.eventUtils.spec.ts
│   ├── easy.fetchHolidays.spec.ts
│   ├── easy.notificationUtils.spec.ts
│   └── easy.timeValidation.spec.ts
└── hooks/                         # 훅 테스트
    ├── easy.useCalendarView.spec.ts
    ├── easy.useSearch.spec.ts
    ├── medium.useEventOperations.spec.ts
    └── medium.useNotifications.spec.ts
```

## 🚀 **테스트 실행**

```bash
# 모든 테스트 실행
npx vitest run

# 특정 테스트 파일 실행
npx vitest run src/__tests__/medium.integration.spec.tsx

# 단위 테스트만 실행
npx vitest run src/__tests__/unit/

# 훅 테스트만 실행
npx vitest run src/__tests__/hooks/
```
