# StudyNet - 프로젝트 전체 설명

## 📌 프로젝트 개요

**StudyNet**은 React Native + Expo 기반의 **크로스플랫폼 스터디 관리 앱**입니다. 
사용자들이 개인적으로 또는 그룹으로 학습 세션을 관리하고, 진행 상황을 추적하며, 함께 성장할 수 있는 스터디 커뮤니티를 제공합니다.

**핵심 기능**: 타이머 기반 학습 세션 관리, 과목별 학습 통계, 그룹 스터디 화상 기능, 일일 목표 설정 및 달성도 추적

---

## 🛠️ 기술 스택

- **프레임워크**: React Native 0.81.5 + Expo 54.0
- **언어**: TypeScript 5.9
- **상태 관리**: React Context API, AsyncStorage
- **네비게이션**: Expo Router (파일 기반 라우팅)
- **UI 라이브러리**: 
  - @expo/vector-icons (Ionicons)
  - react-native-reanimated (애니메이션)
  - react-native-svg (SVG 렌더링)
- **로컬 저장소**: @react-native-async-storage/async-storage
- **기타**: react-native-gesture-handler, react-native-safe-area-context

---

## 📂 프로젝트 구조 및 주요 화면

### 라우팅 구조 (`app/` 디렉토리)

```
app/
├── _layout.tsx              # 루트 레이아웃 (Stack 네비게이션)
├── login.tsx                # 로그인 화면
├── signup.tsx               # 회원가입 화면
├── password.tsx             # 비밀번호 찾기
├── modal.tsx                # 모달 화면
├── main.tsx                 # 메인 홈 화면
├── study.tsx                # 학습 세션 화면 (타이머)
├── Group.tsx                # 그룹 스터디 화면 (화상)
├── statistics.tsx           # 통계 화면 (준비 중)
├── subject-select.tsx       # 과목 선택 화면
├── Activesessionbanner.tsx  # 활성 세션 배너
├── (tabs)/                  # 탭 네비게이션 그룹
│   ├── _layout.tsx          # 탭 레이아웃 (3개 탭)
│   ├── index.tsx            # 홈 탭 (메인 화면)
│   ├── group.tsx            # 그룹 탭 (Group.tsx로 리다이렉트)
│   └── more.tsx             # 더보기 탭
└── setting/                 # 설정 관련 페이지
    ├── index.tsx            # 설정 홈
    ├── profile.tsx          # 프로필 설정
    ├── focus-mode.tsx       # 포커스 모드
    └── password.tsx         # 비밀번호 변경
```

---

## 🎨 주요 기능별 상세 설명

### 1. **인증 시스템** (`login.tsx`, `signup.tsx`, `password.tsx`)

**로그인 화면** (`login.tsx`)
- 이메일 + 비밀번호 기반 로그인
- 유효성 검사: 이메일 형식 + 비밀번호 6자 이상
- 로딩 상태 관리 (중복 클릭 방지)
- 비밀번호 표시/숨기기 토글
- 소셜 로그인 UI (Google, Kakao, Apple) - 준비 중
- 회원가입 링크
- 비밀번호 찾기 링크
- 입장 애니메이션 (Fade + Slide)

**향후 작업**
- 실제 API 연동 (백엔드 인증)
- 소셜 로그인 구현
- 토큰 기반 세션 관리

---

### 2. **메인 홈 화면** (`main.tsx`)

메인 화면은 **SessionProvider Context** 기반으로 활성 세션 상태를 중앙 관리합니다.

#### 상단 영역
- **헤더**: 인사말 + 앱 로고 "StudyNet" + 설정 버튼
- **시간/날짜**: 요일과 날짜 표시

#### TODAY FOCUS 카드 (핵심 위젯)
- **경과 시간**: 오늘 누적 학습 시간 (HH:MM:SS)
- **진행 원형 그래프**: SVG 기반 진행률 시각화
  - 목표 달성 시 초록색으로 변경
  - 투명 그라디언트로 시각적 강조
- **남은 시간**: "목표까지 2시간 30분" 형식
- **동기 부여 문구**: "오늘도 꾸준히 성장중 ✨"
- **통계**: 연속 학습일 수, 총 세션 횟수, 달성률

#### 액션 버튼
- **학습 시작** (활성 세션 없을 때): 과목 선택 화면으로 이동
- **돌아가기** (활성 세션 있을 때): 진행 중인 세션으로 복귀
- **세션 추가** 버튼

#### 빠른 메뉴 (2x2 그리드)
- 📊 통계 (준비 중)
- 📅 달력 (준비 중)
- 🏆 랭킹 (준비 중)
- 👥 **그룹** (활성)

#### 최근 활동
- 역순으로 정렬된 학습 세션 목록
- 과목별 아바타 + 학습 시간 + 시간대 표시
- 빈 상태: "아직 활동 기록이 없어요" 메시지

---

### 3. **학습 세션 화면** (`study.tsx`)

사용자가 특정 과목을 선택한 후 타이머를 진행하는 화면입니다.

#### 핵심 기능

**타이머 관리**
- 정확한 시간 추적 (startEpoch 기반)
- 앱 백그라운드 전환 후 복귀 시 정확한 경과 시간 복원
- AsyncStorage에 세션 정보 저장

**양면 카드 애니메이션 (Flip)**
- **앞면**: 진행 중인 세션 (경과 시간, 남은 시간, 진행률)
- **뒷면**: 오늘 통계 (전체 학습 시간, 과목별 분석)
- 탭하여 양쪽을 전환

**진행률 표시**
- SVG 기반 원형 진행 바
- 목표 달성 시 초록색 뱃지 표시
- 달성률 퍼센트 표시

**상태 표시**
- 상단 진행중/일시정지 상태 배지
- 과목 태그
- 세션 정보 카드

**컨트롤 버튼**
- ⏸️ **일시정지/재개**: 타이머 일시정지
- 🛑 **세션 종료**: 확인 후 세션 기록 저장
- 목표 시간 설정 모달 (시간/분 별도 조정)

#### 목표 시간 설정 모달
- 시간 (0-24) + 분 (0-50, 10분 단위)
- +/- 버튼으로 조정
- 저장 시 AsyncStorage에 저장 및 리로드

#### 세션 데이터 구조
```json
{
  "seconds": 3600,
  "subject": "수학",
  "date": "2026-05-21T10:30:00.000Z"
}
```

---

### 4. **그룹 스터디 화면** (`Group.tsx`)

사용자들이 함께 온라인 스터디를 진행할 수 있는 화상 통화 기능입니다.

#### 화면 1: 방 목록 (`screen === "list"`)

**코드 입력 섹션**
- "코드로 참여하기" 버튼
- 6자리 초대 코드 입력 모달
- 대문자 자동 변환, 숫자만 허용
- 에러 메시지: "존재하지 않는 코드", "방이 꽉 참" 등
- 테스트 코드: `4EJ9K2`, `9KM2X1`, `7BX3M1`

**공개 방 목록**
```
MOCK_ROOMS = [
  {
    id: "1",
    name: "수능 스터디룸",
    emoji: "📚",
    subjects: "수학 · 영어 · 과학",
    members: [3명], max: 6명,
    code: "4EJ9K2"
  },
  // ... 3개 방
]
```

**각 방 카드**
- 이모지 + 방 이름 + 과목
- 현재 인원 / 최대 인원
- 참여 중인 멤버 미니 아바타 (최대 4개 표시, 초과 시 +N)
- "참여" 버튼 또는 "꽉 참" 상태
- 꽉 찬 방은 클릭 불가능 (opacity 0.55)

**새 방 만들기**
- 버튼만 구현 (기능 미구현)

---

#### 화면 2: 스터디 룸 (`screen === "room"`)

**헤더**
- 방 이름 + 방 코드
- LIVE 배지 (실시간 점프 애니메이션)
- 인원 표시 (현재/최대)

**멤버 그리드 (2열)**
- 각 카드: 4x3 비율 세로 영상 통화 카드
- 배경: 멤버별 컬러 반투명
- 멤버 아바타 + 이름
- "ME" 태그 (자신 표시)
- 과목 태그 (컬러 점 + 텍스트)
- 타이머 표시 (HH:MM:SS)
- 마이크 꺼짐 배지 (우측 상단)
- 말하는 중: 초록색 보더 (스피커 강조)

**MOCK 멤버 데이터**
```javascript
{
  id: "1",
  name: "김민준",
  subject: "수학",
  color: "#6EA8FE",
  timer: "01:23:45",
  muted: false,
  speaking: true,
  status: "집중중",
  statusColor: "#10B981",
}
```

**세션 타이머 바**
- 라벨: "세션"
- 경과 시간: "01:23:45"
- 진행도 바 (46%)
- 달성율 표시

**컨트롤 바 (하단)**
- 🎤 마이크 토글 (ON: 흰색, OFF: 회색)
- 📹 카메라 토글 (ON: 흰색, OFF: 회색)
- 😊 이모지 버튼 4개 (👍, 🔥, ☕, 💪)
  - 누르면 화면 아래에서 위로 떠오르는 이모지 애니메이션
- 📞 통화 끝내기 버튼 (빨간색)

**이모지 플로팅 애니메이션**
- Y축 -80px 이동 (1.8초)
- Opacity 0 → 1 → 0 페이드아웃

---

### 5. **타이머 배너** (`Activesessionbanner.tsx`, `main.tsx`)

**위치**: 메인 화면 하단 (절대 위치)

**표시 조건**: 
- AsyncStorage의 `active_session` 데이터가 있을 때만 표시
- Spring 애니메이션으로 슬라이드 업/다운

**컴포넌트 구성**
```
┌─────────────────────────────────────────┐
│ [진행도 바]                              │
├─────────────────────────────────────────┤
│ 🔴 수학              01:23:45 | 46% | [돌아가기] │
└─────────────────────────────────────────┘
```

**기능**
- 과목명 + 경과 시간 (실시간 업데이트)
- 진행도 바 (목표 대비 달성률)
- "돌아가기" 버튼 (학습 화면으로 네비게이션)

---

### 6. **설정 화면** (`setting/index.tsx`, `profile.tsx`, `focus-mode.tsx`, `password.tsx`)

각 설정 페이지는 준비 단계이거나 스켈레톤 상태입니다.
- 프로필 설정: 사용자 정보 수정 (미구현)
- 포커스 모드: 집중 시간 설정 (미구현)
- 비밀번호 변경: 보안 설정 (미구현)

---

## 📊 데이터 흐름 및 상태 관리

### AsyncStorage 키 구조

```javascript
// 학습 세션 기록 (누적)
"study_sessions" → [
  { seconds: 3600, subject: "수학", date: "2026-05-21T..." },
  { seconds: 1800, subject: "영어", date: "2026-05-21T..." },
  ...
]

// 일일 목표 (초 단위)
"daily_goal_seconds" → 10800 (기본값: 3시간)

// 현재 진행 중인 세션 (메인 화면에서 배너 표시용)
"active_session" → {
  subject: "수학",
  startEpoch: 1716252600000,
  goalSeconds: 10800
}
```

### Context API 구조

**SessionProvider** (`main.tsx`)
- 활성 세션 상태 중앙 관리
- 1초마다 elapsed 갱신 (setState 1회)
- 5초마다 AsyncStorage 재조회
- Banner 와 MainScreenInner가 동일한 세션 상태 구독

```typescript
interface SessionContextValue {
  session: ActiveSessionData | null;
  elapsed: number;
  hasActiveSession: boolean;
  refresh: () => Promise<void>;
}
```

---

## 🎯 주요 기술 포인트

### 1. **정확한 타이머 구현**

**문제**: App 백그라운드 전환 후 타이머 정확성 손실

**솔루션**:
- `startEpoch` (타이머 시작 Unix 시간) 저장
- 화면 복귀 시: `현재시간 - startEpoch` 로 정확한 경과 시간 계산
- AsyncStorage 영속성으로 앱 재시작 후에도 복원

### 2. **Flip 애니메이션** (study.tsx)

`Animated.Value` + 3D transform 활용:
```typescript
const frontRotateY = flipAnim.interpolate({ 
  inputRange: [0, 1], 
  outputRange: ["0deg", "-180deg"] 
});
```
- pointerEvents 토글로 양쪽 면의 터치 입력 제어
- Opacity 전환: 0.5 지점에서 앞면 숨김 → 뒷면 표시

### 3. **과목별 색상 매핑**

```typescript
const SUBJECT_COLORS = [
  "#60A5FA", "#34D399", "#FBBF24", "#A78BFA",
  "#F87171", "#22D3EE", "#F472B6", "#A3E635",
];

// useMemo로 캐시 (과목 추가 시 자동 재계산)
const subjectColorMap = useMemo(() => {
  const sorted = [...allSubjectNames].sort();
  const map: Record<string, string> = {};
  sorted.forEach((name, idx) => {
    map[name] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
  });
  return map;
}, [allSubjectNames]);
```

### 4. **타임존 무관 날짜 처리**

```typescript
const toDateKey = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-"); // "2026-05-21"
```

`toDateString()` 대신 YYYY-MM-DD 고정 포맷 사용 → 로케일/타임존 무관

---

## 🚀 개발 현황

### ✅ 완료된 기능
- 로그인 UI + 유효성 검사
- 메인 홈 화면 (TODAY FOCUS, 최근 활동)
- 학습 세션 스크린 (타이머, 양면 카드, 목표 설정)
- 그룹 스터디 UI (방 목록, 화상 카드, 컨트롤)
- 타이머 배너 (활성 세션 표시)
- 과목별 색상 시스템
- AsyncStorage 기반 데이터 영속성

### 🔄 진행 중
- Group.tsx 데모 버전 UI 다듬기
- main.tsx 타이머 유지 기능 검증
- statistics.tsx 통계 페이지 개발

### ⏳ 향후 작업 (준비 중)
- 백엔드 API 연동 (회원가입, 로그인, 세션 저장)
- 소셜 로그인 (Google, Kakao, Apple)
- 실제 화상 통화 기능 (WebRTC 또는 Agora SDK)
- 통계/캘린더 페이지
- 랭킹 시스템
- 포커스 모드 (방해금지 기능)
- 알림 시스템 (목표 달성, 스트릭 유지 등)

---

## 🎨 디자인 시스템

### 색상 팔레트

```javascript
const C = {
  // 배경
  bg: "#0A0E1A",
  surface: "#111827",
  surfaceAlt: "#151D2E",
  surfaceElevated: "#141D2F",
  
  // 액센트
  accent: "#3B82F6",          // 주 파란색
  accentLight: "#93C5FD",     // 밝은 파란색
  success: "#10B981",         // 초록색
  danger: "#EF4444",          // 빨간색
  purple: "#7C6CF2",          // 보라색
  
  // 텍스트
  textPrimary: "#F8FAFC",     // 밝은 흰색
  textSecondary: "#CBD5E1",   // 회색
  textTertiary: "#64748B",    // 어두운 회색
  textAccent: "#60A5FA",      // 강조 파란색
  
  // 기타
  border: "rgba(255,255,255,0.06)",
  glow: "rgba(59,130,246,0.12)",
};
```

### 과목 색상
- 수학: #60A5FA
- 과학: #34D399
- 영어: #FBBF24
- 국어: #A78BFA
- 기타: #F87171, #22D3EE, #F472B6, #A3E635

### 타이포그래피
- 큰 제목: fontSize 40-44, fontWeight 900
- 일반 텍스트: fontSize 14-15, fontWeight 600
- 작은 텍스트: fontSize 10-12, fontWeight 600

---

## 📱 화면 크기 대응

```javascript
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_WIDTH = 520;
const SAFE_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);
```

최대 너비 520px로 제한하여 태블릿 환경에서도 균형 잡힌 레이아웃 유지

---

## 🔗 라우팅 맵

```
/login                 → 로그인
  └─ /signup          → 회원가입
  └─ /password        → 비밀번호 찾기

/(tabs)               → 탭 네비게이션
  ├─ /               → 메인 홈 (TODAY FOCUS, 최근 활동)
  ├─ /group          → 그룹 스터디 (Group.tsx)
  └─ /more           → 더보기

/main                 → 메인 화면 (배너 포함)
/study?subject=수학   → 학습 세션
/subject-select       → 과목 선택
/Group                → 그룹 상세 (방 목록 / 룸 선택)
/statistics           → 통계 (준비 중)
/setting              → 설정
  ├─ /profile        → 프로필
  ├─ /focus-mode     → 포커스 모드
  └─ /password       → 비밀번호 변경
```

---

## 💡 사용자 여정

1. **온보딩**: 로그인 → 회원가입 (OAuth 지원 예정)
2. **학습 시작**: 메인 홈 → "학습 시작" → 과목 선택 → 타이머 진행
3. **세션 일시정지**: 타이머 화면 → "최소화" → 메인 홈 (배너 유지)
4. **세션 재개**: 배너 클릭 또는 메인 홈의 "돌아가기" 버튼
5. **세션 종료**: 타이머 화면 → "세션 종료" → 통계 업데이트
6. **그룹 참여**: 메인 홈 → 그룹 메뉴 → 코드 입력 또는 방 선택 → 화상 통화

---

## 📝 주석 및 FIX 노트

코드 전반에 `[FIX]` 주석으로 이전 구현의 문제점과 개선사항을 명시:

- **타임존 문제** (`toDateKey` 사용)
- **중복 I/O 최적화** (SessionProvider Context 집중화)
- **에러 상태 노출** (silent catch → 사용자 피드백)
- **색상 캐시 최적화** (전역 변수 → useMemo)
- **비활성 버튼 시각화** (opacity 0.45, disabled 상태)

---

## 🐛 알려진 이슈 및 TODO

- [ ] 백엔드 API 연동 필요
- [ ] 실제 WebRTC 화상 통화 구현
- [ ] 소셜 로그인 구현
- [ ] statistics.tsx 통계 차트 구현
- [ ] 포커스 모드 DND 기능
- [ ] 알림 시스템 (로컬 + 푸시)
- [ ] 오프라인 모드 지원

---

이 문서는 프로젝트의 현재 상태를 반영하며, 개발 진행에 따라 업데이트됩니다.
