# FretMaster - Interactive Guitar Chord Trainer

FretMaster is a comprehensive web application for learning and practicing guitar chords with real-time pitch detection, interactive fretboard visualization, and advanced practice tracking.

## 🎸 Features

### Core Features
- **Real-time Pitch Detection** - Accurate pitch detection using NSDF algorithm (60-1400Hz range)
- **Interactive Chord Practice** - Practice mode with real-time feedback and accuracy tracking
- **Custom Chord Editor** - Create and save custom chord diagrams with full editing capabilities
- **Comprehensive Metronome** - 4 percussion sounds (click, wood block, hi-hat, side stick), voice counting, multiple time signatures (2/4, 3/4, 4/4, 12/8), tempo 20-250 BPM, subdivisions (quarter, eighth, sixteenth)
- **Guitar Tuner** - Visual tuner with "flying saucer" frequency visualization
- **Scale Practice** - Interactive scale trainer with fretboard visualization
- **Chord Progressions** - Practice common chord progressions with audio playback
- **Practice Analytics** - Track accuracy, streaks, and progress over time
- **Leaderboards** - Global and friends-only leaderboards
- **Achievements System** - Unlock achievements as you practice
- **Lessons & Challenges** - Structured learning paths and timed challenges

### Advanced Features
- **Offline Support** - Full offline functionality with sync when online
- **Custom Presets** - Save and share chord filter presets
- **Undo/Redo** - Full history tracking in chord editor (50-step history)
- **Keyboard Navigation** - Complete keyboard control for accessibility
- **Dark Mode** - Optimized dark theme with amber/emerald accents
- **Responsive Design** - Mobile-first design with touch-optimized controls
- **Bottom Sheet Modals** - Native mobile feel for dialogs
- **Export/Import** - Share presets via JSON files

## 🛠️ Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **React Router 6** - Client-side routing
- **Zustand** - State management with localStorage persistence
- **React Query 5** - Server state management

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Edge Functions
  - Storage buckets

### Audio
- **Web Audio API** - Audio synthesis and processing
- **Web Speech Synthesis** - Voice counting with adaptive latency compensation
- **Custom NSDF Algorithm** - Pitch detection optimized for guitar

## 📦 Installation

### Prerequisites
- Node.js 18+ or Bun
- Supabase account (for backend)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd fretmaster
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run database migrations**
- Navigate to your Supabase project dashboard
- Execute SQL migrations from `supabase/migrations/` directory
- Ensure RLS policies are enabled for all tables

5. **Start development server**
```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:8080`

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (read-only)
│   ├── features/       # Feature-specific components
│   │   └── chord-editor/  # Chord editor components
│   └── layout/         # Layout components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── lib/                # Utilities and services
│   ├── api/           # API integration layer
│   └── audio/         # Audio utilities
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## 🎯 Key Architecture Decisions

### State Management
- **Zustand** for local state with localStorage persistence
- **React Query** for server state and caching
- **URL state** for filters, tabs, pagination (via React Router)

### Audio Architecture
- **Web Audio API** as authoritative timing reference
- **Adaptive latency compensation** for voice synthesis
- **Memoized audio calculations** for performance
- **Separated audio concerns** - hooks for synthesis, detection, metronome

### Component Organization
- **Atomic design** - UI components in `components/ui/`
- **Feature-based** - Complex features in `components/features/`
- **Code splitting** - React.lazy for heavy routes
- **React.memo** - Memoized child components to prevent unnecessary re-renders

### Performance Optimizations
- **Virtual scrolling** - For long lists (practice history, leaderboard)
- **Debounced pitch detection** - 50ms debounce for updates
- **Manual code splitting** - Vendor chunks for better caching
- **Skeleton loaders** - Better perceived performance than spinners

### Accessibility
- **ARIA labels** on all interactive elements
- **Keyboard navigation** - Full keyboard support (Cmd/Ctrl+K to enable)
- **Focus indicators** - Visible focus rings
- **Skip navigation** - "Skip to main content" link
- **Reduced motion** - Respects `prefers-reduced-motion` media query
- **Screen reader support** - ARIA live regions for dynamic content
- **44×44px touch targets** - All interactive elements meet minimum size

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- **TypeScript** - Strict mode enabled
- **ESLint** - Configured for React and TypeScript
- **Centralized error handling** - API error interceptor
- **Production logging** - Environment-aware logger
- **Input sanitization** - DOMPurify for user content

### Testing Strategy (Recommended)
- **Unit tests** - Vitest + Testing Library for hooks and utilities
- **Component tests** - Test chord editor, metronome, tuner in isolation
- **E2E tests** - Playwright for critical user flows (signup, practice session)

## 📱 Mobile Optimizations

- **Touch-optimized** - 44×44px minimum touch targets
- **Bottom sheets** - Native-feeling modals on mobile
- **Pull-to-refresh** - Native refresh gesture
- **Mobile-specific tuning** - Voice counting latency calibration
- **Responsive layouts** - Mobile-first approach
- **Offline-first** - Full offline functionality

## 🔐 Security

- **Row Level Security** - All Supabase tables have RLS enabled
- **Input sanitization** - DOMPurify for user-generated content
- **Type safety** - TypeScript throughout
- **Environment variables** - Secrets in `.env` file
- **HTTPS only** - Supabase enforces HTTPS

## 🎨 Design System

### Colors
- **Primary** - Amber (#f59e0b)
- **Success** - Emerald (#10b981)
- **Root notes** - Cyan (#06b6d4)
- **Background** - Zinc-950
- **Text** - White with zinc variants for hierarchy

### Typography
- **Font** - System fonts
- **Scale** - 16px base with 1.25 ratio
- **Weights** - 400 (body), 600 (headings), 700 (bold)

### Components
- **Buttons** - Rounded-lg with hover states
- **Inputs** - Border focus with ring
- **Cards** - Zinc-900 with zinc-800 borders
- **Modals** - Bottom sheets on mobile, center on desktop

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deploy to OnSpace

The app is configured for deployment on OnSpace platform. Simply push to your OnSpace project.

### Deploy to Vercel/Netlify

1. Build the app
2. Deploy the `dist/` folder
3. Configure environment variables
4. Set up redirects for client-side routing

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for all new files
- Follow existing component patterns
- Add JSDoc comments for complex functions
- Ensure accessibility (ARIA labels, keyboard nav)
- Test on mobile and desktop
- Run linter before committing

## 🐛 Known Issues

- None currently tracked

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **shadcn/ui** - Component library
- **Supabase** - Backend infrastructure
- **Lucide** - Icon set
- **Recharts** - Charting library

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for guitarists by guitarists**
