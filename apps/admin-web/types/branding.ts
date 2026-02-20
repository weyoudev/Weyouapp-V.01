export interface BrandingSettings {
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
  /** Mobile app privacy policy (super admin only). */
  privacyPolicy: string | null;
  /** Welcome screen background (mobile app, 50% opacity). */
  welcomeBackgroundUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandingBody {
  businessName: string;
  address: string;
  phone: string;
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
