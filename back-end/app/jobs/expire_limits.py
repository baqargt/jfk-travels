from app.tasks import expire_temporary_limits


def main() -> None:
    print(expire_temporary_limits.run())


if __name__ == "__main__":
    main()
