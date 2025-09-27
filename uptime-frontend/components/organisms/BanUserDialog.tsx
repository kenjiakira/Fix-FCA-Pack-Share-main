import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface BanUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banReason: string
  banDuration: string
  onBanReasonChange: (reason: string) => void
  onBanDurationChange: (duration: string) => void
  onSubmit: () => void
}

export default function BanUserDialog({
  open,
  onOpenChange,
  banReason,
  banDuration,
  onBanReasonChange,
  onBanDurationChange,
  onSubmit
}: BanUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cấm người dùng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ban-reason">Lý do cấm</Label>
            <Textarea
              id="ban-reason"
              placeholder="Nhập lý do cấm..."
              value={banReason}
              onChange={(e) => onBanReasonChange(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ban-duration">Thời hạn (ngày, để trống = vĩnh viễn)</Label>
            <Input
              id="ban-duration"
              type="number"
              placeholder="7"
              value={banDuration}
              onChange={(e) => onBanDurationChange(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={onSubmit} disabled={!banReason.trim()}>
              Cấm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
