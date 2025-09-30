// Arquivo: AvatarPortal.js

import React, { useCallback, useMemo } from 'react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import './AvatarPortal.css';

function AvatarPortal({ imageUrl, altText }) {
  const options = useMemo(
    () => ({
      fullScreen: {
        enable: false,
        zIndex: 1
      },
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      particles: {
        number: {
          value: 0,
        },
        color: {
          value: ["#ffc34d", "#ff6a00", "#DAA520", "#ffffff"],
        },
        shape: {
          type: "circle",
        },
        opacity: {
          value: { min: 0.6, max: 1 },
          animation: {
            enable: true,
            speed: 1,
            startValue: "max",
            destroy: "min",
          },
        },
        // MUDANÇA DRASTICA AQUI: Partículas maiores e mais visíveis 👇
        size: {
          value: { min: 2, max: 5 },
        },
        move: {
          enable: true,
          speed: 4, // Muito mais rápido para criar o efeito de "giro"
          direction: "outside",
          outModes: {
            default: "destroy",
          },
          trail: {
            enable: true,
            length: 8, // Rastro longo e visível
            fill: { color: "#111111" } // Um fundo escuro para o rastro dar contraste
          }
        },
      },
      detectRetina: true,
      emitters: {
        position: {
          x: 50,
          y: 50,
        },
        rate: {
          quantity: 15, // MUITO MAIS PARTÍCULAS
          delay: 0.03,
        },
        size: {
          width: 90, // Emissão a partir da borda exata
          height: 90,
        },
        shape: "circle",
      },
    }),
    [],
  );

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="portal-container">
      <Particles className="particles-canvas" init={particlesInit} options={options} />
      <img src={imageUrl} alt={altText} className="portal-avatar-img" />
    </div>
  );
}

export default AvatarPortal;