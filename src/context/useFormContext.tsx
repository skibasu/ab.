import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';

import { TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';

type FormContextValue = {
  isGoogleSigningIn: boolean;
  setIsGoogleSigningIn: Dispatch<SetStateAction<boolean>>;
  isAppleSigningIn: boolean;
  setIsAppleSigningIn: Dispatch<SetStateAction<boolean>>;
  isMicrosoftSigningIn: boolean;
  setIsMicrosoftSigningIn: Dispatch<SetStateAction<boolean>>;
};

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: PropsWithChildren) {
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  const [isMicrosoftSigningIn, setIsMicrosoftSigningIn] = useState(false);

  const value = useMemo(
    () => ({
      isGoogleSigningIn,
      setIsGoogleSigningIn,
      isAppleSigningIn,
      setIsAppleSigningIn,
      isMicrosoftSigningIn,
      setIsMicrosoftSigningIn,
    }),
    [isGoogleSigningIn, isAppleSigningIn, isMicrosoftSigningIn],
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  const context = useContext(FormContext);

  if (context === null) {
    throw new Error(TECHNICAL_ERROR_MESSAGES.formProviderMissing);
  }

  return context;
}
