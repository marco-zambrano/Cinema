import hmac
import hashlib
from typing import Union


def generate_hmac_signature(payload: Union[str, bytes], secret: str) -> str:
    """
    Genera una firma HMAC-SHA256 para un payload.
    
    Args:
        payload: Contenido a firmar (string o bytes)
        secret: Clave secreta compartida
        
    Returns:
        Firma en formato sha256=<hex>
    """
    if isinstance(payload, str):
        payload = payload.encode('utf-8')
    
    signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return f"sha256={signature}"


def verify_hmac_signature(payload: Union[str, bytes], signature: str, secret: str) -> bool:
    """
    Verifica que una firma HMAC sea válida.
    
    Args:
        payload: Contenido firmado
        signature: Firma recibida (formato: sha256=<hex>)
        secret: Clave secreta compartida
        
    Returns:
        True si la firma es válida, False en caso contrario
    """
    expected_signature = generate_hmac_signature(payload, secret)
    return hmac.compare_digest(signature, expected_signature)
