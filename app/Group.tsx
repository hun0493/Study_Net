import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { get, onValue, push, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../utils/firebaseConfig";

const { width: SW } = Dimensions.get("window");
const CODE_LENGTH = 6;
const MEMBER_KEY = "group_member_profile";
const ACTIVE_SESSION_KEY = "active_session";

const C = {
  bg: "#0A0E1A",
  surface: "#111827",
  surfaceAlt: "#1A2235",
  border: "#1E2D42",
  borderMid: "#253347",
  accent: "#2563EB",
  cafe: "#C9A86A",
  cafeSoft: "#2B2418",
  success: "#10B981",
  successSoft: "#0D2B22",
  danger: "#EF4444",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textTertiary: "#4B5E77",
  textAccent: "#60A5FA",
  purple: "#7C6CF2",
};

const COLORS = ["#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F87171", "#22D3EE"];
const EMOJIS = ["👍", "🔥", "👏", "💪"];
const ROOM_EMOJIS = ["📚", "✏️", "💻", "🎯", "🧠"];
const MAX_OPTIONS = [4, 6, 8, 12];

type Screen = "lobby" | "room";

interface Member {
  id: string;
  name: string;
  color: string;
  muted?: boolean;
  speaking?: boolean;
  status?: string;
  joinedAt?: number;
  studyStartEpoch?: number | null;
}

interface Room {
  id: string;
  ownerId: string;
  name: string;
  emoji: string;
  subjects: string;
  color: string;
  max: number;
  code: string;
  createdAt?: number;
  members: Member[];
}

interface StoredMember {
  id: string;
  name: string;
  color: string;
}

interface ActiveSessionData {
  subject?: string;
  startEpoch?: number;
  goalSeconds?: number;
}

const makeCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: CODE_LENGTH }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const getInitial = (name: string) => name.trim().slice(0, 1) || "?";

const formatTimer = (joinedAt?: number) => {
  if (!joinedAt) return "00:00:00";
  const total = Math.max(0, Math.floor((Date.now() - joinedAt) / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const getCurrentStudySession = async () => {
  const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  if (!raw) return { status: "대기중", studyStartEpoch: null };

  try {
    const session: ActiveSessionData = JSON.parse(raw);
    return {
      status: session.subject?.trim() || "집중중",
      studyStartEpoch: session.startEpoch ?? null,
    };
  } catch {
    return { status: "집중중", studyStartEpoch: null };
  }
};

const snapshotToRoom = (id: string, raw: any): Room => ({
  id,
  ownerId: raw.ownerId ?? "",
  name: raw.name ?? "스터디룸",
  emoji: raw.emoji ?? "📚",
  subjects: raw.subjects ?? "자유 공부",
  color: raw.color ?? COLORS[0],
  max: raw.max ?? 6,
  code: raw.code ?? "",
  createdAt: raw.createdAt ?? 0,
  members: Object.entries(raw.members ?? {}).map(([memberId, m]: [string, any]) => ({
    id: memberId,
    name: m.name ?? "학생",
    color: m.color ?? COLORS[0],
    muted: m.muted ?? false,
    speaking: m.speaking ?? false,
    status: m.status ?? "집중중",
    joinedAt: m.joinedAt,
    studyStartEpoch: m.studyStartEpoch ?? null,
  })),
});

export default function GroupScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("lobby");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [member, setMember] = useState<StoredMember | null>(null);
  const [loadError, setLoadError] = useState("");
  const [joining, setJoining] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [tick, setTick] = useState(0);

  const [floatingEmoji, setFloatingEmoji] = useState<{ id: number; emoji: string } | null>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const emojiCounter = useRef(0);
  const livePulse = useRef(new Animated.Value(1)).current;

  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const codeInputRef = useRef<TextInput>(null);

  const [roomName, setRoomName] = useState("");
  const [roomSubjects, setRoomSubjects] = useState("");
  const [roomMax, setRoomMax] = useState(6);
  const [creating, setCreating] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MEMBER_KEY).then((raw) => {
      if (raw) {
        setMember(JSON.parse(raw));
        return;
      }

      const newMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `학생${Math.floor(Math.random() * 900 + 100)}`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
      AsyncStorage.setItem(MEMBER_KEY, JSON.stringify(newMember));
      setMember(newMember);
    });
  }, []);

  useEffect(() => {
    if (!selectedRoomId) {
      setSelectedRoom(null);
      return;
    }

    const roomRef = ref(db, `rooms/${selectedRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSelectedRoom(null);
        setSelectedRoomId(null);
        setScreen("lobby");
        setLoadError("방장이 나갔거나 모든 사용자가 나가서 방이 종료됐어요.");
        return;
      }

      setSelectedRoom(snapshotToRoom(selectedRoomId, snapshot.val()));
      setLoadError("");
    });

    return unsubscribe;
  }, [selectedRoomId]);

  useEffect(() => {
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [livePulse]);

  useEffect(() => {
    if (!member || !selectedRoomId || screen !== "room") return;

    let mounted = true;
    const syncMyStudyStatus = async () => {
      try {
        const session = await getCurrentStudySession();
        if (!mounted) return;
        await update(ref(db, `rooms/${selectedRoomId}/members/${member.id}`), session);
      } catch (error: any) {
        if (mounted) setLoadError(error?.message ?? "공부 상태 동기화에 실패했어요.");
      }
    };

    syncMyStudyStatus();
    const timer = setInterval(syncMyStudyStatus, 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [member, screen, selectedRoomId]);

  const makeUniqueCode = async () => {
    for (let i = 0; i < 8; i += 1) {
      const code = makeCode();
      const codeSnapshot = await get(ref(db, `roomCodes/${code}`));
      if (!codeSnapshot.exists()) return code;
    }
    throw new Error("초대 코드를 만들지 못했어요. 다시 시도해주세요.");
  };

  const addMeToRoom = async (room: Room) => {
    if (!member) return false;
    const alreadyJoined = room.members.some((m) => m.id === member.id);
    if (room.members.length >= room.max && !alreadyJoined) {
      setCodeError("이 방은 현재 꽉 찼어요.");
      return false;
    }

    const session = await getCurrentStudySession();
    await update(ref(db, `rooms/${room.id}/members/${member.id}`), {
      name: member.name,
      color: member.color,
      muted: !micOn,
      speaking: false,
      ...session,
      joinedAt: alreadyJoined
        ? room.members.find((m) => m.id === member.id)?.joinedAt ?? Date.now()
        : Date.now(),
    });
    return true;
  };

  const handleCodeJoin = async () => {
    if (!member || joining) return;

    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length < CODE_LENGTH) {
      setCodeError("6자리 코드를 모두 입력해주세요.");
      return;
    }

    try {
      setJoining(true);
      setCodeError("");

      const codeSnapshot = await get(ref(db, `roomCodes/${trimmed}`));
      if (!codeSnapshot.exists()) {
        setCodeError("존재하지 않는 방 코드예요. 다시 확인해주세요.");
        return;
      }

      const roomId = codeSnapshot.val();
      const roomSnapshot = await get(ref(db, `rooms/${roomId}`));
      if (!roomSnapshot.exists()) {
        await update(ref(db), { [`roomCodes/${trimmed}`]: null });
        setCodeError("이미 종료된 방이에요.");
        return;
      }

      const room = snapshotToRoom(roomId, roomSnapshot.val());
      const ok = await addMeToRoom(room);
      if (!ok) return;

      setCodeInput("");
      setCodeModalVisible(false);
      setSelectedRoomId(room.id);
      setScreen("room");
    } catch (error: any) {
      setCodeError(error?.message ?? "방 입장에 실패했어요.");
    } finally {
      setJoining(false);
    }
  };

  const createRoom = async () => {
    if (!member || creating) return;

    const name = roomName.trim();
    const subjects = roomSubjects.trim() || "자유 공부";
    if (name.length < 2) return;

    try {
      setCreating(true);
      const newRef = push(ref(db, "rooms"));
      const roomId = newRef.key;
      if (!roomId) throw new Error("방 ID를 만들지 못했어요.");

      const code = await makeUniqueCode();
      const createdAt = Date.now();
      const session = await getCurrentStudySession();
      const room = {
        ownerId: member.id,
        name,
        subjects,
        emoji: ROOM_EMOJIS[Math.floor(Math.random() * ROOM_EMOJIS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        max: roomMax,
        code,
        createdAt,
        members: {
          [member.id]: {
            name: member.name,
            color: member.color,
            muted: !micOn,
            speaking: false,
            ...session,
            joinedAt: createdAt,
          },
        },
      };

      await update(ref(db), {
        [`rooms/${roomId}`]: room,
        [`roomCodes/${code}`]: roomId,
      });

      setLoadError("");
      setCreateModalVisible(false);
      setRoomName("");
      setRoomSubjects("");
      setRoomMax(6);
      setSelectedRoomId(roomId);
      setScreen("room");
    } catch (error: any) {
      setLoadError(error?.message ?? "방 만들기에 실패했어요.");
    } finally {
      setCreating(false);
    }
  };

  const updateMic = async (next: boolean) => {
    setMicOn(next);
    if (!member || !selectedRoom) return;

    try {
      await update(ref(db, `rooms/${selectedRoom.id}/members/${member.id}`), { muted: !next });
    } catch (error: any) {
      setLoadError(error?.message ?? "마이크 상태 저장에 실패했어요.");
    }
  };

  const deleteRoom = async (room: Room) => {
    await update(ref(db), {
      [`rooms/${room.id}`]: null,
      [`roomCodes/${room.code}`]: null,
    });
  };

  const leaveRoomNow = async () => {
    if (!member || !selectedRoom) {
      setScreen("lobby");
      return;
    }

    try {
      const isOwner = selectedRoom.ownerId === member.id;
      const remainingMembers = selectedRoom.members.filter((m) => m.id !== member.id);

      if (isOwner || remainingMembers.length === 0) {
        await deleteRoom(selectedRoom);
      } else {
        await update(ref(db), {
          [`rooms/${selectedRoom.id}/members/${member.id}`]: null,
        });
      }
    } catch (error: any) {
      setLoadError(error?.message ?? "퇴장 처리에 실패했어요.");
    } finally {
      setLeaveConfirmVisible(false);
      setSelectedRoomId(null);
      setSelectedRoom(null);
      setScreen("lobby");
    }
  };

  const leaveRoom = () => {
    if (!member || !selectedRoom) {
      setScreen("lobby");
      return;
    }

    setLeaveConfirmVisible(true);
  };

  const openCodeModal = () => {
    setCodeInput("");
    setCodeError("");
    setCodeModalVisible(true);
    setTimeout(() => codeInputRef.current?.focus(), 300);
  };

  const sendEmoji = (emoji: string) => {
    emojiCounter.current += 1;
    setFloatingEmoji({ id: emojiCounter.current, emoji });
    floatAnim.setValue(0);
    Animated.timing(floatAnim, { toValue: 1, duration: 1800, useNativeDriver: true }).start(() =>
      setFloatingEmoji(null)
    );
  };

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });
  const floatOpacity = floatAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
  const roomMembers = selectedRoom?.members ?? [];
  const myMember = roomMembers.find((m) => m.id === member?.id);
  const memberCountText = `${roomMembers.length}/${selectedRoom?.max ?? 6}`;
  void tick;

  if (screen === "lobby") {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>스터디 카페</Text>
            <Text style={s.headerSub}>QUIET ROOM</Text>
          </View>
          <View style={s.roomCountBadge}>
            <Text style={s.roomCountText}>CODE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.lobbyContent} showsVerticalScrollIndicator={false}>
          {loadError !== "" && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color={C.danger} style={{ marginRight: 6 }} />
              <Text style={s.errorText}>{loadError}</Text>
            </View>
          )}

          <View style={s.lobbyPanel}>
            <View style={s.lobbyIcon}>
              <Ionicons name="cafe-outline" size={24} color={C.textAccent} />
            </View>
            <Text style={s.lobbyTitle}>조용한 집중석 만들기</Text>
            <Text style={s.lobbySub}>
              초대 코드를 받은 친구만 들어오는 비공개 스터디 공간이에요.
            </Text>
          </View>

          <TouchableOpacity style={s.codeJoinBtn} onPress={openCodeModal} activeOpacity={0.8}>
            <View style={s.codeJoinLeft}>
              <View style={s.codeJoinIcon}>
                <Ionicons name="key-outline" size={18} color={C.purple} />
              </View>
              <View>
                <Text style={s.codeJoinTitle}>입장 코드 입력</Text>
                <Text style={s.codeJoinSub}>스터디 카페 좌석에 합류하기</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={s.createBtn} activeOpacity={0.8} onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add" size={18} color={C.textTertiary} />
            <Text style={s.createBtnText}>새 집중석 만들기</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={codeModalVisible} transparent animationType="fade" onRequestClose={() => setCodeModalVisible(false)}>
          <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View style={s.modalIconWrap}>
                  <Ionicons name="key-outline" size={20} color={C.purple} />
                </View>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setCodeModalVisible(false)}>
                  <Ionicons name="close" size={15} color={C.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={s.modalTitle}>코드로 방 입장</Text>
              <Text style={s.modalSubtitle}>방장이 공유한 6자리 코드를 입력하세요.</Text>
              <TextInput
                ref={codeInputRef}
                style={s.codeInput}
                value={codeInput}
                onChangeText={(v) => {
                  setCodeError("");
                  setCodeInput(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH));
                }}
                placeholder="A7K2Q9"
                placeholderTextColor={C.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={CODE_LENGTH}
                selectionColor={C.purple}
              />

              {codeError !== "" && (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={C.danger} style={{ marginRight: 5 }} />
                  <Text style={s.errorText}>{codeError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.enterBtn, codeInput.length < CODE_LENGTH && { opacity: 0.45 }]}
                disabled={codeInput.length < CODE_LENGTH || joining}
                onPress={handleCodeJoin}
                activeOpacity={0.8}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="enter-outline" size={15} color="#fff" style={{ marginRight: 7 }} />
                    <Text style={s.enterBtnText}>입장하기</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
          <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View style={s.modalIconWrap}>
                  <Ionicons name="people-outline" size={20} color={C.purple} />
                </View>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setCreateModalVisible(false)}>
                  <Ionicons name="close" size={15} color={C.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={s.modalTitle}>새 집중석</Text>
              <Text style={s.modalSubtitle}>방을 만들면 친구에게 공유할 입장 코드가 생성돼요.</Text>
              <TextInput
                style={s.formInput}
                value={roomName}
                onChangeText={setRoomName}
                placeholder="방 이름"
                placeholderTextColor={C.textTertiary}
              />
              <TextInput
                style={s.formInput}
                value={roomSubjects}
                onChangeText={setRoomSubjects}
                placeholder="과목 예: 수학 · 영어"
                placeholderTextColor={C.textTertiary}
              />
              <View>
                <Text style={s.fieldLabel}>최대 인원</Text>
                <View style={s.maxOptionRow}>
                  {MAX_OPTIONS.map((option) => {
                    const active = option === roomMax;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[s.maxOption, active && s.maxOptionActive]}
                        onPress={() => setRoomMax(option)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.maxOptionText, active && s.maxOptionTextActive]}>{option}명</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity
                style={[s.enterBtn, roomName.trim().length < 2 && { opacity: 0.45 }]}
                disabled={roomName.trim().length < 2 || creating}
                onPress={createRoom}
                activeOpacity={0.8}
              >
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={s.enterBtnText}>만들고 입장하기</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  if (!selectedRoom) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={C.textAccent} />
        <Text style={s.loadingText}>방 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const CARD_GAP = 6;
  const CARD_W = (SW - 36 - CARD_GAP) / 2;
  const CARD_H = CARD_W * (4 / 3);
  const isOwner = selectedRoom.ownerId === member?.id;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={leaveRoom}>
          <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{selectedRoom.name}</Text>
          <Text style={s.headerSub}>ROOM · {selectedRoom.code}</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.liveBadge}>
            <Animated.View style={[s.liveDot, { opacity: livePulse }]} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
          <View style={s.roomCountBadge}>
            <Text style={s.roomCountText}>{memberCountText}</Text>
          </View>
        </View>
      </View>

      <View style={s.inviteBar}>
        <View>
          <Text style={s.inviteLabel}>입장 코드</Text>
          <Text style={s.inviteCode}>{selectedRoom.code}</Text>
        </View>
        <View style={s.ownerTag}>
          <Text style={s.ownerTagText}>{isOwner ? "방장" : "참여자"}</Text>
        </View>
      </View>

      <View style={s.gridWrap}>
        {roomMembers.length === 1 && (
          <View style={s.quietNotice}>
            <Ionicons name="leaf-outline" size={14} color={C.textAccent} style={{ marginRight: 6 }} />
            <Text style={s.quietNoticeText}>아직 혼자예요. 입장 코드를 공유하면 친구가 같은 집중석에 앉을 수 있어요.</Text>
          </View>
        )}
        <View style={s.grid}>
          {roomMembers.map((m) => {
            const isMe = m.id === member?.id;
            return (
              <View key={m.id} style={[s.camCard, { width: CARD_W, height: CARD_H }, m.speaking && s.camCardSpeaking, isMe && s.camCardMe]}>
                <View style={[s.camBg, { backgroundColor: m.color + "08" }]}>
                  <View style={[s.camAvatar, { backgroundColor: m.color + "22", borderColor: m.color + "44" }]}>
                    <Text style={[s.camAvatarText, { color: m.color }]}>{getInitial(m.name)}</Text>
                  </View>
                </View>
                {m.muted && (
                  <View style={s.micOffBadge}>
                    <Ionicons name="mic-off" size={9} color="#fff" />
                  </View>
                )}
                <View style={s.camInfo}>
                  <View style={s.camNameRow}>
                    <Text style={s.camName} numberOfLines={1}>{m.name}</Text>
                    {isMe && <View style={s.meTag}><Text style={s.meTagText}>ME</Text></View>}
                  </View>
                  <View style={s.camSubjectRow}>
                    <View style={s.subjectPill}>
                      <View style={[s.subjectDot, { backgroundColor: m.color }]} />
                    <Text style={s.subjectText} numberOfLines={1}>{m.status ?? "집중중"}</Text>
                    </View>
                    <Text style={s.camTimer}>{formatTimer(m.studyStartEpoch ?? m.joinedAt)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.timerBar}>
        <Text style={s.timerLabel}>세션</Text>
        <Text style={s.timerValue}>{formatTimer(myMember?.studyStartEpoch ?? myMember?.joinedAt)}</Text>
        <View style={s.timerProgressWrap}>
          <View style={s.timerProgressTrack}>
            <View style={[s.timerProgressFill, { width: "46%" }]} />
          </View>
        </View>
        <Text style={s.timerPct} numberOfLines={1}>{selectedRoom.subjects}</Text>
      </View>

      <View style={s.controls}>
        <TouchableOpacity style={[s.ctrlBtn, micOn && s.ctrlBtnActive]} onPress={() => updateMic(!micOn)} activeOpacity={0.8}>
          <Ionicons name={micOn ? "mic" : "mic-off"} size={18} color={micOn ? "#fff" : C.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrlBtn, camOn && s.ctrlBtnActive]} onPress={() => setCamOn((v) => !v)} activeOpacity={0.8}>
          <Ionicons name={camOn ? "videocam" : "videocam-off"} size={18} color={camOn ? "#fff" : C.textSecondary} />
        </TouchableOpacity>
        <View style={s.emojiRow}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity key={emoji} onPress={() => sendEmoji(emoji)} activeOpacity={0.7} style={s.emojiBtn}>
              <Text style={s.emojiBtnText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.ctrlBtnDanger} onPress={leaveRoom} activeOpacity={0.8}>
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {floatingEmoji && (
        <Animated.View style={[s.floatingEmoji, { transform: [{ translateY: floatY }], opacity: floatOpacity }]}>
          <Text style={{ fontSize: 28 }}>{floatingEmoji.emoji}</Text>
        </Animated.View>
      )}

      <Modal
        visible={leaveConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeaveConfirmVisible(false)}
      >
        <View style={s.confirmOverlay}>
          <View style={s.confirmCard}>
            <View style={s.confirmIcon}>
              <Ionicons
                name={isOwner ? "warning-outline" : "log-out-outline"}
                size={22}
                color={isOwner ? C.danger : C.cafe}
              />
            </View>
            <Text style={s.confirmTitle}>{isOwner ? "스터디룸을 종료할까요?" : "집중석에서 나갈까요?"}</Text>
            <Text style={s.confirmDesc}>
              {isOwner
                ? "방장이 나가면 이 방과 입장 코드가 삭제되고, 참여자도 로비로 돌아가요."
                : "현재 스터디룸에서 나가도 나중에 입장 코드로 다시 들어올 수 있어요."}
            </Text>
            <View style={s.confirmActions}>
              <TouchableOpacity
                style={s.confirmCancelBtn}
                onPress={() => setLeaveConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.confirmCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmLeaveBtn, isOwner && s.confirmLeaveDangerBtn]}
                onPress={leaveRoomNow}
                activeOpacity={0.8}
              >
                <Text style={s.confirmLeaveText}>{isOwner ? "종료하기" : "나가기"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingTop: 56 },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: { color: C.textPrimary, fontSize: 14, fontWeight: "700" },
  headerSub: { color: C.textTertiary, fontSize: 9, letterSpacing: 1.5, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.successSoft, borderWidth: 1, borderColor: C.success + "55", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.success },
  liveText: { color: C.success, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  roomCountBadge: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  roomCountText: { color: C.textSecondary, fontSize: 10, fontWeight: "600" },
  lobbyContent: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  lobbyPanel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 20, alignItems: "center" },
  lobbyIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.cafeSoft, borderWidth: 1, borderColor: C.cafe + "55", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  lobbyTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "800", marginBottom: 7 },
  lobbySub: { color: C.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
  errorBanner: { flexDirection: "row", alignItems: "center", backgroundColor: C.danger + "11", borderWidth: 1, borderColor: C.danger + "33", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  codeJoinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.cafeSoft, borderWidth: 1, borderColor: C.cafe + "44", borderRadius: 14, padding: 14 },
  codeJoinLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  codeJoinIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: C.cafe + "18", borderWidth: 1, borderColor: C.cafe + "44", justifyContent: "center", alignItems: "center" },
  codeJoinTitle: { color: C.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  codeJoinSub: { color: C.textTertiary, fontSize: 11 },
  createBtn: { borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  createBtnText: { color: C.textTertiary, fontSize: 13, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  modalCard: { width: "100%", backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.borderMid, padding: 22, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.purple + "22", borderWidth: 1, borderColor: C.purple + "44", justifyContent: "center", alignItems: "center" },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  modalTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "700" },
  modalSubtitle: { color: C.textTertiary, fontSize: 12, lineHeight: 18 },
  codeInput: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.borderMid, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: C.textPrimary, fontSize: 22, fontWeight: "600", letterSpacing: 6, textAlign: "center", fontVariant: ["tabular-nums"] },
  formInput: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.borderMid, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: C.textPrimary, fontSize: 14 },
  fieldLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  maxOptionRow: { flexDirection: "row", gap: 8 },
  maxOption: { flex: 1, height: 38, borderRadius: 10, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  maxOptionActive: { backgroundColor: C.cafeSoft, borderColor: C.cafe + "88" },
  maxOptionText: { color: C.textTertiary, fontSize: 12, fontWeight: "700" },
  maxOptionTextActive: { color: C.cafe },
  errorRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.danger + "11", borderWidth: 1, borderColor: C.danger + "33", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  errorText: { color: C.danger, fontSize: 12, flex: 1 },
  enterBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.purple, borderRadius: 12, paddingVertical: 15, minHeight: 50 },
  enterBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
  inviteBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 12, marginBottom: 10, backgroundColor: C.cafeSoft, borderWidth: 1, borderColor: C.cafe + "44", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  inviteLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  inviteCode: { color: C.textPrimary, fontSize: 20, fontWeight: "800", letterSpacing: 3, marginTop: 2 },
  ownerTag: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.cafe + "44", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  ownerTagText: { color: C.cafe, fontSize: 11, fontWeight: "800" },
  gridWrap: { paddingHorizontal: 12 },
  quietNotice: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  quietNoticeText: { color: C.textTertiary, fontSize: 11, lineHeight: 16, flex: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  camCard: { borderRadius: 12, overflow: "hidden", borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  camCardSpeaking: { borderColor: C.success, shadowColor: C.success, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  camCardMe: { borderColor: C.cafe + "88" },
  camBg: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  camAvatar: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  camAvatarText: { fontSize: 20, fontWeight: "700" },
  micOffBadge: { position: "absolute", top: 7, right: 7, width: 18, height: 18, borderRadius: 9, backgroundColor: "#EF4444CC", justifyContent: "center", alignItems: "center" },
  camInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(10,14,26,0.78)" },
  camNameRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  camName: { color: C.textPrimary, fontSize: 11, fontWeight: "700", flex: 1 },
  meTag: { backgroundColor: C.cafeSoft, borderWidth: 1, borderColor: C.cafe + "66", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  meTagText: { color: "#fff", fontSize: 7, fontWeight: "700", letterSpacing: 0.5 },
  camSubjectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  subjectPill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  subjectDot: { width: 4, height: 4, borderRadius: 2 },
  subjectText: { color: C.textSecondary, fontSize: 9, fontWeight: "600" },
  camTimer: { color: C.textAccent, fontSize: 10, fontWeight: "600", fontVariant: ["tabular-nums"] },
  timerBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, gap: 8 },
  timerLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  timerValue: { color: C.textPrimary, fontSize: 14, fontWeight: "300", fontVariant: ["tabular-nums"] },
  timerProgressWrap: { flex: 1 },
  timerProgressTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" },
  timerProgressFill: { height: "100%", backgroundColor: C.accent, borderRadius: 2 },
  timerPct: { color: C.textAccent, fontSize: 11, fontWeight: "700", maxWidth: 90 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 24, gap: 8 },
  ctrlBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  ctrlBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  ctrlBtnDanger: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#7F1D1D", borderWidth: 1, borderColor: "#EF444488", justifyContent: "center", alignItems: "center" },
  emojiRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 6, gap: 2 },
  emojiBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  emojiBtnText: { fontSize: 16 },
  loadingText: { color: C.textTertiary, fontSize: 12, marginTop: 10 },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  confirmCard: { width: "100%", backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid, borderRadius: 18, padding: 22, alignItems: "center" },
  confirmIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.cafeSoft, borderWidth: 1, borderColor: C.cafe + "44", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  confirmTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  confirmDesc: { color: C.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 18 },
  confirmActions: { flexDirection: "row", gap: 10, width: "100%" },
  confirmCancelBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  confirmCancelText: { color: C.textSecondary, fontSize: 14, fontWeight: "800" },
  confirmLeaveBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: C.cafe, justifyContent: "center", alignItems: "center" },
  confirmLeaveDangerBtn: { backgroundColor: "#8B1E1E", borderWidth: 1, borderColor: C.danger + "77" },
  confirmLeaveText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  floatingEmoji: { position: "absolute", bottom: 90, left: "50%", marginLeft: -18 },
});
