#!/bin/bash
declare -A sizes=( ["mdpi"]=48 ["hdpi"]=72 ["xhdpi"]=96 ["xxhdpi"]=144 ["xxxhdpi"]=192 )

for density in "${!sizes[@]}"; do
  size=${sizes[$density]}
  dir="android/app/src/main/res/mipmap-${density}"
  echo "Generating for $dir (size $size)"
  
  if [ -d "$dir" ]; then
    # Background (teal)
    convert -size ${size}x${size} canvas:"#0d1623" "$dir/ic_launcher_background.png"
    # Foreground (white square for now, or just a circle)
    convert -size ${size}x${size} xc:none -fill "#14b8a6" -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" "$dir/ic_launcher_foreground.png"
    # Standard launcher
    convert -size ${size}x${size} canvas:"#0d1623" -fill "#14b8a6" -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" "$dir/ic_launcher.png"
    # Round launcher (same as standard but masked as circle)
    convert -size ${size}x${size} xc:none -fill "#0d1623" -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \
            -fill "#14b8a6" -draw "circle $((size/2)),$((size/2)) $((size/2)),$((size/4))" "$dir/ic_launcher_round.png"
  fi
done

# Also generate the adaptive XML if needed? 
