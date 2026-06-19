import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMonoTheme, type MonoTheme } from "../../constants/mono";

export default function ChangePassword() {
  const router = useRouter();
  const { theme: C } = useMonoTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const [storedPw, setStoredPw] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadPassword = async () => {
      const saved = await AsyncStorage.getItem("user_password");
      if (saved) setStoredPw(saved);
    };

    loadPassword();
  }, []);

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
        "8자 이상, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다.",
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>비밀번호 변경</Text>
      </View>

      <View style={styles.card}>
        <PasswordField
          label="현재 비밀번호"
          value={currentPw}
          onChange={setCurrentPw}
          show={showCurrent}
          onToggle={() => setShowCurrent((value) => !value)}
          styles={styles}
          placeholder="현재 비밀번호 입력"
          placeholderColor={C.text}
        />

        <PasswordField
          label="새 비밀번호"
          value={newPw}
          onChange={setNewPw}
          show={showNew}
          onToggle={() => setShowNew((value) => !value)}
          styles={styles}
          placeholder="새 비밀번호 입력"
          placeholderColor={C.text}
        />

        <View style={styles.validationBox}>
          <Text style={[styles.rule, validation.minLength && styles.valid]}>
            8자 이상
          </Text>
          <Text style={[styles.rule, validation.hasNumber && styles.valid]}>
            숫자 1개 이상
          </Text>
          <Text style={[styles.rule, validation.hasSpecial && styles.valid]}>
            특수문자 1개 이상 (!@#$%^&*)
          </Text>
        </View>

        <PasswordField
          label="새 비밀번호 확인"
          value={confirmPw}
          onChange={setConfirmPw}
          show={showConfirm}
          onToggle={() => setShowConfirm((value) => !value)}
          styles={styles}
          placeholder="한 번 더 입력"
          placeholderColor={C.text}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleChange}>
          <Text style={styles.primaryText}>변경하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  styles,
  placeholder,
  placeholderColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof createStyles>;
  placeholder: string;
  placeholderColor: string;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeButton} onPress={onToggle}>
          <Text style={styles.eye}>{show ? "숨김" : "보기"}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const createStyles = (C: MonoTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
      paddingHorizontal: 20,
    },
    header: {
      marginTop: 10,
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: C.text,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderBottomWidth: 3,
      borderColor: C.border,
    },
    label: {
      color: C.text,
      marginTop: 16,
      marginBottom: 6,
      fontSize: 13,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: C.border,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      color: C.text,
    },
    eyeButton: {
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    eye: {
      color: C.text,
      fontWeight: "600",
    },
    validationBox: {
      marginTop: 10,
    },
    rule: {
      color: C.text,
      fontSize: 12,
      marginTop: 4,
    },
    valid: {
      color: C.text,
      fontWeight: "800",
    },
    primaryBtn: {
      marginTop: 28,
      backgroundColor: C.surface,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    primaryText: {
      color: C.text,
      fontWeight: "700",
    },
  });
