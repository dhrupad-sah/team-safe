# Team Safe

A secure, easy-to-use secret sharing application for teams.

## Features

- Menu bar app for macOS
- End-to-end encryption using public/private key cryptography
- Company-based authentication
- Easy secret sharing with team members

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Getting Started

1. Clone the repository
   ```
   git clone https://github.com/yourusername/team-safe.git
   cd team-safe
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run the development version
   ```
   npm run dev
   ```

## Project Structure

```
team-safe/
├── assets/             # Icons and static assets
├── src/
│   ├── main/           # Main process code
│   └── renderer/       # Renderer process code
└── package.json
```

## Building

To build the application:

```
npm run build
```

This will create a packaged application in the `dist` directory.

## License

[ISC](LICENSE) 