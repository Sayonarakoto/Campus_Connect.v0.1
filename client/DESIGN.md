# Campus Connect — Design System

## 1. Overview
Campus Connect uses a **clean, institutional design** with a deep navy + warm amber palette. The design prioritizes clarity, readability, and professional appearance for an academic environment.

**Design Philosophy:** Clean, card-based layouts with subtle depth. No flashy animations. Information density with clear visual hierarchy.

---

## 2. Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-color` | `#1e3a8a` | Deep Navy — primary buttons, headers, sidebar |
| `--primary-dark` | `#172554` | Darker navy for emphasis |
| `--primary-hover` | `#1e40af` | Hover state for primary buttons |
| `--primary-light` | `#dbeafe` | Light blue backgrounds, active nav items |
| `--primary-gradient` | `linear-gradient(135deg, #1e3a8a, #1e40af)` | Gradient buttons |

### Secondary / Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--secondary-color` | `#d97706` | Warm Amber — accent borders, badges, highlights |
| `--secondary-hover` | `#b45309` | Hover state for secondary |
| `--secondary-light` | `#fef3c7` | Light amber backgrounds, warning badges |

### Background Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-canvas` | `#f8fafc` | Main page background (slate-50) |
| `--bg-surface` | `#ffffff` | Cards, panels, modals |
| `--bg-subtle` | `#f1f5f9` | Hover states, table headers (slate-100) |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-dark` | `#0f172a` | Headings, primary text (slate-900) |
| `--text-secondary` | `#475569` | Body text, labels (slate-600) |
| `--text-muted` | `#64748b` | Descriptions, timestamps (slate-500) |
| `--text-light` | `#94a3b8` | Placeholders, icons (slate-400) |

### Status Colors
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Success | `#dcfce7` | `#16a34a` | `#bbf7d0` |
| Danger | `#fee2e2` | `#dc2626` | `#fecaca` |
| Warning | `#fef3c7` | `#d97706` | `#fde68a` |
| Info | `#dbeafe` | `#2563eb` | `#bfdbfe` |

### Border Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-color` | `#e2e8f0` | Standard borders (slate-200) |
| `--border-focus` | `#3b82f6` | Focus rings (blue-500) |

---

## 3. Typography

- **Primary font:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`)
- **Heading weight:** 700 (bold)
- **Body weight:** 400 (normal)
- **Label weight:** 500-600 (medium/semibold)

### Type Scale
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title (h1) | 1.5-2rem | 700 | `#0f172a` |
| Section title (h2/h3) | 1.1-1.25rem | 700 | `#0f172a` |
| Card title (h3/h4) | 1rem | 600 | `#1e293b` |
| Body text | 0.9-1rem | 400 | `#334155` |
| Labels | 0.85rem | 600 | `#374151` |
| Small/muted | 0.78-0.85rem | 400 | `#64748b` |
| Badge text | 0.78-0.85rem | 600 | varies by status |

---

## 4. Spacing & Layout

### Spacing Scale
| Token | Value |
|-------|-------|
| `--space-xs` | 0.25rem (4px) |
| `--space-sm` | 0.5rem (8px) |
| `--space-md` | 1rem (16px) |
| `--space-lg` | 1.5rem (24px) |
| `--space-xl` | 2rem (32px) |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Inputs, small elements |
| `--radius-md` | 10px | Cards, dropdowns |
| `--radius-lg` | 14px | Modals, large cards |
| `--radius-full` | 9999px | Pills, badges, avatars |

### Shadows
| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(15,23,42,0.08)` |
| `--shadow-md` | `0 4px 6px rgba(15,23,42,0.08)` |
| `--shadow-lg` | `0 10px 15px rgba(15,23,42,0.08)` |
| `--shadow-xl` | `0 20px 25px rgba(15,23,42,0.1)` |

---

## 5. Components

### Buttons
```css
/* Primary — Deep Navy gradient */
.btn-primary {
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.7rem 1.4rem;
  font-weight: 600;
}

/* Secondary — Light gray */
.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
}

/* Success — Emerald */
.btn-success {
  background: #059669;
  color: white;
}

/* Danger — Red */
.btn-danger {
  background: #dc2626;
  color: white;
}
```

### Cards
```css
.admin-card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid #f1f5f9;
  padding: 1.25rem;
}
```

### Status Badges
```css
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}
/* Apply status-specific bg/color classes */
```

### Form Inputs
```css
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  background: #f8fafc;
  transition: all 0.2s;
}
.form-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
```

### Modals
```css
.confirm-modal-overlay {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
}
.confirm-modal-card {
  background: white;
  border-radius: 20px;
  max-width: 460px;
}
```

---

## 6. Page Layout Pattern

Every admin/dashboard page follows this structure:
```jsx
<div className="workspace-container">
  <div className="page-header">
    <div>
      <h1>Page Title</h1>
      <p className="subtitle">Description</p>
    </div>
    <span className="request-count">{count} Pending</span>
  </div>
  
  {/* Filter bar */}
  <section className="filter-card">...</section>
  
  {/* Content */}
  <div className="admin-grid">
    {items.map(item => (
      <div key={item._id} className="admin-card">
        {/* Card content */}
      </div>
    ))}
  </div>
</div>
```

---

## 7. Do's and Don'ts

### Do:
- Use CSS variables from `index.css` — never hardcode hex values inline
- Use card-based layouts with `admin-card` pattern
- Use `ConfirmModal` for all alerts/confirms
- Use status badge classes for consistent coloring
- Keep spacing consistent with the spacing scale

### Don't:
- Don't use `window.alert/confirm/prompt`
- Don't use Bootstrap or Tailwind classes
- Don't use inline styles for colors — use CSS classes
- Don't add new `:root` declarations
- Don't use pure white `#ffffff` for text on dark backgrounds — use `#e2e2e2`
