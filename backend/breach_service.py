import hashlib
import httpx

HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/{}"


async def check_password(password: str) -> dict:
    """Check a password against the HaveIBeenPwned Pwned Passwords corpus using
    k-anonymity. Only the first 5 chars of the SHA-1 hash leave this server;
    the plaintext password is NEVER transmitted or stored.
    Returns { found: bool, count: int, prefix: str }.
    """
    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    headers = {
        "User-Agent": "CyberShield-AmrohaCyberCrime",
        "Add-Padding": "true",  # extra privacy: HIBP pads the response set
    }
    async with httpx.AsyncClient(timeout=15.0, headers=headers) as cx:
        r = await cx.get(HIBP_RANGE_URL.format(prefix))
        r.raise_for_status()
        count = 0
        for line in r.text.splitlines():
            parts = line.split(":")
            if len(parts) == 2 and parts[0].strip().upper() == suffix:
                try:
                    count = int(parts[1].strip())
                except ValueError:
                    count = 0
                break
    return {"found": count > 0, "count": count, "prefix": prefix}


def strength_hint(password: str) -> dict:
    """Lightweight, local-only strength heuristics (no plaintext leaves server)."""
    length = len(password)
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_symbol = any(not c.isalnum() for c in password)
    classes = sum([has_lower, has_upper, has_digit, has_symbol])
    if length >= 12 and classes >= 3:
        label = "Strong"
    elif length >= 8 and classes >= 2:
        label = "Moderate"
    else:
        label = "Weak"
    return {
        "length": length,
        "char_classes": classes,
        "label": label,
    }
