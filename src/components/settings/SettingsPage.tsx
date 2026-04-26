import {
  makeStyles,
  tokens,
  Text,
  Switch,
  Radio,
  RadioGroup,
  Spinner,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Checkbox,
} from "@fluentui/react-components";
import { Settings24Regular, CheckmarkCircle20Filled } from "@fluentui/react-icons";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useIsAdmin } from "../../hooks/useAppPins";
import { useTranslation } from "../../i18n/useTranslation";
import { LANGS, type Lang } from "../../i18n/strings";
import { useNavigationStore } from "../../store/navigationStore";
import { SiteSelector } from "../navigation/SiteSelector";
import { useSites } from "../../hooks/useSites";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: "16px 24px 14px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
    "@media (max-width: 600px)": {
      padding: "12px 12px 10px",
    },
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    "@media (max-width: 600px)": {
      padding: "16px 12px 24px",
      gap: "20px",
    },
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "640px",
    width: "100%",
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  sectionDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  toggleLabel: {
    flex: 1,
    fontSize: tokens.fontSizeBase300,
  },
  caveat: {
    marginTop: "8px",
  },
  siteListBox: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    maxHeight: "220px",
    overflowY: "auto",
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  siteListHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "6px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: "4px",
  },
  siteEmbed: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "hidden",
    "& > div": {
      // SiteSelector adds its own bottom border which clashes inside this card
      borderBottom: "none",
    },
  },
  currentSite: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    padding: "6px 0",
  },
});

export function SettingsPage() {
  const styles = useStyles();
  const { t, lang, setLang } = useTranslation();
  const isAdmin = useIsAdmin();
  const { siteId, siteName } = useNavigationStore();

  const { settings, isLoading, isMissingList, error, update, isUpdating } = useAppSettings();
  const { data: allSites, isLoading: sitesLoading } = useSites();

  const handleToggle = (key: "explorerEnabled" | "oneDriveEnabled", checked: boolean) => {
    update(key, checked ? "true" : "false").catch((e) => {
      console.error("Failed to update setting:", e);
      alert((e as Error).message);
    });
  };

  // Toggle a single site in/out of allowedSites.
  const handleSiteToggle = (toggledSiteId: string, checked: boolean) => {
    const allIds = (allSites ?? []).map((s) => s.id);
    // KEY FIX: empty allowedSites means "all". Before removing one entry we must
    // first expand "" → [every site id], otherwise filtering an empty array does
    // nothing and the checkbox appears to do nothing on click.
    const current =
      settings.allowedSites.length === 0 ? allIds : settings.allowedSites;
    let next: string[];
    if (checked) {
      next = current.includes(toggledSiteId) ? current : [...current, toggledSiteId];
    } else {
      next = current.filter((id) => id !== toggledSiteId);
    }
    // If every available site ends up included, collapse back to "" (= unrestricted,
    // so newly added sites are automatically visible without another config change).
    const effectivelyAll = allIds.length > 0 && allIds.every((id) => next.includes(id));
    const value = effectivelyAll ? "" : next.join(",");
    update("allowedSites", value).catch((e) => {
      console.error("Failed to update allowedSites:", e);
      alert((e as Error).message);
    });
  };

  // A site is "checked" when allowedSites is empty (= all) OR it's explicitly listed.
  const isSiteChecked = (id: string) =>
    settings.allowedSites.length === 0 || settings.allowedSites.includes(id);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Settings24Regular style={{ color: tokens.colorBrandForeground1 }} />
        <Text className={styles.title}>{t("settings.title")}</Text>
      </div>

      <div className={styles.body}>
        {/* Language — accessible to everyone */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>{t("settings.languageSection")}</Text>
          <Text className={styles.sectionDescription}>
            {t("settings.languageDescription")}
          </Text>
          <RadioGroup
            value={lang}
            onChange={(_, d) => setLang(d.value as Lang)}
          >
            {LANGS.map((l) => (
              <Radio key={l.code} value={l.code} label={l.label} />
            ))}
          </RadioGroup>
        </div>

        <Divider />

        {/* Admin tenant settings */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>{t("settings.adminSection")}</Text>
          <Text className={styles.sectionDescription}>
            {t("settings.adminDescription")}
          </Text>

          {!isAdmin ? (
            <MessageBar intent="info" className={styles.caveat}>
              <MessageBarBody>
                <MessageBarTitle>{t("settings.needAdminTitle")}</MessageBarTitle>
                {t("settings.needAdminBody")}
              </MessageBarBody>
            </MessageBar>
          ) : !siteId ? (
            // Admin without a site selected — let them pick one right here
            // instead of bouncing back to the sidebar.
            <div className={styles.siteEmbed}>
              <SiteSelector />
            </div>
          ) : isLoading ? (
            <Spinner size="small" label={t("common.loading")} />
          ) : isMissingList ? (
            <MessageBar intent="warning" className={styles.caveat}>
              <MessageBarBody>
                <MessageBarTitle>{t("settings.listMissingTitle")}</MessageBarTitle>
                {t("settings.listMissingBody")}
              </MessageBarBody>
            </MessageBar>
          ) : error ? (
            <MessageBar intent="error" className={styles.caveat}>
              <MessageBarBody>{error.message}</MessageBarBody>
            </MessageBar>
          ) : (
            <>
              <div className={styles.currentSite}>
                <CheckmarkCircle20Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />
                <Text>{siteName || siteId}</Text>
              </div>
              <div className={styles.toggleRow}>
                <Text className={styles.toggleLabel}>
                  {t("settings.showExplorerToAll")}
                </Text>
                <Switch
                  checked={settings.explorerEnabled}
                  disabled={isUpdating}
                  onChange={(_, d) => handleToggle("explorerEnabled", d.checked)}
                />
              </div>
              <div className={styles.toggleRow}>
                <Text className={styles.toggleLabel}>
                  {t("settings.showOneDriveToAll")}
                </Text>
                <Switch
                  checked={settings.oneDriveEnabled}
                  disabled={isUpdating}
                  onChange={(_, d) => handleToggle("oneDriveEnabled", d.checked)}
                />
              </div>

              {/* Visible sites */}
              <Divider style={{ margin: "8px 0 4px" }} />
              <Text className={styles.sectionTitle}>{t("settings.sitesSection")}</Text>
              <Text className={styles.sectionDescription}>{t("settings.sitesDescription")}</Text>
              {sitesLoading ? (
                <Spinner size="tiny" label={t("common.loading")} />
              ) : (allSites ?? []).length === 0 ? (
                <Text className={styles.sectionDescription}>{t("settings.sitesAllVisible")}</Text>
              ) : (
                <div className={styles.siteListBox}>
                  {/* Header row — "Select All" indeterminate checkbox */}
                  <div className={styles.siteListHeader}>
                    <Checkbox
                      label={<strong>{t("settings.sitesSelectAll")}</strong>}
                      checked={
                        settings.allowedSites.length === 0
                          ? true
                          : settings.allowedSites.length === (allSites ?? []).length
                          ? true
                          : "mixed"
                      }
                      disabled={isUpdating}
                      onChange={(_, d) => {
                        // Clicking "Select All" always resets to empty = all visible
                        if (d.checked) {
                          update("allowedSites", "").catch(console.error);
                        }
                        // Clicking to deselect = uncheck individual sites via the list below;
                        // "deselect all" is not supported (it would show nothing to users)
                      }}
                    />
                  </div>
                  {/* Individual site rows */}
                  {(allSites ?? []).map((site) => (
                    <Checkbox
                      key={site.id}
                      label={site.displayName}
                      checked={isSiteChecked(site.id)}
                      disabled={isUpdating}
                      onChange={(_, d) => handleSiteToggle(site.id, !!d.checked)}
                    />
                  ))}
                </div>
              )}

              <MessageBar intent="warning" className={styles.caveat}>
                <MessageBarBody>{t("settings.securityCaveat")}</MessageBarBody>
              </MessageBar>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
