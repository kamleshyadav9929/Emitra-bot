# The Design System: Institutional Elegance

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Bureau"**
This design system moves away from the sterile, "template-like" appearance of government portals and toward a high-end editorial experience. We are building a "Digital Bureau"—an environment that feels authoritative, stable, and impeccably organized. 

The system rejects the rigid, boxy grid in favor of **Intentional Asymmetry** and **Tonal Depth**. By utilizing wide margins, sophisticated overlapping elements, and a hierarchy driven by font-scale drama rather than lines, we create an interface that feels like a premium concierge service rather than a cluttered form repository. It is institutional, but human; trustworthy, but modern.

---

## 2. Colors: The Tonal Architecture
Our palette is a sophisticated suite of "Bureau Blues" and "Architectural Whites." The goal is to use color to define space, not just decoration.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section content. Boundaries must be defined through background color shifts. Use `surface-container-low` for secondary areas and `surface` for the main canvas. If two areas must be separated, use a change in tonal value, never a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of heavy-stock paper.
*   **Base:** `surface` (#f3faff)
*   **Structural Sections:** `surface-container-low` (#e6f6ff)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Accents/Floating Elements:** `surface-container-highest` (#cfe6f2)

### The "Glass & Gradient" Rule
To elevate the institutional feel, use **Glassmorphism** for floating elements (e.g., search bars or sticky headers). Use `surface` at 80% opacity with a `backdrop-filter: blur(12px)`. For main CTAs, apply a subtle linear gradient from `primary` (#003f87) to `primary_container` (#0056b3) at a 135-degree angle to provide a "lit from within" professional polish.

---

## 3. Typography: Editorial Authority
We utilize a pairing of **Public Sans** (for structural authority) and **Inter** (for high-density readability).

*   **Display & Headlines (Public Sans):** Use `display-lg` (3.5rem) and `headline-md` (1.75rem) with tighter letter-spacing (-0.02em) to create an "editorial header" feel for news and service titles.
*   **Body & Forms (Inter):** Use `body-md` (0.875rem) for form labels and data tables. The higher x-height of Inter ensures that even dense service listings remain legible.
*   **Hierarchy Tip:** Contrast a `display-sm` headline with a `label-md` uppercase subheader in `primary` color to create a clear entry point for the user’s eye.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "web 2.0." We achieve depth through atmospheric perspective.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container` (#dbf1fe) background. This creates a natural, soft lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., a modal), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(7, 30, 39, 0.06);`. The shadow color is a tinted version of `on_surface`, making it feel like real light.
*   **The Ghost Border:** If accessibility requires a container definition, use `outline_variant` (#c2c6d4) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Precision & Clarity

### Data Tables (The "Ghost" List)
*   **No Borders:** Forbid horizontal and vertical lines.
*   **Alternating Tones:** Use `surface-container-low` for zebra-striping.
*   **Status Badges:** Use `tertiary_fixed` (#ffdcbe) for "Pending" and a custom soft green for "Available." Badges should have a `border-radius: xl` (0.75rem) and use `label-md` bold typography.

### Form Layouts & Inputs
*   **Input Style:** Large, breathable fields using `surface-container-lowest`. 
*   **Focus State:** Instead of a thick border, use a 2px outer glow of `secondary_fixed` (#dee0ff) and shift the background to `surface_bright`.
*   **Padding:** Use generous vertical padding (1rem) to ensure the forms feel "premium" and approachable.

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. `border-radius: md` (0.375rem).
*   **Secondary:** Ghost style. No background, `on_primary_fixed_variant` text, and a `surface-variant` background on hover.
*   **Tertiary:** `label-md` all-caps with a 2px underline in `surface_tint`.

### Search Bars
*   **The Floating Bar:** Position the search bar as a floating element using Glassmorphism. Use `surface_container_lowest` at 90% opacity with a `xl` corner radius.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use `primary_fixed` (#d7e2ff) as a background for high-priority news cards to make them pop against the `surface` background.
*   **Do** use `tertiary` (#623700) sparingly for alerts; its earthy tone feels more authoritative and less "alarming" than bright orange.
*   **Do** embrace white space. If a section feels crowded, increase the padding rather than adding a divider line.

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#071e27) to maintain the sophisticated blue-tinted depth.
*   **Don't** use the `DEFAULT` (0.25rem) roundedness for everything. Use `xl` (0.75rem) for large containers and `md` for interactive elements to create a "nested" visual language.
*   **Don't** use high-contrast transitions. All shifts in background color should be subtle and harmonious.