import { Stack } from 'expo-router';

import Header from '@/components/global/Header/Header';
import { APP_HEADERS } from '@/constants/navigation';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <Header {...APP_HEADERS.library} />,
        }}
      />
      <Stack.Screen
        name="playing"
        options={{
          header: () => <Header {...APP_HEADERS.playing} />,
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
