import os
import base64

png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
png_data = base64.b64decode(png_b64)

for root, dirs, files in os.walk('android/app/src/main/res/'):
    for file in files:
        if file.endswith('.png'):
            path = os.path.join(root, file)
            # check if it starts with png magic bytes
            with open(path, 'rb') as f:
                header = f.read(8)
            if header != b'\x89PNG\r\n\x1a\n':
                print(f"Fixing {path}")
                with open(path, 'wb') as f:
                    f.write(png_data)
