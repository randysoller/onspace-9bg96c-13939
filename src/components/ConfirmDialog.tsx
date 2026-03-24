/**
 * Confirmation dialog for destructive actions
 */

import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export const ConfirmDialog = memo(({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) => {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  };

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              variant === 'danger' ? 'bg-red-500/20' :
              variant === 'warning' ? 'bg-amber-500/20' :
              'bg-blue-500/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                variant === 'danger' ? 'text-red-500' :
                variant === 'warning' ? 'text-amber-500' :
                'text-blue-500'
              }`} />
            </div>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${variantStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
