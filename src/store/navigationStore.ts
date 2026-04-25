import { create } from "zustand";
import type { BreadcrumbItem } from "../types/graph";

export type AppView = "explorer" | "departments" | "onedrive";

interface NavigationState {
  // Current site
  siteId: string | null;
  siteName: string;
  driveId: string | null;

  // Current folder (null = root)
  currentItemId: string | null;

  // Breadcrumb trail
  breadcrumbs: BreadcrumbItem[];

  // Search query
  searchQuery: string;

  // Active view
  activeView: AppView;

  // Mobile sidebar drawer (false on desktop — sidebar is always inline there)
  mobileSidebarOpen: boolean;

  // Actions
  setSite: (siteId: string, siteName: string, driveId: string) => void;
  navigateTo: (item: BreadcrumbItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  navigateToRoot: () => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: AppView) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  siteId: null,
  siteName: "",
  driveId: null,
  currentItemId: null,
  breadcrumbs: [],
  searchQuery: "",
  activeView: "explorer",
  mobileSidebarOpen: false,

  setSite: (siteId, siteName, driveId) =>
    set({
      siteId,
      siteName,
      driveId,
      currentItemId: null,
      breadcrumbs: [],
      searchQuery: "",
    }),

  navigateTo: (item) =>
    set((state) => ({
      currentItemId: item.id,
      driveId: item.driveId,
      breadcrumbs: [...state.breadcrumbs, item],
      searchQuery: "",
    })),

  navigateToBreadcrumb: (index) =>
    set((state) => ({
      currentItemId: state.breadcrumbs[index].id,
      breadcrumbs: state.breadcrumbs.slice(0, index + 1),
      searchQuery: "",
    })),

  navigateToRoot: () =>
    set((state) => ({
      currentItemId: null,
      breadcrumbs: [],
      searchQuery: "",
      // Preserve siteId and driveId
      siteId: state.siteId,
      driveId: state.driveId,
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveView: (view) => set({ activeView: view }),

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  reset: () =>
    set({
      siteId: null,
      siteName: "",
      driveId: null,
      currentItemId: null,
      breadcrumbs: [],
      searchQuery: "",
      activeView: "explorer",
      mobileSidebarOpen: false,
    }),
}));
