// Update this page (the content is just a fallback if you fail to update the page)
import Particles from '@/components/backgrounds/Particles';

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Particles
          particleCount={100}
          particleColor="#5227FF"
          particleSize={3}
          speed={0.3}
          connectionDistance={150}
          showConnections={true}
        />
      </div>
      <div className="text-center relative z-10">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

export default Index;
