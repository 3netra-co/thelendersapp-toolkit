import os
from unittest import TestCase, mock

from crm_api.auth import AuthenticationError, bearer_token, entra_configuration, validate_access_token


class AuthenticationHelpersTests(TestCase):
    def test_rejects_missing_bearer_token(self) -> None:
        with self.assertRaises(AuthenticationError):
            bearer_token(None)

    def test_extracts_bearer_token(self) -> None:
        self.assertEqual(bearer_token("Bearer test-token"), "test-token")

    @mock.patch.dict(os.environ, {
        "CRM_ENTRA_TENANT_ID": "tenant-id",
        "CRM_ENTRA_CLIENT_ID": "client-id",
    }, clear=True)
    def test_returns_public_entra_configuration(self) -> None:
        self.assertEqual(entra_configuration(), {
            "tenantId": "tenant-id",
            "clientId": "client-id",
            "scope": "api://client-id/CRM.Access",
        })

    @mock.patch.dict(os.environ, {}, clear=True)
    def test_rejects_missing_entra_configuration(self) -> None:
        with self.assertRaises(RuntimeError):
            entra_configuration()

    @mock.patch("crm_api.auth.PyJWKClient")
    @mock.patch("crm_api.auth.jwt.decode")
    @mock.patch.dict(os.environ, {
        "CRM_ENTRA_TENANT_ID": "approved-tenant",
        "CRM_ENTRA_CLIENT_ID": "client-id",
    }, clear=True)
    def test_rejects_token_from_another_tenant(self, decode, jwk_client) -> None:
        jwk_client.return_value.get_signing_key_from_jwt.return_value.key = "test-key"
        decode.return_value = {
            "tid": "other-tenant",
            "oid": "user-id",
            "scp": "CRM.Access",
        }

        with self.assertRaisesRegex(AuthenticationError, "different Microsoft Entra tenant"):
            validate_access_token("token")

    @mock.patch("crm_api.auth.PyJWKClient")
    @mock.patch("crm_api.auth.jwt.decode")
    @mock.patch.dict(os.environ, {
        "CRM_ENTRA_TENANT_ID": "approved-tenant",
        "CRM_ENTRA_CLIENT_ID": "client-id",
    }, clear=True)
    def test_accepts_approved_tenant_and_scope(self, decode, jwk_client) -> None:
        jwk_client.return_value.get_signing_key_from_jwt.return_value.key = "test-key"
        decode.return_value = {
            "tid": "approved-tenant",
            "oid": "user-id",
            "scp": "CRM.Access",
            "name": "Test User",
            "preferred_username": "test@example.com",
        }

        user = validate_access_token("token")

        self.assertEqual(user.tenant_id, "approved-tenant")
        self.assertEqual(user.object_id, "user-id")
        jwk_client.assert_called_once_with(
            "https://login.microsoftonline.com/approved-tenant/discovery/v2.0/keys",
            cache_keys=True,
        )
        decode.assert_called_once_with(
            "token",
            "test-key",
            algorithms=["RS256"],
            audience="client-id",
            issuer="https://login.microsoftonline.com/approved-tenant/v2.0",
            options={"require": ["aud", "exp", "iat", "iss", "tid"]},
        )
