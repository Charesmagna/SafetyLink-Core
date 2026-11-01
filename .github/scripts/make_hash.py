import os, hashlib, secrets
pw = os.environ['ADMIN_PASSWORD'].encode()
salt = secrets.token_hex(16)
h = hashlib.pbkdf2_hmac('sha256', pw, bytes.fromhex(salt), 120000, dklen=32).hex()
open('hash.txt', 'w').write(f'pbkdf2$120000${salt}${h}')
open('session.txt', 'w').write(secrets.token_hex(32))
