from botocore.exceptions import ClientError

from app.config import settings
from app.storage import s3_client


def main() -> None:
    if not settings.file_uploads_enabled or settings.storage_backend != "s3":
        return
    client = s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        client.create_bucket(Bucket=settings.s3_bucket)


if __name__ == "__main__":
    main()
