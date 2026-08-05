const fs = require('fs');
let code = fs.readFileSync('src/components/SafetyLinkLogo.tsx', 'utf8');

code = code.replace(
`        {/* 3D Moving Premium Metal Logo */}
        <motion.div
          animate={{
            transform: \`rotateX(\${tilt.x}deg) rotateY(\${tilt.y}deg) translateZ(0px)\`
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 28 }}
          className="relative w-full h-full flex items-center justify-center select-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Slices or displays the high-fidelity branding logo, swapping conditionally during emergency panic states */}
        </motion.div>`,
`        {/* 3D Moving Premium Metal Logo */}
        <motion.div
          animate={{
            transform: \`rotateX(\${tilt.x}deg) rotateY(\${tilt.y}deg) translateZ(0px)\`
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 28 }}
          className="relative w-full h-full flex items-center justify-center select-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img
            src="/media/new_logo/New_SafetyLink_Official_Logo.svg"
            alt="SafetyLink"
            className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
          />
        </motion.div>`);

fs.writeFileSync('src/components/SafetyLinkLogo.tsx', code);
