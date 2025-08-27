from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance used across the app and routes
limiter = Limiter(key_func=get_remote_address)

