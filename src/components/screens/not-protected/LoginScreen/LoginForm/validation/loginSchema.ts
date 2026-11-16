import { object, string, type InferType } from 'yup';

import { FORM_VALIDATION_ERROR_MESSAGES } from '@/constants/form-validation-messages';
import { EMAIL_REGEX } from '@/utils/regex';

export const loginSchema = object({
  email: string()
    .trim()
    .required(FORM_VALIDATION_ERROR_MESSAGES.emailRequired)
    .matches(EMAIL_REGEX, {
      message: FORM_VALIDATION_ERROR_MESSAGES.emailInvalid,
      excludeEmptyString: true,
    }),
  password: string().required(FORM_VALIDATION_ERROR_MESSAGES.passwordRequired),
});

export type LoginFormValues = InferType<typeof loginSchema>;
