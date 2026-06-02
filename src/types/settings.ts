export interface SystemSettings {
  siteName: string
  logoUrl: string
  icpNumber: string
  contactEmail: string
  maintenanceMode: boolean
  maintenanceMessage: string
  updatedAt: string
}

export interface UpdateSettingsParams {
  siteName: string
  logoUrl?: string
  icpNumber?: string
  contactEmail: string
  maintenanceMode: boolean
  maintenanceMessage?: string
}

export interface LogoUploadResult {
  url: string
}
