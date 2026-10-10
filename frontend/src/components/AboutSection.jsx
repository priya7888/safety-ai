import React, { useEffect, useState } from 'react';

import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.jpg';
import image4 from '../assets/image4.jpg';
import image5 from '../assets/image5.jpg';
import image6 from '../assets/image6.jpg';

import { CheckCircle2, Flame, ArrowRight } from 'lucide-react';

export default function AboutSection({ onExplore }) {
  const images = [
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
  ];

  const [imageOrder, setImageOrder] = useState(
    images.map((_, index) => index)
  );

  const [isMoving, setIsMoving] = useState(false);

  // Move front image to the back
  const nextImage = () => {
    if (isMoving) return;

    setIsMoving(true);

    // Wait for the movement animation to finish
    setTimeout(() => {
      setImageOrder((prev) => {
        const newOrder = [...prev];
        const firstImage = newOrder.shift();

        if (firstImage !== undefined) {
          newOrder.push(firstImage);
        }

        return newOrder;
      });

      setIsMoving(false);
    }, 700);
  };

  // Automatically move image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, [isMoving]);

  return (
    <section
      id="about"
      className="relative py-24 md:py-32 bg-slate-50 text-slate-900 overflow-hidden"
    >
      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-center">

          {/* ================= LEFT SIDE - IMAGE STACK ================= */}
          <div className="lg:col-span-6 lg:pr-14">

            <div
              className="
                relative
                mx-auto
                h-[430px]
                w-full
                max-w-md
                sm:h-[480px]
                lg:max-w-none
              "
            >

              {/* ================= STACKED IMAGES ================= */}
              {imageOrder.map((imageIndex, stackIndex) => {

                const isFront = stackIndex === 0;

                return (
                  <div
                    key={imageIndex}
                    onClick={isFront ? nextImage : undefined}
                    className={`
                      absolute
                      inset-0
                      overflow-hidden
                      rounded-3xl
                      border
                      border-slate-200
                      bg-white
                      shadow-2xl
                      transition-all
                      duration-700
                      ease-in-out
                      ${isFront ? 'cursor-pointer' : ''}
                    `}
                    style={{
                      zIndex: images.length - stackIndex,
                      transform:
                        stackIndex === 0
                          ? isMoving
                            ? `
                              translateX(-110%)
                              rotate(-8deg)
                              scale(0.92)
                            `
                            : `
                              translateX(0)
                              rotate(0deg)
                              scale(1)
                            `
                          : `
                            translateX(-${stackIndex * 12}px)
                            translateY(${stackIndex * 12}px)
                            rotate(-${stackIndex * 2}deg)
                            scale(${1 - stackIndex * 0.035})
                          `,
                      opacity:
                        stackIndex > 3
                          ? 0
                          : 1 - stackIndex * 0.12,
                    }}
                  >

                    <img
                      src={images[imageIndex]}
                      alt={`Industrial safety image ${imageIndex + 1}`}
                      className="
                        h-full
                        w-full
                        object-cover
                        select-none
                        pointer-events-none
                      "
                    />

                    {/* Gradient overlay */}
                    <div
                      className="
                        pointer-events-none
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/50
                        via-transparent
                        to-transparent
                      "
                    />

                    {/* Front image content badge & action */}
                    {isFront && (
                      <div
                        className="
                          absolute
                          bottom-5
                          left-5
                          right-5
                          flex
                          items-center
                          justify-between
                        "
                      >
                        <div
                          className="
                            rounded-xl
                            bg-black/60
                            px-4
                            py-2
                            backdrop-blur-md
                          "
                        >
                          <p
                            className="
                              text-xs
                              font-semibold
                              uppercase
                              tracking-widest
                              text-amber-300
                            "
                          >
                            About SafetyAI
                          </p>
                          <p
                            className="
                              mt-1
                              text-sm
                              font-semibold
                              text-white
                            "
                          >
                            Precursor Intelligence
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-full
                            bg-amber-400
                            text-slate-950
                            shadow-lg
                            transition-transform
                            duration-300
                            hover:scale-110
                          "
                          aria-label="Show next safety image"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          </div>

          {/* ================= RIGHT SIDE - CONTENT ================= */}
          <div className="lg:col-span-6 lg:pl-14 space-y-6 text-left">

            {/* Section Label */}
            <div
              className="
                inline-flex
                items-center
                gap-2.5
                px-5
                py-2.5
                rounded-xl
                bg-amber-100
                border-2
                border-amber-400
                text-amber-950
                text-sm
                font-black
                uppercase
                tracking-wider
                shadow-sm
              "
            >
              <Flame
                className="w-5 h-5 fill-amber-500 text-amber-500"
              />

              <span>About SafetyAI</span>
            </div>

            {/* Heading */}
            <h3
              className="
                text-3xl
                sm:text-4xl
                md:text-5xl
                font-bold
                text-slate-900
                font-heading
                leading-tight
                tracking-tight
              "
            >
              AI-Powered Industrial Safety Intelligence
            </h3>

            {/* Description */}
            <p
              className="
                text-base
                sm:text-lg
                text-slate-600
                leading-relaxed
                font-normal
              "
            >
              <strong className="text-slate-900 font-semibold">
                Safety AI
              </strong>{' '}
              is an AI-powered industrial Safety Intelligence Platform designed to identify potential Serious Injury and Fatality (SIF) precursors from unsafe-act, unsafe-condition, and near-miss reports. It enables workers to submit reports through voice or text in supported languages, translates and validates the report in English, and processes it using Natural Language Processing, machine learning, and safety rules. Its key innovation is weak-signal correlation, which identifies combinations of warning signs that may indicate more serious hazards. The platform provides explainable risk assessments, prioritizes reports for human review, and helps safety teams identify recurring patterns and take preventive action earlier.
            </p>

            {/* ================= CONTINUOUS ANALYSIS ================= */}
            <div className="space-y-2.5 pt-1">

              <div
                className="
                  text-xs
                  font-mono
                  font-bold
                  tracking-wider
                  text-amber-600
                  uppercase
                "
              >
                Continuous Analysis of:
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-3
                  gap-2.5
                "
              >

                {/* Unsafe Acts */}
                <div
                  className="
                    flex
                    items-center
                    gap-2.5
                    p-3
                    rounded-xl
                    bg-white
                    border
                    border-slate-200
                    shadow-sm
                  "
                >
                  <CheckCircle2
                    className="w-4 h-4 text-amber-500 shrink-0"
                  />

                  <span className="text-xs font-bold text-slate-800">
                    Unsafe Acts
                  </span>
                </div>

                {/* Unsafe Conditions */}
                <div
                  className="
                    flex
                    items-center
                    gap-2.5
                    p-3
                    rounded-xl
                    bg-white
                    border
                    border-slate-200
                    shadow-sm
                  "
                >
                  <CheckCircle2
                    className="w-4 h-4 text-amber-500 shrink-0"
                  />

                  <span className="text-xs font-bold text-slate-800">
                    Unsafe Conditions
                  </span>
                </div>

                {/* Near-Miss Reports */}
                <div
                  className="
                    flex
                    items-center
                    gap-2.5
                    p-3
                    rounded-xl
                    bg-white
                    border
                    border-slate-200
                    shadow-sm
                  "
                >
                  <CheckCircle2
                    className="w-4 h-4 text-amber-500 shrink-0"
                  />

                  <span className="text-xs font-bold text-slate-800">
                    Near-Miss Reports
                  </span>
                </div>

              </div>
            </div>

            {/* ================= KEY FEATURES ================= */}
            <div className="space-y-2 pt-2">

              {/* Feature 1 */}
              <div className="flex items-start gap-2.5">

                <div
                  className="
                    mt-0.5
                    p-1
                    rounded-full
                    bg-amber-100
                    text-amber-600
                    shrink-0
                  "
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                <span className="text-sm font-semibold text-slate-700">
                  Isolates the 20–25% genuine SIF precursors from everyday
                  minor report noise
                </span>

              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-2.5">

                <div
                  className="
                    mt-0.5
                    p-1
                    rounded-full
                    bg-amber-100
                    text-amber-600
                    shrink-0
                  "
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                <span className="text-sm font-semibold text-slate-700">
                  Detects weak signals and barrier failures before high-energy
                  releases occur
                </span>

              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}