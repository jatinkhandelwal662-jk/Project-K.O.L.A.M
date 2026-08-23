import base64

def bytes_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")

def base64_to_bytes(b64_string: str) -> bytes:
    return base64.b64decode(b64_string)

def validate_image_file(content_type: str) -> bool:
    return content_type in ("image/jpeg", "image/png", "image/webp")