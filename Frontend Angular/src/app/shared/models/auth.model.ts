export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_DEALER' | 'ROLE_ADMIN';

export interface LoginRequest {
  emailId: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  emailId: string;
  mobileNo: string;
  address: string;
  userType: 'CUSTOMER' | 'DEALER' | 'ADMIN';
  password: string;
}

export interface AuthResponse {
  token: string;
  emailId: string;
  role: UserRole;
  message: string;
}

export interface InternalUserResponse {
  emailId: string;
  password?: string;
  role: UserRole;
  active: boolean;
}
