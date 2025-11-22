@@ -7,148 +7,250 @@ import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { testsResponseSchema, testSchema, taxonomyResponseSchema, type TestDto } from '@/lib/validation/tests';
import styles from './test-form.module.css';

type MultiSelectOption = { label: string; value: string };

type MultiSelectProps = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
};

type PopupPosition = { top: number; left: number; width: number } | null;

function MultiSelect({ id, label, description, placeholder, options, values, onChange }: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );

  function toggleValue(value: string) {
    const hasValue = values.includes(value);
    const next = hasValue ? values.filter((item) => item !== value) : [...values, value];
    onChange(next);
  }

  function closePopup() {
    setIsOpen(false);
  }

  function updatePopupPosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPopupPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    updatePopupPosition();
    const handleResize = () => updatePopupPosition();
    const handleScroll = () => updatePopupPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      if (!isOpen) return;
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (overlayRef.current?.contains(target)) return;
      closePopup();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePopup();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.multiSelectWrapper} ref={wrapperRef}>
      <div className={styles.multiSelectHeader}>
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="helper-text">{description}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        className={cn(styles.multiSelectControl, isOpen && styles.multiSelectOpen)}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-haspopup="dialog"
        ref={triggerRef}
      >
        <div className={styles.multiSelectTokens}>
          {values.length === 0 && <span className="text-subtle">{placeholder ?? 'Sélectionner'}</span>}
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className={styles.token}
              onClick={(event) => {
                event.stopPropagation();
                toggleValue(value);
              }}
            >
              {value}
              <span aria-hidden>×</span>
            </Badge>
          ))}
          {values.length === 0 ? (
            <span className="text-subtle">{placeholder ?? 'Sélectionner'}</span>
          ) : (
            values.map((value) => (
              <Badge
                key={value}
                variant="secondary"
                className={styles.token}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleValue(value);
                }}
              >
                {value}
                <span aria-hidden>×</span>
              </Badge>
            ))
          )}
        </div>
        <span className={styles.chevron} aria-hidden>
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen ? (
        <div className={styles.multiSelectDropdown} role="listbox" aria-label={label}>
          <div className={styles.multiSelectSearch}>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder ?? 'Rechercher…'}
              aria-label={`Filtrer ${label}`}
            />
          </div>
        <div className={styles.popupLayer}>
          <div className={styles.popupBackdrop} aria-hidden onClick={closePopup} />
          <div
            className={styles.popup}
            ref={overlayRef}
            style={popupPosition ? { top: popupPosition.top, left: popupPosition.left, width: popupPosition.width } : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={`Sélectionner ${label}`}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>Sélectionner {label.toLowerCase()}</div>
              <p className="helper-text">Tapez pour filtrer, cliquez pour ajouter ou retirer.</p>
            </div>

            <div className={styles.searchBar}>
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder ?? 'Rechercher…'}
                aria-label={`Filtrer ${label}`}
              />
              {query ? (
                <Button variant="ghost" size="sm" type="button" onClick={() => setQuery('')}>
                  Effacer
                </Button>
              ) : null}
            </div>

            <div className={styles.selectedBadges}>
              {selectedOptions.length === 0 ? (
                <p className="helper-text">Aucun élément sélectionné pour le moment.</p>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    className={styles.selectedToken}
                    onClick={() => toggleValue(option.value)}
                  >
                    {option.label}
                    <span aria-hidden>×</span>
                  </Badge>
                ))
              )}
            </div>

          <div className={styles.optionsList}>
            {filtered.length === 0 ? (
              <p className={styles.emptyState}>Aucun résultat</p>
            ) : (
              filtered.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={cn(styles.optionItem, values.includes(option.value) && styles.optionItemActive)}
                  onClick={() => toggleValue(option.value)}
                >
                  <span>{option.label}</span>
                  {values.includes(option.value) ? <Badge variant="outline">Sélectionné</Badge> : null}
                </button>
              ))
            )}
            <div className={styles.optionsList}>
              {filtered.length === 0 ? (
                <p className={styles.emptyState}>Aucun résultat</p>
              ) : (
                filtered.map((option) => {
                  const active = values.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={cn(styles.optionItem, active && styles.optionItemActive)}
                      onClick={() => toggleValue(option.value)}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionBadge}>{active ? 'Supprimer' : 'Ajouter'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const formSchema = testSchema
  .omit({ id: true, slug: true, createdAt: true, updatedAt: true })
  .extend({
    id: z.string().uuid().optional(),
    shortDescription: z.string().nullable().optional(),
    objective: z.string().nullable().optional(),
    population: z.string().nullable().optional(),
    materials: z.string().nullable().optional(),
    publisher: z.string().nullable().optional(),
    priceRange: z.string().nullable().optional(),
    buyLink: z.string().url().nullable().optional(),
    notes: z.string().nullable().optional(),
    ageMinMonths: z.number().int().nullable().optional(),
    ageMaxMonths: z.number().int().nullable().optional(),
  durationMinutes: z.number().int().nullable().optional(),
  bibliography: z
    .array(
      z.object({
