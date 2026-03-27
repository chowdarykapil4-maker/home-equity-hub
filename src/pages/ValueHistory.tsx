import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { ValueEntry, ValueHistorySource, VALUE_SOURCE_COLORS, calculateBlendedValue } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea } from 'recharts';

const SOURCES: ValueHistorySource[] = ['RentCast AVM', 'Zillow', 'Redfin', 'Appraisal', 'Manual'];
const DISPLAY_SOURCES: { key: ValueHistorySource; label: string }[] = [
  { key: 'RentCast AVM', label: 'RentCast AVM' },
  { key: 'Zillow', label: 'Zillow Zestimate' },
  { key: 'Redfin', label: 'Redfin Estimate' },
  { key: 'Appraisal', label: 'Appraisal' },
];

export default function ValueHistoryPage() {
  const { property, projects, valueEntries, addValueEntry, updateValueEntry, deleteValueEntry } = useAppContext();

  const { value: blendedValue, sourceCount } = calculateBlendedValue(valueEntries);
  const displayBlended = blendedValue > 0 ? blendedValue : property.currentEstimatedValue;

  // Latest entry per source
  const latestBySource: Record<string, ValueEntry | null> = {};
  DISPLAY_SOURCES.forEach(s => { latestBySource[s.key] = null; });
  valueEntries.forEach(e => {
    if (!latestBySource[e.source] || e.date > latestBySource[e.source]!.date) {
      latestBySource[e.source] = e;
    }
  });

  const sortedEntries = [...valueEntries].sort((a, b) => b.date.localeCompare(a.date));

  // Chart data — group by date per source
  const chartEntries = [...valueEntries].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = chartEntries.map(e => ({
    date: e.date,
    value: e.estimatedValue,
    source: e.source,
    [e.source]: e.estimatedValue,
  }));

  // Unique dates for the chart with all sources filled
  const dateMap: Record<string, Record<string, number>> = {};
  chartEntries.forEach(e => {
    if (!dateMap[e.date]) dateMap[e.date] = {};
    dateMap[e.date][e.source] = e.estimatedValue;
  });
  const mergedChartData = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, sources]) => ({ date, ...sources }));

  // Completed renovations for markers
  const completedRenos = projects.filter(p => p.status === 'Complete' && p.dateCompleted);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Value History</h2>

      {/* Blended Value */}
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Blended Home Value</p>
          <p className="text-4xl font-bold text-foreground">{formatCurrency(displayBlended)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {sourceCount > 0 ? `Based on ${sourceCount} of 4 sources` : 'Using property profile estimate'}
          </p>
        </CardContent>
      </Card>

      {/* Source Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {DISPLAY_SOURCES.map(s => {
          const entry = latestBySource[s.key];
          return (
            <Card key={s.key} className={entry ? '' : 'opacity-60'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {entry ? (
                  <>
                    <p className="text-lg font-bold">{formatCurrency(entry.estimatedValue)}</p>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{s.key === 'RentCast AVM' ? 'Coming soon' : 'Add estimate'}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Entry + Chart */}
      <div className="flex justify-end">
        <ValueEntryDialog onSave={addValueEntry} />
      </div>

      {/* Value History Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Value Over Time</CardTitle></CardHeader>
        <CardContent className="h-80">
          {mergedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                {property.purchasePrice > 0 && (
                  <ReferenceLine y={property.purchasePrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Purchase Price', position: 'insideTopLeft', fontSize: 10 }} />
                )}
                {SOURCES.filter(s => s !== 'Manual').map(s => (
                  <Line key={s} type="monotone" dataKey={s} stroke={VALUE_SOURCE_COLORS[s]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                ))}
                <Line type="monotone" dataKey="Manual" stroke={VALUE_SOURCE_COLORS['Manual']} strokeWidth={1} strokeDasharray="4 4" dot={{ r: 3 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center pt-16">Add value entries to see the chart.</p>
          )}
        </CardContent>
      </Card>

      {/* Renovation Markers Legend */}
      {completedRenos.length > 0 && mergedChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Completed Renovations Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {completedRenos.map(r => (
                <Badge key={r.id} variant="outline" className="text-xs">
                  {r.dateCompleted} — {r.projectName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Value History Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">All Value Entries</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entries yet.</TableCell></TableRow>
                ) : sortedEntries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.date}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.estimatedValue)}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: VALUE_SOURCE_COLORS[e.source], color: '#fff' }} className="text-xs">{e.source}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">{e.notes || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ValueEntryDialog entry={e} onSave={updateValueEntry} />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteValueEntry(e.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ValueEntryDialog({ entry, onSave }: { entry?: ValueEntry; onSave: (v: ValueEntry) => void }) {
  const isEdit = !!entry;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ValueEntry>(() => entry || {
    id: '', date: new Date().toISOString().split('T')[0], estimatedValue: 0, source: 'Zillow' as ValueHistorySource, notes: '',
  });

  const handleOpen = (o: boolean) => {
    if (o && !isEdit) setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], estimatedValue: 0, source: 'Zillow', notes: '' });
    setOpen(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button> : <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Value Entry</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit' : 'Add'} Value Entry</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div><Label>Estimated Value</Label><Input type="number" value={form.estimatedValue || ''} onChange={e => setForm(f => ({ ...f, estimatedValue: +e.target.value }))} /></div>
          <div><Label>Source</Label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as ValueHistorySource }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
