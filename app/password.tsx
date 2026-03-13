import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RESEND_SECONDS = 60;

export default function PasswordResetFriendly() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [timer, setTimer] = useState(0);

  /* 완료 화면 애니메이션 */
  const doneFade = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0.88)).current;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* 타이머 */
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSend = () => {
    if (!isEmailValid || loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setTimer(RESEND_SECONDS);
      Animated.parallel([
        Animated.timing(doneFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(doneScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      ]).start();
    }, 1800);
  };

  const handleResend = () => {
    if (timer > 0 || loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setTimer(RESEND_SECONDS);
    }, 1800);
  };

  /* ── 발송 완료 화면 ── */
  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.circleDecoration} />
        <View style={styles.circleDecoration2} />

        <Animated.View
          style={[styles.content, { opacity: doneFade, transform: [{ scale: doneScale }] }]}
        >
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name="email-check-outline"
              size={50}
              color="#818cf8"
            />
          </View>

          <Text style={styles.mainTitle}>메일을 보냈어요! 📬</Text>
          <Text style={styles.subText}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>{email}</Text>
            {"\n"}으로 임시 링크를 발송했어요.{"\n"}
            스팸 메일함도 꼭 확인해 주세요!
          </Text>

          {/* 재발송 영역 */}
          <View style={styles.resendBox}>
            {loading ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : timer > 0 ? (
              <Text style={styles.timerText}>
                <Text style={styles.timerNum}>{formatTimer(timer)}</Text> 후 재발송
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}>메일 재발송</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.sendBtn}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Text style={styles.sendBtnText}>로그인으로 돌아가기</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  /* ── 메인 화면 ── */
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.circleDecoration} />
      <View style={styles.circleDecoration2} />

      {/* 뒤로가기 버튼 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#94a3b8" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="email-check-outline"
            size={50}
            color="#818cf8"
          />
        </View>

        <Text style={styles.mainTitle}>이메일 인증</Text>
        <Text style={styles.subText}>
          입력하신 주소로{" "}
          <Text style={{ color: "#fff", fontWeight: "700" }}>임시 링크</Text>를
          보내드려요.{"\n"}
          스팸 메일함도 꼭 확인해 주세요!
        </Text>

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            name="at"
            size={20}
            color="#6366f1"
            style={styles.atIcon}
          />
          <TextInput
            style={styles.glassInput}
            placeholder="이메일 주소 입력"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />
          {email.length > 0 && (
            <MaterialCommunityIcons
              name={isEmailValid ? "check-circle" : "alert-circle-outline"}
              size={20}
              color={isEmailValid ? "#34d399" : "#f87171"}
              style={{ marginRight: 4 }}
            />
          )}
        </View>

        {/* 유효성 힌트 */}
        {email.length > 0 && (
          <Text style={[styles.hintText, isEmailValid ? styles.hintOk : styles.hintErr]}>
            {isEmailValid ? "올바른 이메일 형식이에요" : "이메일 형식을 확인해주세요"}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, (!isEmailValid || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!isEmailValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.sendBtnText, !isEmailValid && styles.sendBtnTextDisabled]}>
              인증 메일 발송하기
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>아니요, 기억났어요!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
  },
  circleDecoration: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
  circleDecoration2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(99, 102, 241, 0.04)",
  },

  /* 뒤로가기 */
  backBtn: {
    position: "absolute",
    top: 16,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },

  content: { width: "85%", alignItems: "center" },
  iconBox: {
    width: 100,
    height: 100,
    backgroundColor: "#1e293b",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  subText: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  atIcon: { marginRight: 10 },
  glassInput: { flex: 1, paddingVertical: 18, color: "#fff", fontSize: 16 },

  /* 힌트 */
  hintText: { fontSize: 12, fontWeight: "500", alignSelf: "flex-start", marginBottom: 16, marginLeft: 4 },
  hintOk: { color: "#34d399" },
  hintErr: { color: "#f87171" },

  sendBtn: {
    width: "100%",
    backgroundColor: "#6366f1",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  sendBtnDisabled: {
    backgroundColor: "#1e293b",
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sendBtnTextDisabled: { color: "#475569" },

  cancelBtn: { marginTop: 24 },
  cancelText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  /* 재발송 */
  resendBox: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  timerText: { color: "#64748b", fontSize: 13, fontWeight: "500" },
  timerNum: { color: "#818cf8", fontWeight: "800" },
  resendText: {
    color: "#818cf8",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});