import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import cron from "node-cron";
import { scrapeGas } from "./scraper";
import { getLastDays, hasToday, getLatest } from "./history";
import { GasPriceData, DashboardResponse, HistoryRecord } from "./types";

const app = express();
const PORT = parseInt(process.env.PORT || "9696", 10);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const getTimestamp = () => new Date().toISOString();

function historyToGasPrice(record: HistoryRecord): GasPriceData {
  const [y, m, d] = record.date.split("-").map(Number);
  const dateToday = new Date(y, m - 1, d);
  const dateTomorrow = new Date(y, m - 1, d + 1);

  const format = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return {
    todaysDate: format(dateToday),
    priceToday: record.priceToday,
    dateTomorrow: format(dateTomorrow),
    priceTomorrow: record.priceTomorrow,
    delta: record.delta,
  };
}

async function getGasPrice(): Promise<GasPriceData> {
  if (hasToday()) {
    const record = getLatest();
    if (record) {
      console.log(`[${getTimestamp()}] [history] today's data available`);
      return historyToGasPrice(record);
    }
  }

  console.log(`[${getTimestamp()}] [history] scraping fresh`);
  try {
    const data = await scrapeGas();
    return data;
  } catch (err: any) {
    console.error(`[${getTimestamp()}] [error] scrape failed:`, err.message);
    const fallback = getLatest();
    if (fallback) {
      console.log(`[${getTimestamp()}] [history] returning last known data`);
      return historyToGasPrice(fallback);
    }
    throw err;
  }
}

app.get("/utilities/gasPrice", async (_req: Request, res: Response) => {
  try {
    const data = await getGasPrice();
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).end("server error");
  }
});

app.get("/api", async (_req: Request, res: Response) => {
  try {
    const data = await getGasPrice();
    const latest = getLatest();
    const response: DashboardResponse = {
      data,
      lastScrapeTime: latest ? new Date(latest.date + "T01:00:00").toISOString() : null,
      error: null,
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
  res.json(getLastDays().reverse());
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

cron.schedule("0 1,12,18 * * *", async () => {
  console.log(`[${getTimestamp()}] [cron] scheduled scrape started`);
  try {
    await scrapeGas();
    console.log(`[${getTimestamp()}] [cron] scheduled scrape completed`);
  } catch (err: any) {
    console.error(`[${getTimestamp()}] [cron] scheduled scrape failed:`, err.message);
  }
}, {
  timezone: "America/Toronto",
});
