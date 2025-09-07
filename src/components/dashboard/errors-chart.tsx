"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { aggregateRealMetrics } from "@/lib/supabase-data"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Project } from "@/lib/types";

const chartConfig = {
  errors: {
    label: "Errores",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

interface ErrorsChartProps {
    projects: Project[];
}

export function ErrorsChart({ projects }: ErrorsChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChartData() {
      try {
        const chartData = await aggregateRealMetrics(projects)
        setData(chartData)
      } catch (error) {
        console.error('Error loading error chart data:', error)
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
      <div className="min-h-[200px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm">Cargando errores...</p>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
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
        <Line 
          type="monotone" 
          dataKey="errors" 
          stroke="hsl(var(--destructive))" 
          strokeWidth={2} 
          name="Errores"
          dot={{ r: 4, fill: "hsl(var(--destructive))" }} 
        />
      </LineChart>
    </ChartContainer>
  )
}
