
"use client";

import React from 'react';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppHeader } from './header';
import { SidebarNav } from './sidebar-nav';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  // Show loading state while authentication is being initialized
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="AXA Logo" width={32} height={32} />
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-sidebar-foreground">AXA Insights</h2>
                <p className="text-xs text-sidebar-foreground/80">Portfolio Dashboard</p>
              </div>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 flex flex-col gap-2">
           {profile && (
              <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} />
                      <AvatarFallback>{profile.firstName.charAt(0)}{profile.lastName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                      <span className="text-sm font-medium text-sidebar-foreground">{profile.firstName} {profile.lastName}</span>
                      <span className="text-xs text-sidebar-foreground/70">{profile.role}</span>
                  </div>
              </div>
            )}
             <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
