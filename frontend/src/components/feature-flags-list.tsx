import { Suspense, use, useState, useTransition } from "react";
import type { FeatureFlag } from "../types/feature-flag";
import { GetList } from "../consts/api-endpoints";
import { FeatureFlagItem } from "./feature-flag-item";
import { NoFeatureFlags } from "./no-feature-flags";
import { AsyncPagination } from "./async-pagination";
import { ErrorBoundary } from "./error-boundary";
import { CreateFlagModal } from "./create-flag-modal";
import { DeleteFlagModal } from "./delete-flag-modal";
import { LoadingDots } from "./loading-dots";

async function fetchPageData(currentPage: number, itemsPerPage: number): Promise<FeatureFlagsResponse> {
  const response = await fetch(`${GetList}?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`);
  if (!response.ok) throw new Error('Failed to fetch feature flags :(')
  return response.json()
}

interface FeatureFlagsResponse {
  featureFlags: FeatureFlag[];
  total: number;
}

export const FeatureFlagsList = () => {
  const [isPending, setTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // NOTE: render-base side effect. In DEV it's called twice.
  const [dataPromise, setDataPromise] = useState(() => fetchPageData(currentPage, itemsPerPage));

  const [flagIdToDelete, setFlagIdToDelete] = useState<number | null>(null)

  const errorFallback = (error: Error, reset: () => void) => {
    return <div className="bg-panel-bg p-12 flex flex-col items-center justify-center text-center">
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-8">{error.message}</p>
      <button
        onClick={() => {
          reset();
          setDataPromise(fetchPageData(currentPage, itemsPerPage));
        }}
        className="bg-primary-container text-on-primary-container py-2.5 px-6 rounded font-mono-label text-mono-label hover:bg-inverse-primary transition-colors"
      >
        Retry
      </button>
    </div>
  }

  const refetchList = () => {
    setTransition(() => {
      setDataPromise(fetchPageData(currentPage, itemsPerPage))
    })
  }

  const handlePageChange = (page: number) => {
    setTransition(() => {
      setCurrentPage(page)
      setDataPromise(fetchPageData(page, itemsPerPage))
    })
  }
  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setTransition(() => {
      setItemsPerPage(itemsPerPage)
      setDataPromise(fetchPageData(1, itemsPerPage))
    })
  }

  return (
    <>
      <div className="bg-panel-bg border border-border-subtle rounded-lg overflow-hidden shadow-none flex flex-col">
        <div className="sticky top-0 grid grid-cols-[2fr_1fr_auto] pl-4 py-3 pr-[84px] bg-surface-container-low border-b border-border-subtle">
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Flag Name</div>
          <div className="hidden sm:block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Created</div>
          <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Status</div>
        </div>

        <ErrorBoundary fallback={errorFallback}>
          <div className="h-full relative">
            <Suspense fallback={<LoadingDots />}>
              <ItemList dataPromise={dataPromise} onDelete={setFlagIdToDelete} />
              <div className="sticky bottom-0">
                <AsyncPagination
                  dataPromise={dataPromise}
                  currentPage={currentPage}
                  pageSize={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </Suspense>
            {
              isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-panel-bg/50 cursor-wait">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-outline-variant">progress_activity</span>
                </div>
              )
            }
          </div>
        </ErrorBoundary>
      </div>
      <CreateFlagModal onCreated={refetchList} />
      <DeleteFlagModal
        flagId={flagIdToDelete}
        onDeleted={refetchList}
      />
    </>
  );
};

const ItemList = ({ dataPromise, onDelete }: { dataPromise: Promise<{ featureFlags: FeatureFlag[] }>; onDelete: (id: number) => void }) => {
  const data = use(dataPromise);

  if (data.featureFlags.length === 0) {
    return <NoFeatureFlags />
  }

  return (
    <ul className="flex flex-col divide-y divide-border-subtle overflow-y-scroll h-full bg-surface-container-low">
      {data.featureFlags.map((flag) => (
        <FeatureFlagItem key={flag.id} flag={flag} onDelete={onDelete} />
      ))}
    </ul>
  )
}