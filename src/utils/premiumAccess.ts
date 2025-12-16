import { User, VerificationStatus } from '../types';

// Configuration for verification expiration
export const VERIFICATION_CONFIG = {
  PENDING_EXPIRY_DAYS: 30, // After 30 days, pending status expires
  FIRST_REMINDER_DAYS: 7, // Send first reminder after 7 days
  SECOND_REMINDER_DAYS: 14, // Send second reminder after 14 days
  FINAL_REMINDER_DAYS: 21, // Send final "last chance" reminder after 21 days
};

/**
 * Check if pending verification has expired
 */
export function isPendingExpired(user: User | null): boolean {
  if (!user?.verification) return false;
  if (user.verification.status !== 'pending') return false;
  if (!user.verification.pendingSince) return false;
  
  const pendingSince = new Date(user.verification.pendingSince);
  const daysSincePending = Math.floor((Date.now() - pendingSince.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSincePending >= VERIFICATION_CONFIG.PENDING_EXPIRY_DAYS;
}

/**
 * Get days remaining before pending verification expires
 */
export function getDaysUntilExpiry(user: User | null): number | null {
  if (!user?.verification) return null;
  if (user.verification.status !== 'pending') return null;
  if (!user.verification.pendingSince) return null;
  
  const pendingSince = new Date(user.verification.pendingSince);
  const daysSincePending = Math.floor((Date.now() - pendingSince.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = VERIFICATION_CONFIG.PENDING_EXPIRY_DAYS - daysSincePending;
  
  return Math.max(0, daysRemaining);
}

/**
 * Check what reminder should be shown (if any)
 */
export function getVerificationReminderLevel(user: User | null): 'none' | 'gentle' | 'urgent' | 'final' {
  if (!user?.verification) return 'none';
  if (user.verification.status !== 'pending') return 'none';
  if (!user.verification.pendingSince) return 'gentle';
  
  const pendingSince = new Date(user.verification.pendingSince);
  const daysSincePending = Math.floor((Date.now() - pendingSince.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSincePending >= VERIFICATION_CONFIG.FINAL_REMINDER_DAYS) return 'final';
  if (daysSincePending >= VERIFICATION_CONFIG.SECOND_REMINDER_DAYS) return 'urgent';
  if (daysSincePending >= VERIFICATION_CONFIG.FIRST_REMINDER_DAYS) return 'gentle';
  
  return 'none';
}

/**
 * Check if user has premium access
 * Premium is granted ONLY when:
 * 1. User has isPremium = true (paid subscription), OR
 * 2. User has verification.status = 'verified' (verified student)
 * 
 * PENDING verification does NOT grant premium access!
 */
export function hasPremiumAccess(user: User | null): boolean {
  if (!user) return false;
  
  // Check paid premium subscription
  if (user.isPremium) {
    // Check if premium has expired
    if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      return false;
    }
    return true;
  }
  
  // Check verified student status
  if (user.verification?.status === 'verified') {
    // Check if student verification has expired (e.g., graduated)
    if (user.verification.expiresAt && new Date(user.verification.expiresAt) < new Date()) {
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Check if user has pending verification that needs action
 */
export function hasPendingVerification(user: User | null): boolean {
  if (!user) return false;
  if (user.verification?.status !== 'pending') return false;
  // Check if pending has expired
  if (isPendingExpired(user)) return false;
  return true;
}

/**
 * Get verification status message for UI
 */
export function getVerificationStatusMessage(user: User | null): {
  status: VerificationStatus | 'none' | 'expired';
  title: string;
  message: string;
  actionLabel?: string;
  daysRemaining?: number;
  urgency?: 'low' | 'medium' | 'high';
} {
  if (!user) {
    return {
      status: 'none',
      title: '',
      message: '',
    };
  }

  const verificationStatus = user.verification?.status;
  const daysRemaining = getDaysUntilExpiry(user);
  const reminderLevel = getVerificationReminderLevel(user);

  switch (verificationStatus) {
    case 'pending':
      // Check if expired
      if (isPendingExpired(user)) {
        return {
          status: 'expired',
          title: 'Verification Expired',
          message: 'Your verification request has expired. You can try again with a valid school email.',
          actionLabel: 'Try Again',
          urgency: 'low',
        };
      }
      
      // Show appropriate message based on urgency
      if (reminderLevel === 'final') {
        return {
          status: 'pending',
          title: 'Last Chance to Verify!',
          message: `Only ${daysRemaining} days left to verify ${user.verification?.verifiedEmail}. After that, you'll need to start over.`,
          actionLabel: 'Verify Now',
          daysRemaining: daysRemaining ?? undefined,
          urgency: 'high',
        };
      } else if (reminderLevel === 'urgent') {
        return {
          status: 'pending',
          title: 'Verify Soon',
          message: `${daysRemaining} days left to verify ${user.verification?.verifiedEmail} and unlock premium.`,
          actionLabel: 'Check Email',
          daysRemaining: daysRemaining ?? undefined,
          urgency: 'medium',
        };
      } else {
        return {
          status: 'pending',
          title: 'Verify Your School Email',
          message: `We sent a verification link to ${user.verification?.verifiedEmail}. Click the link to unlock free premium features.`,
          actionLabel: 'Resend Email',
          daysRemaining: daysRemaining ?? undefined,
          urgency: 'low',
        };
      }
    case 'verified':
      return {
        status: 'verified',
        title: 'Student Verified',
        message: `You're enjoying premium features as a verified student from ${user.verification?.institutionName || 'your institution'}.`,
      };
    case 'expired':
      return {
        status: 'expired',
        title: 'Verification Expired',
        message: 'Your previous verification request expired. Try again with a valid school email.',
        actionLabel: 'Verify Again',
      };
    case 'rejected':
      return {
        status: 'rejected',
        title: 'Verification Failed',
        message: 'We couldn\'t verify your student status. Please try with a different school email or contact support.',
        actionLabel: 'Try Again',
      };
    default:
      return {
        status: 'none',
        title: 'Are You a Student?',
        message: 'Verify your school email to unlock free premium features.',
        actionLabel: 'Verify Now',
      };
  }
}

/**
 * Premium features list - what students get for free
 */
export const PREMIUM_FEATURES = [
  {
    id: 'storage',
    icon: 'cloud-outline',
    title: 'Unlimited Storage',
    description: 'Store all your documents without limits',
    freeLimit: '500 MB',
    premiumLimit: 'Unlimited',
  },
  {
    id: 'fax',
    icon: 'send-outline',
    title: 'Free Faxing',
    description: 'Send faxes to universities and institutions',
    freeLimit: '5 pages/month',
    premiumLimit: '50 pages/month',
  },
  {
    id: 'ai',
    icon: 'sparkles-outline',
    title: 'Advanced AI',
    description: 'Full access to AI study tools and document analysis',
    freeLimit: '10 queries/day',
    premiumLimit: 'Unlimited',
  },
  {
    id: 'convert',
    icon: 'swap-horizontal-outline',
    title: 'Batch Convert',
    description: 'Convert multiple documents at once',
    freeLimit: '1 at a time',
    premiumLimit: 'Up to 20 files',
  },
  {
    id: 'priority',
    icon: 'flash-outline',
    title: 'Priority Processing',
    description: 'Faster scans, conversions & uploads',
    freeLimit: 'Standard',
    premiumLimit: '2x faster',
  },
];
