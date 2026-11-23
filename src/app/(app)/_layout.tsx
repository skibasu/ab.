import Header from '@/components/global/Header/Header';
import { ResetLibraryAction } from '@/components/global/Header/ResetLibraryAction/ResetLibraryAction';
import { APP_HEADERS } from '@/constants/navigation';
import { useLibraryInitialization } from '@/hooks/use-library-initialization';
import { Stack } from 'expo-router';

export default function AppLayout() {
  useLibraryInitialization();

  return (
    <Stack>
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <Header
              {...APP_HEADERS.library}
              trailingAction={__DEV__ ? <ResetLibraryAction /> : null}
            />
          ),
        }}
      />
      <Stack.Screen
        name="import-error"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="playing"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          header: () => <Header {...APP_HEADERS.search} />,
        }}
      />
    </Stack>
  );
}
