import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import GradientBackground from "@/components/GradientBackground";
import PaywallStep from "@/components/onboarding/PaywallStep";
import ProgressBar from "@/components/onboarding/ProgressBar";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  DEFAULT_KEYSTONE_HABITS,
  KEYSTONE_HABITS_BY_FOCUS,
  STEPS,
  TOTAL,
  trackOnboardingEvent,
  useOnboarding,
  type KeystoneHabit,
} from "@/hooks/useOnboarding";

const ORANGE = "#FF7A1A";
const SOFT_ORANGE = "#FFB36B";

const PAIN_FOCUS_META = {
  mindset: { label: "Mindset", icon: "person-outline" },
  work: { label: "Work", icon: "briefcase-outline" },
  health: { label: "Health", icon: "star-outline" },
  relations: { label: "Relationships", icon: "heart-outline" },
  creative: { label: "Creativity", icon: "sparkles-outline" },
  finance: { label: "Money", icon: "cash-outline" },
} satisfies Record<string, { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }>;
const PAIN_FOCUS_ORDER = ["mindset", "work", "health", "relations", "creative", "finance"] as const;

const PAIN_MAPPINGS = [
  {
    focus: "mindset",
    pain: "My mind won't stop racing",
    habitId: "journal",
    reason: "Gets thoughts out of your head and onto paper",
  },
  {
    focus: "work",
    pain: "I start strong, then fall off",
    habitId: "plan",
    reason: "A nightly plan makes tomorrow easier to follow through on",
  },
  {
    focus: "work",
    pain: "I lose hours to my phone",
    habitId: "nophone",
    reason: "Keeps your first hour phone-free and intentional",
  },
  {
    focus: "health",
    pain: "I'm exhausted before the day begins",
    habitId: "walk",
    reason: "10 minutes outside resets your energy and nervous system",
  },
  {
    focus: "work",
    pain: "I have ideas but never execute",
    habitId: "mit",
    reason: "Forces you to name the one thing that actually matters",
  },
  {
    focus: "mindset",
    pain: "I've tried every app and nothing sticks",
    habitId: "quiet",
    reason: "5 minutes of stillness beats another complicated system",
  },
  {
    focus: "health",
    pain: "My body feels stiff and low-energy",
    habitId: "stretch",
    reason: "A tiny morning stretch tells your body the day has started",
  },
  {
    focus: "health",
    pain: "I keep sleeping later than I want",
    habitId: "sleep",
    reason: "A clear lights-out habit protects tomorrow's focus",
  },
  {
    focus: "health",
    pain: "I forget basic self-care",
    habitId: "water",
    reason: "Hydration is a small physical win you can repeat daily",
  },
  {
    focus: "mindset",
    pain: "I focus on what's wrong all day",
    habitId: "gratitude",
    reason: "A gratitude rep trains your attention toward what's working",
  },
  {
    focus: "mindset",
    pain: "I want to grow but keep scrolling instead",
    habitId: "read",
    reason: "10 pages gives your attention somewhere worth going",
  },
  {
    focus: "work",
    pain: "My workday is reactive",
    habitId: "pomodoro",
    reason: "One focused sprint creates a protected pocket of deep work",
  },
  {
    focus: "relations",
    pain: "I feel disconnected from people",
    habitId: "connect",
    reason: "One genuine message keeps relationships warm without pressure",
  },
  {
    focus: "relations",
    pain: "I'm present physically, but not mentally",
    habitId: "offline",
    reason: "Phone-free meals create a small daily pocket of presence",
  },
  {
    focus: "relations",
    pain: "I listen to reply, not understand",
    habitId: "listen",
    reason: "Practicing listening makes your conversations feel calmer",
  },
  {
    focus: "creative",
    pain: "My creativity keeps getting postponed",
    habitId: "create",
    reason: "Even 10 minutes of making keeps the creative signal alive",
  },
  {
    focus: "creative",
    pain: "Good ideas disappear before I use them",
    habitId: "capture",
    reason: "Capturing one idea a day builds trust with your imagination",
  },
  {
    focus: "finance",
    pain: "My money feels vague and stressful",
    habitId: "review",
    reason: "A spending review turns vague stress into visible choices",
  },
  {
    focus: "finance",
    pain: "I spend before I think",
    habitId: "save",
    reason: "Saving first makes the better choice automatic",
  },
  {
    focus: "finance",
    pain: "I avoid looking at my finances",
    habitId: "track",
    reason: "Tracking one goal gives your money a clear direction",
  },
] satisfies {
  focus: keyof typeof PAIN_FOCUS_META;
  pain: string;
  habitId: string;
  reason: string;
}[];
const PAIN_POINTS = PAIN_MAPPINGS.map((item) => item.pain);
const PAIN_POINT_SET = new Set(PAIN_POINTS);
const PAIN_SECTIONS = PAIN_FOCUS_ORDER.map((focus) => ({
  focus,
  ...PAIN_FOCUS_META[focus],
  items: PAIN_MAPPINGS.filter((item) => item.focus === focus),
}));
const PAIN_TO_HABIT = PAIN_MAPPINGS.reduce<Record<string, { id: string; reason: string }>>(
  (acc, item) => {
    acc[item.pain] = { id: item.habitId, reason: item.reason };
    return acc;
  },
  {},
);

const FAST_WINS = [
  {
    icon: "sunny-outline" as const,
    title: "In 7 days",
    lines: ["Clearer focus", "Fewer distractions", "Daily momentum"],
  },
  {
    icon: "calendar-outline" as const,
    title: "In 30 days",
    lines: ["Visible consistency", "Stronger routines", "Calmer mind"],
  },
  {
    icon: "flag-outline" as const,
    title: "In 90 days",
    lines: ["Identity shift", "Deep work habit", "Self-trust"],
  },
];

const TRUST_AVATARS = [
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=56",
];

const TRUST_REVIEWS = [
  {
    name: "Maya",
    role: "Founder",
    avatar: "https://i.pravatar.cc/96?img=5",
    text: "It helped me stop turning every thought into a giant to-do list.",
  },
  {
    name: "Daniel",
    role: "Designer",
    avatar: "https://i.pravatar.cc/96?img=15",
    text: "The capture, focus, reflect loop feels calm enough to actually stick with.",
  },
  {
    name: "Anika",
    role: "Student",
    avatar: "https://i.pravatar.cc/96?img=44",
    text: "I use it when my day feels noisy. It gets me back to one clear next step.",
  },
];

export default function OnboardingScreen() {
  const C = useTheme();
  const s = makeStyles(C);
  const {
    currentStep,
    fadeAnim,
    painPoints,
    setPainPoints,
    mainGoal,
    setMainGoal,
    keystoneHabit,
    setKeystoneHabit,
    goNext,
    goBack,
    showBack,
    completeOnboarding,
  } = useOnboarding();

  const step = STEPS[currentStep];

  useEffect(() => {
    const validPainPoints = painPoints.filter((pain) => PAIN_POINT_SET.has(pain));
    if (validPainPoints.length !== painPoints.length) {
      setPainPoints(validPainPoints);
    }
  }, [painPoints, setPainPoints]);

  const advance = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goNext();
  };

  const togglePain = (pain: string) => {
    setPainPoints((current) => {
      const validCurrent = current.filter((item) => PAIN_POINT_SET.has(item));
      const exists = validCurrent.includes(pain);
      const next = exists
        ? validCurrent.filter((item) => item !== pain)
        : validCurrent.length < 3
          ? [...validCurrent, pain]
          : validCurrent;
      if (!exists && next.includes(pain)) {
        trackOnboardingEvent("pain_selected", { pain, count: next.length });
      }
      return next;
    });
  };

  const selectHabit = (habit: KeystoneHabit) => {
    setKeystoneHabit(habit.id);
    trackOnboardingEvent("habit_selected", { habit: habit.id });
    void Haptics.selectionAsync();
  };

  const renderStep = () => {
    switch (step.type) {
      case "hook":
        return <HookScreen onNext={advance} />;
      case "pain":
        return (
          <PainScreen
            selected={painPoints}
            onToggle={togglePain}
            onNext={advance}
          />
        );
      case "future":
        return <FutureScreen onNext={advance} />;
      case "identity":
        return <IdentityScreen onNext={advance} />;
      case "wins":
        return <FastWinsScreen onNext={advance} />;
      case "system":
        return <SystemScreen onNext={advance} />;
      case "trust":
        return <TrustScreen onNext={advance} />;
      case "goal":
        return (
          <GoalInputScreen
            value={mainGoal}
            onChange={(value) => {
              setMainGoal(value);
              if (value.trim().length >= 10) {
                trackOnboardingEvent("goal_created", { length: value.trim().length });
              }
            }}
            onNext={advance}
          />
        );
      case "keystone":
        return (
          <KeystoneScreen
            selected={keystoneHabit}
            onSelect={selectHabit}
            onNext={advance}
            painPoints={painPoints}
          />
        );
      case "preview":
        return <PreviewScreen onNext={advance} />;
      case "personalization":
        return (
          <PersonalizationScreen
            goal={mainGoal}
            habitId={keystoneHabit}
            painPoints={painPoints}
            onNext={advance}
          />
        );
      case "paywall":
        return <PaywallStep onComplete={completeOnboarding} />;
    }
  };

  return (
    <View style={s.container}>
      <GradientBackground variant="onboarding" />

      <SafeAreaView style={s.safeArea}>
        <View style={s.progressRow}>
          {showBack ? (
            <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
              <Ionicons name="chevron-back" size={22} color={palette.white70} />
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}
          <View style={s.progressTrack}>
            <ProgressBar step={currentStep + 1} total={TOTAL} compact />
          </View>
        </View>

        <Animated.View style={[s.flex, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function ScreenShell({
  children,
  cta = "Continue",
  disabled = false,
  onNext,
  scroll = false,
  stickyFooter = false,
  dismissesKeyboard = false,
}: {
  children: React.ReactNode;
  cta?: string;
  disabled?: boolean;
  onNext: () => void;
  scroll?: boolean;
  stickyFooter?: boolean;
  dismissesKeyboard?: boolean;
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const content = (
    <Pressable style={s.screenContent} onPress={dismissesKeyboard ? Keyboard.dismiss : undefined}>
      {children}
    </Pressable>
  );
  const footer = (
    <TouchableOpacity
      style={[s.primaryButton, disabled && s.primaryButtonDisabled]}
      onPress={disabled ? undefined : onNext}
      disabled={disabled}
      activeOpacity={0.86}
    >
      <Text style={[s.primaryButtonText, disabled && s.primaryButtonTextDisabled]}>
        {cta}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[s.screen, stickyFooter && s.screenSticky]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={s.flex}
        >
          {children}
        </ScrollView>
      ) : (
        content
      )}
      {stickyFooter ? (
        <KeyboardStickyView offset={{ closed: 0, opened: 46 }}>
          {footer}
        </KeyboardStickyView>
      ) : (
        footer
      )}
    </View>
  );
}

function HookScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext}>
      <View style={s.heroVisual}>
        <View style={s.heroGlow} />
        <View style={s.heroCloudOne} />
        <View style={s.heroCloudTwo} />
        {["Messages", "Tasks", "Ideas", "Meetings", "To-dos"].map((tag, index) => (
          <FloatingTag key={tag} label={tag} index={index} />
        ))}
        <View style={s.hillBack} />
        <View style={s.hillFront} />
        <View style={s.sun} />
      </View>
      <View style={s.copyBlock}>
        <Text style={s.headline}>Your mind was never meant to manage everything at once.</Text>
        <Text style={s.body}>Kadoze helps you focus on fewer things - consistently.</Text>
      </View>
    </ScreenShell>
  );
}

function FloatingTag({ label, index }: { label: string; index: number }) {
  const C = useTheme();
  const s = makeStyles(C);
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 3400 + index * 360,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 3400 + index * 360,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [drift, index]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 ? -6 : 6] });
  const positions = [
    { top: 26, left: 58 },
    { top: 78, left: 18 },
    { top: 132, left: 38 },
    { top: 104, right: 38 },
    { top: 158, right: 68 },
  ];

  return (
    <Animated.View
      style={[s.floatingTag, positions[index], { transform: [{ translateX }, { translateY }] }]}
    >
      <View style={s.tagDot} />
      <Text style={s.floatingTagText}>{label}</Text>
    </Animated.View>
  );
}

function PainScreen({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (pain: string) => void;
  onNext: () => void;
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const [hiddenSections, setHiddenSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (focus: string) => {
    setHiddenSections((current) => ({
      ...current,
      [focus]: !current[focus],
    }));
  };

  return (
    <ScreenShell onNext={onNext} disabled={selected.length === 0} scroll>
      <View style={s.painIntro}>
        <View style={s.painIntroCopy}>
          <Text style={s.headline}>What feels hardest right now?</Text>
          <Text style={s.body}>Choose up to three. We&apos;ll turn them into a small starting system.</Text>
        </View>
      </View>
      <View style={s.painSectionList}>
        {PAIN_SECTIONS.map((section) => (
          <View key={section.focus} style={s.painSection}>
            <Pressable
              style={s.painSectionHeader}
              onPress={() => toggleSection(section.focus)}
              hitSlop={6}
            >
              <View style={s.painSectionTitleWrap}>
                <Ionicons name={section.icon} size={14} color={SOFT_ORANGE} />
                <Text style={s.painSectionTitle}>{section.label}</Text>
              </View>
              <View style={s.painSectionToggle}>
                <Ionicons
                  name={hiddenSections[section.focus] ? "chevron-down" : "chevron-up"}
                  size={17}
                  color={SOFT_ORANGE}
                />
              </View>
            </Pressable>
            {!hiddenSections[section.focus] && (
              <View style={s.painChoiceList}>
                {section.items.map(({ pain }) => {
                  const active = selected.includes(pain);
                  const locked = selected.length >= 3 && !active;
                  return (
                    <Pressable
                      key={pain}
                      onPress={() => onToggle(pain)}
                      disabled={locked}
                      style={[s.painChoice, active && s.painChoiceActive, locked && s.dimmed]}
                    >
                      <Text style={[s.painChoiceText, active && s.painChoiceTextActive]}>
                        {pain}
                      </Text>
                      <Ionicons
                        name={active ? "checkmark-circle" : "ellipse-outline"}
                        size={20}
                        color={active ? ORANGE : palette.white25}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

function FutureScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext}>
      <View style={[s.copyBlock, s.futureCopy]}>
        <Text style={s.headline}>Imagine 30 days of small consistent progress.</Text>
        <Text style={s.body}>Not hustle.{"\n"}Not motivation.{"\n"}Just sustainable momentum.</Text>
      </View>
      <ChartCard />
    </ScreenShell>
  );
}

function IdentityScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext}>
      <View style={s.identityTop}>
        <View style={s.copyBlock}>
          <Text style={s.headline}>Kadoze is designed for quiet achievers.</Text>
          <Text style={s.body}>
            People who want clarity, discipline, and deep focus - without burnout.
          </Text>
        </View>
      </View>
      <View style={s.identityScene}>
        <Svg width="100%" height="100%" viewBox="0 0 360 250" style={s.identitySceneSvg}>
          <Defs>
            <RadialGradient
              id="identityGlow"
              cx="180"
              cy="102"
              r="122"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={ORANGE} stopOpacity="0.38" />
              <Stop offset="0.42" stopColor={ORANGE} stopOpacity="0.16" />
              <Stop offset="0.78" stopColor={ORANGE} stopOpacity="0.03" />
              <Stop offset="1" stopColor={ORANGE} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="360" height="250" fill="url(#identityGlow)" />
          <Circle cx="180" cy="102" r="52" fill={ORANGE} />
          <Path
            d="M0 142 C46 128 88 132 132 143 C176 154 218 166 262 164 C303 162 333 151 360 139 L360 250 L0 250 Z"
            fill="#050505"
          />
        </Svg>
      </View>
    </ScreenShell>
  );
}

function FastWinsScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext} scroll>
      <View style={s.copyBlock}>
        <Text style={s.headline}>Small steps.{"\n"}Big transformation.</Text>
        <Text style={s.body}>Here&apos;s what&apos;s possible.</Text>
      </View>
      <View style={s.cardList}>
        {FAST_WINS.map((win) => (
          <View key={win.title} style={s.timelineCard}>
            <View style={s.timelineIcon}>
              <Ionicons name={win.icon} size={24} color={SOFT_ORANGE} />
            </View>
            <View style={s.flex}>
              <Text style={s.cardTitle}>{win.title}</Text>
              {win.lines.map((line) => (
                <Text key={line} style={s.smallLine}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

function SystemScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext}>
      <View style={s.copyBlock}>
        <Text style={s.headline}>A simple system that works.</Text>
        <Text style={s.body}>Capture, focus, reflect.{"\n"}Repeat.</Text>
      </View>
      <View style={s.orbitWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 330 330" style={s.orbitSvg}>
          <Path
            d="M62 214 C58 141 89 82 127 62"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M111 64 L129 61 L121 78"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M203 62 C241 78 265 113 273 154"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M257 142 L274 157 L280 134"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M236 241 C189 270 139 271 94 244"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M106 262 L91 243 L115 239"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
        <FlowNode
          kind="capture"
          number="01"
          title="Capture"
          sub={"Clear your mind\nand get it out."}
          style={s.nodeTop}
        />
        <FlowNode
          kind="focus"
          number="02"
          title="Focus"
          sub={"Do what matters.\nDistraction-free."}
          style={s.nodeLeft}
        />
        <FlowNode
          kind="reflect"
          number="03"
          title="Reflect"
          sub={"Learn, improve,\nand grow."}
          style={s.nodeRight}
        />
      </View>
    </ScreenShell>
  );
}

function FlowNode({
  kind,
  number,
  title,
  sub,
  style,
}: {
  kind: "capture" | "focus" | "reflect";
  number: string;
  title: string;
  sub: string;
  style: object;
}) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <View style={[s.flowNode, style]}>
      <View style={s.flowIcon}>
        <FlowGlyph kind={kind} />
      </View>
      <Text style={s.flowNumber}>{number}</Text>
      <Text style={s.flowTitle}>{title}</Text>
      <Text style={s.flowSub}>{sub}</Text>
    </View>
  );
}

function FlowGlyph({ kind }: { kind: "capture" | "focus" | "reflect" }) {
  if (kind === "capture") {
    return (
      <Svg width={42} height={42} viewBox="0 0 64 64">
        <Path
          d="M32 10 V35"
          stroke={ORANGE}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M21 25 L32 36 L43 25"
          stroke={ORANGE}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M16 36 H26 C27.8 36 29 39 32 39 C35 39 36.2 36 38 36 H48 L52 50 H12 Z"
          stroke="rgba(255,255,255,0.86)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }

  if (kind === "focus") {
    return (
      <Svg width={42} height={42} viewBox="0 0 64 64">
        <Circle cx="32" cy="32" r="24" stroke="rgba(255,255,255,0.78)" strokeWidth="4" fill="none" />
        <Circle cx="32" cy="32" r="15" stroke="rgba(255,179,107,0.72)" strokeWidth="3" fill="none" />
        <Circle cx="32" cy="32" r="11" fill={ORANGE} />
      </Svg>
    );
  }

  return (
    <Svg width={42} height={42} viewBox="0 0 64 64">
      <Path d="M32 8 A24 24 0 0 1 56 32 H32 Z" fill="#FFF9EF" />
      <Path d="M56 32 A24 24 0 0 1 43 53 L32 32 Z" fill={ORANGE} />
      <Path d="M43 53 A24 24 0 1 1 32 8" stroke="rgba(255,255,255,0.84)" strokeWidth="4" fill="none" />
      <Path d="M32 8 V32 H56" stroke="#050505" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M32 32 L43 53" stroke="#050505" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function TrustScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext} scroll>
      <View style={s.ratingRow}>
        <View style={s.avatarStack}>
          {TRUST_AVATARS.map((avatar, index) => (
            <Image
              key={avatar}
              source={{ uri: avatar }}
              style={[s.avatarImage, { marginLeft: index === 0 ? 0 : -8 }]}
            />
          ))}
        </View>
        <View style={s.starRow}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Ionicons key={index} name="star" size={14} color={ORANGE} />
          ))}
        </View>
        <Text style={s.ratingText}>4.9/5</Text>
      </View>
      <View style={s.copyBlock}>
        <Text style={s.headline}>Most users feel calmer within the first week.</Text>
      </View>
      <View style={s.statsRow}>
        {[
          ["87%", "More focused daily"],
          ["91%", "Stay consistent longer"],
          ["89%", "Feel less overwhelmed"],
        ].map(([value, label]) => (
          <View key={value} style={s.statCard}>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={s.reviewList}>
        {TRUST_REVIEWS.map((review) => (
          <View key={review.name} style={s.reviewCard}>
            <View style={s.reviewHeader}>
              <Image source={{ uri: review.avatar }} style={s.reviewAvatar} />
              <View style={s.flex}>
                <Text style={s.reviewName}>{review.name}</Text>
                <Text style={s.reviewRole}>{review.role}</Text>
              </View>
              <View style={s.reviewStars}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <Ionicons key={index} name="star" size={11} color={ORANGE} />
                ))}
              </View>
            </View>
            <Text style={s.reviewText}>{review.text}</Text>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

function GoalInputScreen({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const inputRef = useRef<TextInput>(null);
  const canContinue = value.trim().length >= 10;

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.keyboard}>
      <ScreenShell onNext={onNext} disabled={!canContinue} stickyFooter dismissesKeyboard>
        <View style={s.copyBlock}>
          <Text style={s.headline}>What would make today feel meaningful?</Text>
          <Text style={s.body}>Your answer becomes your first focus.</Text>
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="Type your answer..."
          placeholderTextColor={palette.white35}
          multiline
          style={s.goalInput}
          selectionColor={ORANGE}
        />
      </ScreenShell>
    </View>
  );
}

function KeystoneScreen({
  selected,
  onSelect,
  onNext,
  painPoints,
}: {
  selected: string;
  onSelect: (habit: KeystoneHabit) => void;
  onNext: () => void;
  painPoints: string[];
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const allHabits = [...Object.values(KEYSTONE_HABITS_BY_FOCUS).flat(), ...DEFAULT_KEYSTONE_HABITS];
  const seen = new Set<string>();
  const mappedHabits = painPoints.reduce<(KeystoneHabit & { reason?: string })[]>((acc, pain) => {
    const mapping = PAIN_TO_HABIT[pain];
    if (!mapping || seen.has(mapping.id)) return acc;
    const habit = allHabits.find((h) => h.id === mapping.id);
    if (!habit) return acc;
    seen.add(mapping.id);
    return [...acc, { ...habit, reason: mapping.reason }];
  }, []);
  const habits: (KeystoneHabit & { reason?: string })[] = mappedHabits.length > 0
    ? mappedHabits
    : DEFAULT_KEYSTONE_HABITS;
  return (
    <ScreenShell onNext={onNext} disabled={!selected} scroll>
      <View style={s.copyBlock}>
        <Text style={s.headline}>One habit to fix this</Text>
        {painPoints.length > 0 && (
          <View style={s.painReminder}>
            {painPoints.map((pain) => (
              <View key={pain} style={s.painTag}>
                <Ionicons name="alert-circle-outline" size={12} color={SOFT_ORANGE} />
                <Text style={s.painTagText}>{pain}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={s.body}>Pick the one that feels most honest.</Text>
      </View>
      <View style={s.cardList}>
        {habits.map((habit) => {
          const active = selected === habit.id;
          const dim = Boolean(selected) && !active;
          return (
            <Pressable
              key={habit.id}
              onPress={() => onSelect(habit)}
              style={[s.habitCard, active && s.habitCardActive, dim && s.dimmed]}
            >
              <View style={[s.habitIconWrap, active && s.habitIconWrapActive]}>
                <Ionicons name={habit.icon} size={22} color={active ? ORANGE : palette.white70} />
              </View>
              <View style={s.flex}>
                <Text style={[s.habitTitle, active && s.habitTitleActive]}>{habit.title}</Text>
                <Text style={s.habitSubtitle}>{habit.reason ?? habit.subtitle}</Text>
              </View>
              <Ionicons
                name={active ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={active ? ORANGE : palette.white25}
              />
            </Pressable>
          );
        })}
      </View>
    </ScreenShell>
  );
}

function PreviewScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext}>
      <View style={s.copyBlock}>
        <Text style={s.headline}>Watch your consistency compound.</Text>
        <Text style={s.body}>Track your progress and see your momentum grow.</Text>
      </View>
      <View style={s.previewCard}>
        <View>
          <Text style={s.previewLabel}>Focus Hours</Text>
          <Text style={s.previewValue}>21.4h</Text>
          <Text style={s.greenText}>+43% vs last week</Text>
        </View>
        <BarChart />
      </View>
      <View style={s.previewCard}>
        <View style={s.previewHeader}>
          <Text style={s.previewLabel}>Consistency</Text>
          <Text style={s.streakText}>12 day streak</Text>
        </View>
        <View style={s.weekDots}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <View key={`${day}-${index}`} style={s.dayWrap}>
              <View style={s.dayDot}>
                <Ionicons name="checkmark" size={11} color="#fff" />
              </View>
              <Text style={s.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
}

function PersonalizationScreen({
  goal,
  habitId,
  painPoints,
  onNext,
}: {
  goal: string;
  habitId: string;
  painPoints: string[];
  onNext: () => void;
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const allHabits = [...Object.values(KEYSTONE_HABITS_BY_FOCUS).flat(), ...DEFAULT_KEYSTONE_HABITS];
  const habit = allHabits.find((item) => item.id === habitId);
  const focusStyle = painPoints.some((pain) =>
    [
      "I lose hours to my phone",
      "My workday is reactive",
      "I have ideas but never execute",
    ].includes(pain),
  )
    ? "Deep & structured"
    : "Calm & steady";
  const duration = goal.length > 42 ? "25-40 min" : "15-25 min";
  const summaryRows: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    value: string;
  }[] = [
    { icon: "time-outline", label: "Ideal focus duration", value: duration },
    { icon: "sunny-outline", label: "Best time to focus", value: "Morning" },
    { icon: "navigate-circle-outline", label: "Focus style", value: focusStyle },
    { icon: "heart-outline", label: "Recommended habit", value: habit?.title ?? "1-2 active" },
  ];

  return (
    <ScreenShell onNext={onNext}>
      <View style={s.copyBlock}>
        <Text style={s.headline}>Your focus system is ready.</Text>
        <Text style={s.body}>We&apos;ve personalized Kadoze for you.</Text>
      </View>
      <View style={s.cardList}>
        {summaryRows.map(({ icon, label, value }) => (
          <View key={label} style={s.summaryCard}>
            <View style={s.miniIcon}>
              <Ionicons name={icon} size={18} color={SOFT_ORANGE} />
            </View>
            <View style={s.flex}>
              <Text style={s.summaryLabel}>{label}</Text>
              <Text style={s.summaryValue}>{value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

function ChartCard() {
  const C = useTheme();
  const s = makeStyles(C);
  const points = [
    { x: 30, y: 144 },
    { x: 62, y: 132 },
    { x: 94, y: 121 },
    { x: 126, y: 105 },
    { x: 158, y: 84 },
    { x: 194, y: 69 },
    { x: 232, y: 50 },
    { x: 270, y: 22 },
  ];
  const curvePath =
    "M30 144 C44 139 49 135 62 132 C76 128 82 125 94 121 C108 116 114 111 126 105 C140 96 146 90 158 84 C174 76 181 73 194 69 C211 62 219 55 232 50 C249 42 259 32 270 22";
  const areaPath = `${curvePath} L270 160 L30 160 Z`;

  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>Your momentum grows</Text>
      <Svg width="100%" height={190} viewBox="0 0 300 190">
        <Defs>
          <LinearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ORANGE} stopOpacity="0.26" />
            <Stop offset="1" stopColor={ORANGE} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {[54, 88, 122, 156].map((y) => (
          <Line
            key={`h-${y}`}
            x1="28"
            x2="276"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.045)"
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Line
            key={`v-${i}`}
            x1={30 + i * 35}
            x2={30 + i * 35}
            y1="24"
            y2="160"
            stroke="rgba(255,255,255,0.035)"
          />
        ))}
        {points.map((point) => (
          <Line
            key={`stem-${point.x}`}
            x1={point.x}
            x2={point.x}
            y1={point.y + 7}
            y2="160"
            stroke="rgba(255,122,26,0.22)"
            strokeWidth="1"
          />
        ))}
        <Path d={areaPath} fill="url(#momentumFill)" />
        <Path
          d={curvePath}
          fill="none"
          stroke={ORANGE}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <Circle
            key={`dot-${point.x}`}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 6 : 4.3}
            fill={index === points.length - 1 ? ORANGE : SOFT_ORANGE}
            stroke="rgba(255,255,255,0.82)"
            strokeWidth={index === points.length - 1 ? 1.4 : 0.8}
          />
        ))}
      </Svg>
      <View style={s.chartAxis}>
        <Text style={s.axisLabel}>Day 1</Text>
        <Text style={s.axisLabel}>Day 15</Text>
        <Text style={s.axisLabel}>Day 30</Text>
      </View>
    </View>
  );
}

function BarChart() {
  return (
    <Svg width={118} height={82} viewBox="0 0 118 82">
      {[20, 34, 46, 58, 72].map((height, index) => (
        <Rect
          key={height}
          x={12 + index * 20}
          y={78 - height}
          width="10"
          height={height}
          rx="4"
          fill={index < 2 ? "rgba(255,122,26,0.42)" : ORANGE}
        />
      ))}
    </Svg>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#050505",
    },
    safeArea: {
      flex: 1,
      zIndex: 10,
    },
    flex: {
      flex: 1,
    },
    progressRow: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    progressTrack: {
      flex: 1,
    },
    screen: {
      flex: 1,
      paddingHorizontal: 22,
      paddingBottom: 24,
      justifyContent: "space-between",
      gap: 18,
    },
    screenSticky: {
      justifyContent: "flex-start",
    },
    screenContent: {
      flex: 1,
      justifyContent: "flex-start",
      gap: 26,
      paddingTop: 24,
    },
    scrollContent: {
      paddingTop: 24,
      paddingBottom: 24,
      gap: 20,
    },
    copyBlock: {
      gap: 12,
    },
    headline: {
      color: "#fff",
      fontSize: 30,
      lineHeight: 34,
      fontWeight: "800",
    },
    body: {
      color: palette.white75,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "500",
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 8,
      backgroundColor: C.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      shadowColor: C.accent,
      shadowOpacity: 0.24,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    primaryButtonDisabled: {
      backgroundColor: C.accentBgSubtle,
      borderColor: C.accentBorderSubtle,
      shadowOpacity: 0,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    primaryButtonTextDisabled: {
      color: C.textTertiary,
    },
    heroVisual: {
      height: 292,
      overflow: "hidden",
      borderRadius: 8,
      backgroundColor: "rgba(255,255,255,0.01)",
    },
    heroGlow: {
      position: "absolute",
      top: 42,
      alignSelf: "center",
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: "rgba(255,249,230,0.24)",
      shadowColor: "#FFF3D7",
      shadowOpacity: 0.44,
      shadowRadius: 46,
    },
    heroCloudOne: {
      position: "absolute",
      top: 78,
      right: 38,
      width: 92,
      height: 30,
      borderRadius: 15,
      backgroundColor: "rgba(255,255,255,0.09)",
      transform: [{ rotate: "3deg" }],
    },
    heroCloudTwo: {
      position: "absolute",
      top: 138,
      left: 64,
      width: 86,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.055)",
      transform: [{ rotate: "-7deg" }],
    },
    hillBack: {
      position: "absolute",
      bottom: 24,
      left: -72,
      width: 330,
      height: 132,
      borderTopLeftRadius: 220,
      borderTopRightRadius: 220,
      backgroundColor: "#060606",
      transform: [{ rotate: "8deg" }],
    },
    hillFront: {
      position: "absolute",
      bottom: -20,
      right: -90,
      width: 390,
      height: 162,
      borderTopLeftRadius: 260,
      borderTopRightRadius: 260,
      backgroundColor: "#050505",
      transform: [{ rotate: "-7deg" }],
    },
    sun: {
      position: "absolute",
      bottom: 42,
      alignSelf: "center",
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: ORANGE,
      shadowColor: ORANGE,
      shadowOpacity: 0.55,
      shadowRadius: 34,
    },
    floatingTag: {
      position: "absolute",
      zIndex: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.86)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    tagDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: SOFT_ORANGE,
    },
    floatingTagText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },
    cardList: {
      gap: 10,
    },
    painIntro: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    painIntroCopy: {
      flex: 1,
      gap: 12,
    },
    painSectionList: {
      gap: 18,
      paddingBottom: 4,
    },
    painSection: {
      gap: 9,
    },
    painSectionHeader: {
      minHeight: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
    },
    painSectionTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    painSectionTitle: {
      color: palette.white70,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    painSectionToggle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,179,107,0.10)",
      borderWidth: 1,
      borderColor: "rgba(255,179,107,0.18)",
    },
    painChoiceList: {
      gap: 8,
    },
    painChoice: {
      minHeight: 48,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    painChoiceActive: {
      backgroundColor: "rgba(255,122,26,0.14)",
      borderColor: "rgba(255,122,26,0.44)",
      shadowColor: ORANGE,
      shadowOpacity: 0.16,
      shadowRadius: 14,
    },
    painChoiceText: {
      flex: 1,
      color: palette.white80,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    painChoiceTextActive: {
      color: "#fff",
    },
    choiceCard: {
      minHeight: 54,
      borderRadius: 8,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    choiceCardActive: {
      backgroundColor: "rgba(255,122,26,0.14)",
      borderColor: "rgba(255,122,26,0.44)",
      shadowColor: ORANGE,
      shadowOpacity: 0.2,
      shadowRadius: 18,
    },
    dimmed: {
      opacity: 0.45,
    },
    choiceText: {
      flex: 1,
      color: "#fff",
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "700",
    },
    chartCard: {
      borderRadius: 8,
      padding: 18,
      minHeight: 248,
      backgroundColor: "#111111",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.07)",
      justifyContent: "space-between",
    },
    futureCopy: {
      marginTop: 10,
    },
    chartTitle: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "800",
    },
    chartAxis: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    axisLabel: {
      color: palette.white35,
      fontSize: 11,
      fontWeight: "700",
    },
    identityTop: {
      gap: 0,
      paddingTop: 20,
    },
    identityScene: {
      height: 320,
      overflow: "hidden",
      marginTop: -12,
      marginBottom: "auto",
      marginHorizontal: -22,
    },
    identitySceneSvg: {
      ...StyleSheet.absoluteFillObject,
    },
    timelineCard: {
      minHeight: 94,
      borderRadius: 8,
      padding: 16,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    timelineIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,122,26,0.10)",
    },
    cardTitle: {
      color: SOFT_ORANGE,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 3,
    },
    smallLine: {
      color: palette.white70,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    orbitWrap: {
      height: 360,
      marginTop: 0,
      marginHorizontal: -8,
      justifyContent: "center",
    },
    orbitSvg: {
      ...StyleSheet.absoluteFillObject,
    },
    flowNode: {
      position: "absolute",
      alignItems: "center",
      width: 132,
    },
    nodeTop: {
      top: 0,
      alignSelf: "center",
    },
    nodeLeft: {
      bottom: 0,
      left: 0,
    },
    nodeRight: {
      bottom: 0,
      right: 0,
    },
    flowIcon: {
      width: 74,
      height: 74,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#050505",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.10)",
      marginBottom: 14,
    },
    flowNumber: {
      color: ORANGE,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "800",
      marginBottom: 6,
    },
    flowTitle: {
      color: "#fff",
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 10,
    },
    flowSub: {
      color: palette.white55,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700",
      textAlign: "center",
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatarStack: {
      flexDirection: "row",
    },
    avatarImage: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.7)",
    },
    starRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    ratingText: {
      color: palette.white70,
      fontSize: 12,
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
    },
    statCard: {
      flex: 1,
      minHeight: 118,
      borderRadius: 8,
      padding: 13,
      justifyContent: "center",
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
      gap: 8,
    },
    statValue: {
      color: SOFT_ORANGE,
      fontSize: 24,
      fontWeight: "800",
    },
    statLabel: {
      color: palette.white70,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700",
    },
    reviewList: {
      gap: 10,
      paddingBottom: 2,
    },
    reviewCard: {
      borderRadius: 8,
      padding: 14,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
      gap: 10,
    },
    reviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    reviewAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    reviewName: {
      color: "#fff",
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "800",
    },
    reviewRole: {
      color: palette.white45,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700",
    },
    reviewStars: {
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
    },
    reviewText: {
      color: palette.white70,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },
    keyboard: {
      flex: 1,
    },
    goalInput: {
      minHeight: 78,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 16,
      color: "#fff",
      fontSize: 15,
      lineHeight: 21,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
      textAlignVertical: "top",
    },
    miniIcon: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    previewCard: {
      borderRadius: 8,
      padding: 18,
      minHeight: 120,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    previewLabel: {
      color: palette.white55,
      fontSize: 12,
      fontWeight: "700",
    },
    previewValue: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "800",
      marginTop: 10,
    },
    greenText: {
      color: "#83E28A",
      fontSize: 12,
      fontWeight: "700",
      marginTop: 6,
    },
    previewHeader: {
      gap: 8,
    },
    streakText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
    weekDots: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    dayWrap: {
      alignItems: "center",
      gap: 6,
    },
    dayDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: ORANGE,
      alignItems: "center",
      justifyContent: "center",
    },
    dayLabel: {
      color: palette.white55,
      fontSize: 10,
      fontWeight: "700",
    },
    summaryCard: {
      minHeight: 70,
      borderRadius: 8,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "#141414",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    summaryLabel: {
      color: palette.white55,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 3,
    },
    summaryValue: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "800",
    },
    choiceReason: {
      color: palette.white45,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2,
    },
    painReminder: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    painTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: "rgba(255,179,107,0.10)",
      borderWidth: 1,
      borderColor: "rgba(255,179,107,0.25)",
    },
    painTagText: {
      color: SOFT_ORANGE,
      fontSize: 11,
      fontWeight: "700",
    },
    habitCard: {
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: "#141414",
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.06)",
    },
    habitCardActive: {
      backgroundColor: "rgba(255,122,26,0.10)",
      borderColor: "rgba(255,122,26,0.5)",
    },
    habitIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    habitIconWrapActive: {
      backgroundColor: "rgba(255,122,26,0.15)",
    },
    habitTitle: {
      color: palette.white70,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 3,
    },
    habitTitleActive: {
      color: "#fff",
    },
    habitSubtitle: {
      color: palette.white45,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 17,
    },
  });
}
