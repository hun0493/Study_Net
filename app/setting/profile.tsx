import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { useMonoTheme, type MonoTheme } from "../../constants/mono";

const userTypes = ["초등학생", "중학생", "고등학생", "대학생", "취준생", "직장인"];

export default function ProfileScreen() {
  const router = useRouter();
  const { theme: C } = useMonoTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [userType, setUserType] = useState("");

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

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("입력 오류", "이름과 이메일을 입력해주세요.");
      return;
    }

    await AsyncStorage.setItem(
      "userProfile",
      JSON.stringify({ name, email, image, userType }),
    );
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>프로필 설정</Text>

      <TouchableOpacity style={styles.imageWrapper} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>이미지 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>이름</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="이름 입력"
        placeholderTextColor={C.text}
      />

      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="이메일 입력"
        placeholderTextColor={C.text}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>학습 단계</Text>
      <View style={styles.typeContainer}>
        {userTypes.map((type) => {
          const active = userType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, active && styles.typeButtonActive]}
              onPress={() => setUserType(type)}
            >
              <Text style={[styles.typeText, active && styles.typeTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (C: MonoTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    content: {
      padding: 20,
      paddingBottom: 44,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: C.text,
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
      borderWidth: 1,
      borderColor: C.border,
    },
    placeholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: C.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    placeholderText: {
      color: C.text,
    },
    label: {
      color: C.text,
      marginBottom: 8,
      marginTop: 15,
      fontSize: 14,
    },
    input: {
      backgroundColor: C.surface,
      borderRadius: 10,
      padding: 12,
      color: C.text,
      borderWidth: 1,
      borderColor: C.border,
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
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    typeButtonActive: {
      borderWidth: 2,
    },
    typeText: {
      color: C.text,
      fontSize: 14,
    },
    typeTextActive: {
      color: C.text,
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: C.surface,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    saveButtonText: {
      color: C.text,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
