import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");

/* ─────────────────────────────────────────────
   스텝 데이터
───────────────────────────────────────────── */
const STEPS = [
  {
    tag: "STEP 01 / 03",
    title: "로그인에 사용할",
    highlight: "이메일 주소",
    suffix: "를 알려주세요",
    placeholder: "example@studynet.com",
    icon: "mail-outline" as const,
    keyboard: "email-address" as const,
  },
  {
    tag: "STEP 02 / 03",
    title: "계정 보안을 위한",
    highlight: "비밀번호",
    suffix: "를 설정해주세요",
    placeholder: "8자 이상 입력",
    icon: "lock-closed-outline" as const,
    keyboard: "default" as const,
  },
  {
    tag: "STEP 03 / 03",
    title: "스터디넷에서 쓸",
    highlight: "닉네임",
    suffix: "을 정해주세요",
    placeholder: "2자 이상 12자 이하",
    icon: "person-outline" as const,
    keyboard: "default" as const,
  },
];

const PW_CHECKS = (pw: string) => [
  { label: "8자 이상", pass: pw.length >= 8 },
  { label: "영문 포함", pass: /[a-zA-Z]/.test(pw) },
  { label: "숫자 포함", pass: /[0-9]/.test(pw) },
  { label: "특수문자", pass: /[!@#$%^&*]/.test(pw) },
];

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
export default function SignupScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(false);
  const [done, setDone] = useState(false);

  /* 콘텐츠 전환 애니메이션 */
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  /* 완료 화면 페이드인 */
  const doneFade = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0.88)).current;

  const currentValue = step === 1 ? email : step === 2 ? pw : nick;
  const currentSet = step === 1 ? setEmail : step === 2 ? setPw : setNick;
  const pwChecks = PW_CHECKS(pw);

  const isNextDisabled = () => {
    if (step === 1) return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (step === 2) return pw.length < 8;
    if (step === 3) return nick.length < 2 || nick.length > 12;
    return true;
  };

  /* 스텝 전환 */
  const animateStep = (cb: () => void, dir: "forward" | "back" = "forward") => {
    const outY = dir === "forward" ? -28 : 28;
    const inY = dir === "forward" ? 28 : -28;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outY, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideAnim.setValue(inY);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < 3) {
      const nextStep = step + 1;
      animateStep(() => setStep(nextStep));
    } else {
      setDone(true);
      Animated.parallel([
        Animated.timing(doneFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(doneScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      ]).start();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      const prevStep = step - 1;
      animateStep(() => setStep(prevStep), "back");
    } else {
      router.back();
    }
  };

  /* ── 완료 화면 ── */
  if (done) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={s.bgCircle1} />
        <View style={s.bgCircle2} />

        <Animated.View
          style={[s.doneWrap, { opacity: doneFade, transform: [{ scale: doneScale }] }]}
        >
          {/* 아이콘 */}
          <View style={s.doneIconOuter}>
            <View style={s.doneIconInner}>
              <Ionicons name="checkmark" size={36} color="#6366f1" />
            </View>
          </View>

          {/* 텍스트 */}
          <Text style={s.doneTitle}>가입 완료! 🎉</Text>
          <Text style={s.doneDesc}>
            스터디넷에 오신 걸 환영해요{"\n"}
            <Text style={s.doneNick}>{nick}</Text>님과 함께{"\n"}
            열심히 공부해봐요 🙌
          </Text>

          {/* 정보 카드 */}
          <View style={s.doneCard}>
            <View style={s.doneCardRow}>
              <Ionicons name="mail-outline" size={15} color="#6366f1" />
              <Text style={s.doneCardLabel}>이메일</Text>
              <Text style={s.doneCardValue}>{email}</Text>
            </View>
            <View style={s.doneCardDivider} />
            <View style={s.doneCardRow}>
              <Ionicons name="person-outline" size={15} color="#6366f1" />
              <Text style={s.doneCardLabel}>닉네임</Text>
              <Text style={s.doneCardValue}>{nick}</Text>
            </View>
          </View>

          {/* 버튼 */}
          <TouchableOpacity
            style={s.doneBtn}
            activeOpacity={0.85}
            onPress={() => router.replace("/")}
          >
            <Text style={s.doneBtnText}>시작하기</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  /* ── 메인 ── */
  const step_ = STEPS[step - 1];

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 배경 장식 */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 내비게이션 */}
          <View style={s.navBar}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>{step} / 3</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <Animated.View
            style={[s.titleGroup, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={s.tagRow}>
              <View style={s.tagBadge}>
                <Text style={s.tagText}>{step_.tag}</Text>
              </View>
            </View>
            <Text style={s.title}>
              {step_.title}{"\n"}
              <Text style={s.titleHighlight}>{step_.highlight}</Text>
              <Text style={s.titleSuffix}>{step_.suffix}</Text>
            </Text>
          </Animated.View>

          {/* 입력 필드 */}
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            <View style={[s.field, focused && s.fieldFocused]}>
              {/* 좌측 아이콘 */}
              <View style={[s.fieldIcon, focused && s.fieldIconActive]}>
                <Ionicons
                  name={step_.icon}
                  size={17}
                  color={focused ? "#818cf8" : "#64748b"}
                />
              </View>

              <TextInput
                style={s.fieldInput}
                placeholder={step_.placeholder}
                placeholderTextColor="#475569"
                autoFocus
                secureTextEntry={step === 2 && !showPw}
                value={currentValue}
                onChangeText={currentSet}
                autoCapitalize="none"
                keyboardType={step_.keyboard}
                maxLength={step === 3 ? 12 : undefined}
                returnKeyType={step < 3 ? "next" : "done"}
                onSubmitEditing={!isNextDisabled() ? handleNext : undefined}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />

              {/* 비밀번호 눈 아이콘 */}
              {step === 2 && (
                <TouchableOpacity
                  onPress={() => setShowPw((v) => !v)}
                  style={s.eyeBtn}
                >
                  <Ionicons
                    name={showPw ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color="#475569"
                  />
                </TouchableOpacity>
              )}

              {/* 닉네임 카운터 */}
              {step === 3 && nick.length > 0 && (
                <Text style={s.counter}>{nick.length}/12</Text>
              )}
            </View>

            {/* 이메일 유효성 힌트 */}
            {step === 1 && email.length > 0 && (
              <View style={s.hintRow}>
                <Ionicons
                  name={
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                      ? "checkmark-circle"
                      : "alert-circle-outline"
                  }
                  size={14}
                  color={
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                      ? "#34d399"
                      : "#f87171"
                  }
                />
                <Text
                  style={[
                    s.hintText,
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                      ? s.hintOk
                      : s.hintErr,
                  ]}
                >
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                    ? "올바른 이메일 형식이에요"
                    : "이메일 형식을 확인해주세요"}
                </Text>
              </View>
            )}

            {/* 비밀번호 체크리스트 */}
            {step === 2 && pw.length > 0 && (
              <View style={s.checkGrid}>
                {pwChecks.map((c, i) => (
                  <View key={i} style={s.checkItem}>
                    <Ionicons
                      name={c.pass ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={c.pass ? "#818cf8" : "#334155"}
                    />
                    <Text style={[s.checkText, c.pass && s.checkActive]}>
                      {c.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* 하단 버튼 고정 */}
        <View style={s.bottom}>
          <TouchableOpacity
            style={[s.nextBtn, isNextDisabled() && s.nextBtnDisabled]}
            onPress={handleNext}
            disabled={isNextDisabled()}
            activeOpacity={0.85}
          >
            {isNextDisabled() ? (
              <Text style={s.nextBtnTextDisabled}>
                {step === 3 ? "가입하기" : "다음 단계"}
              </Text>
            ) : (
              <>
                <Text style={s.nextBtnText}>
                  {step === 3 ? "가입하기" : "다음 단계"}
                </Text>
                <Ionicons
                  name={step === 3 ? "checkmark" : "arrow-forward"}
                  size={18}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   스타일
───────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#060d1a",
  },

  /* 배경 장식 */
  bgCircle1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#312e81",
    opacity: 0.2,
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1e3a5f",
    opacity: 0.25,
    bottom: 60,
    left: -60,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  /* 내비 */
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 64,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadge: {
    backgroundColor: "rgba(99,102,241,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
  },
  stepBadgeText: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* 타이틀 */
  titleGroup: {
    marginTop: SCREEN_H * 0.04,
    marginBottom: SCREEN_H * 0.05,
  },
  tagRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  tagBadge: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
  },
  tagText: {
    color: "#818cf8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: SCREEN_H > 700 ? 26 : 22,
    color: "#64748b",
    lineHeight: SCREEN_H > 700 ? 40 : 34,
    fontWeight: "400",
  },
  titleHighlight: {
    fontWeight: "900",
    color: "#f1f5f9",
    letterSpacing: -0.5,
  },
  titleSuffix: {
    fontWeight: "400",
    color: "#64748b",
  },

  /* 입력 필드 */
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 12,
    overflow: "hidden",
  },
  fieldFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#0a1628",
  },
  fieldIcon: {
    width: 48,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#1e293b",
  },
  fieldIconActive: {
    borderRightColor: "#6366f1",
    backgroundColor: "rgba(99,102,241,0.07)",
  },
  fieldInput: {
    flex: 1,
    height: 54,
    paddingHorizontal: 14,
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "600",
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    paddingRight: 14,
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },

  /* 이메일 힌트 */
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 4,
    marginTop: 2,
  },
  hintText: { fontSize: 12, fontWeight: "500" },
  hintOk: { color: "#34d399" },
  hintErr: { color: "#f87171" },

  /* 비밀번호 체크 */
  checkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingLeft: 4,
    marginTop: 6,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  checkText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "500",
  },
  checkActive: { color: "#818cf8" },

  /* 하단 버튼 */
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 12 : 24,
    paddingTop: 12,
    backgroundColor: "#060d1a",
  },
  nextBtn: {
    backgroundColor: "#6366f1",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  nextBtnDisabled: {
    backgroundColor: "#0f172a",
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  nextBtnTextDisabled: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },

  /* 완료 화면 */
  doneWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  doneIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  doneIconInner: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  doneTitle: {
    color: "#f1f5f9",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  doneDesc: {
    color: "#64748b",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 32,
  },
  doneNick: {
    color: "#818cf8",
    fontWeight: "800",
  },

  /* 완료 정보 카드 */
  doneCard: {
    width: "100%",
    backgroundColor: "#0f172a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 20,
    marginBottom: 32,
  },
  doneCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  doneCardLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    width: 48,
  },
  doneCardValue: {
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  doneCardDivider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 14,
  },
  doneBtn: {
    backgroundColor: "#6366f1",
    width: "100%",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});