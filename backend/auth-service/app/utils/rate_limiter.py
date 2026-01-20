from datetime import datetime, timedelta
from typing import Dict, List
from collections import defaultdict

class RateLimiter:
    """Rate limiter en memoria para login"""
    
    def __init__(self):
        self.attempts: Dict[str, List[datetime]] = defaultdict(list)
    
    def is_allowed(self, identifier: str, max_attempts: int, window_minutes: int) -> bool:
        """
        Verificar si está permitido hacer más intentos
        
        Args:
            identifier: Identificador (email, IP, etc)
            max_attempts: Máximo de intentos permitidos
            window_minutes: Ventana de tiempo en minutos
        
        Returns:
            True si está permitido, False si excede límite
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=window_minutes)
        
        # Limpiar intentos antiguos
        self.attempts[identifier] = [
            attempt for attempt in self.attempts[identifier]
            if attempt > cutoff
        ]
        
        # Verificar si puede hacer otro intento
        if len(self.attempts[identifier]) >= max_attempts:
            return False
        
        # Registrar nuevo intento
        self.attempts[identifier].append(now)
        return True
    
    def get_remaining_attempts(self, identifier: str, max_attempts: int, window_minutes: int) -> int:
        """Obtener intentos restantes"""
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=window_minutes)
        
        # Limpiar intentos antiguos
        self.attempts[identifier] = [
            attempt for attempt in self.attempts[identifier]
            if attempt > cutoff
        ]
        
        remaining = max_attempts - len(self.attempts[identifier])
        return max(0, remaining)
    
    def reset(self, identifier: str) -> None:
        """Resetear intentos para un identificador"""
        if identifier in self.attempts:
            del self.attempts[identifier]

# Instancia global
rate_limiter = RateLimiter()
