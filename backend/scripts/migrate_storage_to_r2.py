"""
Migration script to move files from Backblaze B2 to Cloudflare R2.

Run locally in a standard Python environment.
Requires:
    pip install boto3

Required environment variables:
    B2_ENDPOINT
    B2_KEY_ID
    B2_APPLICATION_KEY
    B2_BUCKET

    R2_ENDPOINT
    R2_ACCESS_KEY_ID
    R2_SECRET_ACCESS_KEY
    R2_BUCKET
"""

import os
import sys
import time

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError


# ============================================================
# Environment variables
# ============================================================

B2_ENDPOINT = os.getenv("B2_ENDPOINT")
B2_KEY_ID = os.getenv("B2_KEY_ID")
B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY")
B2_BUCKET = os.getenv("B2_BUCKET")

R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET")


# ============================================================
# Validate environment variables
# ============================================================

required_vars = {
    "B2_ENDPOINT": B2_ENDPOINT,
    "B2_KEY_ID": B2_KEY_ID,
    "B2_APPLICATION_KEY": B2_APPLICATION_KEY,
    "B2_BUCKET": B2_BUCKET,
    "R2_ENDPOINT": R2_ENDPOINT,
    "R2_ACCESS_KEY_ID": R2_ACCESS_KEY_ID,
    "R2_SECRET_ACCESS_KEY": R2_SECRET_ACCESS_KEY,
    "R2_BUCKET": R2_BUCKET,
}

missing = [name for name, value in required_vars.items() if not value]

if missing:
    print("Missing required environment variables:")
    for name in missing:
        print(f"  - {name}")
    sys.exit(1)


# ============================================================
# B2 client
# ============================================================

b2_client = boto3.client(
    "s3",
    endpoint_url=B2_ENDPOINT,
    aws_access_key_id=B2_KEY_ID,
    aws_secret_access_key=B2_APPLICATION_KEY,
    region_name="us-west-004",
    config=Config(
        signature_version="s3v4",
        s3={
            "addressing_style": "path",
        },
    ),
)


# ============================================================
# R2 client
# ============================================================

r2_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
    config=Config(
        signature_version="s3v4",
        s3={
            "addressing_style": "path",
        },
    ),
)


# ============================================================
# Helpers
# ============================================================

def list_all_b2_objects():
    """
    List all objects in the B2 bucket, handling pagination.
    """
    continuation_token = None

    while True:
        kwargs = {
            "Bucket": B2_BUCKET,
        }

        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token

        response = b2_client.list_objects_v2(**kwargs)

        for obj in response.get("Contents", []):
            yield obj

        if not response.get("IsTruncated"):
            break

        continuation_token = response.get("NextContinuationToken")

        if not continuation_token:
            break


def retry(operation, *args, **kwargs):
    """Retry transient S3 failures without ever logging credentials."""
    last_error = None
    for attempt in range(4):
        try:
            return operation(*args, **kwargs)
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code not in {"SlowDown", "RequestTimeout", "InternalError", "ServiceUnavailable", "500", "503"}:
                raise
            last_error = exc
        except OSError as exc:
            last_error = exc
        time.sleep(2 ** attempt)
    raise last_error


# ============================================================
# Migration
# ============================================================

def migrate_storage():
    print("Starting B2 → R2 migration...")
    print(f"B2 bucket: {B2_BUCKET}")
    print(f"R2 bucket: {R2_BUCKET}")
    print()

    migrated = 0
    failed = 0

    try:
        print("Testing B2 connection...")

        # Force an initial B2 API request so credential/endpoint
        # problems are detected before migration starts.
        b2_client.list_objects_v2(
            Bucket=B2_BUCKET,
            MaxKeys=1,
        )

        print("B2 connection successful.")
        print()

        print("Listing files in B2 bucket...")

        objects = list_all_b2_objects()

        found_any = False

        for obj in objects:
            found_any = True

            key = obj["Key"]

            print(f"Migrating: {key}")

            try:
                # ------------------------------------------------
                # Download from B2
                # ------------------------------------------------
                existing = None
                try:
                    existing = retry(r2_client.head_object, Bucket=R2_BUCKET, Key=key)
                except ClientError as exc:
                    if exc.response.get("Error", {}).get("Code") not in {"404", "NoSuchKey", "NotFound"}:
                        raise
                if existing and existing.get("ContentLength") == obj.get("Size"):
                    migrated += 1
                    print(f"  ✓ Already verified in R2: {key}")
                    continue

                obj_data = retry(b2_client.get_object,
                    Bucket=B2_BUCKET,
                    Key=key,
                )

                content = obj_data["Body"].read()

                # Preserve content type where available.
                content_type = obj_data.get(
                    "ContentType",
                    "application/octet-stream",
                )

                # ------------------------------------------------
                # Upload to R2
                # ------------------------------------------------
                retry(r2_client.put_object,
                    Bucket=R2_BUCKET,
                    Key=key,
                    Body=content,
                    ContentType=content_type,
                )

                verified = retry(r2_client.head_object, Bucket=R2_BUCKET, Key=key)
                if verified.get("ContentLength") != len(content):
                    raise RuntimeError("R2 verification size mismatch")
                migrated += 1

                print(f"  ✓ Successfully migrated: {key}")

            except Exception as file_error:
                failed += 1
                print(f"  ✗ Failed: {key}")
                print(f"    Error: {file_error}")

        print()
        print("=" * 60)
        print("Migration summary")
        print("=" * 60)
        print(f"Files migrated/verified:      {migrated}")
        print(f"Files failed:                {failed}")
        print("=" * 60)

        if not found_any:
            print("No files were found in the B2 bucket.")

        if failed > 0:
            raise RuntimeError(
                f"Migration finished with {failed} failed file(s)."
            )

        print("Migration completed successfully.")

    except Exception as e:
        print()
        print("=" * 60)
        print("MIGRATION FAILED")
        print("=" * 60)
        print(str(e))
        print("=" * 60)

        raise


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    migrate_storage()
