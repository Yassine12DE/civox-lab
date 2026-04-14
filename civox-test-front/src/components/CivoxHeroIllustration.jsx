export default function CivoxHeroIllustration() {
  return (
    <svg
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7B2CBF" />
          <stop offset="100%" stopColor="#9D4EDD" />
        </linearGradient>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#FF8F66" />
        </linearGradient>
        <linearGradient id="lightPurpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9D4EDD" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9D4EDD" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background Glow Elements */}
      <circle cx="900" cy="200" r="300" fill="url(#glowGradient)" />
      <circle cx="300" cy="600" r="250" fill="url(#glowGradient)" />

      {/* Network Connection Lines */}
      <g opacity="0.3" stroke="#7B2CBF" strokeWidth="2" strokeDasharray="8 8">
        <path d="M 200 300 Q 400 250 600 300" />
        <path d="M 400 400 Q 600 450 800 400" />
        <path d="M 250 500 Q 450 480 650 520" />
        <path d="M 700 250 Q 850 300 950 250" />
      </g>

      {/* Main Platform Interface - Large Card */}
      <g transform="translate(550, 150)">
        <rect
          x="0"
          y="0"
          width="550"
          height="400"
          rx="24"
          fill="white"
          stroke="#E5E7EB"
          strokeWidth="2"
          filter="drop-shadow(0 20px 40px rgba(123, 44, 191, 0.15))"
        />

        {/* Dashboard Header */}
        <rect x="24" y="24" width="200" height="12" rx="6" fill="#7B2CBF" opacity="0.3" />
        <rect x="24" y="48" width="140" height="8" rx="4" fill="#9D4EDD" opacity="0.2" />

        {/* Module Cards Inside Dashboard */}
        {/* Voting Module */}
        <g transform="translate(40, 90)">
          <rect width="140" height="120" rx="12" fill="url(#purpleGradient)" />
          <circle cx="70" cy="40" r="18" fill="white" opacity="0.9" />
          <path
            d="M 60 40 L 67 47 L 80 34"
            stroke="#7B2CBF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="20" y="70" width="100" height="6" rx="3" fill="white" opacity="0.8" />
          <rect x="20" y="85" width="80" height="6" rx="3" fill="white" opacity="0.6" />
        </g>

        {/* Consultation Module */}
        <g transform="translate(200, 90)">
          <rect width="140" height="120" rx="12" fill="white" stroke="#7B2CBF" strokeWidth="2" />
          <circle cx="40" cy="35" r="14" fill="#9D4EDD" opacity="0.3" />
          <circle cx="70" cy="35" r="14" fill="#9D4EDD" opacity="0.5" />
          <circle cx="100" cy="35" r="14" fill="#9D4EDD" opacity="0.3" />
          <rect x="20" y="65" width="100" height="6" rx="3" fill="#7B2CBF" opacity="0.3" />
          <rect x="20" y="80" width="80" height="6" rx="3" fill="#7B2CBF" opacity="0.2" />
          <rect x="20" y="95" width="90" height="6" rx="3" fill="#7B2CBF" opacity="0.2" />
        </g>

        {/* Community Module */}
        <g transform="translate(360, 90)">
          <rect width="140" height="120" rx="12" fill="url(#orangeGradient)" />
          <circle cx="50" cy="40" r="16" fill="white" opacity="0.9" />
          <circle cx="90" cy="40" r="16" fill="white" opacity="0.9" />
          <path
            d="M 35 55 Q 50 45 70 55 Q 90 45 105 55"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          <rect x="20" y="80" width="100" height="6" rx="3" fill="white" opacity="0.8" />
          <rect x="20" y="95" width="70" height="6" rx="3" fill="white" opacity="0.6" />
        </g>

        {/* News/Updates Module */}
        <g transform="translate(40, 240)">
          <rect width="220" height="100" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="2" />
          <rect x="16" y="16" width="50" height="50" rx="8" fill="#9D4EDD" opacity="0.2" />
          <rect x="80" y="16" width="120" height="8" rx="4" fill="#7B2CBF" opacity="0.3" />
          <rect x="80" y="32" width="100" height="6" rx="3" fill="#7B2CBF" opacity="0.2" />
          <rect x="80" y="45" width="80" height="6" rx="3" fill="#7B2CBF" opacity="0.15" />
        </g>

        {/* Youth Participation Badge */}
        <g transform="translate(280, 240)">
          <rect width="220" height="100" rx="12" fill="url(#lightPurpleGradient)" stroke="#9D4EDD" strokeWidth="2" />
          <circle cx="50" cy="50" r="24" fill="#FF6B35" />
          <path
            d="M 50 38 L 53 46 L 62 46 L 55 52 L 58 60 L 50 55 L 42 60 L 45 52 L 38 46 L 47 46 Z"
            fill="white"
          />
          <rect x="90" y="30" width="100" height="8" rx="4" fill="#7B2CBF" opacity="0.4" />
          <rect x="90" y="48" width="80" height="6" rx="3" fill="#7B2CBF" opacity="0.3" />
        </g>
      </g>

      {/* Floating People Avatars with Interaction */}
      {/* Left Side - Citizen 1 */}
      <g transform="translate(150, 250)">
        <circle cx="0" cy="0" r="50" fill="url(#purpleGradient)" opacity="0.1" />
        <circle cx="0" cy="0" r="36" fill="white" stroke="#7B2CBF" strokeWidth="3" />
        <circle cx="0" cy="-8" r="12" fill="#7B2CBF" />
        <path d="M -18 10 Q 0 20 18 10" stroke="#7B2CBF" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Left Side - Citizen 2 */}
      <g transform="translate(120, 450)">
        <circle cx="0" cy="0" r="45" fill="url(#orangeGradient)" opacity="0.1" />
        <circle cx="0" cy="0" r="32" fill="white" stroke="#FF6B35" strokeWidth="3" />
        <circle cx="0" cy="-6" r="10" fill="#FF6B35" />
        <path d="M -15 8 Q 0 16 15 8" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Top Left - Organization Rep */}
      <g transform="translate(280, 150)">
        <circle cx="0" cy="0" r="48" fill="url(#purpleGradient)" opacity="0.1" />
        <circle cx="0" cy="0" r="34" fill="white" stroke="#9D4EDD" strokeWidth="3" />
        <circle cx="0" cy="-7" r="11" fill="#9D4EDD" />
        <path d="M -16 9 Q 0 18 16 9" stroke="#9D4EDD" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Bottom Left - Community Member */}
      <g transform="translate(200, 600)">
        <circle cx="0" cy="0" r="42" fill="url(#orangeGradient)" opacity="0.1" />
        <circle cx="0" cy="0" r="30" fill="white" stroke="#FF8F66" strokeWidth="3" />
        <circle cx="0" cy="-6" r="10" fill="#FF8F66" />
        <path d="M -14 7 Q 0 15 14 7" stroke="#FF8F66" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Connection Dots */}
      <circle cx="350" cy="300" r="6" fill="#7B2CBF" />
      <circle cx="500" cy="350" r="6" fill="#9D4EDD" />
      <circle cx="450" cy="500" r="6" fill="#FF6B35" />
      <circle cx="320" cy="450" r="6" fill="#FF8F66" />

      {/* Interactive Elements - Floating Action Indicators */}
      <g transform="translate(450, 200)">
        <circle cx="0" cy="0" r="20" fill="#7B2CBF" opacity="0.2" />
        <circle cx="0" cy="0" r="12" fill="#7B2CBF" />
        <path
          d="M -4 0 L 0 4 L 4 -4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <g transform="translate(400, 580)">
        <circle cx="0" cy="0" r="18" fill="#FF6B35" opacity="0.2" />
        <circle cx="0" cy="0" r="11" fill="#FF6B35" />
        <circle cx="-3" cy="0" r="2" fill="white" />
        <circle cx="3" cy="0" r="2" fill="white" />
        <circle cx="0" cy="4" r="2" fill="white" />
      </g>

      {/* Data Visualization Mini Chart */}
      <g transform="translate(100, 100)">
        <rect x="0" y="60" width="12" height="40" rx="4" fill="#7B2CBF" opacity="0.6" />
        <rect x="20" y="40" width="12" height="60" rx="4" fill="#9D4EDD" opacity="0.7" />
        <rect x="40" y="50" width="12" height="50" rx="4" fill="#FF6B35" opacity="0.6" />
        <rect x="60" y="30" width="12" height="70" rx="4" fill="#7B2CBF" opacity="0.8" />
      </g>

      {/* Security/Trust Badge */}
      <g transform="translate(950, 600)">
        <path
          d="M 0 0 L 20 -8 L 40 0 L 40 25 Q 40 45 20 50 Q 0 45 0 25 Z"
          fill="url(#purpleGradient)"
          opacity="0.8"
        />
        <path
          d="M 12 20 L 18 26 L 30 14"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Decorative Geometric Elements */}
      <circle cx="1050" cy="150" r="8" fill="#FF6B35" opacity="0.4" />
      <circle cx="1080" cy="180" r="6" fill="#9D4EDD" opacity="0.3" />
      <rect x="1100" y="500" width="40" height="40" rx="8" fill="#7B2CBF" opacity="0.15" />
      <circle cx="80" cy="700" r="10" fill="#FF8F66" opacity="0.3" />
    </svg>
  );
}
