import './App.css'
import { CreateFlagModal } from './components/create-flag-modal';
import { DeleteFlagModal } from './components/delete-flag-modal';
import { FeatureFlagsList } from './components/feature-flags-list';
import { PageHeader } from './components/page-header';
import { Sidebar } from './components/sidebar';
// import { TopNavBar } from './components/top-navbar';

function App() {
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[240px] h-screen bg-background relative overflow-hidden">
        {/* <TopNavBar /> */}
        <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop bg-surface-dim">
          <div className="grid grid-rows-[auto_1fr] h-full max-w-5xl mx-auto">
            <PageHeader />
            <FeatureFlagsList />
          </div>
        </main>
        {/* <div className="ticks"></div>
        <section id="spacer"></section> */}
      </div>
    </>
  )
}

export default App
