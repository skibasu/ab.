import { useState } from 'react';
import { View } from 'react-native';

import FilterList, { type FilterOption } from '@/components/ui/FilterList/FilterList';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type CategoryOption = {
  iconName: IconName;
  title: string;
};

export type CategoryNavProps = {
  filters: CategoryOption[];
  onSelect?: (category: CategoryOption) => void;
};

const CategoryNav = ({ filters, onSelect }: CategoryNavProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const [selectedTitle, setSelectedTitle] = useState<string>();
  const filterOptions: FilterOption[] = filters.map(({ iconName, title }) => ({
    icon: {
      iconName,
      width: localStyles.icon.width,
      height: localStyles.icon.height,
    },
    filterLabel: title,
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Library categories"
      style={localStyles.container}
    >
      <FilterList
        filters={filterOptions}
        selectedLabel={selectedTitle}
        onSelect={(filter) => {
          setSelectedTitle(filter.filterLabel);
          const category = filters.find((item) => item.title === filter.filterLabel);
          if (category) onSelect?.(category);
        }}
      />
    </View>
  );
};

export default CategoryNav;
