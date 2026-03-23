import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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

const { width: SW } = Dimensions.get("window");

const C = {
  bg:           "#0A0E1A",
  surface:      "#111827",
  surfaceAlt:   "#1A2235",
  border:       "#1E2D42",
  borderMid:    "#253347",
  accent:       "#2563EB",
  accentSoft:   "#1E3A5F",
  success:      "#10B981",
  successSoft:  "#0D2B22",
  danger:       "#EF4444",
  textPrimary:  "#F8FAFC",
  textSecondary:"#94A3B8",
  textTertiary: "#4B5E77",
  textAccent:   "#60A5FA",
  purple:       "#8B5CF6",
};

// ── 목업 데이터 ──────────────────────────────────────
const MOCK_ROOMS = [
  {
    id: "1", name: "수능 스터디룸", emoji: "📚",
    subjects: "수학 · 영어 · 과학", color: "#60A5FA",
    members: [
      { name: "김", color: "#60A5FA" },
      { name: "이", color: "#34D399" },
      { name: "박", color: "#FBBF24" },
    ],
    max: 6, code: "4EJ9K2",
  },
  {
    id: "2", name: "토익 900+ 달성", emoji: "🎯",
    subjects: "영어", color: "#A78BFA",
    members: [
      { name: "최", color: "#A78BFA" },
      { name: "정", color: "#F87171" },
      { name: "강", color: "#22D3EE" },
      { name: "윤", color: "#34D399" },
      { name: "오", color: "#FBBF24" },
    ],
    max: 6, code: "9KM2X1",
  },
  {
    id: "3", name: "불꽃 코딩 스터디", emoji: "🔥",
    subjects: "프로그래밍", color: "#F87171",
    members: [
      { name: "김", color: "#F87171" },
      { name: "이", color: "#60A5FA" },
      { name: "박", color: "#34D399" },
      { name: "최", color: "#FBBF24" },
      { name: "정", color: "#A78BFA" },
      { name: "강", color: "#22D3EE" },
    ],
    max: 6, code: "7BX3M1",
  },
];

const MOCK_MEMBERS_4 = [
  { id: "1", name: "김민준", subject: "수학", color: "#60A5FA", timer: "01:23:45", muted: false, speaking: true  },
  { id: "2", name: "이서연", subject: "영어", color: "#A78BFA", timer: "00:45:12", muted: true,  speaking: false },
  { id: "3", name: "박지호", subject: "과학", color: "#34D399", timer: "02:01:33", muted: false, speaking: false },
  { id: "4", name: "나",     subject: "물리", color: "#60A5FA", timer: "00:58:07", muted: false, speaking: false, isMe: true },
];

const EMOJIS = ["👍", "🔥", "☕", "💪"];

// 코드 입력 칸 개수
const CODE_LENGTH = 6;

type Screen = "list" | "room";

export default function GroupScreen() {
  const router = useRouter();
  const [screen, setScreen]               = useState<Screen>("list");
  const [selectedRoom, setSelectedRoom]   = useState(MOCK_ROOMS[0]);
  const [micOn, setMicOn]                 = useState(true);
  const [camOn, setCamOn]                 = useState(true);
  const [floatingEmoji, setFloatingEmoji] = useState<{ id: number; emoji: string } | null>(null);
  const floatAnim    = useRef(new Animated.Value(0)).current;
  const emojiCounter = useRef(0);

  // ── 코드 입력 모달 상태 ──────────────────────────
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [codeInput, setCodeInput]               = useState("");
  const [codeError, setCodeError]               = useState("");
  const codeInputRef = useRef<TextInput>(null);

  // 라이브 점 깜빡임
  const livePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // 이모지 플로팅
  const sendEmoji = (emoji: string) => {
    emojiCounter.current += 1;
    setFloatingEmoji({ id: emojiCounter.current, emoji });
    floatAnim.setValue(0);
    Animated.timing(floatAnim, {
      toValue: 1, duration: 1800, useNativeDriver: true,
    }).start(() => setFloatingEmoji(null));
  };

  const floatY       = floatAnim.interpolate({ inputRange: [0,1], outputRange: [0, -80] });
  const floatOpacity = floatAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });

  // ── 코드로 방 입장 ───────────────────────────────
  const handleCodeJoin = () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length < CODE_LENGTH) {
      setCodeError("6자리 코드를 모두 입력해주세요.");
      return;
    }
    const found = MOCK_ROOMS.find((r) => r.code === trimmed);
    if (!found) {
      setCodeError("존재하지 않는 방 코드예요. 다시 확인해주세요.");
      return;
    }
    if (found.members.length >= found.max) {
      setCodeError("이 방은 현재 꽉 찼어요.");
      return;
    }
    // 입장 성공
    setCodeError("");
    setCodeInput("");
    setCodeModalVisible(false);
    setSelectedRoom(found);
    setScreen("room");
  };

  const openCodeModal = () => {
    setCodeInput("");
    setCodeError("");
    setCodeModalVisible(true);
    setTimeout(() => codeInputRef.current?.focus(), 300);
  };

  // ── 방 목록 화면 ──────────────────────────────────
  if (screen === "list") {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* 헤더 */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>그룹 스터디</Text>
            <Text style={s.headerSub}>STUDY ROOMS</Text>
          </View>
          <View style={s.roomCountBadge}>
            <Text style={s.roomCountText}>방 {MOCK_ROOMS.length}개</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ✅ 코드로 참여 버튼 — 방 목록 최상단 */}
          <TouchableOpacity style={s.codeJoinBtn} onPress={openCodeModal} activeOpacity={0.8}>
            <View style={s.codeJoinLeft}>
              <View style={s.codeJoinIcon}>
                <Ionicons name="key-outline" size={18} color={C.purple} />
              </View>
              <View>
                <Text style={s.codeJoinTitle}>코드로 참여하기</Text>
                <Text style={s.codeJoinSub}>초대 코드 6자리를 입력하세요</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>공개 방</Text>
            <View style={s.dividerLine} />
          </View>

          {/* 방 목록 */}
          {MOCK_ROOMS.map((room) => {
            const isFull = room.members.length >= room.max;
            return (
              <View key={room.id} style={[s.roomCard, isFull && { opacity: 0.55 }]}>
                <View style={s.roomCardLeft}>
                  <View style={[s.roomEmoji, { backgroundColor: room.color + "11", borderColor: room.color + "44" }]}>
                    <Text style={{ fontSize: 20 }}>{room.emoji}</Text>
                  </View>
                  <View>
                    <Text style={s.roomName}>{room.name}</Text>
                    <Text style={s.roomSub}>{room.subjects}  •  {room.members.length}/{room.max}명</Text>
                  </View>
                </View>
                <View style={s.roomCardRight}>
                  <View style={s.miniAvatarRow}>
                    {room.members.slice(0, 4).map((m, i) => (
                      <View key={i} style={[s.miniAvatar, { backgroundColor: m.color + "22", borderColor: m.color + "66", marginLeft: i === 0 ? 0 : -6 }]}>
                        <Text style={[s.miniAvatarText, { color: m.color }]}>{m.name}</Text>
                      </View>
                    ))}
                    {room.members.length > 4 && (
                      <View style={[s.miniAvatar, { backgroundColor: C.surfaceAlt, borderColor: C.border, marginLeft: -6 }]}>
                        <Text style={[s.miniAvatarText, { color: C.textTertiary }]}>+{room.members.length - 4}</Text>
                      </View>
                    )}
                  </View>
                  {isFull ? (
                    <View style={s.fullTag}><Text style={s.fullTagText}>꽉 참</Text></View>
                  ) : (
                    <TouchableOpacity
                      style={s.joinBtn}
                      onPress={() => { setSelectedRoom(room); setScreen("room"); }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.joinBtnText}>참여</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* 새 방 만들기 */}
          <TouchableOpacity style={s.createBtn} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={C.textTertiary} />
            <Text style={s.createBtnText}>새 방 만들기</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ✅ 코드 입력 모달 */}
        <Modal
          visible={codeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCodeModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={s.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={s.modalCard}>
              {/* 모달 헤더 */}
              <View style={s.modalHeader}>
                <View style={s.modalIconWrap}>
                  <Ionicons name="key-outline" size={20} color={C.purple} />
                </View>
                <TouchableOpacity
                  style={s.modalCloseBtn}
                  onPress={() => setCodeModalVisible(false)}
                >
                  <Ionicons name="close" size={15} color={C.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={s.modalTitle}>코드로 방 입장</Text>
              <Text style={s.modalSubtitle}>친구에게 받은 6자리 초대 코드를 입력하세요</Text>

              {/* 코드 입력 */}
              <View style={s.codeInputWrap}>
                <TextInput
                  ref={codeInputRef}
                  style={s.codeInput}
                  value={codeInput}
                  onChangeText={(v) => {
                    setCodeError("");
                    setCodeInput(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH));
                  }}
                  placeholder="예: 4EJ9K2"
                  placeholderTextColor={C.textTertiary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={CODE_LENGTH}
                  selectionColor={C.purple}
                  keyboardType="default"
                />
                {/* 글자 수 표시 */}
                <View style={s.codeDotsRow}>
                  {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.codeDot,
                        i < codeInput.length && { backgroundColor: C.purple, borderColor: C.purple },
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* 에러 메시지 */}
              {codeError !== "" && (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={C.danger} style={{ marginRight: 5 }} />
                  <Text style={s.errorText}>{codeError}</Text>
                </View>
              )}

              {/* 힌트 */}
              <View style={s.hintRow}>
                <Ionicons name="information-circle-outline" size={12} color={C.textTertiary} style={{ marginRight: 4 }} />
                <Text style={s.hintText}>테스트: <Text style={{ color: C.textAccent }}>4EJ9K2</Text> 또는 <Text style={{ color: C.textAccent }}>9KM2X1</Text></Text>
              </View>

              {/* 입장 버튼 */}
              <TouchableOpacity
                style={[s.enterBtn, codeInput.length < CODE_LENGTH && { opacity: 0.45 }]}
                onPress={handleCodeJoin}
                activeOpacity={0.8}
              >
                <Ionicons name="enter-outline" size={15} color="#fff" style={{ marginRight: 7 }} />
                <Text style={s.enterBtnText}>입장하기</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // ── 스터디 룸 화면 ────────────────────────────────
  const CARD_GAP = 6;
  const CARD_W   = (SW - 36 - CARD_GAP) / 2;
  const CARD_H   = CARD_W * (4 / 3);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => setScreen("list")}>
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
            <Text style={s.roomCountText}>{MOCK_MEMBERS_4.length}/6</Text>
          </View>
        </View>
      </View>

      {/* 그리드 */}
      <View style={s.gridWrap}>
        <View style={s.grid}>
          {MOCK_MEMBERS_4.map((member) => (
            <View
              key={member.id}
              style={[
                s.camCard,
                { width: CARD_W, height: CARD_H },
                member.speaking && s.camCardSpeaking,
                member.isMe    && s.camCardMe,
              ]}
            >
              <View style={[s.camBg, { backgroundColor: member.color + "08" }]}>
                <View style={[s.camAvatar, { backgroundColor: member.color + "22", borderColor: member.color + "44" }]}>
                  <Text style={[s.camAvatarText, { color: member.color }]}>{member.name[0]}</Text>
                </View>
              </View>
              <View style={s.camOverlay} />
              {member.muted && (
                <View style={s.micOffBadge}>
                  <Ionicons name="mic-off" size={9} color="#fff" />
                </View>
              )}
              <View style={s.camInfo}>
                <View style={s.camNameRow}>
                  <Text style={s.camName} numberOfLines={1}>{member.name}</Text>
                  {member.isMe && <View style={s.meTag}><Text style={s.meTagText}>ME</Text></View>}
                </View>
                <View style={s.camSubjectRow}>
                  <View style={s.subjectPill}>
                    <View style={[s.subjectDot, { backgroundColor: member.color }]} />
                    <Text style={s.subjectText}>{member.subject}</Text>
                  </View>
                  <Text style={s.camTimer}>{member.timer}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 세션 타이머 바 */}
      <View style={s.timerBar}>
        <Text style={s.timerLabel}>세션</Text>
        <Text style={s.timerValue}>01:23:45</Text>
        <View style={s.timerProgressWrap}>
          <View style={s.timerProgressTrack}>
            <View style={[s.timerProgressFill, { width: "46%" }]} />
          </View>
        </View>
        <Text style={s.timerPct}>46%</Text>
      </View>

      {/* 컨트롤 바 */}
      <View style={s.controls}>
        <TouchableOpacity
          style={[s.ctrlBtn, micOn && s.ctrlBtnActive]}
          onPress={() => setMicOn((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name={micOn ? "mic" : "mic-off"} size={18} color={micOn ? "#fff" : C.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.ctrlBtn, camOn && s.ctrlBtnActive]}
          onPress={() => setCamOn((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name={camOn ? "videocam" : "videocam-off"} size={18} color={camOn ? "#fff" : C.textSecondary} />
        </TouchableOpacity>
        <View style={s.emojiRow}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity key={emoji} onPress={() => sendEmoji(emoji)} activeOpacity={0.7} style={s.emojiBtn}>
              <Text style={s.emojiBtnText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.ctrlBtnDanger} onPress={() => setScreen("list")} activeOpacity={0.8}>
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 이모지 플로팅 */}
      {floatingEmoji && (
        <Animated.View style={[s.floatingEmoji, { transform: [{ translateY: floatY }], opacity: floatOpacity }]}>
          <Text style={{ fontSize: 28 }}>{floatingEmoji.emoji}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingTop: 56 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: C.textPrimary, fontSize: 14, fontWeight: "700" },
  headerSub:   { color: C.textTertiary, fontSize: 9, letterSpacing: 1.5, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.successSoft, borderWidth: 1, borderColor: C.success + "55", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.success },
  liveText:  { color: C.success, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  roomCountBadge: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  roomCountText:  { color: C.textSecondary, fontSize: 10, fontWeight: "600" },

  // ✅ 코드로 참여 버튼
  codeJoinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.purple + "11", borderWidth: 1, borderColor: C.purple + "44",
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  codeJoinLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  codeJoinIcon:  { width: 40, height: 40, borderRadius: 11, backgroundColor: C.purple + "22", borderWidth: 1, borderColor: C.purple + "44", justifyContent: "center", alignItems: "center" },
  codeJoinTitle: { color: C.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 2 },
  codeJoinSub:   { color: C.textTertiary, fontSize: 11 },

  // 구분선
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.textTertiary, fontSize: 10, fontWeight: "600", letterSpacing: 1 },

  // 방 목록
  roomCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roomCardLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  roomCardRight: { alignItems: "flex-end", gap: 8 },
  roomEmoji: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  roomName:  { color: C.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 3 },
  roomSub:   { color: C.textTertiary, fontSize: 10 },
  miniAvatarRow: { flexDirection: "row", alignItems: "center" },
  miniAvatar:    { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  miniAvatarText: { fontSize: 8, fontWeight: "700" },
  joinBtn:  { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  joinBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  fullTag: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  fullTagText: { color: C.textTertiary, fontSize: 10, fontWeight: "600" },
  createBtn: { borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  createBtnText: { color: C.textTertiary, fontSize: 13, fontWeight: "600" },

  // ✅ 코드 입력 모달
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  modalCard: { width: "100%", backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.borderMid, padding: 22, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.purple + "22", borderWidth: 1, borderColor: C.purple + "44", justifyContent: "center", alignItems: "center" },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  modalTitle:    { color: C.textPrimary, fontSize: 16, fontWeight: "700" },
  modalSubtitle: { color: C.textTertiary, fontSize: 12, lineHeight: 18 },

  // 코드 입력 필드
  codeInputWrap: { gap: 10 },
  codeInput: {
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.borderMid,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: C.textPrimary, fontSize: 22, fontWeight: "600",
    letterSpacing: 6, textAlign: "center", fontVariant: ["tabular-nums"],
  },
  codeDotsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  codeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border, borderWidth: 1, borderColor: C.border },

  // 에러
  errorRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.danger + "11", borderWidth: 1, borderColor: C.danger + "33", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  errorText: { color: C.danger, fontSize: 12, flex: 1 },

  // 힌트
  hintRow: { flexDirection: "row", alignItems: "center" },
  hintText: { color: C.textTertiary, fontSize: 11 },

  // 입장 버튼
  enterBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.purple, borderRadius: 12, paddingVertical: 15 },
  enterBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },

  // 그리드
  gridWrap: { paddingHorizontal: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  camCard: { borderRadius: 14, overflow: "hidden", borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  camCardSpeaking: { borderColor: C.success, shadowColor: C.success, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  camCardMe:       { borderColor: C.accent + "88" },
  camBg: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  camAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  camAvatarText: { fontSize: 20, fontWeight: "700" },
  camOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  micOffBadge: { position: "absolute", top: 7, right: 7, width: 18, height: 18, borderRadius: 9, backgroundColor: "#EF4444CC", justifyContent: "center", alignItems: "center" },
  camInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.6)" },
  camNameRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  camName: { color: C.textPrimary, fontSize: 11, fontWeight: "700", flex: 1 },
  meTag: { backgroundColor: C.accent, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  meTagText: { color: "#fff", fontSize: 7, fontWeight: "700", letterSpacing: 0.5 },
  camSubjectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subjectPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  subjectDot:  { width: 4, height: 4, borderRadius: 2 },
  subjectText: { color: C.textSecondary, fontSize: 9, fontWeight: "600" },
  camTimer:    { color: C.textAccent, fontSize: 10, fontWeight: "600", fontVariant: ["tabular-nums"] },

  timerBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, gap: 8 },
  timerLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  timerValue: { color: C.textPrimary, fontSize: 14, fontWeight: "300", fontVariant: ["tabular-nums"] },
  timerProgressWrap: { flex: 1 },
  timerProgressTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" },
  timerProgressFill:  { height: "100%", backgroundColor: C.accent, borderRadius: 2 },
  timerPct: { color: C.textAccent, fontSize: 11, fontWeight: "700" },

  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10, paddingBottom: 24, gap: 8 },
  ctrlBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  ctrlBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  ctrlBtnDanger: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#7F1D1D", borderWidth: 1, borderColor: "#EF444488", justifyContent: "center", alignItems: "center" },
  emojiRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 6, gap: 2 },
  emojiBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  emojiBtnText: { fontSize: 16 },

  floatingEmoji: { position: "absolute", bottom: 90, left: "50%", marginLeft: -18 },
});