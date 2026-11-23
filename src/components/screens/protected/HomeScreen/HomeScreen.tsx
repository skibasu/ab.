import ImportBottomSheet from '@/components/ui/ImportBottomSheet/ImportBottomSheet';
import { Library } from './Library/Library';

const HomeScreen = () => {
  return (
    <>
      <Library isImporting={false} />
      <ImportBottomSheet />
    </>
  );
};

export default HomeScreen;
