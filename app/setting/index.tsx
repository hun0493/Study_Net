import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const [name, setName] = useState("Study User");
  const [email, setEmail] = useState("user@example.com");
  const [image, setImage] = useState<string | null>(null);
  const [userType, setUserType] = useState("");

  // 🔥 profile.tsx에서 저장한 userProfile 불러오기
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const saved = await AsyncStorage.getItem("userProfile");

        if (saved) {
          const parsed = JSON.parse(saved);
          setName(parsed.name || "Study User");
          setEmail(parsed.email || "user@example.com");
          setImage(parsed.image || null);
          setUserType(parsed.userType || "");
        }
      };

      loadProfile();
    }, []),
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {name ? name.charAt(0).toUpperCase() : "S"}
              </Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>

            {userType ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{userType}</Text>
              </View>
            ) : null}

            <Text style={styles.profileEmail}>{email}</Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/setting/profile")}
          >
            <Text style={styles.editText}>수정</Text>
          </TouchableOpacity>
        </View>

        {/* Section — Account */}
        <Text style={styles.sectionTitle}>계정</Text>

        <SettingRow
          label="프로필 관리"
          onPress={() => router.push("/setting/profile")}
        />

        <SettingRow
          label="비밀번호 변경"
          onPress={() => router.push("/setting/password")}
        />

        <SettingRow label="연결된 로그인" onPress={() => {}} />

        {/* Section — Study */}
        <Text style={styles.sectionTitle}>학습 설정</Text>

        <SettingRow label="목표 시간 설정" onPress={() => {}} />
        <SettingRow label="집중 모드" onPress={() => {}} />

        {/* Section — App */}
        <Text style={styles.sectionTitle}>앱 설정</Text>

        <SwitchRow
          label="알림"
          value={notifications}
          onChange={setNotifications}
        />

        <SwitchRow label="다크 모드" value={darkMode} onChange={setDarkMode} />

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------- Rows ---------------- */

function SettingRow({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={[styles.rowText, danger ? styles.rowTextDanger : null]}>
        {label}
      </Text>
      <Text style={styles.rowArrow}>›</Text>
    </TouchableOpacity>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
    paddingTop: 60,
    paddingHorizontal: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerSpacer: {
    width: 32,
    height: 32,
  },

  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    color: "#e5e7eb",
    fontSize: 20,
    marginTop: -2,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  profileCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 20,
  },

  profileName: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 15,
  },

  badge: {
    backgroundColor: "#1e40af",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  profileEmail: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 6,
  },

  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1f2937",
    marginLeft: 10,
  },

  editText: {
    color: "#c7d2fe",
    fontSize: 12,
    fontWeight: "600",
  },

  sectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
    marginLeft: 4,
  },

  row: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  rowText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },

  rowTextDanger: {
    color: "#ef4444",
  },

  rowArrow: {
    color: "#64748b",
    fontSize: 18,
  },

  logoutBtn: {
    marginTop: 28,
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#f87171",
    fontWeight: "700",
  },
});
