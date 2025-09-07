
"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { aggregateRealMetrics } from "@/lib/supabase-data"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Project } from "@/lib/types";

const chartConfig = {
  planned: {
    label: "Planeadas (Acumuladas)",
    color: "hsl(var(--chart-2))",
  },
  actual: {
    label: "Reales (Acumuladas)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface DeliveriesChartProps {
  projects: Project[];
}

export function DeliveriesChart({ projects }: DeliveriesChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChartData() {
      try {
        const chartData = await aggregateRealMetrics(projects)
        setData(chartData)
      } catch (error) {
        console.error('Error loading chart data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    if (projects.length > 0) {
      loadChartData()
    } else {
      setData([])
      setLoading(false)
    }
  }, [projects])

  if (loading) {
    return (
      <div className="min-h-[300px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando gráfico...</p>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: "hsl(var(--accent))" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
        <Line 
            type="monotone" 
            dataKey="planned" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2} 
            name="Planeadas (Acumuladas)" 
            strokeDasharray="5 5"
            dot={false}
        />
        <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2} 
            name="Reales (Acumuladas)" 
            dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
