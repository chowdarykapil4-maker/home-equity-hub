import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  RenovationProject, ProjectStatus, ProjectCategory, ROICategory,
  getEstimatedValueAdded, getCostVariance, getROIPercentage,
} from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';

const STATUSES: ProjectStatus[] = ['Complete', 'In Progress', 'Planned 2026', 'Planned 2027', 'Wishlist'];
const CATEGORIES: ProjectCategory[] = ['Structural', 'HVAC & Mechanical', 'Insulation & Envelope', 'Windows & Doors', 'Interior Finish', 'Kitchen & Bath', 'Exterior', 'Electrical', 'Plumbing', 'Landscaping', 'Other'];
const ROI_CATEGORIES: ROICategory[] = ['High 75%', 'Medium 60%', 'Low 35%', 'Maintenance 10%', 'Custom'];

const emptyProject: Omit<RenovationProject, 'id'> = {
  projectName: '', status: 'Planned 2026', category: 'Other', dateCompleted: '',
  estimateLow: 0, estimateHigh: 0, actualCost: 0, vendorName: '',
  roiCategory: 'Medium 60%', customROIPercentage: 0, notes: '',
};

type SortKey = 'projectName' | 'status' | 'category' | 'actualCost' | 'dateCompleted' | 'roiCategory';

export default function Renovations() {
  const { projects, addProject, updateProject, deleteProject } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RenovationProject | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterROI, setFilterROI] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('projectName');
  const [sortAsc, setSortAsc] = useState(true);

  const completeProjects = projects.filter(p => p.status === 'Complete');
  const totalSpent = completeProjects.reduce((s, p) => s + p.actualCost, 0);
  const totalValueAdded = completeProjects.reduce((s, p) => s + getEstimatedValueAdded(p), 0);
  const overallROI = totalSpent > 0 ? (totalValueAdded / totalSpent) * 100 : 0;
  const statusCounts = STATUSES.map(s => ({ status: s, count: projects.filter(p => p.status === s).length }));

  let filtered = [...projects];
  if (filterStatus !== 'all') filtered = filtered.filter(p => p.status === filterStatus);
  if (filterCategory !== 'all') filtered = filtered.filter(p => p.category === filterCategory);
  if (filterROI !== 'all') filtered = filtered.filter(p => p.roiCategory === filterROI);

  filtered.sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const openNew = () => { setEditing(null); setForm(emptyProject); setDialogOpen(true); };
  const openEdit = (p: RenovationProject) => { setEditing(p); setForm({ ...p }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.projectName) return;
    if (editing) {
      updateProject({ ...form, id: editing.id } as RenovationProject);
    } else {
      addProject({ ...form, id: crypto.randomUUID() } as RenovationProject);
    }
    setDialogOpen(false);
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3" /></span>
    </TableHead>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Renovation Ledger</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'New Project'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div><Label>Project Name</Label><Input value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as ProjectStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as ProjectCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {form.status === 'Complete' && (
                <div><Label>Date Completed</Label><Input type="date" value={form.dateCompleted} onChange={e => setForm({ ...form, dateCompleted: e.target.value })} /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Estimate Low</Label><Input type="number" value={form.estimateLow || ''} onChange={e => setForm({ ...form, estimateLow: +e.target.value })} /></div>
                <div><Label>Estimate High</Label><Input type="number" value={form.estimateHigh || ''} onChange={e => setForm({ ...form, estimateHigh: +e.target.value })} /></div>
              </div>
              {form.status === 'Complete' && (
                <div><Label>Actual Cost</Label><Input type="number" value={form.actualCost || ''} onChange={e => setForm({ ...form, actualCost: +e.target.value })} /></div>
              )}
              <div><Label>Vendor</Label><Input value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(totalSpent)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Est. Value Added</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatCurrency(totalValueAdded)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Renovation ROI</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatPercent(overallROI)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Projects</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2 text-xs">{statusCounts.filter(s => s.count > 0).map(s => <span key={s.status} className="bg-secondary px-2 py-0.5 rounded">{s.status}: {s.count}</span>)}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterROI} onValueChange={setFilterROI}>
          <SelectTrigger className="w-40"><SelectValue placeholder="ROI" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All ROI</SelectItem>{ROI_CATEGORIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Project" field="projectName" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Category" field="category" />
                <SortHeader label="Cost" field="actualCost" />
                <TableHead>Value Added</TableHead>
                <TableHead>Variance</TableHead>
                <SortHeader label="ROI" field="roiCategory" />
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No projects yet. Click "Add Project" to get started.</TableCell></TableRow>
              )}
              {filtered.map(p => {
                const variance = getCostVariance(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.projectName}</TableCell>
                    <TableCell><span className="text-xs bg-secondary px-2 py-0.5 rounded">{p.status}</span></TableCell>
                    <TableCell className="text-sm">{p.category}</TableCell>
                    <TableCell>{p.status === 'Complete' ? formatCurrency(p.actualCost) : `${formatCurrency(p.estimateLow)} – ${formatCurrency(p.estimateHigh)}`}</TableCell>
                    <TableCell>{formatCurrency(getEstimatedValueAdded(p))}</TableCell>
                    <TableCell>{variance !== null ? <span className={variance > 0 ? 'text-destructive' : 'text-success'}>{formatCurrency(variance)}</span> : '—'}</TableCell>
                    <TableCell className="text-sm">{formatPercent(getROIPercentage(p))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProject(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
