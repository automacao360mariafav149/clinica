import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  ClipboardList, 
  MessageSquare, 
  Users, 
  MessageCircle, 
  Video, 
  Link2, 
  Settings,
  LogOut,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: BarChart3, 
      label: 'Métricas', 
      roles: ['owner'] 
    },
    { 
      path: '/agenda', 
      icon: Calendar, 
      label: 'Agenda', 
      roles: ['owner', 'doctor', 'secretary'] 
    },
    { 
      path: '/follow-up', 
      icon: ClipboardList, 
      label: 'Follow Up', 
      roles: ['owner', 'doctor', 'secretary'] 
    },
    { 
      path: '/assistant', 
      icon: MessageSquare, 
      label: 'Assistente', 
      roles: ['owner', 'doctor', 'secretary'] 
    },
    { 
      path: '/patients', 
      icon: Users, 
      label: 'Pacientes', 
      roles: ['owner', 'doctor', 'secretary'] 
    },
    { 
      path: '/whatsapp', 
      icon: MessageCircle, 
      label: 'WhatsApp', 
      roles: ['owner', 'secretary'] 
    },
    { 
      path: '/teleconsulta', 
      icon: Video, 
      label: 'Teleconsulta', 
      roles: ['owner', 'doctor'] 
    },
    { 
      path: '/connections', 
      icon: Link2, 
      label: 'Conexões', 
      roles: ['owner'] 
    },
    { 
      path: '/users', 
      icon: Settings, 
      label: 'Usuários', 
      roles: ['owner'] 
    },
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">MedClinic</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </Button>
      </div>
    </div>
  );
};
