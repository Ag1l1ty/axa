
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAdminForm } from "@/components/configure/user-admin-form";
import { ProjectAdminForm } from "@/components/configure/project-admin-form";
import { DeliveryAdminForm } from "@/components/configure/delivery-admin-form";
import { RiskAdminForm } from "@/components/configure/risk-admin-form";
import { Users, FolderKanban, Package, ShieldAlert } from "lucide-react";
import { ProtectedRoute } from '@/components/auth/protected-route';

function ConfigureContent() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Administración de la Herramienta</h2>
            <p className="text-muted-foreground mb-6">
                Utilice esta sección para administrar todos los aspectos de la herramienta de portafolio.
            </p>
            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">
                        <Users className="mr-2 h-4 w-4" />
                        Usuarios y Roles
                    </TabsTrigger>
                    <TabsTrigger value="projects">
                         <FolderKanban className="mr-2 h-4 w-4" />
                        Proyectos
                    </TabsTrigger>
                    <TabsTrigger value="deliveries">
                        <Package className="mr-2 h-4 w-4" />
                        Entregas
                    </TabsTrigger>
                    <TabsTrigger value="risk">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Riesgos
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="space-y-4">
                    <UserAdminForm />
                </TabsContent>
                <TabsContent value="projects" className="space-y-4">
                    <ProjectAdminForm />
                </TabsContent>
                <TabsContent value="deliveries" className="space-y-4">
                    <DeliveryAdminForm />
                </TabsContent>
                <TabsContent value="risk" className="space-y-4">
                    <RiskAdminForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ConfigurePage() {
    return (
        <ProtectedRoute requiredRole={['Admin', 'admin', 'Portfolio Manager']}>
            <ConfigureContent />
        </ProtectedRoute>
    );
}
