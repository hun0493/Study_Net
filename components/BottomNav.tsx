import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMonoTheme } from "../constants/mono";

export const BOTTOM_NAV_HEIGHT = 70;
export const BOTTOM_NAV_GAP = 12;

type NavKey = "record" | "group" | "home" | "ranking" | "setting";

const navItems: {
  key: NavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/calendar" | "/Group" | "/main" | "/ranking" | "/setting";
}[] = [
  { key: "record", label: "기록", icon: "calendar-outline", route: "/calendar" },
  { key: "group", label: "그룹", icon: "people-outline", route: "/Group" },
  { key: "home", label: "홈", icon: "home-outline", route: "/main" },
  { key: "ranking", label: "랭킹", icon: "trophy-outline", route: "/ranking" },
  { key: "setting", label: "설정", icon: "settings-outline", route: "/setting" },
];

const getActiveKey = (pathname: string): NavKey => {
  if (pathname.includes("Group")) return "group";
  if (pathname.includes("ranking")) return "ranking";
  if (pathname.includes("setting")) return "setting";
  if (pathname.includes("calendar") || pathname.includes("statistics")) return "record";
  return "home";
};

export const getBottomNavSpace = (bottomInset: number) =>
  BOTTOM_NAV_HEIGHT + Math.max(bottomInset, BOTTOM_NAV_GAP) + BOTTOM_NAV_GAP;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useMonoTheme();
  const activeKey = getActiveKey(pathname);
  const bottom = Math.max(insets.bottom, BOTTOM_NAV_GAP);
  const s = createStyles(theme.bg, theme.surface, theme.border, theme.text);

  return (
    <View style={[s.wrap, { bottom }]}>
      {navItems.map((item) => {
        const active = item.key === activeKey;
        const isHome = item.key === "home";

        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              s.item,
              isHome && s.homeItem,
              active && s.itemActive,
              pressed && s.itemPressed,
            ]}
            onPress={() => router.replace(item.route)}
          >
            <Ionicons name={item.icon} size={isHome ? 21 : 19} color={theme.text} />
            <Text style={[s.label, isHome && s.homeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (
  bg: string,
  surface: string,
  border: string,
  text: string,
) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 14,
      right: 14,
      height: BOTTOM_NAV_HEIGHT,
      backgroundColor: bg,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: border,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      zIndex: 50,
    },
    item: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      backgroundColor: surface,
    },
    homeItem: {
      height: 58,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: border,
      marginHorizontal: 4,
      transform: [{ translateY: -8 }],
    },
    itemActive: {
      borderWidth: 1,
      borderBottomWidth: 3,
      borderColor: border,
    },
    itemPressed: {
      transform: [{ translateY: 1 }],
      opacity: 0.76,
    },
    label: {
      color: text,
      fontSize: 10,
      fontWeight: "800",
    },
    homeLabel: {
      fontSize: 11,
      fontWeight: "900",
    },
  });
