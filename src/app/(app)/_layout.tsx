import { Stack } from 'expo-router';

import Header from '@/components/global/Header/Header';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Library',
          header: () => (
            <Header
              title="Library"
              iconList={['search', 'settings']}
            />
          ),
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="playing"
        options={{
          headerShown: false,
          headerTransparent: false,
          header: () => (
            <Header
              title="Now Playing"
              iconList={['settings']}
            />
          ),
        }}
      />
    </Stack>
  );
}
