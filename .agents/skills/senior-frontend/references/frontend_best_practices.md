# Frontend Best Practices

Design systems, accessibility (WCAG 2.2 AA), Tailwind CSS token architecture, and state hygiene.

---

## 1. Accessibility Invariants (WCAG 2.2 AA)

1. **Touch Targets**:
   - All interactive controls (buttons, links, rating pills) must have a minimum bounding target size of **44 × 44 px** on touch devices (`min-h-[44px] min-w-[44px]`).
2. **Focus Visibility**:
   - Never remove outline without replacing it with an explicit visible focus ring:
     `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`.
3. **Color Alone is Never State**:
   - Combine color with an icon and textual label:
     `Again` button = Red background + ❌ Icon + "Again (1)" text.
4. **Keyboard Accessibility**:
   - Ensure complete operation without a pointing device:
     - `Space` / `Enter`: Flip flashcard
     - `1` / `2` / `3` / `4`: Submit rating
     - `Ctrl + Z`: Undo last rating
     - `Esc`: Close modal or dismiss study session

---

## 2. Tailwind CSS Token System & Dark Mode

- **Semantic Tokens**: Use purpose-driven utility classes (`bg-slate-900`, `text-slate-100`, `border-slate-800`) over arbitrary color values.
- **Dark Mode Strategy**: Use CSS class-based dark mode (`<html class="dark">`).
- **Synchronized Theme Provider**:
  ```tsx
  export function ThemeToggle() {
    const toggleTheme = () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.theme = isDark ? 'dark' : 'light';
    };
    return (
      <button onClick={toggleTheme} aria-label="Toggle dark mode" className="p-2 rounded-xl">
        {/* Sun / Moon icons */}
      </button>
    );
  }
  ```

---

## 3. Form Validation & UX Feedback

1. **Inline Validation**:
   - Validate form inputs with Zod schemas. Display error text directly below the offending input field with `role="alert"`.
2. **Disabled vs Loading Buttons**:
   - Do not disable submit buttons without visual indication. Show a spinner and set `aria-busy="true"`:
     ```tsx
     <Button disabled={isSubmitting} aria-busy={isSubmitting}>
       {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" /> : null}
       Save Deck
     </Button>
     ```
