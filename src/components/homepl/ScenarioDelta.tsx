import { formatDelta } from '@/lib/scenario';

interface Props {
  scenarioVal: number;
  baseVal: number;
  active: boolean;
}

export default function ScenarioDelta({ scenarioVal, baseVal, active }: Props) {
  if (!active) return null;
  const delta = formatDelta(scenarioVal, baseVal);
  if (!delta) return null;
  return <span className={`text-[10px] font-medium ${delta.color} ml-1`}>{delta.text}</span>;
}
