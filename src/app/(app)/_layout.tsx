import { Stack } from 'expo-router';

import ThemedHeader from '@/components/themed-header';
import { ThemedText } from '@/components/themed-text';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Library',
          header: () => (
            <ThemedHeader
              left={<ThemedText>Library</ThemedText>}
              right={
                <>
                  <ThemedText>a</ThemedText>
                  <ThemedText>b</ThemedText>
                </>
              }
            />
          ),
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="playing"
        options={{
          headerShown: false,
          header: () => (
            <ThemedHeader
              left={<ThemedText>Playing</ThemedText>}
              right={
                <>
                  <ThemedText>a</ThemedText>
                  <ThemedText>b</ThemedText>
                </>
              }
            />
          ),
        }}
      />
    </Stack>
  );
}
