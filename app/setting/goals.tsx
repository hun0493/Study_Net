import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { useMonoTheme, type MonoTheme } from "../../constants/mono";

const DAILY_GOAL_KEY = "daily_goal_seconds";
const WEEKLY_GOAL_KEY = "weekly_goal_seconds";
const STREAK_GOAL_KEY = "streak_goal_days";

const dailyOptions = [
  { label: "1시간", value: 60 * 60 },
  { label: "2시간", value: 60 * 60 * 2 },
  { label: "3시간", value: 60 * 60 * 3 },
  { label: "5시간", value: 60 * 60 * 5 },
];

const weeklyOptions = [
  { label: "5시간", value: 60 * 60 * 5 },
  { label: "10시간", value: 60 * 60 * 10 },
  { label: "20시간", value: 60 * 60 * 20 },
  { label: "30시간", value: 60 * 60 * 30 },
];

const streakOptions = [
  { label: "3일", value: 3 },
  { label: "7일", value: 7 },
  { label: "14일", value: 14 },
  { label: "30일", value: 30 },
];

export default function GoalSettingsScreen() {
  const router = useRouter();
  const { theme: C } = useMonoTheme();
  const s = useMemo(() => createStyles(C), [C]);
  const [dailyGoal, setDailyGoal] = useState(dailyOptions[2].value);
  const [weeklyGoal, setWeeklyGoal] = useState(weeklyOptions[1].value);
  const [streakGoal, setStreakGoal] = useState(streakOptions[1].value);

  useEffect(() => {
    const load = async () => {
      const [daily, weekly, streak] = await Promise.all([
        AsyncStorage.getItem(DAILY_GOAL_KEY),
        AsyncStorage.getItem(WEEKLY_GOAL_KEY),
        AsyncStorage.getItem(STREAK_GOAL_KEY),
      ]);

      if (daily) setDailyGoal(Number(daily));
      if (weekly) setWeeklyGoal(Number(weekly));
      if (streak) setStreakGoal(Number(streak));
    };

    load();
  }, []);

  const saveNumber = async (
    key: string,
    value: number,
    setter: (value: number) => void,
  ) => {
    setter(value);
    await AsyncStorage.setItem(key, String(value));
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <View style={s.header}>
        <TouchableOpacity style={s.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>학습 목표</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <GoalSection
          title="일일 공부 목표"
          desc="메인 화면과 공부 타이머의 기준 시간이 됩니다."
          options={dailyOptions}
          selected={dailyGoal}
          onSelect={(value) => saveNumber(DAILY_GOAL_KEY, value, setDailyGoal)}
          styles={s}
        />
        <GoalSection
          title="주간 공부 목표"
          desc="통계 화면 확장과 주간 리포트의 기준값으로 사용할 수 있습니다."
          options={weeklyOptions}
          selected={weeklyGoal}
          onSelect={(value) => saveNumber(WEEKLY_GOAL_KEY, value, setWeeklyGoal)}
          styles={s}
        />
        <GoalSection
          title="연속 학습 목표"
          desc="스트릭과 리마인더 기능을 붙일 때 기준이 됩니다."
          options={streakOptions}
          selected={streakGoal}
          onSelect={(value) => saveNumber(STREAK_GOAL_KEY, value, setStreakGoal)}
          styles={s}
        />
      </ScrollView>
    </View>
  );
}

function GoalSection({
  title,
  desc,
  options,
  selected,
  onSelect,
  styles,
}: {
  title: string;
  desc: string;
  options: { label: string; value: number }[];
  selected: number;
  onSelect: (value: number) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDesc}>{desc}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, active && styles.optionButtonActive]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
              {active && <Ionicons name="checkmark" size={16} color={styles.colors.color} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (C: MonoTheme) => {
  const styles = StyleSheet.create({
    colors: {
      color: C.text,
    },
    container: {
      flex: 1,
      backgroundColor: C.bg,
      paddingTop: 58,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 22,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderWidth: 1,
      borderBottomWidth: 3,
      borderColor: C.border,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 2,
      elevation: 2,
    },
    headerSpacer: {
      width: 38,
    },
    title: {
      color: C.text,
      fontSize: 24,
      fontWeight: "800",
    },
    content: {
      paddingBottom: 40,
    },
    section: {
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: C.border,
      borderRadius: 16,
      padding: 16,
      backgroundColor: C.surface,
      marginBottom: 14,
    },
    sectionTitle: {
      color: C.text,
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 6,
    },
    sectionDesc: {
      color: C.text,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 14,
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    optionButton: {
      minWidth: "47%",
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: C.border,
      borderRadius: 12,
      backgroundColor: C.surface,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 2,
      elevation: 2,
    },
    optionButtonActive: {
      borderWidth: 2,
      borderBottomWidth: 4,
    },
    optionText: {
      color: C.text,
      fontSize: 14,
      fontWeight: "700",
    },
  });

  return styles;
};
