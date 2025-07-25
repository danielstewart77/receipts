# Frontend Integration Guide

## Setup Instructions

1. Copy your Angular application into the `frontend/` directory
2. Update the `frontend/angular.json` to use the proxy configuration
3. Ensure your Angular app uses the proxy configuration for API calls

## Required Angular Configuration

### Update angular.json
Add the proxy configuration to your serve target:

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### API Base URL
Your Angular services should make API calls to relative paths:
- `/auth/login` instead of `http://localhost:8001/auth/login`
- `/receipts/upload_in_store` instead of `http://localhost:8001/receipts/upload_in_store`

The proxy will automatically route these to the backend.

## Development

### Local Development
```bash
# Start both services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or run separately:
# Backend: http://localhost:8001
# Frontend: http://localhost:4400
```

### Production
```bash
docker-compose up
```

## API Endpoints Available

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/user` - Get current user
- `POST /auth/logout` - User logout

### Receipts
- `GET /receipts/authenticated` - Check authentication
- `POST /receipts/upload_receipt` - Upload receipt image
- `POST /receipts/upload_in_store` - Upload in-store item image
- `POST /receipts/save_in_store` - Save in-store item data
- `POST /receipts/chat` - Chat with receipt analysis system
