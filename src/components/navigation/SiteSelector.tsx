import { useMemo } from "react";
import {
  Dropdown,
  Option,
  Spinner,
  Text,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Globe24Regular, ArrowClockwiseRegular } from "@fluentui/react-icons";
import { useSites } from "../../hooks/useSites";
import { useNavigationStore } from "../../store/navigationStore";
import { getSiteDrive } from "../../api/sitesApi";
import { useAuth } from "../../auth/useAuth";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useIsAdmin } from "../../hooks/useAppPins";

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dropdown: {
    width: "100%",
  },
  errorBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase100,
  },
});

export function SiteSelector() {
  const styles = useStyles();
  const { data: sites, isLoading, isError, error, refetch } = useSites();
  const { setSite } = useNavigationStore();
  const { getToken } = useAuth();
  const isAdmin = useIsAdmin();
  const { settings } = useAppSettings();

  // Non-admins only see the sites the admin has allowed.
  // Empty allowedSites = every site is visible (default).
  const visibleSites = useMemo(() => {
    if (!sites) return [];
    if (isAdmin || settings.allowedSites.length === 0) return sites;
    return sites.filter((s) => settings.allowedSites.includes(s.id));
  }, [sites, isAdmin, settings.allowedSites]);

  const handleSelect = async (_: unknown, data: { optionValue?: string; optionText?: string }) => {
    if (!data.optionValue) return;
    const [siteId, siteName] = data.optionValue.split("|||");
    try {
      const token = await getToken();
      const drive = await getSiteDrive(token, siteId);
      setSite(siteId, siteName, drive.id);
    } catch (err) {
      console.error("Failed to load site drive:", err);
    }
  };

  // Extract a readable error message
  const errorMessage = (() => {
    if (!error) return "Failed to load sites";
    const msg = (error as { message?: string })?.message ?? String(error);
    if (msg.includes("403")) return "Access denied (403) — check API permissions";
    if (msg.includes("401")) return "Not authorised (401) — please sign out and back in";
    if (msg.includes("Network")) return "Network error — check your connection";
    return msg.slice(0, 80);
  })();

  return (
    <div className={styles.wrapper}>
      <Text className={styles.label}>
        <Globe24Regular fontSize={14} />
        SharePoint Site
      </Text>
      {isLoading ? (
        <Spinner size="tiny" label="Loading sites..." />
      ) : isError ? (
        <div className={styles.errorBox}>
          <Text className={styles.errorText}>{errorMessage}</Text>
          <Button
            size="small"
            appearance="outline"
            icon={<ArrowClockwiseRegular />}
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <Dropdown
          className={styles.dropdown}
          placeholder="Select a site..."
          onOptionSelect={handleSelect}
        >
          {visibleSites.map((site) => (
            <Option
              key={site.id}
              value={`${site.id}|||${site.displayName}`}
            >
              {site.displayName}
            </Option>
          ))}
        </Dropdown>
      )}
    </div>
  );
}
