import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  LabelList,
} from "recharts";

// Dummy Data
const progressBreakdown = [
  { category: "Plumbing", todo: 4, inProgress: 2, done: 6 },
  { category: "Electrical", todo: 3, inProgress: 4, done: 5 },
  { category: "Structural", todo: 5, inProgress: 3, done: 7 },
  { category: "Example4", todo: 4, inProgress: 2, done: 6 },
  { category: "Example5", todo: 3, inProgress: 4, done: 5 },
  { category: "Example6", todo: 5, inProgress: 3, done: 7 },
];

const vendorEngagement = [
  { time: "Jan", views: 20, offers: 10, accepted: 5 },
  { time: "Feb", views: 25, offers: 15, accepted: 8 },
  { time: "Mar", views: 18, offers: 12, accepted: 6 },
];

const offerComparison = [
  { category: "Plumbing", offer1: 350, offer2: 400 },
  { category: "Electrical", offer1: 250, offer2: 300 },
  { category: "Structural", offer1: 400, offer2: 450 },
  { category: "Example4", offer1: 400, offer2: 450 },
  { category: "Example5", offer1: 400, offer2: 450 },
  { category: "Example6", offer1: 400, offer2: 450 },
];

const issueResolutionTime = [
  { time: "Jan", days: 10 },
  { time: "Feb", days: 8 },
  { time: "Mar", days: 12 },
];

const legendNames: Record<string, string> = {
  views: "Vendor Views",
  offers: "Offers Placed",
  accepted: "Accepted Offers",
  todo: "To-Do",
  inProgress: "In-Progress",
  done: "Resolved",
  offer1: "Lowest Offer",
  offer2: "Highest Offer",
  days: "Resolution Time (Days)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-md rounded-md border border-gray-300">
        <p className="text-gray-800 font-semibold mb-2">
          {payload[0].payload.category || payload[0].payload.time}
        </p>
        <div className="flex flex-wrap flex-col gap-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <span
                className="w-3 h-3 inline-block rounded"
                style={{ backgroundColor: entry.color }} // Keeps color boxes
              />
              <p className="text-gray-800 text-sm">
                {legendNames[entry.dataKey] || entry.dataKey}:{" "}
                <b>{entry.value}</b>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1">
          <span
            className="w-3 h-3 inline-block rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-800 text-sm font-medium">
            {legendNames[entry.value] || entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardCharts = () => {
  return (
    <div className="space-y-6">
      {/* Issue Progress Breakdown */}

      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
          <h6 className="font-bold text-lg mb-0">Issue Progress Breakdown</h6>
        </div>
        <div className="p-6">
          <ResponsiveContainer
            width="100%"
            style={{ display: "flex", justifyContent: "start" }}
            height={300}
          >
            <BarChart
              data={progressBreakdown}
              layout="vertical"
              barSize={20}
              margin={{ left: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="category"
                type="category"
                tick={{ fontSize: 12, display: "none" }}
                width={23}
              />
              <Tooltip
                cursor={{ fill: "#f5f5f5f5" }}
                content={<CustomTooltip />}
              />
              <Legend content={<CustomLegend />} />
              <Bar dataKey="todo" stackId="a" fill="#90a1b9">
                <LabelList
                  dataKey="category"
                  position="insideLeft"
                  fill="#fff"
                  fontSize={12}
                />
              </Bar>
              <Bar dataKey="inProgress" stackId="a" fill="#51a2ff" />
              <Bar
                dataKey="done"
                stackId="a"
                fill="#05df72"
                radius={[0, 10, 10, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Engagement */}
      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
          <h6 className="font-bold text-lg mb-0">Vendor Engagement</h6>
        </div>
        <div className="p-6">
          <ResponsiveContainer
            width="100%"
            style={{ display: "flex", justifyContent: "start" }}
            height={300}
          >
            <AreaChart data={vendorEngagement} margin={{ left: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Area
                type="monotone"
                dataKey="views"
                stackId="1"
                stroke="#3b82f6"
                fill="#93c5fd"
              />
              <Area
                type="monotone"
                dataKey="offers"
                stackId="1"
                stroke="#facc15"
                fill="#fde68a"
              />
              <Area
                type="monotone"
                dataKey="accepted"
                stackId="1"
                stroke="#22c55e"
                fill="#bbf7d0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Offer Comparison */}
      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
          <h6 className="font-bold text-lg mb-0">Offer Comparison</h6>
        </div>
        <div className="p-6">
          <ResponsiveContainer
            width="100%"
            style={{ display: "flex", justifyContent: "start" }}
            height={300}
          >
            <BarChart data={offerComparison} barSize={10} margin={{ left: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={30} />
              <Tooltip
                cursor={{ fill: "#f5f5f5f5" }}
                content={<CustomTooltip />}
              />
              <Legend content={<CustomLegend />} />
              <Bar dataKey="offer1" fill="#3b82f6" radius={10} />
              <Bar dataKey="offer2" fill="#f87171" radius={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issue Resolution Time */}
      <div className="bg-white rounded-lg">
        <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
          <h6 className="font-bold text-lg mb-0">Issue Resolution Time</h6>
        </div>
        <div className="p-6">
          <ResponsiveContainer
            width="100%"
            style={{ display: "flex", justifyContent: "start" }}
            height={300}
          >
            <AreaChart data={issueResolutionTime} margin={{ left: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Area
                type="monotone"
                dataKey="days"
                stroke="#ef4444"
                fill="#fecaca"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
