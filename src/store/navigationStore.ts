import { create } from "zustand";
import type { BreadcrumbItem } from "../types/graph";

export type AppView = "explorer" | "departments" | "onedrive" | "settings";

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

  // Desktop sidebar visibility (persisted to localStorage so the user's
  // collapse/expand choice survives reloads). Ignored on mobile.
  desktopSidebarOpen: boolean;

  // Actions
  setSite: (siteId: string, siteName: string, driveId: string) => void;
  navigateTo: (item: BreadcrumbItem) => void;
  navigateToBreadcrumb: (index: number) => void;
  navigateToRoot: () => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: AppView) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setDesktopSidebarOpen: (open: boolean) => void;
  /** Toggle whichever sidebar state matches the current viewport. */
  toggleSidebar: () => void;
  reset: () => void;
}

const DESKTOP_SIDEBAR_KEY = "desktopSidebarOpen";

function readInitialDesktopSidebar(): boolean {
  try {
    const stored = localStorage.getItem(DESKTOP_SIDEBAR_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // localStorage may be unavailable (private mode etc.)
  }
  return true; // Default: visible on first load
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  siteId: null,
  siteName: "",
  driveId: null,
  currentItemId: null,
  breadcrumbs: [],
  searchQuery: "",
  activeView: "explorer",
  mobileSidebarOpen: false,
  desktopSidebarOpen: readInitialDesktopSidebar(),

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

  setDesktopSidebarOpen: (open) => {
    try {
      localStorage.setItem(DESKTOP_SIDEBAR_KEY, String(open));
    } catch {
      // ignore
    }
    set({ desktopSidebarOpen: open });
  },

  toggleSidebar: () => {
    if (isMobileViewport()) {
      set({ mobileSidebarOpen: !get().mobileSidebarOpen });
    } else {
      const next = !get().desktopSidebarOpen;
      try {
        localStorage.setItem(DESKTOP_SIDEBAR_KEY, String(next));
      } catch {
        // ignore
      }
      set({ desktopSidebarOpen: next });
    }
  },

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
      // Don't reset desktopSidebarOpen — it's a UI preference, not session state
    }),
}));
