import { makeStyles, tokens, TabList, Tab } from "@fluentui/react-components";
import { FolderRegular, BuildingRegular } from "@fluentui/react-icons";
import { SiteSelector } from "../navigation/SiteSelector";
import { FolderTree } from "../navigation/FolderTree";
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
    overflowY: "auto",
    overflowX: "hidden",
  },
  tabs: {
    padding: "8px 8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  tab: {
    fontSize: tokens.fontSizeBase200,
  },
});

export function SidebarPanel() {
  const styles = useStyles();
  const { activeView, setActiveView } = useNavigationStore();

  return (
    <div className={styles.sidebar}>
      {/* View switcher */}
      <div className={styles.tabs}>
        <TabList
          size="small"
          selectedValue={activeView}
          onTabSelect={(_, d) => setActiveView(d.value as AppView)}
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
            Départements
          </Tab>
        </TabList>
      </div>

      {/* Site selector always visible */}
      <SiteSelector />

      {/* Folder tree only in explorer mode */}
      {activeView === "explorer" && <FolderTree />}
    </div>
  );
}
