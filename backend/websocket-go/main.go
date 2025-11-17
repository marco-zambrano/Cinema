package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Permitir conexiones desde cualquier origen (para desarrollo)
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// AdminStats representa las estadísticas del panel de administración
type AdminStats struct {
	TotalMovies       int `json:"totalMovies"`
	TotalReservations int `json:"totalReservations"`
	TotalCustomers    int `json:"totalCustomers"`
	TotalAdmins       int `json:"totalAdmins"`
	TotalFunctions    int `json:"totalFunctions"`
	TotalSalas        int `json:"totalSalas"`
}

// Hub mantiene las conexiones activas de los clientes
type Hub struct {
	clients map[*websocket.Conn]bool
	register chan *websocket.Conn
	unregister chan *websocket.Conn
	broadcast chan []byte
	mu sync.RWMutex
	db *sql.DB
}

// newHub crea un nuevo Hub
func newHub(db *sql.DB) *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
		register: make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		broadcast: make(chan []byte, 256),
		db: db,
	}
}

		// run ejecuta el hub en un loop
		func (h *Hub) run() {
			ticker := time.NewTicker(5 * time.Second) // Actualizar cada 5 segundos
			defer ticker.Stop()

			for {
				select {
				case conn := <-h.register:
					h.mu.Lock()
					h.clients[conn] = true
					h.mu.Unlock()
					log.Printf("Cliente conectado. Total de clientes: %d", len(h.clients))

					// Enviar estadísticas inmediatamente al nuevo cliente
					go h.sendStatsToClient(conn)

				case conn := <-h.unregister:
					h.mu.Lock()
					if _, ok := h.clients[conn]; ok {
						delete(h.clients, conn)
						conn.Close()
					}
					h.mu.Unlock()
					log.Printf("Cliente desconectado. Total de clientes: %d", len(h.clients))

				case message := <-h.broadcast:
					h.mu.RLock()
					clients := make([]*websocket.Conn, 0, len(h.clients))
					for conn := range h.clients {
						clients = append(clients, conn)
					}
					h.mu.RUnlock()

					// Enviar mensaje a todos los clientes
					for _, conn := range clients {
						if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
							log.Printf("Error al enviar mensaje al cliente: %v", err)
							h.mu.Lock()
							delete(h.clients, conn)
							h.mu.Unlock()
							conn.Close()
						}
					}

				case <-ticker.C:
					// Obtener estadísticas y enviarlas a todos los clientes
					go h.broadcastStats()
				}
			}
		}

		// sendStatsToClient envía las estadísticas a un cliente específico
		func (h *Hub) sendStatsToClient(conn *websocket.Conn) {
			stats, err := h.getStats()
			if err != nil {
				log.Printf("Error al obtener estadísticas: %v", err)
				return
			}

			message, err := json.Marshal(stats)
			if err != nil {
				log.Printf("Error al serializar estadísticas: %v", err)
				return
			}

			if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Error al enviar mensaje al cliente: %v", err)
			}
		}

		// broadcastStats obtiene las estadísticas y las envía a todos los clientes
		func (h *Hub) broadcastStats() {
			stats, err := h.getStats()
			if err != nil {
				log.Printf("Error al obtener estadísticas: %v", err)
				return
			}

			message, err := json.Marshal(stats)
			if err != nil {
				log.Printf("Error al serializar estadísticas: %v", err)
				return
			}

			// Log del JSON que se envía
			log.Printf("Enviando JSON: %s", string(message))

			h.broadcast <- message
		}

		// getStats obtiene las estadísticas de la base de datos
		func (h *Hub) getStats() (*AdminStats, error) {
			stats := &AdminStats{}

			// Número de películas activas (todas las películas)
			err := h.db.QueryRow("SELECT COUNT(*) FROM pelicula").Scan(&stats.TotalMovies)
			if err != nil {
				return nil, err
			}

			// Número de reservas activas (reservas no canceladas)
			// Asumimos que las reservas canceladas tienen estado = 'cancelada'
			err = h.db.QueryRow(`
				SELECT COUNT(*) 
				FROM reserva 
				WHERE estado IS NULL OR estado != 'cancelada'
			`).Scan(&stats.TotalReservations)
			if err != nil {
				return nil, err
			}

			// Número de clientes activos (usuarios con rol 'cliente')
			err = h.db.QueryRow(`
				SELECT COUNT(*) 
				FROM usuario 
				WHERE rol = 'cliente'
			`).Scan(&stats.TotalCustomers)
			if err != nil {
				return nil, err
			}

			// Número de administradores activos (usuarios con rol 'admin')
			err = h.db.QueryRow(`
				SELECT COUNT(*) 
				FROM usuario 
				WHERE rol = 'admin'
			`).Scan(&stats.TotalAdmins)
			if err != nil {
				return nil, err
			}

			// Número de funciones activas (funciones futuras o actuales)
			err = h.db.QueryRow(`
				SELECT COUNT(*) 
				FROM funcion 
				WHERE fecha_hora >= NOW()
			`).Scan(&stats.TotalFunctions)
			if err != nil {
				return nil, err
			}

			// Debug: Ver qué valores tiene la columna estado en sala
			var estadoDebug string
			_ = h.db.QueryRow(`SELECT estado FROM sala LIMIT 1`).Scan(&estadoDebug)
			log.Printf("Debug - Valor de estado en sala (primer registro): '%s' (bytes: %v)", estadoDebug, []byte(estadoDebug))

			// Número de salas disponibles (salas con estado 'disponible' o NULL)
			// Usamos LOWER() para hacer la comparación case-insensitive y TRIM para eliminar espacios
			var totalSalasRaw int
			err = h.db.QueryRow(`
				SELECT COUNT(*) 
				FROM sala 
				WHERE estado IS NULL OR LOWER(TRIM(estado)) = 'disponible'
			`).Scan(&totalSalasRaw)
			if err != nil {
				log.Printf("Error al obtener salas disponibles: %v", err)
				return nil, err
			}

			// También obtener el total de salas sin filtrar para debugging
			var totalSalasAll int
			_ = h.db.QueryRow(`SELECT COUNT(*) FROM sala`).Scan(&totalSalasAll)

			stats.TotalSalas = totalSalasRaw
			log.Printf("Debug - Total salas: %d, Salas disponibles: %d", totalSalasAll, totalSalasRaw)

			// Log para debugging
			log.Printf("Estadísticas obtenidas: Películas=%d, Reservas=%d, Clientes=%d, Admins=%d, Funciones=%d, Salas=%d",
				stats.TotalMovies, stats.TotalReservations, stats.TotalCustomers, stats.TotalAdmins, stats.TotalFunctions, stats.TotalSalas)

			return stats, nil
		}

		// wsHandler maneja las conexiones WebSocket
		func wsHandler(hub *Hub, w http.ResponseWriter, r *http.Request) {
			// Actualizar la conexión HTTP a WebSocket
			conn, err := upgrader.Upgrade(w, r, nil)
			if err != nil {
				log.Printf("Error al actualizar a WebSocket: %v", err)
				return
			}

			// Registrar el cliente en el hub
			hub.register <- conn

			// Manejar mensajes del cliente (aunque no esperamos mensajes)
			go func() {
				defer func() {
					hub.unregister <- conn
				}()

				for {
					_, _, err := conn.ReadMessage()
					if err != nil {
						if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
							log.Printf("Error de lectura WebSocket: %v", err)
						}
						break
					}
					// No procesamos mensajes del cliente, solo mantenemos la conexión viva
				}
			}()
		}

		func main() {
			// Cargar variables de entorno desde .env si existe
			// Busca el .env en varios lugares posibles:
			envPaths := []string{
				".env",                            // Directorio actual (websocket-go/)
				filepath.Join("..", ".env"),       // Directorio backend/
				filepath.Join("..", "..", ".env"), // Directorio raíz del proyecto
			}

			var envLoaded bool
			for _, envPath := range envPaths {
				if _, err := os.Stat(envPath); err == nil {
					if err := godotenv.Load(envPath); err == nil {
						log.Printf("Variables de entorno cargadas desde: %s", envPath)
						envLoaded = true
						break
					}
				}
			}

			// Si no se encontró ningún .env, intentar cargar desde el directorio actual
			if !envLoaded {
				if err := godotenv.Load(); err == nil {
					log.Println("Variables de entorno cargadas desde .env (directorio actual)")
					envLoaded = true
				}
			}

			if !envLoaded {
				log.Println("Advertencia: No se encontró archivo .env. Usando variables de entorno del sistema.")
			}

			// Obtener DATABASE_URL del entorno (ahora puede venir del .env)
			databaseURL := os.Getenv("DATABASE_URL")
			if databaseURL == "" {
				log.Fatal("DATABASE_URL no está configurada. Por favor, configura la variable de entorno DATABASE_URL o agrégala al archivo .env")
			}

			// Conectar a la base de datos (crea un handle reutilizable)
			db, err := sql.Open("postgres", databaseURL)
			if err != nil {
				log.Fatalf("Error al crear handle de la base de datos: %v", err)
			}

			// Limitar conexiones para no sobrepasar el pool (ajusta DB_MAX_CONNS según pool_size de pgbouncer)
			maxConns := 5
			if v := os.Getenv("DB_MAX_CONNS"); v != "" {
				if n, err := strconv.Atoi(v); err == nil && n > 0 {
					maxConns = n
				}
			}
			db.SetMaxOpenConns(maxConns)
			db.SetMaxIdleConns(maxConns)
			db.SetConnMaxLifetime(30 * time.Minute)

			// Intentar hacer ping con reintentos
			var pingErr error
			for i := 0; i < 5; i++ {
				pingErr = db.Ping()
				if pingErr == nil {
					break
				}
				log.Printf("Error al hacer ping a la base de datos (intento %d): %v", i+1, pingErr)
				time.Sleep(time.Duration(i+1) * time.Second)
			}
			if pingErr != nil {
				log.Fatalf("Error al hacer ping a la base de datos: %v", pingErr)
			}
			log.Println("Conexión a la base de datos establecida exitosamente")
			defer db.Close()

			// Crear el hub
			hub := newHub(db)
			go hub.run()

			// Configurar endpoint WebSocket
			http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
				wsHandler(hub, w, r)
			})

			// Obtener puerto del entorno o usar 8080 por defecto
			port := os.Getenv("PORT")
			if port == "" {
				port = "8080"
			}

			log.Printf("Servidor WebSocket iniciado en ws://localhost:%s/ws", port)

			// Iniciar el servidor HTTP
			if err := http.ListenAndServe(":"+port, nil); err != nil {
				log.Fatal("ListenAndServe error:", err)
			}
		}
