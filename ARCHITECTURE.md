# Dream Home Calc - Architecture & Contribution Rules

## 1. Architectural Patterns
To maintain a scalable and secure application, this project strictly adheres to the following patterns:

* **Strict Service Layer (Repository Pattern):** React components must **NEVER** import `supabaseClient.ts` directly. All database interactions and API calls must live inside `src/services/` (e.g., `projectService.ts`, `proService.ts`). React components should only call these services or custom hooks.
* **Component Segregation:**
  * `src/components/ui/`: Dumb, reusable components (Buttons, Cards, Inputs). Do not put business logic here.
  * `src/components/layout/`: Global structure (Headers, Footers).
  * `src/features/`: Complex, domain-specific modules (Auth, Dashboards, Calculators).
* **Strategy Pattern for Calculators:** As we add more construction calculators (Plumbing, Electrical, Flooring), they must be isolated in their own files under `src/features/construction/` and mapped via a strategy/tab manager (`CalculatorTabs.tsx`). Do not bloat a single file with multiple calculator logic.

## 2. UI/UX Guidelines (Tailwind CSS)
* **Design System First:** Always use the pre-built components in `src/components/ui/` (e.g., `<Button>`, `<Card>`, `<Input>`) instead of writing raw HTML elements with repeated Tailwind classes. 
* **Theming:** Stick to the established color variables. If global adjustments are needed, modify `tailwind.config.js` or `src/styles/global.css`, do not hardcode hex colors in components.

## 3. Deployment & Branching Protocol
1. **Never commit directly to `main` or `develop`.**
2. **`main`** is strictly mapped to the Production Firebase Hosting site.
3. **`develop`** should be mapped to a Staging/Preview environment.
4. All work is done on `feature/*` or `fix/*` branches.
5. Pull Requests require `build` and `lint` checks to pass before merging.