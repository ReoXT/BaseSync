const ANNOUNCEMENT_URL = "https://github.com/wasp-lang/wasp";
export function Announcement() {
    return (<div className="from-cyan-500 to-blue-500 text-white relative flex w-full items-center justify-center gap-3 bg-gradient-to-r p-3 text-center font-semibold">
      <a href={ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" className="hidden cursor-pointer transition-opacity hover:opacity-90 hover:drop-shadow lg:block">
        Support Open-Source Software!
      </a>
      <div className="bg-white/20 hidden w-0.5 self-stretch lg:block"></div>
      <a href={ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 hidden cursor-pointer rounded-full px-2.5 py-1 text-xs tracking-wider transition-colors lg:block">
        Star Our Repo on Github ⭐️ →
      </a>
      <a href={ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 cursor-pointer rounded-full px-2.5 py-1 text-xs transition-colors lg:hidden">
        ⭐️ Star the Our Repo and Support Open-Source! ⭐️
      </a>
    </div>);
}
//# sourceMappingURL=Announcement.jsx.map