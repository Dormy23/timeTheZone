# TimeTheZone API

A RESTful API that does CRUD operations with timezones. Built with Elysia, Bun, and SQLite.

## Features

- Get current server time in ISO format and timestamp
- Retrieve local time for any city in the database
- List all available timezones
- Add new timezones to the database

## Prerequisites

- [Bun runtime](https://bun.sh/) (v1.0 or higher should work)

## Installation

1. Clone repository:
```bash
git clone https://github.com/Dormy23/timethezone-api.git
cd timethezone-api
```

2. Install dependencies:
```bash
bun install
```

3. Start the server:
```bash
bun run index.js
```

## API Documentation

### Base URL
`https://time-api.arson.is-a.dev`

---

### Endpoints

#### 1. Welcome
- **GET** `/`  
  Returns welcome message

**Response:**
```json
{
  "message": "Welcome to TimeTheZone API"
}
```

---

#### 2. Server Time
- **GET** `/time/server`  
  Returns current server time

**Response:**
```json
{
  "status": 200,
  "data": {
    "time": "2024-02-20T12:34:56.789Z",
    "timestamp": 1708425296789
  }
}
```

---

#### 3. Time Lookup
- **GET** `/time`  
  Returns time based on parameters:
  - `city`: City name (e.g., `London`)
  - `ip`: Any value to trigger IP geolocation lookup 

**Examples:**  
1. By city:
```bash
curl http://localhost:3000/time?city=London
```

**Response:**
```json
{
  "city": "London",
  "localTime": "2024-02-20T12:34:56.789Z",
  "timezone": "Europe/London"
}
```

2. By IP (demo):
```bash
curl http://localhost:3000/time?ip=1.1.1.1
```

**Response:**
```json
{
  "city": "Example City",
  "localTime": "2024-02-20T12:34:56.789Z",
  "timezone": "America/Example"
}
```

---

#### 4. City Time Direct
- **GET** `/time/:city`  
  Get time for specific city

**Example:**
```bash
curl http://localhost:3000/time/Paris
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "city": "Paris",
    "localTime": "2024-02-20T13:34:56.789Z",
    "timezone": "Europe/Paris"
  }
}
```

---

#### 5. List All Timezones
- **GET** `/time/zones/all`  
  Returns all registered timezones

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "city": "London",
      "timezone": "Europe/London",
      "offset": 1,
      "created_at": "2024-02-20 12:00:00"
    }
  ]
}
```

---

#### 6. Add Timezone
- **POST** `/time/zones`  
  Add new timezone to database

**Request Body:**
```json
{
  "city": "Tokyo",
  "timezone": "Asia/Tokyo",
  "offset": 9
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Timezone added",
  "data": {
    "id": 2,
    "city": "Tokyo",
    "timezone": "Asia/Tokyo",
    "offset": 9,
    "created_at": "2024-02-20 12:00:00"
  }
}
```

---

## Rate Limiting

The IP geolocation feature using ipapi.co has strict rate limits. you might encounter:
```json
{
  "error": "Rate limit exceeded for IP geolocation service"
}
```


## License

MIT License