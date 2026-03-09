import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const DAILY_GOAL = 60 * 60 * 3;

export default function MainScreen() {
  const router = useRouter();
  const { added } = useLocalSearchParams();
  const [sessions, setSessions] = useState([]);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [streak, setStreak] = useState(0);

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}시간 ${m}분 ${sec}초`;
  };

  const formatMin = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  const resetToday = async () => {
    const raw = await AsyncStorage.getItem("study_sessions");
    const list = raw ? JSON.parse(raw) : [];
    const todayKey = new Date().toDateString();
    const filtered = list.filter(
      (s: any) => new Date(s.date).toDateString() !== todayKey,
    );
    await AsyncStorage.setItem("study_sessions", JSON.stringify(filtered));
    loadSessions();
  };

  const loadSessions = async () => {
    const raw = await AsyncStorage.getItem("study_sessions");
    const list = raw ? JSON.parse(raw) : [];
    setSessions(list);

    const todayKey = new Date().toDateString();
    const todaySum = list
      .filter((s: any) => new Date(s.date).toDateString() === todayKey)
      .reduce((sum: number, s: any) => sum + s.seconds, 0);
    setTodaySeconds(todaySum);

    const days = Array.from(
      new Set(list.map((s: any) => new Date(s.date).toDateString())),
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let count = 0;
    let d = new Date();
    for (let day of days) {
      if (new Date(day).toDateString() === d.toDateString()) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    setStreak(count);
  };

  useEffect(() => {
    loadSessions();
  }, [added]);

  const percent = Math.min(todaySeconds / DAILY_GOAL, 1);
  const remain = Math.max(DAILY_GOAL - todaySeconds, 0);
  const goalDone = todaySeconds >= DAILY_GOAL;

  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const greet = () => {
    const h = today.getHours();
    if (h < 12) return "좋은 아침이에요";
    if (h < 18) return "집중하는 오후네요";
    return "오늘도 수고했어요";
  };

  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringColor = percent >= 1 ? "#22c55e" : "#818cf8";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greet}>{greet()}</Text>
          <Text style={styles.appName}>StudyNet</Text>
        </View>
        <TouchableOpacity
          style={styles.settingBtn}
          onPress={() => router.push("/setting")}
        >
          <Ionicons name="settings-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── DATE CHIP ── */}
        <View style={styles.dateChip}>
          <Ionicons
            name="calendar-outline"
            size={13}
            color="#64748b"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.dateChipText}>{dateStr}</Text>
        </View>

        {/* ── FOCUS CARD ── */}
        <View style={styles.focusCard}>
          <View style={styles.focusTop}>
            <View style={styles.focusLeft}>
              <Text style={styles.focusLabel}>총 학습 시간</Text>
              <Text style={styles.focusTime}>{format(todaySeconds)}</Text>
              {goalDone && (
                <View style={styles.doneBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color="#4ade80"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.doneBadgeText}>목표 달성!</Text>
                </View>
              )}
            </View>

            {/* 원형 진행 표시 - SVG */}
            <View style={styles.ringWrap}>
              <Svg width={80} height={80} viewBox="0 0 80 80">
                {/* 배경 원 */}
                <Circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  stroke="#0f172a"
                  strokeWidth="7"
                  fill="none"
                />
                {/* 진행 원 */}
                <Circle
                  cx="40"
                  cy="40"
                  r={ringRadius}
                  stroke={ringColor}
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - percent)}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="40, 40"
                />
              </Svg>
              <View style={[styles.ringInner, { position: "absolute" }]}>
                <Text style={[styles.ringPercent, { color: ringColor }]}>
                  {Math.round(percent * 100)}%
                </Text>
                <Text style={styles.ringLabel}>달성</Text>
              </View>
            </View>
          </View>

          {/* 진행바 */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${percent * 100}%` }]}>
              <View style={styles.barShine} />
            </View>
          </View>
          <View style={styles.barLabels}>
            <Text style={styles.barLabelLeft}>0h</Text>
            <Text style={styles.barLabelRight}>
              목표까지 {formatMin(remain)}
            </Text>
          </View>

          {/* 스탯 3개 */}
          <View style={styles.statsRow}>
            <StatPill
              icon="flame"
              iconColor="#f97316"
              value={`${streak}일`}
              label="연속 학습"
            />
            <StatPill
              icon="time-outline"
              iconColor="#38bdf8"
              value={`${sessions.length}회`}
              label="총 세션"
            />
            <StatPill
              icon="trophy-outline"
              iconColor="#facc15"
              value={`${Math.round(percent * 100)}%`}
              label="목표 달성률"
            />
          </View>

          {/* 버튼 */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/subject-select")}
            >
              <Ionicons
                name="play"
                size={16}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryBtnText}>학습 시작</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={resetToday}>
              <Ionicons name="refresh" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── QUICK MENU ── */}
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.menuRow}>
          <QuickMenu icon="bar-chart-outline" label="통계" accent="#6366f1" />
          <QuickMenu icon="book-outline" label="과목 관리" accent="#0ea5e9" />
          <QuickMenu icon="trophy-outline" label="랭킹" accent="#f59e0b" />
          <QuickMenu icon="person-outline" label="내 정보" accent="#10b981" />
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <Text style={styles.sectionTitle}>최근 활동</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="book-outline"
              size={36}
              color="#334155"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>아직 활동 기록이 없어요</Text>
            <Text style={styles.emptyDesc}>
              학습을 시작하면 여기에 기록돼요
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.activityScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {sessions
              .slice()
              .reverse()
              .map((s, i) => (
                <View key={i} style={styles.activityCard}>
                  <View style={styles.activityLeft}>
                    <View style={styles.subjectDot}>
                      <Text style={styles.subjectDotText}>
                        {s.subject ? s.subject[0] : "?"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.activitySubject}>{s.subject}</Text>
                      <Text style={styles.activityAt}>
                        {new Date(s.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.durationPill}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color="#818cf8"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.durationPillText}>
                      +{Math.floor(s.seconds / 60)}분
                    </Text>
                  </View>
                </View>
              ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

/* ── StatPill ── */
function StatPill({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: any;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statPill}>
      <Ionicons icon={icon} size={16} color={iconColor} />
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

/* ── QuickMenu ── */
function QuickMenu({
  icon,
  label,
  accent,
}: {
  icon: any;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.quickMenu}>
      <View
        style={[
          styles.quickIconBox,
          { backgroundColor: accent + "20", borderColor: accent + "40" },
        ]}
      >
        <Ionicons name={icon} size={24} color={accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 12,
  },
  greet: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 2,
  },
  appName: {
    color: "#f1f5f9",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  settingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  dateChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dateChipText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },
  focusCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#2d3f55",
  },
  focusTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  focusLeft: {
    flex: 1,
  },
  focusLabel: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  focusTime: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  doneBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  doneBadgeText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "700",
  },
  ringWrap: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  ringInner: {
    alignItems: "center",
  },
  ringPercent: {
    fontSize: 16,
    fontWeight: "800",
  },
  ringLabel: {
    color: "#475569",
    fontSize: 10,
    marginTop: 1,
  },
  barTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#0f172a",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 99,
    position: "relative",
    overflow: "hidden",
  },
  barShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 99,
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  barLabelLeft: {
    color: "#475569",
    fontSize: 11,
  },
  barLabelRight: {
    color: "#475569",
    fontSize: 11,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  statPillValue: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  statPillLabel: {
    color: "#475569",
    fontSize: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#6366f1",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  ghostBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  quickMenu: {
    alignItems: "center",
    gap: 8,
  },
  quickIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  quickLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },
  activityScroll: {
    maxHeight: 204,
    marginBottom: 10,
  },
  activityCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#162032",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e3048",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#312e81",
    justifyContent: "center",
    alignItems: "center",
  },
  subjectDotText: {
    color: "#818cf8",
    fontWeight: "800",
    fontSize: 16,
  },
  activitySubject: {
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 3,
  },
  activityAt: {
    color: "#475569",
    fontSize: 12,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1b4b",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#3730a3",
  },
  durationPillText: {
    color: "#818cf8",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2d3f55",
  },
  emptyTitle: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyDesc: {
    color: "#475569",
    fontSize: 13,
  },
});
