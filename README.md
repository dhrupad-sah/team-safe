# Team Safe

A secure, easy-to-use secret sharing application for teams.

## Features

- Menu bar app for macOS
- End-to-end encryption using public/private key cryptography
- Company-based authentication
- Easy secret sharing with team members

## Project Structure

```
team-safe/
├── frontend/           # Electron menu bar app
│   ├── assets/         # Icons and static assets
│   └── src/            # Frontend application code
│       ├── main/       # Main process code
│       └── renderer/   # Renderer process code
├── backend/            # Express API server
│   ├── prisma/         # Database schema and migrations
│   └── src/            # Backend application code
│       ├── controllers/# API controllers
│       ├── middleware/ # Express middleware
│       ├── routes/     # API routes
│       ├── utils/      # Utility functions
│       └── index.js    # Entry point
└── package.json        # Root package.json for managing both apps
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Getting Started

1. Install dependencies for all components:
   ```
   npm run install:all
   ```

2. Run both frontend and backend in development mode:
   ```
   npm run dev
   ```

3. Or run them separately:
   ```
   npm run frontend
   npm run backend
   ```

## Building

To build the application:

```
npm run build:frontend
```

## License

[ISC](LICENSE) 