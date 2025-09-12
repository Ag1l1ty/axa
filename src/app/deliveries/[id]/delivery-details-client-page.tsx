
"use client"

import { getDeliveryById, getProjectById, updateDelivery, updateProject, getBudgetHistory, saveBudgetHistory, updateStageTransitions } from "@/lib/supabase-data";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProjectDetailCard } from "@/components/projects/project-detail-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, Calendar, Users, Target, Package, AlertCircle, ArrowLeft, History, Edit3 } from "lucide-react";
import { DeliveryBudgetChart } from "@/components/deliveries/delivery-budget-chart";
import { DeliveryErrorsChart } from "@/components/deliveries/delivery-errors-chart";
import { DeliveryPlanChart } from "@/components/deliveries/delivery-plan-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { differenceInDays, isBefore, format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BudgetHistoryEntry, Delivery, Project } from "@/lib/types";

export default function DeliveryDetailsClientPage({ id }: { id: string }) {
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [budgetSpent, setBudgetSpent] = useState(0);
    const [formattedBudgetSpent, setFormattedBudgetSpent] = useState("0");
    const [budgetHistory, setBudgetHistory] = useState<BudgetHistoryEntry[]>([]);
    const [showUpdateWarning, setShowUpdateWarning] = useState(true);
    const [isConfirmingBudget, setConfirmingBudget] = useState(false);
    const [pendingBudget, setPendingBudget] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [actualDeliveryDate, setActualDeliveryDate] = useState("");
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [actualStartDate, setActualStartDate] = useState("");
    const [isEditingStartDate, setIsEditingStartDate] = useState(false);
    const [isEditingTimeline, setIsEditingTimeline] = useState(false);
    const [timelineStages, setTimelineStages] = useState<{stage: string, date: string}[]>([]);
    const [editableStages, setEditableStages] = useState<{stage: string, date: string}[]>([]);

    useEffect(() => {
        setIsClient(true);
        const loadDeliveryData = async () => {
            try {
                const deliveryData = await getDeliveryById(id);
                if (deliveryData) {
                    setDelivery(deliveryData);
                    const initialSpent = deliveryData.budgetSpent || 0;
                    setBudgetSpent(initialSpent);
                    setFormattedBudgetSpent(new Intl.NumberFormat('en-US').format(initialSpent));
                    setActualStartDate(deliveryData.actualStartDate ? deliveryData.actualStartDate.split('T')[0] : "");
                    setActualDeliveryDate(deliveryData.actualDeliveryDate ? deliveryData.actualDeliveryDate.split('T')[0] : "");
                    
                    // Cargar historial real desde Supabase
                    const history = await getBudgetHistory(id);
                    setBudgetHistory(history);
                    console.log('📊 Budget history loaded:', history);
                }
            } catch (error) {
                console.error('Error loading delivery data:', error);
            }
        };
        
        const loadTimelineData = async () => {
            try {
                const { getStageTransitions } = await import("@/lib/supabase-data");
                const transitions = await getStageTransitions(id);
                setTimelineStages(transitions);
                setEditableStages(transitions.map(t => ({ ...t })));
            } catch (error) {
                console.error('Error loading timeline data:', error);
            }
        };
        
        loadDeliveryData();
        loadTimelineData();
    }, [id]);


    useEffect(() => {
        const loadProjectData = async () => {
            if (delivery) {
                try {
                    const projectData = await getProjectById(delivery.projectId);
                    setProject(projectData);
                } catch (error) {
                    console.error('Error loading project data:', error);
                }
            }
        };
        loadProjectData();
    }, [delivery]);

    if (!delivery || !project) {
        return <div>Loading...</div>;
    }

    const totalDeliveries = project.projectedDeliveries || 0;
    const currentDeliveryNumber = delivery.deliveryNumber;

    const lastUpdate = delivery.lastBudgetUpdate ? new Date(delivery.lastBudgetUpdate) : null;
    const needsUpdate = lastUpdate ? differenceInDays(new Date(), lastUpdate) > 7 : true;


    const handleBudgetUpdateClick = () => {
        setPendingBudget(budgetSpent);
        setConfirmingBudget(true);
    };

    const handleConfirmBudgetUpdate = async () => {
        try {
            const updateDate = new Date().toISOString();
            
            // Actualizar el delivery en Supabase
            const deliveryUpdateSuccess = await updateDelivery(delivery.id, {
                budgetSpent: pendingBudget,
                lastBudgetUpdate: updateDate
            });

            if (deliveryUpdateSuccess) {
                // Guardar en el historial de presupuesto
                const historySuccess = await saveBudgetHistory(delivery.id, pendingBudget, updateDate);
                console.log('💾 Budget history saved:', historySuccess);

                // Actualizar el estado local del delivery
                const newHistoryEntry: BudgetHistoryEntry = {
                    date: updateDate,
                    amount: pendingBudget,
                };

                setBudgetHistory(prevHistory => [newHistoryEntry, ...prevHistory]);
                setBudgetSpent(pendingBudget);
                
                // Calcular el nuevo budget_spent total del proyecto
                const updatedProjectBudgetSpent = await calculateProjectBudgetSpent(delivery.projectId, delivery.id, pendingBudget);
                
                // Actualizar el proyecto en Supabase
                const projectUpdateSuccess = await updateProject(project.id, {
                    budgetSpent: updatedProjectBudgetSpent
                });

                if (projectUpdateSuccess) {
                    // Actualizar el estado local del proyecto
                    setProject(prev => prev ? { ...prev, budgetSpent: updatedProjectBudgetSpent } : null);
                }

                setShowUpdateWarning(false);
                setConfirmingBudget(false);
                
                if (historySuccess) {
                    console.log('✅ Budget updated and history saved successfully');
                }
            } else {
                console.error('Error updating delivery budget');
                alert('Error al actualizar el presupuesto. Intente de nuevo.');
            }
        } catch (error) {
            console.error('Error in handleConfirmBudgetUpdate:', error);
            alert('Error al actualizar el presupuesto. Intente de nuevo.');
        }
    }

    const calculateProjectBudgetSpent = async (projectId: string, currentDeliveryId: string, newBudgetSpent: number): Promise<number> => {
        try {
            // Obtener todos los deliveries del proyecto desde Supabase
            const { getDeliveries } = await import("@/lib/supabase-data");
            const allDeliveries = await getDeliveries();
            
            // Filtrar solo los deliveries de este proyecto
            const projectDeliveries = allDeliveries.filter(d => d.projectId === projectId);
            
            // Sumar todos los budget_spent, usando el nuevo valor para el delivery actual
            const totalSpent = projectDeliveries.reduce((total, delivery) => {
                if (delivery.id === currentDeliveryId) {
                    return total + newBudgetSpent;
                } else {
                    return total + (delivery.budgetSpent || 0);
                }
            }, 0);
            
            return totalSpent;
        } catch (error) {
            console.error('Error calculating project budget spent:', error);
            return 0;
        }
    }
    
    const handleBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = Number(value.replace(/[^0-9]/g, ''));

        if (!isNaN(numericValue)) {
            setBudgetSpent(numericValue);
            setFormattedBudgetSpent(new Intl.NumberFormat('en-US').format(numericValue));
        } else {
             setBudgetSpent(0);
            setFormattedBudgetSpent("0");
        }
    };

    const handleActualDateUpdate = async () => {
        if (!actualDeliveryDate) {
            alert('Por favor selecciona una fecha válida');
            return;
        }

        try {
            // Crear fecha local a mediodía para evitar problemas de timezone
            const localDate = new Date(actualDeliveryDate + 'T12:00:00');
            const isoString = localDate.toISOString();
            
            const updateSuccess = await updateDelivery(delivery.id, {
                actualDeliveryDate: isoString
            });

            if (updateSuccess) {
                setDelivery(prev => prev ? { ...prev, actualDeliveryDate: isoString } : null);
                setIsEditingDate(false);
                console.log('✅ Actual delivery date updated successfully');
            } else {
                alert('Error al actualizar la fecha real de entrega');
            }
        } catch (error) {
            console.error('Error updating actual delivery date:', error);
            alert('Error al actualizar la fecha real de entrega');
        }
    };

    const handleActualStartDateUpdate = async () => {
        if (!actualStartDate) {
            alert('Por favor selecciona una fecha válida');
            return;
        }

        try {
            // Crear fecha local a mediodía para evitar problemas de timezone
            const localDate = new Date(actualStartDate + 'T12:00:00');
            const isoString = localDate.toISOString();
            
            const updateSuccess = await updateDelivery(delivery.id, {
                actualStartDate: isoString
            });

            if (updateSuccess) {
                setDelivery(prev => prev ? { ...prev, actualStartDate: isoString } : null);
                setIsEditingStartDate(false);
                console.log('✅ Actual start date updated successfully');
            } else {
                alert('Error al actualizar la fecha real de inicio');
            }
        } catch (error) {
            console.error('Error updating actual start date:', error);
            alert('Error al actualizar la fecha real de inicio');
        }
    };
    
    const handleSaveTimeline = async () => {
        try {
            const success = await updateStageTransitions(delivery.id, editableStages);
            if (success) {
                setTimelineStages([...editableStages]);
                setIsEditingTimeline(false);
                console.log('✅ Timeline updated successfully');
                // Recargar la página para refrescar el gráfico
                window.location.reload();
            } else {
                alert('Error al actualizar el timeline. Intente de nuevo.');
            }
        } catch (error) {
            console.error('Error saving timeline:', error);
            alert('Error al actualizar el timeline. Intente de nuevo.');
        }
    };
    
    const handleStageChange = (index: number, field: 'stage' | 'date', value: string) => {
        const newStages = [...editableStages];
        newStages[index] = { ...newStages[index], [field]: value };
        setEditableStages(newStages);
    };
    
    const addStage = () => {
        const newStage = {
            stage: 'Desarrollo Local',
            date: new Date().toISOString().split('T')[0] + 'T12:00:00.000Z'
        };
        setEditableStages([...editableStages, newStage]);
    };
    
    const removeStage = (index: number) => {
        if (editableStages.length > 1) {
            const newStages = editableStages.filter((_, i) => i !== index);
            setEditableStages(newStages);
        }
    };


    return (
        <>
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Detalle Entrega #{delivery.deliveryNumber}</h2>
                        <p className="text-muted-foreground">Proyecto: <a href={`/projects/${project.id}`} className="text-primary hover:underline">{project.name}</a></p>
                    </div>
                    <Link href="/kanban">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Kanban
                        </Button>
                    </Link>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <ProjectDetailCard title="Status" value={delivery.stage} icon={<Target />} />
                    <ProjectDetailCard title="Budget estimado delivery" value={`$${delivery.budget.toLocaleString()}`} icon={<DollarSign />} />
                    <ProjectDetailCard title="Fecha entrega planeada" value={new Date(delivery.estimatedDate).toLocaleDateString()} icon={<Calendar />} />
                    <Card className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">Fecha inicio real</h3>
                        </div>
                        {!isEditingStartDate ? (
                            <div className="space-y-2">
                                <p className="text-lg font-semibold">
                                    {delivery.actualStartDate ? new Date(delivery.actualStartDate).toLocaleDateString() : new Date(delivery.creationDate).toLocaleDateString()}
                                </p>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsEditingStartDate(true)}
                                    className="text-xs"
                                >
                                    {delivery.actualStartDate ? "Editar" : "Editar"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={actualStartDate}
                                    onChange={(e) => setActualStartDate(e.target.value)}
                                />
                                <div className="flex space-x-1">
                                    <Button size="sm" onClick={handleActualStartDateUpdate} className="text-xs">
                                        Guardar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                            setIsEditingStartDate(false);
                                            setActualStartDate(delivery.actualStartDate ? delivery.actualStartDate.split('T')[0] : "");
                                        }}
                                        className="text-xs"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">Fecha entrega real</h3>
                        </div>
                        {!isEditingDate ? (
                            <div className="space-y-2">
                                <p className="text-lg font-semibold">
                                    {delivery.actualDeliveryDate ? new Date(delivery.actualDeliveryDate).toLocaleDateString() : "No establecida"}
                                </p>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsEditingDate(true)}
                                    className="text-xs"
                                >
                                    {delivery.actualDeliveryDate ? "Editar" : "Establecer"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={actualDeliveryDate}
                                    onChange={(e) => setActualDeliveryDate(e.target.value)}
                                />
                                <div className="flex space-x-1">
                                    <Button size="sm" onClick={handleActualDateUpdate} className="text-xs">
                                        Guardar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                            setIsEditingDate(false);
                                            setActualDeliveryDate(delivery.actualDeliveryDate ? delivery.actualDeliveryDate.split('T')[0] : "");
                                        }}
                                        className="text-xs"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                    <ProjectDetailCard title="Deliveries" value={`${currentDeliveryNumber} / ${totalDeliveries}`} icon={<Package />} />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Trends Delivery Plans</CardTitle>
                                    <CardDescription>Línea de tiempo planeada vs. el estado real de la entrega.</CardDescription>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsEditingTimeline(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Editar Timeline
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <DeliveryPlanChart delivery={delivery} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Uso del Presupuesto</CardTitle>
                            <CardDescription>Actualice el presupuesto ejecutado para esta entrega.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                                <Label htmlFor="budget-spent">Presupuesto Ejecutado ($)</Label>
                                <Input 
                                    id="budget-spent" 
                                    type="text"
                                    value={formattedBudgetSpent}
                                    onChange={handleBudgetInputChange}
                                />
                           </div>
                           <Button onClick={handleBudgetUpdateClick} className="w-full">Actualizar Uso</Button>
                            {needsUpdate && showUpdateWarning && (
                                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-500/10 rounded-md">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>El presupuesto no se ha actualizado en más de una semana.</span>
                                </div>
                            )}
                             <DeliveryBudgetChart delivery={delivery} currentSpent={budgetSpent} />
                             {isClient && budgetHistory.length > 0 && (
                                <div className="space-y-3 pt-4 border-t">
                                    <h4 className="flex items-center text-sm font-semibold">
                                        <History className="mr-2 h-4 w-4" />
                                        Historial de Actualizaciones
                                    </h4>
                                    <ul className="space-y-2 text-xs text-muted-foreground">
                                        {budgetHistory.slice().reverse().map((entry, index) => (
                                            <li key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                                                <span>{format(new Date(entry.date), "MMM d, yyyy 'at' h:mm a")}</span>
                                                <span className="font-medium text-foreground">${entry.amount.toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Trends Errores</CardTitle>
                         <CardDescription>Cantidad de errores y tiempo promedio de solución.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeliveryErrorsChart delivery={delivery} />
                    </CardContent>
                </Card>

            </div>

            <AlertDialog open={isConfirmingBudget} onOpenChange={setConfirmingBudget}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Actualización de Presupuesto</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas establecer el presupuesto ejecutado en ${pendingBudget.toLocaleString()}? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmingBudget(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmBudgetUpdate}>Sí, actualizar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Dialog open={isEditingTimeline} onOpenChange={setIsEditingTimeline}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Timeline de Entrega</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {editableStages.map((stage, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <Label>Etapa</Label>
                                    <Select 
                                        value={stage.stage} 
                                        onValueChange={(value) => handleStageChange(index, 'stage', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Definición">Definición</SelectItem>
                                            <SelectItem value="Desarrollo Local">Desarrollo Local</SelectItem>
                                            <SelectItem value="Ambiente DEV">Ambiente DEV</SelectItem>
                                            <SelectItem value="Ambiente TST">Ambiente TST</SelectItem>
                                            <SelectItem value="Ambiente UAT">Ambiente UAT</SelectItem>
                                            <SelectItem value="Soporte Productivo">Soporte Productivo</SelectItem>
                                            <SelectItem value="Cerrado">Cerrado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Fecha</Label>
                                    <Input
                                        type="datetime-local"
                                        value={stage.date.slice(0, 16)}
                                        onChange={(e) => handleStageChange(index, 'date', e.target.value + ':00.000Z')}
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => removeStage(index)}
                                        disabled={editableStages.length === 1}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))}
                        
                        <Button 
                            variant="outline" 
                            onClick={addStage}
                            className="w-full"
                        >
                            + Agregar Etapa
                        </Button>
                    </div>
                    
                    <DialogFooter className="mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsEditingTimeline(false);
                                setEditableStages(timelineStages.map(t => ({ ...t })));
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveTimeline}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
