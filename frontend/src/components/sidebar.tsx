export const Sidebar = () => {
    return (
        <nav className="hidden md:flex flex-col h-full py-4 bg-surface-container-low dark:bg-surface-container-low border-r border-border-subtle dark:border-border-subtle fixed left-0 top-0 h-full w-[240px] transition-all duration-150 ease-in-out z-20">
            <div className="px-4 mb-8 max-w-[220px]">
                <img src="/logo.png" alt="logo" className="object-contain" />
            </div>
            <div className="px-4 mb-6">
                <button
                    command="show-modal"
                    commandfor="create-flag-modal"
                    className="w-full bg-primary-container text-on-primary-container py-2 px-4 rounded font-mono-label text-mono-label hover:bg-inverse-primary transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Create Flag
                </button>
            </div>
            <ul className="flex-1 px-3 space-y-1 overflow-y-auto">
                <li>
                    <a className="flex items-center gap-3 px-3 py-2 rounded text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-all duration-150 ease-in-out" href="#">
                        <span className="material-symbols-outlined text-[20px]" data-icon="dashboard">dashboard</span>
                        <span className="font-body-md text-body-md">Overview</span>
                    </a>
                </li>
            </ul>
            <div className="px-3 mt-auto pt-4 border-t border-border-subtle">
                <ul className="space-y-1">
                    <li>
                        <a className="flex items-center gap-3 px-3 py-2 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors" href="https://github.com/epic-dev/safelaunch">
                            <span className="material-symbols-outlined text-[18px]" data-icon="menu_book">menu_book</span>
                            <span className="font-body-md text-body-md">Documentation</span>
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    )
}