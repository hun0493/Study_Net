import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const GOAL_SECONDS = 60 * 60 * 3;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RING_SIZE = SCREEN_WIDTH - 48;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;
const R = RING_SIZE / 2 - 10;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function StudyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const subject =
    typeof params.subject === "string"
      ? params.subject
      : Array.isArray(params.subject)
        ? params.subject[0]
        : "자율 학습";

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const savedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return { h: pad(h), m: pad(m), s: pad(sec) };
  };

  const percent = Math.min(seconds / GOAL_SECONDS, 1);
  const remain = Math.max(GOAL_SECONDS - seconds, 0);
  const { h, m, s } = format(seconds);
  const remainFmt = format(remain);
  const goalDone = seconds >= GOAL_SECONDS;

  const strokeColor = goalDone ? "#22c55e" : "#6366f1";
  const strokeDashoffset = CIRCUMFERENCE * (1 - percent);

  const saveSession = async () => {
    if (savedRef.current) return;
    if (seconds < 5) return;
    try {
      const raw = await AsyncStorage.getItem("study_sessions");
      const list = raw ? JSON.parse(raw) : [];
      list.push({ seconds, subject, date: new Date().toISOString() });
      await AsyncStorage.setItem("study_sessions", JSON.stringify(list));
      savedRef.current = true;
    } catch {
      Alert.alert("저장 실패", "세션 저장 중 문제가 발생했습니다.");
    }
  };

  const finishStudy = () => {
    Alert.alert("세션 종료", "현재 학습을 종료할까요?", [
      { text: "계속", style: "cancel" },
      {
        text: "종료",
        style: "destructive",
        onPress: async () => {
          if (timerRef.current) clearInterval(timerRef.current);
          await saveSession();
          router.replace({ pathname: "/main", params: { added: Date.now() } });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={finishStudy}>
          <Ionicons name="chevron-down" size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>FOCUS SESSION</Text>
        <View
          style={[
            styles.liveIndicator,
            { backgroundColor: running ? "#22c55e22" : "#94a3b822" },
          ]}
        >
          <View
            style={[
              styles.liveDot,
              { backgroundColor: running ? "#22c55e" : "#64748b" },
            ]}
          />
          <Text
            style={[
              styles.liveText,
              { color: running ? "#22c55e" : "#64748b" },
            ]}
          >
            {running ? "진행중" : "일시정지"}
          </Text>
        </View>
      </View>

      {/* ── 과목 칩 ── */}
      <View style={styles.subjectRow}>
        <View style={styles.subjectChip}>
          <Ionicons
            name="book-outline"
            size={13}
            color="#818cf8"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.subjectText}>{subject}</Text>
        </View>
      </View>

      {/* ── 타이머 ── */}
      <View style={styles.timerWrap}>
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={StyleSheet.absoluteFill}
        >
          {/* 배경 원 */}
          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke="#1e293b"
            strokeWidth={10}
            fill="none"
          />
          {/* 진행 원호 - 12시 방향부터 시계방향으로 채워짐 */}
          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={strokeColor}
            strokeWidth={10}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CX}, ${CY}`}
          />
        </Svg>

        <View style={styles.timerCenter}>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeDigit}>{h}</Text>
              <Text style={styles.timeUnit}>시간</Text>
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeDigit}>{m}</Text>
              <Text style={styles.timeUnit}>분</Text>
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeDigit}>{s}</Text>
              <Text style={styles.timeUnit}>초</Text>
            </View>
          </View>

          {goalDone ? (
            <View style={styles.goalBadge}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color="#4ade80"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.goalBadgeText}>목표 달성!</Text>
            </View>
          ) : (
            <Text style={styles.remainText}>
              목표까지 {remainFmt.h}:{remainFmt.m}:{remainFmt.s}
            </Text>
          )}
        </View>
      </View>

      {/* ── 진행바 ── */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent * 100}%`,
                backgroundColor: goalDone ? "#22c55e" : "#6366f1",
              },
            ]}
          >
            <View style={styles.progressShine} />
          </View>
        </View>
        <Text style={styles.progressPercent}>{Math.round(percent * 100)}%</Text>
      </View>

      {/* ── 스탯 카드 ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons
            name="timer-outline"
            size={18}
            color="#818cf8"
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.statValue}>
            {h}:{m}:{s}
          </Text>
          <Text style={styles.statLabel}>경과 시간</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons
            name="flag-outline"
            size={18}
            color="#34d399"
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.statValue}>3시간</Text>
          <Text style={styles.statLabel}>오늘 목표</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons
            name="trending-up-outline"
            size={18}
            color="#f97316"
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.statValue}>{Math.round(percent * 100)}%</Text>
          <Text style={styles.statLabel}>달성률</Text>
        </View>
      </View>

      {/* ── 버튼 ── */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.pauseBtn, !running && styles.resumeBtn]}
          onPress={() => setRunning((r) => !r)}
        >
          <Ionicons
            name={running ? "pause" : "play"}
            size={22}
            color={running ? "#94a3b8" : "#6366f1"}
          />
          <Text style={[styles.pauseBtnText, !running && styles.resumeBtnText]}>
            {running ? "일시정지" : "재개"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.finishBtn} onPress={finishStudy}>
          <Ionicons
            name="stop"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.finishBtnText}>종료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },

  /* TOP BAR */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* 과목 */
  subjectRow: {
    alignItems: "center",
    marginBottom: 28,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1b4b",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#3730a3",
  },
  subjectText: {
    color: "#818cf8",
    fontWeight: "700",
    fontSize: 14,
  },

  /* 타이머 링 */
  timerWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  timerCenter: {
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 12,
  },
  timeBlock: {
    alignItems: "center",
    minWidth: 52,
  },
  timeDigit: {
    color: "#f1f5f9",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 54,
  },
  timeUnit: {
    color: "#475569",
    fontSize: 11,
    marginTop: 2,
  },
  timeSep: {
    color: "#334155",
    fontSize: 36,
    fontWeight: "300",
    marginBottom: 12,
  },
  remainText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "500",
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  goalBadgeText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
  },

  /* 진행바 */
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#1e293b",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 99,
  },
  progressPercent: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },

  /* 스탯 */
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3f55",
  },
  statValue: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    color: "#475569",
    fontSize: 10,
  },

  /* 버튼 */
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    paddingVertical: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#334155",
  },
  resumeBtn: {
    borderColor: "#4338ca",
    backgroundColor: "#1e1b4b",
  },
  pauseBtnText: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 15,
  },
  resumeBtnText: {
    color: "#818cf8",
  },
  finishBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 18,
    borderRadius: 26,
    shadowColor: "#6366f1",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  finishBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
