import {
  makeStyles,
  tokens,
  Text,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
} from "@fluentui/react-components";
import {
  SignOut20Regular,
  Person20Regular,
  LineHorizontal3Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../auth/useAuth";
import { useNavigationStore } from "../../store/navigationStore";
import { SearchBar } from "../search/SearchBar";

const useStyles = makeStyles({
  topBar: {
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    height: "52px",
    backgroundColor: tokens.colorBrandBackground,
    gap: "16px",
    flexShrink: 0,
    "@media (max-width: 600px)": {
      gap: "8px",
      padding: "0 8px",
    },
  },
  hamburger: {
    display: "none",
    color: tokens.colorNeutralForegroundOnBrand,
    "@media (max-width: 768px)": {
      display: "inline-flex",
    },
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  logoIcon: {
    width: "28px",
    height: "28px",
  },
  appName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForegroundOnBrand,
    whiteSpace: "nowrap",
    "@media (max-width: 600px)": {
      display: "none",
    },
  },
  spacer: {
    flex: 1,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  userName: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForegroundOnBrand,
    "@media (max-width: 600px)": {
      display: "none",
    },
  },
});

function SharePointLogoWhite() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="20" r="8" fill="white" fillOpacity="0.9" />
      <circle cx="17" cy="20" r="5" fill={tokens.colorBrandBackground} />
      <rect x="22" y="15" width="12" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
      <rect x="22" y="19" width="10" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
      <rect x="22" y="23" width="8" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

export function TopBar() {
  const styles = useStyles();
  const { displayName, email, logout } = useAuth();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useNavigationStore();

  return (
    <div className={styles.topBar}>
      <Button
        appearance="subtle"
        icon={<LineHorizontal3Regular />}
        className={styles.hamburger}
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        aria-label="Ouvrir le menu"
        aria-expanded={mobileSidebarOpen}
        style={{ color: "inherit" }}
      />
      <div className={styles.logo}>
        <SharePointLogoWhite />
        <Text className={styles.appName}>SharePoint Explorer</Text>
      </div>

      <div className={styles.spacer} />

      <SearchBar />

      <div className={styles.userSection}>
        <Text className={styles.userName}>{displayName}</Text>
        <Menu>
          <MenuTrigger>
            <Button
              appearance="subtle"
              style={{ padding: 0, minWidth: "auto", color: "inherit" }}
              aria-label="User menu"
            >
              <Avatar
                name={displayName}
                size={32}
                color="colorful"
              />
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Person20Regular />} disabled>
                <div>
                  <div style={{ fontWeight: 600 }}>{displayName}</div>
                  <div style={{ fontSize: "12px", color: tokens.colorNeutralForeground3 }}>
                    {email}
                  </div>
                </div>
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<SignOut20Regular />} onClick={logout}>
                Sign out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </div>
  );
}
