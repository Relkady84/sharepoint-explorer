import { makeStyles, tokens } from "@fluentui/react-components";
import { TopBar } from "./TopBar";
import { SidebarPanel } from "./SidebarPanel";
import { FileListPanel } from "../files/FileListPanel";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: "hidden",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

export function AppShell() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <TopBar />
      <div className={styles.body}>
        <SidebarPanel />
        <main className={styles.main}>
          <FileListPanel />
        </main>
      </div>
    </div>
  );
}
