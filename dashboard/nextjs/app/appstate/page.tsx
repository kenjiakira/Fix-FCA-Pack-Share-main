'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from '@/components/ui';
import { Upload, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AppStatePage() {
  const [showModal, setShowModal] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('File phải có định dạng .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setJsonContent(JSON.stringify(parsed, null, 2));
        setError(null);
      } catch (err) {
        setError('File JSON không hợp lệ: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!jsonContent.trim()) {
      setError('Vui lòng nhập nội dung JSON');
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (err) {
        setError('JSON không hợp lệ: ' + (err as Error).message);
        setUploading(false);
        return;
      }

      if (!Array.isArray(parsed)) {
        setError('Appstate phải là một mảng');
        setUploading(false);
        return;
      }

      const result = await api.appstate.update(parsed);
      
      if (result.success) {
        setSuccess('Đã cập nhật appstate lên JSONBin.io thành công!');
        setShowModal(false);
        setJsonContent('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Lỗi khi cập nhật appstate');
      }
    } catch (err: any) {
      setError('Lỗi: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="Quản lý AppState">
      {success && (
        <div className="mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start sm:items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm md:text-base text-green-700 break-words">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start sm:items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm md:text-base text-red-700 break-words">{error}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6">
        <div className="text-center py-8 md:py-12">
          <Upload className="w-12 h-12 md:w-16 md:h-16 text-slate-400 mx-auto mb-3 md:mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">Cập nhật AppState</h2>
          <p className="text-sm md:text-base text-slate-600 mb-4 md:mb-6 px-2">
            Tải lên file appstate.json mới hoặc dán nội dung JSON để cập nhật lên JSONBin.io
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm md:text-base"
          >
            <Upload className="w-4 h-4 mr-2" />
            Tải lên AppState
          </Button>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Upload className="w-5 h-5 text-blue-500" />
              Cập nhật AppState
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm md:text-base">Chọn file JSON</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="cursor-pointer text-xs md:text-sm"
              />
              <p className="text-xs text-slate-500">
                Hoặc dán nội dung JSON vào ô bên dưới
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-content" className="text-sm md:text-base">Nội dung JSON *</Label>
              <textarea
                id="json-content"
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value);
                  setError(null);
                }}
                placeholder="Dán nội dung appstate.json vào đây..."
                className="w-full h-48 md:h-64 p-3 border border-slate-300 rounded-md font-mono text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setJsonContent('');
                setError(null);
              }}
              className="w-full sm:w-auto text-sm md:text-base"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={uploading || !jsonContent.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full sm:w-auto text-sm md:text-base"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu AppState
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
