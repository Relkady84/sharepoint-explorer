import { useEffect } from "react";
import { makeStyles, tokens, mergeClasses, Text } from "@fluentui/react-components";
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
  sidebarCollapsedDesktop: {
    "@media (min-width: 769px)": {
      display: "none",
    },
  },

  // ── Navigation card section ───────────────────────────────────────────────
  navSection: {
    padding: "10px 10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  navLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: tokens.colorNeutralForeground3,
    paddingLeft: "4px",
    marginBottom: "2px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: "pointer",
    userSelect: "none",
    backgroundColor: tokens.colorNeutralBackground1,
    transition: "background 0.12s ease, box-shadow 0.12s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
      boxShadow: tokens.shadow4,
    },
    ":focus-visible": {
      outline: `2px solid ${tokens.colorBrandForeground1}`,
      outlineOffset: "1px",
    },
  },
  navItemActive: {
    // Override the full border shorthand so the colour changes cleanly
    border: `1px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorBrandBackground2,
    ":hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
      boxShadow: tokens.shadow4,
    },
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    flexShrink: 0,
    color: tokens.colorNeutralForeground2,
  },
  navIconActive: {
    color: tokens.colorBrandForeground1,
  },
  navItemLabel: {
    flex: 1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    lineHeight: "1",
  },
  navItemLabelActive: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
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

  return (
    <div
      className={mergeClasses(
        styles.sidebar,
        mobileSidebarOpen && styles.sidebarOpen,
        !desktopSidebarOpen && styles.sidebarCollapsedDesktop
      )}
    >
      {/* View switcher — card-style navigation items */}
      <nav className={styles.navSection} aria-label="Navigation">
        <Text className={styles.navLabel}>Navigation</Text>

        {showExplorer && (
          <div
            role="button"
            tabIndex={0}
            aria-pressed={activeView === "explorer"}
            className={mergeClasses(
              styles.navItem,
              activeView === "explorer" && styles.navItemActive
            )}
            onClick={() => handleTabSelect("explorer")}
            onKeyDown={(e) => e.key === "Enter" && handleTabSelect("explorer")}
          >
            <span className={mergeClasses(
              styles.navIcon,
              activeView === "explorer" && styles.navIconActive
            )}>
              <FolderRegular fontSize={20} />
            </span>
            <Text className={mergeClasses(
              styles.navItemLabel,
              activeView === "explorer" && styles.navItemLabelActive
            )}>
              {t("nav.explorer")}
            </Text>
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeView === "departments"}
          className={mergeClasses(
            styles.navItem,
            activeView === "departments" && styles.navItemActive
          )}
          onClick={() => handleTabSelect("departments")}
          onKeyDown={(e) => e.key === "Enter" && handleTabSelect("departments")}
        >
          <span className={mergeClasses(
            styles.navIcon,
            activeView === "departments" && styles.navIconActive
          )}>
            <BuildingRegular fontSize={20} />
          </span>
          <Text className={mergeClasses(
            styles.navItemLabel,
            activeView === "departments" && styles.navItemLabelActive
          )}>
            {t("nav.shortcuts")}
          </Text>
        </div>

        {showOneDrive && (
          <div
            role="button"
            tabIndex={0}
            aria-pressed={activeView === "onedrive"}
            className={mergeClasses(
              styles.navItem,
              activeView === "onedrive" && styles.navItemActive
            )}
            onClick={() => handleTabSelect("onedrive")}
            onKeyDown={(e) => e.key === "Enter" && handleTabSelect("onedrive")}
          >
            <span className={mergeClasses(
              styles.navIcon,
              activeView === "onedrive" && styles.navIconActive
            )}>
              <Cloud24Filled
                fontSize={20}
                style={{ color: activeView === "onedrive" ? tokens.colorBrandForeground1 : "#0364B8" }}
              />
            </span>
            <Text className={mergeClasses(
              styles.navItemLabel,
              activeView === "onedrive" && styles.navItemLabelActive
            )}>
              {t("nav.onedrive")}
            </Text>
          </div>
        )}
      </nav>

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
