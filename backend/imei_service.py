def luhn_valid(number: str) -> bool:
    """Validate a 15-digit numeric string with the Luhn algorithm."""
    if not number.isdigit() or len(number) != 15:
        return False
    total = 0
    for i, ch in enumerate(reversed(number)):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def parse_imei(raw: str) -> dict:
    imei = raw.strip().replace(" ", "").replace("-", "").replace("/", "")
    if not imei.isdigit():
        raise ValueError("IMEI must contain digits only")
    if len(imei) not in (15, 16):
        raise ValueError("IMEI must be 15 digits (or 16 for IMEISV)")

    base15 = imei[:15]
    tac = imei[:8]            # Type Allocation Code
    rbi = imei[:2]            # Reporting Body Identifier
    serial = imei[8:14]       # device serial within the TAC
    check_digit = imei[14] if len(imei) >= 15 else None
    sv = imei[14:16] if len(imei) == 16 else None  # software version (IMEISV)

    valid = luhn_valid(base15)

    # Reporting body hint (high level only)
    rbi_map = {
        "01": "PTCRB (North America)", "35": "BABT (UK / common GSMA)",
        "86": "TAF (China)", "99": "GSMA reserved", "00": "Test / Manufacturer",
    }

    return {
        "imei": imei,
        "length": len(imei),
        "tac": tac,
        "rbi": rbi,
        "rbi_hint": rbi_map.get(rbi, "Unknown reporting body"),
        "serial": serial,
        "check_digit": check_digit,
        "software_version": sv,
        "luhn_valid": valid,
        "type": "IMEISV" if len(imei) == 16 else "IMEI",
    }


def build_context(p: dict) -> str:
    return (
        f"IMEI: {p['imei']} ({p['type']})\n"
        f"Luhn checksum valid: {p['luhn_valid']}\n"
        f"TAC (Type Allocation Code): {p['tac']}\n"
        f"Reporting Body Identifier: {p['rbi']} ({p['rbi_hint']})\n"
        f"Device Serial: {p['serial']}\n"
        f"Check Digit: {p['check_digit']}\n"
        + (f"Software Version: {p['software_version']}\n" if p.get('software_version') else "")
    )
