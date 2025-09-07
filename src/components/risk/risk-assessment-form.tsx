
"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, CheckCircle, Shield, TrendingUp } from 'lucide-react';
import { getProjects, updateProject } from '@/lib/supabase-data';
import { getProjectById, getRiskProfile, updateProjectRisk } from '@/lib/data';
import type { Project, RiskResult } from '@/lib/types';


const formSchema = z.object({
    projectId: z.string().min(1, "Project selection is required"),
    teamExperience: z.enum(['high', 'medium', 'low']),
    axaKnowledge: z.enum(['high', 'medium', 'low']),
    technicalUncertainty: z.enum(['low', 'medium', 'high']),
    technologyMaturity: z.enum(['stable', 'recent', 'emerging']),
    externalDependencies: z.enum(['low', 'medium', 'high']),
    organizationalComplexity: z.enum(['low', 'medium', 'high']),
});


export function RiskAssessmentForm() {
    const [result, setResult] = useState<RiskResult | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isUpdate, setIsUpdate] = useState(false);

    useEffect(() => {
        async function loadProjects() {
            const projectsData = await getProjects();
            setProjects(projectsData);
        }
        loadProjects();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId: '',
            teamExperience: 'medium',
            axaKnowledge: 'medium',
            technicalUncertainty: 'medium',
            technologyMaturity: 'stable',
            externalDependencies: 'low',
            organizationalComplexity: 'low',
        },
    });

    const projectId = form.watch('projectId');

    useEffect(() => {
        if (projectId && projects.length > 0) {
            const project = projects.find(p => p.id === projectId);
            if(project) {
                setSelectedProject(project);
                if (project.riskScore !== undefined && project.riskScore > 0) {
                    setIsUpdate(true);
                } else {
                    setIsUpdate(false);
                }
            }
        } else {
            setSelectedProject(null);
            setIsUpdate(false);
        }
    }, [projectId, projects]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        let score = 0;
        
        // teamExperience scoring
        if (values.teamExperience === 'medium') score += 1.5;
        if (values.teamExperience === 'low') score += 3;

        // axaKnowledge scoring
        if (values.axaKnowledge === 'medium') score += 1.5;
        if (values.axaKnowledge === 'low') score += 3;

        // technicalUncertainty scoring
        if (values.technicalUncertainty === 'medium') score += 1.5;
        if (values.technicalUncertainty === 'high') score += 3;

        // technologyMaturity scoring
        if (values.technologyMaturity === 'recent') score += 1.5;
        if (values.technologyMaturity === 'emerging') score += 3;

        // externalDependencies scoring
        if (values.externalDependencies === 'medium') score += 1.5;
        if (values.externalDependencies === 'high') score += 3;

        // organizationalComplexity scoring
        if (values.organizationalComplexity === 'medium') score += 1.5;
        if (values.organizationalComplexity === 'high') score += 3;
        
        const riskProfile = getRiskProfile(score);
        
        try {
            // Update project risk in Supabase
            const updateSuccess = await updateProject(values.projectId, {
                riskLevel: riskProfile.classification,
                riskScore: score
            });
            
            if (updateSuccess) {
                console.log('✅ Risk assessment updated successfully in Supabase');
                
                // Update local project risk (for mock compatibility)
                updateProjectRisk(values.projectId, score, riskProfile.classification);
                
                // Refresh projects data
                const projectsData = await getProjects();
                setProjects(projectsData);
                
                setResult({ ...riskProfile, score });
            } else {
                console.error('❌ Failed to update project risk in Supabase');
                alert('Error al guardar la valoración de riesgo. Intente de nuevo.');
            }
        } catch (error) {
            console.error('Error updating project risk:', error);
            alert('Error al guardar la valoración de riesgo. Intente de nuevo.');
        }
    }
    
    if (result) {
        const resultIcon = result.classification === 'Agresivo' || result.classification === 'Muy Agresivo' ? <AlertCircle className="w-16 h-16 text-destructive" /> : result.classification.includes('Moderado') ? <Shield className="w-16 h-16 text-yellow-500" /> : <CheckCircle className="w-16 h-16 text-green-500" />;
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Risk Assessment Result</CardTitle>
                    <CardDescription>Risk profile for project: {selectedProject?.name} has been {isUpdate ? 'updated' : 'created'}.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <div className="flex justify-center">{resultIcon}</div>
                    <p className="text-5xl font-bold">{result.classification} Risk</p>
                    <p className="text-muted-foreground">Calculated Risk Score: {result.score.toFixed(1)}</p>
                    <div className="text-sm border rounded-lg p-4 bg-secondary/50 inline-block">
                        <p><TrendingUp className="inline-block mr-2" />Potential Deviation: <span className="font-semibold">{result.deviation}</span></p>
                    </div>
                     <Button onClick={() => { form.reset({ projectId: '' }); setResult(null); setSelectedProject(null); setIsUpdate(false); }}>Assess Another Project</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona proyecto a valorar riesgo" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {projects.filter(p => !p.riskScore || p.riskScore === 0).map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedProject && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-semibold mb-2">Current Risk Profile</h4>
                        {selectedProject.riskScore !== undefined && selectedProject.riskScore > 0 ? (
                            <p className="text-sm">
                                Current Level: <span className="font-bold">{selectedProject.riskLevel}</span> (Score: {selectedProject.riskScore.toFixed(1)})
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">This project has not been assessed yet.</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Filling out and submitting this form will overwrite the current risk assessment.</p>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="teamExperience"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Experiencia del Equipo</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProject}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select team experience level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="high">Mayor o igual a 2 años en proyectos idénticos</SelectItem>
                                    <SelectItem value="medium">6 meses – 2 años en proyectos similares</SelectItem>
                                    <SelectItem value="low">Menor a 6 meses o equipo nuevo</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="axaKnowledge"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Conocimiento entorno AXA</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProject}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select team AXA knowledge level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="high">Equipo de desarrollo con más de un año trabajando en AXA</SelectItem>
                                    <SelectItem value="medium">Equipo de desarrollo con entre 3 y 12 meses trabajando en AXA</SelectItem>
                                    <SelectItem value="low">Equipo de desarrollo con menos de 3 meses o sin experiencia trabajando en AXA</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="technicalUncertainty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Incertidumbre Técnica</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProject}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select technical uncertainty level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">Cambios menores (mantenimiento, parches)</SelectItem>
                                    <SelectItem value="medium">Actualizaciones de versión / mejoras moderadas</SelectItem>
                                    <SelectItem value="high">Rediseño de servicio o flujo / Producto completamente nuevo</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 <FormField
                    control={form.control}
                    name="technologyMaturity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Madurez de la tecnología</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProject}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select technology maturity level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="stable">Tecnología ampliamente usada y estable</SelectItem>
                                    <SelectItem value="recent">Versión reciente de un producto conocido</SelectItem>
                                    <SelectItem value="emerging">Tecnología emergente o “proof-of-concept”</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="externalDependencies"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dependencia externa</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProject}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select external dependency level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">Ninguna o muy pocas (internas controlables)</SelectItem>
                                    <SelectItem value="medium">1 – 2 proveedores / 1 terceros críticos externas al equipo de proyecto</SelectItem>
                                    <SelectItem value="high">Mayor o igual a 3 terceros críticos o dependencias externas al equipo de proyecto</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="organizationalComplexity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Complejidad organizacional</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProject}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select organizational complexity level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">Único departamento, con prioridades alineadas y sin cambios</SelectItem>
                                    <SelectItem value="medium">Varios departamentos involucrados con prioridades moderadamente alineadas</SelectItem>
                                    <SelectItem value="high">Múltiples áreas con objetivos contrapuestos y de baja disponibilidad</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <Button type="submit" disabled={!selectedProject}>
                    {isUpdate ? 'Update Risk Profile' : 'Calculate and Save Risk'}
                </Button>
            </form>
        </Form>
    );
}
