# Video Streaming Service

A Node.js-based video streaming service that handles video uploads and streaming with Redis caching. Built with clean architecture principles and following best practices for error handling and performance.

## Features

- Video upload with validation (10MB limit)
- Video streaming with range request support
- Redis caching (60s TTL)
- Docker containerization
- Robust error handling
- Performance monitoring
- Clean architecture with dependency injection

## Tech Stack

- Node.js (native http module)
- Redis for caching
- Docker & Docker Compose
- File system for storage

## Prerequisites

- Node.js v22 or higher
- Docker and Docker Compose
- Redis (included in Docker setup)

## Installation & Setup

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Start Redis:

```bash
docker run -d -p 6379:6379 redis:alpine
```

3. Start the application:

```bash
npm start
```

### Docker Setup

1. Build and start the containers:

```bash
docker-compose up --build
```

The service will be available at `http://localhost:3000`.

## API Documentation

### Upload Video

Upload a video file (max 10MB).

- **URL**: `/upload/video`
- **Method**: `POST`
- **Headers**:
  - Content-Type: video/\*
- **Max File Size**: 10MB
- **Response Codes**:
  - 204: Success
  - 400: Invalid file type or size
  - 500: Server error

Example:

```bash
curl -X POST http://localhost:3000/upload/video \
  -H "Content-Type: video/mp4" \
  --data-binary "@video.mp4"
```

### Stream Video

Stream a video with optional range requests.

- **URL**: `/static/video/:filename`
- **Method**: `GET`
- **Headers** (optional):
  - Range: bytes=start-end
- **Response Codes**:
  - 200: Full content
  - 206: Partial content
  - 404: Video not found
  - 400: Invalid range
  - 500: Server error

Example:

```bash
# Full video
curl http://localhost:3000/static/video/filename.mp4

# Partial content
curl -H "Range: bytes=0-1000000" http://localhost:3000/static/video/filename.mp4
```

## Architecture

The project follows clean architecture principles:

- **Interfaces**: Define contracts for storage and caching
- **Services**: Implement business logic
- **Repositories**: Handle data storage
- **Middleware**: Handle validation and monitoring

### Key Components

- `IStorageRepository`: Interface for storage implementations
- `ICacheService`: Interface for cache implementations
- `VideoService`: Core business logic
- `LocalStorageRepository`: File system implementation
- `RedisCacheService`: Redis cache implementation

## Error Handling

The service provides detailed error messages and appropriate HTTP status codes:

- Invalid file type: 400 Bad Request
- File too large: 400 Bad Request
- Video not found: 404 Not Found
- Invalid range: 400 Bad Request
- Server errors: 500 Internal Server Error

## Caching Strategy

- 60-second TTL for cached videos
- Cache-first approach for video streaming
- Automatic cache update on full video requests
- Range requests bypass cache

## Performance Monitoring

The service includes built-in performance monitoring:

- Request duration tracking
- Cache hit/miss logging
- Detailed error logging
- Request/response metrics

## Docker Configuration

The service uses two containers:

1. **App Container**:

   - Node.js application
   - Volume for video storage
   - Volume for logs

2. **Redis Container**:
   - Cache service
   - Persistent volume for data

## Development

### File Structure

```
src/
├── interfaces/        # Contracts for repositories
├── services/         # Business logic
├── repositories/     # Data access
├── middleware/       # Request handling
└── utils/           # Helpers and utilities
```

### Adding New Storage Backends

Implement the `IStorageRepository` interface:

```javascript
class NewStorageRepository extends IStorageRepository {
  async saveVideo(filename, data) { ... }
  async readVideo(filename, range) { ... }
  async videoExists(filename) { ... }
}
```

## Testing

Manual testing can be performed using the included Postman collection or curl commands.

## Logging

Logs are stored in:

- `logs/error.log`: Error-level logs
- `logs/combined.log`: All logs

## Security Considerations

- File type validation
- Size limits
- No direct file path exposure
- CORS headers
- Error message sanitization
