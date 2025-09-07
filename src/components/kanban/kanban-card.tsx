import type { Delivery, ProjectStage } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight, Calendar, Flag, Archive, Package, Bug, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { Draggable } from 'react-beautiful-dnd';
import { formatDate, formatNumber } from '@/lib/date-utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanCardProps {
    delivery: Delivery;
    index: number;
    onArchive: (deliveryId: string) => void;
    onUpdateDelivery: (deliveryId: string, updatedFields: Partial<Delivery>) => void;
}

const STAGES: ProjectStage[] = ['Definición', 'Desarrollo Local', 'Ambiente DEV', 'Ambiente TST', 'Ambiente UAT', 'Soporte Productivo', 'Cerrado'];


export function KanbanCard({ delivery, index, onArchive, onUpdateDelivery }: KanbanCardProps) {

    const handleTstFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdateDelivery(delivery.id, { [name]: value ? Number(value) : undefined });
    }
    
    const isTstOrLater = STAGES.indexOf(delivery.stage) >= STAGES.indexOf('Ambiente TST');
    const isTst = delivery.stage === 'Ambiente TST';
    const showTstFields = isTstOrLater && (delivery.errorCount !== undefined || delivery.errorSolutionTime !== undefined || isTst);


    return (
        <Draggable draggableId={delivery.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Card className={`hover:shadow-md transition-shadow duration-200 bg-card ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                        <CardHeader className="p-3 pb-2 flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold">Entrega #{delivery.deliveryNumber}</CardTitle>
                                <p className="text-xs text-muted-foreground">{delivery.projectName}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onArchive(delivery.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Archivar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-2">
                           <div className="flex items-center gap-2">
                             <Calendar className="w-3 h-3" />
                             <span>{formatDate(delivery.estimatedDate)}</span>
                           </div>
                            <div className="flex items-center gap-2">
                                <Flag className="w-3 h-3" />
                                <span>Budget: ${formatNumber(delivery.budget)}</span>
                            </div>
                            {showTstFields && (
                                <div className="space-y-2 pt-2 border-t mt-2">
                                    <div className="space-y-1">
                                        <Label htmlFor={`errorCount-${delivery.id}`} className="text-xs flex items-center gap-1"><Bug className="w-3 h-3" /> Cantidad Errores</Label>
                                        <Input
                                            id={`errorCount-${delivery.id}`}
                                            name="errorCount"
                                            type="number"
                                            className="h-7 text-xs"
                                            placeholder="0"
                                            value={delivery.errorCount ?? ''}
                                            onChange={handleTstFieldChange}
                                            onClick={(e) => e.stopPropagation()} // Prevent drag from starting on click
                                            onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on click
                                            readOnly={!isTst}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`errorSolutionTime-${delivery.id}`} className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Tiempo Solución (días)</Label>
                                        <Input
                                            id={`errorSolutionTime-${delivery.id}`}
                                            name="errorSolutionTime"
                                            type="number"
                                            className="h-7 text-xs"
                                            placeholder="0"
                                            value={delivery.errorSolutionTime ?? ''}
                                            onChange={handleTstFieldChange}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            readOnly={!isTst}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex justify-between items-center">
                             <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://picsum.photos/seed/${delivery.owner.name}/100`} alt={delivery.owner.name} />
                                <AvatarFallback>{delivery.owner.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/deliveries/${delivery.id}`} passHref>
                                <Button variant="ghost" size="sm" className="h-8">
                                    Ver detalle entrega <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
