'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';
import { Button, Input, Badge } from '@/components/ui';
import { 
  Shield, 
  UserCheck, 
  Users, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Permissions {
  adminUIDs: string[];
  moderatorUIDs: string[];
  supportUIDs: string[];
}

type RoleType = 'admin' | 'moderator' | 'support';

const roleConfig = {
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Quản trị viên bot - có toàn quyền'
  },
  moderator: {
    label: 'Moderator',
    icon: UserCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Điều hành viên - có quyền quản lý một số chức năng'
  },
  support: {
    label: 'Support',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Hỗ trợ viên - có quyền hỗ trợ người dùng'
  }
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permissions>({
    adminUIDs: [],
    moderatorUIDs: [],
    supportUIDs: []
  });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<{ [key in RoleType]?: boolean }>({});
  const [newUIDs, setNewUIDs] = useState<{ [key in RoleType]?: string }>({});
  const [errors, setErrors] = useState<{ [key in RoleType]?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await api.permissions.get();
      if (result.success && result.data) {
        setPermissions(result.data);
        setErrors({});
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleAdd = async (role: RoleType) => {
    const uid = newUIDs[role]?.trim();
    if (!uid) {
      setErrors(prev => ({ ...prev, [role]: 'Vui lòng nhập UID' }));
      return;
    }

    setErrors(prev => ({ ...prev, [role]: undefined }));
    setAdding(prev => ({ ...prev, [role]: true }));
    setSuccess(null);

    try {
      const result = await api.permissions.add(role, uid);
      if (result.success) {
        setNewUIDs(prev => ({ ...prev, [role]: '' }));
        setSuccess(result.message || `Đã thêm ${uid} vào ${roleConfig[role].label} thành công`);
        setTimeout(() => setSuccess(null), 3000);
        await loadPermissions();
      } else {
        setErrors(prev => ({ ...prev, [role]: result.message || 'Lỗi khi thêm quyền' }));
      }
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [role]: error.message || 'Lỗi khi thêm quyền' }));
    } finally {
      setAdding(prev => ({ ...prev, [role]: false }));
    }
  };

  const handleRemove = async (role: RoleType, uid: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ${uid} khỏi ${roleConfig[role].label}?`)) {
      return;
    }

    setSuccess(null);
    try {
      const result = await api.permissions.remove(role, uid);
      if (result.success) {
        setSuccess(result.message || `Đã xóa ${uid} khỏi ${roleConfig[role].label} thành công`);
        setTimeout(() => setSuccess(null), 3000);
        await loadPermissions();
      } else {
        alert(result.message || 'Lỗi khi xóa quyền');
      }
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xóa quyền');
    }
  };

  const getUIDsForRole = (role: RoleType): string[] => {
    return permissions[`${role}UIDs` as keyof Permissions] as string[] || [];
  };

  const RoleCard = ({ role }: { role: RoleType }) => {
    const config = roleConfig[role];
    const Icon = config.icon;
    const uids = getUIDsForRole(role);
    const isAdding = adding[role] || false;
    const error = errors[role];
    const newUID = newUIDs[role] || '';

    return (
      <div className={`bg-white border-2 ${config.borderColor} rounded-lg p-5 md:p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{config.label}</h3>
            <p className="text-xs text-slate-500">{config.description}</p>
          </div>
        </div>

        {/* Add Form */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nhập UID..."
              value={newUID}
              onChange={(e) => {
                setNewUIDs(prev => ({ ...prev, [role]: e.target.value }));
                setErrors(prev => ({ ...prev, [role]: undefined }));
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isAdding) {
                  handleAdd(role);
                }
              }}
              className="flex-1"
              disabled={isAdding}
            />
            <Button
              onClick={() => handleAdd(role)}
              disabled={isAdding || !newUID.trim()}
              className="shrink-0"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* UID List */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-600 mb-2">
            Danh sách ({uids.length})
          </div>
          {uids.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uids.map((uid) => (
                <div
                  key={uid}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="font-mono text-sm text-slate-800 break-all">{uid}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(role, uid)}
                    className="shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Chưa có {config.label.toLowerCase()} nào
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Quản lý quyền">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Đang tải...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Quản lý quyền">
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-sm text-green-800">{success}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Lưu ý về quyền:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Mỗi UID chỉ có thể có một loại quyền (Admin, Moderator hoặc Support)</li>
              <li>Khi thêm UID vào một role, nó sẽ tự động bị xóa khỏi các role khác</li>
              <li>UID trống sẽ tự động bị loại bỏ</li>
            </ul>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <RoleCard role="admin" />
          <RoleCard role="moderator" />
          <RoleCard role="support" />
        </div>
      </div>
    </DashboardLayout>
  );
}

