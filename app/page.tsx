"use client"

export const dynamic = 'force-dynamic'

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Heart, Mail, Lock } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 md:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            {/* <Image src="/logoccd.jpeg" alt="Convivencia con Dios" width={80} height={80} className="rounded-xl" /> */}
            <h1 className="text-xl font-bold text-foreground">
              Convivencia con Dios
            </h1>
          </div>

          {/* Form Card */}
          <Card className="border-border bg-card">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl text-foreground">
                Bienvenido
              </CardTitle>
              <CardDescription>Inicia sesión en tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="mt-6 space-y-3 text-center text-sm">
                <p className="text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="text-primary hover:underline font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2024 Convivencia con Dios. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Logo */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 items-center justify-center">
        <Image
          src="/logoccd.jpeg"
          alt="Convivencia con Dios"
          width={400}
          height={400}
          className="rounded-2xl shadow-2xl opacity-90"
        />
      </div>
    </div>
  )
}
