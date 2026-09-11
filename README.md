# Al-Hafez Academy Website

A beautiful, modern website for a Quran academy that teaches Arabic to kids and adults, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🌐 **Bilingual Support**: Full Arabic and English language support with easy switching
- 📱 **Fully Responsive**: Mobile-first design that works on all devices
- 🎨 **Beautiful Design**: Modern, appealing design suitable for kids and adults
- ⚡ **Server-Side Rendering**: Optimized for SEO with server components
- 🎯 **Admin Dashboard**: Complete admin panel at `/admin/dashboard`
- 🎨 **Centralized Color System**: Easy color customization in one place

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (State Management)
- **Lucide React** (Icons)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page
│   ├── register/          # Registration page
│   ├── packages/          # Packages/pricing page
│   ├── teachers/          # Teachers page
│   ├── honor-board/       # Honor board page
│   ├── testimonials/      # Testimonials page
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── shared/           # Shared components (Navbar, Footer)
│   ├── home/             # Home page components
│   ├── register/         # Registration components
│   ├── packages/         # Package components
│   ├── teachers/         # Teacher components
│   ├── honor-board/      # Honor board components
│   └── testimonials/     # Testimonial components
├── lib/                  # Utility functions
│   ├── colors.ts         # Color constants
│   ├── translations.ts   # Translation utilities
│   └── i18n.ts           # i18n helper functions
├── contexts/             # React contexts
│   └── LocaleContext.ts  # Language context
├── hooks/                # Custom hooks
│   └── useTranslation.ts # Translation hook
├── store/                # State management
│   └── useStore.ts       # Zustand store
└── public/               # Static assets
    └── locales/          # Translation files
```

## Color Customization

All colors are centralized in one place for easy customization. To change the website colors:

### Option 1: CSS Variables (Recommended)

Edit the CSS variables in `app/globals.css`:

```css
:root {
  /* Primary Colors */
  --color-primary-50: #fefdf9;
  --color-primary-100: #faf8f0;
  /* ... etc */
  
  /* Accent Colors */
  --color-accent-green: #22c55e;
  --color-accent-green-dark: #16a34a;
  /* ... etc */
  
  /* Semantic Colors */
  --color-bg-primary: var(--color-primary-50);
  --color-text-primary: var(--color-primary-900);
  /* ... etc */
}
```

### Option 2: TypeScript Constants

Edit the color values in `lib/colors.ts`:

```typescript
export const colors = {
  primary: {
    50: '#fefdf9',
    100: '#faf8f0',
    // ... etc
  },
  accent: {
    green: '#22c55e',
    // ... etc
  },
}
```

### Option 3: Tailwind Config

Edit the color palette in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#fefdf9',
    100: '#faf8f0',
    // ... etc
  },
  accent: {
    green: '#22c55e',
    // ... etc
  },
}
```

**Note**: After changing colors in any of these files, make sure to update the corresponding values in the other files to maintain consistency.

## Language Support

The website supports Arabic (default) and English. Translations are stored in:
- `public/locales/ar/common.json` - Arabic translations
- `public/locales/en/common.json` - English translations

To add or modify translations, edit these JSON files.

## Admin Dashboard

Access the admin dashboard at `/admin/dashboard` to view:
- Statistics overview
- Registered students list
- Package information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
