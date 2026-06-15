import io
from PIL import Image, ExifTags
from PIL.ExifTags import GPSTAGS

try:
    from PIL.TiffImagePlugin import IFDRational
except Exception:  # pragma: no cover
    IFDRational = None


def _clean(v):
    """Make EXIF values JSON/Mongo serialisable."""
    if isinstance(v, bytes):
        return v.decode("utf-8", "replace")[:300]
    if IFDRational is not None and isinstance(v, IFDRational):
        try:
            return float(v)
        except Exception:
            return str(v)
    if isinstance(v, (list, tuple)):
        return [_clean(x) for x in v]
    if isinstance(v, dict):
        return {str(k): _clean(val) for k, val in v.items()}
    if isinstance(v, (int, float, str, bool)) or v is None:
        return v
    return str(v)


def _to_degrees(value):
    try:
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return None


def extract_exif(data: bytes, filename: str) -> dict:
    img = Image.open(io.BytesIO(data))
    info = {
        "filename": filename,
        "format": img.format,
        "mode": img.mode,
        "width": img.width,
        "height": img.height,
        "size": f"{img.width} x {img.height}",
    }

    tags = {}
    gps_raw = {}
    exif = img.getexif()
    if exif:
        for tag_id, val in exif.items():
            name = ExifTags.TAGS.get(tag_id, str(tag_id))
            if name == "GPSInfo":
                continue
            tags[str(name)] = _clean(val)
        try:
            gps_ifd = exif.get_ifd(0x8825)
            for k, v in gps_ifd.items():
                gps_raw[str(GPSTAGS.get(k, k))] = _clean(v)
        except Exception:
            pass

    coords = None
    if gps_raw.get("GPSLatitude") and gps_raw.get("GPSLongitude"):
        lat = _to_degrees(gps_raw.get("GPSLatitude"))
        lon = _to_degrees(gps_raw.get("GPSLongitude"))
        if lat is not None and lon is not None:
            if str(gps_raw.get("GPSLatitudeRef", "")).upper().startswith("S"):
                lat = -lat
            if str(gps_raw.get("GPSLongitudeRef", "")).upper().startswith("W"):
                lon = -lon
            lat = round(lat, 6)
            lon = round(lon, 6)
            coords = {
                "latitude": lat,
                "longitude": lon,
                "maps_url": f"https://www.google.com/maps?q={lat},{lon}",
            }

    return {
        "info": info,
        "exif": tags,
        "gps": gps_raw,
        "coords": coords,
        "has_exif": bool(tags or gps_raw),
    }


def build_context(meta: dict) -> str:
    info = meta["info"]
    t = meta["exif"]
    lines = [
        f"File: {info['filename']} | Format: {info['format']} | Dimensions: {info['size']}",
        f"Camera Make: {t.get('Make', 'Not present')}",
        f"Camera Model: {t.get('Model', 'Not present')}",
        f"Date/Time Original: {t.get('DateTimeOriginal', t.get('DateTime', 'Not present'))}",
        f"Software: {t.get('Software', 'Not present')}",
        f"Lens: {t.get('LensModel', 'Not present')}",
        f"Artist/Author: {t.get('Artist', 'Not present')}",
    ]
    if meta.get("coords"):
        c = meta["coords"]
        lines.append(f"GPS Coordinates: {c['latitude']}, {c['longitude']} ({c['maps_url']})")
    else:
        lines.append("GPS Coordinates: Not present")
    lines.append(f"Total EXIF tags found: {len(t)}")
    return "\n".join(lines)
