'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  JobApplicationForm,
  type JobApplicationFormValues,
} from '@/components/job-applications/job-application-form';
import { createJobApplication } from '@/lib/db/job-application-repo';

interface NewApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function NewApplicationDialog({ open, onOpenChange, onCreated }: NewApplicationDialogProps) {
  async function handleSubmit(values: JobApplicationFormValues) {
    await createJobApplication(values);
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">新增岗位</DialogTitle>
        </DialogHeader>
        <JobApplicationForm initial={null} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
