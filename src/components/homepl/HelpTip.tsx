import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ReactNode } from 'react';

interface HelpTipProps {
  children: ReactNode;
  plain: string;
  math?: string;
  context?: string;
}

/** Simple tooltip with plain-English + math lines. Wraps children with dotted underline + cursor-help. */
export function HelpTip({ children, plain, math, context }: HelpTipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-muted-foreground/30 hover:bg-muted/30 rounded px-0.5 -mx-0.5 transition-colors inline">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[320px] text-xs space-y-1 p-2.5">
          <p>{plain}</p>
          {math && <p className="text-muted-foreground text-[11px]">{math}</p>}
          {context && <p className="text-muted-foreground text-[11px] italic">{context}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpPopoverProps {
  children: ReactNode;
  content: ReactNode;
}

/** Popover for longer multi-line explanations. Wraps children with dotted underline + cursor-help. */
export function HelpPopover({ children, content }: HelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="cursor-help border-b border-dotted border-muted-foreground/30 hover:bg-muted/30 rounded px-0.5 -mx-0.5 transition-colors inline">
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-[calc(100vw-2rem)] text-xs space-y-2 p-3">
        {content}
      </PopoverContent>
    </Popover>
  );
}
