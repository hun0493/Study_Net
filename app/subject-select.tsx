import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ===============================
   📚 기본 과목 매핑
================================ */
const SUBJECT_MAP: Record<string, string[]> = {
  초등학생: ["국어", "수학", "영어", "사회", "과학", "체육", "음악", "미술"],
  중학생: ["국어", "수학", "영어", "과학", "사회"],
  고등학생: ["국어", "수학", "영어", "물리", "화학", "생명과학"],
  대학생: ["전공", "교양", "과제", "시험 대비"],
  취준생: ["자격증", "면접 준비", "어학"],
  직장인: ["자기계발", "자격증", "업무"],
};

export default function SubjectSelect() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [userType, setUserType] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  /* ===============================
     🔄 과목 불러오기
  ================================ */
  const loadSubjects = async () => {
    const profileRaw = await AsyncStorage.getItem("userProfile");
    const profile = profileRaw ? JSON.parse(profileRaw) : null;

    const currentUserType = profile?.userType || "";
    if (!currentUserType) return;

    const storageKey = `custom_subjects_${currentUserType}`;
    const customRaw = await AsyncStorage.getItem(storageKey);
    const custom = customRaw ? JSON.parse(customRaw) : [];

    const baseSubjects = SUBJECT_MAP[currentUserType] || [];

    setUserType(currentUserType);
    setCustomSubjects(custom);
    setSubjects([...baseSubjects, ...custom]);
  };

  /* ===============================
     ➕ 과목 추가
  ================================ */
  const addCustomSubject = async () => {
    if (!newSubject.trim()) return;

    const storageKey = `custom_subjects_${userType}`;
    const updated = [...customSubjects, newSubject.trim()];

    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

    setCustomSubjects(updated);
    setSubjects((prev) => [...prev, newSubject.trim()]);
    setNewSubject("");
    setShowInput(false);
  };

  /* ===============================
     ❌ 과목 삭제
  ================================ */
  const deleteSubject = async (subject: string) => {
    Alert.alert("삭제", `${subject} 과목을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const updated = customSubjects.filter((s) => s !== subject);

          const storageKey = `custom_subjects_${userType}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

          setCustomSubjects(updated);

          const baseSubjects = SUBJECT_MAP[userType] || [];
          setSubjects([...baseSubjects, ...updated]);
        },
      },
    ]);
  };

  /* ===============================
     🎯 과목 선택
  ================================ */
  const selectSubject = (subject: string) => {
    router.replace({
      pathname: "/study",
      params: { subject },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 🔥 헤더 */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>과목 선택</Text>
          {userType ? (
            <Text style={styles.subtitle}>{userType} 맞춤 과목</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={() => setShowInput(true)}>
          <Text style={styles.plus}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 입력 카드 */}
      {showInput && (
        <View style={styles.inputCard}>
          <TextInput
            placeholder="새 과목 입력"
            placeholderTextColor="#999"
            value={newSubject}
            onChangeText={setNewSubject}
            style={styles.input}
            autoFocus
          />

          <View style={styles.inputButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setNewSubject("");
                setShowInput(false);
              }}
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addCustomSubject}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🔥 과목 리스트 */}
      <FlatList
        data={subjects}
        keyExtractor={(item, index) => item + index}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isCustom = customSubjects.includes(item);

          return (
            <TouchableOpacity
              style={styles.subjectCard}
              onPress={() => selectSubject(item)}
              onLongPress={() => isCustom && deleteSubject(item)}
            >
              <Text style={styles.subjectText}>{item}</Text>

              {isCustom && (
                <Text style={styles.deleteHint}>길게 눌러 삭제</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

/* ===============================
   🎨 스타일
================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    color: "#aaa",
    marginTop: 6,
  },

  plus: {
    color: "#4c8bf5",
    fontSize: 32,
    fontWeight: "bold",
  },

  inputCard: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#111",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },

  inputButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 12,
  },

  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  cancelText: {
    color: "#aaa",
  },

  addButton: {
    backgroundColor: "#4c8bf5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  subjectCard: {
    backgroundColor: "#1e1e1e",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 14,
  },

  subjectText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },

  deleteHint: {
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },
});
