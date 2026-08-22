"""Generate a bcrypt hash for a seed user password. Usage: python scripts/hash_password.py <password>"""

import sys

import bcrypt


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/hash_password.py <password>")
        raise SystemExit(1)
    password = sys.argv[1]
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    print(hashed.decode("utf-8"))


if __name__ == "__main__":
    main()
