const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const svg2img = require('svg2img');

console.log('=== SafetyLink Official Branding Generator ===');

const masterSvgPath = path.join(__dirname, 'master.svg');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const masterSvgContent = fs.readFileSync(masterSvgPath, 'utf8');

// Step 1: Render master vector SVG to a high-resolution 1024x1024 master transparent PNG
console.log('Rendering master vector SVG to master PNG (1024x1024)...');
const masterPngPath = path.join(outputDir, 'master_transparent_1024.png');

svg2img(masterSvgContent, { width: 1024, height: 1024 }, (err, buffer) => {
  if (err) {
    console.error('Failed to render master SVG:', err);
    process.exit(1);
  }
  
  fs.writeFileSync(masterPngPath, buffer);
  console.log('Master transparent PNG generated successfully!');
  
  // Now run the rest of the generation pipeline
  runPipeline(masterPngPath);
});

function runPipeline(masterPng) {
  try {
    // Colors from colors.json
    const colors = {
      dark: '#07090e',
      white: '#ffffff',
      emerald: '#10b981',
      blue: '#3b82f6'
    };

    console.log('\n--- Generating Web & PWA Assets ---');
    const webTargets = [
      { path: 'public/favicon-16x16.png', size: 16 },
      { path: 'public/favicon-32x32.png', size: 32 },
      { path: 'public/apple-touch-icon.png', size: 180 },
      { path: 'public/icon-192.png', size: 192 },
      { path: 'public/icon-512.png', size: 512 },
      { path: 'public/logo.png', size: 512 },
      { path: 'public/Polish_20260620_014530309.jpg', size: 512 },
      { path: 'www/Icons/icon-192.png', size: 192 },
      { path: 'www/Icons/icon-512.png', size: 512 }
    ];

    webTargets.forEach(target => {
      const fullPath = path.resolve(target.path);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      console.log(`Generating ${target.path} (${target.size}x${target.size})...`);
      if (target.path.endsWith('.jpg')) {
        // Render with deep dark background for JPG format to support high-contrast white logo
        execSync(`convert "${masterPng}" -resize ${target.size}x${target.size} -background "#07090e" -flatten "${fullPath}"`);
      } else {
        execSync(`convert "${masterPng}" -resize ${target.size}x${target.size} "${fullPath}"`);
      }
    });

    // Generate public/favicon.ico
    console.log('Generating public/favicon.ico...');
    execSync(`convert "${masterPng}" -resize 32x32 -background none -define icon:auto-resize=32,16 public/favicon.ico`);

    // Copy favicon.svg
    console.log('Generating public/favicon.svg...');
    fs.copyFileSync(masterSvgPath, path.resolve('public/favicon.svg'));

    // Generate public/icon-maskable.png (with dark tactical background padding)
    console.log('Generating public/icon-maskable.png...');
    execSync(`convert "${masterPng}" -resize 360x360 -background "${colors.dark}" -gravity center -extent 512x512 public/icon-maskable.png`);

    console.log('\n--- Scanning for Android Mipmap Directories ---');
    // Find all mipmap- folders in the project
    const findMipmapDirs = () => {
      const dirs = [];
      const searchDirs = ['android', 'platforms', 'app'];
      
      const traverse = (current) => {
        if (!fs.existsSync(current)) return;
        const stats = fs.statSync(current);
        if (stats.isDirectory()) {
          const name = path.basename(current);
          if (name.startsWith('mipmap-')) {
            dirs.push(current);
            return;
          }
          const files = fs.readdirSync(current);
          files.forEach(f => traverse(path.join(current, f)));
        }
      };
      
      searchDirs.forEach(traverse);
      return dirs;
    };

    const mipmapDirs = findMipmapDirs();
    console.log(`Found ${mipmapDirs.length} mipmap directories.`);

    mipmapDirs.forEach(dir => {
      const dirName = path.basename(dir);
      // Determine base scale based on resolution
      let scale = 96; // xhdpi default
      if (dirName.includes('mdpi')) scale = 48;
      else if (dirName.includes('hdpi')) scale = 72;
      else if (dirName.includes('xhdpi')) scale = 96;
      else if (dirName.includes('xxhdpi')) scale = 144;
      else if (dirName.includes('xxxhdpi')) scale = 192;

      console.log(`Processing ${dir} (scale=${scale}x${scale})...`);

      // Determine formats inside
      const filesInDir = fs.readdirSync(dir);
      const isWebpDir = filesInDir.some(f => f.endsWith('.webp'));
      const ext = isWebpDir ? 'webp' : 'png';

      // 1. ic_launcher
      const icLauncherPath = path.join(dir, `ic_launcher.${ext}`);
      execSync(`convert "${masterPng}" -resize ${scale}x${scale} "${icLauncherPath}"`);

      // 2. ic_launcher_round
      const icLauncherRoundPath = path.join(dir, `ic_launcher_round.${ext}`);
      execSync(`convert "${masterPng}" -resize ${Math.round(scale * 0.75)}x${Math.round(scale * 0.75)} -gravity center -background none -extent ${scale}x${scale} "${icLauncherRoundPath}"`);

      // 3. Adaptive icons (only if folder suffix includes -v26 or for folders with adaptive config)
      const adaptiveSize = Math.round(scale * 2.25);
      const logoSize = Math.round(adaptiveSize * 0.6); // 60% safe zone

      const fgPath = path.join(dir, `ic_launcher_foreground.${ext}`);
      execSync(`convert "${masterPng}" -resize ${logoSize}x${logoSize} -gravity center -background none -extent ${adaptiveSize}x${adaptiveSize} "${fgPath}"`);

      const bgPath = path.join(dir, `ic_launcher_background.${ext}`);
      execSync(`convert -size ${adaptiveSize}x${adaptiveSize} xc:"${colors.dark}" "${bgPath}"`);

      // 4. ic_launcher_monochrome
      const monoPath = path.join(dir, `ic_launcher_monochrome.${ext}`);
      execSync(`convert "${fgPath}" -fill white -colorize 100 "${monoPath}"`);
    });

    console.log('\n--- Cleaning up Outdated Branding Files & References ---');
    // Delete files starting with "Polish_" in public or dist, or other outdated icons
    const filesToClean = [
      'public/kleva.jpg',
      'public/kleva.png',
      'public/K_leva.png',
      'K\'leva.png',
      'src/components/assets/kleva.jpg',
      'src/components/assets/kleva.png',
      'dist/kleva.jpg',
      'dist/kleva.png',
      'dist/K_leva.png'
    ];

    filesToClean.forEach(file => {
      const fullPath = path.resolve(file);
      if (fs.existsSync(fullPath)) {
        console.log(`Cleaning old asset: ${file}`);
        try {
          fs.unlinkSync(fullPath);
        } catch(e) {}
      }
    });

    console.log('\n=== Branding Generation Successfully Completed! ===\n');
  } catch (error) {
    console.error('Error during asset pipeline execution:', error);
  }
}
