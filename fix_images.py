import os

replacements = {
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png": "/media/images/Platform_Screenshot.jpeg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png": "/media/images/Emergency_Response_Platform_Architecture_Overview.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310050/Polish_20260809_035827088.png": "/media/images/Polish_20260727_010938698.jpg",
    
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4": "/media/videos/SafetyLink%203D%20Animation%20Logo.mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4": "/media/videos/How_Emergency_Escalation_Pipelines_Work.mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310200/Neighbourhood_watch_security_c.mp4": "/media/videos/How_SafetyLink_Automates_Emergency_Responses.mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310194/drone_dispatch_tracking_crimin.mp4": "/media/videos/Inside_the_SafetyLink_Emergency_Ecosystem.mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310205/Show_the_uses_in_school_and_wo.mp4": "/media/videos/video%20(1).mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310200/Old_people_scenario_alone_at_h.mp4": "/media/videos/How_Emergency_Escalation_Pipelines_Work.mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310192/Pitch_deck.mp4": "/media/videos/SafetyLink%203D%20Animation%20Logo.mp4",
    "https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310191/Why.mp4": "/media/videos/Inside_the_SafetyLink_Emergency_Ecosystem.mp4",
    
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310051/copilot_image_1786916665016.png": "/media/images/Gemini_Generated_Image_bes7lhbes7lhbes7.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310215/Gemini_Generated_Image_viirg9viirg9viir.png": "/media/images/Gemini_Generated_Image_cj8x5rcj8x5rcj8x.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1786916979200.png": "/media/images/Gemini_Generated_Image_ghu57oghu57oghu5.png",
    
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313191/Gemini_Generated_Image_4jokgv4jokgv4jok.jpg": "/media/images/Emergency_System_Architecture_Anatomy.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg": "/media/images/Safety_Response_System_Architecture.png",
    
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020219883.jpg": "/media/images/Polish_20260819_020219883.jpg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020134421.jpg": "/media/images/Polish_20260819_020134421.jpg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310010/Polish_20260819_020007723.jpg": "/media/images/Polish_20260819_020134421-1.jpg",
    
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309980/Gemini_Generated_Image_k9vgu9k9vgu9k9vg.png": "/media/images/Polish_20260727_010938698.jpg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309942/Gemini_Generated_Image_swlp4kswlp4kswlp_1.jpg": "/media/images/Safety_Response_System_Architecture.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309940/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg": "/media/images/Polish_20260727_023640262.jpg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_s8bl6ps8bl6ps8bl.jpg": "/media/images/image_1783702731867.jpeg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1783703540293.png": "/media/images/eka67lqzxa.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309942/Gemini_Generated_Image_283s3m283s3m283s.jpg": "/media/images/Emergency_Response_Platform_Architecture_Overview.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png": "/media/images/Gemini_Generated_Image_waguavwaguavwagu.jpeg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310062/copilot_image_1783201115036.png": "/media/images/Emergency_System_Architecture_Anatomy.png",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310049/Polish_20260620_014530309.jpg": "/media/images/Polish_20260620_014530309.jpg",
    "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/SafetyLink_3D_Render.pdf": "/media/images/Safety_Response_System_Architecture.png"
}

file_path = "src/components/landing/Home.tsx"
with open(file_path, 'r') as file:
    content = file.read()

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w') as file:
    file.write(content)

