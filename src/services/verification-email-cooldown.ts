import AsyncStorage from '@react-native-async-storage/async-storage';

import { TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';
import { VERIFICATION_EMAIL_RESEND_INTERVAL_MS } from './firebaseConfig';

const resendAvailableAtByUser = new Map<string, number>();

export async function saveVerificationEmailCooldown(userId: string): Promise<void> {
  const resendAvailableAt = Date.now() + VERIFICATION_EMAIL_RESEND_INTERVAL_MS;
  resendAvailableAtByUser.set(userId, resendAvailableAt);

  try {
    await AsyncStorage.setItem(
      `verificationResendAvailableAt:${userId}`,
      String(resendAvailableAt),
    );
  } catch (error) {
    console.error(TECHNICAL_ERROR_MESSAGES.verificationCooldownSaveFailed, error);
  }
}

export async function getVerificationResendAvailableAt(userId: string): Promise<number> {
  const cached = resendAvailableAtByUser.get(userId) ?? 0;
  if (cached > Date.now()) return cached;

  const stored = await AsyncStorage.getItem(`verificationResendAvailableAt:${userId}`);
  const timestamp = stored === null ? 0 : Number(stored);

  return Math.max(
    resendAvailableAtByUser.get(userId) ?? 0,
    Number.isFinite(timestamp) ? timestamp : 0,
  );
}
