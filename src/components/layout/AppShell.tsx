import { useEffect } from "react";
import { makeStyles, tokens, mergeClasses } from "@fluentui/react-components";
import { TopBar } from "./TopBar";
import { SidebarPanel } from "./SidebarPanel";
import { FileListPanel } from "../files/FileListPanel";
import { DepartmentsPage } from "../departments/DepartmentsPage";
import { OneDrivePage } from "../onedrive/OneDrivePage";
import { SettingsPage } from "../settings/SettingsPage";
import { useNavigationStore } from "../../store/navigationStore";
import { useSites } from "../../hooks/useSites";
import { useAuth } from "../../auth/useAuth";
import { getSiteDrive } from "../../api/sitesApi";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh", // fallback
    // dvh accounts for mobile browser chrome (address bar) so content isn't cropped
    "@supports (height: 100dvh)": {
      height: "100dvh",
    },
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: "hidden",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    position: "relative", // anchor for the mobile backdrop
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: 0, // allow shrinking below content size on narrow screens
  },
  backdrop: {
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      zIndex: 90,
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 0.2s ease",
    },
  },
  backdropOpen: {
    "@media (max-width: 768px)": {
      opacity: 1,
      pointerEvents: "auto",
    },
  },
});

export function AppShell() {
  const styles = useStyles();
  const { activeView, mobileSidebarOpen, setMobileSidebarOpen, siteId, setSite } = useNavigationStore();
  const { data: sites } = useSites();
  const { getToken } = useAuth();

  // Auto-select the first available SharePoint site when no site is persisted yet.
  // This ensures non-admin users on a fresh device get settings loaded immediately
  // instead of seeing all tabs until they manually open the site selector.
  useEffect(() => {
    if (siteId || !sites || sites.length === 0) return;
    const first = sites[0];
    (async () => {
      try {
        const token = await getToken();
        const drive = await getSiteDrive(token, first.id);
        setSite(first.id, first.displayName, drive.id);
      } catch (err) {
        console.warn("Auto-site selection failed:", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, sites]);

  return (
    <div className={styles.root}>
      <TopBar />
      <div className={styles.body}>
        <SidebarPanel />
        <main className={styles.main}>
          {activeView === "departments" ? (
            <DepartmentsPage />
          ) : activeView === "onedrive" ? (
            <OneDrivePage />
          ) : activeView === "settings" ? (
            <SettingsPage />
          ) : (
            <FileListPanel />
          )}
        </main>
        {/* Backdrop for the mobile sidebar drawer */}
        <div
          className={mergeClasses(styles.backdrop, mobileSidebarOpen && styles.backdropOpen)}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
