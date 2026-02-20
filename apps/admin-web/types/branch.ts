export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  footerNote: string | null;
  logoUrl: string | null;
  upiId: string | null;
  upiPayeeName: string | null;
  upiLink: string | null;
  upiQrUrl: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchBody {
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  footerNote?: string | null;
  upiId?: string | null;
  upiPayeeName?: string | null;
  upiLink?: string | null;
  isDefault?: boolean;
}

export interface UpdateBranchBody {
  name?: string;
  address?: string;
  phone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  footerNote?: string | null;
  upiId?: string | null;
  upiPayeeName?: string | null;
  upiLink?: string | null;
  isDefault?: boolean;
}
