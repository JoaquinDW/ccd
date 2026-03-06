"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type OrgOption = { id: string; nombre: string }

export default function NewConfraterityPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comunidades, setComunidades] = useState<OrgOption[]>([])

  const [formData, setFormData] = useState({
    nombre: "",
    parent_id: "",
    localidad: "",
    provincia: "",
    pais: "Argentina",
    codigo: "",
    notas: "",
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("organizaciones")
      .select("id, nombre")
      .eq("tipo", "comunidad")
      .is("fecha_baja", null)
      .order("nombre")
      .then(({ data }) => {
        if (data) setComunidades(data)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    const insertData: Record<string, unknown> = {
      nombre: formData.nombre,
      tipo: "confraternidad",
      pais: formData.pais || "Argentina",
    }
    if (formData.parent_id) insertData.parent_id = formData.parent_id
    if (formData.localidad) insertData.localidad = formData.localidad
    if (formData.provincia) insertData.provincia = formData.provincia
    if (formData.codigo) insertData.codigo = formData.codigo
    if (formData.notas) insertData.notas = formData.notas

    const { error: insertError } = await supabase.from("organizaciones").insert(insertData)

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push("/admin/cofradias")
    router.refresh()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/admin/cofradias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver a Confraternidades
        </Link>
      </div>

      <Card className="mx-auto max-w-2xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Registrar Nueva Confraternidad</CardTitle>
          <CardDescription>Completa la información de la confraternidad</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Comunidad Padre</Label>
              <select
                id="parent_id"
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              >
                <option value="">Sin comunidad padre</option>
                {comunidades.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="codigo"
                placeholder="ej. CONF-001"
                value={formData.codigo}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="localidad">Localidad</Label>
                <Input
                  id="localidad"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                value={formData.notas}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear Confraternidad"
                )}
              </Button>
              <Link href="/admin/cofradias">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
