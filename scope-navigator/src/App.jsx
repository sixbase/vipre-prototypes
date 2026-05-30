import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Zap, Menu, X } from 'lucide-react';
import { ScopeProvider, useScope } from './ScopeContext';
import ScopeNavigator from './ScopeNavigator';
import EntityList from './EntityList';
import EntityDetail from './EntityDetail';
import CommandPalette from './CommandPalette';
import DevicesPage from './DevicesPage';
import DevicesPageB from './DevicesPageB';
import DashboardPage from './DashboardPage';
import PoliciesPage from './PoliciesPage';
import CustomerManagementPageB from './CustomerManagementPageB';
import CustomerManagementPageC from './CustomerManagementPageC';
import ScopeSummaryStrip from './ScopeSummaryStrip';
import { mockData } from './data';
import { ProvisioningModal, SuccessToast } from './ProvisioningModal';

function NavSection({ label, children }) {
  return (
    <div>
      <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
        active
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
      }`}
    >
      {label}
    </button>
  );
}

function AppContent() {
  const { path, currentEntity, currentLevel, childEntities, teleportedSegments, navigate, drillDown, teleport } = useScope();

  const [dark, setDark] = useState(false);
  const [showFuture, setShowFuture] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [activePage, setActivePage] = useState('Customer Management B');
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false); // mobile off-canvas sidebar
  const [provisioningModal, setProvisioningModal] = useState(null); // { type, contextEntity }
  const [toast, setToast] = useState(null); // string message

  function openModal(type, contextEntity = null, availableTypes = null) {
    setProvisioningModal({ type, contextEntity, availableTypes });
  }
  function closeModal() { setProvisioningModal(null); }
  function showToast(message) {
    setToast(message);
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Close the mobile nav whenever a page is selected.
  useEffect(() => { setNavOpen(false); }, [activePage]);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSelect = useCallback((entityPath) => {
    navigate(entityPath);
    const entities = entityPath.at(-1)?.children ?? mockData;
    setSelectedEntity(entities?.[0] ?? null);
  }, [navigate]);

  useEffect(() => {
    if (!selectedEntity && childEntities?.length) {
      setSelectedEntity(childEntities[0]);
    }
  }, [childEntities, selectedEntity]);

  function handleDrillDown(entity) {
    drillDown(entity);
    setSelectedEntity(entity.children?.[0] ?? null);
  }

  function handleNavigate(newPath) {
    navigate(newPath);
    const entities = newPath.at(-1)?.children ?? mockData;
    setSelectedEntity(entities?.[0] ?? null);
  }

  function handleTeleport(entity, fullPath) {
    teleport(entity, fullPath);
    setSelectedEntity(entity.children?.[0] ?? null);
  }

  return (
    <div className="h-screen overflow-hidden bg-[#e5e5e5] dark:bg-[#1a1a1a] font-sans transition-colors duration-150 flex flex-col">
      {/* Breadcrumb — edge to edge, above everything */}
      <div className="w-full">
        <ScopeNavigator path={path} onNavigate={handleNavigate} onSearchOpen={() => setSearchOpen(true)} teleportedSegments={teleportedSegments} showFuture={showFuture} onToggleFuture={() => setShowFuture(f => !f)} />
      </div>

      {/* Command palette search overlay */}
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />

      <div className="flex-1 flex min-h-0">
      {/* Mobile nav backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Left Nav — static on desktop, off-canvas drawer on mobile */}
      <nav className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-56 lg:translate-x-0 lg:transition-none ${navOpen ? 'translate-x-0' : '-translate-x-full'} shrink-0 bg-[#e5e5e5] dark:bg-[#1a1a1a] border-r border-zinc-200 dark:border-zinc-700 flex flex-col overflow-y-auto`}>
        {/* Vipre Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <svg width="90" height="16" viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-800 dark:text-white">
            <path d="M12.4474 10.6562C13.149 9.44293 14.283 9.44293 14.9845 10.6562L26.6408 30.8076C27.3424 32.0209 27.3424 34.0259 26.6408 35.2393L24.4826 39.0898C23.781 40.3031 22.648 40.3031 21.9465 39.0898L10.2892 18.9385C9.58766 17.7252 9.58766 15.7202 10.2892 14.4541L12.4474 10.6562Z" fill="currentColor"/>
            <path d="M45.4758 0C46.9329 0 47.4723 1.0025 46.7707 2.21582L34.5744 22.209C33.8189 23.4222 32.0383 24.4246 30.5812 24.4248H26.1017C24.6447 24.4248 24.1044 23.4222 24.8058 22.209L37.0031 2.21582C37.7586 1.00258 39.5392 0.000127689 40.9963 0H45.4758Z" fill="currentColor"/>
            <path d="M25.2638 0.0527344C26.7209 0.0529233 28.5015 1.05535 29.257 2.26855L31.5773 6.06641C32.3329 7.27973 31.7393 8.28223 30.3361 8.28223H6.64471C5.18761 8.28223 3.40711 7.2797 2.65154 6.06641L0.330252 2.26855C-0.425245 1.05531 0.168497 0.0528588 1.57146 0.0527344H25.2638Z" fill="currentColor"/>
            <path d="M106.538 31.2637H96.6086L99.7385 15.3857C100.332 12.2733 103.084 10.0577 106.322 10.0576H110.748L106.538 31.2637Z" fill="currentColor"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M139.862 10.1104C144.341 10.1104 146.878 11.429 147.957 13.2754C148.443 14.0666 148.605 14.9636 148.605 15.8604C148.605 17.0208 148.335 18.0759 147.741 19.1309C146.176 21.7685 142.56 23.7207 136.947 23.7207H123.671L122.16 31.2637H112.176L116.386 10.1104H139.862ZM124.535 19.2363V19.2891H134.411C136.246 19.289 137.542 18.7092 138.081 17.7598C138.297 17.3905 138.404 16.9679 138.404 16.4932C138.404 16.124 138.35 15.8077 138.189 15.5439C137.865 14.9637 137.055 14.5938 135.814 14.5938H125.452L124.535 19.2363Z" fill="currentColor"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M176.855 10.1104C180.902 10.1104 183.384 11.2181 184.518 13.0645C185.003 13.8557 185.166 14.6999 185.166 15.5967C185.166 16.6516 184.896 17.5486 184.41 18.3926C183.115 20.5553 180.039 21.663 175.56 21.9268L177.773 24.9863L182.467 31.2637H171.189L164.874 22.9814H160.395L158.776 31.2637H148.792L153.001 10.1104H176.855ZM161.204 19.0254H171.512C173.131 19.0254 174.264 18.4981 174.804 17.6543C175.02 17.285 175.128 16.9152 175.128 16.4404C175.128 16.0713 175.074 15.8076 174.912 15.5439C174.535 14.911 173.779 14.5938 172.646 14.5938H162.121L161.204 19.0254Z" fill="currentColor"/>
            <path d="M219.083 14.6992H199.762L199.007 18.4453H217.896L217.032 22.876H198.144L197.388 26.6221H216.708L215.791 31.2637H186.594L189.725 15.3857C190.318 12.3261 193.071 10.0576 196.309 10.0576H220L219.083 14.6992Z" fill="currentColor"/>
            <path d="M72.8088 25.1973L73.4025 26.833L74.59 25.25L74.6437 25.1445L83.8185 12.8008C85.1137 11.1127 87.1101 10.1104 89.2687 10.1104V10.0576H96.9318L80.0402 31.2109H65.6848L57.2121 10.0576H67.4123L72.8088 25.1973Z" fill="currentColor"/>
          </svg>
          <button
            onClick={() => setNavOpen(false)}
            className="lg:hidden p-1.5 -mr-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Sections */}
        <div className="flex-1 px-2 pb-4 space-y-5">
          <NavSection label="OVERVIEW">
            <NavItem label="Dashboard" active={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
            <NavItem label="Customer Management" active={activePage === 'Customer Management'} onClick={() => setActivePage('Customer Management')} />
            <NavItem label="Customer Management B" active={activePage === 'Customer Management B'} onClick={() => setActivePage('Customer Management B')} />
            <NavItem label="Customer Management C" active={activePage === 'Customer Management C'} onClick={() => setActivePage('Customer Management C')} />
          </NavSection>
          <NavSection label="ENDPOINT">
            <NavItem label="Devices" active={activePage === 'Devices'} onClick={() => setActivePage('Devices')} />
            <NavItem label="Devices B" active={activePage === 'Devices B'} onClick={() => setActivePage('Devices B')} />
            <NavItem label="Threats & Incidents" active={activePage === 'Threats & Incidents'} onClick={() => setActivePage('Threats & Incidents')} />
            <NavItem label="Policies" active={activePage === 'EP Policies'} onClick={() => setActivePage('EP Policies')} />
            <NavItem label="Configurations" active={activePage === 'EP Configurations'} onClick={() => setActivePage('EP Configurations')} />
          </NavSection>
          <NavSection label="EMAIL SECURITY">
            <NavItem label="Message Logs" active={activePage === 'Message Logs'} onClick={() => setActivePage('Message Logs')} />
            <NavItem label="Analytics" active={activePage === 'Analytics'} onClick={() => setActivePage('Analytics')} />
            <NavItem label="Allow & Deny" active={activePage === 'Allow & Deny'} onClick={() => setActivePage('Allow & Deny')} />
            <NavItem label="Policies" active={activePage === 'ES Policies'} onClick={() => setActivePage('ES Policies')} />
            <NavItem label="Service Settings" active={activePage === 'Service Settings'} onClick={() => setActivePage('Service Settings')} />
            <NavItem label="Domains" active={activePage === 'Domains'} onClick={() => setActivePage('Domains')} />
            <NavItem label="Reporting" active={activePage === 'Reporting'} onClick={() => setActivePage('Reporting')} />
          </NavSection>
        </div>

        {/* Bottom Items */}
        <div className="px-2 pb-3 border-t border-zinc-200 dark:border-zinc-700 pt-3 space-y-0.5">
          <NavItem label="Users & Roles" active={activePage === 'Users & Roles'} onClick={() => setActivePage('Users & Roles')} />
          <NavItem label="Settings" active={activePage === 'Settings'} onClick={() => setActivePage('Settings')} />
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Page header */}
        <div className="px-4 sm:px-6 py-3 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden p-1.5 -ml-1 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
            {activePage === 'Customer Management' ? 'Customer Management' : activePage.replace(/^(EP|ES|SS) /, '')}
          </h1>
        </div>

        {activePage === 'Customer Management' ? (
          <>
          <ScopeSummaryStrip />
          <main className="flex-1 min-h-0 flex overflow-hidden mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <div className="w-[40%] flex flex-col overflow-hidden">
              <EntityList
                entities={childEntities}
                onDrillDown={handleDrillDown}
                onSelect={setSelectedEntity}
                selectedEntity={selectedEntity}
                onTeleport={handleTeleport}
                scopeName={currentEntity?.name || 'All Accounts'}
                currentLevel={currentLevel}
                onAdd={(availableTypes) => {
                  if (availableTypes.length === 1) {
                    const t = availableTypes[0];
                    openModal('add' + t.charAt(0).toUpperCase() + t.slice(1));
                  } else {
                    openModal('select', null, availableTypes);
                  }
                }}
              />
            </div>
            <div className="w-[60%] flex flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
              {selectedEntity ? (
                <EntityDetail
                  entity={selectedEntity}
                  siblings={childEntities}
                  showFuture={showFuture}
                  onDrillDown={(child) => {
                    navigate([...path, selectedEntity, child]);
                    setSelectedEntity(child.children?.[0] ?? null);
                  }}
                  onAddProduct={(entity) => openModal('addProduct', entity)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">Select an entity from the list to view details</p>
                </div>
              )}
            </div>
          </main>
          </>
        ) : activePage === 'Customer Management B' ? (
          <CustomerManagementPageB openModal={openModal} showFuture={showFuture} />
        ) : activePage === 'Customer Management C' ? (
          <CustomerManagementPageC openModal={openModal} showFuture={showFuture} />
        ) : activePage === 'Devices' ? (
          <div className="flex-1 min-h-0 overflow-hidden mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <DevicesPage />
          </div>
        ) : activePage === 'Devices B' ? (
          <div className="flex-1 min-h-0 overflow-hidden mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <DevicesPageB />
          </div>
        ) : activePage === 'Dashboard' ? (
          <div className="flex-1 min-h-0 overflow-y-auto mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <DashboardPage />
          </div>
        ) : activePage === 'EP Policies' ? (
          <div className="flex-1 min-h-0 overflow-hidden mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <PoliciesPage variant="ep" />
          </div>
        ) : activePage === 'ES Policies' ? (
          <div className="flex-1 min-h-0 overflow-hidden mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <PoliciesPage variant="es" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto mx-6 mb-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-zinc-400 dark:text-zinc-500 text-sm">Placeholder</span>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Provisioning modal (Flows 1, 2, 4) */}
      {provisioningModal && (
        <ProvisioningModal
          type={provisioningModal.type}
          contextEntity={provisioningModal.contextEntity}
          availableTypes={provisioningModal.availableTypes}
          onClose={closeModal}
          onSuccess={showToast}
        />
      )}

      {/* Success toast */}
      {toast && <SuccessToast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function App() {
  return (
    <ScopeProvider>
      <AppContent />
    </ScopeProvider>
  );
}

export default App;
