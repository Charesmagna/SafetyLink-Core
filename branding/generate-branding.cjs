const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DEPLOYMENT_TARGETS = [
  // Native Android Mipmap Matrices
  { outputPath: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', width: 48, height: 48, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', width: 72, height: 72, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', width: 96, height: 96, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', width: 144, height: 144, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', width: 192, height: 192, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', width: 48, height: 48, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', width: 72, height: 72, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', width: 96, height: 96, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', width: 144, height: 144, isTransparent: true },
  { outputPath: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', width: 192, height: 192, isTransparent: true },

  // Android 13+ Notification Interface & Round Profile Manifests
  { outputPath: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_monochrome.png', width: 108, height: 108, isTransparent: true },

  // Web PWA App Shell and Core Favicon Assets
  { outputPath: 'public/assets/icon-192.png', width: 192, height: 192, isTransparent: true },
  { outputPath: 'public/assets/icon-512.png', width: 512, height: 512, isTransparent: true },
  { outputPath: 'public/favicon.ico', width: 32, height: 32, isTransparent: true }
];

async function processMasterBranding(svgSourcePath) {
  try {
    if (!fs.existsSync(svgSourcePath)) {
      throw new Error(`Master brand source asset not located at target: ${svgSourcePath}`);
    }

    const rawSvgData = fs.readFileSync(svgSourcePath, 'utf8');
    // Deterministically purge bounding box vectors and white halo backdrops
    const clearBackgroundSvg = rawSvgData
      .replace(/<rect[^>]*fill\s*=\s*["'](?:#FFFFFF|white)["'][^>]*\/>/gi, '')
      .replace(/<path[^>]*fill\s*=\s*["'](?:#FFFFFF|white)["'][^>]*\/>/gi, '');
      
    const optimizedSvgBuffer = Buffer.from(clearBackgroundSvg);

    for (const target of DEPLOYMENT_TARGETS) {
      const parentDirectory = path.dirname(target.outputPath);
      if (!fs.existsSync(parentDirectory)) {
        fs.mkdirSync(parentDirectory, { recursive: true });
      }

      let transformer = sharp(optimizedSvgBuffer).resize(target.width, target.height);
      if (target.isTransparent) {
        transformer = transformer.ensureAlpha(0).png({ compressionLevel: 9, quality: 100 });
      }
      
      await transformer.toFile(target.outputPath);
    }
    
    console.log('✓ SafetyLink Pipeline Build Complete: Vector masks stripped. All target nodes generated.');
  } catch (ex) {
    console.error('X System pipeline execution failure:', ex);
    throw ex;
  }
}

processMasterBranding(path.join(__dirname, 'master.svg'));
