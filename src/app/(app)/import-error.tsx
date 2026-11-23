import { router, useLocalSearchParams } from 'expo-router';

import ImportErrorScreen from '@/components/screens/protected/ImportErrorScreen/ImportErrorScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';
import { getImportErrorContent } from '@/utils/import-error-content';

const ImportError = () => {
  const params = useLocalSearchParams<{
    code?: string | string[];
    limit?: string | string[];
    actual?: string | string[];
    partial?: string | string[];
    type?: string | string[];
  }>();
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const content = getImportErrorContent({
    code: first(params.code),
    limit: first(params.limit),
    actual: first(params.actual),
    partial: first(params.partial),
  });
  const type = first(params.type) === 'application/zip' ? 'application/zip' : 'audio/mpeg';
  return (
    <AppSafeArea>
      <ImportErrorScreen
        {...content}
        onChooseFiles={() =>
          router.dismissTo({
            pathname: '/',
            params: { retryImport: String(Date.now()), importType: type },
          })
        }
        onBackToLibrary={() => router.dismissTo('/')}
      />
    </AppSafeArea>
  );
};
export default ImportError;
