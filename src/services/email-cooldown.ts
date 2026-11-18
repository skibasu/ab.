import AsyncStorage from '@react-native-async-storage/async-storage';

import { LOG_MESSAGES } from '@/constants/log-messages';
import { EMAIL_RESEND_INTERVAL_MS } from './firebaseConfig';

type EmailCooldownType = 'verification' | 'passwordReset';

const resendAvailableAtByKey = new Map<string, number>();

function getStorageKey(type: EmailCooldownType, recipient: string): string {
  return type === 'passwordReset'
    ? 'passwordResetResendAvailableAt'
    : `verificationResendAvailableAt:${recipient}`;
}

export async function saveEmailCooldown(type: EmailCooldownType, recipient: string): Promise<void> {
  const storageKey = getStorageKey(type, recipient);
  const resendAvailableAt = Date.now() + EMAIL_RESEND_INTERVAL_MS;
  resendAvailableAtByKey.set(storageKey, resendAvailableAt);

  try {
    await AsyncStorage.setItem(storageKey, String(resendAvailableAt));
  } catch (error) {
    console.error(LOG_MESSAGES.auth.emailCooldownSaveFailed, error);
  }
}

export async function getEmailResendAvailableAt(
  type: EmailCooldownType,
  recipient: string,
): Promise<number> {
  const storageKey = getStorageKey(type, recipient);
  const cached = resendAvailableAtByKey.get(storageKey) ?? 0;
  if (cached > Date.now()) return cached;

  const stored = await AsyncStorage.getItem(storageKey);
  const timestamp = stored === null ? 0 : Number(stored);

  return Math.max(
    resendAvailableAtByKey.get(storageKey) ?? 0,
    Number.isFinite(timestamp) ? timestamp : 0,
  );
}
