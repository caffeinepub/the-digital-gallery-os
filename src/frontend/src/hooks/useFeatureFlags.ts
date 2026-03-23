import { useState } from "react";

export interface FeatureFlags {
  khatabook: boolean;
  inventory: boolean;
  suppliers: boolean;
  reports: boolean;
  lowStockAlert: boolean;
  alertEnabled: boolean;
}

const STORAGE_KEY = "dg_feature_flags";

const DEFAULT_FLAGS: FeatureFlags = {
  khatabook: true,
  inventory: true,
  suppliers: true,
  reports: true,
  lowStockAlert: false,
  alertEnabled: false,
};

export function getFeatureFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FLAGS;
    return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function saveFeatureFlags(flags: FeatureFlags): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags);

  const updateFlag = (key: keyof FeatureFlags, value: boolean) => {
    const updated = { ...flags, [key]: value };
    setFlags(updated);
    saveFeatureFlags(updated);
  };

  return { flags, updateFlag };
}
