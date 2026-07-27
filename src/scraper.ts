import axios from "axios";
import dayjs from "dayjs";
import { GasPriceData } from "./types";

const CITYNEWS_URL = "https://toronto.citynews.ca/toronto-gta-gas-prices/";

export async function scrapeGas(): Promise<GasPriceData> {
  const dateRegEx = /\w+\s\d+,\s\d+/gm;
  const priceRegEx = /(\d+.\d cent)/gm;

  const { data } = await axios.get(CITYNEWS_URL);
  const trend = extractTrend(data);

  const dateTomorrow = dayjs(data.match(dateRegEx)?.[0]);
  const dateToday = dateTomorrow.subtract(1, "day");
  const priceTomorrow = parseFloat(data.match(priceRegEx)?.[0]?.slice(0, -5));
  const priceToday = priceTomorrow - trend;

  return {
    todaysDate: dateToday.format("D-MM-YYYY"),
    priceToday,
    dateTomorrow: dateTomorrow.format("D-MM-YYYY"),
    priceTomorrow,
    delta: trend,
  };
}

function extractTrend(str: string): number {
  const trendDetect = /((rise|rose|fall|drop|fell|dropped)[ ]?[0-9]+|unchanged)/gim;
  const match = str.match(trendDetect);

  if (!match || match.length === 0) {
    throw new Error("Cannot extract trend info");
  }

  const trendString = match[0];

  if (trendString === "unchanged") return 0;

  const numericPart = trendString.replace(/[A-z ]/gim, "");
  const trendValue = parseInt(numericPart, 10);

  const priceDropped = /(drop|dropped|fell|fall)/gim.test(trendString);
  return priceDropped ? trendValue * -1 : trendValue;
}
