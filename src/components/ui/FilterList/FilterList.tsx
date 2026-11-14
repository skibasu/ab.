import Filter, { type FilterProps } from '@/components/ui/Filter/Filter';

export type FilterOption = Pick<FilterProps, 'icon' | 'filterLabel'>;

export type FilterListProps = {
  filters: FilterOption[];
  selectedLabel?: string;
  onSelect: (filter: FilterOption) => void;
};

const FilterList = ({ filters, selectedLabel, onSelect }: FilterListProps) => (
  <>
    {filters.map((filter) => (
      <Filter
        key={filter.filterLabel}
        icon={filter.icon}
        filterLabel={filter.filterLabel}
        selected={filter.filterLabel === selectedLabel}
        onPress={() => onSelect(filter)}
      />
    ))}
  </>
);

export default FilterList;
