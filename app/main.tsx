import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useMonoTheme, type MonoTheme } from "../constants/mono";

// ─── Design tokens ────────────────────────────────────────────────────────────
const createLegacyTheme = (theme: MonoTheme) => ({
  bg: theme.bg,
  surface: theme.surface,
  surfaceAlt: theme.surfaceAlt,
  surfaceElevated: theme.surface,
  border: theme.border,
  accent: theme.text,
  accentLight: theme.text,
  accentSoft: theme.surface,
  success: theme.text,
  successSoft: theme.surface,
  textPrimary: theme.text,
  textSecondary: theme.text,
  textTertiary: theme.text,
  glow: theme.surface,
});

type LegacyTheme = ReturnType<typeof createLegacyTheme>;

const SUBJECT_COLORS = [
  "#000",
  "#000",
  "#000",
  "#000",
  "#000",
  "#000",
  "#000",
  "#000",
];

const KEY_ACTIVE = "active_session";

// ─── Date utility ─────────────────────────────────────────────────────────────
const toDateKey = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

// ─── Session Context ──────────────────────────────────────────────────────────
interface ActiveSessionData {
  subject: string;
  startEpoch: number;
  goalSeconds: number;
}

interface SessionContextValue {
  session: ActiveSessionData | null;
  elapsed: number;
  hasActiveSession: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  elapsed: 0,
  hasActiveSession: false,
  refresh: async () => {},
});

function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const sessionRef = useRef<ActiveSessionData | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_ACTIVE);
      if (raw) {
        const data: ActiveSessionData = JSON.parse(raw);
        sessionRef.current = data;
        setSession(data);
        setElapsed(Math.floor((Date.now() - data.startEpoch) / 1000));
      } else {
        sessionRef.current = null;
        setSession(null);
        setElapsed(0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();

    tickRef.current = setInterval(() => {
      if (sessionRef.current) {
        setElapsed(
          Math.floor((Date.now() - sessionRef.current.startEpoch) / 1000)
        );
      }
      pollCount.current += 1;
      if (pollCount.current % 5 === 0) {
        refresh();
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ session, elapsed, hasActiveSession: !!session, refresh }),
    [session, elapsed, refresh]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// ─── ActiveSessionBanner ──────────────────────────────────────────────────────
function ActiveSessionBanner() {
  const router = useRouter();
  const { theme } = useMonoTheme();
  const C = useMemo(() => createLegacyTheme(theme), [theme]);
  const bs = useMemo(() => createBannerStyles(C), [C]);
  const { session, elapsed } = useContext(SessionContext);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const isActive = !!session;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isActive ? 0 : 100,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isActive, slideAnim]);

  if (!session) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const percent = Math.min(
    Math.round((elapsed / session.goalSeconds) * 100),
    100
  );

  return (
    <Animated.View
      style={[bs.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={bs.progressTrack}>
        <View style={[bs.progressFill, { width: `${percent}%` }]} />
      </View>
      <View style={bs.inner}>
        <View style={bs.left}>
          <View style={bs.liveDot} />
          <View>
            <Text style={bs.subject}>{session.subject}</Text>
            <Text style={bs.time}>{fmt(elapsed)}</Text>
          </View>
        </View>
        <View style={bs.right}>
          <Text style={bs.percent}>{percent}%</Text>
          <TouchableOpacity
            style={bs.resumeBtn}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/study",
                params: { subject: session.subject },
              })
            }
          >
            <Ionicons
              name="play"
              size={11}
              color="#000"
              style={{ marginRight: 4 }}
            />
            <Text style={bs.resumeText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── MainScreenInner ──────────────────────────────────────────────────────────
function MainScreenInner() {
  const router = useRouter();
  const { added } = useLocalSearchParams();
  const { theme } = useMonoTheme();
  const C = useMemo(() => createLegacyTheme(theme), [theme]);
  const styles = useMemo(() => createStyles(C), [C]);

  const {
    session: activeSession,
    elapsed: liveExtra,
    hasActiveSession,
    refresh: refreshSession,
  } = useContext(SessionContext);

  const [sessions, setSessions] = useState<any[]>([]);
  const [savedSeconds, setSavedSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60 * 60 * 3);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoadError(null);

      const savedGoal = await AsyncStorage.getItem("daily_goal_seconds");
      if (savedGoal) setDailyGoal(Number(savedGoal));

      const raw = await AsyncStorage.getItem("study_sessions");
      const list: any[] = raw ? JSON.parse(raw) : [];

      // [FIX] subject가 없는 깨진 데이터 필터링
      const validList = list.filter((s) => s && s.subject);
      setSessions(validList);

      const todayKey = toDateKey(new Date());
      const todaySum = validList
        .filter((s) => toDateKey(new Date(s.date)) === todayKey)
        .reduce((sum, s) => sum + s.seconds, 0);
      setSavedSeconds(todaySum);

      const uniqueDays = Array.from(
        new Set(validList.map((s) => toDateKey(new Date(s.date))))
      )
        .sort()
        .reverse();

      let count = 0;
      const cursor = new Date();
      for (const day of uniqueDays) {
        if (day === toDateKey(cursor)) {
          count++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
      setStreak(count);
    } catch (e) {
      console.error("데이터 로드 실패", e);
      setLoadError("데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }, []);

  useEffect(() => {
    loadSessions();
    refreshSession();
  }, [added, loadSessions, refreshSession]);

  const allSubjectNames = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.subject))) as string[],
    [sessions]
  );

  const subjectColorMap = useMemo(() => {
    const sorted = [...allSubjectNames].sort();
    const map: Record<string, string> = {};
    sorted.forEach((name, idx) => {
      map[name] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
    });
    return map;
  }, [allSubjectNames]);

  const getSubjectColor = useCallback(
    (name: string) => subjectColorMap[name] ?? SUBJECT_COLORS[0],
    [subjectColorMap]
  );

  const todaySeconds = savedSeconds + liveExtra;
  const percent = Math.min(todaySeconds / dailyGoal, 1);
  const remain = Math.max(dailyGoal - todaySeconds, 0);
  const goalDone = todaySeconds >= dailyGoal;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  };

  const formatRemain = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const accentColor = goalDone ? C.success : C.accent;
  const accentLightColor = goalDone ? "#000" : C.accentLight;

  const ringR = 30;
  const ringCirc = 2 * Math.PI * ringR;

  const greet = () => {
    const h = today.getHours();
    if (h < 12) return "좋은 아침이에요";
    if (h < 18) return "집중하는 오후네요";
    return "오늘도 수고했어요";
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.header}>
          <View>
            <Text style={styles.greetText}>{greet()}</Text>
            <Text style={styles.appName}>StudyNet</Text>
          </View>
          <TouchableOpacity
            style={styles.settingBtn}
            onPress={() => router.push("/setting")}
          >
            <Ionicons
              name="settings-outline"
              size={18}
              color={C.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.dateText}>{dateStr}</Text>

          {loadError && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color="#000"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          )}

          <View style={styles.focusCard}>
            <View style={styles.focusGlow} />

            <View style={styles.focusCardHeader}>
              <Text style={styles.focusCardLabel}>TODAY FOCUS</Text>
              {goalDone && (
                <View style={styles.goalBadge}>
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color={C.success}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={styles.goalBadgeText}>목표 달성</Text>
                </View>
              )}
            </View>

            <View style={styles.focusMain}>
              <View style={styles.focusLeft}>
                <Text style={styles.focusTime}>
                  {formatTime(todaySeconds)}
                </Text>
                <Text style={styles.focusRemain}>
                  {goalDone
                    ? "오늘 목표를 완료했어요"
                    : `목표까지 ${formatRemain(remain)}`}
                </Text>
                <Text style={styles.motivation}>오늘도 꾸준히 성장중 ✨</Text>
              </View>

              <View style={styles.ringWrap}>
                <Svg width={82} height={82} viewBox="0 0 82 82">
                  <Defs>
                    <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor={accentColor} />
                      <Stop offset="100%" stopColor={accentLightColor} />
                    </LinearGradient>
                  </Defs>
                  <Circle
                    cx="41"
                    cy="41"
                    r={ringR}
                    stroke="#fff"
                    strokeWidth={4}
                    fill="none"
                  />
                  <Circle
                    cx="41"
                    cy="41"
                    r={ringR}
                    stroke="url(#rg)"
                    strokeWidth={4}
                    fill="none"
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringCirc * (1 - percent)}
                    strokeLinecap="round"
                    rotation="-90"
                    origin="41, 41"
                  />
                </Svg>
                <View style={styles.ringInner}>
                  <Text style={[styles.ringPercent, { color: accentLightColor }]}>
                    {Math.round(percent * 100)}%
                  </Text>
                  <Text style={styles.ringLabel}>달성</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percent * 100}%`,
                    backgroundColor: "#000",
                  },
                ]}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streak}일</Text>
                <Text style={styles.statLabel}>연속 학습</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sessions.length}회</Text>
                <Text style={styles.statLabel}>총 세션</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: accentLightColor }]}>
                  {Math.round(percent * 100)}%
                </Text>
                <Text style={styles.statLabel}>달성률</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              {hasActiveSession ? (
                <>
                  <TouchableOpacity
                    style={[styles.startBtn, { backgroundColor: "#fff" }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (activeSession) {
                        router.push({
                          pathname: "/study",
                          params: { subject: activeSession.subject },
                        });
                      }
                    }}
                  >
                    <Ionicons
                      name="play"
                      size={15}
                      color="#000"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.startBtnText}>돌아가기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    activeOpacity={0.75}
                    onPress={() => router.push("/subject-select")}
                  >
                    <Ionicons name="add" size={20} color={C.textSecondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.85}
                    onPress={() => router.push("/subject-select")}
                  >
                    <Ionicons
                      name="play"
                      size={15}
                      color="#000"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.startBtnText}>학습 시작</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resetBtn, { opacity: 0.4 }]}
                    activeOpacity={1}
                    disabled
                  >
                    <Ionicons name="refresh" size={18} color={C.textSecondary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 4 }]}>빠른 메뉴</Text>

          <View style={styles.menuGrid}>
            <QuickMenu
              icon="bar-chart-outline"
              label="통계"
              color="#000"
              onPress={() => router.push("/statistics")}
            />
            <QuickMenu
              icon="calendar-outline"
              label="달력"
              color="#000"
              onPress={() => router.push("/calendar")}
            />
            <QuickMenu
              icon="trophy-outline"
              label="랭킹"
              color="#000"
              onPress={() => router.push("/ranking")}
            />
            <QuickMenu
              icon="people-outline"
              label="그룹"
              color="#000"
              onPress={() => router.push("/Group")}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 4 }]}>최근 활동</Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={C.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>아직 활동 기록이 없어요</Text>
              <Text style={styles.emptyDesc}>학습을 시작하면 여기에 기록돼요</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.activityList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {sessions
                .filter((s) => s && s.subject)  // [FIX] 깨진 데이터 방어
                .slice()
                .reverse()
                .map((s, i) => {
                  const color = getSubjectColor(s.subject);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.activityItem,
                        i > 0 && styles.activityItemBorder,
                      ]}
                    >
                      <View style={styles.activityLeft}>
                        <View
                          style={[
                            styles.activityAvatar,
                            { backgroundColor: color + "22" },
                          ]}
                        >
                          <Text
                            style={[styles.activityAvatarText, { color }]}
                          >
                            {s.subject[0]}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.activitySubject}>
                            {s.subject}
                          </Text>
                          <Text style={styles.activityTime}>
                            {new Date(s.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.durationTag,
                          { backgroundColor: color + "22" },
                        ]}
                      >
                        <Text style={[styles.durationTagText, { color }]}>
                          +{Math.floor(s.seconds / 60)}분
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      <ActiveSessionBanner />
    </View>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────
export default function MainScreen() {
  return (
    <SessionProvider>
      <MainScreenInner />
    </SessionProvider>
  );
}

// ─── QuickMenu ────────────────────────────────────────────────────────────────
function QuickMenu({
  icon,
  label,
  comingSoon,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  comingSoon?: boolean;
  onPress?: () => void;
}) {
  const { theme } = useMonoTheme();
  const C = useMemo(() => createLegacyTheme(theme), [theme]);
  const styles = useMemo(() => createStyles(C), [C]);

  return (
    <TouchableOpacity
      style={[styles.quickItem, comingSoon && { opacity: 0.45 }]}
      activeOpacity={comingSoon ? 1 : 0.8}
      onPress={!comingSoon ? onPress : undefined}
    >
      <View style={styles.quickIconBox}>
        <Ionicons name={icon} size={22} color={C.textPrimary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      {comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>준비중</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createBannerStyles = (C: LegacyTheme) => StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: C.surfaceElevated,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  progressTrack: {
    height: 2,
    backgroundColor: C.border,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  subject: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  time: {
    color: C.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  percent: {
    color: C.accentLight,
    fontWeight: "700",
  },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  resumeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
});

const createStyles = (C: LegacyTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 26,
    paddingTop: 62,
    paddingBottom: 22,
  },
  greetText: {
    color: C.textTertiary,
    fontSize: 12,
    marginBottom: 4,
  },
  appName: {
    color: C.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -1,
  },
  settingBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  dateText: {
    color: C.textTertiary,
    fontSize: 12,
    marginBottom: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#000",
  },
  errorText: {
    color: "#000",
    fontSize: 12,
    flex: 1,
  },
  focusCard: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  focusGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: C.glow,
    top: -120,
    right: -80,
  },
  focusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  focusCardLabel: {
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalBadgeText: {
    color: C.success,
    fontSize: 10,
    fontWeight: "700",
  },
  focusMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  focusLeft: {
    flex: 1,
  },
  focusTime: {
    color: C.textPrimary,
    fontSize: 42,
    fontWeight: "200",
    letterSpacing: -2,
    marginBottom: 6,
    fontVariant: ["tabular-nums"],
  },
  focusRemain: {
    color: C.textSecondary,
    fontSize: 13,
  },
  motivation: {
    color: C.textTertiary,
    fontSize: 13,
    marginTop: 8,
  },
  ringWrap: {
    width: 82,
    height: 82,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 18,
  },
  ringInner: {
    position: "absolute",
    alignItems: "center",
  },
  ringPercent: {
    fontSize: 15,
    fontWeight: "700",
  },
  ringLabel: {
    color: C.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#fff",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 6,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.border,
  },
  statValue: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  statLabel: {
    color: C.textTertiary,
    fontSize: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  startBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
  resetBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: C.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  quickItem: {
    width: "48%",
    backgroundColor: C.surfaceElevated,
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  quickLabel: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  comingSoonBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: C.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    color: C.textTertiary,
    fontSize: 10,
  },
  activityList: {
    maxHeight: 260,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.border,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  activityItemBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  activityAvatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  activitySubject: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  activityTime: {
    color: C.textTertiary,
    fontSize: 11,
  },
  durationTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  durationTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: C.surfaceElevated,
    borderRadius: 22,
    paddingVertical: 46,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
    marginBottom: 14,
  },
  emptyTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyDesc: {
    color: C.textTertiary,
    fontSize: 12,
  },
});
