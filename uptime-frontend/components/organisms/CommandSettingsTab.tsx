import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Play } from 'lucide-react'

export function CommandSettingsTab() {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <span>Cài đặt chung</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultCooldown">Cooldown mặc định (giây)</Label>
            <Input 
              id="defaultCooldown" 
              type="number" 
              defaultValue={5} 
              className="bg-white/50 backdrop-blur-sm" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCommands">Số lệnh tối đa</Label>
            <Input 
              id="maxCommands" 
              type="number" 
              defaultValue={100} 
              className="bg-white/50 backdrop-blur-sm" 
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Settings className="mr-2 h-4 w-4" />
            Lưu cài đặt
          </Button>
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Khởi động lại bot
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
