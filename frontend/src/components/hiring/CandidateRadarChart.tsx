import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface CandidateRadarChartProps {
  data: { category: string; value: number }[];
  compareData?: { category: string; value: number }[];
}

export function CandidateRadarChart({ data, compareData }: CandidateRadarChartProps) {
  const merged = data.map((d, i) => ({
    category: d.category,
    A: d.value,
    ...(compareData ? { B: compareData[i]?.value ?? 0 } : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={merged} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="hsl(222, 30%, 18%)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
        />
        <Radar
          name="Candidate"
          dataKey="A"
          stroke="hsl(199, 89%, 48%)"
          fill="hsl(199, 89%, 48%)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {compareData && (
          <Radar
            name="Compare"
            dataKey="B"
            stroke="hsl(262, 83%, 58%)"
            fill="hsl(262, 83%, 58%)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}

