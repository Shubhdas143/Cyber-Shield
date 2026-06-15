import ssl
import socket
import asyncio
from datetime import datetime, timezone

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID, ExtensionOID


def _cn(name):
    try:
        return name.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
    except Exception:
        return None


def _aware(dt):
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _fetch_sync(host: str, port: int = 443, timeout: float = 9.0) -> dict:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with socket.create_connection((host, port), timeout=timeout) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as ssock:
            der = ssock.getpeercert(binary_form=True)
            tls_version = ssock.version()
            cipher = ssock.cipher()

    cert = x509.load_der_x509_certificate(der, default_backend())

    try:
        not_before = _aware(cert.not_valid_before_utc)
        not_after = _aware(cert.not_valid_after_utc)
    except AttributeError:
        not_before = _aware(cert.not_valid_before)
        not_after = _aware(cert.not_valid_after)

    now = datetime.now(timezone.utc)
    days_left = (not_after - now).days

    try:
        san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME).value
        sans = san_ext.get_values_for_type(x509.DNSName)
    except Exception:
        sans = []

    subject_cn = _cn(cert.subject)
    issuer_cn = _cn(cert.issuer)

    return {
        "host": host,
        "port": port,
        "subject": cert.subject.rfc4514_string(),
        "subject_cn": subject_cn,
        "issuer": cert.issuer.rfc4514_string(),
        "issuer_cn": issuer_cn,
        "serial": format(cert.serial_number, "x"),
        "signature_algorithm": getattr(cert.signature_algorithm_oid, "_name", str(cert.signature_algorithm_oid)),
        "version": cert.version.name,
        "valid_from": not_before.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "valid_to": not_after.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "days_until_expiry": days_left,
        "is_expired": now > not_after,
        "not_yet_valid": now < not_before,
        "self_signed": subject_cn is not None and subject_cn == issuer_cn,
        "san": sans,
        "tls_version": tls_version,
        "cipher": cipher[0] if cipher else None,
    }


async def inspect(host: str, port: int = 443) -> dict:
    return await asyncio.to_thread(_fetch_sync, host, port)


def build_context(c: dict) -> str:
    return (
        f"Host: {c['host']}:{c['port']}\n"
        f"Subject CN: {c.get('subject_cn')}\n"
        f"Subject: {c['subject']}\n"
        f"Issuer CN: {c.get('issuer_cn')}\n"
        f"Issuer: {c['issuer']}\n"
        f"Serial: {c['serial']}\n"
        f"Signature Algorithm: {c['signature_algorithm']}\n"
        f"Valid From: {c['valid_from']}\n"
        f"Valid To: {c['valid_to']}\n"
        f"Days Until Expiry: {c['days_until_expiry']}\n"
        f"Expired: {c['is_expired']} | Not Yet Valid: {c['not_yet_valid']} | Self-Signed: {c['self_signed']}\n"
        f"TLS Version: {c['tls_version']} | Cipher: {c['cipher']}\n"
        f"Subject Alternative Names ({len(c['san'])}): {', '.join(c['san'][:25]) or 'none'}"
    )
