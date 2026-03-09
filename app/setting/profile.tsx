import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [userType, setUserType] = useState("");

  const userTypes = [
    "초등학생",
    "중학생",
    "고등학생",
    "대학생",
    "취준생",
    "직장인",
  ];

  // 기존 저장된 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      const saved = await AsyncStorage.getItem("userProfile");
      if (saved) {
        const parsed = JSON.parse(saved);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setImage(parsed.image || null);
        setUserType(parsed.userType || "");
      }
    };

    loadProfile();
  }, []);

  // 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 저장
  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("이름과 이메일을 입력해주세요.");
      return;
    }

    const profileData = {
      name,
      email,
      image,
      userType,
    };

    await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
    router.back(); // index로 복귀
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>프로필 설정</Text>

      {/* 프로필 이미지 */}
      <TouchableOpacity style={styles.imageWrapper} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>이미지 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 이름 */}
      <Text style={styles.label}>이름</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="이름 입력"
        placeholderTextColor="#777"
      />

      {/* 이메일 */}
      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="이메일 입력"
        placeholderTextColor="#777"
        keyboardType="email-address"
      />

      {/* 학습 단계 */}
      <Text style={styles.label}>학습 단계</Text>
      <View style={styles.typeContainer}>
        {userTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              userType === type && styles.typeButtonActive,
            ]}
            onPress={() => setUserType(type)}
          >
            <Text
              style={[
                styles.typeText,
                userType === type && styles.typeTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },
  imageWrapper: {
    alignSelf: "center",
    marginBottom: 25,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1e1e1e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  placeholderText: {
    color: "#888",
  },
  label: {
    color: "#aaa",
    marginBottom: 8,
    marginTop: 15,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
    marginBottom: 20,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#333",
  },
  typeButtonActive: {
    backgroundColor: "#4f8cff",
    borderColor: "#4f8cff",
  },
  typeText: {
    color: "#aaa",
    fontSize: 14,
  },
  typeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4f8cff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
