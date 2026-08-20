# Contextual Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve a guest's hall, banquet menu, and salad choices through `/booking`, enforce the confirmed banquet-hall minimums, and send the exact context to Telegram without changing the CRM schema.

**Architecture:** Pure booking-domain modules own the public URL contract, banquet-menu metadata, hall normalization, and validation. A thin client adapter reads `useSearchParams`; `BookingForm` receives a validated initial context and continues to use the existing CRM/Telegram submission path. Public hall pages and contextual CTAs use the same URL builder, so SEO routes and booking behavior cannot drift apart.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript 5.9, Vitest 2, Supabase CRM/content, Telegram Bot API, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-20-contextual-booking-design.md`

## Global Constraints

- User-facing copy must say **«Банкетное меню»**; do not call a menu variant a «сет» or «пакет» in buttons, summaries, metadata, CRM comments, or Telegram.
- Banquet menu IDs remain exactly `conga-7500`, `conga-6000`, and `kucher-5000`.
- Conga allows only `conga-7500` and `conga-6000`; every other hall allows all three menu IDs.
- The exact banquet halls are `emerald` / 30 guests / 70 000 ₽, `ruby` / 18 guests / 45 000 ₽, and `chocolate` / 30 guests / 70 000 ₽.
- Capacity is informational and must never participate in `canSubmit`.
- `onsite` is unavailable for Emerald, Ruby, and Chocolate; their permitted types are `preorder` and `banquet`.
- For those three halls, `preorder` compares the food-cart total with the hall minimum; `banquet` compares menu price × adults with the hall minimum; children do not affect the calculation.
- The three exact halls share the current CRM UUID for «Банкетные залы», while Telegram and `composedComment` contain the exact public hall name.
- Do not change the CRM schema, availability logic, prepayment flow, or the success rule `crmOk || telegramOk`.
- URL context contains no names, phones, dates, times, or other personal data.
- Preserve all pre-existing dirty-worktree changes. Before touching a modified file, inspect `git diff -- <path>`; stage only feature hunks with `git add -p -- <path>`, then verify `git diff --cached --name-only` and `git diff --cached` before every commit.

---

## File Map

### New domain files

- `lib/booking/bookingContext.ts` — whitelist, parse, normalize, and build the public `/booking` query contract.
- `lib/booking/bookingContext.test.ts` — URL round-trip and hostile/obsolete parameter tests.
- `lib/booking/hallCatalog.ts` — convert merged site halls into stable public booking halls and split the generic banquet hall.
- `lib/booking/hallCatalog.test.ts` — exact-hall capacities, shared CRM ID, compatibility, and deduplication tests.
- `lib/booking/bookingSelection.ts` — pure initial-form and hall-change transitions.
- `lib/booking/bookingSelection.test.ts` — context initialization, idempotence, and incompatible-menu clearing tests.
- `app/booking/BookingContextAdapter.tsx` — client-only `useSearchParams` adapter around `BookingForm`.
- `lib/halls/publicHallPosts.ts` — canonical public hall definitions and legacy-content materialization.
- `lib/halls/publicHallPosts.test.ts` — exact detail slugs, fallback content, and legacy duplicate filtering.

### Existing booking files

- `lib/booking/banquetPackages.ts` — typed menu IDs, stable salad IDs, labels, prices, and completeness helpers.
- `lib/booking/rules.ts` — hall policy, flat banquet-hall minimums, and amount status.
- `app/booking/page.tsx` — normalize halls once and render the client adapter inside `Suspense`.
- `app/booking/BookingForm.tsx` — apply initial context once, store hall key separately from CRM ID, preserve compatible choices, and submit structured context.
- `app/components/HallSelector.tsx` — select by `BookingHall.key` and expose capacity as information only.
- `app/components/BookingTypeSelector.tsx` — display the hall-specific disabled reason and minimum-order status already produced by rules.
- `app/components/BanquetMenuModal.tsx` — select salads by stable ID, restore an initial selection, and use contextual confirmation copy.
- `app/menu/MenuClient.tsx` — make `/menu#banquet` selectable and navigate with the shared booking URL builder.

### Existing output and public-page files

- `lib/booking/composeReservation.ts`, `lib/booking/formatTelegram.ts`, `app/api/telegram/route.ts` — structured hall/menu/salad/amount/source fields.
- `app/halls/page.tsx`, `app/halls/HallsClient.tsx`, `app/halls/[slug]/page.tsx` — exact public hall cards, detail pages, and hall CTAs.
- `app/events/[slug]/page.tsx`, `app/promotions/page.tsx`, `app/faq/page.tsx`, `app/components/forest/site.ts`, `app/redesign/ForestBloom.tsx` — audited generic or contextual booking links.
- `next.config.js`, `app/sitemap.ts`, and their tests — canonical redirects and sitemap entries.

---

### Task 1: Typed Banquet Menus and Stable Salad IDs

**Files:**
- Modify: `lib/booking/banquetPackages.ts`
- Modify: `lib/booking/banquetPackages.test.ts`
- Modify: `app/components/BanquetMenuModal.tsx` only after the domain tests pass

**Interfaces:**
- Consumes: existing menu IDs `conga-7500`, `conga-6000`, `kucher-5000`.
- Produces: `BanquetPackageId`, `BanquetSaladId`, `BANQUET_PACKAGES`, `getBanquetPackage()`, `normalizeBanquetSelection()`, `isBanquetSelectionComplete()`, and `banquetSaladNames()`.

- [ ] **Step 1: Write failing catalog tests**

Add these cases to `lib/booking/banquetPackages.test.ts`:

```ts
import {
  banquetSaladNames,
  getBanquetPackage,
  isBanquetSelectionComplete,
  normalizeBanquetSelection,
} from './banquetPackages';

it('normalizes salad ids, removes duplicates, and limits the required count', () => {
  expect(normalizeBanquetSelection('conga-6000', [
    'caesar-shrimp',
    'caesar-shrimp',
    'kucher',
    'olivier-beef',
    'duck-fruit-chutney',
  ])).toEqual({
    packageId: 'conga-6000',
    saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
  });
});

it('rejects unknown salads and salads unavailable in the selected menu', () => {
  expect(normalizeBanquetSelection('kucher-5000', [
    'duck-fruit-chutney',
    'unknown',
    'olivier-beef',
  ])).toEqual({ packageId: 'kucher-5000', saladIds: ['olivier-beef'] });
});

it('requires the exact salad count and resolves ids to public names', () => {
  expect(isBanquetSelectionComplete('conga-7500', [
    'caesar-shrimp', 'kucher', 'olivier-beef', 'duck-fruit-chutney',
  ])).toBe(true);
  expect(isBanquetSelectionComplete('conga-7500', ['caesar-shrimp'])).toBe(false);
  expect(banquetSaladNames('conga-6000', ['caesar-shrimp', 'kucher'])).toEqual([
    'Цезарь с креветками',
    'Кучер',
  ]);
  expect(getBanquetPackage('conga-6000')?.pricePerPerson).toBe(6000);
});
```

- [ ] **Step 2: Run the tests and verify the new exports are missing**

Run:

```powershell
npm test -- lib/booking/banquetPackages.test.ts
```

Expected: FAIL because the four new catalog helpers are not exported.

- [ ] **Step 3: Move salad metadata into the domain catalog**

Replace stringly typed menu/salad metadata in `lib/booking/banquetPackages.ts` with these public types and helpers:

```ts
export type BanquetPackageId = 'conga-7500' | 'conga-6000' | 'kucher-5000';
export type BanquetSaladId =
  | 'caesar-shrimp'
  | 'caesar-chicken'
  | 'kucher'
  | 'olivier-red-fish'
  | 'olivier-beef'
  | 'duck-fruit-chutney';

export type BanquetSalad = {
  id: BanquetSaladId;
  name: string;
  description?: string;
  grams: number;
};

export interface BanquetPackage {
  id: BanquetPackageId;
  venue: 'conga' | 'kucher';
  name: string;
  pricePerPerson: number;
  weightGrams: number;
  requiredSalads: number;
  salads: readonly BanquetSalad[];
}

export function getBanquetPackage(id: string | null | undefined): BanquetPackage | null {
  return BANQUET_PACKAGES.find((item) => item.id === id) ?? null;
}

export function normalizeBanquetSelection(
  packageId: string | null | undefined,
  saladIds: readonly string[],
): { packageId: BanquetPackageId | null; saladIds: BanquetSaladId[] } {
  const menu = getBanquetPackage(packageId);
  if (!menu) return { packageId: null, saladIds: [] };
  const allowed = new Set(menu.salads.map((salad) => salad.id));
  const unique = [...new Set(saladIds)].filter((id): id is BanquetSaladId => allowed.has(id as BanquetSaladId));
  return { packageId: menu.id, saladIds: unique.slice(0, menu.requiredSalads) };
}

export function isBanquetSelectionComplete(packageId: string | null, saladIds: readonly string[]): boolean {
  const menu = getBanquetPackage(packageId);
  const normalized = normalizeBanquetSelection(packageId, saladIds);
  return Boolean(menu && normalized.saladIds.length === menu.requiredSalads);
}

export function banquetSaladNames(packageId: string | null, saladIds: readonly string[]): string[] {
  const menu = getBanquetPackage(packageId);
  if (!menu) return [];
  const byId = new Map(menu.salads.map((salad) => [salad.id, salad.name]));
  return normalizeBanquetSelection(packageId, saladIds).saladIds.map((id) => byId.get(id)!);
}
```

Populate all six salad records with the existing names, descriptions, and weights. Conga 7500 requires 4 salads; Conga 6000 and Kucher 5000 require 3. Kucher must not include `duck-fruit-chutney`. Change menu `name` values to `Conga — банкетное меню 7500 ₽/чел`, `Conga — банкетное меню 6000 ₽/чел`, and `Кучер — банкетное меню 5000 ₽/чел`.

- [ ] **Step 4: Make the modal consume the catalog without changing behavior yet**

Delete the local `SALADS` record from `app/components/BanquetMenuModal.tsx`. Use `getBanquetPackage(pkgId)`, store `BanquetSaladId[]`, toggle by `salad.id`, and render `salad.name`. Keep the current `selectable`, `hallFilter`, and callback behavior until Task 6.

- [ ] **Step 5: Run tests and type-check**

Run:

```powershell
npm test -- lib/booking/banquetPackages.test.ts
npx tsc --noEmit
```

Expected: both commands PASS.

- [ ] **Step 6: Commit only Task 1 hunks**

```powershell
git add -- lib/booking/banquetPackages.ts lib/booking/banquetPackages.test.ts
git add -p -- app/components/BanquetMenuModal.tsx
git diff --cached --check
git commit -m "feat: add typed banquet menu catalog"
```

---

### Task 2: Stable Booking Hall Catalog

**Files:**
- Create: `lib/booking/hallCatalog.ts`
- Create: `lib/booking/hallCatalog.test.ts`
- Modify: `lib/halls/halls-data.ts`
- Modify: `lib/halls/halls-data.test.ts`

**Interfaces:**
- Consumes: `Hall`, `BookingType`, `HallGroup`, and `BanquetPackageId`.
- Produces: `BookingHall`, `normalizeBookingHalls()`, `bookingHallByKey()`, `bookingHallKeyForName()`, `banquetFilterForHall()`, and `isExactBanquetHall()`.

- [ ] **Step 1: Write the failing normalization tests**

Create `lib/booking/hallCatalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeBookingHalls } from './hallCatalog';

const sharedCrmId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

describe('normalizeBookingHalls', () => {
  it('splits the generic CRM banquet hall into three exact public halls', () => {
    const halls = normalizeBookingHalls([{
      id: sharedCrmId,
      name: 'Банкетные залы',
      capacity: 30,
      description: 'Банкетный комплекс',
      image: '/halls/banquet.webp',
    }]);

    expect(halls.map(({ key, name, capacity, minimumOrder, crmHallId }) => ({
      key, name, capacity, minimumOrder, crmHallId,
    }))).toEqual([
      { key: 'emerald', name: 'Изумрудный зал', capacity: 30, minimumOrder: 70000, crmHallId: sharedCrmId },
      { key: 'ruby', name: 'Рубиновый зал', capacity: 18, minimumOrder: 45000, crmHallId: sharedCrmId },
      { key: 'chocolate', name: 'Шоколадный зал', capacity: 30, minimumOrder: 70000, crmHallId: sharedCrmId },
    ]);
  });

  it('uses distinct UI keys while keeping the same CRM id and allowed types', () => {
    const halls = normalizeBookingHalls([{
      id: sharedCrmId, name: 'Банкетные залы', capacity: 30,
      description: '', image: '/halls/banquet.webp',
    }]);
    expect(new Set(halls.map((hall) => hall.key)).size).toBe(3);
    expect(new Set(halls.map((hall) => hall.crmHallId))).toEqual(new Set([sharedCrmId]));
    expect(halls.every((hall) => hall.allowedBookingTypes.join(',') === 'preorder,banquet')).toBe(true);
    expect(halls.every((hall) => hall.defaultBookingType === 'banquet')).toBe(true);
  });

  it('allows only 6000/7500 in Conga and all menus in other halls', () => {
    const halls = normalizeBookingHalls([
      { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Conga', capacity: 140, description: '', image: '/halls/conga.webp' },
      { id: 'marine-id', name: 'Морской зал', capacity: 52, description: '', image: '/halls/morskoy.webp' },
    ]);
    expect(halls.find((hall) => hall.key === 'conga')?.banquetMenus).toEqual(['conga-7500', 'conga-6000']);
    expect(halls.find((hall) => hall.key === 'marine')?.banquetMenus).toEqual(['conga-7500', 'conga-6000', 'kucher-5000']);
  });
});
```

- [ ] **Step 2: Verify failure**

Run:

```powershell
npm test -- lib/booking/hallCatalog.test.ts
```

Expected: FAIL because `hallCatalog.ts` does not exist.

- [ ] **Step 3: Implement the catalog and exact hall policies**

Create `lib/booking/hallCatalog.ts` around this interface:

```ts
export type BookingHall = Omit<Hall, 'id'> & {
  key: string;
  crmHallId: string | null;
  sourceHallId: string;
  group: HallGroup;
  defaultBookingType?: 'banquet';
  allowedBookingTypes: readonly BookingType[];
  minimumOrder: number | null;
  banquetMenus: readonly BanquetPackageId[];
  detailSlug: string | null;
};

const EXACT_BANQUET_HALLS = [
  { key: 'emerald', name: 'Изумрудный зал', capacity: 30, minimumOrder: 70000, detailSlug: 'izumrudnyj-zal' },
  { key: 'ruby', name: 'Рубиновый зал', capacity: 18, minimumOrder: 45000, detailSlug: 'rubinovyj-zal' },
  { key: 'chocolate', name: 'Шоколадный зал', capacity: 30, minimumOrder: 70000, detailSlug: 'shokoladnyj-zal' },
] as const;

const ALL_MENUS = ['conga-7500', 'conga-6000', 'kucher-5000'] as const;
const CONGA_MENUS = ['conga-7500', 'conga-6000'] as const;

const HALL_KEY_BY_NAME: Record<string, string> = {
  'Conga': 'conga',
  'Морской зал': 'marine',
  'Барный зал': 'bar',
  'Веранда (Кучер)': 'veranda-kucher',
  'Летняя веранда': 'summer-veranda',
  'Беседки (Кучер)': 'gazebos-kucher',
  'Изумрудный зал': 'emerald',
  'Рубиновый зал': 'ruby',
  'Шоколадный зал': 'chocolate',
};

export function bookingHallKeyForName(name: string): string | null {
  return HALL_KEY_BY_NAME[name] ?? null;
}

export function isExactBanquetHall(hall: BookingHall | null | undefined): boolean {
  return hall?.key === 'emerald' || hall?.key === 'ruby' || hall?.key === 'chocolate';
}

export function bookingHallByKey(halls: readonly BookingHall[], key: string | null): BookingHall | null {
  return halls.find((hall) => hall.key === key) ?? null;
}

export function banquetFilterForHall(hall: BookingHall | null): 'conga' | 'all' | null {
  if (!hall) return null;
  return hall.key === 'conga' ? 'conga' : 'all';
}
```

Use the fixed public-name map above; do not derive public keys from arbitrary Unicode text. Detect the generic banquet source by normalized name `банкетные залы`; replace it in-place with the three definitions, copying `description`, `image`, `gallery`, `dbId`, `id → sourceHallId`, and the UUID-shaped `id → crmHallId`.

Export `bookingHallKeyForName(name)` from the same fixed name map and add exact names `Изумрудный зал → emerald`, `Рубиновый зал → ruby`, and `Шоколадный зал → chocolate`. Public hall cards use this helper instead of reimplementing name matching.

- [ ] **Step 4: Keep raw `Hall.id` semantics unchanged**

Do not rename `Hall.id` in `lib/halls/halls-data.ts`; it remains the raw merged source/CRM identifier. Add a test to `lib/halls/halls-data.test.ts` confirming the generic record still leaves `mergeHalls()` intact. The split must happen only in `normalizeBookingHalls()`.

- [ ] **Step 5: Run focused tests and commit**

```powershell
npm test -- lib/booking/hallCatalog.test.ts lib/halls/halls-data.test.ts
npx tsc --noEmit
git add -- lib/booking/hallCatalog.ts lib/booking/hallCatalog.test.ts lib/halls/halls-data.ts lib/halls/halls-data.test.ts
git diff --cached --check
git commit -m "feat: normalize booking hall catalog"
```

Expected: tests and type-check PASS; the commit contains no hall-page or sitemap changes.

---

### Task 3: Public Booking URL Contract

**Files:**
- Create: `lib/booking/bookingContext.ts`
- Create: `lib/booking/bookingContext.test.ts`

**Interfaces:**
- Consumes: `BookingHall[]`, `BookingType`, `BanquetPackageId`, `BanquetSaladId`, and banquet normalization helpers.
- Produces: `BookingContextInput`, `ParsedBookingContext`, `parseBookingContext()`, `buildBookingHref()`, and `bookingSourceLabel()`.

- [ ] **Step 1: Write failing round-trip and hostile-input tests**

Create tests covering these exact results:

```ts
const halls = normalizeBookingHalls([
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Conga', capacity: 140, description: '', image: '/halls/conga.webp' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Банкетные залы', capacity: 30, description: '', image: '/halls/banquet.webp' },
]);

const href = buildBookingHref({
  source: 'banquet-menu',
  bookingType: 'banquet',
  banquetPackageId: 'conga-6000',
  saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
});
expect(href).toBe('/booking?source=banquet-menu&bookingType=banquet&banquetMenu=conga-6000&salad=caesar-shrimp&salad=kucher&salad=olivier-beef');

expect(parseBookingContext(new URLSearchParams(href.split('?')[1]), halls)).toEqual({
  source: 'banquet-menu',
  hallKey: null,
  bookingType: 'banquet',
  banquetPackageId: 'conga-6000',
  saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
  ref: null,
  warnings: [],
});

expect(parseBookingContext(new URLSearchParams(
  'source=hall&hall=missing&bookingType=onsite&banquetMenu=unknown&salad=unknown&ref=../../phone',
), halls)).toEqual({
  source: 'hall', hallKey: null, bookingType: 'onsite', banquetPackageId: null,
  saladIds: [], ref: null, warnings: [],
});
```

Also assert:

```ts
expect(parseBookingContext(new URLSearchParams('source=hall&hall=emerald&bookingType=onsite'), halls))
  .toEqual(expect.objectContaining({
    hallKey: 'emerald',
    bookingType: 'banquet',
    warnings: ['onsite-disabled'],
  }));

expect(parseBookingContext(new URLSearchParams(
  'source=banquet-menu&hall=conga&bookingType=banquet&banquetMenu=kucher-5000&salad=caesar-shrimp',
), halls)).toEqual(expect.objectContaining({
  hallKey: 'conga', banquetPackageId: null, saladIds: [], warnings: ['incompatible-menu'],
}));
```

- [ ] **Step 2: Verify failure**

```powershell
npm test -- lib/booking/bookingContext.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement whitelist parsing and deterministic serialization**

Use these types:

```ts
export type BookingSource = 'hall' | 'banquet-menu' | 'event' | 'promotion' | 'home';
export type BookingContextWarning = 'onsite-disabled' | 'incompatible-menu';

export type BookingContextInput = {
  source?: BookingSource;
  hallKey?: string | null;
  bookingType?: BookingType | null;
  banquetPackageId?: BanquetPackageId | null;
  saladIds?: readonly BanquetSaladId[];
  ref?: string | null;
};

export type ParsedBookingContext = {
  source: BookingSource | null;
  hallKey: string | null;
  bookingType: BookingType | null;
  banquetPackageId: BanquetPackageId | null;
  saladIds: BanquetSaladId[];
  ref: string | null;
  warnings: BookingContextWarning[];
};
```

Build query keys in this fixed order: `source`, `hall`, `bookingType`, `banquetMenu`, repeated `salad`, `ref`. Accept `ref` only when it matches `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. A menu selection forces `bookingType='banquet'`. Validate hall keys against the supplied normalized catalog. Normalize salads through Task 1 helpers, then validate the menu against `hall.banquetMenus` when a hall is present.

- [ ] **Step 4: Add source labels for Telegram**

```ts
export function bookingSourceLabel(source: BookingSource | null): string | null {
  return source === 'hall' ? 'страница зала'
    : source === 'banquet-menu' ? 'банкетное меню'
    : source === 'event' ? 'страница события'
    : source === 'promotion' ? 'страница акции'
    : source === 'home' ? 'главная страница'
    : null;
}
```

- [ ] **Step 5: Run tests and commit**

```powershell
npm test -- lib/booking/bookingContext.test.ts
npx tsc --noEmit
git add -- lib/booking/bookingContext.ts lib/booking/bookingContext.test.ts
git diff --cached --check
git commit -m "feat: add booking URL context contract"
```

---

### Task 4: Hall-Specific Availability and Minimum Order Rules

**Files:**
- Modify: `lib/booking/rules.ts`
- Modify: `lib/booking/rules.test.ts`

**Interfaces:**
- Consumes: `BookingHall` policy and selected menu price.
- Produces: extended `BookingRuleInput.hall`, `BookingRuleInput.banquetMenuPrice`, and `BookingValidation.minimumOrder`.

- [ ] **Step 1: Extend test fixtures with hall policy**

Add boundary cases to `lib/booking/rules.test.ts`:

```ts
const emerald = {
  name: 'Изумрудный зал',
  allowedBookingTypes: ['preorder', 'banquet'] as const,
  minimumOrder: 70000,
};
const ruby = {
  name: 'Рубиновый зал',
  allowedBookingTypes: ['preorder', 'banquet'] as const,
  minimumOrder: 45000,
};

it('disables onsite for exact banquet halls with the configured reason', () => {
  const result = evaluateBooking(base({ hall: emerald, type: 'onsite' }));
  expect(result.availableTypes.find((item) => item.type === 'onsite')).toEqual({
    type: 'onsite',
    allowed: false,
    reason: 'Для этого банкетного зала выберите предзаказ или банкетное меню',
  });
});

it.each([
  [emerald, 69999, false, 1],
  [emerald, 70000, true, 0],
  [ruby, 44999, false, 1],
  [ruby, 45000, true, 0],
])('gates preorder against the flat hall minimum', (hall, cartFoodSum, canSubmit, missing) => {
  const result = evaluateBooking(base({ hall, hallGroup: 'other', type: 'preorder', cartFoodSum }));
  expect(result.canSubmit).toBe(canSubmit);
  expect(result.minimumOrder).toEqual({
    required: hall.minimumOrder,
    current: cartFoodSum,
    missing,
    satisfied: canSubmit,
  });
});

it('calculates banquet amount from price times adults and ignores children', () => {
  const below = evaluateBooking(base({
    hall: emerald, hallGroup: 'other', type: 'banquet', adults: 9, children: 30,
    banquetMenuPrice: 7500,
  }));
  const threshold = evaluateBooking(base({
    hall: emerald, hallGroup: 'other', type: 'banquet', adults: 14, children: 0,
    banquetMenuPrice: 5000,
  }));
  expect(below.minimumOrder).toEqual({ required: 70000, current: 67500, missing: 2500, satisfied: false });
  expect(threshold.minimumOrder).toEqual({ required: 70000, current: 70000, missing: 0, satisfied: true });
});
```

Do not pass capacity into `BookingRuleInput`; add this regression assertion:

```ts
it('does not block a request when adults exceed the displayed capacity', () => {
  const result = evaluateBooking(base({
    hall: emerald,
    hallGroup: 'other',
    type: 'banquet',
    adults: 45,
    children: 0,
    banquetMenuPrice: 5000,
    eventDate: '2026-07-05',
  }));
  expect(result.canSubmit).toBe(true);
  expect(result.blocking.join(' ')).not.toMatch(/вместим|30|45/);
});
```

- [ ] **Step 2: Verify boundary-test failure**

```powershell
npm test -- lib/booking/rules.test.ts
```

Expected: FAIL because `hall`, `banquetMenuPrice`, and `minimumOrder` are not defined.

- [ ] **Step 3: Extend the rule types and combine policies**

Add:

```ts
export type BookingHallPolicy = {
  name: string;
  allowedBookingTypes: readonly BookingType[];
  minimumOrder: number | null;
};

export type MinimumOrderStatus = {
  required: number;
  current: number;
  missing: number;
  satisfied: boolean;
};
```

Extend `BookingRuleInput` with `hall?: BookingHallPolicy | null` and `banquetMenuPrice?: number | null`; extend `BookingValidation` with `minimumOrder: MinimumOrderStatus | null`. Intersect existing adults/date availability with `hall.allowedBookingTypes`. Preserve all existing per-adult preorder rules for non-exact halls. When `hall.minimumOrder` is non-null, replace the `other`-hall admin-contact behavior with the flat hall calculation.

Use exactly this calculation:

```ts
const currentAmount = type === 'preorder'
  ? cartFoodSum
  : type === 'banquet' && banquetMenuPrice
    ? banquetMenuPrice * adults
    : 0;
const minimumOrder = hall?.minimumOrder == null ? null : {
  required: hall.minimumOrder,
  current: currentAmount,
  missing: Math.max(0, hall.minimumOrder - currentAmount),
  satisfied: currentAmount >= hall.minimumOrder,
};
```

If `minimumOrder.satisfied` is false, add one blocking message containing the exact formatted required/current/missing values. If it is true, leave `blocking` empty and retain the status object so the form can show confirmation. Do not inspect `children` or `capacity` in this branch.

- [ ] **Step 4: Run all rule regressions**

```powershell
npm test -- lib/booking/rules.test.ts lib/booking/banquetPackages.test.ts
npx tsc --noEmit
```

Expected: existing date, time, adults, per-adult preorder, and banquet lead-time tests remain PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- lib/booking/rules.ts lib/booking/rules.test.ts
git diff --cached --check
git commit -m "feat: enforce banquet hall minimum orders"
```

---

### Task 5: Initial Context, Hall Changes, and Booking Form Wiring

**Files:**
- Create: `lib/booking/bookingSelection.ts`
- Create: `lib/booking/bookingSelection.test.ts`
- Create: `app/booking/BookingContextAdapter.tsx`
- Modify: `app/booking/page.tsx`
- Modify: `app/booking/BookingForm.tsx`
- Modify: `app/components/HallSelector.tsx`

**Interfaces:**
- Consumes: `ParsedBookingContext`, `BookingHall[]`, catalog helpers, rule output, and menu helpers.
- Produces: `BookingSelection`, `createInitialBookingSelection()`, `changeBookingHall()`, and `BookingForm({ bookingHalls, initialContext })`.

- [ ] **Step 1: Write failing pure state-transition tests**

Create `lib/booking/bookingSelection.test.ts` with these cases:

```ts
const halls = normalizeBookingHalls([
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Conga', capacity: 140, description: '', image: '/halls/conga.webp' },
  { id: 'marine-id', name: 'Морской зал', capacity: 52, description: '', image: '/halls/morskoy.webp' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Банкетные залы', capacity: 30, description: '', image: '/halls/banquet.webp' },
]);

it('initializes hall links in self-service banquet mode once', () => {
  expect(createInitialBookingSelection({
    source: 'hall', hallKey: 'emerald', bookingType: 'banquet',
    banquetPackageId: null, saladIds: [], ref: null, warnings: [],
  }, halls)).toEqual(expect.objectContaining({
    mode: 'self', hallKey: 'emerald', bookingType: 'banquet', adults: 6,
  }));
});

it('restores a menu and salads without inventing a hall', () => {
  expect(createInitialBookingSelection({
    source: 'banquet-menu', hallKey: null, bookingType: 'banquet',
    banquetPackageId: 'conga-6000',
    saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
    ref: null, warnings: [],
  }, halls)).toEqual(expect.objectContaining({
    mode: 'self', hallKey: null, bookingType: 'banquet', adults: 6,
    banquetPackageId: 'conga-6000',
    saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
  }));
});

it('preserves a compatible menu and clears only Conga-incompatible selection', () => {
  const selected: BookingSelection = { mode: 'self', hallKey: 'ruby', bookingType: 'banquet', adults: 10,
    banquetPackageId: 'kucher-5000', saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'], notice: null };
  expect(changeBookingHall(selected, 'marine', halls)).toEqual(expect.objectContaining({
    hallKey: 'marine', banquetPackageId: 'kucher-5000', notice: null,
  }));
  expect(changeBookingHall(selected, 'conga', halls)).toEqual(expect.objectContaining({
    hallKey: 'conga', banquetPackageId: null, saladIds: [], notice: 'incompatible-menu',
  }));
});
```

- [ ] **Step 2: Verify failure**

```powershell
npm test -- lib/booking/bookingSelection.test.ts
```

Expected: FAIL because the selection module does not exist.

- [ ] **Step 3: Implement pure initial and hall-change transitions**

Use this state boundary:

```ts
export type BookingSelection = {
  mode: 'admin' | 'self';
  hallKey: string | null;
  bookingType: BookingType;
  adults: number;
  banquetPackageId: BanquetPackageId | null;
  saladIds: BanquetSaladId[];
  notice: BookingContextWarning | null;
};

export function createInitialBookingSelection(
  context: ParsedBookingContext,
  halls: readonly BookingHall[],
): BookingSelection;

export function changeBookingHall(
  selection: BookingSelection,
  nextHallKey: string | null,
  halls: readonly BookingHall[],
): BookingSelection;
```

`createInitialBookingSelection()` returns the current empty defaults (`admin`, no hall, `onsite`, 2 adults) when every context field is empty. Any valid context switches to `self`. A banquet context starts at 6 adults. `changeBookingHall()` preserves menu/salads only if the target hall permits the menu. Exact banquet halls select `banquet` when the current type is not in their `allowedBookingTypes`; ordinary halls preserve the current allowed type.

- [ ] **Step 4: Add the thin search-param adapter**

Create `app/booking/BookingContextAdapter.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { BookingHall } from '@/lib/booking/hallCatalog';
import { parseBookingContext } from '@/lib/booking/bookingContext';
import BookingForm from './BookingForm';

export default function BookingContextAdapter({ bookingHalls }: { bookingHalls: BookingHall[] }) {
  const searchParams = useSearchParams();
  const initialContext = useMemo(
    () => parseBookingContext(new URLSearchParams(searchParams.toString()), bookingHalls),
    [searchParams, bookingHalls],
  );
  return <BookingForm bookingHalls={bookingHalls} initialContext={initialContext} />;
}
```

In `app/booking/page.tsx`, call `normalizeBookingHalls(await loadHallsServer())` and render the adapter under `<Suspense fallback={...}>`. Keep `dynamic='force-static'` and `revalidate=300`.

- [ ] **Step 5: Re-key `BookingForm` and `HallSelector`**

Initialize all contextual states from one lazy call to `createInitialBookingSelection(initialContext, bookingHalls)`. Store `hallKey`, not `hallId`/`hallName`; derive:

```ts
const selectedHall = bookingHallByKey(bookingHalls, hallKey);
const crmHallId = selectedHall?.crmHallId ?? null;
const hallName = selectedHall?.name ?? null;
```

Pass `selectedHall` into `evaluateBooking()` and `getBanquetPackage(banquetPackageId)?.pricePerPerson` as `banquetMenuPrice`. Pass `banquetFilterForHall(selectedHall)` into `BanquetMenuModal`; remove form-level uses of `banquetPackagesForHall(hallGroup)`. On hall selection, apply `changeBookingHall()` and show the incompatible-menu notice. The notice copy is: `Для зала Conga доступны банкетные меню 6000 и 7500 ₽. Выберите подходящий вариант.`

Render the minimum status below `BookingTypeSelector`:

```tsx
const formatRubles = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

{validation.minimumOrder && (
  <div className="rounded-lg border border-brass/25 bg-brass/10 px-3 py-2 text-xs text-cream/80">
    <p>Минимальная сумма для {selectedHall?.name} — {formatRubles(validation.minimumOrder.required)}</p>
    <p>Сейчас выбрано на {formatRubles(validation.minimumOrder.current)}</p>
    <p>{validation.minimumOrder.satisfied
      ? 'Минимальная сумма достигнута'
      : `До минимальной суммы не хватает ${formatRubles(validation.minimumOrder.missing)}`}</p>
  </div>
)}
```

Change `HallSelector` props to:

```ts
type HallSelectorProps = {
  halls: BookingHall[];
  selectedHallKey: string | null;
  onSelect: (key: string | null) => void;
};
```

Use `hall.key` for carousel selection and `hall.crmHallId ?? hall.sourceHallId` only when adapting a hall for the existing admin editor. Keep the component's internal array for admin refreshes, but initialize it from the `halls` prop and wrap refreshed `mergeHalls(crmHalls, localContent)` with `normalizeBookingHalls()`. Keep the capacity label; do not add maximum validation.

- [ ] **Step 6: Submit exact public and CRM identities**

Keep the existing submission order. Pass `crmHallId` to `createReservation`, `hallName` to both formatters, and preserve `crmOk || telegramOk`. Require exact salad completeness with `isBanquetSelectionComplete()` in both `onSubmit` and `selfSubmitBlocked`. Change all form copy from «пакет» to «Банкетное меню».

- [ ] **Step 7: Run focused tests, full type-check, and commit feature hunks**

```powershell
npm test -- lib/booking/bookingSelection.test.ts lib/booking/bookingContext.test.ts lib/booking/hallCatalog.test.ts lib/booking/rules.test.ts
npx tsc --noEmit
git add -- lib/booking/bookingSelection.ts lib/booking/bookingSelection.test.ts app/booking/BookingContextAdapter.tsx
git add -p -- app/booking/page.tsx app/booking/BookingForm.tsx app/components/HallSelector.tsx
git diff --cached --check
git diff --cached
git commit -m "feat: restore booking context in form"
```

Expected: context is applied through lazy initial state, so later renders cannot overwrite manual guest choices.

---

### Task 6: Select Banquet Menu and Salads from `/menu`

**Files:**
- Modify: `app/components/BanquetMenuModal.tsx`
- Modify: `app/menu/MenuClient.tsx`
- Modify: `lib/booking/banquetPackages.test.ts`
- Modify: `lib/booking/bookingContext.test.ts`

**Interfaces:**
- Consumes: stable menu/salad IDs and `buildBookingHref()`.
- Produces: `BANQUET_MENU_BOOKING_CTA`, modal callback `(packageId: BanquetPackageId, saladIds: BanquetSaladId[])`, restored initial salad selection, and `/menu#banquet → /booking?...` navigation.

- [ ] **Step 1: Add failing initial-selection and menu-link tests**

Add these assertions to the existing domain tests:

```ts
expect(normalizeBanquetSelection('conga-6000', [
  'caesar-shrimp', 'kucher', 'olivier-beef',
])).toEqual({
  packageId: 'conga-6000',
  saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
});

expect(buildBookingHref({
  source: 'banquet-menu', bookingType: 'banquet', banquetPackageId: 'kucher-5000',
  saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
})).toContain('source=banquet-menu&bookingType=banquet&banquetMenu=kucher-5000');
```

Add this failing constant assertion to `lib/booking/banquetPackages.test.ts`:

```ts
expect(BANQUET_MENU_BOOKING_CTA)
  .toBe('Выбрать банкетное меню и перейти к бронированию');
```

- [ ] **Step 2: Verify the new helper test fails**

```powershell
npm test -- lib/booking/banquetPackages.test.ts lib/booking/bookingContext.test.ts
```

Expected: FAIL only because `BANQUET_MENU_BOOKING_CTA` is not exported.

- [ ] **Step 3: Extend modal props and initialize salad IDs**

Export the exact constant from `lib/booking/banquetPackages.ts`, then use:

```ts
export const BANQUET_MENU_BOOKING_CTA = 'Выбрать банкетное меню и перейти к бронированию';
```

Update modal props to:

```ts
type BanquetMenuModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectable?: boolean;
  selectedPackageId?: BanquetPackageId | null;
  selectedSaladIds?: readonly BanquetSaladId[];
  onSelectPackage?: (id: BanquetPackageId, saladIds: BanquetSaladId[]) => void;
  hallFilter?: 'conga' | 'all' | null;
  confirmLabel?: string;
};
```

When the modal opens, seed only the selected package's salad array from `normalizeBanquetSelection(selectedPackageId, selectedSaladIds ?? [])`. Render checkboxes by ID and names from the domain catalog. A menu is confirmable only when `isBanquetSelectionComplete()` returns true.

- [ ] **Step 4: Make `/menu#banquet` a selection flow**

In `MenuClient`, import `useRouter`, `buildBookingHref`, and the typed IDs. Render:

```tsx
<BanquetMenuModal
  isOpen={isBanquetOpen}
  onClose={() => setIsBanquetOpen(false)}
  selectable
  hallFilter="all"
  confirmLabel={BANQUET_MENU_BOOKING_CTA}
  onSelectPackage={(packageId, saladIds) => {
    router.push(buildBookingHref({
      source: 'banquet-menu',
      bookingType: 'banquet',
      banquetPackageId: packageId,
      saladIds,
    }));
  }}
/>
```

In `BookingForm`, pass the current menu and salad IDs back into the same modal and use `confirmLabel="Выбрать банкетное меню"`.

- [ ] **Step 5: Run tests and commit only menu-flow hunks**

```powershell
npm test -- lib/booking/banquetPackages.test.ts lib/booking/bookingContext.test.ts
npx tsc --noEmit
git add -p -- app/components/BanquetMenuModal.tsx app/menu/MenuClient.tsx lib/booking/banquetPackages.test.ts lib/booking/bookingContext.test.ts
git diff --cached --check
git commit -m "feat: carry banquet menu choices into booking"
```

---

### Task 7: Structured Telegram and CRM Comment Context

**Files:**
- Modify: `lib/booking/composeReservation.ts`
- Modify: `lib/booking/composeReservation.test.ts`
- Modify: `lib/booking/formatTelegram.ts`
- Modify: `lib/booking/formatTelegram.test.ts`
- Modify: `app/api/telegram/route.ts`
- Modify: `app/booking/BookingForm.tsx`

**Interfaces:**
- Consumes: exact hall name, menu public name, salad names, minimum status, and source label.
- Produces: separate `Банкетное меню`, `Салаты`, `Расчётная сумма`, `Минимальная сумма зала`, and `Источник` lines.

- [ ] **Step 1: Write failing formatter assertions**

Extend both formatter tests with this input and exact lines:

```ts
const banquetContext = {
  adults: 12,
  children: 4,
  bookingType: 'banquet' as const,
  hallName: 'Изумрудный зал',
  cartItems: [],
  cartFoodSum: 0,
  banquetMenuName: 'Conga — банкетное меню 6000 ₽/чел',
  banquetSaladNames: ['Цезарь с креветками', 'Кучер', 'Оливье с говядиной'],
  calculatedAmount: 72000,
  minimumOrder: 70000,
  source: 'страница зала',
};
```

Assert the output contains:

```text
Тип: Банкетное меню
Зал: Изумрудный зал
Банкетное меню: Conga — банкетное меню 6000 ₽/чел
Салаты: Цезарь с креветками, Кучер, Оливье с говядиной
Расчётная сумма: 72 000 ₽
Минимальная сумма зала: 70 000 ₽
Источник: страница зала
```

Assert neither formatter matches `/банкетный пакет/i`.

- [ ] **Step 2: Verify failure**

```powershell
npm test -- lib/booking/composeReservation.test.ts lib/booking/formatTelegram.test.ts
```

Expected: FAIL because the structured fields do not exist and current output says «Банкетный пакет».

- [ ] **Step 3: Extend formatter inputs without concatenating salads into the menu name**

Add these optional fields to both inputs:

```ts
banquetMenuName?: string | null;
banquetSaladNames?: readonly string[];
calculatedAmount?: number | null;
minimumOrder?: number | null;
source?: string | null;
```

Use `Intl.NumberFormat('ru-RU')` for amounts. Escape every dynamic Telegram field. For `preorder`, send `calculatedAmount=cartFoodSum`; for `banquet`, send `pricePerPerson * adults`. Keep the exact hall public name separate from `crmHallId`.

- [ ] **Step 4: Thread fields through the API payload and form submission**

Rename payload `banquetPackageName` to `banquetMenuName`; add arrays/numbers/source to `BookingPayload`, destructuring, and `formatBookingTelegram()` call in `app/api/telegram/route.ts`. In `BookingForm`, derive salad names with `banquetSaladNames()`, minimum from `selectedHall?.minimumOrder`, and source with `bookingSourceLabel(initialContext.source)`. Derive the amount independently so every structured request is complete:

```ts
const selectedBanquetMenu = getBanquetPackage(banquetPackageId);
const calculatedAmount = effectiveType === 'preorder'
  ? preorderSum
  : effectiveType === 'banquet' && selectedBanquetMenu
    ? selectedBanquetMenu.pricePerPerson * adults
    : null;
```

Do not change stop-list validation, chat selection, CRM-first order, or success handling.

- [ ] **Step 5: Run formatter, API type, and regression tests**

```powershell
npm test -- lib/booking/composeReservation.test.ts lib/booking/formatTelegram.test.ts
npx tsc --noEmit
```

Expected: exact hall/menu/salad/amount/source lines PASS and HTML escaping remains PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- lib/booking/composeReservation.ts lib/booking/composeReservation.test.ts lib/booking/formatTelegram.ts lib/booking/formatTelegram.test.ts
git add -p -- app/api/telegram/route.ts app/booking/BookingForm.tsx
git diff --cached --check
git commit -m "feat: send structured booking context"
```

---

### Task 8: Exact Banquet Hall Cards, Detail Pages, Redirects, and Sitemap

**Files:**
- Create: `lib/halls/publicHallPosts.ts`
- Create: `lib/halls/publicHallPosts.test.ts`
- Modify: `app/halls/page.tsx`
- Modify: `app/halls/HallsClient.tsx`
- Modify: `app/halls/[slug]/page.tsx`
- Modify: `app/halls/[slug]/page.test.ts`
- Modify: `app/sitemap.ts`
- Modify: `app/sitemap.test.ts`
- Modify: `next.config.js`
- Modify: `app/legacy-redirects.test.ts`

**Interfaces:**
- Consumes: exact hall definitions and `buildBookingHref()`.
- Produces: `PublicHallPost`, `expandPublicHallPosts()`, `materializePublicHallPost()`, `isLegacyHallSlug()`, `isExactPublicHallSlug()`, and three canonical pages.

- [ ] **Step 1: Write failing public-hall materialization tests**

Create `lib/halls/publicHallPosts.test.ts`:

```ts
const post = (overrides: Partial<PublicHallPost>): PublicHallPost => ({
  id: 'post-id',
  slug: 'hall',
  title: 'Зал',
  excerpt: null,
  content: null,
  image_url: null,
  published_at: null,
  created_at: '2026-08-20T00:00:00.000Z',
  category: 'halls',
  is_published: true,
  ...overrides,
});

it('replaces legacy banquet posts with three canonical public halls', () => {
  const posts = expandPublicHallPosts([
    post({ id: 'generic', slug: 'banketnye-zaly', title: 'Банкетные залы', image_url: '/halls/banquet.webp' }),
    post({ id: 'ruby-old', slug: 'banketnye-zaly-rubin', title: 'Рубиновый зал' }),
    post({ id: 'conga', slug: 'conga', title: 'Conga' }),
  ]);
  expect(posts.map((item) => item.slug)).toEqual([
    'conga', 'izumrudnyj-zal', 'rubinovyj-zal', 'shokoladnyj-zal',
  ]);
  expect(posts.find((item) => item.slug === 'rubinovyj-zal')).toEqual(expect.objectContaining({
    title: 'Рубиновый зал',
    image_url: expect.any(String),
  }));
});

it('materializes exact halls even when content storage is unavailable', () => {
  expect(materializePublicHallPost('izumrudnyj-zal', null)).toEqual(expect.objectContaining({
    title: 'Изумрудный зал',
    excerpt: expect.stringContaining('30'),
    image_url: '/halls/banquet.webp',
  }));
});
```

- [ ] **Step 2: Verify failure**

```powershell
npm test -- lib/halls/publicHallPosts.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement canonical public hall definitions**

Define exactly:

```ts
export type PublicHallPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  category: string;
  is_published: boolean;
};

export const EXACT_PUBLIC_HALLS = [
  { key: 'emerald', slug: 'izumrudnyj-zal', title: 'Изумрудный зал', capacity: 30, sourceSlugs: ['banketnye-zaly'] },
  { key: 'ruby', slug: 'rubinovyj-zal', title: 'Рубиновый зал', capacity: 18, sourceSlugs: ['banketnye-zaly-rubin', 'banketnye-zaly'] },
  { key: 'chocolate', slug: 'shokoladnyj-zal', title: 'Шоколадный зал', capacity: 30, sourceSlugs: ['banketnye-zaly'] },
] as const;
```

`materializePublicHallPost()` copies the preferred source image/content but replaces title, slug, ID, and excerpt. Fallback excerpt format: `Изумрудный зал для банкетов. Ориентировочная вместимость — 30 гостей; нестандартную рассадку подтвердит администратор.` Use the corresponding title/capacity for each hall. Filter legacy `banketnye-zaly` and `banketnye-zaly-rubin` from public output.

Export `isExactPublicHallSlug(slug)` as a membership check against the three `EXACT_PUBLIC_HALLS` slugs. Make `expandPublicHallPosts()` idempotent: calling it on already expanded data returns one card for each exact slug and no legacy cards.

- [ ] **Step 4: Use exact cards and contextual CTAs on `/halls`**

Call `expandPublicHallPosts()` in both `app/halls/page.tsx` and the realtime reload branch in `HallsClient`. Replace the single wrapping card `<Link>` with `<article>` containing a detail link and a separate button:

```tsx
<Link href={buildBookingHref({
  source: 'hall', hallKey: bookingHallKeyForName(post.title), bookingType: 'banquet',
})}>
  Забронировать этот зал
</Link>
```

Only the three exact banquet halls pass `bookingType:'banquet'`; ordinary hall cards pass `source:'hall'` and `bookingHallKeyForName(post.title)`. If a content title is not in the fixed map, the CTA remains a generic `/booking?source=hall` link without inventing a hall key.

- [ ] **Step 5: Materialize exact detail pages and add the CTA**

In `app/halls/[slug]/page.tsx`, resolve an exact slug before calling the existing content loader: load the preferred legacy source if available, then call `materializePublicHallPost()`. Render this child inside `ForestPostView`:

```tsx
<Link
  href={buildBookingHref({
    source: 'hall', hallKey: bookingHallKeyForName(post.title),
    bookingType: isExactPublicHallSlug(slug) ? 'banquet' : undefined,
  })}
  className="inline-flex rounded-lg bg-terracotta px-6 py-3 font-semibold text-[#FBF3EA]"
>
  Забронировать этот зал
</Link>
```

Extend `app/halls/[slug]/page.test.ts` to assert canonical metadata and booking href for all three exact slugs.

- [ ] **Step 6: Update redirects and sitemap with exact assertions**

Change redirects to:

```js
{ source: '/izumrudnyj-zal', destination: '/halls/izumrudnyj-zal', permanent: true },
{ source: '/rubinovyj-zal', destination: '/halls/rubinovyj-zal', permanent: true },
{ source: '/shokoladnyj-zal', destination: '/halls/shokoladnyj-zal', permanent: true },
{ source: '/halls/banketnye-zaly-rubin', destination: '/halls/rubinovyj-zal', permanent: true },
{ source: '/halls/banketnye-zaly', destination: '/halls', permanent: true },
```

In `sitemap()`, filter both legacy detail paths and append all three canonical paths even when Supabase returns no hall posts. Update tests to assert exact inclusion and legacy exclusion.

- [ ] **Step 7: Run hall/SEO tests and commit only reviewed hunks**

```powershell
npm test -- lib/halls/publicHallPosts.test.ts app/halls/[slug]/page.test.ts app/sitemap.test.ts app/legacy-redirects.test.ts
npx tsc --noEmit
git add -- lib/halls/publicHallPosts.ts lib/halls/publicHallPosts.test.ts
git add -p -- app/halls/page.tsx app/halls/HallsClient.tsx app/halls/[slug]/page.tsx app/halls/[slug]/page.test.ts app/sitemap.ts app/sitemap.test.ts next.config.js app/legacy-redirects.test.ts
git diff --cached --check
git diff --cached
git commit -m "feat: add exact banquet hall booking pages"
```

The cached diff must preserve the already implemented `/foto`, `/vinnaya-karta`, `/biznes-lanch`, FAQ, and menu-hash work.

---

### Task 9: Contextual CTA and Terminology Audit

**Files:**
- Modify: `app/events/[slug]/page.tsx`
- Create: `app/events/[slug]/page.test.ts`
- Modify: `app/promotions/page.tsx`
- Create: `app/promotions/page.test.ts`
- Modify: `app/halls/layout.tsx`
- Modify: `app/halls/HallsClient.tsx`
- Modify: `app/booking/page.tsx`
- Inspect without forced changes: `app/faq/page.tsx`, `app/components/forest/site.ts`, `app/redesign/ForestBloom.tsx`
- Modify: `lib/booking/bookingContext.test.ts`

**Interfaces:**
- Consumes: `buildBookingHref()` and safe `ref` slugs.
- Produces: event/promotion source context and a clean user-facing vocabulary audit.

- [ ] **Step 1: Add failing page-link tests**

Create `app/events/[slug]/page.test.ts` and `app/promotions/page.test.ts`:

```ts
import { expect, it } from 'vitest';
import { eventBookingHref } from './page';

it('builds a safe event booking context', () => {
  expect(eventBookingHref('jazz-vecher')).toBe('/booking?source=event&ref=jazz-vecher');
  expect(eventBookingHref('../../phone')).toBe('/booking?source=event');
});
```

```ts
import { expect, it } from 'vitest';
import { promotionBookingHref } from './page';

it('marks the promotion booking source', () => {
  expect(promotionBookingHref()).toBe('/booking?source=promotion&ref=promotions');
});
```

Run `npm test -- app/events/[slug]/page.test.ts app/promotions/page.test.ts`; expect FAIL because the two page helpers are not exported.

- [ ] **Step 2: Add only known event/promotion context**

Export the small helpers, then add a child CTA to `app/events/[slug]/page.tsx`:

```tsx
export const eventBookingHref = (slug: string) => buildBookingHref({ source: 'event', ref: slug });

<Link href={eventBookingHref(slug)}>
  Забронировать на это событие
</Link>
```

Export `promotionBookingHref = () => buildBookingHref({ source:'promotion', ref:'promotions' })` and use it for the bottom promotion CTA. Do not infer a hall, menu, date, or time from event/promotion copy.

- [ ] **Step 3: Replace variant-level «сет/пакет» wording**

Use `rg` to locate all affected copy:

```powershell
rg -n -i "банкетн(ый|ого|ому|ом)? пакет|банкетные сеты|готовые сеты|залы и сеты|выбран пакет|выбрать этот пакет" app lib --glob "*.tsx" --glob "*.ts"
```

Replace marketing and booking-flow hits with «Банкетное меню». Keep the literal dish-section name `ШАШЛЫЧНЫЙ СЕТ` inside menu composition because it names a food assortment, not one of the three booking variants. Expected final `rg` output: no hits outside internal code comments and the intentional `ШАШЛЫЧНЫЙ СЕТ` headings.

- [ ] **Step 4: Audit every `/booking` link**

Run:

```powershell
rg -n "/booking" app lib --glob "*.tsx" --glob "*.ts"
```

Verify exact-hall, event, promotion, and banquet-menu CTAs use `buildBookingHref()`. Keep header, footer, FAQ, and generic home CTAs as plain `/booking` because the guest has not made a contextual choice there.

- [ ] **Step 5: Test, type-check, and commit**

```powershell
npm test -- lib/booking/bookingContext.test.ts app/events/[slug]/page.test.ts app/promotions/page.test.ts
npx tsc --noEmit
git add -- app/events/[slug]/page.test.ts app/promotions/page.test.ts
git add -p -- app/events/[slug]/page.tsx app/promotions/page.tsx app/halls/layout.tsx app/halls/HallsClient.tsx app/booking/page.tsx lib/booking/bookingContext.test.ts
git diff --cached --check
git commit -m "feat: connect contextual booking CTAs"
```

---

### Task 10: Full Verification, Production Deploy, and Four Booking Journeys

**Files:**
- Verify: all files changed in Tasks 1–9
- Do not create a code commit in this task unless verification exposes a defect; any defect gets its own failing test and fix commit.

**Interfaces:**
- Consumes: completed feature and Vercel project `prj_wPC3L0kv6Ffg5QypOMtEooV5xAC5`.
- Produces: green test/build evidence, production deployment URL, and browser verification of the required journeys.

- [ ] **Step 1: Run targeted suites together**

```powershell
npm test -- lib/booking/banquetPackages.test.ts lib/booking/hallCatalog.test.ts lib/booking/bookingContext.test.ts lib/booking/bookingSelection.test.ts lib/booking/rules.test.ts lib/booking/composeReservation.test.ts lib/booking/formatTelegram.test.ts lib/halls/publicHallPosts.test.ts app/halls/[slug]/page.test.ts app/events/[slug]/page.test.ts app/promotions/page.test.ts app/sitemap.test.ts app/legacy-redirects.test.ts
```

Expected: all focused suites PASS.

- [ ] **Step 2: Run the complete repository gates**

```powershell
npm test
npx tsc --noEmit
npm run build
```

Expected: full Vitest suite PASS, TypeScript exits 0, and Next.js production build exits 0. Record the test-file/test counts and build route summary.

- [ ] **Step 3: Run a local browser smoke test**

Start `npm run dev`, then verify:

```text
/halls/izumrudnyj-zal → CTA → /booking with Emerald + Банкетное меню
/halls/rubinovyj-zal → CTA → /booking with Ruby + Банкетное меню
/menu#banquet → Conga 6000 + 3 salads → /booking with the same menu/salads
/menu#banquet → Kucher 5000 + 3 salads → /booking with menu/salads and no invented hall
```

Also set 45 adults in Emerald and confirm capacity does not block, select an available preorder below the minimum and confirm the exact missing-sum message is shown, then confirm `onsite` remains disabled. The exact 69 999/70 000 ₽ and 44 999/45 000 ₽ boundaries are proven by the focused rule tests from Step 1.

- [ ] **Step 4: Deploy the already-linked Vercel project**

```powershell
npx vercel deploy --prod --yes
```

Expected: deployment reaches `READY` and the production alias remains `https://kucherandconga.ru`.

- [ ] **Step 5: Verify production routes and redirects**

Open the four journeys from Step 3 on `https://kucherandconga.ru`. Additionally verify HTTP redirect chains:

```text
/izumrudnyj-zal → /halls/izumrudnyj-zal → 200
/rubinovyj-zal → /halls/rubinovyj-zal → 200
/shokoladnyj-zal → /halls/shokoladnyj-zal → 200
/halls/banketnye-zaly-rubin → /halls/rubinovyj-zal → 200
/halls/banketnye-zaly → /halls → 200
```

- [ ] **Step 6: Report evidence and preserve unrelated worktree changes**

Run:

```powershell
git status --short
git log -10 --oneline
```

Report the production deployment ID, production URL, passing test counts, build result, and each verified journey. Do not claim Telegram delivery unless a real test application was intentionally sent; formatter tests prove message content without notifying the admin group.
