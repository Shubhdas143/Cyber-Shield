import httpx

GEO_FIELDS = (
    "status,message,country,countryCode,regionName,city,zip,lat,lon,"
    "timezone,isp,org,as,query,proxy,hosting,mobile"
)


async def geolocate_ip(ip: str) -> dict | None:
    """Resolve IP geolocation using ip-api.com (primary) and ipwho.is (fallback).
    Returns a normalized dict or None on total failure."""
    ip = ip.strip()
    headers = {"User-Agent": "Mozilla/5.0 (CyberShield)"}

    async with httpx.AsyncClient(timeout=12.0, headers=headers) as cx:
        # Primary: ip-api.com
        try:
            r = await cx.get(f"http://ip-api.com/json/{ip}?fields={GEO_FIELDS}")
            j = r.json()
            if j.get("status") == "success":
                return {
                    "ip": j.get("query"),
                    "country_name": j.get("country"),
                    "country_code": j.get("countryCode"),
                    "region": j.get("regionName"),
                    "city": j.get("city"),
                    "postal": j.get("zip"),
                    "org": j.get("isp") or j.get("org"),
                    "asn": j.get("as"),
                    "timezone": j.get("timezone"),
                    "latitude": j.get("lat"),
                    "longitude": j.get("lon"),
                    "is_proxy": bool(j.get("proxy")),
                    "is_hosting": bool(j.get("hosting")),
                    "is_mobile": bool(j.get("mobile")),
                    "source": "ip-api.com",
                }
        except Exception:
            pass

        # Fallback: ipwho.is
        try:
            r = await cx.get(f"https://ipwho.is/{ip}")
            j = r.json()
            if j.get("success"):
                conn = j.get("connection") or {}
                tz = j.get("timezone") or {}
                return {
                    "ip": j.get("ip"),
                    "country_name": j.get("country"),
                    "country_code": j.get("country_code"),
                    "region": j.get("region"),
                    "city": j.get("city"),
                    "postal": j.get("postal"),
                    "org": conn.get("isp") or conn.get("org"),
                    "asn": (f"AS{conn.get('asn')}" if conn.get('asn') else None),
                    "timezone": tz.get("id"),
                    "latitude": j.get("latitude"),
                    "longitude": j.get("longitude"),
                    "is_proxy": None,
                    "is_hosting": None,
                    "is_mobile": None,
                    "source": "ipwho.is",
                }
        except Exception:
            pass

    return None
