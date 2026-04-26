import { useEffect } from "react";
import { makeStyles, tokens, mergeClasses, TabList, Tab } from "@fluentui/react-components";
import { FolderRegular, BuildingRegular, Cloud24Filled } from "@fluentui/react-icons";
import { SiteSelector } from "../navigation/SiteSelector";
import { FolderTree } from "../navigation/FolderTree";
import { QuickLinks } from "./QuickLinks";
import { useNavigationStore } from "../../store/navigationStore";
import type { AppView } from "../../store/navigationStore";
import { useIsAdmin } from "../../hooks/useAppPins";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useTranslation } from "../../i18n/useTranslation";

const useStyles = makeStyles({
  sidebar: {
    display: "flex",
    flexDirection: "column",
    width: "260px",
    flexShrink: 0,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: "hidden",
    "@media (max-width: 768px)": {
      position: "fixed",
      top: "52px",
      left: 0,
      bottom: 0,
      width: "min(280px, 80vw)",
      zIndex: 100,
      transform: "translateX(-100%)",
      transition: "transform 0.2s ease",
      boxShadow: "0 0 12px rgba(0,0,0,0.15)",
    },
  },
  sidebarOpen: {
    "@media (max-width: 768px)": {
      transform: "translateX(0)",
    },
  },
  // Desktop only: collapsed = hidden entirely, freeing all the room for content
  sidebarCollapsedDesktop: {
    "@media (min-width: 769px)": {
      display: "none",
    },
  },
  tabs: {
    padding: "8px 8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  tab: {
    fontSize: tokens.fontSizeBase200,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
  },
});

export function SidebarPanel() {
  const styles = useStyles();
  const { t } = useTranslation();
  const {
    activeView,
    setActiveView,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    desktopSidebarOpen,
  } = useNavigationStore();
  const isAdmin = useIsAdmin();
  const { settings } = useAppSettings();

  // Visibility rules:
  //  - Admins always see every primary tab.
  //  - Non-admins see Explorer / OneDrive only when their respective toggles are on.
  //  - "Mes raccourcis" is always visible (the curated experience).
  //  - "Settings" is reached from the user dropdown, not the sidebar — kept off this list.
  const showExplorer = isAdmin || settings.explorerEnabled;
  const showOneDrive = isAdmin || settings.oneDriveEnabled;

  // If the current view has been hidden by a settings flip, fall back to a visible one.
  useEffect(() => {
    if (activeView === "explorer" && !showExplorer) {
      setActiveView("departments");
    } else if (activeView === "onedrive" && !showOneDrive) {
      setActiveView("departments");
    }
  }, [activeView, showExplorer, showOneDrive, setActiveView]);

  const handleTabSelect = (view: AppView) => {
    setActiveView(view);
    // Close mobile drawer after picking a view (no-op on desktop)
    setMobileSidebarOpen(false);
  };

  // The TabList ignores a selectedValue that has no matching child.
  // When activeView is "settings", none of the sidebar tabs should look selected,
  // so we pass undefined in that case.
  const sidebarSelected =
    activeView === "settings" ? undefined : (activeView as string);

  return (
    <div
      className={mergeClasses(
        styles.sidebar,
        mobileSidebarOpen && styles.sidebarOpen,
        !desktopSidebarOpen && styles.sidebarCollapsedDesktop
      )}
    >
      {/* View switcher */}
      <div className={styles.tabs}>
        <TabList
          size="small"
          selectedValue={sidebarSelected}
          onTabSelect={(_, d) => handleTabSelect(d.value as AppView)}
        >
          {showExplorer && (
            <Tab value="explorer" icon={<FolderRegular />} className={styles.tab}>
              {t("nav.explorer")}
            </Tab>
          )}
          <Tab value="departments" icon={<BuildingRegular />} className={styles.tab}>
            {t("nav.shortcuts")}
          </Tab>
          {showOneDrive && (
            <Tab
              value="onedrive"
              icon={<Cloud24Filled style={{ color: "#0364B8" }} />}
              className={styles.tab}
            >
              {t("nav.onedrive")}
            </Tab>
          )}
        </TabList>
      </div>

      {/* Scrollable middle: site picker + (in explorer) folder tree.
          Hidden on OneDrive/Settings views since those don't depend on a SharePoint site. */}
      <div className={styles.scrollArea}>
        {activeView !== "onedrive" && activeView !== "settings" && <SiteSelector />}
        {activeView === "explorer" && <FolderTree />}
      </div>

      {/* Quick links — pinned at bottom, always visible */}
      <QuickLinks />
    </div>
  );
}
