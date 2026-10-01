'use client';

import React from 'react';
import { CATEGORIES, SortOption } from '@/types/confession';
import { Search, X } from 'lucide-react';

interface CategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
  searchQuery,
  onSearchChange,
  categoryCounts,
}) => {
  const allFilterOptions = CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

  return (
    <div className="w-full mb-4 space-y-3">
      {/* Mobile-only Category Tabs (Hidden on Desktop since it's in the Left Sidebar) */}
      <div
        className="lg:hidden flex items-center justify-between border-b gap-2 pb-0.5 overflow-x-auto no-scrollbar"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3 shrink-0">
          {allFilterOptions.map((opt) => {
            const isSelected = selectedCategory === opt.id;
            const count = categoryCounts[opt.id] ?? 0;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectCategory(opt.id)}
                className="py-2 text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer relative"
                style={{
                  color: isSelected ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span>{opt.label}</span>
                {count > 0 && (
                  <span
                    className="ml-1 text-[10px] font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {count}
                  </span>
                )}
                {isSelected && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile sort toggles */}
        <div
          className="flex items-center gap-1.5 text-xs shrink-0 pl-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <button
            type="button"
            onClick={() => onSelectSort('newest')}
            className="transition-colors cursor-pointer"
            style={{
              color: selectedSort === 'newest' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: selectedSort === 'newest' ? 600 : 400,
            }}
          >
            Νέα
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onSelectSort('likes')}
            className="transition-colors cursor-pointer"
            style={{
              color: selectedSort === 'likes' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: selectedSort === 'likes' ? 600 : 400,
            }}
          >
            Top
          </button>
        </div>
      </div>

      {/* Top Feed Bar (Search + Desktop Sort + Filter Label) */}
      <div className="flex items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Αναζήτηση σκέψεων..."
            className="w-full rounded-xl pl-9 pr-8 py-2 text-xs outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Desktop-only Sort Selector */}
        <div
          className="hidden lg:flex items-center gap-2 text-xs shrink-0 px-3 py-2 rounded-xl transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <button
            type="button"
            onClick={() => onSelectSort('newest')}
            className="transition-colors cursor-pointer"
            style={{
              color: selectedSort === 'newest' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: selectedSort === 'newest' ? 600 : 400,
            }}
          >
            Νεότερα
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onSelectSort('likes')}
            className="transition-colors cursor-pointer"
            style={{
              color: selectedSort === 'likes' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: selectedSort === 'likes' ? 600 : 400,
            }}
          >
            Κορυφαία
          </button>
        </div>
      </div>
    </div>
  );
};
