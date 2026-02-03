import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Credit costs for different actions
export const CREDIT_COSTS = {
  generate_simple: 1,      // Geração simples de peça
  legal_review: 2,         // Revisão jurídica
  pdf_analysis: 3,         // Análise de PDF
  long_petition: 5,        // Petição longa
} as const;

// Plan configurations
export const PLAN_CONFIG = {
  free: {
    monthlyCredits: 5, // Daily, but we'll track it
    features: {
      generateSimple: true,
      legalReview: true,
      historyDays: 1,
      exportWord: false,
      exportPdf: false,
      pdfAnalysis: false,
      templates: false,
      multiUser: false,
      customLogo: false,
      clientOrganization: false,
      priorityGeneration: false,
    }
  },
  basico: {
    monthlyCredits: 450,
    features: {
      generateSimple: true,
      legalReview: true,
      historyDays: 7,
      exportWord: false,
      exportPdf: false,
      pdfAnalysis: false,
      templates: false,
      multiUser: false,
      customLogo: false,
      clientOrganization: false,
      priorityGeneration: false,
    }
  },
  pro: {
    monthlyCredits: 1450,
    features: {
      generateSimple: true,
      legalReview: true,
      historyDays: Infinity,
      exportWord: true,
      exportPdf: true,
      pdfAnalysis: true,
      templates: true,
      multiUser: false,
      customLogo: false,
      clientOrganization: false,
      priorityGeneration: true,
    }
  },
  business: {
    monthlyCredits: 3450,
    features: {
      generateSimple: true,
      legalReview: true,
      historyDays: Infinity,
      exportWord: true,
      exportPdf: true,
      pdfAnalysis: true,
      templates: true,
      multiUser: true,
      customLogo: true,
      clientOrganization: true,
      priorityGeneration: true,
    }
  },
};

export type PlanType = keyof typeof PLAN_CONFIG;
export type ActionType = keyof typeof CREDIT_COSTS;
export type FeatureType = keyof typeof PLAN_CONFIG.free.features;

export function useCredits() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getCredits = useCallback(() => {
    return profile?.credits ?? 0;
  }, [profile]);

  const getPlan = useCallback((): PlanType => {
    return (profile?.plan as PlanType) || "free";
  }, [profile]);

  const hasFeature = useCallback((feature: FeatureType): boolean => {
    const plan = getPlan();
    const featureValue = PLAN_CONFIG[plan]?.features[feature];
    return typeof featureValue === 'boolean' ? featureValue : featureValue !== undefined;
  }, [getPlan]);

  const canAfford = useCallback((action: ActionType): boolean => {
    const credits = getCredits();
    const cost = CREDIT_COSTS[action];
    return credits >= cost;
  }, [getCredits]);

  const debitCredits = async (action: ActionType, description?: string): Promise<boolean> => {
    if (!user) return false;

    const cost = CREDIT_COSTS[action];
    
    if (!canAfford(action)) {
      toast({
        title: "Créditos insuficientes",
        description: `Esta ação requer ${cost} crédito(s). Você tem ${getCredits()} crédito(s).`,
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

      const result = data as { success: boolean; error?: string; remaining_credits?: number };

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

  const hasContentModule = useCallback(() => {
    return profile?.has_content_module ?? false;
  }, [profile]);

  return {
    loading,
    credits: getCredits(),
    plan: getPlan(),
    hasFeature,
    canAfford,
    debitCredits,
    hasContentModule,
    creditCosts: CREDIT_COSTS,
    planConfig: PLAN_CONFIG,
  };
}
