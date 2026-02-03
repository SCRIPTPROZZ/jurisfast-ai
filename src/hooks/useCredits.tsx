import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Credit costs for different actions - server determines actual costs
export const CREDIT_COSTS = {
  generate_simple: 1,
  legal_review: 2,
  pdf_analysis: 3,
  long_petition: 5,
} as const;

// Plan configurations - these are read-only display values
// Actual credit logic is handled server-side via RPC functions
const PLAN_CREDITS = {
  free: 5,      // per DAY
  basico: 450,  // per MONTH
  basic: 450,   // alias for basico
  pro: 1450,    // per MONTH
  business: 3450, // per MONTH
} as const;

const PLAN_FEATURES = {
  free: {
    historyDays: 1,
    exportWord: false,
    exportPdf: false,
    pdfAnalysis: false,
    templates: false,
    multiUser: false,
    customLogo: false,
    clientOrganization: false,
    priorityGeneration: false,
  },
  basico: {
    historyDays: 7,
    exportWord: false,
    exportPdf: false,
    pdfAnalysis: false,
    templates: false,
    multiUser: false,
    customLogo: false,
    clientOrganization: false,
    priorityGeneration: false,
  },
  pro: {
    historyDays: Infinity,
    exportWord: true,
    exportPdf: true,
    pdfAnalysis: true,
    templates: true,
    multiUser: false,
    customLogo: false,
    clientOrganization: false,
    priorityGeneration: true,
  },
  business: {
    historyDays: Infinity,
    exportWord: true,
    exportPdf: true,
    pdfAnalysis: true,
    templates: true,
    multiUser: true,
    customLogo: true,
    clientOrganization: true,
    priorityGeneration: true,
  },
} as const;

// Generate PLAN_CONFIG from the separate objects
export const PLAN_CONFIG = Object.fromEntries(
  Object.entries(PLAN_FEATURES).map(([plan, features]) => [
    plan,
    {
      credits: PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] ?? 5,
      resetInterval: plan === 'free' ? 'day' : 'month',
      features: {
        generateSimple: true,
        legalReview: true,
        ...features,
      },
    },
  ])
) as Record<string, {
  credits: number;
  resetInterval: string;
  features: {
    generateSimple: boolean;
    legalReview: boolean;
    historyDays: number;
    exportWord: boolean;
    exportPdf: boolean;
    pdfAnalysis: boolean;
    templates: boolean;
    multiUser: boolean;
    customLogo: boolean;
    clientOrganization: boolean;
    priorityGeneration: boolean;
  };
}>;

export type PlanType = 'free' | 'basico' | 'basic' | 'pro' | 'business';
export type ActionType = keyof typeof CREDIT_COSTS;
export type FeatureType = keyof typeof PLAN_FEATURES.free;

export function useCredits() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Recalculate credits on mount/login (server-side check for reset)
  const recalculateCredits = useCallback(async () => {
    if (!user || recalculating) return;
    
    setRecalculating(true);
    try {
      const { data, error } = await supabase.rpc("recalculate_credits", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error recalculating credits:", error);
        return;
      }

      const result = data as { success: boolean; reset_performed?: boolean };
      
      // If a reset was performed, refresh the profile to get new values
      if (result.success && result.reset_performed) {
        await refreshProfile();
      }
    } catch (error) {
      console.error("Error in recalculateCredits:", error);
    } finally {
      setRecalculating(false);
    }
  }, [user, refreshProfile, recalculating]);

  // Call recalculate on mount when user is available
  useEffect(() => {
    if (user && profile) {
      recalculateCredits();
    }
  }, [user?.id]); // Only run when user ID changes (login)

  // Get total credits balance
  const getCreditsBalance = useCallback(() => {
    return profile?.credits_balance ?? profile?.credits ?? 0;
  }, [profile]);

  // Get monthly credits remaining
  const getMonthlyCredits = useCallback(() => {
    return profile?.monthly_credits_limit ?? 0;
  }, [profile]);

  // Get extra credits (purchased)
  const getExtraCredits = useCallback(() => {
    return profile?.extra_credits ?? 0;
  }, [profile]);

  const getPlan = useCallback((): PlanType => {
    const plan = profile?.plan as PlanType;
    // Normalize 'basic' to 'basico' for consistency
    if (plan === 'basic') return 'basico';
    return plan || "free";
  }, [profile]);

  const hasFeature = useCallback((feature: FeatureType): boolean => {
    const plan = getPlan();
    const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
    const featureValue = planConfig?.features?.[feature];
    return typeof featureValue === 'boolean' ? featureValue : featureValue !== undefined;
  }, [getPlan]);

  const canAfford = useCallback((action: ActionType): boolean => {
    const credits = getCreditsBalance();
    const cost = CREDIT_COSTS[action];
    return credits >= cost;
  }, [getCreditsBalance]);

  const debitCredits = async (action: ActionType, description?: string): Promise<boolean> => {
    if (!user) return false;

    const cost = CREDIT_COSTS[action];
    
    if (!canAfford(action)) {
      toast({
        title: "Créditos insuficientes",
        description: `Esta ação requer ${cost} crédito(s). Você tem ${getCreditsBalance()} crédito(s).`,
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("debit_credits", {
        p_user_id: user.id,
        p_credits: cost,
        p_action_type: action,
        p_description: description || null,
      });

      if (error) {
        console.error("Error debiting credits:", error);
        toast({
          title: "Erro ao debitar créditos",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return false;
      }

      const result = data as { 
        success: boolean; 
        error?: string; 
        remaining_credits?: number;
        monthly_remaining?: number;
        extra_remaining?: number;
      };

      if (!result.success) {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível debitar créditos.",
          variant: "destructive",
        });
        return false;
      }

      // Refresh profile to update credits display
      await refreshProfile();

      return true;
    } catch (error) {
      console.error("Error debiting credits:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add extra credits (for purchases)
  const addExtraCredits = async (amount: number, reason?: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("add_extra_credits", {
        p_user_id: user.id,
        p_amount: amount,
        p_reason: reason || 'purchase',
      });

      if (error) {
        console.error("Error adding credits:", error);
        toast({
          title: "Erro ao adicionar créditos",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return false;
      }

      const result = data as { success: boolean; error?: string; credits_balance?: number };

      if (!result.success) {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível adicionar créditos.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Créditos adicionados!",
        description: `+${amount} créditos foram adicionados à sua conta.`,
      });

      await refreshProfile();
      return true;
    } catch (error) {
      console.error("Error adding credits:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Apply plan credits (for plan changes)
  const applyPlanCredits = async (plan: PlanType): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("apply_plan_credits", {
        p_user_id: user.id,
        p_plan: plan,
      });

      if (error) {
        console.error("Error applying plan credits:", error);
        toast({
          title: "Erro ao aplicar plano",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return false;
      }

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível aplicar o plano.",
          variant: "destructive",
        });
        return false;
      }

      await refreshProfile();
      return true;
    } catch (error) {
      console.error("Error applying plan credits:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const hasContentModule = useCallback(() => {
    return profile?.has_content_module ?? false;
  }, [profile]);

  // Get credits reset date
  const getResetDate = useCallback(() => {
    if (!profile?.credits_reset_at) return null;
    return new Date(profile.credits_reset_at);
  }, [profile]);

  // Time until reset (formatted string)
  const getTimeUntilReset = useCallback(() => {
    const resetDate = getResetDate();
    if (!resetDate) return null;
    
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Agora';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
    
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }, [getResetDate]);

  // Get reset label based on plan
  const getResetLabel = useCallback(() => {
    const plan = getPlan();
    return plan === 'free' ? 'Reset diário' : 'Reset mensal';
  }, [getPlan]);

  // Get plan display name
  const getPlanDisplayName = useCallback(() => {
    const plan = getPlan();
    const names: Record<string, string> = {
      free: 'Free',
      basico: 'Básico',
      basic: 'Básico',
      pro: 'Pro',
      business: 'Business',
    };
    return names[plan] || 'Free';
  }, [getPlan]);

  return {
    loading,
    recalculating,
    // Total balance
    credits: getCreditsBalance(),
    creditsBalance: getCreditsBalance(),
    // Breakdown
    monthlyCredits: getMonthlyCredits(),
    extraCredits: getExtraCredits(),
    // Plan info
    plan: getPlan(),
    planConfig: PLAN_CONFIG[getPlan()] || PLAN_CONFIG.free,
    planDisplayName: getPlanDisplayName(),
    // Reset info
    resetDate: getResetDate(),
    timeUntilReset: getTimeUntilReset(),
    resetLabel: getResetLabel(),
    // Feature checks
    hasFeature,
    canAfford,
    // Actions
    debitCredits,
    addExtraCredits,
    applyPlanCredits,
    recalculateCredits,
    hasContentModule,
    // Constants
    creditCosts: CREDIT_COSTS,
    allPlanConfigs: PLAN_CONFIG,
    planCredits: PLAN_CREDITS,
  };
}
