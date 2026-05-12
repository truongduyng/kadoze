import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Purchases, { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '@/components/GradientBackground';

interface PaywallModalProps {
  visible: boolean;
  onResult: (result: typeof PAYWALL_RESULT[keyof typeof PAYWALL_RESULT]) => void;
  offeringIdentifier?: string;
  /** When false, hides close button and blocks Android back-button dismiss. Default: true */
  allowDismiss?: boolean;
}

type PlanKey = 'weekly' | 'monthly' | 'annual';

interface ResolvedPlan {
  key: PlanKey;
  pkg: PurchasesPackage;
  label: string;
  priceStr: string;
  period: string;
  savings?: string;
  trialEligible: boolean;
  introText?: string;
}

const FEATURES = [
  { icon: 'shield-checkmark' as const, text: 'Unlimited Anxiety Blocker' },
  { icon: 'trending-up' as const, text: 'Infinite Process Goals' },
  { icon: 'sparkles' as const, text: 'AI Technique Coach' },
  { icon: 'bar-chart' as const, text: 'Effect Size Visualizer' },
  { icon: 'flash' as const, text: 'All future updates' },
];

export default function PaywallModal({ visible, onResult, offeringIdentifier, allowDismiss = true }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const {
    isConfigured,
    isLoading: isRevenueCatLoading,
    currentOffering,
    restorePurchases,
    refreshCustomerInfo,
    checkTrialEligibility,
  } = useRevenueCat();

  const [plans, setPlans] = useState<ResolvedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isResolvingPlans, setIsResolvingPlans] = useState(true);

  const isReady = isConfigured && !isRevenueCatLoading;

  // Resolve packages into plan cards
  useEffect(() => {
    if (!visible || !isReady) return;

    let cancelled = false;
    setIsResolvingPlans(true);
    setHasError(false);

    (async () => {
      try {
        let offering = currentOffering;

        // If a specific offering is requested, try to fetch it
        if (offeringIdentifier) {
          try {
            const offerings = await Purchases.getOfferings();
            offering = offerings.all[offeringIdentifier] ?? currentOffering;
          } catch {
            // Fall back to current
          }
        }

        if (!offering || !offering.availablePackages.length) {
          if (!cancelled) setHasError(true);
          return;
        }

        // Map packages by type
        const pkgMap: Partial<Record<PlanKey, PurchasesPackage>> = {};
        for (const pkg of offering.availablePackages) {
          if (pkg.packageType === PACKAGE_TYPE.WEEKLY) pkgMap.weekly = pkg;
          else if (pkg.packageType === PACKAGE_TYPE.MONTHLY) pkgMap.monthly = pkg;
          else if (pkg.packageType === PACKAGE_TYPE.ANNUAL) pkgMap.annual = pkg;
        }

        // Check trial eligibility for all products
        const productIds = Object.values(pkgMap).map(p => p.product.identifier);
        const eligibility = await checkTrialEligibility(productIds);

        // Build resolved plans
        const resolved: ResolvedPlan[] = [];

        // Calculate weekly equivalent prices for savings display
        const weeklyPrice = pkgMap.weekly?.product.price ?? 0;

        if (pkgMap.weekly) {
          resolved.push({
            key: 'weekly',
            pkg: pkgMap.weekly,
            label: 'Weekly',
            priceStr: pkgMap.weekly.product.priceString,
            period: '/week',
            trialEligible: eligibility[pkgMap.weekly.product.identifier] ?? false,
          });
        }

        if (pkgMap.monthly) {
          const monthlyWeeklyEquiv = pkgMap.monthly.product.price / 4.33;
          const savingsPct = weeklyPrice > 0 ? Math.round((1 - monthlyWeeklyEquiv / weeklyPrice) * 100) : 0;
          resolved.push({
            key: 'monthly',
            pkg: pkgMap.monthly,
            label: 'Monthly',
            priceStr: pkgMap.monthly.product.priceString,
            period: '/month',
            savings: savingsPct > 0 ? `Save ${savingsPct}%` : undefined,
            trialEligible: eligibility[pkgMap.monthly.product.identifier] ?? false,
          });
        }

        if (pkgMap.annual) {
          const annualWeeklyEquiv = pkgMap.annual.product.price / 52;
          const savingsPct = weeklyPrice > 0 ? Math.round((1 - annualWeeklyEquiv / weeklyPrice) * 100) : 0;
          const isTrialEligible = eligibility[pkgMap.annual.product.identifier] ?? false;
          const introPrice = pkgMap.annual.product.introPrice;

          resolved.push({
            key: 'annual',
            pkg: pkgMap.annual,
            label: 'Yearly',
            priceStr: pkgMap.annual.product.priceString,
            period: '/year',
            savings: savingsPct > 0 ? `Save ${savingsPct}%` : undefined,
            trialEligible: isTrialEligible,
            introText: isTrialEligible && introPrice
              ? `${introPrice.periodNumberOfUnits}-${introPrice.periodUnit === 'DAY' ? 'day' : introPrice.periodUnit === 'WEEK' ? 'week' : 'month'} free trial`
              : undefined,
          });
        }

        if (!cancelled) {
          setPlans(resolved);
          // Default to annual if available, otherwise first plan
          setSelectedPlan(pkgMap.annual ? 'annual' : (resolved[0]?.key ?? 'monthly'));
          setIsResolvingPlans(false);
        }
      } catch (error) {
        console.error('Error resolving plans:', error);
        if (!cancelled) {
          setHasError(true);
          setIsResolvingPlans(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [visible, isReady, offeringIdentifier, currentOffering]);

  const handlePurchase = async () => {
    const plan = plans.find(p => p.key === selectedPlan);
    if (!plan) return;

    setIsPurchasing(true);
    try {
      await Purchases.purchasePackage(plan.pkg);
      await refreshCustomerInfo();
      onResult(PAYWALL_RESULT.PURCHASED);
    } catch (error: any) {
      if (error?.userCancelled) {
        // User cancelled — don't show error
      } else {
        console.error('Purchase error:', error);
        onResult(PAYWALL_RESULT.ERROR);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const info = await restorePurchases();
      if (info && info.entitlements?.active?.['Full Access']) {
        onResult(PAYWALL_RESULT.RESTORED);
      }
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const activePlan = plans.find(p => p.key === selectedPlan);
  const showTrialBanner = activePlan?.trialEligible && activePlan?.introText;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={allowDismiss ? () => onResult(PAYWALL_RESULT.CANCELLED) : undefined}
    >
      <View style={styles.container}>
        <GradientBackground />

        {/* Close button — hidden when dismiss is disallowed */}
        {allowDismiss && (
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 12 }]}
            onPress={() => onResult(PAYWALL_RESULT.CANCELLED)}
            hitSlop={16}
          >
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}

        {!isReady || isResolvingPlans ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : hasError || plans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={styles.errorText}>Unable to load subscription plans</Text>
            <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.proIconWrap}>
                <Ionicons name="star" size={28} color="#FFD700" />
              </View>
              <Text style={styles.title}>Unlock Your{'\n'}Full Potential</Text>
              <Text style={styles.subtitle}>
                Get unlimited access to every feature
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {FEATURES.map(({ icon, text }) => (
                <View key={text} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={icon} size={16} color="#FFD700" />
                  </View>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Trial banner */}
            {showTrialBanner && (
              <View style={styles.trialBanner}>
                <Ionicons name="gift-outline" size={18} color="#4CAF50" />
                <Text style={styles.trialBannerText}>
                  Start your {activePlan.introText} — cancel anytime
                </Text>
              </View>
            )}

            {/* Plan cards */}
            <View style={styles.plansContainer}>
              {plans.map((plan) => {
                const isSelected = plan.key === selectedPlan;
                const isBestValue = plan.key === 'annual';
                return (
                  <TouchableOpacity
                    key={plan.key}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => setSelectedPlan(plan.key)}
                    activeOpacity={0.8}
                  >
                    {isBestValue && (
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                      </View>
                    )}
                    <View style={styles.planRadio}>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <View style={styles.planInfo}>
                      <View style={styles.planLabelRow}>
                        <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                          {plan.label}
                        </Text>
                        {plan.savings && (
                          <View style={styles.savingsBadge}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                          </View>
                        )}
                      </View>
                      {plan.trialEligible && plan.introText ? (
                        <Text style={styles.planTrialText}>{plan.introText}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {plan.priceStr}
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* No charge reassurance */}
            {showTrialBanner && (
              <View style={styles.reassurance}>
                <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={styles.reassuranceText}>
                  You won't be charged today. Cancel anytime before the trial ends.
                </Text>
              </View>
            )}

            {/* CTA button */}
            <TouchableOpacity
              style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
              onPress={handlePurchase}
              disabled={isPurchasing || isRestoring}
              activeOpacity={0.85}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <Text style={styles.ctaText}>
                  {showTrialBanner ? 'Start Free Trial' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isRestoring || isPurchasing}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Text style={styles.legalText}>
              Payment will be charged to your account at confirmation of purchase.
              Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
            </Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  errorText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  proIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  trialBannerText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  plansContainer: {
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  bestValueText: {
    color: '#1a1a1a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planRadio: {
    marginRight: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FFD700',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  planInfo: {
    flex: 1,
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  planLabelSelected: {
    color: '#fff',
  },
  savingsBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '700',
  },
  planTrialText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  planPrice: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '700',
  },
  planPriceSelected: {
    color: '#fff',
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  reassuranceText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#1a1a1a',
    fontSize: 17,
    fontWeight: '800',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  restoreText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '500',
  },
  legalText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
