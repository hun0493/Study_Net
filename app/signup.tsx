import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const STEPS = [
  {
    tag: "STEP 01",
    title: "로그인에 사용할\n",
    bold: "이메일 주소",
    suffix: "를 알려주세요",
    placeholder: "email@example.com",
    hint: null,
  },
  {
    tag: "STEP 02",
    title: "보안을 위해\n",
    bold: "비밀번호",
    suffix: "를 설정할까요?",
    placeholder: "비밀번호를 입력해주세요",
    hint: null,
  },
  {
    tag: "STEP 03",
    title: "스터디넷에서 사용할\n",
    bold: "닉네임",
    suffix: "을 정해주세요",
    placeholder: "2자 이상 입력",
    hint: null,
  },
];

export default function SignupStep() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [nick, setNick] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(false);
  const [done, setDone] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentValue = step === 1 ? email : step === 2 ? pw : nick;
  const currentSet = step === 1 ? setEmail : step === 2 ? setPw : setNick;

  const pwChecks = [
    { label: "8자 이상", pass: pw.length >= 8 },
    { label: "영문 포함", pass: /[a-zA-Z]/.test(pw) },
    { label: "숫자 포함", pass: /[0-9]/.test(pw) },
    { label: "특수문자 포함", pass: /[!@#$%^&*]/.test(pw) },
  ];

  const isNextDisabled = () => {
    if (step === 1) return !email.includes("@") || email.length < 5;
    if (step === 2) return pw.length < 8;
    if (step === 3) return nick.length < 2;
    return true;
  };

  const animateTransition = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -24,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      cb();
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < 3) {
      animateTransition(() => setStep((s) => s + 1));
    } else {
      setDone(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      animateTransition(() => setStep((s) => s - 1));
    } else {
      router.back();
    }
  };

  /* ── 완료 화면 ── */
  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.doneScreen}>
          <View style={styles.doneIconWrap}>
            <Text style={styles.doneIconEmoji}>🎉</Text>
          </View>
          <Text style={styles.doneTitle}>가입 완료!</Text>
          <Text style={styles.doneDesc}>
            스터디넷에 오신 걸 환영해요,{"\n"}
            <Text style={styles.doneNick}>{nick}</Text>님 🙌
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.doneBtnText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ── 메인 ── */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* 진행 바 */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* 스크롤: 상단 콘텐츠만 */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 내비게이션 */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{step} / 3</Text>
            </View>
          </View>

          {/* 타이틀 (애니메이션) */}
          <Animated.View
            style={[
              styles.textGroup,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.stepTag}>{STEPS[step - 1].tag}</Text>
            <Text style={styles.mainTitle}>
              {STEPS[step - 1].title}
              <Text style={styles.boldText}>{STEPS[step - 1].bold}</Text>
              {STEPS[step - 1].suffix}
            </Text>
          </Animated.View>

          {/* 인풋 (애니메이션) */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
              style={[styles.inputWrap, focused && styles.inputWrapFocused]}
            >
              <TextInput
                style={styles.input}
                placeholder={STEPS[step - 1].placeholder}
                placeholderTextColor="#334155"
                autoFocus
                secureTextEntry={step === 2 && !showPw}
                value={currentValue}
                onChangeText={currentSet}
                autoCapitalize="none"
                keyboardType={step === 1 ? "email-address" : "default"}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {step === 2 && (
                <TouchableOpacity
                  onPress={() => setShowPw((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#475569"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* 비밀번호 체크리스트 */}
            {step === 2 && (
              <View style={styles.checkList}>
                {pwChecks.map((c, i) => (
                  <View key={i} style={styles.checkItem}>
                    <Ionicons
                      name={c.pass ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={c.pass ? "#6366f1" : "#334155"}
                    />
                    <Text
                      style={[styles.checkText, c.pass && styles.checkActive]}
                    >
                      {c.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 닉네임 카운터 */}
            {step === 3 && (
              <Text style={styles.counter}>{nick.length} / 12</Text>
            )}
          </Animated.View>
        </ScrollView>

        {/* 하단 버튼: KeyboardAvoidingView 안, ScrollView 밖에 고정 */}
        <View style={styles.bottomFixed}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isNextDisabled() && styles.actionBtnDisabled,
            ]}
            onPress={handleNext}
            disabled={isNextDisabled()}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>
              {step === 3 ? "가입하기" : "다음 단계"}
            </Text>
            {!isNextDisabled() && (
              <Ionicons
                name={step === 3 ? "checkmark" : "arrow-forward"}
                size={18}
                color="#fff"
                style={{ marginLeft: 6 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1220",
  },

  /* 진행 바 */
  progressTrack: {
    height: 3,
    backgroundColor: "#1e293b",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 99,
  },

  scrollContent: {
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
    backgroundColor: "#1e293b",
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
  textGroup: {
    marginTop: SCREEN_HEIGHT * 0.04,
    marginBottom: SCREEN_HEIGHT * 0.05,
  },
  stepTag: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: SCREEN_HEIGHT > 700 ? 26 : 22,
    color: "#94a3b8",
    lineHeight: SCREEN_HEIGHT > 700 ? 40 : 34,
    fontWeight: "400",
  },
  boldText: {
    fontWeight: "800",
    color: "#f1f5f9",
  },

  /* 인풋 */
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#2d3f55",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  inputWrapFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#1a2540",
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "#f1f5f9",
    paddingVertical: SCREEN_HEIGHT * 0.022,
    fontWeight: "600",
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },

  /* 비번 체크리스트 */
  checkList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingLeft: 4,
    marginTop: 4,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  checkText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "500",
  },
  checkActive: {
    color: "#818cf8",
  },

  /* 닉네임 카운터 */
  counter: {
    color: "#334155",
    fontSize: 12,
    textAlign: "right",
    paddingRight: 4,
    marginTop: 4,
  },

  /* 하단 버튼 고정 */
  bottomFixed: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 12 : 24,
    paddingTop: 12,
    backgroundColor: "#0b1220",
  },
  actionBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 17,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  actionBtnDisabled: {
    backgroundColor: "#1e293b",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* 완료 화면 */
  doneScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  doneIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#334155",
  },
  doneIconEmoji: {
    fontSize: 40,
  },
  doneTitle: {
    color: "#f1f5f9",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  doneDesc: {
    color: "#64748b",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
  },
  doneNick: {
    color: "#818cf8",
    fontWeight: "700",
  },
  doneBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 18,
    shadowColor: "#6366f1",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
