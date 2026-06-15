import asyncio
import socket

# Well-known service map (overrides getservbyport for clearer labels)
COMMON_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    67: "DHCP", 69: "TFTP", 80: "HTTP", 110: "POP3", 111: "RPCbind",
    123: "NTP", 135: "MSRPC", 137: "NetBIOS-NS", 139: "NetBIOS-SSN",
    143: "IMAP", 161: "SNMP", 389: "LDAP", 443: "HTTPS", 445: "SMB",
    465: "SMTPS", 514: "Syslog", 587: "SMTP (Submission)", 631: "IPP",
    993: "IMAPS", 995: "POP3S", 1080: "SOCKS Proxy", 1433: "MS-SQL",
    1521: "Oracle DB", 1723: "PPTP", 2049: "NFS", 2082: "cPanel",
    2083: "cPanel (SSL)", 3306: "MySQL", 3389: "RDP", 5060: "SIP",
    5432: "PostgreSQL", 5900: "VNC", 5985: "WinRM", 6379: "Redis",
    8000: "HTTP-alt", 8080: "HTTP-Proxy", 8443: "HTTPS-alt",
    8888: "HTTP-alt", 9200: "Elasticsearch", 11211: "Memcached",
    27017: "MongoDB",
}

# Default "common ports" set scanned every time (superset of the user's script)
DEFAULT_COMMON = [
    21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 465, 587,
    993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017,
]

MAX_RANGE = 1024      # safety cap on a custom range scan
CONCURRENCY = 400     # simultaneous connection attempts
TIMEOUT = 1.5         # per-port connect timeout (seconds)


def service_name(port: int) -> str:
    if port in COMMON_PORTS:
        return COMMON_PORTS[port]
    try:
        return socket.getservbyport(port).upper()
    except Exception:
        return "Unknown"


async def resolve_host(host: str) -> str:
    """Resolve a hostname to an IPv4 address (raises socket.gaierror on failure)."""
    loop = asyncio.get_event_loop()
    infos = await loop.getaddrinfo(host, None, family=socket.AF_INET, type=socket.SOCK_STREAM)
    return infos[0][4][0]


async def _scan_one(ip: str, port: int, sem: asyncio.Semaphore):
    async with sem:
        writer = None
        try:
            fut = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(fut, timeout=TIMEOUT)
            return {"port": port, "service": service_name(port), "state": "open"}
        except Exception:
            return None
        finally:
            if writer is not None:
                try:
                    writer.close()
                except Exception:
                    pass


def build_port_list(mode: str, start_port, end_port):
    """Return (ports_to_scan, note). mode: 'common' or 'common_range'."""
    ports = list(DEFAULT_COMMON)
    note = ""
    if mode == "common_range":
        try:
            s = int(start_port)
            e = int(end_port)
        except (TypeError, ValueError):
            raise ValueError("Start and end ports must be valid numbers")
        if s < 1 or e > 65535 or s > e:
            raise ValueError("Port range must be between 1 and 65535 with start <= end")
        if (e - s + 1) > MAX_RANGE:
            e = s + MAX_RANGE - 1
            note = f"Range capped to {MAX_RANGE} ports for performance (scanned {s}-{e})."
        rng = set(range(s, e + 1))
        ports = sorted(set(DEFAULT_COMMON) | rng)
    return ports, note


async def scan_ports(host: str, ports: list) -> dict:
    ip = await resolve_host(host)
    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*[_scan_one(ip, p, sem) for p in ports])
    open_ports = sorted([r for r in results if r], key=lambda x: x["port"])
    return {
        "ip": ip,
        "open_ports": open_ports,
        "scanned": len(ports),
        "closed_count": len(ports) - len(open_ports),
    }
