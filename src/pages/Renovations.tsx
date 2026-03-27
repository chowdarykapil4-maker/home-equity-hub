import { useAppContext } from '@/context/AppContext';
import { getEstimateMidpoint } from '@/types';
import { formatCurrency } from '@/lib/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompletedTab from '@/components/renovations/CompletedTab';
import PlannedTab from '@/components/renovations/PlannedTab';
import WishlistTab from '@/components/renovations/WishlistTab';
import AllProjectsTab from '@/components/renovations/AllProjectsTab';
import { CheckCircle2, ClipboardList, Lightbulb, List } from 'lucide-react';

export default function Renovations() {
  const { projects } = useAppContext();

  const completed = projects.filter(p => p.status === 'Complete');
  const planned = projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress');
  const wishlist = projects.filter(p => p.status === 'Wishlist');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Renovation Planner</h2>
        {/* Pipeline mini bar */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-muted px-2 py-1 rounded">{wishlist.length} ideas</span>
          <span>→</span>
          <span className="bg-primary/10 text-primary px-2 py-1 rounded">{planned.length} planned</span>
          <span>→</span>
          <span className="bg-success/10 text-success px-2 py-1 rounded">{completed.length} done</span>
        </div>
      </div>

      <Tabs defaultValue="completed" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="completed" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            <span className="ml-1 text-xs text-muted-foreground">({completed.length})</span>
          </TabsTrigger>
          <TabsTrigger value="planned" className="gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> Planned
            <span className="ml-1 text-xs text-muted-foreground">({planned.length})</span>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-1">
            <Lightbulb className="h-3.5 w-3.5" /> Wishlist
            <span className="ml-1 text-xs text-muted-foreground">({wishlist.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1">
            <List className="h-3.5 w-3.5" /> All Projects
            <span className="ml-1 text-xs text-muted-foreground">({projects.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          <CompletedTab projects={projects} />
        </TabsContent>
        <TabsContent value="planned">
          <PlannedTab projects={projects} allProjects={projects} />
        </TabsContent>
        <TabsContent value="wishlist">
          <WishlistTab projects={projects} />
        </TabsContent>
        <TabsContent value="all">
          <AllProjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
