import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
export default function LoginScreen() {
  const router = useRouter();
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);        // ① 로딩 상태
  const [errorMsg, setErrorMsg] = useState("");         // 에러 메시지

  // ② 키보드 다음 필드 이동용 ref
  const pwRef = useRef<TextInput>(null);

  // ③ 유효성 검사 — 이메일 형식 + 비밀번호 6자 이상
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  // ④ 로그인 핸들러 (API 연동 시 여기에 작성)
  const handleLogin = async () => {
    if (!isValid || loading) return;
    setErrorMsg("");
    try {
      setLoading(true);
      // TODO: await authApi.login({ email, password });
      await new Promise((res) => setTimeout(res, 1200)); // 임시 딜레이
      router.replace("/main");
    } catch (e) {
      setErrorMsg("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  /* 입장 애니메이션 */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />

      {/* 배경 그라디언트 장식 */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.kav}
      >
        <Animated.View
          style={[
            s.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── 헤더 ── */}
          <View style={s.header}>
            <View style={s.badgeRow}>
              <View style={s.badge}>
                <Text style={s.badgeText}>STUDY PLATFORM</Text>
              </View>
            </View>
            <Text style={s.logo}>StudyNet</Text>
            <Text style={s.sub}>함께 성장하는 학습 커뮤니티</Text>
          </View>

          {/* ── 폼 카드 ── */}
          <View style={s.card}>
            {/* 이메일 */}
            <View style={[s.field, emailFocused && s.fieldFocused]}>
              <View style={[s.fieldIcon, emailFocused && s.fieldIconActive]}>
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={emailFocused ? "#818cf8" : "#64748b"}
                />
              </View>
              <TextInput
                style={s.fieldInput}
                placeholder="이메일 주소"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"                          // ② 키보드 next 버튼
                onSubmitEditing={() => pwRef.current?.focus()} // ② 다음 필드로 이동
                value={email}
                onChangeText={(t) => { setEmail(t); setErrorMsg(""); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* 비밀번호 */}
            <View style={[s.field, pwFocused && s.fieldFocused]}>
              <View style={[s.fieldIcon, pwFocused && s.fieldIconActive]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={pwFocused ? "#818cf8" : "#64748b"}
                />
              </View>
              <TextInput
                ref={pwRef}                                   // ② ref 연결
                style={s.fieldInput}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor="#475569"
                secureTextEntry={!showPw}
                returnKeyType="done"                          // ② 키보드 done 버튼
                onSubmitEditing={handleLogin}                 // ② done 누르면 로그인
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(""); }}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPw(!showPw)}
              >
                <Ionicons
                  name={showPw ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>

            {/* 에러 메시지 */}
            {errorMsg ? (
              <View style={s.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
                <Text style={s.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* 비밀번호 찾기 */}
            <TouchableOpacity
              style={s.forgotRow}
              onPress={() => router.push("/password")}
            >
              <Text style={s.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>

            {/* 로그인 버튼 — isValid 따라 스타일/동작 분기 */}
            <TouchableOpacity
              activeOpacity={isValid ? 0.85 : 1}
              style={[s.loginBtn, !isValid && s.loginBtnDisabled]}  // ③ 비활성 스타일
              onPress={handleLogin}
              disabled={!isValid || loading}                         // ① 중복 클릭 방지
            >
              {loading ? (                                           // ① 로딩 스피너
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={[s.loginBtnText, !isValid && s.loginBtnTextDisabled]}>
                    로그인
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={isValid ? "#fff" : "#64748b"}
                  />
                </>
              )}
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>간편 로그인</Text>
              <View style={s.divLine} />
            </View>

            {/* 소셜 아이콘 버튼 3개 */}
            <View style={s.socialRow}>
              <SocialIconBtn
                name="logo-google"
                bg="#fff"
                iconColor="#EA4335"
                onPress={() => {}}
              />
              <SocialIconBtn
                name="chatbubble"
                bg="#FEE500"
                iconColor="#3C1E1E"
                onPress={() => {}}
              />
              <SocialIconBtn
                name="logo-apple"
                bg="#1c1c1e"
                iconColor="#fff"
                onPress={() => {}}
              />
            </View>
          </View>

          {/* ── 회원가입 ── */}
          <View style={s.signupRow}>
            <Text style={s.signupText}>아직 계정이 없으신가요?</Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={s.signupLink}>  회원가입</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   소셜 아이콘 버튼
───────────────────────────────────────────── */
const SocialIconBtn = ({
  name,
  bg,
  iconColor,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    style={[sis.btn, { backgroundColor: bg }]}
    onPress={onPress}
  >
    <Ionicons name={name} size={22} color={iconColor} />
  </TouchableOpacity>
);

const sis = StyleSheet.create({
  btn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

/* ─────────────────────────────────────────────
   스타일
───────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#060d1a",
  },
  kav: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  /* 배경 장식 원 */
  bgCircle1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#312e81",
    opacity: 0.25,
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1e3a5f",
    opacity: 0.3,
    bottom: 40,
    left: -60,
  },

  /* 헤더 */
  header: { marginBottom: 32 },
  badgeRow: { flexDirection: "row", marginBottom: 14 },
  badge: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
  },
  badgeText: {
    color: "#818cf8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: "#f1f5f9",
    letterSpacing: -1,
  },
  sub: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },

  /* 카드 */
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },

  /* 입력 필드 */
  field: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  fieldFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#0f172a",
  },
  fieldIcon: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#334155",
    height: 52,
  },
  fieldIconActive: {
    borderRightColor: "#6366f1",
    backgroundColor: "rgba(99,102,241,0.07)",
  },
  fieldInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 14,
    color: "#f1f5f9",
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  /* 에러 메시지 */
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
    marginTop: -6,
  },
  errorText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "500",
  },

  /* 비밀번호 찾기 */
  forgotRow: { alignItems: "flex-end", marginBottom: 20, marginTop: 2 },
  forgotText: { color: "#6366f1", fontSize: 13, fontWeight: "600" },

  /* 로그인 버튼 */
  loginBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366f1",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  },
  loginBtnDisabled: {
    backgroundColor: "#1e293b",
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#334155",
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loginBtnTextDisabled: {
    color: "#475569",
  },

  /* 구분선 */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  divLine: { flex: 1, height: 1, backgroundColor: "#1e293b" },
  divText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },

  /* 소셜 아이콘 행 */
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },

  /* 회원가입 */
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  signupText: { color: "#475569", fontSize: 14 },
  signupLink: {
    color: "#818cf8",
    fontSize: 14,
    fontWeight: "700",
  },
});