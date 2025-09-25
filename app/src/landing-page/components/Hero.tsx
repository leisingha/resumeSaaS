import { DocsUrl } from "../../shared/common";
import { Link } from "wasp/client/router";
import StyledButton from "./StyledButton";
import AnimatedLoader from "./AnimatedLoader";

export default function Hero() {
  return (
    <div className="relative pt-14 w-full">
      <TopGradient />
      <BottomGradient />
      <PinkPurpleGradient />
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

          {/* Screenshots Section */}
          <div className="mt-16 sm:mt-20 relative mx-auto max-w-none px-6 lg:px-8">
            {/* Mobile Layout - Vertical Stack */}
            <div className="flex flex-col gap-8 sm:hidden">
              <div>
                <img
                  src="/screenshot3.png"
                  alt="Resume Builder Interface"
                  className="w-full rounded-xl scale-125"
                />
              </div>
              <div>
                <img
                  src="/screenshot2.png"
                  alt="Generated Resume Preview"
                  className="w-full rounded-xl scale-125"
                />
              </div>
            </div>

            {/* Desktop Layout - Overlapping */}
            <div className="relative hidden sm:flex justify-center">
              {/* Screenshot 1 */}
              <div className="relative z-10 w-full">
                <img
                  src="/screenshot1.png"
                  alt="Resume Builder Interface"
                  className="w-full rounded-xl"
                />
              </div>

              {/* Screenshot 2 */}
              <div className="relative z-20 w-full scale-125 -ml-96">
                <img
                  src="/screenshot2.png"
                  alt="Generated Resume Preview"
                  className="w-full rounded-xl"
                />
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

function PinkPurpleGradient() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
    >
      <div
        style={{
          clipPath:
            'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
        }}
        className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
      />
    </div>
  );
}
