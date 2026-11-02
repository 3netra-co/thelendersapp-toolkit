"""Customer-owned storage adapters used by domain services."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any, Protocol

from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
from azure.data.tables import TableServiceClient, UpdateMode
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient
from azure.storage.queue import QueueServiceClient


class Store(Protocol):
    def get(self, table: str, partition: str, row: str) -> dict[str, Any] | None: ...
    def list_partition(self, table: str, partition: str) -> list[dict[str, Any]]: ...
    def create(self, table: str, entity: dict[str, Any]) -> bool: ...
    def upsert(self, table: str, entity: dict[str, Any]) -> None: ...
    def put_json(self, container: str, name: str, value: dict[str, Any]) -> bool: ...
    def enqueue(self, queue: str, value: dict[str, Any]) -> None: ...


class AzureStore:
    """Azure Tables/Blob/Queue implementation using managed identity."""

    def __init__(self) -> None:
        connection_string = os.environ.get("CRM_STORAGE_CONNECTION_STRING", "").strip()
        if connection_string:
            self.tables = TableServiceClient.from_connection_string(connection_string)
            self.blobs = BlobServiceClient.from_connection_string(connection_string)
            self.queues = QueueServiceClient.from_connection_string(connection_string)
            return
        account = os.environ.get("CRM_STORAGE_ACCOUNT_NAME", "").strip()
        if not account:
            raise RuntimeError("CRM storage is not configured.")
        credential = DefaultAzureCredential()
        self.tables = TableServiceClient(
            endpoint=f"https://{account}.table.core.windows.net", credential=credential
        )
        self.blobs = BlobServiceClient(
            account_url=f"https://{account}.blob.core.windows.net", credential=credential
        )
        self.queues = QueueServiceClient(
            account_url=f"https://{account}.queue.core.windows.net", credential=credential
        )

    def get(self, table: str, partition: str, row: str) -> dict[str, Any] | None:
        try:
            return dict(self.tables.get_table_client(table).get_entity(partition, row))
        except ResourceNotFoundError:
            return None

    def list_partition(self, table: str, partition: str) -> list[dict[str, Any]]:
        escaped = partition.replace("'", "''")
        return [
            dict(entity)
            for entity in self.tables.get_table_client(table).query_entities(
                query_filter=f"PartitionKey eq '{escaped}'"
            )
        ]

    def create(self, table: str, entity: dict[str, Any]) -> bool:
        try:
            self.tables.get_table_client(table).create_entity(entity)
            return True
        except ResourceExistsError:
            return False

    def upsert(self, table: str, entity: dict[str, Any]) -> None:
        self.tables.get_table_client(table).upsert_entity(entity, mode=UpdateMode.MERGE)

    def put_json(self, container: str, name: str, value: dict[str, Any]) -> bool:
        try:
            self.blobs.get_blob_client(container, name).upload_blob(
                json.dumps(value, separators=(",", ":")), overwrite=False
            )
            return True
        except ResourceExistsError:
            return False

    def enqueue(self, queue: str, value: dict[str, Any]) -> None:
        self.queues.get_queue_client(queue).send_message(
            json.dumps(value, separators=(",", ":"))
        )


@dataclass
class MemoryStore:
    """Deterministic test adapter; never used by a deployed installation."""

    entities: dict[tuple[str, str, str], dict[str, Any]] = field(default_factory=dict)
    blobs: dict[tuple[str, str], dict[str, Any]] = field(default_factory=dict)
    messages: list[tuple[str, dict[str, Any]]] = field(default_factory=list)

    def get(self, table: str, partition: str, row: str) -> dict[str, Any] | None:
        value = self.entities.get((table, partition, row))
        return dict(value) if value else None

    def list_partition(self, table: str, partition: str) -> list[dict[str, Any]]:
        return [
            dict(value)
            for (entity_table, entity_partition, _), value in self.entities.items()
            if entity_table == table and entity_partition == partition
        ]

    def create(self, table: str, entity: dict[str, Any]) -> bool:
        key = (table, str(entity["PartitionKey"]), str(entity["RowKey"]))
        if key in self.entities:
            return False
        self.entities[key] = dict(entity)
        return True

    def upsert(self, table: str, entity: dict[str, Any]) -> None:
        key = (table, str(entity["PartitionKey"]), str(entity["RowKey"]))
        self.entities[key] = {**self.entities.get(key, {}), **entity}

    def put_json(self, container: str, name: str, value: dict[str, Any]) -> bool:
        key = (container, name)
        if key in self.blobs:
            return False
        self.blobs[key] = dict(value)
        return True

    def enqueue(self, queue: str, value: dict[str, Any]) -> None:
        self.messages.append((queue, dict(value)))
