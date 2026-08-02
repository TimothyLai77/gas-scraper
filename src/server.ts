import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import NodeCache from "node-cache";
import { scrapeGas } from "./scraper";
import { getLastDays } from "./history";
import { GasPriceData, DashboardResponse } from "./types";

const app = express();
const PORT = parseInt(process.env.PORT || "9696", 10);
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "43200", 10);

const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 600 });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

async function getCachedGasPrice(): Promise<GasPriceData> {
  const cached = cache.get<GasPriceData>("gasPrice");
  if (cached) {
    console.log("[cache] hit");
    return cached;
  }

  console.log("[cache] miss, scraping fresh");
  try {
    const data = await scrapeGas();
    cache.set("gasPrice", data);
    cache.set("lastScrapeTime", new Date().toISOString());
    cache.del("error");
    return data;
  } catch (err: any) {
    console.error("[error] scrape failed:", err.message);
    cache.set("error", err.message);
    const fallback = cache.get<GasPriceData>("gasPrice");
    if (fallback) {
      console.log("[cache] returning stale data");
      return fallback;
    }
    throw err;
  }
}

app.get("/utilities/gasPrice", async (_req: Request, res: Response) => {
  try {
    const data = await getCachedGasPrice();
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).end("server error");
  }
});

app.get("/api", async (_req: Request, res: Response) => {
  try {
    const data = await getCachedGasPrice();
    const response: DashboardResponse = {
      data,
      lastScrapeTime: cache.get<string>("lastScrapeTime") || null,
      error: cache.get<string>("error") || null,
    };
    res.json(response);
  } catch (err: any) {
    console.error(err);
    const response: DashboardResponse = {
      data: null,
      lastScrapeTime: null,
      error: err.message || "server error",
    };
    res.status(500).json(response);
  }
});

app.get("/api/history", (_req: Request, res: Response) => {
  res.json(getLastDays());
});

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

app.listen(PORT, () => {
  console.log(`gas-scraper running on port ${PORT}`);
});
