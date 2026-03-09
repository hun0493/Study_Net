import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* -------------------- 타입 정의 -------------------- */

type SocialButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  textColor: string;
  label: string;
};

/* -------------------- 메인 컴포넌트 -------------------- */

export default function LoginScreen() {
  const router = useRouter();
  const [socialOpen, setSocialOpen] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <Text style={styles.brandTag}>Study Platform</Text>
          <Text style={styles.logo}>StudyNet</Text>
          <View style={styles.logoUnderline} />
        </View>

        {/* 입력 영역 */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 주소</Text>
            <TextInput
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              placeholder="example@studynet.com"
              style={[styles.input, isEmailFocused && styles.inputFocused]}
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="비밀번호를 입력하세요"
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#64748b"
              />
              <TouchableOpacity style={styles.eyeIcon}>
                <Ionicons name="eye-off-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.loginButton}
            onPress={() => router.replace("/main")}
          >
            <Text style={styles.loginText}>로그인</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>또는</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.socialOpenBtn}
            onPress={() => setSocialOpen(true)}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color="#cbd5f1"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.socialOpenText}>간편 로그인 / SNS 계정</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 메뉴 */}
        <View style={styles.bottomMenu}>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.linkText}>
              계정이 없으신가요?{" "}
              <Text style={styles.linkHighlight}>회원가입</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/password")}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>

        {/* 바텀시트 모달 */}
        <Modal
          transparent
          visible={socialOpen}
          animationType="slide"
          onRequestClose={() => setSocialOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSocialOpen(false)}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>SNS 간편 로그인</Text>

              <View style={styles.socialGrid}>
                <SocialButton
                  name="logo-google"
                  color="#fff"
                  textColor="#000"
                  label="Google"
                />
                <SocialButton
                  name="chatbubble"
                  color="#FEE500"
                  textColor="#000"
                  label="Kakao"
                />
                <SocialButton
                  name="logo-apple"
                  color="#000"
                  textColor="#fff"
                  label="Apple"
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------- 소셜 버튼 컴포넌트 -------------------- */

const SocialButton = ({ name, color, textColor, label }: SocialButtonProps) => (
  <TouchableOpacity style={[styles.socialBtn, { backgroundColor: color }]}>
    <Ionicons name={name} size={22} color={textColor} />
    <Text style={[styles.socialBtnText, { color: textColor }]}>
      {label}로 시작하기
    </Text>
  </TouchableOpacity>
);

/* -------------------- 스타일 -------------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b1220" },
  container: { flex: 1, paddingHorizontal: 28 },

  header: { marginTop: 60, marginBottom: 40 },
  brandTag: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 1,
  },
  logo: { fontSize: 38, fontWeight: "900", color: "#ffffff" },
  logoUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#6366f1",
    marginTop: 8,
    borderRadius: 2,
  },

  formSection: { width: "100%" },
  inputGroup: { marginBottom: 20 },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  inputFocused: { borderColor: "#6366f1", backgroundColor: "#0f172a" },

  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 18 },

  loginButton: {
    backgroundColor: "#6366f1",
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  loginText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  line: { flex: 1, height: 1, backgroundColor: "#334155" },
  orText: { color: "#64748b", marginHorizontal: 10, fontSize: 13 },

  socialOpenBtn: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  socialOpenText: { color: "#cbd5f1", fontWeight: "600" },

  bottomMenu: { marginTop: 40, alignItems: "center" },
  linkText: { color: "#94a3b8", fontSize: 14 },
  linkHighlight: { color: "#6366f1", fontWeight: "700" },
  forgotBtn: { marginTop: 16 },
  forgotText: {
    color: "#64748b",
    fontSize: 13,
    textDecorationLine: "underline",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#1e293b",
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#475569",
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 10,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  socialGrid: { gap: 12 },
  socialBtn: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  socialBtnText: { marginLeft: 10, fontWeight: "700", fontSize: 15 },
});
