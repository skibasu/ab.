import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';

let busy = false;

/** Prevents overlapping imports and test resets from changing the library at the same time. */
export async function runLibraryOperation<T>(operation: () => Promise<T>): Promise<T> {
  if (busy) throw new Error(LIBRARY_ERROR_MESSAGES.operationInProgress);

  busy = true;
  try {
    return await operation();
  } finally {
    busy = false;
  }
}
