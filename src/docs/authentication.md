# Authentication System

## Overview

The Go-Goyagoy authentication system provides secure, role-based access control with email verification and password management.

## User Roles

### Role Hierarchy
1. **Anonymous Patient** - No authentication required
2. **Registered Patient** - Basic authentication
3. **Staff** - Elevated privileges
4. **Dentist/Admin** - Full system access

### Access Control Matrix

| Feature | Anonymous | Patient | Staff | Dentist/Admin |
|---------|-----------|---------|-------|---------------|
| Book Appointments | ✅ | ✅ | ✅ | ✅ |
| View Own Data | ❌ | ✅ | ✅ | ✅ |
| Manage Appointments | ❌ | Own Only | ✅ | ✅ |
| Patient Management | ❌ | ❌ | ✅ | ✅ |
| System Administration | ❌ | ❌ | ❌ | ✅ |

## Components

### Core Authentication Components
- `LoginForm.tsx` - User login interface
- `SignUpForm.tsx` - User registration form
- `ChangePassword.tsx` - Password change functionality
- `OTPVerification.tsx` - Email verification system
- `LoginAttemptStatus.tsx` - Failed login attempt tracking

### Authentication Context
- `AuthContext.tsx` - Global authentication state management
- Provides user session, role information, and auth methods
- Handles login, logout, and session persistence

## Pages & Flows

### Login Flow
1. **Page**: `/app/login/page.tsx`
2. **Process**: Email/password verification → Role-based redirect
3. **Features**: Remember me, forgot password, signup link

### Registration Flow  
1. **Page**: `/app/signup/page.tsx`
2. **Process**: Account creation → Email verification → Login
3. **Validation**: Email uniqueness, password strength

### Password Management
1. **Forgot Password**: `/app/forgot-password/page.tsx`
2. **Reset Password**: `/app/reset-password/page.tsx`
3. **Change Password**: `/app/change-password/page.tsx`

### Email Verification
1. **Validation Page**: `/app/validate-email/page.tsx`
2. **OTP Verification**: `/app/verify-otp/page.tsx`
3. **Resend Validation**: Available through API

## API Endpoints

### Authentication Routes
- `POST /api/auth/login` - User authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/validate-email` - Email verification
- `POST /api/auth/resend-validation` - Resend verification email

## Security Features

### Password Security
- Minimum 8 characters
- Complexity requirements
- Secure hashing (handled by Supabase)
- Password change history

### Session Management
- JWT-based authentication
- Role-based access tokens
- Session expiration handling
- Automatic logout on token expiry

### Failed Login Protection
- Login attempt tracking
- Account lockout after failed attempts
- Automatic unlock after time period
- Security notifications

## User Management

### Admin User Management
- **Page**: `/app/dashboard/admin/users/page.tsx`
- **Features**: Create, edit, deactivate users
- **Restrictions**: Admin can only create staff/dentist accounts
- **Validation**: Role-based permission checks

### Profile Management
- **Patient Profile**: `/app/dashboard/my-profile/page.tsx`
- **Staff Profile**: `/app/dashboard/profile/page.tsx`
- **Self-service profile updates**
- **Contact information management**

## Implementation Details

### AuthContext Provider
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}
```

### User Interface
```typescript
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'patient' | 'staff' | 'dentist' | 'admin';
  phone?: string;
  isEmailVerified: boolean;
  lastLogin?: string;
}
```

### Role-Based Routing
- Middleware-based route protection
- Automatic redirects based on user role
- Dashboard layout customization per role

## Error Handling

### Authentication Errors
- Invalid credentials
- Account not verified
- Account locked/disabled
- Session expired
- Network connectivity issues

### User Feedback
- Toast notifications for auth events
- Form validation messages
- Loading states during auth operations
- Clear error messages

## Integration Points

### Database Integration
- User data stored in Supabase `users` table
- Role-based data filtering
- Session management through Supabase Auth

### Email Services
- Email verification through Supabase
- Password reset emails
- Account notifications

## Security Best Practices

1. **Never store passwords in frontend**
2. **Role validation on every API call**
3. **Secure token storage**
4. **Regular session validation**
5. **Audit trail for auth events**
6. **Rate limiting on auth endpoints**

## Related Documentation

- [API Reference](./api-reference.md#authentication) - Authentication API details
- [Database Schema](./database-schema.md#users) - User data models
- [Components](./components.md#authentication) - Auth component details