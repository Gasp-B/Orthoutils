'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';
import styles from '@/app/[locale]/tests/manage/test-form.module.css';

type Option = {
  id: string;
  label: string;
};

type MultiSelectProps = {
  label: string;
  placeholder?: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  allowCreate?: boolean;
  translations: {
    add: string;
    remove: string;
    clear: string;
    close: string;
    emptySelection: string;
    emptyResults: string;
    loading: string;
    searchPlaceholder: string;
    dialogTitle: string;
    dialogHelper: string;
  };
};

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  onSearch,
  isLoading,
  allowCreate = false,
  translations,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedSelected = useMemo(
    () => new Set(selectedValues.map((v) => v.trim())),
    [selectedValues]
  );

  const filteredOptions = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const canCreate = allowCreate && query.trim().length > 0 && 
    !options.some(o => o.label.toLowerCase() === query.trim().toLowerCase()) &&
    !normalizedSelected.has(query.trim());

  const toggleValue = (value: string) => {
    const next = new Set(normalizedSelected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(Array.from(next));
  };

  const handleCreate = () => {
    if (query.trim()) {
      toggleValue(query.trim());
      setQuery('');
    }
  };

  useEffect(() => {
    if (onSearch) onSearch(query);
  }, [query, onSearch]);

  return (
    <div className={styles.multiSelectWrapper} ref={containerRef}>
      <div className={styles.multiSelectHeader}>
        <Label>{label}</Label>
      </div>

      <button
        type="button"
        className={cn(styles.multiSelectControl, isOpen && styles.multiSelectOpen)}
        onClick={() => setIsOpen(true)}
      >
        <div className={styles.multiSelectTokens}>
          {selectedValues.length > 0 ? (
            selectedValues.map((val) => (
              <Badge
                key={val}
                variant="secondary"
                className={styles.token}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleValue(val);
                }}
              >
                {val} <span style={{ marginLeft: 4, opacity: 0.6 }}>×</span>
              </Badge>
            ))
          ) : (
            <span className="text-subtle">{translations.emptySelection}</span>
          )}
        </div>
        <span className={styles.chevron}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.popupLayer}>
          <div className={styles.popupBackdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.popup} role="dialog">
            <div className={styles.popupHeader}>
              <p className={styles.popupTitle}>{translations.dialogTitle}</p>
              <p className="helper-text">{translations.dialogHelper}</p>
            </div>

            <div className={styles.searchBar}>
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={translations.searchPlaceholder}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
                {translations.clear}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                {translations.close}
              </Button>
            </div>

            <Separator />

            <div className={styles.optionsList}>
              {isLoading && <p className={styles.emptyState}>{translations.loading}</p>}
              
              {!isLoading && filteredOptions.map((option) => {
                const isSelected = normalizedSelected.has(option.label);
                return (
                  <button
                    key={option.id || option.label}
                    type="button"
                    className={cn(styles.optionItem, isSelected && styles.optionItemActive)}
                    onClick={() => toggleValue(option.label)}
                  >
                    <span className={styles.optionLabel}>{option.label}</span>
                    <Badge variant={isSelected ? 'default' : 'outline'}>
                      {isSelected ? translations.remove : translations.add}
                    </Badge>
                  </button>
                );
              })}

              {!isLoading && filteredOptions.length === 0 && !canCreate && (
                <p className={styles.emptyState}>{translations.emptyResults}</p>
              )}

              {canCreate && (
                <Button type="button" variant="outline" className="w-full justify-start" onClick={handleCreate}>
                  + {translations.add} &quot;{query}&quot;
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}