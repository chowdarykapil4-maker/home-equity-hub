import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  RenovationProject, ProjectCategory, ROICategory,
  getEstimatedValueAdded, getROIPercentage, CATEGORY_COLORS,
} from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown, Trophy, DollarSign, TrendingUp, BarChart3, Calendar,
  Plus, Pencil, Trash2,
} from 'lucide-react';

const CATEGORIES: ProjectCategory[] = ['Structural', 'HVAC & Mechanical', 'Insulation & Envelope', 'Windows & Doors', 'Interior Finish', 'Kitchen & Bath', 'Exterior', 'Electrical', 'Plumbing', 'Landscaping', 'Other'];
const ROI_CATEGORIES: ROICategory[] = ['High 75%', 'Medium 60%', 'Low 35%', 'Maintenance 10%', 'Custom'];

interface Props {
  projects: RenovationProject[];
}

const emptyForm = (): Omit<RenovationProject, 'id'> => ({
  projectName: '', status: 'Complete', category: 'Other', dateCompleted: new Date().toISOString().slice(0, 10),
  estimateLow: 0, estimateHigh: 0, actualCost: 0, vendorName: '',
  roiCategory: 'Medium 60%', customROIPercentage: 0, notes: '',
});

export default function CompletedTab({ projects }: Props) {
  const { addProject, updateProject, deleteProject } = useAppContext();
  const sorted = [...projects]
    .filter(p => p.status === 'Complete')
    .sort((a, b) => (b.dateCompleted || '').localeCompare(a.dateCompleted || ''));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RenovationProject | null>(null);
  const [form, setForm] = useState(emptyForm());

  const totalSpent = sorted.reduce((s, p) => s + p.actualCost, 0);
  const totalValueAdded = sorted.reduce((s, p) => s + getEstimatedValueAdded(p), 0);
  const avgCost = sorted.length > 0 ? totalSpent / sorted.length : 0;
  const bestROI = sorted.length > 0
    ? sorted.reduce((best, p) => getROIPercentage(p) > getROIPercentage(best) ? p : best, sorted[0])
    : null;

  const yearTotals: Record<string, number> = {};
  sorted.forEach(p => {
    const year = p.dateCompleted ? new Date(p.dateCompleted).getFullYear().toString() : 'Unknown';
    yearTotals[year] = (yearTotals[year] || 0) + p.actualCost;
  });

  const openNew = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (p: RenovationProject) => { setEditing(p); setForm({ ...p }); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.projectName || !form.dateCompleted) return;
    if (editing) {
      updateProject({ ...form, id: editing.id } as RenovationProject);
    } else {
      addProject({ ...form, id: crypto.randomUUID() } as RenovationProject);
    }
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => { if (confirm('Delete this project?')) deleteProject(id); };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={<BarChart3 className="h-4 w-4" />} label="Completed" value={String(sorted.length)} />
        <SummaryCard icon={<DollarSign className="h-4 w-4" />} label="Total Spent" value={formatCurrency(totalSpent)} />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Value Added" value={formatCurrency(totalValueAdded)} />
        <SummaryCard icon={<Trophy className="h-4 w-4" />} label="Best ROI" value={bestROI ? bestROI.projectName.slice(0, 20) : '—'} sub={bestROI ? formatPercent(getROIPercentage(bestROI)) : ''} />
        <SummaryCard icon={<DollarSign className="h-4 w-4" />} label="Avg Cost" value={formatCurrency(avgCost)} />
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> By Year</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(yearTotals).sort().map(([year, amount]) => (
                <span key={year} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {year}: {formatCurrency(amount)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Completed Project</Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {sorted.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No completed projects yet.</p>
          )}
          {sorted.map(p => (
            <TimelineCard key={p.id} project={p} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'Add Completed Project'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>Project Name *</Label><Input value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date Completed *</Label><Input type="date" value={form.dateCompleted} onChange={e => setForm({ ...form, dateCompleted: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as ProjectCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Estimate Low</Label><Input type="number" value={form.estimateLow || ''} onChange={e => setForm({ ...form, estimateLow: +e.target.value })} /></div>
              <div><Label>Estimate High</Label><Input type="number" value={form.estimateHigh || ''} onChange={e => setForm({ ...form, estimateHigh: +e.target.value })} /></div>
              <div><Label>Actual Cost *</Label><Input type="number" value={form.actualCost || ''} onChange={e => setForm({ ...form, actualCost: +e.target.value })} /></div>
            </div>
            <div><Label>Vendor</Label><Input value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ROI Category</Label>
                <Select value={form.roiCategory} onValueChange={v => setForm({ ...form, roiCategory: v as ROICategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROI_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.roiCategory === 'Custom' && (
                <div><Label>Custom ROI %</Label><Input type="number" value={form.customROIPercentage || ''} onChange={e => setForm({ ...form, customROIPercentage: +e.target.value })} /></div>
              )}
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Add Project'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">{icon} {label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ project: p, onEdit, onDelete }: { project: RenovationProject; onEdit: (p: RenovationProject) => void; onDelete: (id: string) => void }) {
  const valueAdded = getEstimatedValueAdded(p);
  const roi = getROIPercentage(p);
  const netCost = p.actualCost - valueAdded;
  const dateStr = p.dateCompleted
    ? new Date(p.dateCompleted).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const catColor = CATEGORY_COLORS[p.category as ProjectCategory] || 'hsl(215, 16%, 47%)';

  return (
    <div className="relative pl-10">
      <div className="absolute left-[11px] top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
      <Card className="overflow-hidden group">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">{p.projectName}</h3>
                <Badge className="text-[10px] px-2 py-0 border-0" style={{ backgroundColor: catColor, color: '#fff' }}>{p.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
              {p.vendorName && <p className="text-xs text-muted-foreground">Vendor: {p.vendorName}</p>}
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{formatCurrency(p.actualCost)}</p>
                <p className="text-xs text-success">{formatCurrency(valueAdded)} value added ({formatPercent(roi)} ROI)</p>
                <p className={`text-xs font-medium ${netCost > 0 ? 'text-destructive' : 'text-success'}`}>
                  Net: {netCost > 0 ? '' : '+'}{formatCurrency(Math.abs(netCost))} {netCost > 0 ? 'cost' : 'equity'}
                </p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          </div>

          {(p.dateAddedToWishlist || p.datePromotedToPlanned || p.dateCompleted) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {p.dateAddedToWishlist && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Wishlist: {p.dateAddedToWishlist}</span>}
              {p.datePromotedToPlanned && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Planned: {p.datePromotedToPlanned}</span>}
              {p.dateCompleted && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Completed: {dateStr}</span>}
            </div>
          )}

          {p.notes && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors">
                <ChevronDown className="h-3 w-3" /> Notes
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{p.notes}</p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
