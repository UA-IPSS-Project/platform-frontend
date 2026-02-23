import { useEffect, useState } from 'react';

interface AbstractBackgroundProps {
  isDarkMode?: boolean;
}

export default function AbstractBackground({ isDarkMode = false }: AbstractBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-500">
      {/* Fundo Base - Dark mode com roxo médio/escuro em vez de preto */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        // Force explicit backgrounds for both modes to avoid CSS variable or cascade conflicts
        style={isDarkMode ? { background: 'rgb(31, 35, 62)' } : { background: 'rgb(250, 246, 255)' }}
      />
      
      {/* Animated SVG waves */}
      <svg
        className={`absolute w-full h-full transition-opacity duration-500 ${
          isDarkMode ? 'opacity-40' : 'opacity-90'
        }`}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Light mode gradients - cores mais visíveis */}
          {!isDarkMode && (
            <>
              <linearGradient id="wave1-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#e9d5ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fce7f3" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="wave2-light" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#f5d0fe" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#fae8ff" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="wave3-light" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fce7f3" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.45" />
              </linearGradient>
            </>
          )}
          
          {
          }
          {isDarkMode && (
            <>
              {/* Onda 1: Azul/Roxo Profundo (Base para combinar com o fundo) */}
              <linearGradient id="wave1-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#100f3eff" stopOpacity="0.3" /> {/* Indigo-900 */}
                <stop offset="50%" stopColor="#4c1d95" stopOpacity="0.3" /> {/* Violet-900 */}
                <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.3" /> {/* Violet-800 */}
              </linearGradient>

              {/* Onda 2: O Toque de ROSA (Magenta Escuro) */}
              <linearGradient id="wave2-dark" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#001affff" stopOpacity="0.3" /> {/* Pink-900 */}
                <stop offset="50%" stopColor="#be185d" stopOpacity="0.25" /> {/* Pink-700 */}
                <stop offset="100%" stopColor="#9d174d" stopOpacity="0.3" /> {/* Pink-800 */}
              </linearGradient>

              {/* Onda 3: Roxo intermédio para ligar os dois */}
              <linearGradient id="wave3-dark" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff00ddff" stopOpacity="0.25" /> {/* Violet-700 */}
                <stop offset="100%" stopColor="#701a75" stopOpacity="0.25" /> {/* Fuchsia-900 */}
              </linearGradient>
            </>
          )}
        </defs>
        
        {/* First wave */}
        <path
          d="M0,300 Q360,150 720,300 T1440,300 L1440,900 L0,900 Z"
          fill={isDarkMode ? "url(#wave1-dark)" : "url(#wave1-light)"}
          className="transition-all duration-500"
        >
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="
              M0,300 Q360,150 720,300 T1440,300 L1440,900 L0,900 Z;
              M0,350 Q360,200 720,250 T1440,350 L1440,900 L0,900 Z;
              M0,300 Q360,150 720,300 T1440,300 L1440,900 L0,900 Z
            "
          />
        </path>
        
        {/* Second wave */}
        <path
          d="M0,400 Q360,550 720,400 T1440,400 L1440,900 L0,900 Z"
          fill={isDarkMode ? "url(#wave2-dark)" : "url(#wave2-light)"}
          className="transition-all duration-500"
        >
          <animate
            attributeName="d"
            dur="15s"
            repeatCount="indefinite"
            values="
              M0,400 Q360,550 720,400 T1440,400 L1440,900 L0,900 Z;
              M0,450 Q360,300 720,450 T1440,450 L1440,900 L0,900 Z;
              M0,400 Q360,550 720,400 T1440,400 L1440,900 L0,900 Z
            "
          />
        </path>
        
        {/* Third wave */}
        <path
          d="M0,500 Q360,650 720,500 T1440,500 L1440,900 L0,900 Z"
          fill={isDarkMode ? "url(#wave3-dark)" : "url(#wave3-light)"}
          className="transition-all duration-500"
        >
          <animate
            attributeName="d"
            dur="18s"
            repeatCount="indefinite"
            values="
              M0,500 Q360,650 720,500 T1440,500 L1440,900 L0,900 Z;
              M0,550 Q360,400 720,550 T1440,550 L1440,900 L0,900 Z;
              M0,500 Q360,650 720,500 T1440,500 L1440,900 L0,900 Z
            "
          />
        </path>
        
        {/* MUDANÇA 3: Bolas (Ellipses) - COMENTADAS para uso futuro
            Reduzi drasticamente a opacidade (0.25 -> 0.15 ou 0.1).
            Isto faz com que pareçam um "brilho" distante em vez de uma forma sólida.
        
        <ellipse 
          cx="200" 
          cy="200" 
          rx="300" 
          ry="200" 
          fill={isDarkMode ? "url(#wave1-dark)" : "url(#wave1-light)"} 
          opacity={isDarkMode ? "1.04" : "0.3"}
          className="transition-all duration-500"
        >
          <animate attributeName="cx" dur="25s" repeatCount="indefinite" values="200;400;200" />
          <animate attributeName="cy" dur="20s" repeatCount="indefinite" values="200;300;200" />
        </ellipse>
        
        <ellipse 
          cx="1200" 
          cy="600" 
          rx="250" 
          ry="180" 
          fill={isDarkMode ? "url(#wave2-dark)" : "url(#wave2-light)"} 
          opacity={isDarkMode ? "1.07" : "0.25"}
          className="transition-all duration-500"
        >
          <animate attributeName="cx" dur="22s" repeatCount="indefinite" values="1200;1000;1200" />
          <animate attributeName="cy" dur="18s" repeatCount="indefinite" values="600;500;600" />
        </ellipse>
        
        {isDarkMode && (
          <ellipse 
            cx="700" 
            cy="400" 
            rx="200" 
            ry="150" 
            fill="url(#wave3-dark)" 
            opacity="1.07" 
          >
            <animate attributeName="cx" dur="28s" repeatCount="indefinite" values="700;900;700" />
            <animate attributeName="cy" dur="24s" repeatCount="indefinite" values="400;300;400" />
          </ellipse>
        )}
        */}
      </svg>
    </div>
  );
}