import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignupScreen() {
  const router = useRouter();

  const signup = (provider: string) => {
    console.log("signup:", provider);

    // TODO: OAuth 연결
    router.replace("/");
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={s.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color="#0f172a"
        />
      </TouchableOpacity>

      <View style={s.container}>
        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.title}>스터디 시작하기</Text>
          <Text style={s.subtitle}>
            소셜 계정으로 빠르게 가입하세요
          </Text>
        </View>

        {/* DIVIDER */}
        <View style={s.divider}>
          <View style={s.line} />
          <Text style={s.dividerText}>가입 방법</Text>
          <View style={s.line} />
        </View>

        {/* BUTTON CARD */}
        <View style={s.card}>
          <TouchableOpacity
            style={s.btn}
            onPress={() => signup("google")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="logo-google"
              size={18}
              color="#111"
            />
            <Text style={s.btnText}>
              Google로 계속하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btn}
            onPress={() => signup("apple")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="logo-apple"
              size={18}
              color="#111"
            />
            <Text style={s.btnText}>
              Apple로 계속하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, s.lastBtn]}
            onPress={() => signup("kakao")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={18}
              color="#111"
            />
            <Text style={s.btnText}>
              Kakao로 계속하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FOOTER */}
      <Text style={s.notice}>
        가입 시 이용약관 및 개인정보처리방침에 동의합니다
      </Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  backButton: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 10,
    padding: 8,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },

  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 18,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
  },

  lastBtn: {
    marginBottom: 0,
  },

  btnText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },

  notice: {
    position: "absolute",
    bottom: 30,
    left: 28,
    right: 28,
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
  },
});