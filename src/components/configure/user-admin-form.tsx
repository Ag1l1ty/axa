
"use client";

import { useState, useEffect } from 'react';
import { getProjects, getUsers, createUser, updateUser, deleteUser } from '@/lib/supabase-data';
import { signUp } from '@/lib/auth';
import type { User, Role, Project } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { useAuth } from '@/hooks/use-auth';
import { CreateUserDialog } from './create-user-dialog';
import { useToast } from '@/hooks/use-toast';

export function UserAdminForm() {
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();
    const isManager = profile?.role === 'Admin' || profile?.role === 'Portfolio Manager';
    const [isCreateUserDialogOpen, setCreateUserDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isConfirmingDelete, setConfirmingDelete] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const [usersData, projectsData] = await Promise.all([
                    getUsers(),
                    getProjects()
                ]);
                setUsers(usersData);
                setProjects(projectsData);
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudieron cargar los datos."
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [toast]);

    const getUserProjectCount = (user: User) => {
        return user.assignedProjectIds?.length || 0;
    };
    
    const handleEditClick = (user: User) => {
        setUserToEdit(user);
        setCreateUserDialogOpen(true);
    }
    
    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setConfirmingDelete(true);
    }

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            const success = await deleteUser(userToDelete.id);
            if (success) {
                setUsers(users.filter(u => u.id !== userToDelete.id));
                toast({
                    title: "Usuario Eliminado",
                    description: `El usuario ${userToDelete.firstName} ${userToDelete.lastName} ha sido eliminado.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo eliminar el usuario.",
                });
            }
        }
        setConfirmingDelete(false);
        setUserToDelete(null);
    }


    const handleUserSubmit = async (values: Omit<User, 'id'> & { password?: string }, id?: string) => {
        if (id) {
            // Update existing user - remove password from values for update
            const { password, ...updateValues } = values;
            const success = await updateUser(id, updateValues);
            if (success) {
                setUsers(users.map(u => u.id === id ? { ...u, ...updateValues } : u));
                toast({
                    title: "Usuario Actualizado",
                    description: `Los datos de ${updateValues.firstName} ${updateValues.lastName} han sido actualizados.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo actualizar el usuario.",
                });
            }
        } else {
            // Create new user - password is required for new users
            if (!values.password) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "La contraseña es requerida para nuevos usuarios.",
                });
                return;
            }
            
            const newUser = await createUser(values as Omit<User, 'id'> & { password: string });
            if (newUser) {
                setUsers(prevUsers => [...prevUsers, newUser]);
                toast({
                    title: "Usuario Creado",
                    description: `El usuario ${newUser.firstName} ${newUser.lastName} ha sido creado con éxito.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo crear el usuario.",
                });
            }
        }
        setCreateUserDialogOpen(false);
        setUserToEdit(null);
    };

    const handleDialogClose = () => {
        setCreateUserDialogOpen(false);
        setUserToEdit(null);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios y Roles</CardTitle>
                    <CardDescription>
                        Administre los usuarios de su equipo y sus roles asignados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end mb-4">
                        {isManager && (
                            <Button onClick={() => setCreateUserDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Agregar Usuario
                            </Button>
                        )}
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Proyectos Asignados</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                                                    <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="grid gap-0.5">
                                                    <span className="font-semibold">{user.firstName} {user.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'Admin' || user.role === 'Portfolio Manager' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>{getUserProjectCount(user)}</TableCell>
                                        <TableCell>
                                            {isManager && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEditClick(user)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteClick(user)}>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <CreateUserDialog
                isOpen={isCreateUserDialogOpen}
                onOpenChange={handleDialogClose}
                onUserSubmit={handleUserSubmit}
                projects={projects}
                user={userToEdit}
            />
            <AlertDialog open={isConfirmingDelete} onOpenChange={setConfirmingDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario {userToDelete?.firstName} {userToDelete?.lastName}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmingDelete(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
