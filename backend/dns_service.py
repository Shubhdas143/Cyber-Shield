import asyncio
import dns.asyncresolver

RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]

COMMON_SUBS = [
    "www", "mail", "ftp", "webmail", "smtp", "pop", "imap", "ns1", "ns2",
    "api", "dev", "test", "staging", "admin", "portal", "vpn", "remote",
    "cpanel", "whm", "blog", "shop", "store", "app", "m", "mobile", "secure",
    "login", "cdn", "static", "img", "assets", "email", "autodiscover",
    "gateway", "gw", "proxy", "db", "sql", "git", "jenkins", "intranet",
    "dashboard", "beta", "demo", "support", "help", "docs", "status",
]


async def _resolve_records(domain: str) -> dict:
    resolver = dns.asyncresolver.Resolver()
    resolver.lifetime = 6.0
    resolver.timeout = 6.0
    records = {}
    for rt in RECORD_TYPES:
        try:
            ans = await resolver.resolve(domain, rt)
            records[rt] = [r.to_text() for r in ans]
        except Exception:
            records[rt] = []
    return records


async def _enum_subdomains(domain: str) -> list:
    resolver = dns.asyncresolver.Resolver()
    resolver.lifetime = 4.0
    resolver.timeout = 4.0
    sem = asyncio.Semaphore(40)

    async def check(sub):
        fqdn = f"{sub}.{domain}"
        async with sem:
            try:
                ans = await resolver.resolve(fqdn, "A")
                return {"subdomain": fqdn, "ips": [r.to_text() for r in ans]}
            except Exception:
                return None

    results = await asyncio.gather(*[check(s) for s in COMMON_SUBS])
    return [r for r in results if r]


async def recon(domain: str) -> dict:
    records = await _resolve_records(domain)
    subs = await _enum_subdomains(domain)
    return {
        "domain": domain,
        "records": records,
        "subdomains": subs,
        "subdomain_count": len(subs),
    }


def build_context(r: dict) -> str:
    lines = [f"Domain: {r['domain']}"]
    for rt in RECORD_TYPES:
        vals = r["records"].get(rt, [])
        lines.append(f"{rt}: {', '.join(vals) if vals else 'none'}")
    if r["subdomains"]:
        lines.append("Discovered subdomains:")
        for s in r["subdomains"]:
            lines.append(f"  - {s['subdomain']} -> {', '.join(s['ips'])}")
    else:
        lines.append("Discovered subdomains: none from the common wordlist")
    return "\n".join(lines)
