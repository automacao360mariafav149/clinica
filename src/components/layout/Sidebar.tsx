import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  ClipboardList, 
  MessageSquare, 
  Users, 
  MessageCircle, 
  Video, 
  Plug,
  Settings,
  LogOut,
  Building2,
  FileSpreadsheet,
  UserCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      roles: ['owner', 'secretary'] 
    },
    { 
      path: '/assistant', 
      icon: MessageSquare, 
      label: 'Assistente', 
      roles: ['owner', 'doctor', 'secretary'] 
    },
    {
      icon: Users,
      label: 'Pacientes',
      roles: ['owner', 'doctor', 'secretary'],
      children: [
        { path: '/patients', label: 'Pacientes CRM' },
        { path: '/pre-patients', label: 'Pré Pacientes' }
      ]
    },
    { 
      path: '/convenios', 
      icon: Building2, 
      label: 'Convênios', 
      roles: ['doctor'] 
    },
    { 
      path: '/doctors-insurance', 
      icon: FileSpreadsheet, 
      label: 'Visão de Convênios', 
      roles: ['owner', 'secretary'] 
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
      path: '/integration', 
      icon: Plug, 
      label: 'Integração', 
      roles: ['owner'] 
    },
    { 
      path: '/clinic-info', 
      icon: Settings, 
      label: 'Informações da Clínica', 
      roles: ['owner'] 
    },
    { 
      path: '/users', 
      icon: Settings, 
      label: 'Usuários', 
      roles: ['owner'] 
    },
    { 
      path: '/profile', 
      icon: UserCircle, 
      label: 'Meu Perfil', 
      roles: ['owner', 'doctor', 'secretary'] 
    },
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 flex justify-center flex-shrink-0">
        <img src="/logo-interno.png" alt="MedX" className="w-32 h-32 object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          item.children ? (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground">
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="ml-6 space-y-1">
                {item.children.map((child: any) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/50'
                      }`
                    }
                  >
                    <span className="text-xs font-medium">{child.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ) : (
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
          )
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        <NavLink to="/profile" className="flex items-center gap-3 hover:bg-sidebar-accent/50 rounded-lg p-2 -m-2 transition-colors">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatar_url} alt={user?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.name ?? ''}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role ?? ''}</p>
          </div>
        </NavLink>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair</span>
        </Button>
      </div>
    </div>
  );
};
