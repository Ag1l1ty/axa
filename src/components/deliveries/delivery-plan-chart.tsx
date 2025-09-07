
"use client"

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Delivery, ProjectStage } from '@/lib/types';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { differenceInDays, format, parseISO, addDays } from 'date-fns';
import { getStageTransitions, calculateBusinessDays } from '@/lib/supabase-data';

interface DeliveryPlanChartProps {
    delivery: Delivery;
}

const chartConfig = {
    "Planificado": {
        label: "Planificado",
        color: "hsl(var(--chart-2))",
    },
    "Real": {
        label: "Real",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

const STAGES: ProjectStage[] = ['Definición', 'Desarrollo Local', 'Ambiente DEV', 'Ambiente TST', 'Ambiente UAT', 'Soporte Productivo', 'Cerrado'];

export function DeliveryPlanChart({ delivery }: DeliveryPlanChartProps) {
    const [stageTransitions, setStageTransitions] = useState<Array<{stage: string, date: string}>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStageData = async () => {
            try {
                const transitions = await getStageTransitions(delivery.id);
                setStageTransitions(transitions);
                console.log('📋 Stage transitions loaded:', transitions);
            } catch (error) {
                console.error('Error loading stage transitions:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStageData();
    }, [delivery.id]);

    if (loading) {
        return (
            <div className="min-h-[350px] w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Cargando tendencias...</p>
                </div>
            </div>
        );
    }

    const startDate = parseISO(delivery.creationDate);
    const endDate = parseISO(delivery.estimatedDate);
    
    // 1. Línea planificado: días laborales divididos entre 7 etapas
    const totalBusinessDays = calculateBusinessDays(startDate, endDate);
    const businessDaysPerStage = totalBusinessDays > 0 ? totalBusinessDays / STAGES.length : 0;
    
    console.log(`📊 Planning: ${totalBusinessDays} business days ÷ ${STAGES.length} stages = ${businessDaysPerStage} days/stage`);

    const plannedData = STAGES.map((stage, index) => {
        // Distribuir días laborales acumulativamente
        let businessDaysElapsed = businessDaysPerStage * index;
        let currentDate = new Date(startDate);
        
        // Avanzar por días laborales (saltando fines de semana)
        let dayCount = 0;
        while (dayCount < businessDaysElapsed) {
            currentDate.setDate(currentDate.getDate() + 1);
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No es fin de semana
                dayCount++;
            }
        }
        
        return { 
            x: currentDate.getTime(), 
            y: index, 
            stage, 
            type: 'Planificado',
            days: Math.round(businessDaysElapsed)
        };
    });

    // 2. Línea real: basado en transiciones reales del kanban
    const realData: Array<{x: number, y: number, stage: string, type: string, days: number}> = [];
    
    if (stageTransitions.length > 0) {
        stageTransitions.forEach((transition, index) => {
            const stageIndex = STAGES.indexOf(transition.stage);
            if (stageIndex !== -1) {
                const transitionDate = parseISO(transition.date);
                const daysFromStart = index === 0 ? 0 : calculateBusinessDays(startDate, transitionDate);
                
                realData.push({
                    x: transitionDate.getTime(),
                    y: stageIndex,
                    stage: transition.stage,
                    type: 'Real',
                    days: daysFromStart
                });
            }
        });
    }

    const allData = [...plannedData, ...realData].sort((a, b) => a.x - b.x);
    const domainMin = Math.min(...allData.map(d => d.x));
    const domainMax = Math.max(...allData.map(d => d.x), endDate.getTime());

    return (
        <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
            <LineChart
                accessibilityLayer
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 40,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                    type="number"
                    dataKey="x"
                    domain={[domainMin, domainMax]}
                    tickFormatter={(unixTime) => format(new Date(unixTime), 'MMM d')}
                    stroke="hsl(var(--foreground))" 
                    fontSize={12}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                />
                <YAxis 
                    type="number"
                    dataKey="y"
                    domain={[0, STAGES.length - 1]} 
                    ticks={[0, 1, 2, 3, 4, 5, 6]}
                    tickFormatter={(value) => STAGES[value] || ''}
                    stroke="hsl(var(--foreground))" 
                    fontSize={12} 
                    width={100}
                />
                <Tooltip 
                    content={<ChartTooltipContent 
                        formatter={(value, name, props) => {
                            const stageName = props.payload.stage;
                            const date = format(new Date(props.payload.x), 'MMM d, yyyy');
                            const days = props.payload.days;
                            return (
                                <div className="flex flex-col">
                                    <span className="font-semibold">{stageName}</span>
                                    <span className="text-xs text-muted-foreground">{name}: {date}</span>
                                    <span className="text-xs text-muted-foreground">Días laborales: {days}</span>
                                </div>
                            )
                        }}
                        labelFormatter={() => ''}
                        itemSorter={(a, b) => (a.dataKey === 'Real' ? -1 : 1)}
                    />} 
                    cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                 <Line 
                  data={plannedData} 
                  type="monotone" 
                  dataKey="y" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={true} 
                  name="Planificado" 
                />
                <Line 
                  data={realData} 
                  type="monotone" 
                  dataKey="y" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2} 
                  dot={true} 
                  name="Real" 
                />
            </LineChart>
        </ChartContainer>
    );
}
