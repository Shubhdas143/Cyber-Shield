import ipaddress


def ipv4_to_ipv6(ipv4: str) -> dict:
    """Convert an IPv4 address to its various IPv6 representations.
    Raises ipaddress.AddressValueError for invalid input."""
    addr = ipaddress.IPv4Address(ipv4.strip())
    v = int(addr)

    mapped = ipaddress.IPv6Address((0xFFFF << 32) | v)          # ::ffff:a.b.c.d
    compat = ipaddress.IPv6Address(v)                           # ::a.b.c.d (deprecated)
    sixto4 = ipaddress.IPv6Address((0x2002 << 112) | (v << 80))  # 2002:WWXX:YYZZ::/48

    return {
        "input_ipv4": str(addr),
        "ipv4_int": v,
        "hex": f"{v:08x}",
        "ipv4_mapped": str(mapped),
        "ipv4_mapped_expanded": mapped.exploded,
        "ipv4_compatible": str(compat),
        "sixto4_prefix": f"{sixto4}/48",
        "sixto4_expanded": sixto4.exploded,
        "is_private": addr.is_private,
        "is_global": addr.is_global,
        "is_multicast": addr.is_multicast,
        "is_loopback": addr.is_loopback,
    }


def build_markdown(c: dict) -> str:
    """Deterministic, no-LLM explanatory report for the conversion."""
    scope = "Private / internal (RFC 1918)" if c["is_private"] else (
        "Globally routable (public)" if c["is_global"] else "Special-use / reserved")
    return f"""## CONVERSION RESULT
- **Source IPv4:** `{c['input_ipv4']}`
- **Address scope:** {scope}
- **Integer value:** `{c['ipv4_int']}`  |  **Hex:** `0x{c['hex']}`

## IPv6 REPRESENTATIONS
- **IPv4-mapped IPv6** — `{c['ipv4_mapped']}`
  Used internally by dual-stack systems to represent an IPv4 node inside IPv6 sockets. This is the form you will most often see in logs.
- **6to4 prefix** — `{c['sixto4_prefix']}`
  An automatic tunneling prefix (`2002::/16`) that embeds the IPv4 address, allowing IPv6 traffic to traverse IPv4-only networks.
- **IPv4-compatible IPv6 (deprecated)** — `{c['ipv4_compatible']}`
  Legacy transition format, **deprecated by RFC 4291**. Shown for completeness only — do not rely on it.

## EXPANDED (FULL) FORM
- IPv4-mapped: `{c['ipv4_mapped_expanded']}`
- 6to4: `{c['sixto4_expanded']}`

## INVESTIGATIVE NOTE
- When correlating logs across dual-stack infrastructure, the same host may appear as both an IPv4 address and its IPv4-mapped IPv6 form. Normalise both when matching offender activity.
- 6to4 / tunnelled traffic can be used to evade IPv4-only monitoring; flag unexpected `2002::/16` traffic during investigation.

## APPLICABLE IT ACT SECTIONS
- N/A — address conversion is an informational, technical operation and is not itself an offence.
"""
