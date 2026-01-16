# WebSocket Integration with Auth Service

## Cambios necesarios en WebSocket Service

El servicio WebSocket (Go) debe validar tokens JWT del Auth Service para autenticar conexiones.

## Implementación en Go

### 1. Instalar paquetes JWT

```bash
go get github.com/golang-jwt/jwt/v5
```

### 2. Crear estructura de validación (auth.go)

```go
package auth

import (
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenClaims struct {
	IdUsuario string `json:"id_usuario"`
	Correo    string `json:"correo"`
	Rol       string `json:"rol"`
	jwt.RegisteredClaims
}

var secretKey string

func Init(key string) {
	secretKey = key
}

// ValidateToken valida un token JWT localmente
func ValidateToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verificar algoritmo
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algoritmo inesperado: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, fmt.Errorf("error validando token: %v", err)
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token inválido")
	}

	// Verificar expiración
	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("token expirado")
	}

	return claims, nil
}

// ExtractToken extrae el token del header Authorization
func ExtractToken(authHeader string) (string, error) {
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", fmt.Errorf("formato de token inválido")
	}
	return parts[1], nil
}
```

### 3. Actualizar WebSocket handler (main.go)

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
	"cinema/auth"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Adjust based on your needs
	},
}

type Client struct {
	conn      *websocket.Conn
	userId    string
	correo    string
	rol       string
}

var clients = make(map[*Client]bool)
var broadcast = make(chan interface{})

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extraer token del query parameter o header
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		authHeader := r.Header.Get("Authorization")
		var err error
		tokenString, err = auth.ExtractToken(authHeader)
		if err != nil {
			http.Error(w, "Token requerido", http.StatusUnauthorized)
			return
		}
	}

	// Validar token LOCALMENTE
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		log.Printf("Token inválido: %v", err)
		http.Error(w, "Token inválido o expirado", http.StatusUnauthorized)
		return
	}

	// Upgrade connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	// Crear cliente autenticado
	client := &Client{
		conn:   conn,
		userId: claims.IdUsuario,
		correo: claims.Correo,
		rol:    claims.Rol,
	}

	clients[client] = true

	log.Printf("Cliente conectado: %s (%s)", claims.Correo, claims.IdUsuario)

	// Escuchar mensajes
	go handleClientMessages(client)
}

func handleClientMessages(client *Client) {
	defer func() {
		delete(clients, client)
		client.conn.Close()
		log.Printf("Cliente desconectado: %s", client.correo)
	}()

	for {
		var msg map[string]interface{}
		err := client.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			return
		}

		// Procesar mensaje
		msg["usuario_id"] = client.userId
		msg["correo"] = client.correo
		msg["rol"] = client.rol

		// Broadcast a todos los clientes
		broadcast <- msg
	}
}

func handleBroadcast() {
	for {
		msg := <-broadcast
		for client := range clients {
			client.conn.WriteJSON(msg)
		}
	}
}

func main() {
	// Inicializar autenticación con SECRET_KEY
	secretKey := os.Getenv("SECRET_KEY")
	if secretKey == "" {
		log.Fatal("SECRET_KEY no configurada")
	}
	auth.Init(secretKey)

	// WebSocket route
	http.HandleFunc("/ws", handleWebSocket)

	// Health check
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"healthy"}`)
	})

	// Broadcast goroutine
	go handleBroadcast()

	port := ":8080"
	log.Printf("WebSocket server escuchando en %s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
```

### 4. Variables de entorno (.env)

```env
# JWT (mismo que Auth Service)
SECRET_KEY=cinema_secret_key_super_segura_2025_cambiar_en_produccion

# WebSocket
WS_PORT=8080
WS_URL=ws://localhost:8080/ws

# Auth Service
AUTH_SERVICE_URL=http://localhost:8001
```

## Conexión desde frontend

```javascript
// Obtener token del Auth Service
const response = await fetch('http://localhost:8001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    correo: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.access_token;

// Conectar WebSocket con token
const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

ws.onopen = () => {
  console.log('Conectado');
  ws.send(JSON.stringify({ type: 'message', content: 'Hola' }));
};

ws.onmessage = (event) => {
  console.log('Mensaje:', event.data);
};

ws.onerror = (error) => {
  console.error('Error WebSocket:', error);
};

ws.onclose = () => {
  console.log('Desconectado');
};
```

## Alternativa: Token en header

Si prefieres enviar el token en un header HTTP (al conectar):

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  // Enviar token como primer mensaje
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJ0...'
  }));
};
```

Y en el servidor:

```go
func handleClientMessages(client *Client) {
	defer func() {
		delete(clients, client)
		client.conn.Close()
	}()

	authenticated := false
	
	for {
		var msg map[string]interface{}
		err := client.conn.ReadJSON(&msg)
		if err != nil {
			return
		}

		// Si no autenticado, esperar mensaje de auth
		if !authenticated {
			if msgType, ok := msg["type"].(string); ok && msgType == "auth" {
				if token, ok := msg["token"].(string); ok {
					claims, err := auth.ValidateToken(token)
					if err == nil {
						client.userId = claims.IdUsuario
						client.correo = claims.Correo
						client.rol = claims.Rol
						authenticated = true
						continue
					}
				}
			}
			continue
		}

		// Usuario autenticado, procesar mensaje
		broadcast <- msg
	}
}
```

## Ventajas

✅ Valida tokens sin comunicarse con Auth Service  
✅ Conexiones más rápidas  
✅ Mejor rendimiento y escalabilidad  
✅ Los tokens del Auth Service funcionan directamente  

## Testing

```bash
# Terminal 1: Ejecutar servidor WebSocket
go run main.go

# Terminal 2: Obtener token
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"user@example.com","password":"pass123"}' \
  | jq -r '.access_token')

# Terminal 3: Conectar con wscat
npx wscat -c "ws://localhost:8080/ws?token=$TOKEN"
```
