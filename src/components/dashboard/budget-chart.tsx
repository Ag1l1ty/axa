"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import type { Project } from "@/lib/types"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { aggregateBudgetMetrics } from "@/lib/supabase-data"

interface BudgetChartProps {
  projects: Project[];
}

const chartConfig = {
  planned: {
    label: "Presupuesto Planeado",
    color: "hsl(var(--chart-2))",
  },
  executed: {
    label: "Presupuesto Ejecutado",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function BudgetChart({ projects }: BudgetChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChartData() {
      try {
        console.log('🚀 Budget Chart: Loading data for', projects.length, 'projects')
        const chartData = await aggregateBudgetMetrics(projects)
        console.log('📊 Budget Chart: Received data:', chartData)
        setData(chartData)
      } catch (error) {
        console.error('Error loading budget chart data:', error)
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
          <p className="text-sm">Cargando presupuesto...</p>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
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
          tickFormatter={(value) => `$${value / 1000000}M`}
        />
        <Tooltip
          content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />}
          cursor={{ fill: "hsl(var(--accent))" }}
        />
        <Legend
            wrapperStyle={{
                fontSize: "12px",
                paddingTop: "20px"
            }}
        />
        <Bar 
          dataKey="planned" 
          name="Presupuesto Planeado" 
          fill="hsl(var(--chart-2))" 
          opacity={0.8}
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="executed" 
          name="Presupuesto Ejecutado" 
          fill="hsl(var(--chart-1))" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
