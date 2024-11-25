import { addMinutes } from "date-fns";

export interface FuelInstResponse {
  data: FuelInstResponseDataset[];
}

export interface FuelInstResponseDataset {
  dataset: string;
  publishTime: string;
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  fuelType: string;
  generation: number;
}

export enum DataType {
  "5-Minute",
  "Half-Hourly",
}

const getFuelGeneration = async (
  dataType: DataType,
  start: Date,
  end: Date
) => {
  const response = await fetch(
    dataType === DataType["Half-Hourly"]
      ? `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH?publishDateTimeFrom=${addMinutes(start, 1).toISOString()}&publishDateTimeTo=${end.toISOString()}`
      : `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELINST?publishDateTimeFrom=${addMinutes(start, 1).toISOString()}&publishDateTimeTo=${end.toISOString()}`
  );
  return response.json().then((response: FuelInstResponse) => {
    return response.data;
  });
};

export default getFuelGeneration;
