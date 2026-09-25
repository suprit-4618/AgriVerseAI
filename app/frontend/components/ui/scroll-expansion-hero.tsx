import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from "react";
import { motion } from "framer-motion";

export interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

export const ScrollExpandMedia: React.FC<ScrollExpandMediaProps> = ({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand = "Scroll down to explore",
  textBlend = false,
  children,
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: globalThis.WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      if (e.touches.length > 0) {
        setTouchStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!touchStartY || e.touches.length === 0) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 320 + scrollProgress * (isMobileState ? 650 : 1300);
  const mediaHeight = 420 + scrollProgress * (isMobileState ? 240 : 420);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  return (
    <div
      ref={sectionRef}
      className="transition-colors duration-700 ease-in-out overflow-x-hidden bg-black text-white"
    >
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          {/* Background Landscape Image */}
          <motion.div
            className="absolute inset-0 z-0 h-full w-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.15 }}
          >
            <img
              src={bgImageSrc}
              alt="Agricultural Landscape"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Crisp monochrome contrast scrim */}
            <div className="absolute inset-0 bg-black/60" />
          </motion.div>

          {/* Central Expanding Frame */}
          <div className="w-full flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              <div
                className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl overflow-hidden border border-white/20 bg-neutral-950"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "96vw",
                  maxHeight: "88vh",
                  boxShadow: "0px 25px 60px rgba(0, 0, 0, 0.85)",
                }}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="relative w-full h-full pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes("embed")
                            ? mediaSrc +
                              (mediaSrc.includes("?") ? "&" : "?") +
                              "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                            : mediaSrc.replace("watch?v=", "embed/") +
                              "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                              mediaSrc.split("v=")[1]
                        }
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                      <motion.div
                        className="absolute inset-0 bg-black/30"
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 0.4 - scrollProgress * 0.4 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full pointer-events-none">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <motion.div
                        className="absolute inset-0 bg-black/30"
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 0.4 - scrollProgress * 0.4 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={mediaSrc}
                      alt={title || "Crop Close-up"}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/20"
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 0.2 - scrollProgress * 0.2 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                {/* Subtitle & Scroll CTA */}
                <div className="flex flex-col items-center text-center relative z-10 -mt-20 px-4 transition-none">
                  {date && (
                    <p
                      className="text-xs uppercase tracking-[0.3em] font-semibold text-neutral-300 mb-1"
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="text-sm font-medium text-white/90 tracking-wide bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-md"
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              {/* Title Section with High Contrast Clean Typography */}
              <div
                className={`flex items-center justify-center text-center gap-2 w-full relative z-10 transition-none flex-col ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white transition-none drop-shadow-2xl"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h1>
                <motion.h2
                  className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wide text-neutral-200 transition-none drop-shadow-2xl"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            {/* Revealed Post-Scroll Content Section */}
            <motion.section
              className="flex flex-col w-full max-w-7xl px-6 py-12 md:px-12 lg:py-20 relative z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
