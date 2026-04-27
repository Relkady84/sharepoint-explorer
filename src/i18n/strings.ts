export type Lang = "en" | "fr";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

interface Bundle {
  common: {
    search: string;
    cancel: string;
    save: string;
    saving: string;
    saved: string;
    loading: string;
    close: string;
    open: string;
    download: string;
    items: string; // "n items"
  };
  nav: {
    explorer: string;
    shortcuts: string;
    onedrive: string;
    settings: string;
    signOut: string;
    openMenu: string;
  };
  topbar: {
    appName: string;
  };
  quicklinks: {
    site: string;
    outlook: string;
    notes: string;
    pronote: string;
    sectionLabel: string;
  };
  onedrive: {
    title: string;
    myDrive: string;
    sharedWithMe: string;
    sharedBy: string;
    searchHere: string;
    searchByNameOrAuthor: string;
    loadingMine: string;
    loadingShared: string;
    emptyMine: string;
    emptyShared: string;
    emptySharedHint: string; // contains <strong> for "you" / "Mon OneDrive"
    openInOneDrive: string;
  };
  shortcuts: {
    title: string;
    everyone: string;
    searchPlaceholder: string;
  };
  dept: {
    loading: string;
    searching: string;
    empty: string;
    upload: string;
    rename: string;
    delete: string;
    deleteConfirm: string;  // contains {count}
    errorForbidden: string;
    copy: string;
    move: string;
    newFolder: string;
    newFolderPlaceholder: string;
  };
  settings: {
    title: string;
    languageSection: string;
    languageDescription: string;
    adminSection: string;
    adminDescription: string;
    showExplorerToAll: string;
    showOneDriveToAll: string;
    nonAdminNote: string;
    securityCaveat: string;
    listMissingTitle: string;
    listMissingBody: string;
    needAdminTitle: string;
    needAdminBody: string;
    sitesSection: string;
    sitesDescription: string;
    sitesAllVisible: string;
    sitesSelectAll: string;
    adminsSection: string;
    adminsDescription: string;
    adminsPlaceholder: string;
    adminsAdd: string;
    adminsEmpty: string;
    adminsEnvNote: string;
  };
}

const fr: Bundle = {
  common: {
    search: "Rechercher",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Enregistré",
    loading: "Chargement…",
    close: "Fermer",
    open: "Ouvrir",
    download: "Télécharger",
    items: "élém.",
  },
  nav: {
    explorer: "Explorer",
    shortcuts: "Mes raccourcis",
    onedrive: "OneDrive",
    settings: "Paramètres",
    signOut: "Se déconnecter",
    openMenu: "Ouvrir le menu",
  },
  topbar: {
    appName: "SharePoint Explorer",
  },
  quicklinks: {
    site: "Site du lycée",
    outlook: "Outlook",
    notes: "Mes notes",
    pronote: "Pronote",
    sectionLabel: "Liens rapides",
  },
  onedrive: {
    title: "OneDrive",
    myDrive: "Mon OneDrive",
    sharedWithMe: "Partagé avec moi",
    sharedBy: "Partagé par",
    searchHere: "Rechercher dans ce dossier…",
    searchByNameOrAuthor: "Rechercher par nom ou auteur…",
    loadingMine: "Chargement de votre OneDrive…",
    loadingShared: "Chargement des fichiers partagés…",
    emptyMine: "Ce dossier est vide",
    emptyShared: "Aucun fichier partagé avec vous",
    emptySharedHint:
      "Cette section liste uniquement les fichiers que d'autres personnes ont partagés avec vous. Les dossiers que vous avez partagés se trouvent dans Mon OneDrive.",
    openInOneDrive: "Ouvrir dans OneDrive",
  },
  shortcuts: {
    title: "Dossiers Épinglés",
    everyone: "Tout le monde",
    searchPlaceholder: "Rechercher dans tous les dossiers épinglés…",
  },
  dept: {
    loading: "Chargement…",
    searching: "Recherche…",
    empty: "Aucun document dans ce dossier.",
    upload: "Importer",
    rename: "Renommer",
    delete: "Supprimer",
    deleteConfirm: "Supprimer {count} élément(s) ? Cette action est irréversible.",
    errorForbidden: "Accès refusé — vous n'avez pas la permission d'effectuer cette action.",
    copy: "Copier",
    move: "Déplacer",
    newFolder: "Nouveau dossier",
    newFolderPlaceholder: "Nom du dossier…",
  },
  settings: {
    title: "Paramètres",
    languageSection: "Langue",
    languageDescription: "Choisissez la langue de l'interface. Préférence personnelle, enregistrée sur cet appareil.",
    adminSection: "Paramètres administrateur",
    adminDescription:
      "Ces options contrôlent ce que voient les utilisateurs non-administrateurs. Les administrateurs voient toujours tous les onglets.",
    showExplorerToAll: "Afficher l'onglet Explorer pour tous les utilisateurs",
    showOneDriveToAll: "Afficher l'onglet OneDrive pour tous les utilisateurs",
    nonAdminNote: "Vous n'êtes pas administrateur — seul votre choix de langue est enregistré.",
    securityCaveat:
      "⚠️ Ces options masquent les onglets dans l'interface mais ne bloquent pas l'accès aux données. Un utilisateur déterminé peut toujours accéder à SharePoint ou OneDrive via le portail Microsoft 365. Pour un vrai contrôle d'accès, ajustez les permissions Azure AD ou les ACL SharePoint.",
    listMissingTitle: "Configuration requise",
    listMissingBody:
      "Créez une liste SharePoint nommée AppSettings sur ce site, avec une colonne supplémentaire Value (Ligne de texte simple). La colonne Title intégrée stocke la clé.",
    needAdminTitle: "Accès administrateur requis",
    needAdminBody: "Seuls les administrateurs peuvent modifier ces paramètres.",
    sitesSection: "Sites visibles",
    sitesDescription:
      "Choisissez quels sites SharePoint apparaissent dans le sélecteur de site pour les utilisateurs non-administrateurs. Tout cocher = tous les sites sont visibles.",
    sitesAllVisible: "Tous les sites accessibles sont visibles",
    sitesSelectAll: "Tout sélectionner",
    adminsSection: "Administrateurs supplémentaires",
    adminsDescription: "Ces utilisateurs ont les mêmes droits que vous : gérer les épingles, activer/désactiver les onglets, choisir les sites visibles.",
    adminsPlaceholder: "Email de l'administrateur…",
    adminsAdd: "Ajouter",
    adminsEmpty: "Aucun administrateur supplémentaire configuré.",
    adminsEnvNote: "Administrateur principal (configuré dans l'environnement, non modifiable ici)",
  },
};

const en: Bundle = {
  common: {
    search: "Search",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
    loading: "Loading…",
    close: "Close",
    open: "Open",
    download: "Download",
    items: "items",
  },
  nav: {
    explorer: "Explorer",
    shortcuts: "My shortcuts",
    onedrive: "OneDrive",
    settings: "Settings",
    signOut: "Sign out",
    openMenu: "Open menu",
  },
  topbar: {
    appName: "SharePoint Explorer",
  },
  quicklinks: {
    site: "School website",
    outlook: "Outlook",
    notes: "My notes",
    pronote: "Pronote",
    sectionLabel: "Quick links",
  },
  onedrive: {
    title: "OneDrive",
    myDrive: "My OneDrive",
    sharedWithMe: "Shared with me",
    sharedBy: "Shared by",
    searchHere: "Search this folder…",
    searchByNameOrAuthor: "Search by name or author…",
    loadingMine: "Loading your OneDrive…",
    loadingShared: "Loading shared files…",
    emptyMine: "This folder is empty",
    emptyShared: "No files shared with you",
    emptySharedHint:
      "This section only lists files other people have shared with you. Folders you have shared are in My OneDrive.",
    openInOneDrive: "Open in OneDrive",
  },
  shortcuts: {
    title: "Pinned folders",
    everyone: "Everyone",
    searchPlaceholder: "Search across all pinned folders…",
  },
  dept: {
    loading: "Loading…",
    searching: "Searching…",
    empty: "No documents in this folder.",
    upload: "Upload",
    rename: "Rename",
    delete: "Delete",
    deleteConfirm: "Delete {count} item(s)? This action is irreversible.",
    errorForbidden: "Access denied — you do not have permission to perform this action.",
    copy: "Copy",
    move: "Move",
    newFolder: "New folder",
    newFolderPlaceholder: "Folder name…",
  },
  settings: {
    title: "Settings",
    languageSection: "Language",
    languageDescription: "Choose the interface language. Personal preference, saved on this device.",
    adminSection: "Administrator settings",
    adminDescription:
      "These toggles control what non-admin users see. Admins always see every tab.",
    showExplorerToAll: "Show the Explorer tab to all users",
    showOneDriveToAll: "Show the OneDrive tab to all users",
    nonAdminNote: "You are not an administrator — only your language choice is saved.",
    securityCaveat:
      "⚠️ These toggles hide tabs in the UI but do not block data access. A determined user can still reach SharePoint or OneDrive via the Microsoft 365 portal. For real access control, adjust Azure AD permissions or SharePoint ACLs.",
    listMissingTitle: "Setup required",
    listMissingBody:
      "Create a SharePoint list called AppSettings on this site, with one extra column Value (Single line of text). The built-in Title column stores the key.",
    needAdminTitle: "Administrator access required",
    needAdminBody: "Only administrators can change these settings.",
    sitesSection: "Visible sites",
    sitesDescription:
      "Choose which SharePoint sites appear in the site picker for non-admin users. Check all to show every accessible site.",
    sitesAllVisible: "All accessible sites are visible",
    sitesSelectAll: "Select all",
    adminsSection: "Additional administrators",
    adminsDescription: "These users have the same rights as you: manage pins, toggle tabs, choose visible sites.",
    adminsPlaceholder: "Administrator email…",
    adminsAdd: "Add",
    adminsEmpty: "No additional administrators configured.",
    adminsEnvNote: "Primary administrator (configured in environment, not editable here)",
  },
};

export const bundles: Record<Lang, Bundle> = { fr, en };
export type { Bundle };
