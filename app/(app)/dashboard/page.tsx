"use client"

export const dynamic = 'force-dynamic'


import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Activity,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalPersonas: number
  totalOrganizaciones: number
  totalEventos: number
  proximosEventos: number
}

const QuickActions = [
  {
    icon: Users,
    label: "Nueva Persona",
    href: "/personas/nueva",
    color: "text-blue-500",
  },
  {
    icon: Building2,
    label: "Nueva Organización",
    href: "/organizaciones/nueva",
    color: "text-green-500",
  },
  {
    icon: Calendar,
    label: "Nuevo Evento",
    href: "/eventos/nuevo",
    color: "text-purple-500",
  },
  {
    icon: DollarSign,
    label: "Registrar Pago",
    href: "/pagos/nuevo",
    color: "text-amber-500",
  },
  {
    icon: FileText,
    label: "Agregar Documento",
    href: "/documentos/nuevo",
    color: "text-red-500",
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPersonas: 0,
    totalOrganizaciones: 0,
    totalEventos: 0,
    proximosEventos: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Placeholder stats - cuando la DB esté lista actualizaremos esto
        setStats({
          totalPersonas: 0,
          totalOrganizaciones: 0,
          totalEventos: 0,
          proximosEventos: 0,
        })
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Panel de Inicio</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Plataforma de gestión para Convivencia con Dios
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Personas
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalPersonas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registradas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Organizaciones
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalOrganizaciones}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En la plataforma
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalEventos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos creados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Próximos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.proximosEventos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En los próximos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede rápidamente a las funciones principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {QuickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-2 bg-transparent hover:bg-muted"
                  >
                    <Icon className={`h-6 w-6 ${action.color}`} />
                    <span className="text-xs text-center line-clamp-2">
                      {action.label}
                    </span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Gestión de Personas
            </CardTitle>
            <CardDescription>
              Administra los datos de las personas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/personas">
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
              >
                Ver Personas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              Gestión de Organizaciones
            </CardTitle>
            <CardDescription>
              Administra las organizaciones y sus datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/organizaciones">
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
              >
                Ver Organizaciones
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Gestión de Eventos
            </CardTitle>
            <CardDescription>
              Crea y administra eventos espirituales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/eventos">
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
              >
                Ver Eventos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              Gestión de Pagos
            </CardTitle>
            <CardDescription>
              Registra y controla los pagos de eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pagos">
              <Button
                variant="outline"
                className="w-full justify-between bg-transparent"
              >
                Ver Pagos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Información del Sistema
          </CardTitle>
          <CardDescription>Estado actual de la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sistema Operativo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    La plataforma está lista para usar
                  </p>
                </div>
              </div>
              <div className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
                Activo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Inscripciones Recientes
          </CardTitle>
          <CardDescription>
            Últimas inscripciones registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Juan García López</p>
                <p className="text-sm text-muted-foreground">
                  Retiro Espiritual 2024
                </p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                Confirmada
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">
                  María Rodríguez Silva
                </p>
                <p className="text-sm text-muted-foreground">
                  Convivencia Familiar
                </p>
              </div>
              <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                Pendiente
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">
                  Carlos Martínez González
                </p>
                <p className="text-sm text-muted-foreground">
                  Taller de Oración
                </p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                Confirmada
              </span>
            </div>
          </div>
          <Link href="/inscripciones" className="block mt-4">
            <Button variant="outline" className="w-full bg-transparent">
              Ver todas las inscripciones
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Próximos Eventos */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Próximos Eventos</CardTitle>
          <CardDescription>
            Eventos programados en los próximos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between py-3 border-b border-border">
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Retiro Espiritual 2024
                </p>
                <p className="text-sm text-muted-foreground">
                  15-17 de Marzo · Madrid
                </p>
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                En Progreso
              </span>
            </div>
            <div className="flex items-start justify-between py-3 border-b border-border">
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Convivencia Familiar
                </p>
                <p className="text-sm text-muted-foreground">
                  22-23 de Marzo · Barcelona
                </p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                Publicado
              </span>
            </div>
            <div className="flex items-start justify-between py-3">
              <div className="flex-1">
                <p className="font-medium text-foreground">Taller de Oración</p>
                <p className="text-sm text-muted-foreground">
                  29 de Marzo · Valencia
                </p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                Publicado
              </span>
            </div>
          </div>
          <Link href="/eventos" className="block mt-4">
            <Button variant="outline" className="w-full bg-transparent">
              Ver todos los eventos
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Acceso Rápido</CardTitle>
          <CardDescription>Herramientas y reportes principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/reportes">
              <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="font-medium text-foreground text-sm">Reportes</p>
                <p className="text-xs text-muted-foreground">
                  Ver análisis y datos
                </p>
              </div>
            </Link>
            <Link href="/settings">
              <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="font-medium text-foreground text-sm">
                  Configuración
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajustes del sistema
                </p>
              </div>
            </Link>
            <Link href="/personas/nueva">
              <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="font-medium text-foreground text-sm">
                  Nueva Persona
                </p>
                <p className="text-xs text-muted-foreground">
                  Registrar persona
                </p>
              </div>
            </Link>
            <Link href="/eventos/nuevo">
              <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="font-medium text-foreground text-sm">
                  Nuevo Evento
                </p>
                <p className="text-xs text-muted-foreground">Crear evento</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
