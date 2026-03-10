"use client";

import { create } from "zustand";

type CampaignContextState = {
  activeCampaignAddress?: `0x${string}`;
  setActiveCampaignAddress: (address?: `0x${string}`) => void;
  clearActiveCampaignAddress: () => void;
};

export const useCampaignContextStore = create<CampaignContextState>((set) => ({
  activeCampaignAddress: undefined,
  setActiveCampaignAddress: (address) => set({ activeCampaignAddress: address }),
  clearActiveCampaignAddress: () => set({ activeCampaignAddress: undefined }),
}));
