export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl text-foreground">¡Revisa tu correo!</CardTitle>
          <CardDescription>
            Te hemos enviado un enlace de confirmación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Hemos enviado un email de verificación a tu dirección de correo electrónico. 
            Por favor, haz clic en el enlace del correo para activar tu cuenta.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              Volver a Iniciar Sesión
            </Button>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver al inicio
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
