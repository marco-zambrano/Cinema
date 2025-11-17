"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AdminRoute } from "@/components/auth/admin-route";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StatCard } from "@/components/admin/stat-card";
import type { AdminStats } from "@/lib/types";
import { Film, Users, Ticket, User, Clock, DoorOpen } from "lucide-react";
import { WEBSOCKET_URL } from "@/lib/config";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || user.rol !== "admin") {
      setIsLoadingStats(false);
      return;
    }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 segundos

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WEBSOCKET_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket conectado");
          setIsConnected(true);
          setIsLoadingStats(false);
          reconnectAttempts = 0; // Reset contador de reconexión
        };

        ws.onmessage = (event) => {
          try {
            const data: AdminStats = JSON.parse(event.data);
            // console.log("Datos recibidos del WebSocket:", data);
            // console.log("totalSalas:", data.totalSalas);
            setStats(data);
            setIsLoadingStats(false);
          } catch (error) {
            console.error("Error al parsear mensaje del WebSocket:", error);
          }
        };

        // ws.onerror = (error) => {
        //   console.error("Error en WebSocket:", error);
        //   setIsConnected(false);
        // };

        ws.onclose = () => {
          console.log("WebSocket desconectado");
          setIsConnected(false);
          wsRef.current = null;

          // Intentar reconectar
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Intentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, reconnectDelay);
          } else {
            console.error("No se pudo reconectar al WebSocket después de varios intentos");
            setIsLoadingStats(false);
          }
        };
      } catch (error) {
        console.error("Error al conectar WebSocket:", error);
        setIsConnected(false);
        setIsLoadingStats(false);

        // Intentar reconectar
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay);
        }
      }
    };

    // Conectar al WebSocket
    connectWebSocket();

    // Cleanup al desmontar el componente
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user]);

  console.log(WEBSOCKET_URL);
  console.log(isConnected);
  console.log(isLoadingStats);
  console.log(stats);
  console.log(user);
  console.log(wsRef.current);
  console.log(reconnectTimeoutRef.current);

  return (
    <AdminRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />

        <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="mb-2 text-balance text-4xl font-bold text-foreground md:text-5xl">
                    Panel de Administración
                  </h1>
                  <p className="text-pretty text-lg text-muted-foreground">
                    Estadísticas generales del sistema de cine
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={isConnected ? "Conectado" : "Desconectado"}
                  />
                  <span className="text-sm text-muted-foreground">
                    {isConnected ? "En tiempo real" : "Desconectado"}
                  </span>
                </div>
              </div>
            </div>

            {isLoadingStats ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : stats ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Películas Disponibles"
                  value={stats.totalMovies}
                  icon={Film}
                  color="from-orange-800 to-orange-600"
                />
                <StatCard
                  title="Reservas Generadas"
                  value={stats.totalReservations}
                  icon={Ticket}
                  color="from-orange-800 to-orange-600"
                />
                <StatCard
                  title="Clientes Registrados"
                  value={stats.totalCustomers}
                  icon={Users}
                  color="from-orange-800 to-orange-600"
                />
                <StatCard
                  title="Administradores Registrados"
                  value={stats.totalAdmins}
                  icon={User}
                  color="from-orange-800 to-orange-600"
                />
                <StatCard
                  title="Funciones Programadas"
                  value={stats.totalFunctions}
                  icon={Clock}
                  color="from-orange-800 to-orange-600"
                />
                <StatCard
                  title="Salas Disponibles"
                  value={stats.totalSalas}
                  icon={DoorOpen}
                  color="from-orange-800 to-orange-600"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </AdminRoute>
  );
}
