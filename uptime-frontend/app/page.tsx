'use client'

import { useState } from 'react'
import { useBotStatus } from '@/src/hooks/useBotStatus'
import DashboardLayout from '@/components/templates/DashboardLayout'
import OverviewTab from '@/components/organisms/OverviewTab'
import CommandsTab from '@/components/organisms/CommandsTab'
import UsersTab from '@/components/organisms/UsersTab'
import AdminManagement from '@/components/AdminManagement'
import VipManagementTab from '@/components/organisms/VipManagementTab'
import CurrencyManagementTab from '@/components/organisms/CurrencyManagementTab'
import SystemTab from '@/components/organisms/SystemTab'
import SettingsTab from '@/components/organisms/SettingsTab'

export default function Dashboard() {
  const { status: botStatus, loading, error, refetch: refreshStatus, restartBot } = useBotStatus()
  const [activeTab, setActiveTab] = useState('overview')

  const handleRestart = async () => {
    try {
      await restartBot()
    } catch (error) {
      console.error('Error restarting bot:', error)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab botStatus={botStatus} loading={loading} />
      case 'commands':
        return <CommandsTab />
      case 'users':
        return <UsersTab />
      case 'admin':
        return <AdminManagement />
      case 'vip':
        return <VipManagementTab />
      case 'currencies':
        return <CurrencyManagementTab />
      case 'system':
        return <SystemTab botStatus={botStatus} />
      case 'settings':
        return <SettingsTab />
      default:
        return <OverviewTab botStatus={botStatus} loading={loading} />
    }
  }

  return (
    <DashboardLayout
      isRunning={botStatus?.isRunning || false}
      onRefresh={refreshStatus}
      onRestart={handleRestart}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      error={error || undefined}
    >
      {renderTabContent()}
    </DashboardLayout>
  )
}
