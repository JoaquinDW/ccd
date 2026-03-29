import { redirect } from 'next/navigation'
import { getUserContext, canPerform } from '@/lib/auth/context'
import { Sidebar } from '@/components/layout/sidebar'
import type { SidebarPermissions } from '@/components/layout/sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getUserContext()
  if (!ctx) redirect('/auth/login')

  const permissions: SidebarPermissions = {
    canCreatePerson:       canPerform(ctx, 'person.create'),
    canCreateOrganization: canPerform(ctx, 'organization.create'),
    canCreateEvent:        canPerform(ctx, 'event.create'),
    canViewRoles:          canPerform(ctx, 'roles.view') || canPerform(ctx, 'roles.assign'),
    canAssignRoles:        canPerform(ctx, 'roles.assign'),
    isAdmin:               ctx.is_admin,
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar permissions={permissions} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
