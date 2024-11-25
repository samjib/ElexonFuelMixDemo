"use client";

import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { atom, useAtom } from "jotai";
import { atomWithCache } from "jotai-cache";
import { useEffect, useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import getFuelGeneration, { DataType } from "./Elexon/api/getFuelInst";
import fuelTypeMap from "./Elexon/mapping/fuelTypeMap";
import getTextColorFromBackground from "./colourUtils";

const dataTypeAtom = atom<DataType>(DataType["Half-Hourly"]);

const getFuelGenerationQueryStart = (dataType: DataType) => {
  let startDate = startOfDay(new Date());
  const now = new Date();

  if (dataType === DataType["Half-Hourly"] && now.getHours() === 0 && now.getMinutes() < 30) {
    startDate = addDays(startDate, -1);
  }

  if (dataType === DataType["5-Minute"] && now.getMinutes() < 5) {
    startDate = addDays(startDate, -1);
  }

  return startDate;
};

const fuelGenerationAtom = atomWithCache(
  (get) =>
    getFuelGeneration(
      get(dataTypeAtom),
      getFuelGenerationQueryStart(get(dataTypeAtom)),
      endOfDay(getFuelGenerationQueryStart(get(dataTypeAtom)))),
  {
    shouldRemove(createdAt) {
      // Remove the cache after 5 minutes
      return Date.now() - createdAt > 5 * 60 * 1000;
    },
  }
);

interface TimePeriod {
  start: Date;
  end: Date;
}

const fuelTypeGroupOrder = [
  "Renewable",
  "Gas",
  "Hydro",
  "Interconnector",
  "Other",
];

const fuelTypeGroupColours: Record<string, string> = {
  "Renewable": "#4AAD52",
  "Gas": "#19297C",
  "Oil": "#757780",
  "Coal": "#1E1E24",
  "Nuclear": "#4C1A57",
  "Storage": "#D2CCA1",
  "Hydro": "#001D4A",
  "Interconnector": "#4C2E05",
  "Other": "#DBD4D3",
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}) => {
  if (active && payload && payload.length) {
    const { name, value, payload: { percentage, group } } = payload[0];

    if (!name || !value || !percentage || !group) {
      return null;
    }

    return (
      <div
        style={{
          backgroundColor: "white",
          color: "black",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <div><strong>Name: </strong> <span style={{ backgroundColor: fuelTypeGroupColours[group], color: getTextColorFromBackground(fuelTypeGroupColours[group]) }} className="p-1 rounded">{name}</span></div>
        <div><strong>Value: </strong>{value.toLocaleString("en-GB", { style: "decimal" })} MWh</div>
        <div><strong>Percentage: </strong>{`${(percentage).toFixed(1)}%`}</div>
      </div>
    );
  }
  return null;
};

const Home = () => {
  const [fuelGeneration] = useAtom(fuelGenerationAtom);
  const [dataType, setDataType] = useAtom<DataType>(dataTypeAtom);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod | null>(null);

  useEffect(() => {
    setSelectedTimePeriod(null);
  }, [dataType]);

  const availableTimePeriodsFromData: TimePeriod[] = useMemo(() => {
    return fuelGeneration.map((d) => {
      return {
        start: new Date(d.startTime),
        end: new Date(d.publishTime),
      };
    })
      .reduce((acc, d) => {
        if (!acc.find((a) => a.start.getTime() === d.start.getTime() && a.end.getTime() === d.end.getTime())) {
          acc.push(d);
        }
        return acc;
      }, [] as TimePeriod[]);
  }, [fuelGeneration]);

  useEffect(() => {
    if (availableTimePeriodsFromData.length > 0 && !selectedTimePeriod) {
      setSelectedTimePeriod(availableTimePeriodsFromData[0]);
    }
  }, [availableTimePeriodsFromData, selectedTimePeriod]);

  const fuelGenerationForSelectedTimePeriod = useMemo(() => {
    return fuelGeneration.filter((d) => {
      if (selectedTimePeriod) {
        return (
          new Date(d.startTime) >= selectedTimePeriod.start &&
          new Date(d.publishTime) <= selectedTimePeriod.end
        );
      }
      return true;
    });
  }, [fuelGeneration, selectedTimePeriod]);

  const totalGeneration = useMemo(() => {
    return fuelGenerationForSelectedTimePeriod.reduce((acc, d) => acc + d.generation, 0);
  }, [fuelGenerationForSelectedTimePeriod]);

  const data = useMemo(() => {
    if (!fuelGeneration) {
      return null;
    }

    const fuelGenerationData = fuelGenerationForSelectedTimePeriod.reduce(
      (acc, d) => {
        const fuelType = fuelTypeMap.find((f) => f.key === d.fuelType);
        if (!fuelType) {
          return acc;
        }

        const group = fuelType.group;
        if (!acc.dataByGroup[group]) {
          acc.dataByGroup[group] = 0;
        }
        acc.dataByGroup[group] += d.generation;

        if (!acc.dataByFuelType[d.fuelType]) {
          acc.dataByFuelType[d.fuelType] = 0;
        }
        acc.dataByFuelType[d.fuelType] += d.generation;

        return acc;
      },
      {
        dataByGroup: {} as Record<string, number>,
        dataByFuelType: {} as Record<string, number>,
      }
    );

    const dataByGroupPercentage = Object.entries(fuelGenerationData.dataByGroup)
      .map(([group, generation]) => {
        return {
          group,
          generation,
          percentage: (generation / totalGeneration) * 100,
        };
      })
      .sort((a, b) => {
        return fuelTypeGroupOrder.indexOf(a.group) - fuelTypeGroupOrder.indexOf(b.group);
      });

    const dataByFuelTypePercentage = Object.entries(fuelGenerationData.dataByFuelType)
      .map(([fuelType, generation]) => {
        const fuelTypeData = fuelTypeMap.find((f) => f.key === fuelType);
        if (!fuelTypeData) {
          return null;
        }

        return {
          fuelType,
          fuelTypeDisplayName: fuelTypeData.displayName,
          group: fuelTypeData.group,
          generation,
          percentage: (generation / totalGeneration) * 100,
        };
      })
      .filter((d) => d)
      .sort((a, b) => {
        return fuelTypeGroupOrder.indexOf(
          fuelTypeMap.find((f) => f.key === a?.fuelType)?.group || ""
        ) -
          fuelTypeGroupOrder.indexOf(
            fuelTypeMap.find((f) => f.key === b?.fuelType)?.group || ""
          );
      });

    return {
      dataByGroupPercentage,
      dataByFuelTypePercentage,
    };
  }, [fuelGeneration, fuelGenerationForSelectedTimePeriod, totalGeneration]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:py-5 sm:px-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-w-[80vw]">
        <h1 className="text-3xl sm:text-4xl">Fuel Generation</h1>

        <div className="flex gap-4 flex-col">
          <h2 className="text-xl">Data Type:</h2>

          <div className="flex gap-4">
            <button
              onClick={() => setDataType(DataType["Half-Hourly"])}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${dataType === DataType["Half-Hourly"] ? "bg-blue-700" : ""}`}
            >
              Half-Hourly
            </button>
            <button
              onClick={() => setDataType(DataType["5-Minute"])}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${dataType === DataType["5-Minute"] ? "bg-blue-700" : ""}`}
            >
              5-Minute
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-col">
          <h2 className="text-xl">Time Period{availableTimePeriodsFromData ? (availableTimePeriodsFromData[0].start.getDate() !== new Date().getDate() ? ` (${format(availableTimePeriodsFromData[0].start, "dd/MM/yyyy")})` : "") : ""}:</h2>

          <div className="flex gap-4 flex-wrap max-h-60 overflow-y-auto">
            {availableTimePeriodsFromData.map(
              (timePeriod, index) => {
                const isSelectedPeriod = selectedTimePeriod?.start.getTime() === timePeriod.start.getTime() && selectedTimePeriod?.end.getTime() === timePeriod.end.getTime();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedTimePeriod(timePeriod)}
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-nowrap ${isSelectedPeriod ? "bg-blue-700" : ""}`}
                  >
                    {format(timePeriod.start, "HH:mm")} - {format(timePeriod.end, "HH:mm")}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <h3>Total Generation: {totalGeneration.toLocaleString("en-GB", { style: "decimal" })} MWh</h3>

        <ResponsiveContainer width="100%" minHeight={600}>
          <PieChart>
            <Pie
              dataKey="generation"
              data={data?.dataByGroupPercentage}
              nameKey="group"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
            >
              {
                data?.dataByGroupPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry ? fuelTypeGroupColours[entry.group] : ""} />
                ))
              }
            </Pie>
            <Pie
              dataKey="generation"
              data={data?.dataByFuelTypePercentage}
              label={({ payload }) => payload.percentage > 0 ? `${(payload.percentage).toFixed(1)}%` : null}
              nameKey="fuelTypeDisplayName"
              cx="50%"
              cy="50%"
              innerRadius={100}
              outerRadius={130}
              fill="#8884d8"
            >
              {
                data?.dataByFuelTypePercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry ? fuelTypeGroupColours[entry.group] : ""} />
                ))
              }
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default Home;