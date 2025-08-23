import EYLogo from "../logos/EYLogo";
import GitHubLogo from "../logos/GitHubLogo";
import LinkedInLogo from "../logos/LinkedInLogo";
import SpotifyLogo from "../logos/SpotifyLogo";
import TDBankLogo from "../logos/TDBankLogo";

export default function Clients() {
  return (
    <div className='mt-12 mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-between gap-y-6'>
      <div className='flex items-center justify-center gap-8 mb-6'>
        <h2 className='text-center text-xl tracking-wide text-gray-500 dark:text-white'>
          Used by employees at
        </h2>
      </div>

      <div className='mx-auto grid max-w-lg grid-cols-2 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:grid-cols-3 md:grid-cols-5 sm:gap-x-10 sm:gap-y-14 lg:mx-0 lg:max-w-none'>
        {
          [<EYLogo />, <GitHubLogo />, <LinkedInLogo />, <SpotifyLogo />, <TDBankLogo />].map((logo, index) => (
            <div key={index} className='flex justify-center col-span-1 h-auto w-full object-contain dark:opacity-80'>
              {logo}
            </div>
          ))
        }
      </div>
    </div>
  )
}
