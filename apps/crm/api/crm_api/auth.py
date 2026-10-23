"""Validate customer Entra access tokens at the CRM API boundary."""

from __future__ import annotations

import os
from dataclasses import dataclass

import jwt
from jwt import PyJWKClient


class AuthenticationError(ValueError):
    """Raised when a request does not contain an acceptable CRM token."""


@dataclass(frozen=True)
class AuthenticatedUser:
    tenant_id: str
    object_id: str
    display_name: str | None
    username: str | None


def entra_configuration() -> dict[str, str]:
    tenant_id = os.environ.get("CRM_ENTRA_TENANT_ID", "").strip()
    client_id = os.environ.get("CRM_ENTRA_CLIENT_ID", "").strip()
    if not tenant_id or not client_id:
        raise RuntimeError("CRM Entra authentication is not configured.")
    return {
        "tenantId": tenant_id,
        "clientId": client_id,
        "scope": f"api://{client_id}/CRM.Access",
    }


def bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AuthenticationError("Sign in with Microsoft to continue.")
    scheme, separator, token = authorization.partition(" ")
    if separator != " " or scheme.lower() != "bearer" or not token.strip():
        raise AuthenticationError("The authorization header must contain a bearer token.")
    return token.strip()


def validate_access_token(token: str) -> AuthenticatedUser:
    configuration = entra_configuration()
    tenant_id = configuration["tenantId"]
    client_id = configuration["clientId"]
    authority = f"https://login.microsoftonline.com/{tenant_id}"
    issuer = f"{authority}/v2.0"
    signing_keys = PyJWKClient(f"{authority}/discovery/v2.0/keys", cache_keys=True)

    try:
        claims = jwt.decode(
            token,
            signing_keys.get_signing_key_from_jwt(token).key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=issuer,
            options={"require": ["aud", "exp", "iat", "iss", "tid"]},
        )
    except jwt.PyJWTError as error:
        raise AuthenticationError("Microsoft did not provide a valid CRM access token.") from error

    if claims.get("tid") != tenant_id:
        raise AuthenticationError("This CRM is restricted to a different Microsoft Entra tenant.")
    scopes = set(str(claims.get("scp", "")).split())
    if "CRM.Access" not in scopes:
        raise AuthenticationError("The access token does not include CRM permission.")
    object_id = str(claims.get("oid", "")).strip()
    if not object_id:
        raise AuthenticationError("Microsoft did not identify the signed-in user.")

    return AuthenticatedUser(
        tenant_id=tenant_id,
        object_id=object_id,
        display_name=_optional_string(claims.get("name")),
        username=_optional_string(claims.get("preferred_username")),
    )


def _optional_string(value: object) -> str | None:
    return value if isinstance(value, str) and value else None
