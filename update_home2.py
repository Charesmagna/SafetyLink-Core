import sys

file_path = "src/components/landing/Home.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    '<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310051/copilot_image_1786916665016.png" alt="Security Command Room" />',
    '<img src="/Polish_20260727_023640262.jpg" alt="Security Command Room" style={{ borderRadius: \'12px\' }} />'
)

content = content.replace(
    '<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1786916979200.png" alt="Estate Security" />',
    '<img src="/Polish_20260620_014530309.jpg" alt="Estate Security" style={{ borderRadius: \'12px\' }} />'
)

with open(file_path, "w") as f:
    f.write(content)
