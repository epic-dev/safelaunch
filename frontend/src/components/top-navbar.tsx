export const TopNavBar = () => {
    return (
        <header className="flex justify-between items-center w-full px-margin-desktop h-14 bg-surface dark:bg-surface border-b border-border-subtle dark:border-border-subtle w-full top-0 z-10 shrink-0">
            <div className="flex items-center flex-1">
                <div className="md:hidden font-headline-md text-headline-md font-bold text-primary dark:text-primary mr-4">
                    FeatureControl
                </div>
                <div className="relative w-64 hidden sm:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
                    <input className="w-full bg-surface-container-low border border-border-subtle rounded pl-9 pr-3 py-1.5 text-sm focus:border-primary-container focus:ring-0 text-on-surface placeholder:text-on-surface-variant font-mono-label transition-colors" placeholder="Search flags..." type="text" />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
                    <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
                </button>
                <button className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
                    <span className="material-symbols-outlined" data-icon="settings">settings</span>
                </button>
                <button className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
                    <span className="material-symbols-outlined" data-icon="help">help</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-surface-container-high border border-border-subtle overflow-hidden ml-2 cursor-pointer">
                    <img alt="User avatar" className="w-full h-full object-cover" data-alt="A small, professional user avatar portrait of an engineer in a dark tech environment, facing forward, sharp focus, cyberpunk undertones, subtle blue rim lighting, 8k resolution, photorealistic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCU0lXZCrANzQk9l4jxBHHEOa8VUBZCESSKB54_m-6SI211LmNbYWhWxs5-myq4byZPEJfCzXOTeahatLA-f7kN-WMafaG9e9N6_GFjMv-3mvbeV_Ay8LFbqWscGYXv4NbPkYcHaus46bDrhgs4mleHl_d4ipJN_WKzPvRzFcDi7Iq7nf-0hk5CtrKEoITuTjeyK__uJTyZzaU3bMAqPdo3xqfUpgZok6NhzboLkmgxmj9TEJp073Np" />
                </div>
            </div>
        </header>
    )
}