import { useState } from 'react';
import { Text, View } from 'react-native';

import Filter, { type FilterProps } from '@/components/ui/Filter/Filter';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type FilterOption = Pick<FilterProps, 'icon' | 'filterLabel'>;

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
        {filters.map((filter) => (
          <Filter
            key={filter.filterLabel}
            icon={filter.icon}
            filterLabel={filter.filterLabel}
            selected={filter === selectedFilter}
            onPress={() => setSelectedLabel(filter.filterLabel)}
          />
        ))}
      </View>
      <Text style={localStyles.description}>{description}</Text>
    </View>
  );
};

export default FiltersMenu;
