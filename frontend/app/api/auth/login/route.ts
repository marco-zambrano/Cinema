import { NextResponse } from "next/server"

// Mock user database
const mockUsers = [
  {
    id: "1",
    email: "demo@cinemax.com",
    password: "demo123",
    nombre: "Usuario Demo",
    rol: "cliente" as const,
  },
]

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Find user
    const user = mockUsers.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Generate mock token
    const token = `mock-token-${user.id}-${Date.now()}`

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
