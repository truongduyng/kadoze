import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CustomerInfo } from 'react-native-purchases';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import PaywallModal from '@/components/chat/PaywallModal';
import { useRevenueCat } from '@/hooks/useRevenueCat';

interface SubscriptionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  customerInfo: CustomerInfo | null;
}

export default function SubscriptionDetailModal({
  visible,
  onClose,
  customerInfo,
}: SubscriptionDetailModalProps) {
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const { refreshCustomerInfo } = useRevenueCat();

  // Get subscription details
  const entitlement = customerInfo?.entitlements?.active?.['Full Access'];
  const isPro = !!entitlement;
  const expirationDate = entitlement?.expirationDate;
  const willRenew = entitlement?.willRenew ?? false;
  const periodType = entitlement?.periodType;
  const productIdentifier = entitlement?.productIdentifier;

  // Format expiration date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={40} style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.proBadge, !isPro && styles.freeBadge]}>
                <Ionicons name={isPro ? "star" : "person"} size={20} color={isPro ? "#FFD700" : "rgba(255,255,255,0.7)"} />
                <Text style={[styles.proBadgeText, !isPro && styles.freeBadgeText]}>{isPro ? "Pro Member" : "Free Plan"}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent}>
              {/* Subscription Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subscription Status</Text>
                {isPro ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <View style={styles.activeIndicator}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>Active</Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Plan Type</Text>
                      <Text style={styles.infoValue}>
                        {periodType === 'NORMAL'
                          ? 'Monthly'
                          : periodType === 'ANNUAL'
                          ? 'Annual'
                          : periodType === 'TRIAL'
                          ? 'Trial'
                          : periodType === 'WEEKLY'
                          ? 'Weekly'
                          : 'Unknown'}
                      </Text>
                    </View>
                    {expirationDate && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                          {willRenew ? 'Renews On' : 'Expires On'}
                        </Text>
                        <Text style={styles.infoValue}>
                          {formatDate(expirationDate)}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Plan</Text>
                    <Text style={styles.infoValue}>Free</Text>
                  </View>
                )}
              </View>

              {/* Features */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pro Features</Text>
                {[
                  { icon: 'shield-checkmark-outline', text: 'Unlimited Anxiety Blocker' },
                  { icon: 'trending-up-outline', text: 'Infinite Process Goals' },
                  { icon: 'sparkles-outline', text: 'AI Technique Coach: Real-time course correction' },
                  { icon: 'bar-chart-outline', text: 'Effect Size Visualizer' },
                  { icon: 'flash-outline', text: 'All future updates included' },
                  { icon: 'heart-outline', text: 'Support indie development' },
                ].map(({ icon, text }) => (
                  <View key={text} style={styles.featureItem}>
                    <Ionicons name={icon as any} size={20} color="#FFD700" />
                    <Text style={styles.featureText}>{text}</Text>
                  </View>
                ))}
              </View>

              {/* Upgrade CTA for free users */}
              {!isPro && (
                <View style={styles.upgradeSection}>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => setIsPaywallVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="star" size={18} color="#1a1a1a" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </BlurView>

      <PaywallModal
        visible={isPaywallVisible}
        onResult={async (result) => {
          setIsPaywallVisible(false);
          if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
            await refreshCustomerInfo();
            onClose();
          }
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  proBadgeText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  freeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  freeBadgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  freeDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  freeText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 500,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
  },
  infoValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  activeText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  debugText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  upgradeSection: {
    padding: 20,
    paddingTop: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
});
