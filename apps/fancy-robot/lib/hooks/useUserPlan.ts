"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface UserPlan {
  plan: "free" | "pro";
  billingInterval: "monthly" | "annual" | null;
  loading: boolean;
}

export function useUserPlan(): UserPlan {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual" | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const fetchPlan = async () => {
      const { data } = await supabase
        .schema("fancyrobot")
        .from("profiles")
        .select("plan, billing_interval")
        .eq("id", user.id)
        .single();
      if (data) {
        setPlan((data.plan as "free" | "pro") || "free");
        setBillingInterval(data.billing_interval as "monthly" | "annual" | null);
      }
      setFetched(true);
    };
    fetchPlan();
  }, [user]);

  const loading = useMemo(() => {
    if (authLoading) return true;
    if (!user) return false;
    return !fetched;
  }, [authLoading, user, fetched]);

  return { plan, billingInterval, loading };
}
