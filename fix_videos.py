import sys

file_path = "src/components/landing/Home.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    'src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4"',
    'src="/media/videos/How_SafetyLink_Automates_Emergency_Responses.mp4"'
)

content = content.replace(
    'src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4"',
    'src="/media/videos/How_Emergency_Escalation_Pipelines_Work.mp4"'
)

# And fix any leftover K'lev.ai images that might have slipped through
content = content.replace(
    '<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png" alt="K\'lev.ai Intelligence Platform" />',
    '<img src="/Polish_20260727_023640262.jpg" alt="SafetyLink App Analytics UI" style={{ borderRadius: \'12px\' }} />'
)

with open(file_path, "w") as f:
    f.write(content)
