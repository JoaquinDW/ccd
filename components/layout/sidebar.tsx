"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Home,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Briefcase,
  UserCheck,
  UserPlus,
  List,
  Building2,
  PlusCircle,
  Hotel,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Panel de Inicio",
    href: "/dashboard",
  },

  {
    icon: <Home className="h-5 w-5" />,
    label: "Organizaciones",
    href: "/organizaciones",
    children: [
      {
        icon: <Building2 className="h-4 w-4" />,
        label: "Lista de organizaciones",
        href: "/organizaciones",
      },
      {
        icon: <PlusCircle className="h-4 w-4" />,
        label: "Nueva organización",
        href: "/organizaciones/nueva",
      },
    ],
  },
  {
    icon: <Hotel className="h-5 w-5" />,
    label: "Casas de Retiro",
    href: "/casas-retiro",
    children: [
      {
        icon: <Building2 className="h-4 w-4" />,
        label: "Lista de casas",
        href: "/casas-retiro",
      },
      {
        icon: <PlusCircle className="h-4 w-4" />,
        label: "Nueva casa de retiro",
        href: "/casas-retiro/nueva",
      },
    ],
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: "Personas",
    href: "/personas",
    children: [
      {
        icon: <List className="h-4 w-4" />,
        label: "Lista de personas",
        href: "/personas",
      },
      {
        icon: <UserPlus className="h-4 w-4" />,
        label: "Registrar persona",
        href: "/personas/nueva",
      },
    ],
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: "Eventos",
    href: "/eventos",
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    label: "Inscripciones",
    href: "/inscripciones",
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    label: "Pagos",
    href: "/pagos",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Documentos",
    href: "/documentos",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    label: "Reportes",
    href: "/reportes",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    label: "Ministerios",
    href: "/ministerios",
    children: [
      {
        icon: <Briefcase className="h-4 w-4" />,
        label: "Catálogo de Ministerios",
        href: "/ministerios/catalogo",
      },
      {
        icon: <UserCheck className="h-4 w-4" />,
        label: "Asignaciones",
        href: "/ministerios/asignaciones",
      },
    ],
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "Configuración",
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    navItems
      .filter((item) =>
        item.children?.some(
          (child) =>
            pathname === child.href || pathname.startsWith(child.href + "/"),
        ),
      )
      .map((item) => item.href),
  )
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href],
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-card transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-border p-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logoccd.jpeg"
                alt="Convivencia con Dios"
                width={50}
                height={50}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-sm font-semibold text-foreground">
                  Convivencia
                </h1>
                <p className="text-xs text-muted-foreground">con Dios</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    setIsOpen(false)
                    if (item.children) {
                      toggleExpanded(item.href)
                    }
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.children && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedItems.includes(item.href) ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </Link>

                {/* Children items */}
                {item.children && expandedItems.includes(item.href) && (
                  <div className="ml-2 space-y-1 border-l border-border pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setIsOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive(child.href)
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User + Sign out */}
          <div className="border-t border-border p-4 space-y-2">
            {userEmail && (
              <p className="px-3 text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            )}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
