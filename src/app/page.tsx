
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DeliveriesChart } from "@/components/dashboard/deliveries-chart";
import { ErrorsChart } from "@/components/dashboard/errors-chart";
import { BudgetChart } from "@/components/dashboard/budget-chart";
import { getProjects, getDeliveries, getDashboardKpis } from "@/lib/supabase-data";
import { getRiskProfile } from "@/lib/data";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Package, Maximize } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project, Delivery } from '@/lib/types';
import { TimeErrorTrendsChart } from '@/components/dashboard/time-error-trends-chart';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { formatNumber } from '@/lib/date-utils';


function DashboardContent() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [fullscreenChart, setFullscreenChart] = useState<{ title: string; chart: React.ReactNode } | null>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalBudget: 0, onTrackProjects: 0, highRiskProjects: 0, totalDeliveries: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const [projects, deliveries] = await Promise.all([
          getProjects(),
          getDeliveries()
        ]);
        setAllProjects(projects);
        setAllDeliveries(deliveries);
        const dashboardKpis = await getDashboardKpis(projects);
        setKpis(dashboardKpis);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);


  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const projectsToDisplay: Project[] = selectedProjectId === 'all'
    ? allProjects
    : allProjects.filter(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  const ChartDialog = ({ children, title }: { children: React.ReactNode, title: string }) => (
      <Dialog open={!!fullscreenChart} onOpenChange={(isOpen) => !isOpen && setFullscreenChart(null)}>
          <DialogContent className="max-w-4xl h-4/5 flex flex-col">
              <DialogHeader>
                  <DialogTitle>{fullscreenChart?.title}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 h-full">
                  {fullscreenChart?.chart}
              </div>
          </DialogContent>
      </Dialog>
  );

  if (selectedProjectId !== 'all' && projectsToDisplay.length > 0) {
    const project = projectsToDisplay[0];
    // Contar entregas reales con estado "Cerrado" para este proyecto
    const deliveriesMade = allDeliveries.filter(d => d.projectId === project.id && d.stage === 'Cerrado').length;
    const totalPlanned = project.projectedDeliveries || 0;
    
    const hasRiskAssessment = project.riskScore !== undefined && project.riskScore > 0;
    const riskProfile = hasRiskAssessment ? getRiskProfile(project.riskScore!) : null;

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-end">
          <Select onValueChange={handleProjectChange} defaultValue={selectedProjectId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {allProjects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <KpiCard
            title="Total Budget"
            value={`$${formatNumber(project.budget)}`}
            description={`Total allocated budget for this project`}
            icon={<DollarSign className="text-primary" />}
          />
          <KpiCard
            title="Deliveries On Track"
            value={`${deliveriesMade} / ${totalPlanned}`}
            description="Realizadas vs. Planeadas"
            icon={<Package className="text-primary" />}
          />
          <KpiCard
            title="Risk"
            value={hasRiskAssessment ? `${project.riskScore} - ${riskProfile?.classification}` : "No Assessment"}
            description={hasRiskAssessment ? `Deviation: ${riskProfile?.deviation}` : "This project has not been assessed"}
            icon={<AlertTriangle className={hasRiskAssessment ? "text-destructive" : "text-yellow-500"} />}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>
                Deliveries Overview
                 <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Deliveries Overview', chart: <DeliveriesChart projects={projectsToDisplay} /> })}>
                    <Maximize className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <DeliveriesChart projects={projectsToDisplay} />
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>
                Error Trends
                 <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Error Trends', chart: <ErrorsChart projects={projectsToDisplay} /> })}>
                    <Maximize className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorsChart projects={projectsToDisplay} />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Budget vs. Spent
                 <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Budget vs. Spent', chart: <BudgetChart projects={projectsToDisplay} /> })}>
                    <Maximize className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetChart projects={projectsToDisplay} />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>
                Time Error Trends
                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Time Error Trends', chart: <TimeErrorTrendsChart projects={projectsToDisplay} /> })}>
                    <Maximize className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeErrorTrendsChart projects={projectsToDisplay} />
            </CardContent>
          </Card>
        </div>
         <ChartDialog title="Chart" children={fullscreenChart} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-end">
        <Select onValueChange={handleProjectChange} defaultValue="all">
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {allProjects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Budget"
          value={`$${(kpis.totalBudget / 1_000_000).toFixed(2)}M`}
          description={`Budget for all active projects`}
          icon={<DollarSign className="text-primary" />}
        />
        <KpiCard
          title="Projects On Track"
          value={kpis.onTrackProjects.toString()}
          description="Cantidad de proyectos en curso"
          icon={<CheckCircle className="text-green-500" />}
        />
        <KpiCard
          title="High-Risk Projects"
          value={kpis.highRiskProjects.toString()}
          description={`Projects with Moderate to Very Aggressive risk`}
          icon={<AlertTriangle className="text-destructive" />}
        />
        <KpiCard
          title="Total Deliveries"
          value={kpis.totalDeliveries.toString()}
          description={`Total deliveries in 'Closed' state`}
          icon={<TrendingUp className="text-primary" />}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader>
              <CardTitle>
                Deliveries Overview
                 <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Deliveries Overview', chart: <DeliveriesChart projects={projectsToDisplay} /> })}>
                    <Maximize className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <DeliveriesChart projects={projectsToDisplay} />
            </CardContent>
          </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>
              Error Trends
               <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Error Trends', chart: <ErrorsChart projects={projectsToDisplay} /> })}>
                  <Maximize className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorsChart projects={projectsToDisplay} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Budget vs. Spent
               <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Budget vs. Spent', chart: <BudgetChart projects={projectsToDisplay} /> })}>
                  <Maximize className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetChart projects={projectsToDisplay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Time Error Trends
               <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setFullscreenChart({ title: 'Time Error Trends', chart: <TimeErrorTrendsChart projects={projectsToDisplay} /> })}>
                  <Maximize className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeErrorTrendsChart projects={projectsToDisplay} />
          </CardContent>
        </Card>
      </div>
      <ChartDialog title="Chart" children={fullscreenChart} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

    