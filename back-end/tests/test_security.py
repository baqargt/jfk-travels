from app.security import decrypt_sensitive, encrypt_sensitive, hash_password, token_hash, verify_password


def test_argon2_password_hash_round_trip() -> None:
    encoded = hash_password("a-correct-horse-battery-staple")
    assert encoded.startswith("$argon2")
    assert verify_password("a-correct-horse-battery-staple", encoded)
    assert not verify_password("wrong-password", encoded)


def test_sensitive_value_encryption_and_token_hashing() -> None:
    encrypted = encrypt_sensitive("P1234567")
    assert "P1234567" not in encrypted
    assert decrypt_sensitive(encrypted) == "P1234567"
    assert token_hash("refresh-token") == token_hash("refresh-token")
    assert token_hash("refresh-token") != token_hash("other-token")
