# Color Customization Guide

All colors in this project are centralized in **TWO files** that must be kept in sync.

## 🎨 Where to Change Colors

### Primary Location: `app/globals.css`

All color variables are defined at the `:root` level in `app/globals.css`. **This is the main source of truth.**

### Secondary Location: `tailwind.config.js`

Tailwind CSS classes (like `bg-primary-500`, `text-accent-green`) get their values from `tailwind.config.js`. **This file must match `globals.css`.**

## ⚠️ IMPORTANT: Change Colors in BOTH Places

When changing colors, you **MUST** update both files:

1. **`app/globals.css`** - Update the CSS variables in `:root`
2. **`tailwind.config.js`** - Update the matching color values

Why two files?
- CSS variables in `globals.css` are used for custom CSS (gradients, semantic colors)
- Tailwind config is used by components via Tailwind classes (like `bg-primary-500`)

## 🔄 Quick Color Change Example

To change the main green color across the entire site:

### Step 1: Update `app/globals.css`
```css
:root {
  /* Change this: */
  --color-accent-green: #10b981;
  
  /* To your desired color: */
  --color-accent-green: #3b82f6; /* Blue instead of green */
}
```

### Step 2: Update `tailwind.config.js`
```javascript
colors: {
  accent: {
    // Change this:
    green: '#10b981',
    
    // To match globals.css:
    green: '#3b82f6',
  }
}
```

That's it! The color will update everywhere.

## 📋 Complete Color Variables List

All colors are defined in `app/globals.css`:

```css
:root {
  /* Primary Colors - Main palette */
  --color-primary-50 through --color-primary-950
  
  /* Accent Colors - Highlights */
  --color-accent-green
  --color-accent-green-light
  --color-accent-green-dark
  --color-accent-gold
  --color-accent-gold-light
  --color-accent-amber
  --color-accent-blue
  --color-accent-purple
  
  /* Semantic Colors (auto-reference primary/accent) */
  --color-bg-primary
  --color-text-primary
  --color-border-primary
  --color-button-primary
  /* ... etc */
  
  /* Gradients (auto-use variables above) */
  --gradient-body
  --gradient-page
  --gradient-footer
  --gradient-button-primary
  /* ... etc */
}
```

## 🎯 How Components Use Colors

Components use colors in two ways:

1. **Tailwind Classes** (most common)
   ```tsx
   <div className="bg-primary-500 text-accent-green">
   ```
   → Gets values from `tailwind.config.js`

2. **CSS Variables** (for custom CSS)
   ```css
   .custom-class {
     background: var(--gradient-body);
   }
   ```
   → Gets values from `app/globals.css`

## 💡 Tips

- **Always change both files** - `globals.css` AND `tailwind.config.js`
- Use semantic color variables (like `--color-button-primary`) rather than hardcoded values
- Gradients automatically update when you change the base color variables
- Test your changes to ensure both CSS variables and Tailwind classes work correctly

## 🌈 Current Color Palette

**Teal/Emerald Theme:**
- Primary: Rich teal tones (#f0fdfa to #042f2e)
- Accent: Vibrant emerald green (#10b981)
- Highlights: Gold (#f59e0b) for special elements
- Background: Soft teal gradients
- Perfect for: Educational platforms, modern websites, trust-building designs

Happy customizing! 🎨
