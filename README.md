# Toronto Gas Price Scraper

A lightweight service that scrapes tomorrow's gas prices from Toronto CityNews and serves them via API and a simple web dashboard.

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Web dashboard showing today's and tomorrow's price |
| `GET /api` | JSON with price data, last scrape time, and error status |
| `GET /utilities/gasPrice` | Original JSON API (backward compatible) |

## Quick Start

### Docker

```bash
docker compose up --build
```

### Local

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Or build for production:

```bash
npm run build
npm start
```

## Configuration

Set via environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `9696` | HTTP port |
| `CACHE_TTL` | `43200` | Cache duration in seconds (12 hours) |

## How It Works

- Scrapes Toronto CityNews for the next day's price announcement
- Parses the text to extract tomorrow's price and the change (up/down/unchanged)
- Caches the result in memory for 12 hours
- If a scrape fails, returns the last cached result with an error flag

## Response Format

```json
{
  "todaysDate": "26-07-2025",
  "priceToday": 151.9,
  "dateTomorrow": "27-07-2025",
  "priceTomorrow": 149.9,
  "delta": -2
}
```

Prices are in cents per litre. `delta` is the expected change from today to tomorrow.
