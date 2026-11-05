# React Patterns

Design patterns and architecture for modern, scalable React 19 / Next.js web applications.

---

## 1. Compound Component Pattern

Enable flexible, accessible UI layouts with shared state without prop-drilling.

```tsx
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: ReactNode }) {
  return <div role="tablist" className="flex border-b border-slate-200 dark:border-slate-800">{children}</div>;
}

export function TabTrigger({ value, label }: { value: string; label: string }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabTrigger must be used within Tabs');
  const isSelected = ctx.activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      onClick={() => ctx.setActiveTab(value)}
      className={clsx(
        'px-4 py-2 font-bold text-sm transition-colors border-b-2',
        isSelected ? 'border-volt-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700'
      )}
    >
      {label}
    </button>
  );
}
```

---

## 2. Optimistic UI Updates Pattern

Provide immediate tactile feedback on user actions before the API confirms the transaction.

```tsx
export function useOptimisticRating(initialDeck: Deck) {
  const [deck, setDeck] = useState(initialDeck);

  const rateCard = async (cardId: string, rating: 1 | 2 | 3 | 4) => {
    // 1. Snapshot previous state for rollback
    const previousDeck = { ...deck };

    // 2. Apply optimistic update immediately (<16ms)
    setDeck((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
      dueToday: Math.max(0, prev.dueToday - 1),
    }));

    // 3. Perform network mutation in background
    try {
      const res = await fetch('/api/study/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, rating }),
      });
      if (!res.ok) throw new Error('Failed to record rating');
    } catch (err) {
      // 4. Rollback to snapshot on error
      setDeck(previousDeck);
      toast.error('Failed to sync review. Reverted change.');
    }
  };

  return { deck, rateCard };
}
```

---

## 3. Finite State Machine for Complex Flows

Use `useReducer` to prevent impossible UI states (e.g. `isFlipped` while loading new card).

```tsx
type StudyState =
  | { status: 'LOADING' }
  | { status: 'QUESTION'; card: Card; isFlipped: false }
  | { status: 'ANSWER'; card: Card; isFlipped: true }
  | { status: 'COMPLETE'; stats: SessionStats };

type StudyAction =
  | { type: 'LOADED'; cards: Card[] }
  | { type: 'FLIP' }
  | { type: 'SUBMIT_RATING'; rating: number }
  | { type: 'FINISH'; stats: SessionStats };

function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (state.status) {
    case 'LOADING':
      if (action.type === 'LOADED') {
        const first = action.cards[0];
        return first ? { status: 'QUESTION', card: first, isFlipped: false } : { status: 'COMPLETE', stats: { total: 0 } };
      }
      return state;
    case 'QUESTION':
      if (action.type === 'FLIP') {
        return { status: 'ANSWER', card: state.card, isFlipped: true };
      }
      return state;
    case 'ANSWER':
      if (action.type === 'SUBMIT_RATING') {
        // Advance to next card or complete
      }
      return state;
    default:
      return state;
  }
}
```
