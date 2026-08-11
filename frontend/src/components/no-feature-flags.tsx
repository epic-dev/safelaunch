export const NoFeatureFlags = () => {
    return (
        <div className="h-full bg-panel-bg p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-outline-variant">search_off</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No flags found</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-8">Adjust your filters or create a new feature flag to get started.</p>
            <button className="bg-primary-container text-on-primary-container py-2.5 px-6 rounded font-mono-label text-mono-label hover:bg-inverse-primary transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Create Flag
            </button>
        </div>
    )
}