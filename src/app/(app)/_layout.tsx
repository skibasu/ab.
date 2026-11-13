import { Stack } from 'expo-router';

import Header from '@/components/global/Header/Header';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <Header
              title="Library"
              iconList={['search', 'settings']}
            />
          ),
        }}
      />
      <Stack.Screen
        name="playing"
        options={{
          header: () => (
            <Header
              title="Now Playing"
              iconList={['settings']}
            />
          ),
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          header: () => (
            <Header
              title="Search"
              iconList={['close']}
            />
          ),
        }}
      />
    </Stack>
  );
}
