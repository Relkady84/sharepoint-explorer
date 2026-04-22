import { makeStyles, tokens } from "@fluentui/react-components";
import { SiteSelector } from "../navigation/SiteSelector";
import { FolderTree } from "../navigation/FolderTree";

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
});

export function SidebarPanel() {
  const styles = useStyles();

  return (
    <div className={styles.sidebar}>
      <SiteSelector />
      <FolderTree />
    </div>
  );
}
