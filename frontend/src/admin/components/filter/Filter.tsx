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
  <label className='filter-container'>
    {label}
    <select
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      style={{
        borderRadius: '8px',
        padding: '0.25rem 0.75rem',
        border: '1px solid #bbb',
        fontSize: '0.95rem',
      }}
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
  </label>
);

export default FilterSelect;
