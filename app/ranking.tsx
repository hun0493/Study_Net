import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav, { getBottomNavSpace } from "../components/BottomNav";
import { useMonoTheme, type MonoTheme } from "../constants/mono";
import {
  formatStudyDuration,
  loadStudySessions,
  toDateKey,
  type StudySession,
} from "../utils/studySessions";

type RankItem = {
  name: string;
  seconds: number;
  meta: string;
};

export default function RankingScreen() {
  const router = useRouter();
  const { theme: C } = useMonoTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(C), [C]);
  const bottomSpace = getBottomNavSpace(insets.bottom);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    loadStudySessions().then(setSessions);
  }, []);

  const subjectRanking = useMemo<RankItem[]>(() => {
    const map: Record<string, number> = {};
    for (const item of sessions) {
      map[item.subject] = (map[item.subject] ?? 0) + item.seconds;
    }
    return Object.entries(map)
      .map(([name, seconds]) => ({ name, seconds, meta: "과목 누적" }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5);
  }, [sessions]);

  const dayRanking = useMemo<RankItem[]>(() => {
    const map: Record<string, number> = {};
    for (const item of sessions) {
      const key = toDateKey(new Date(item.date));
      map[key] = (map[key] ?? 0) + item.seconds;
    }
    return Object.entries(map)
      .map(([name, seconds]) => ({ name, seconds, meta: "일간 기록" }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5);
  }, [sessions]);

  const longestSession = useMemo(
    () => [...sessions].sort((a, b) => b.seconds - a.seconds)[0] ?? null,
    [sessions],
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <View style={s.header}>
        <TouchableOpacity style={s.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>랭킹</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomSpace + 24 }]}>
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>최고 단일 세션</Text>
          <Text style={s.heroValue}>
            {longestSession ? formatStudyDuration(longestSession.seconds) : "0시간 0분"}
          </Text>
          <Text style={s.heroMeta}>{longestSession?.subject ?? "기록 없음"}</Text>
        </View>

        <RankSection title="과목 랭킹" items={subjectRanking} styles={s} />
        <RankSection title="날짜 랭킹" items={dayRanking} styles={s} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

function RankSection({
  title,
  items,
  styles,
}: {
  title: string;
  items: RankItem[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>아직 랭킹 데이터가 없습니다.</Text>
      ) : (
        items.map((item, index) => (
          <View key={`${title}-${item.name}`} style={styles.rankRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{index + 1}</Text>
            </View>
            <View style={styles.rankBody}>
              <Text style={styles.rankName}>{item.name}</Text>
              <Text style={styles.rankMeta}>{item.meta}</Text>
            </View>
            <Text style={styles.rankTime}>{formatStudyDuration(item.seconds)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const createStyles = (C: MonoTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, paddingTop: 58, paddingHorizontal: 20 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
    iconButton: { width: 38, height: 38, borderWidth: 1, borderBottomWidth: 3, borderColor: C.border, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
    headerSpacer: { width: 38 },
    title: { color: C.text, fontSize: 24, fontWeight: "800" },
    content: {},
    heroCard: { borderWidth: 1, borderBottomWidth: 4, borderColor: C.border, borderRadius: 16, padding: 18, backgroundColor: C.surface, marginBottom: 22 },
    heroLabel: { color: C.text, fontSize: 12, fontWeight: "700" },
    heroValue: { color: C.text, fontSize: 28, fontWeight: "900", marginTop: 6 },
    heroMeta: { color: C.text, fontSize: 13, fontWeight: "700", marginTop: 6 },
    section: { marginBottom: 24 },
    sectionTitle: { color: C.text, fontSize: 15, fontWeight: "900", marginBottom: 10 },
    emptyText: { color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16 },
    rankRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderBottomWidth: 3, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: C.surface },
    rankBadge: { width: 34, height: 34, borderWidth: 1, borderBottomWidth: 2, borderColor: C.border, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
    rankBadgeText: { color: C.text, fontWeight: "900" },
    rankBody: { flex: 1 },
    rankName: { color: C.text, fontSize: 14, fontWeight: "800" },
    rankMeta: { color: C.text, fontSize: 11, marginTop: 2 },
    rankTime: { color: C.text, fontSize: 12, fontWeight: "800" },
  });
