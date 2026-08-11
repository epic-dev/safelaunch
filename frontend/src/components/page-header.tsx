export const PageHeader = () => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface m-0">Feature Flags</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and toggle features across environments.</p>
            </div>
            {/* <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-panel-bg border border-border-subtle rounded px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="font-mono-label text-mono-label text-on-surface text-sm">Production</span>
                    <span className="material-symbols-outlined text-[16px] text-outline-variant ml-1 cursor-pointer">expand_more</span>
                </div>
                <button className="border border-border-subtle bg-panel-bg hover:bg-surface-container-high text-on-surface px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    <span className="font-mono-label text-mono-label text-sm">Filter</span>
                </button>
            </div> */}
        </div>
    )
}