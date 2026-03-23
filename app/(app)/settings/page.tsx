'use client'

export const dynamic = 'force-dynamic'


import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Settings, Bell, Lock, Database, Loader2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type FontSize = 'small' | 'medium' | 'large'

const FONT_SCALES: Record<FontSize, number> = {
  small: 1,
  medium: 1.125,
  large: 1.25,
}

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; preview: string }[] = [
  { value: 'small', label: 'Pequeño', preview: 'A' },
  { value: 'medium', label: 'Mediano', preview: 'A' },
  { value: 'large', label: 'Grande', preview: 'A' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [fontSize, setFontSize] = useState<FontSize>('small')

  // Password change dialog
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({ actual: false, nueva: false, confirmar: false })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)

    if (pwForm.nueva.length < 8) {
      setPwError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (pwForm.nueva !== pwForm.confirmar) {
      setPwError('Las contraseñas no coinciden.')
      return
    }

    setPwLoading(true)
    const supabase = createClient()

    // Verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPwError('No se pudo obtener el usuario actual.')
      setPwLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwForm.actual,
    })

    if (signInError) {
      setPwError('Contraseña actual incorrecta.')
      setPwLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: pwForm.nueva })
    setPwLoading(false)

    if (updateError) {
      setPwError(updateError.message)
      return
    }

    setPwSuccess(true)
    setPwForm({ actual: '', nueva: '', confirmar: '' })
    setTimeout(() => {
      setPwOpen(false)
      setPwSuccess(false)
    }, 1500)
  }

  useEffect(() => {
    const saved = localStorage.getItem('font-size-preference') as FontSize | null
    if (saved && saved in FONT_SCALES) setFontSize(saved)
  }, [])

  function applyFontSize(size: FontSize) {
    setFontSize(size)
    localStorage.setItem('font-size-preference', size)
    document.documentElement.style.setProperty('--font-scale', String(FONT_SCALES[size]))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Configuración
        </h1>
        <p className="mt-2 text-muted-foreground">
          Preferencias de tu cuenta
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('notificaciones')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'notificaciones'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Notificaciones
        </button>
        <button
          onClick={() => setActiveTab('seguridad')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'seguridad'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Seguridad
        </button>
        <button
          onClick={() => setActiveTab('datos')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'datos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Datos
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="border-border bg-card max-w-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">Apariencia</CardTitle>
            <CardDescription>Personaliza cómo se ve la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Tamaño de texto</p>
              <div className="flex gap-3">
                {FONT_SIZE_OPTIONS.map((opt, i) => {
                  const previewSizes = ['text-base', 'text-xl', 'text-2xl']
                  return (
                    <button
                      key={opt.value}
                      onClick={() => applyFontSize(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 px-6 py-4 rounded-lg border-2 transition-colors',
                        fontSize === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <span className={cn('font-semibold leading-none', previewSizes[i])}>
                        {opt.preview}
                      </span>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                El cambio se aplica de inmediato y se recuerda al volver.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === 'notificaciones' && (
        <Card className="border-border bg-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5 text-primary" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura cómo recibes notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Eventos próximos</p>
                <p className="text-sm text-muted-foreground">Recibe alertas sobre eventos próximos</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Nuevas inscripciones</p>
                <p className="text-sm text-muted-foreground">Notificaciones sobre nuevas inscripciones</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Cambios en eventos</p>
                <p className="text-sm text-muted-foreground">Se notificado de cambios en los eventos</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>

            <Button>Guardar Preferencias</Button>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      {activeTab === 'seguridad' && (
        <Card className="border-border bg-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Lock className="h-5 w-5 text-primary" />
              Seguridad
            </CardTitle>
            <CardDescription>Administra la seguridad de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="py-4 border-b border-border">
              <h3 className="font-medium text-foreground mb-2">Cambiar Contraseña</h3>
              <p className="text-sm text-muted-foreground mb-4">Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
              <Button variant="outline" className="bg-transparent" onClick={() => { setPwOpen(true); setPwError(null); setPwSuccess(false) }}>
                Cambiar Contraseña
              </Button>

              <Dialog open={pwOpen} onOpenChange={(open) => { setPwOpen(open); if (!open) { setPwForm({ actual: '', nueva: '', confirmar: '' }); setPwError(null); setPwSuccess(false) } }}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>Ingresá tu contraseña actual y la nueva contraseña dos veces para confirmar.</DialogDescription>
                  </DialogHeader>

                  {pwSuccess ? (
                    <p className="text-sm text-green-600 py-4 text-center">¡Contraseña actualizada correctamente!</p>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4 py-2">
                      <div className="space-y-1">
                        <Label htmlFor="pw-actual">Contraseña Actual</Label>
                        <div className="relative">
                          <Input
                            id="pw-actual"
                            type={showPw.actual ? 'text' : 'password'}
                            value={pwForm.actual}
                            onChange={(e) => setPwForm(prev => ({ ...prev, actual: e.target.value }))}
                            required
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPw(prev => ({ ...prev, actual: !prev.actual }))}
                            tabIndex={-1}
                          >
                            {showPw.actual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pw-nueva">Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-nueva"
                            type={showPw.nueva ? 'text' : 'password'}
                            value={pwForm.nueva}
                            onChange={(e) => setPwForm(prev => ({ ...prev, nueva: e.target.value }))}
                            required
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPw(prev => ({ ...prev, nueva: !prev.nueva }))}
                            tabIndex={-1}
                          >
                            {showPw.nueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pw-confirmar">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-confirmar"
                            type={showPw.confirmar ? 'text' : 'password'}
                            value={pwForm.confirmar}
                            onChange={(e) => setPwForm(prev => ({ ...prev, confirmar: e.target.value }))}
                            required
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPw(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                            tabIndex={-1}
                          >
                            {showPw.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {pwError && <p className="text-sm text-destructive">{pwError}</p>}

                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setPwOpen(false)} disabled={pwLoading}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={pwLoading}>
                          {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="py-4">
              <h3 className="font-medium text-foreground mb-2">Autenticación de Dos Factores</h3>
              <p className="text-sm text-muted-foreground mb-4">Añade una capa adicional de seguridad a tu cuenta</p>
              <Button variant="outline" className="bg-transparent">
                Configurar 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data */}
      {activeTab === 'datos' && (
        <Card className="border-border bg-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Database className="h-5 w-5 text-primary" />
              Gestión de Datos
            </CardTitle>
            <CardDescription>Administra los datos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="py-4 border-b border-border">
              <h3 className="font-medium text-foreground mb-2">Exportar Datos</h3>
              <p className="text-sm text-muted-foreground mb-4">Descarga una copia de todos tus datos en formato CSV</p>
              <Button variant="outline" className="bg-transparent">
                Exportar Datos
              </Button>
            </div>

            <div className="py-4">
              <h3 className="font-medium text-foreground mb-2">Limpiar Caché</h3>
              <p className="text-sm text-muted-foreground mb-4">Limpia los datos en caché del sistema para mejorar el rendimiento</p>
              <Button variant="outline" className="bg-transparent">
                Limpiar Caché
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
