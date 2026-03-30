import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompletedTab from '@/components/renovations/CompletedTab';
import PlannedTab from '@/components/renovations/PlannedTab';
import WishlistTab from '@/components/renovations/WishlistTab';
import AllProjectsTab from '@/components/renovations/AllProjectsTab';
import RenovationSummaryHeader from '@/components/renovations/RenovationSummaryHeader';
import { CheckCircle2, ClipboardList, Lightbulb, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEstimateMidpoint } from '@/types';
import { formatCurrency } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = [
  'hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(270, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(330, 70%, 55%)', 'hsl(50, 80%, 50%)', 'hsl(160, 60%, 40%)',
];

export default function Renovations() {
  const { projects } = useAppContext();
  const [activeTab, setActiveTab] = useState('completed');

  const completed = projects.filter(p => p.status === 'Complete');
  const planned = projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress');
  const wishlist = projects.filter(p => p.status === 'Wishlist');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <RenovationSummaryHeader projects={projects} onTabChange={setActiveTab} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
