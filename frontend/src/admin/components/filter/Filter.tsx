import type { ChangeEvent } from 'react';
import './filter.css';

type FilterSelectProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

const FilterSelect = ({
  options,
  value,
  onChange,
  label,
}: FilterSelectProps) => (
  <div className='filter-select-container'>
    {label && (
      <label className='filter-select-label' htmlFor='filter-select'>
        {label}
      </label>
    )}
    <select
      id='filter-select'
      className='filter-select-input'
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      aria-label={label || 'Filter select'}
    >
      <option value='' disabled hidden>
        {label}
      </option>
      {options.map((option) => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default FilterSelect;
