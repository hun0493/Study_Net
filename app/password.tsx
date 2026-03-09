import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PasswordResetFriendly() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.circleDecoration} />

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
          />
        </View>

        <TouchableOpacity style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>인증 메일 발송하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>아니요, 기억났어요!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
  },
  // 배경에 은은한 원형 장식 추가
  circleDecoration: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(99, 102, 241, 0.05)",
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
    marginBottom: 16,
  },
  atIcon: { marginRight: 10 },
  glassInput: { flex: 1, paddingVertical: 18, color: "#fff", fontSize: 16 },
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
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { marginTop: 24 },
  cancelText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
