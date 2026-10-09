import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';

export default function HeroSection({ onExplore, onLogin }) {

  // Pure live video streams without any static poster pictures
  const mediaSlides = [
    {
      type: 'video',
      src: '/assets/videos/hero-video.mp4',
      label: 'Live Industrial Operations'
    },
    {
      type: 'video',
      src: '/assets/videos/safety-analysis-video.mp4',
      label: 'Cinematic Safety Intelligence'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef([]);

  // Immediately play all videos on mount so GPU decodes them with zero delay
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.play().catch(() => { });
      }
    });
  }, []);

  // Smooth auto-cycle between the live video streams
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(
        (prev) => (prev + 1) % mediaSlides.length
      );
    }, 4500);

    return () => clearInterval(timer);
  }, [mediaSlides.length]);

  // Scroll to a section
  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      const offset = 80;

      const bodyRect =
        document.body.getBoundingClientRect().top;

      const elementRect =
        element.getBoundingClientRect().top;

      const elementPosition =
        elementRect - bodyRect;

      const offsetPosition =
        elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-between pt-32 pb-10 overflow-hidden select-none"
    >

      {/* Background Media Container */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#070709]">

        {mediaSlides.map((slide, idx) => {

          const isActive = idx === currentIndex;

          return (
            <div
              key={idx}
              className={`
                absolute
                inset-0
                w-full
                h-full
                transition-opacity
                duration-700
                ease-in-out
                will-change-[opacity]
                ${isActive
                  ? 'opacity-100 z-10'
                  : 'opacity-0 z-0 pointer-events-none'
                }
              `}
              style={{
                transform: 'translateZ(0)'
              }}
            >

              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={slide.src}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedData={(e) =>
                  e.target.play().catch(() => { })
                }
                onCanPlay={(e) =>
                  e.target.play().catch(() => { })
                }
                className="w-full h-full object-cover"
              />

            </div>
          );
        })}

        {/* Subtle Top & Bottom Gradient */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-[#070709]/80
            via-transparent
            to-[#070709]
            z-20
            pointer-events-none
          "
        />

      </div>


      {/* Main Front Page Content */}
      <div
        className="
          relative
          z-30
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          w-full
          my-auto
          pt-6
        "
      >

        <div className="max-w-3xl space-y-6 text-left">

          {/* Big Bold Headline */}
          <h1
            className="
              text-4xl
              sm:text-6xl
              md:text-7xl
              font-bold
              tracking-tight
              text-white
              leading-[1.08]
              font-heading
              drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]
            "
          >
            Where Every Safety Report Builds a Zero-Incident Tomorrow
          </h1>


          {/* Description */}
          <p
            className="
              text-base
              sm:text-lg
              text-slate-100
              max-w-2xl
              font-medium
              leading-relaxed
              drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]
            "
          >
            Transform Unsafe Acts, Unsafe Conditions and
            Near-Miss Reports into actionable safety intelligence
            using AI and NLP.
          </p>


          {/* Explore It Button */}
          {/* NOW SCROLLS TO ABOUT SECTION */}

          <div className="pt-2 flex flex-wrap items-center gap-4">

            <button
              onClick={() => scrollToSection('about')}
              className="
                inline-flex
                items-center
                gap-3
                px-8
                py-4
                rounded-xl
                bg-gradient-to-r
                from-amber-500
                to-yellow-600
                hover:from-amber-400
                hover:to-yellow-500
                text-slate-950
                font-extrabold
                text-base
                shadow-2xl
                shadow-amber-500/30
                hover:shadow-amber-500/50
                hover:scale-105
                active:scale-95
                transition-all
                duration-200
                cursor-pointer
                font-heading
                tracking-wide
              "
            >
              <span>
                Explore It
              </span>
              <ArrowRight
                className="w-5 h-5 stroke-[2.5]"
              />
            </button>

            <button
              onClick={() => {
                window.history.pushState({}, '', '/field-app');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="
                inline-flex
                items-center
                gap-2.5
                px-6
                py-4
                rounded-xl
                bg-[#0d1527]/90
                hover:bg-[#152038]
                border-2
                border-amber-500/40
                hover:border-amber-400
                text-amber-300
                font-extrabold
                text-sm
                shadow-xl
                shadow-amber-500/10
                hover:scale-105
                active:scale-95
                transition-all
                duration-200
                cursor-pointer
              "
            >
              <Smartphone className="w-5 h-5 text-amber-400" />
              <span>Worker Field App (SOS &amp; Log)</span>
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}