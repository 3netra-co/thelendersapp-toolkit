import tempfile
import unittest
from pathlib import Path

from crm_api.web import resolve_web_asset


class WebAssetResolutionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = tempfile.TemporaryDirectory()
        self.web_root = Path(self.temp_directory.name)
        (self.web_root / "index.html").write_text("CRM", encoding="utf-8")
        (self.web_root / "assets").mkdir()
        (self.web_root / "assets" / "app.js").write_text("app", encoding="utf-8")

    def tearDown(self) -> None:
        self.temp_directory.cleanup()

    def test_root_returns_index(self) -> None:
        self.assertEqual(
            resolve_web_asset(self.web_root, ""),
            (self.web_root / "index.html").resolve(),
        )

    def test_existing_asset_is_served(self) -> None:
        self.assertEqual(
            resolve_web_asset(self.web_root, "assets/app.js"),
            (self.web_root / "assets" / "app.js").resolve(),
        )

    def test_client_route_returns_index(self) -> None:
        self.assertEqual(
            resolve_web_asset(self.web_root, "contacts/123"),
            (self.web_root / "index.html").resolve(),
        )

    def test_missing_asset_is_not_replaced_with_html(self) -> None:
        self.assertIsNone(resolve_web_asset(self.web_root, "assets/missing.js"))

    def test_parent_traversal_is_rejected(self) -> None:
        self.assertIsNone(resolve_web_asset(self.web_root, "../secret.txt"))


if __name__ == "__main__":
    unittest.main()
