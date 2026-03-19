# Portfolio Web Application

A responsive React-based web application for managing your investment portfolio, bank accounts, transactions, and documents.

## Features

- **🔐 Authentication**: Secure login with Auth0 (SSO, MFA support)
- **Dashboard**: View portfolio summary with total value, invested amount, and gain/loss calculations
- **Assets Management**: Full CRUD operations for investment assets with real-time calculations
- **Bank Accounts**: Manage multiple bank accounts with balance tracking
- **Transactions**: Advanced filtering and reconciliation with pagination support
- **Documents**: Upload and manage financial documents with bank account linking
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Automatic theme switching based on system preferences

## Tech Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.11
- **Language**: TypeScript 5.3.3
- **Routing**: React Router 6.21.1
- **Authentication**: Auth0 React SDK 2.11.0
- **HTTP Client**: Axios 1.6.5
- **Styling**: Pure CSS with CSS Grid and Flexbox

## Design Principles

### Button-Triggered Data Loading
This application follows a **no-automatic-loading** pattern. Data is only loaded when users explicitly click buttons:
- No `useEffect` hooks for automatic data fetching
- "Load" or "Refresh" buttons trigger all data operations
- Users have full control over when data is fetched

### Responsive Design
- Mobile-first approach with breakpoint at 768px
- CSS Grid for flexible layouts
- Touch-friendly button sizes
- Collapsible navigation on mobile

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`
- PostgreSQL database (via infra-setup)
- Auth0 account (sign up at https://auth0.com)

### Installation

1. Install dependencies:
```bash
cd src/web-app
npm install
```

2. **Configure Auth0** (⚠️ REQUIRED):
   - See `AUTH0_SETUP.md` for detailed instructions
   - Quick setup: `AUTH0_QUICK_REFERENCE.md`
   - Update `src/config/auth0.config.ts` with your credentials
   - Or create `.env.local` with Auth0 variables

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/web-app/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   └── Navbar.tsx       # Navigation component
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Dashboard
│   │   ├── AssetsPage.tsx   # Assets management
│   │   ├── BankAccountsPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   └── DocumentsPage.tsx
│   ├── services/            # API services
│   │   ├── api.ts           # Axios instance
│   │   ├── assetService.ts
│   │   ├── bankAccountService.ts
│   │   ├── transactionService.ts
│   │   └── documentService.ts
│   ├── types/               # TypeScript interfaces
│   │   ├── Asset.ts
│   │   ├── BankAccount.ts
│   │   ├── Transaction.ts
│   │   └── User.ts
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API Integration

The application connects to the backend API through Vite's proxy configuration:
- All `/api/*` requests are proxied to `http://localhost:8000`
- Authentication tokens stored in localStorage
- Automatic token injection via Axios interceptors
- 401 responses trigger automatic logout

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features by Page

### Home Page
- Load portfolio summary button
- Total value, invested amount, gain/loss display
- Quick action cards for navigation

### Assets Page
- Load assets button
- Add/Edit asset form (name, type, quantity, prices, dates)
- Gain/loss calculations with color coding
- Delete with confirmation

### Bank Accounts Page
- Load accounts button
- CRUD operations for bank accounts
- Account status (active/inactive)
- Balance tracking in multiple currencies

### Transactions Page
- Load transactions with filters
- Advanced filtering: date range, status, bank account, asset, amounts, description
- Pagination controls (20/50/100 per page)
- Active filter chips with removal
- Transaction status badges
- Asset linking display

### Documents Page
- File upload with bank account linking
- Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV
- Document list with file size and upload date
- Download and delete functionality

## Environment Variables

No environment variables required. API URL is configured in `vite.config.ts`.

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 13+, Chrome Android

## Development Notes

### State Management
- Local component state with `useState`
- No global state management (Redux, Zustand, etc.)
- Each page manages its own data

### Error Handling
- Try-catch blocks for all async operations
- User-friendly error messages
- Console logging for debugging

### Loading States
- Spinner component for async operations
- Disabled buttons during loading
- Loading text on submit buttons

### Form Validation
- Required fields marked with asterisks
- Browser-native validation
- Type-safe inputs with TypeScript

## Known Limitations

1. **No Authentication UI**: Auth handled by backend, no login page implemented
2. **No Real-time Updates**: Data refreshed only via button clicks
3. **No Offline Support**: Requires active internet connection
4. **Single Currency Display**: Multi-currency support in data, USD display only

## Future Enhancements

- [ ] Transaction editing page
- [ ] Advanced chart visualizations
- [ ] Export data to CSV/Excel
- [ ] Bulk operations (multi-delete, bulk upload)
- [ ] User profile and settings page
- [ ] Dark/Light mode toggle (currently auto-detect)
- [ ] Asset price history tracking
- [ ] Budget tracking and alerts
- [ ] Mobile app (React Native)

## Troubleshooting

### API Connection Issues
- Ensure backend API is running on port 8000
- Check PostgreSQL database is accessible
- Verify CORS settings in backend

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Styling Issues
- Browser cache: Hard refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser DevTools for CSS errors

## Contributing

This is a portfolio project. Feel free to fork and customize for your needs.

## License

MIT License - See backend API for full license details.
