import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import Particles from '@/components/backgrounds/Particles';

interface DashboardLayoutProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const DashboardLayout = ({ children, requiredRoles }: DashboardLayoutProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    return <Navigate to="/agenda" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background relative">
      {/* Particles Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <Particles
          particleCount={100}
          particleColor="#5227FF"
          particleSize={3}
          speed={0.3}
          connectionDistance={150}
          showConnections={true}
        />
      </div>
      
      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10">
        {children}
      </main>
    </div>
  );
};
