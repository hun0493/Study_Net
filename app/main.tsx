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
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const DAILY_GOAL = 60 * 60 * 3;

const C = {
  bg:           "#0A0E1A",
  surface:      "#111827",
  surfaceAlt:   "#1A2235",
  border:       "#1E2D42",

  accent:       "#2563EB",
  accentLight:  "#60A5FA",
  accentSoft:   "#1E3A5F",

  success:      "#10B981",
  successSoft:  "#0D2B22",

  textPrimary:  "#F8FAFC",
  textSecondary:"#94A3B8",
  textTertiary: "#4B5E77",
  textAccent:   "#60A5FA",
};

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
    const filtered = list.filter((s: any) => new Date(s.date).toDateString() !== todayKey);
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

  useEffect(() => { loadSessions(); }, [added]);

  const percent = Math.min(todaySeconds / DAILY_GOAL, 1);
  const remain = Math.max(DAILY_GOAL - todaySeconds, 0);
  const goalDone = todaySeconds >= DAILY_GOAL;

  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  const greet = () => {
    const h = today.getHours();
    if (h < 12) return "좋은 아침이에요";
    if (h < 18) return "집중하는 오후네요";
    return "오늘도 수고했어요";
  };

  const accentColor = goalDone ? C.success : C.accent;
  const accentLightColor = goalDone ? "#34D399" : C.accentLight;
  const ringR = 30;
  const ringCirc = 2 * Math.PI * ringR;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetText}>{greet()}</Text>
          <Text style={styles.appName}>StudyNet</Text>
        </View>
        <TouchableOpacity style={styles.settingBtn} onPress={() => router.push("/setting")}>
          <Ionicons name="settings-outline" size={17} color={C.textTertiary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* DATE */}
        <Text style={styles.dateText}>{dateStr}</Text>

        {/* FOCUS CARD */}
        <View style={styles.focusCard}>
          <View style={styles.focusCardHeader}>
            <Text style={styles.focusCardLabel}>오늘의 학습</Text>
            {goalDone && (
              <View style={styles.goalBadge}>
                <Ionicons name="checkmark" size={10} color={C.success} style={{ marginRight: 3 }} />
                <Text style={styles.goalBadgeText}>목표 달성</Text>
              </View>
            )}
          </View>

          <View style={styles.focusMain}>
            <View style={styles.focusLeft}>
              <Text style={styles.focusTime}>{format(todaySeconds)}</Text>
              <Text style={styles.focusRemain}>
                {goalDone ? "오늘 목표를 완료했어요" : `목표까지 ${formatMin(remain)}`}
              </Text>
            </View>
            <View style={styles.ringWrap}>
              <Svg width={76} height={76} viewBox="0 0 76 76">
                <Defs>
                  <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={accentColor} />
                    <Stop offset="100%" stopColor={accentLightColor} />
                  </LinearGradient>
                </Defs>
                <Circle cx="38" cy="38" r={ringR} stroke={C.border} strokeWidth={3} fill="none" />
                <Circle cx="38" cy="38" r={ringR} stroke="url(#rg)" strokeWidth={3} fill="none"
                  strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - percent)}
                  strokeLinecap="round" rotation="-90" origin="38, 38"
                />
              </Svg>
              <View style={styles.ringInner}>
                <Text style={[styles.ringPercent, { color: accentLightColor }]}>{Math.round(percent * 100)}%</Text>
                <Text style={styles.ringLabel}>달성</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent * 100}%`, backgroundColor: accentColor }]} />
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
              <Text style={[styles.statValue, { color: accentLightColor }]}>{Math.round(percent * 100)}%</Text>
              <Text style={styles.statLabel}>달성률</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.startBtn} onPress={() => router.push("/subject-select")} activeOpacity={0.8}>
              <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 7 }} />
              <Text style={styles.startBtnText}>학습 시작</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={resetToday} activeOpacity={0.7}>
              <Ionicons name="refresh" size={16} color={C.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK MENU */}
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.menuGrid}>
          <QuickMenu icon="bar-chart-outline" label="통계" />
          <QuickMenu icon="book-outline" label="과목 관리" />
          <QuickMenu icon="trophy-outline" label="랭킹" />
          <QuickMenu icon="person-outline" label="내 정보" />
        </View>

        {/* RECENT ACTIVITY */}
        <Text style={styles.sectionTitle}>최근 활동</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={20} color={C.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>아직 활동 기록이 없어요</Text>
            <Text style={styles.emptyDesc}>학습을 시작하면 여기에 기록돼요</Text>
          </View>
        ) : (
          <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            {sessions.slice().reverse().map((s, i) => (
              <View key={i} style={[styles.activityItem, i > 0 && styles.activityItemBorder]}>
                <View style={styles.activityLeft}>
                  <View style={styles.activityAvatar}>
                    <Text style={styles.activityAvatarText}>{s.subject ? s.subject[0] : "?"}</Text>
                  </View>
                  <View>
                    <Text style={styles.activitySubject}>{s.subject}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(s.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
                <View style={styles.durationTag}>
                  <Text style={styles.durationTagText}>+{Math.floor(s.seconds / 60)}분</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function QuickMenu({ icon, label }: { icon: any; label: string }) {
  return (
    <TouchableOpacity style={styles.quickItem} activeOpacity={0.7}>
      <View style={styles.quickIconBox}>
        <Ionicons name={icon} size={20} color={C.textSecondary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingTop: 58, paddingBottom: 16 },
  greetText: { color: C.textTertiary, fontSize: 12, marginBottom: 3, letterSpacing: 0.3 },
  appName: { color: C.textPrimary, fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
  settingBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  dateText: { color: C.textTertiary, fontSize: 12, letterSpacing: 0.3, marginBottom: 16 },

  focusCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 28 },
  focusCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  focusCardLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  goalBadge: { flexDirection: "row", alignItems: "center", backgroundColor: C.successSoft, borderWidth: 1, borderColor: C.success + "44", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  goalBadgeText: { color: C.success, fontSize: 10, fontWeight: "600" },
  focusMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  focusLeft: { flex: 1 },
  focusTime: { color: C.textPrimary, fontSize: 18, fontWeight: "600", letterSpacing: -0.5, marginBottom: 4 },
  focusRemain: { color: C.textTertiary, fontSize: 12, letterSpacing: 0.2 },
  ringWrap: { width: 76, height: 76, justifyContent: "center", alignItems: "center", marginLeft: 12 },
  ringInner: { position: "absolute", alignItems: "center" },
  ringPercent: { fontSize: 14, fontWeight: "700" },
  ringLabel: { color: C.textTertiary, fontSize: 9, marginTop: 1 },
  progressTrack: { height: 2, backgroundColor: C.border, borderRadius: 1, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", borderRadius: 1 },
  statsRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: "hidden", marginBottom: 14 },
  statItem: { flex: 1, paddingVertical: 10, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },
  statValue: { color: C.textPrimary, fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
  statLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" },
  btnRow: { flexDirection: "row", gap: 8 },
  startBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.accent, paddingVertical: 14, borderRadius: 10 },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
  resetBtn: { width: 46, height: 46, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceAlt },

  sectionTitle: { color: C.textTertiary, fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  menuGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  quickItem: { alignItems: "center", gap: 7 },
  quickIconBox: { width: 54, height: 54, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  quickLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },

  activityList: { maxHeight: 220, borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: "hidden", backgroundColor: C.surface },
  activityItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  activityItemBorder: { borderTopWidth: 1, borderTopColor: C.border },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  activityAvatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent + "40", justifyContent: "center", alignItems: "center" },
  activityAvatarText: { color: C.accentLight, fontWeight: "700", fontSize: 14 },
  activitySubject: { color: C.textPrimary, fontWeight: "600", fontSize: 13, marginBottom: 2 },
  activityTime: { color: C.textTertiary, fontSize: 11 },
  durationTag: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent + "40", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  durationTagText: { color: C.accentLight, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },

  emptyState: { alignItems: "center", paddingVertical: 40, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, gap: 8 },
  emptyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { color: C.textSecondary, fontSize: 14, fontWeight: "600" },
  emptyDesc: { color: C.textTertiary, fontSize: 12 },
});