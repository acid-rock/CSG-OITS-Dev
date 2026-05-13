import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// SearchFilterBar is a DEFAULT export — named import would fail
import SearchFilterBar from '../../src/components/search-filter-bar/SearchFilterBar';

const defaultProps = {
  searchValue: '',
  onSearchChange: vi.fn(),
  termValue: '',
  onTermChange: vi.fn(),
  termOptions: ['AY 2025-2026', 'AY 2024-2025'],
  searchPlaceholder: 'Search...',
};

describe('SearchFilterBar', () => {
  it('renders search input with correct placeholder', () => {
    render(<SearchFilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders term dropdown with "All Terms" as first option', () => {
    render(<SearchFilterBar {...defaultProps} />);
    expect(screen.getByText('All Terms')).toBeInTheDocument();
  });

  it('renders all provided term options', () => {
    render(<SearchFilterBar {...defaultProps} />);
    expect(screen.getByText('AY 2025-2026')).toBeInTheDocument();
    expect(screen.getByText('AY 2024-2025')).toBeInTheDocument();
  });

  it('calls onSearchChange when user types in search input', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<SearchFilterBar {...defaultProps} onSearchChange={onSearchChange} />);
    await user.type(screen.getByPlaceholderText('Search...'), 'hello');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('calls onTermChange when term is selected', async () => {
    const user = userEvent.setup();
    const onTermChange = vi.fn();
    render(<SearchFilterBar {...defaultProps} onTermChange={onTermChange} />);
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'AY 2025-2026');
    expect(onTermChange).toHaveBeenCalledWith('AY 2025-2026');
  });

  it('reflects controlled searchValue prop', () => {
    render(<SearchFilterBar {...defaultProps} searchValue="test query" />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('hides term dropdown when showTermFilter is false', () => {
    // Component renders select whenever showTermFilter=true (default), regardless of
    // termOptions.length. Pass showTermFilter={false} to suppress it entirely.
    render(<SearchFilterBar {...defaultProps} showTermFilter={false} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
