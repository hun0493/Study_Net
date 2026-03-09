import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePassword() {
  const router = useRouter();

  const [storedPw, setStoredPw] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ---------------- 저장된 비밀번호 불러오기 ---------------- */

  useEffect(() => {
    const loadPassword = async () => {
      const saved = await AsyncStorage.getItem("user_password");
      if (saved) setStoredPw(saved);
    };
    loadPassword();
  }, []);

  /* ---------------- 비밀번호 조건 ---------------- */

  const validatePassword = (pw: string) => {
    const minLength = pw.length >= 8;
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*]/.test(pw);

    return {
      valid: minLength && hasNumber && hasSpecial,
      minLength,
      hasNumber,
      hasSpecial,
    };
  };

  const validation = validatePassword(newPw);

  /* ---------------- 변경 처리 ---------------- */

  const handleChange = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }

    if (storedPw && currentPw !== storedPw) {
      Alert.alert("오류", "현재 비밀번호가 올바르지 않습니다.");
      return;
    }

    if (!validation.valid) {
      Alert.alert(
        "비밀번호 조건",
        "8자 이상, 숫자 1개 이상, 특수문자 1개 이상 포함해야 합니다.",
      );
      return;
    }

    if (newPw !== confirmPw) {
      Alert.alert("불일치", "새 비밀번호가 일치하지 않습니다.");
      return;
    }

    await AsyncStorage.setItem("user_password", newPw);

    Alert.alert("완료", "비밀번호가 변경되었습니다.", [
      { text: "확인", onPress: () => router.back() },
    ]);
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>비밀번호 변경</Text>
      </View>

      <View style={styles.card}>
        {/* 현재 비밀번호 */}
        <Text style={styles.label}>현재 비밀번호</Text>
        <View style={styles.inputRow}>
          <TextInput
            key={showCurrent ? "visible1" : "hidden1"}
            style={styles.input}
            secureTextEntry={!showCurrent}
            value={currentPw}
            onChangeText={setCurrentPw}
            placeholder="현재 비밀번호 입력"
            placeholderTextColor="#64748b"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
            <Text style={styles.eye}>{showCurrent ? "숨김" : "보기"}</Text>
          </TouchableOpacity>
        </View>

        {/* 새 비밀번호 */}
        <Text style={styles.label}>새 비밀번호</Text>
        <View style={styles.inputRow}>
          <TextInput
            key={showNew ? "visible2" : "hidden2"}
            style={styles.input}
            secureTextEntry={!showNew}
            value={newPw}
            onChangeText={setNewPw}
            placeholder="새 비밀번호 입력"
            placeholderTextColor="#64748b"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Text style={styles.eye}>{showNew ? "숨김" : "보기"}</Text>
          </TouchableOpacity>
        </View>

        {/* 조건 표시 */}
        <View style={styles.validationBox}>
          <Text style={[styles.rule, validation.minLength && styles.valid]}>
            • 8자 이상
          </Text>
          <Text style={[styles.rule, validation.hasNumber && styles.valid]}>
            • 숫자 1개 이상
          </Text>
          <Text style={[styles.rule, validation.hasSpecial && styles.valid]}>
            • 특수문자 1개 이상 (!@#$%^&*)
          </Text>
        </View>

        {/* 확인 */}
        <Text style={styles.label}>새 비밀번호 확인</Text>
        <View style={styles.inputRow}>
          <TextInput
            key={showConfirm ? "visible3" : "hidden3"}
            style={styles.input}
            secureTextEntry={!showConfirm}
            value={confirmPw}
            onChangeText={setConfirmPw}
            placeholder="한 번 더 입력"
            placeholderTextColor="#64748b"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.eye}>{showConfirm ? "숨김" : "보기"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleChange}>
          <Text style={styles.primaryText}>변경하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- 스타일 ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
  },

  header: {
    marginTop: 10, // 🔥 메인이랑 동일
    marginBottom: 24,
  },

  title: {
    fontSize: 28, // 🔥 메인 타이틀 크기 맞춤
    fontWeight: "800",
    color: "#fff",
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },

  label: {
    color: "#cbd5f1",
    marginTop: 16,
    marginBottom: 6,
    fontSize: 13,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    color: "#fff",
  },

  eye: {
    color: "#6366f1",
    fontWeight: "600",
  },

  validationBox: {
    marginTop: 10,
  },

  rule: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },

  valid: {
    color: "#22c55e",
  },

  primaryBtn: {
    marginTop: 28,
    backgroundColor: "#6366f1",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});
