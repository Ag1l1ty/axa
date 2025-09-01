
"use client";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, UploadCloud } from 'lucide-react';
import type { Project, Role } from '@/lib/types';
import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const ROLES: Role[] = ['Admin', 'PM/SM', 'Viewer', 'Portfolio Manager'];

const formSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters."),
    lastName: z.string().min(2, "Last name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    role: z.string().min(1, "Please select a role."),
    avatar: z.string().optional(),
    assignedProjectIds: z.array(z.string()).optional(),
});

type CreateUserDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onUserCreated: (values: z.infer<typeof formSchema>) => void;
    projects: Project[];
};

export function CreateUserDialog({ isOpen, onOpenChange, onUserCreated, projects }: CreateUserDialogProps) {
    const [preview, setPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            role: "",
            avatar: "",
            assignedProjectIds: [],
        },
    });

    React.useEffect(() => {
        if (!isOpen) {
            form.reset();
            setPreview(null);
        }
    }, [isOpen, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                form.setValue('avatar', result);
            };
            reader.readAsDataURL(file);
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        onUserCreated({ ...values, role: values.role as Role });
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Complete los detalles para agregar un nuevo miembro al equipo.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                        <div className="md:col-span-1 flex flex-col items-center gap-4">
                            <FormLabel>Fotografía</FormLabel>
                            <div className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                                {preview ? (
                                    <Image src={preview} alt="Avatar preview" width={128} height={128} className="object-cover w-full h-full" />
                                ) : (
                                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                            <Button type="button" asChild variant="outline" size="sm">
                                <label htmlFor="avatar-upload" className="cursor-pointer">
                                    Subir Imagen
                                    <Input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                                </label>
                            </Button>
                        </div>
                        
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellido</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Correo Electrónico</FormLabel>
                                        <FormControl><Input type="email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Nivel de Permisos</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar un rol" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assignedProjectIds"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Proyectos Asignados</FormLabel>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                    "w-full justify-between h-auto min-h-10",
                                                    !field.value?.length && "text-muted-foreground"
                                                    )}
                                                >
                                                    <div className="flex gap-1 flex-wrap">
                                                    {field.value?.map((projectId) => {
                                                         const project = projects.find(p => p.id === projectId);
                                                        return project ? <Badge variant="secondary" key={projectId}>{project.name}</Badge> : null
                                                    })}
                                                    {!field.value?.length && "Seleccionar proyectos..."}
                                                    </div>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Buscar proyecto..." />
                                                    <CommandList>
                                                        <CommandEmpty>No se encontraron proyectos.</CommandEmpty>
                                                        <CommandGroup>
                                                            {projects.map((project) => (
                                                            <CommandItem
                                                                value={project.name}
                                                                key={project.id}
                                                                onSelect={() => {
                                                                    const currentValues = field.value || [];
                                                                    const newValue = currentValues.includes(project.id)
                                                                        ? currentValues.filter(id => id !== project.id)
                                                                        : [...currentValues, project.id];
                                                                    field.onChange(newValue);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value?.includes(project.id) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {project.name}
                                                            </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="col-span-1 md:col-span-3">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Crear Usuario</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
