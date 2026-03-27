import { useState, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  RenovationProject, ProjectCategory, CATEGORY_COLORS,
  getEstimateMidpoint, getEstimatedValueAdded, getROIPercentage, PlannedSubStatus,
} from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, AlertTriangle, ArrowRight, Sparkles, GripVertical, Settings2,
} from 'lucide-react';

const SUB_STATUSES: PlannedSubStatus[] = ['Researching', 'Getting Quotes', 'Vendor Selected', 'Scheduled', 'Ready to Start'];

const DEFAULT_COLUMNS = ['Q2-Q3 2026', 'Q4 2026', '2027', '2028+'];

interface Props {
  projects: RenovationProject[];
  allProjects: RenovationProject[];
}

export default function PlannedTab({ projects, allProjects }: Props) {
  const ctx = useAppContext();
  const { updateProject } = ctx;
  const planningColumns = ctx.planningColumns || { columns: [] };
  const setPlanningColumns = ctx.setPlanningColumns;
  const budgetConfig = ctx.budgetConfig || {};
  const setBudgetConfig = ctx.setBudgetConfig;
  const columns = planningColumns.columns && planningColumns.columns.length > 0 ? planningColumns.columns : DEFAULT_COLUMNS;

  const planned = projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress');
  const wishlistProjects = projects.filter(p => p.status === 'Wishlist');

  const [markCompleteProject, setMarkCompleteProject] = useState<RenovationProject | null>(null);
  const [completeForm, setCompleteForm] = useState({ actualCost: 0, dateCompleted: new Date().toISOString().slice(0, 10), vendorName: '', notes: '' });
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedPromote, setSelectedPromote] = useState<Set<string>>(new Set());
  const [promoteColumn, setPromoteColumn] = useState(columns[0]);
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);
  const [editColumnsText, setEditColumnsText] = useState(columns.join('\n'));
  const [dragId, setDragId] = useState<string | null>(null);

  // Assign projects to columns
  const getColumnProjects = (col: string) => {
    return planned.filter(p => {
      if (p.planningColumn) return p.planningColumn === col;
      // Auto-assign based on status
      if (p.status === 'Planned 2026' && (col === 'Q2-Q3 2026' || col === columns[0])) return true;
      if (p.status === 'Planned 2027' && (col === '2027' || col === columns[2])) return true;
      return false;
    });
  };

  // Budget calculations
  const getYearFromColumn = (col: string): string | null => {
    if (col.includes('2026')) return '2026';
    if (col.includes('2027')) return '2027';
    if (col.includes('2028')) return '2028';
    return null;
  };

  const yearBudgets: Record<string, { spent: number; budget: number }> = {};
  columns.forEach(col => {
    const year = getYearFromColumn(col);
    if (!year) return;
    if (!yearBudgets[year]) yearBudgets[year] = { spent: 0, budget: budgetConfig[year] || 30000 };
    getColumnProjects(col).forEach(p => {
      yearBudgets[year].spent += getEstimateMidpoint(p);
    });
  });

  const totalEstCost = planned.reduce((s, p) => s + getEstimateMidpoint(p), 0);
  const totalValueAdd = planned.reduce((s, p) => s + getEstimatedValueAdded(p), 0);
  const netEquityImpact = totalValueAdd - totalEstCost;

  // Dependencies
  const isDepMet = (depId: string) => allProjects.find(p => p.id === depId)?.status === 'Complete';

  // Smart suggestions
  const suggestions = [...wishlistProjects]
    .filter(p => {
      if (!p.dependencies || p.dependencies.length === 0) return true;
      return p.dependencies.every(d => isDepMet(d));
    })
    .sort((a, b) => {
      const roiDiff = getROIPercentage(b) - getROIPercentage(a);
      if (roiDiff !== 0) return roiDiff;
      return getEstimateMidpoint(a) - getEstimateMidpoint(b);
    })
    .slice(0, 3);

  const handleDragStart = (id: string) => setDragId(id);
  const handleDrop = (col: string) => {
    if (!dragId) return;
    const p = allProjects.find(x => x.id === dragId);
    if (!p) return;
    const newStatus = col.includes('2027') || col.includes('2028') ? 'Planned 2027' as const : 'Planned 2026' as const;
    updateProject({ ...p, planningColumn: col, status: newStatus });
    setDragId(null);
  };

  const handleMarkComplete = () => {
    if (!markCompleteProject) return;
    updateProject({
      ...markCompleteProject,
      status: 'Complete',
      actualCost: completeForm.actualCost,
      dateCompleted: completeForm.dateCompleted,
      vendorName: completeForm.vendorName || markCompleteProject.vendorName,
      notes: completeForm.notes ? `${markCompleteProject.notes}\n${completeForm.notes}` : markCompleteProject.notes,
    });
    setMarkCompleteProject(null);
  };

  const handlePromote = () => {
    selectedPromote.forEach(id => {
      const p = allProjects.find(x => x.id === id);
      if (!p) return;
      const newStatus = promoteColumn.includes('2027') || promoteColumn.includes('2028') ? 'Planned 2027' as const : 'Planned 2026' as const;
      updateProject({
        ...p,
        status: newStatus,
        planningColumn: promoteColumn,
        datePromotedToPlanned: new Date().toISOString().slice(0, 10),
      });
    });
    setSelectedPromote(new Set());
    setPromoteOpen(false);
  };

  const saveColumns = () => {
    const newCols = editColumnsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (newCols.length > 0) setPlanningColumns({ columns: newCols });
    setEditColumnsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary + Budget Bars */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Planned</p><p className="text-lg font-bold">{planned.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Est. Cost</p><p className="text-lg font-bold">{formatCurrency(totalEstCost)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Projected Value Add</p><p className="text-lg font-bold text-success">{formatCurrency(totalValueAdd)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Net Equity Impact</p><p className={`text-lg font-bold ${netEquityImpact >= 0 ? 'text-success' : 'text-destructive'}`}>{netEquityImpact >= 0 ? '+' : ''}{formatCurrency(netEquityImpact)}</p></CardContent></Card>
      </div>

      {/* Budget bars */}
      {Object.entries(yearBudgets).map(([year, { spent, budget }]) => {
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        const color = pct > 100 ? 'bg-destructive' : pct > 80 ? 'bg-warning' : 'bg-success';
        return (
          <div key={year} className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-20">{year} Budget</span>
            <div className="flex-1 relative">
              <Progress value={Math.min(pct, 100)} className="h-3" />
              <div className={`absolute inset-0 rounded-full ${color} opacity-30`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatCurrency(spent)} / {formatCurrency(budget)} ({formatPercent(pct)})
            </span>
            <Input
              type="number"
              className="w-24 h-7 text-xs"
              value={budget}
              onChange={e => setBudgetConfig({ ...budgetConfig, [year]: +e.target.value })}
            />
          </div>
        );
      })}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPromoteOpen(true)}>
          <ArrowRight className="h-3 w-3 mr-1" /> Promote from Wishlist
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setEditColumnsText(columns.join('\n')); setEditColumnsOpen(true); }}>
          <Settings2 className="h-3 w-3 mr-1" /> Edit Columns
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))` }}>
        {columns.map(col => {
          const colProjects = getColumnProjects(col);
          const colTotal = colProjects.reduce((s, p) => s + getEstimateMidpoint(p), 0);
          return (
            <div
              key={col}
              className="bg-muted/50 rounded-lg p-3 min-h-[200px]"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col)}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-foreground">{col}</h3>
                <span className="text-xs text-muted-foreground">{formatCurrency(colTotal)}</span>
              </div>
              <div className="space-y-2">
                {colProjects.map(p => {
                  const mid = getEstimateMidpoint(p);
                  const valueAdd = getEstimatedValueAdded(p);
                  const equityImpact = valueAdd - mid;
                  const catColor = CATEGORY_COLORS[p.category as ProjectCategory] || 'hsl(215, 16%, 47%)';
                  const depsMet = !p.dependencies || p.dependencies.length === 0 || p.dependencies.every(d => isDepMet(d));
                  const hasUnmetDeps = p.dependencies && p.dependencies.length > 0 && !depsMet;

                  return (
                    <Card
                      key={p.id}
                      draggable
                      onDragStart={() => handleDragStart(p.id)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start gap-1">
                          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight">{p.projectName}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge className="text-[9px] px-1.5 py-0 border-0" style={{ backgroundColor: catColor, color: '#fff' }}>{p.category}</Badge>
                          {p.status === 'In Progress' && <Badge className="text-[9px] px-1.5 py-0 bg-warning text-warning-foreground border-0">In Progress</Badge>}
                          {p.subStatus && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{p.subStatus}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.estimateLow)} – {formatCurrency(p.estimateHigh)}</p>
                        <p className="text-[10px] text-muted-foreground">est. {formatCurrency(mid)}</p>
                        <div className="flex items-center gap-1">
                          <Badge variant={getROIPercentage(p) >= 60 ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                            {p.roiCategory === 'Custom' ? `Custom ${p.customROIPercentage}%` : p.roiCategory}
                          </Badge>
                        </div>
                        <p className={`text-xs font-medium ${equityImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {equityImpact >= 0 ? '+' : ''}{formatCurrency(equityImpact)} equity
                        </p>

                        {/* Dependencies */}
                        {p.dependencies && p.dependencies.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px]">
                            {depsMet ? (
                              <><CheckCircle2 className="h-3 w-3 text-success" /><span className="text-success">Ready</span></>
                            ) : (
                              <><AlertTriangle className="h-3 w-3 text-warning" /><span className="text-warning">Waiting on dependency</span></>
                            )}
                          </div>
                        )}

                        {/* Sub-status selector */}
                        <Select
                          value={p.subStatus || ''}
                          onValueChange={v => updateProject({ ...p, subStatus: v as PlannedSubStatus })}
                        >
                          <SelectTrigger className="h-6 text-[10px]"><SelectValue placeholder="Set status..." /></SelectTrigger>
                          <SelectContent>
                            {SUB_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>

                        <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => {
                          setMarkCompleteProject(p);
                          setCompleteForm({ actualCost: mid, dateCompleted: new Date().toISOString().slice(0, 10), vendorName: p.vendorName, notes: '' });
                        }}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Complete
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Sparkles className="h-4 w-4 text-warning" /> Suggested Next</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.projectName}</p>
                    <p className="text-xs text-muted-foreground">{p.roiCategory} · {formatCurrency(getEstimateMidpoint(p))}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-7" onClick={() => {
                    updateProject({
                      ...p,
                      status: 'Planned 2026',
                      planningColumn: columns[0],
                      datePromotedToPlanned: new Date().toISOString().slice(0, 10),
                    });
                  }}>Promote</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Complete Dialog */}
      <Dialog open={!!markCompleteProject} onOpenChange={v => !v && setMarkCompleteProject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Complete: {markCompleteProject?.projectName}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label>Actual Cost *</Label><Input type="number" value={completeForm.actualCost || ''} onChange={e => setCompleteForm({ ...completeForm, actualCost: +e.target.value })} /></div>
            <div><Label>Completion Date *</Label><Input type="date" value={completeForm.dateCompleted} onChange={e => setCompleteForm({ ...completeForm, dateCompleted: e.target.value })} /></div>
            <div><Label>Vendor</Label><Input value={completeForm.vendorName} onChange={e => setCompleteForm({ ...completeForm, vendorName: e.target.value })} /></div>
            <div><Label>Final Notes</Label><Textarea value={completeForm.notes} onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })} /></div>
            <Button onClick={handleMarkComplete}>Complete Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promote from Wishlist Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promote from Wishlist</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {wishlistProjects.length === 0 && <p className="text-sm text-muted-foreground">No wishlist items.</p>}
            {wishlistProjects.map(p => (
              <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPromote.has(p.id)}
                  onChange={e => {
                    const next = new Set(selectedPromote);
                    e.target.checked ? next.add(p.id) : next.delete(p.id);
                    setSelectedPromote(next);
                  }}
                  className="rounded"
                />
                <span className="text-sm flex-1">{p.projectName}</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(getEstimateMidpoint(p))}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Label className="text-xs">Target:</Label>
            <Select value={promoteColumn} onValueChange={setPromoteColumn}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handlePromote} disabled={selectedPromote.size === 0}>Move to Planned</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Columns Dialog */}
      <Dialog open={editColumnsOpen} onOpenChange={setEditColumnsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Planning Columns</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">One column name per line</p>
          <Textarea value={editColumnsText} onChange={e => setEditColumnsText(e.target.value)} rows={6} />
          <Button onClick={saveColumns}>Save Columns</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
