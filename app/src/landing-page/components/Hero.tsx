import { DocsUrl } from "../../shared/common";
import { Link } from "wasp/client/router";
import StyledButton from "./StyledButton";
import AnimatedLoader from "./AnimatedLoader";

export default function Hero() {
  return (
    <div className="relative pt-14 w-full">
      <TopGradient />
      <BottomGradient />
      <div className="py-16 sm:py-20">
        <div className="mx-auto max-w-8xl px-6 lg:px-8">
          <div className="lg:mb-18 mx-auto max-w-3xl text-center pt-12 sm:pt-4">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl dark:text-white">
              Stop wasting hours, generate standout resumes in
              <span className="italic bg-gradient-to-r from-[#d946ef] to-[#fc0] bg-clip-text text-transparent">
                {" "}
                seconds
              </span>
            </h1>
            <div className="mt-6 mx-auto max-w-2xl flex justify-center">
              <AnimatedLoader />
            </div>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <StyledButton to="/app">Get Started →</StyledButton>
            </div>
          </div>
          <div className="mt-12 flow-root sm:mt-16">
            <div className="relative max-w-7xl mx-auto px-4">
              <div className="relative h-[400px] sm:h-[480px] lg:h-[550px]">
                {/* First Screenshot - Top Layer on mobile, Bottom Layer on desktop */}
                <div className="absolute left-8 top-12 w-80 sm:w-96 lg:w-[420px] z-30 sm:z-10 group">
                  <img
                    src="/screenshot1.png"
                    alt="Profile Setup Interface"
                    className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-gray-900/10 transform -rotate-6 hover:rotate-3 hover:scale-105 transition-all duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Third Screenshot - Middle Layer (swapped position) */}
                <div className="absolute left-1/2 top-4 w-80 sm:w-96 lg:w-[420px] -translate-x-1/2 z-20 group">
                  <img
                    src="/screenshot3.png"
                    alt="Generated Resume Preview"
                    className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-gray-900/10 transform rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Second Screenshot - Bottom Layer on mobile, Top Layer on desktop */}
                <div className="absolute right-8 top-12 w-80 sm:w-96 lg:w-[420px] z-10 sm:z-30 group">
                  <img
                    src="/screenshot2.png"
                    alt="Resume Customization"
                    className="w-full h-auto rounded-xl shadow-2xl ring-1 ring-gray-900/10 transform rotate-6 hover:rotate-3 hover:scale-105 transition-all duration-300"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className="absolute top-0 right-0 -z-10 transform-gpu overflow-hidden w-full blur-3xl sm:top-0"
      aria-hidden="true"
    >
      <div
        className="aspect-[1020/880] w-[55rem] flex-none sm:right-1/4 sm:translate-x-1/2 dark:hidden bg-gradient-to-tr from-amber-400 to-purple-300 opacity-40"
        style={{
          clipPath:
            "polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)",
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className="absolute inset-x-0 top-[calc(100%-40rem)] sm:top-[calc(100%-65rem)] -z-10 transform-gpu overflow-hidden blur-3xl"
      aria-hidden="true"
    >
      <div
        className="relative aspect-[1020/880] sm:-left-3/4 sm:translate-x-1/4 dark:hidden bg-gradient-to-br from-amber-400 to-purple-300  opacity-50 w-[72.1875rem]"
        style={{
          clipPath: "ellipse(80% 30% at 80% 50%)",
        }}
      />
    </div>
  );
}
