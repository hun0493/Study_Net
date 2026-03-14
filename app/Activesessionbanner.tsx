/**
 * ActiveSessionBanner
 * main.tsx 하단에 배치하세요.
 *
 * 사용법:
 *   import ActiveSessionBanner from "@/components/ActiveSessionBanner";
 *   // main.tsx return 안에 최하단 추가:
 *   <ActiveSessionBanner />
 */

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  bg: "#0A0E1A", surface: "#111827", surfaceAlt: "#1A2235",
  border: "#1E2D42", accent: "#2563EB",
  success: "#10B981",
  textPrimary: "#F8FAFC", textSecondary: "#94A3B8",
  textTertiary: "#4B5E77", textAccent: "#60A5FA",
};

const KEY_ACTIVE = "active_session";

export default function ActiveSessionBanner() {
  const router = useRouter();
  const [session, setSession] = useState<{
    subject: string;
    startEpoch: number;
    goalSeconds: number;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(80)).current; // 아래에서 올라오는 애니메이션

  // 배너 표시 / 숨김 애니메이션
  const showBanner = (show: boolean) => {
    Animated.spring(slideAnim, {
      toValue: show ? 0 : 80,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  // 주기적으로 active_session 확인 (1초마다)
  useEffect(() => {
    const check = async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY_ACTIVE);
        if (raw) {
          const data = JSON.parse(raw);
          setSession(data);
          const e = Math.floor((Date.now() - data.startEpoch) / 1000);
          setElapsed(e);
          showBanner(true);
        } else {
          setSession(null);
          showBanner(false);
        }
      } catch {}
    };

    check(); // 마운트 시 즉시
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
      // 5초마다 AsyncStorage 재확인 (세션이 종료됐는지)
      if (Date.now() % 5000 < 1100) check();
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const format = (total: number) => {
    const h = Math.floor(total / 3600);
    const min = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    return `${pad(h)}:${pad(min)}:${pad(sec)}`;
  };

  const percent = session
    ? Math.min(Math.round((elapsed / session.goalSeconds) * 100), 100)
    : 0;

  if (!session) return null;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      {/* 진행 바 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <View style={styles.bannerInner}>
        {/* 왼쪽: 과목 + 타이머 */}
        <View style={styles.bannerLeft}>
          <View style={styles.liveDot} />
          <View>
            <Text style={styles.bannerSubject}>{session.subject}</Text>
            <Text style={styles.bannerTime}>{format(elapsed)}</Text>
          </View>
        </View>

        {/* 오른쪽: 달성% + 돌아가기 버튼 */}
        <View style={styles.bannerRight}>
          <Text style={styles.bannerPercent}>{percent}%</Text>
          <TouchableOpacity
            style={styles.resumeBtn}
            onPress={() =>
              router.push({
                pathname: "/study",
                params: { subject: session.subject },
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={11} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.resumeBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 90, // 탭바 위에 뜨도록 조정 (본인 탭바 높이에 맞게 수정)
    left: 16,
    right: 16,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    // 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTrack: {
    height: 2,
    backgroundColor: C.border,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.success,
    borderRadius: 1,
  },
  bannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.success,
  },
  bannerSubject: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bannerTime: {
    color: C.textTertiary,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
    marginTop: 1,
  },
  bannerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerPercent: {
    color: C.textAccent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  resumeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});