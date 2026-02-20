export interface BrandingSettingsRecord {
  id: string;
  businessName: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  footerNote: string | null;
  panNumber: string | null;
  gstNumber: string | null;
  email: string | null;
  upiId: string | null;
  upiPayeeName: string | null;
  upiLink: string | null;
  upiQrUrl: string | null;
  termsAndConditions: string | null;
  privacyPolicy: string | null;
  welcomeBackgroundUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingUpsertData {
  businessName?: string;
  address?: string;
  phone?: string;
  footerNote?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  email?: string | null;
  upiId?: string | null;
  upiPayeeName?: string | null;
  upiLink?: string | null;
  termsAndConditions?: string | null;
  privacyPolicy?: string | null;
}

export interface BrandingRepo {
  get(): Promise<BrandingSettingsRecord | null>;
  upsert(data: BrandingUpsertData): Promise<BrandingSettingsRecord>;
  setLogoUrl(url: string | null): Promise<void>;
  setUpiQrUrl(url: string | null): Promise<void>;
  setWelcomeBackgroundUrl(url: string | null): Promise<void>;
}
