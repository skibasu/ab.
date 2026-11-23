import { useLocalSearchParams } from 'expo-router';

import PlayingScreen from '@/components/screens/protected/PlayingScreen/PlayingScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';

const Playing = () => {
  const { bookId } = useLocalSearchParams<{ bookId?: string | string[] }>();
  return (
    <AppSafeArea>
      <PlayingScreen bookId={Array.isArray(bookId) ? bookId[0] : bookId} />
    </AppSafeArea>
  );
};

export default Playing;
