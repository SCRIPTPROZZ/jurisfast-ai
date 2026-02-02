import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  business: Infinity,
};

export function useUsageLimits() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getLimit = () => {
    if (!profile) return PLAN_LIMITS.free;
    return PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free;
  };

  const getCurrentUsage = async (): Promise<number> => {
    if (!user) return 0;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_usage")
      .select("action_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching usage:", error);
      return 0;
    }

    return data?.action_count || 0;
  };

  const canPerformAction = async (): Promise<boolean> => {
    const currentUsage = await getCurrentUsage();
    const limit = getLimit();
    return currentUsage < limit;
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      const currentUsage = await getCurrentUsage();
      const limit = getLimit();

      if (currentUsage >= limit) {
        toast({
          title: "Limite atingido",
          description: `Você atingiu o limite de ${limit} ações diárias do plano ${profile?.plan || "free"}. Faça upgrade para continuar.`,
          variant: "destructive",
        });
        return false;
      }

      // Try to upsert usage
      const { error } = await supabase
        .from("daily_usage")
        .upsert({
          user_id: user.id,
          usage_date: today,
          action_count: currentUsage + 1,
        }, {
          onConflict: "user_id,usage_date",
        });

      if (error) {
        console.error("Error incrementing usage:", error);
        return false;
      }

      return true;
    } finally {
      setLoading(false);
    }
  };

  const getRemainingActions = useCallback(async (): Promise<number> => {
    const currentUsage = await getCurrentUsage();
    const limit = getLimit();
    return Math.max(0, limit - currentUsage);
  }, [user, profile]);

  return {
    loading,
    canPerformAction,
    incrementUsage,
    getRemainingActions,
    getLimit,
    planLimits: PLAN_LIMITS,
  };
}
