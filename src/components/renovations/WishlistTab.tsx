import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  RenovationProject, ProjectCategory, CATEGORY_COLORS, ROICategory,
  getEstimateMidpoint, getROIPercentage,
} from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowRight, Trash2, Pencil } from 'lucide-react';

const CATEGORIES: ProjectCategory[] = ['Structural', 'HVAC & Mechanical', 'Insulation & Envelope', 'Windows & Doors', 'Interior Finish', 'Kitchen & Bath', 'Exterior', 'Electrical', 'Plumbing', 'Landscaping', 'Other'];
const ROI_CATEGORIES: ROICategory[] = ['High 75%', 'Medium 60%', 'Low 35%', 'Maintenance 10%', 'Custom'];

interface Props {
  projects: RenovationProject[];
}

export default function WishlistTab({ projects }: Props) {
  const ctx = useAppContext();
  const { addProject, updateProject, deleteProject } = ctx;
  const planningColumns = ctx.planningColumns || { columns: [] };
  const columns = planningColumns.columns && planningColumns.columns.length > 0 ? planningColumns.columns : ['Q2-Q3 2026', 'Q4 2026', '2027', '2028+'];
  const wishlist = projects.filter(p => p.status === 'Wishlist');

  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState<ProjectCategory>('Other');
  const [editProject, setEditProject] = useState<RenovationProject | null>(null);
  const [promoteProject, setPromoteProject] = useState<RenovationProject | null>(null);
  const [promoteColumn, setPromoteColumn] = useState(columns[0]);
  const [sortBy, setSortBy] = useState<string>('roi');
  const [filterCat, setFilterCat] = useState<string>('all');

  const hasEstimate = (p: RenovationProject) => p.estimateLow > 0 || p.estimateHigh > 0;
  const estimatedCount = wishlist.filter(hasEstimate).length;
  const totalEstCost = wishlist.filter(hasEstimate).reduce((s, p) => s + getEstimateMidpoint(p), 0);

  let filtered = [...wishlist];
  if (filterCat !== 'all') filtered = filtered.filter(p => p.category === filterCat);

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'roi': return getROIPercentage(b) - getROIPercentage(a);
      case 'cost': return getEstimateMidpoint(a) - getEstimateMidpoint(b);
      case 'category': return a.category.localeCompare(b.category);
      default: return 0;
    }
  });

  const handleQuickAdd = () => {
    if (!quickName.trim()) return;
    addProject({
      id: crypto.randomUUID(),
      projectName: quickName.trim(),
      status: 'Wishlist',
      category: quickCategory,
      dateCompleted: '',
      estimateLow: 0,
      estimateHigh: 0,
      actualCost: 0,
      vendorName: '',
      roiCategory: 'Medium 60%',
      customROIPercentage: 0,
      notes: '',
      dateAddedToWishlist: new Date().toISOString().slice(0, 10),
    });
    setQuickName('');
  };

  const handlePromote = () => {
    if (!promoteProject) return;
    const newStatus = promoteColumn.includes('2027') || promoteColumn.includes('2028') ? 'Planned 2027' as const : 'Planned 2026' as const;
    updateProject({
      ...promoteProject,
      status: newStatus,
      planningColumn: promoteColumn,
      datePromotedToPlanned: new Date().toISOString().slice(0, 10),
    });
    setPromoteProject(null);
  };

  const handleEditSave = () => {
    if (!editProject) return;
    updateProject(editProject);
    setEditProject(null);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Wishlist Items</p><p className="text-lg font-bold">{wishlist.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total if All Done</p><p className="text-lg font-bold">{formatCurrency(totalEstCost)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Estimated</p><p className="text-lg font-bold">{estimatedCount} of {wishlist.length}</p></CardContent></Card>
      </div>

      {/* Quick Add */}
      <div className="flex gap-2">
        <Input
          placeholder="New idea..."
          value={quickName}
          onChange={e => setQuickName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
          className="flex-1"
        />
        <Select value={quickCategory} onValueChange={v => setQuickCategory(v as ProjectCategory)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={handleQuickAdd}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="roi">Highest ROI</SelectItem>
            <SelectItem value="cost">Lowest Cost</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-12 col-span-full">No wishlist items yet. Add an idea above!</p>
        )}
        {filtered.map(p => {
          const catColor = CATEGORY_COLORS[p.category as ProjectCategory] || 'hsl(215, 16%, 47%)';
          const hasEst = hasEstimate(p);
          return (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground">{p.projectName}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditProject({ ...p })}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteProject(p.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className="text-[9px] px-1.5 py-0 border-0" style={{ backgroundColor: catColor, color: '#fff' }}>{p.category}</Badge>
                  {p.roiCategory && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {p.roiCategory === 'Custom' ? `${p.customROIPercentage}% ROI` : p.roiCategory}
                    </Badge>
                  )}
                </div>
                {hasEst ? (
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.estimateLow)} – {formatCurrency(p.estimateHigh)}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">TBD</p>
                )}
                {p.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.notes}</p>
                )}
                {p.dateAddedToWishlist && (
                  <p className="text-[10px] text-muted-foreground">Added: {p.dateAddedToWishlist}</p>
                )}
                <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => { setPromoteProject(p); setPromoteColumn(columns[0]); }}>
                  <ArrowRight className="h-3 w-3 mr-1" /> Promote to Planned
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Promote Dialog */}
      <Dialog open={!!promoteProject} onOpenChange={v => !v && setPromoteProject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promote: {promoteProject?.projectName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Target Timeline</Label>
              <Select value={promoteColumn} onValueChange={setPromoteColumn}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handlePromote}>Move to Planned</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={v => !v && setEditProject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit: {editProject?.projectName}</DialogTitle></DialogHeader>
          {editProject && (
            <div className="grid gap-3 py-2">
              <div><Label>Project Name</Label><Input value={editProject.projectName} onChange={e => setEditProject({ ...editProject, projectName: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={editProject.category} onValueChange={v => setEditProject({ ...editProject, category: v as ProjectCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Estimate Low</Label><Input type="number" value={editProject.estimateLow || ''} onChange={e => setEditProject({ ...editProject, estimateLow: +e.target.value })} /></div>
                <div><Label>Estimate High</Label><Input type="number" value={editProject.estimateHigh || ''} onChange={e => setEditProject({ ...editProject, estimateHigh: +e.target.value })} /></div>
              </div>
              <div><Label>ROI Category</Label>
                <Select value={editProject.roiCategory} onValueChange={v => setEditProject({ ...editProject, roiCategory: v as ROICategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROI_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {editProject.roiCategory === 'Custom' && (
                <div><Label>Custom ROI %</Label><Input type="number" value={editProject.customROIPercentage || ''} onChange={e => setEditProject({ ...editProject, customROIPercentage: +e.target.value })} /></div>
              )}
              <div><Label>Notes</Label><Textarea value={editProject.notes} onChange={e => setEditProject({ ...editProject, notes: e.target.value })} /></div>
              <Button onClick={handleEditSave}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
