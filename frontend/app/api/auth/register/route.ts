import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, nombre, rol } = await request.json()

    // Validate input
    if (!email || !password || !nombre) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Mock user creation
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      nombre,
      rol: rol || "cliente",
    }

    // Generate mock token
    const token = `mock-token-${newUser.id}-${Date.now()}`

    return NextResponse.json({
      token,
      user: newUser,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 })
  }
}
