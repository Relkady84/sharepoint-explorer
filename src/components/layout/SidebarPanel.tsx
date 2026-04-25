import { makeStyles, tokens, mergeClasses, TabList, Tab } from "@fluentui/react-components";
import { FolderRegular, BuildingRegular, Cloud24Filled } from "@fluentui/react-icons";
import { SiteSelector } from "../navigation/SiteSelector";
import { FolderTree } from "../navigation/FolderTree";
import { QuickLinks } from "./QuickLinks";
import { useNavigationStore } from "../../store/navigationStore";
import type { AppView } from "../../store/navigationStore";

const useStyles = makeStyles({
  sidebar: {
    display: "flex",
    flexDirection: "column",
    width: "260px",
    flexShrink: 0,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: "hidden",
    // Mobile: become an off-canvas drawer
    "@media (max-width: 768px)": {
      position: "fixed",
      top: "52px", // below TopBar
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
  const { activeView, setActiveView, mobileSidebarOpen, setMobileSidebarOpen } =
    useNavigationStore();

  const handleTabSelect = (view: AppView) => {
    setActiveView(view);
    // On mobile, close the drawer after picking a view so the user sees the content.
    // No-op on desktop (drawer state unused there).
    setMobileSidebarOpen(false);
  };

  return (
    <div className={mergeClasses(styles.sidebar, mobileSidebarOpen && styles.sidebarOpen)}>
      {/* View switcher */}
      <div className={styles.tabs}>
        <TabList
          size="small"
          selectedValue={activeView}
          onTabSelect={(_, d) => handleTabSelect(d.value as AppView)}
        >
          <Tab
            value="explorer"
            icon={<FolderRegular />}
            className={styles.tab}
          >
            Explorer
          </Tab>
          <Tab
            value="departments"
            icon={<BuildingRegular />}
            className={styles.tab}
          >
            Mes raccourcis
          </Tab>
          <Tab
            value="onedrive"
            icon={<Cloud24Filled style={{ color: "#0364B8" }} />}
            className={styles.tab}
          >
            OneDrive
          </Tab>
        </TabList>
      </div>

      {/* Scrollable middle: site picker + (in explorer) folder tree.
          Hidden on OneDrive view since shared files are tenant-wide, not per site. */}
      <div className={styles.scrollArea}>
        {activeView !== "onedrive" && <SiteSelector />}
        {activeView === "explorer" && <FolderTree />}
      </div>

      {/* Quick links — pinned at bottom, always visible */}
      <QuickLinks />
    </div>
  );
}
