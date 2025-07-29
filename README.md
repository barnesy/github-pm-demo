# GitHub PM Demo

Demo project for GitHub project management with Claude Code.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your actual API key:
   ```
   API_KEY=your_actual_api_key_here
   ```

## Running the Application

### Development mode with auto-reload:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## Environment Variables

The application requires the following environment variables:

- `API_KEY`: Your API key for external services

Never commit the `.env` file to version control. Always use environment variables for sensitive data.

## Security Notes

- API keys and other sensitive information should never be hardcoded in source files
- Always use environment variables for configuration
- The `.env` file is gitignored by default to prevent accidental commits