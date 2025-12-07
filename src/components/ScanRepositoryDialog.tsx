import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Zap } from 'lucide-react';

interface ScanRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoName: string;
  branches?: string[];
  defaultBranch?: string;
  onConfirm: (branch: string) => void;
  isScanning?: boolean;
}

export function ScanRepositoryDialog({
  open,
  onOpenChange,
  repoName,
  branches = [],
  defaultBranch = 'main',
  onConfirm,
  isScanning = false
}: ScanRepositoryDialogProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranch);

  const handleScan = () => {
    onConfirm(selectedBranch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Scan Repository
          </DialogTitle>
          <DialogDescription>
            Select a branch to scan for <strong>{repoName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="branch-select">Branch to Scan</Label>
            {branches.length > 0 ? (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger id="branch-select">
                  <GitBranch className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                      {branch === defaultBranch && ' (default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedBranch || defaultBranch}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              The selected branch will be scanned for security vulnerabilities and code quality issues.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isScanning}>
            Cancel
          </Button>
          <Button onClick={handleScan} disabled={isScanning || !selectedBranch}>
            {isScanning ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Scanning...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

