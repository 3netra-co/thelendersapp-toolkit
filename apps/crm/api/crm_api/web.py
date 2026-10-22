from pathlib import Path


def resolve_web_asset(web_root: Path, requested_path: str) -> Path | None:
    """Resolve a PWA route without allowing access outside the compiled web root."""
    root = web_root.resolve()
    relative_path = requested_path.lstrip("/")
    candidate = (root / relative_path).resolve()

    try:
        candidate.relative_to(root)
    except ValueError:
        return None

    if not relative_path:
        return root / "index.html"
    if candidate.is_file():
        return candidate

    # Browser routes belong to the SPA. Missing files do not: returning index.html
    # for a missing script or image would give the browser HTML with the wrong type.
    if Path(relative_path).suffix:
        return None
    return root / "index.html"
