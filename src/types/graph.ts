export interface DriveItem {
  id: string;
  name: string;
  size?: number;
  lastModifiedDateTime: string;
  createdDateTime: string;
  webUrl: string;
  folder?: {
    childCount: number;
  };
  file?: {
    mimeType: string;
  };
  parentReference: {
    driveId: string;
    driveType: string;
    id: string;
    path: string;
    siteId?: string;
  };
  "@microsoft.graph.downloadUrl"?: string;
}

export interface Site {
  id: string;
  displayName: string;
  webUrl: string;
  description?: string;
}

export interface Drive {
  id: string;
  driveType: string;
  name: string;
  quota?: {
    used: number;
    total: number;
    remaining: number;
  };
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  driveId: string;
}
