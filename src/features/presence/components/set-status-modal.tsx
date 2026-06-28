'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { Availability } from '@/components/availability-dot';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useGetMyPresence } from '../api/use-get-my-presence';
import { useSetPresence } from '../api/use-set-presence';

interface SetStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABILITY_OPTIONS: { value: Availability; label: string; dotColor: string; description: string }[] = [
  { value: 'active', label: 'Active', dotColor: 'bg-green-500', description: 'Available' },
  { value: 'away', label: 'Away', dotColor: 'bg-yellow-400', description: 'Away from keyboard' },
  { value: 'dnd', label: 'Do not disturb', dotColor: 'bg-red-500', description: 'Pausing notifications' },
];

const EXPIRY_OPTIONS: { label: string; getValue: () => number | undefined }[] = [
  { label: "Don't clear", getValue: () => undefined },
  { label: '30 minutes', getValue: () => Date.now() + 30 * 60 * 1000 },
  { label: '1 hour', getValue: () => Date.now() + 60 * 60 * 1000 },
  { label: '4 hours', getValue: () => Date.now() + 4 * 60 * 60 * 1000 },
  {
    label: 'Today',
    getValue: () => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    },
  },
  {
    label: 'This week',
    getValue: () => {
      const d = new Date();
      const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntilFriday);
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    },
  },
];

export const SetStatusModal = ({ open, onOpenChange }: SetStatusModalProps) => {
  const { data: myPresence } = useGetMyPresence();
  const setPresence = useSetPresence();

  const [availability, setAvailability] = useState<Availability>('active');
  const [customStatus, setCustomStatus] = useState('');
  const [expiryLabel, setExpiryLabel] = useState("Don't clear");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open && myPresence) {
      setAvailability(myPresence.availability);
      setCustomStatus(myPresence.customStatus ?? '');
      setExpiryLabel("Don't clear");
    }
  }, [open, myPresence]);

  const handleSave = async () => {
    const expiryOption = EXPIRY_OPTIONS.find((o) => o.label === expiryLabel);
    const expiry = expiryOption?.getValue();
    setIsPending(true);
    try {
      await setPresence({
        availability,
        customStatus: customStatus.trim() || undefined,
        customStatusExpiry: expiry,
      });
      toast.success('Status updated');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsPending(false);
    }
  };

  const handleClear = async () => {
    setIsPending(true);
    try {
      await setPresence({ availability: 'active', customStatus: undefined, customStatusExpiry: undefined });
      setAvailability('active');
      setCustomStatus('');
      setExpiryLabel("Don't clear");
      toast.success('Status cleared');
      onOpenChange(false);
    } catch {
      toast.error('Failed to clear status');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set your status</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Custom status</label>
            <Input
              placeholder="What's your status?"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Clear after</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setExpiryLabel(opt.label)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    expiryLabel === opt.label
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Availability</label>
            <div className="flex flex-col gap-y-1">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAvailability(opt.value)}
                  className={`flex items-center gap-x-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                    availability === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted hover:border-border'
                  }`}
                >
                  <span className={`size-3 shrink-0 rounded-full ${opt.dotColor}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={isPending}>
            Clear status
          </Button>
          <div className="flex gap-x-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
