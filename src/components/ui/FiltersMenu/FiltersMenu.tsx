import { useState } from 'react';
import { Text, View } from 'react-native';

import FilterList, { type FilterOption } from '@/components/ui/FilterList/FilterList';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type FiltersMenuProps = {
  filters: FilterOption[];
  title: string;
  description: string;
};

const FiltersMenu = ({ filters, title, description }: FiltersMenuProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const [selectedLabel, setSelectedLabel] = useState<string>();
  const selectedFilter =
    filters.find((filter) => filter.filterLabel === selectedLabel) ?? filters[0];

  return (
    <View style={localStyles.container}>
      <Text
        accessibilityRole="header"
        style={localStyles.title}
      >
        {title}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={title}
        style={localStyles.filters}
      >
        <FilterList
          filters={filters}
          selectedLabel={selectedFilter?.filterLabel}
          onSelect={(filter) => setSelectedLabel(filter.filterLabel)}
        />
      </View>
      <Text style={localStyles.description}>{description}</Text>
    </View>
  );
};

export default FiltersMenu;
