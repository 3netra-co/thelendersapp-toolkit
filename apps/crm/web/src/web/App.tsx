import { useEffect, useMemo, useState, type ReactNode } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Lead = { id: number; name: string; initials: string; email: string; phone: string; source: string; stage: string; owner: string; updated: string; amount: string; tone: string };

const leads: Lead[] = [
  { id: 1, name: "Maya & Daniel Brooks", initials: "MB", email: "maya.brooks@example.com", phone: "(703) 555-0184", source: "MRC", stage: "New", owner: "Unassigned", updated: "8 min ago", amount: "$625,000", tone: "mint" },
  { id: 2, name: "Luis Martinez", initials: "LM", email: "luis.martinez@example.com", phone: "(571) 555-0142", source: "Realtor referral", stage: "Contacted", owner: "A. Singh", updated: "42 min ago", amount: "$410,000", tone: "blue" },
  { id: 3, name: "Nora Chen", initials: "NC", email: "nora.chen@example.com", phone: "(202) 555-0169", source: "Website", stage: "Application", owner: "You", updated: "2 hr ago", amount: "$785,000", tone: "rose" },
  { id: 4, name: "Ethan Williams", initials: "EW", email: "ethan.williams@example.com", phone: "(301) 555-0108", source: "Past client", stage: "Pre-approved", owner: "You", updated: "Yesterday", amount: "$520,000", tone: "amber" },
  { id: 5, name: "Sofia Patel", initials: "SP", email: "sofia.patel@example.com", phone: "(703) 555-0196", source: "CSV import", stage: "Nurture", owner: "J. Reed", updated: "Yesterday", amount: "$350,000", tone: "violet" },
];

const navigation = [
  { label: "Leads", icon: "leads" }, { label: "Partners & referrals", icon: "partners" },
  { label: "Tasks & activities", icon: "tasks", count: 4 }, { label: "Communications", icon: "message" },
  { label: "Automations", icon: "automation" }, { label: "Connections", icon: "connection", count: 1 },
  { label: "Add-ons", icon: "addons" }, { label: "Settings", icon: "settings" },
];

const moduleContent: Record<string, { eyebrow: string; title: string; description: string; actions: string[] }> = {
  "Partners & referrals": { eyebrow: "Relationship workspace", title: "Partners & referrals", description: "Manage referral partners, incoming opportunities, outgoing introductions, and relationship performance.", actions: ["Add partner", "Record referral", "Import partners"] },
  "Tasks & activities": { eyebrow: "Daily work queue", title: "Tasks & activities", description: "Calls, appointments, follow-ups, and team work—organized around the borrower and due date.", actions: ["Add task", "Schedule call", "View overdue"] },
  Communications: { eyebrow: "Customer communication", title: "Communications", description: "Keep transactional conversations separate from compliant marketing campaigns and monitor delivery health.", actions: ["Transactional", "Marketing", "Templates"] },
  Automations: { eyebrow: "Rules and workflows", title: "Automations", description: "Build transparent assignment, follow-up, status, and event workflows without hiding business rules in code.", actions: ["Assignment rules", "Sequences", "Run history"] },
  Connections: { eyebrow: "Data in and out", title: "Connections", description: "Import files, accept webhooks, map APIs, and preserve every original source payload before normalization.", actions: ["Upload file", "Add webhook", "Connect API"] },
  "Add-ons": { eyebrow: "Extend your CRM", title: "Add-on services", description: "Add customer-owned communications, AI, events, document processing, LOS, POS, and pricing services.", actions: ["Communications", "Azure Foundry", "Browse extensions"] },
  Settings: { eyebrow: "Organization controls", title: "Settings", description: "Configure your organization, staff access, branches, assignment logic, data fields, and Azure installation.", actions: ["Organization", "Users & access", "Data management"] },
};

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    leads: <><path d="M5 7h14M5 12h14M5 17h9"/><circle cx="3" cy="7" r=".5"/><circle cx="3" cy="12" r=".5"/><circle cx="3" cy="17" r=".5"/></>,
    partners: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c.6-3.4 2.4-5 5.5-5s4.9 1.6 5.5 5M14.5 15c2.9-.7 5.1.6 6 3.5"/></>,
    tasks: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 2.2 2.2L16 8.5"/></>,
    message: <><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/></>,
    automation: <><path d="M7 7h10v4l3-3-3-3v2M17 17H7v-4l-3 3 3 3v-2"/></>,
    connection: <><path d="M8 12h8M8 8H6a4 4 0 0 0 0 8h2M16 8h2a4 4 0 0 1 0 8h-2"/></>,
    addons: <path d="M9 3v6H3v6h6v6h6v-6h6V9h-6V3H9Z"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function App() {
  const [activeModule, setActiveModule] = useState("Leads");
  const [activeFilter, setActiveFilter] = useState("All leads");
  const [query, setQuery] = useState("");
  const [setupVisible, setSetupVisible] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [lead.name, lead.email, lead.source, lead.owner, lead.stage].some((field) => field.toLowerCase().includes(q));
    const matchesFilter = activeFilter === "All leads" || (activeFilter === "My leads" && lead.owner === "You") || (activeFilter === "Unassigned" && lead.owner === "Unassigned");
    return matchesQuery && matchesFilter;
  }), [activeFilter, query]);

  async function installApp() { if (installPrompt) { await installPrompt.prompt(); if ((await installPrompt.userChoice).outcome === "accepted") setInstallPrompt(null); } }
  function chooseModule(label: string) { setActiveModule(label); setMobileNavOpen(false); }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark">TLA</span><span><strong>The Lenders App</strong><small>Customer-owned CRM</small></span></div>
      <button className="create-button" type="button" onClick={() => setDrawerOpen(true)}><span>＋</span> Create new</button>
      <nav aria-label="CRM navigation">
        <p className="nav-label">Workspace</p>
        {navigation.slice(0, 4).map((item) => <NavItem {...item} active={activeModule === item.label} key={item.label} onClick={() => chooseModule(item.label)}/>)}
        <p className="nav-label">Manage</p>
        {navigation.slice(4).map((item) => <NavItem {...item} active={activeModule === item.label} key={item.label} onClick={() => chooseModule(item.label)}/>)}
      </nav>
      <div className="sidebar-footer"><span className="health-dot"/> All systems operational<small>CRM v0.1.5 · Azure</small></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <button className="mobile-menu" type="button" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="Open navigation">☰</button>
        <div className="global-search"><span>⌕</span><input aria-label="Search CRM" placeholder="Search leads, partners, tasks…"/><kbd>⌘ K</kbd></div>
        <div className="topbar-actions">{installPrompt && <button className="install-button" type="button" onClick={installApp}>Install app</button>}<button className="icon-button" type="button" aria-label="Notifications">♢<span className="notification-dot"/></button><button className="user-button" type="button"><span>AT</span><span className="user-copy"><strong>Anupam Tripathi</strong><small>Organization admin</small></span><b>⌄</b></button></div>
      </header>
      {activeModule === "Leads" ? <main className="content">
        <div className="page-title-row"><div><p className="breadcrumb">CRM / Leads</p><h1>Leads</h1><p>Review, assign, and move every opportunity forward.</p></div><div className="page-actions"><button className="secondary" type="button">Import</button><button className="primary" type="button" onClick={() => setDrawerOpen(true)}>＋ Add lead</button></div></div>
        {setupVisible && <section className="setup-strip"><div className="setup-copy"><span className="setup-symbol">✓</span><div><strong>Your CRM is ready. Finish the essentials.</strong><p>Complete these once, then this guide stays out of your way.</p></div></div><div className="setup-steps"><button className="done" type="button">Organization <span>✓</span></button><button type="button" onClick={() => chooseModule("Settings")}>Add staff <b>1/—</b></button><button type="button" onClick={() => chooseModule("Connections")}>Connect a source <b>Next</b></button><button type="button" onClick={() => chooseModule("Automations")}>Assignment rules</button></div><button className="dismiss" type="button" onClick={() => setSetupVisible(false)} aria-label="Dismiss setup guide">×</button></section>}
        <section className="metrics" aria-label="Lead summary"><Metric label="Open pipeline" value="24" note="+$1.2M this week"/><Metric label="New & unassigned" value="7" note="3 need attention" attention/><Metric label="Follow-ups due" value="4" note="Today"/><Metric label="Applications" value="9" note="37% of pipeline"/></section>
        <section className="lead-panel">
          <div className="lead-tabs" role="tablist">{["All leads", "My leads", "Unassigned", "Duplicates"].map((filter) => <button role="tab" aria-selected={activeFilter === filter} className={activeFilter === filter ? "active" : ""} type="button" key={filter} onClick={() => setActiveFilter(filter)}>{filter}{filter === "Unassigned" && <span>7</span>}</button>)}</div>
          <div className="table-tools"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this view"/></label><div><button type="button">Filter</button><button type="button">Sort: Updated</button><button type="button" aria-label="Table settings">•••</button></div></div>
          <div className="table-wrap"><table><thead><tr><th><input type="checkbox" aria-label="Select all leads"/></th><th>Borrower</th><th>Source</th><th>Stage</th><th>Loan amount</th><th>Owner</th><th>Last activity</th><th/></tr></thead><tbody>{filteredLeads.map((lead) => <tr key={lead.id}><td><input type="checkbox" aria-label={`Select ${lead.name}`}/></td><td><div className="borrower"><span className={`avatar ${lead.tone}`}>{lead.initials}</span><span><strong>{lead.name}</strong><small>{lead.email} · {lead.phone}</small></span></div></td><td><span className="source">{lead.source}</span></td><td><span className={`stage ${lead.stage.toLowerCase().replace("-", "")}`}>{lead.stage}</span></td><td>{lead.amount}</td><td className={lead.owner === "Unassigned" ? "unassigned" : ""}>{lead.owner}</td><td>{lead.updated}</td><td><button className="row-menu" type="button">•••</button></td></tr>)}</tbody></table>{filteredLeads.length === 0 && <div className="no-results"><strong>No leads match this view.</strong><span>Clear the search or choose a different lead view.</span></div>}</div>
          <div className="table-footer"><span>Showing {filteredLeads.length} of 24 leads</span><div><button disabled type="button">‹</button><button className="active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">›</button></div></div>
        </section><p className="prototype-note">Interface preview with sample data — do not enter confidential borrower information.</p>
      </main> : <ModulePreview activeModule={activeModule}/>}
    </div>
    {drawerOpen && <LeadDrawer onClose={() => setDrawerOpen(false)}/>}
    {mobileNavOpen && <button className="scrim" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}/>}
  </div>;
}

function NavItem({ label, icon, count, active, onClick }: { label: string; icon: string; count?: number; active: boolean; onClick: () => void }) { return <button className={active ? "active" : ""} type="button" onClick={onClick}><Icon name={icon}/><span>{label}</span>{count && <em>{count}</em>}</button>; }
function Metric({ label, value, note, attention = false }: { label: string; value: string; note: string; attention?: boolean }) { return <article><span>{label}</span><strong>{value}</strong><small className={attention ? "attention" : ""}>{note}</small></article>; }
function ModulePreview({ activeModule }: { activeModule: string }) { const item = moduleContent[activeModule]; return <main className="content module-preview"><div className="page-title-row"><div><p className="breadcrumb">CRM / {activeModule}</p><h1>{item.title}</h1><p>{item.description}</p></div></div><section className="module-grid">{item.actions.map((action, index) => <button type="button" key={action}><span className="module-number">0{index + 1}</span><strong>{action}</strong><small>Open {action.toLowerCase()} workspace</small><b>→</b></button>)}</section><section className="module-message"><p className="eyebrow">{item.eyebrow}</p><h2>This workspace is intentionally quiet.</h2><p>We are reviewing navigation, hierarchy, and task flow before connecting this module to Azure services.</p></section></main>; }
function LeadDrawer({ onClose }: { onClose: () => void }) { return <div className="drawer-layer"><button className="drawer-scrim" type="button" aria-label="Close" onClick={onClose}/><aside className="drawer"><div className="drawer-heading"><div><p className="eyebrow">New CRM record</p><h2>Add a lead</h2></div><button type="button" onClick={onClose}>×</button></div><p className="drawer-intro">Start with the person. Loan and property details can be added without creating duplicate contacts.</p><form onSubmit={(event) => { event.preventDefault(); onClose(); }}><div className="two-fields"><label>First name<input required placeholder="First name"/></label><label>Last name<input required placeholder="Last name"/></label></div><label>Email<input type="email" placeholder="name@example.com"/></label><label>Phone<input type="tel" placeholder="(000) 000-0000"/></label><div className="two-fields"><label>Lead source<select defaultValue="manual"><option value="manual">Manual entry</option><option>MRC</option><option>Referral</option><option>Website</option></select></label><label>Assign to<select defaultValue="unassigned"><option value="unassigned">Unassigned</option><option>Me</option><option>Round robin</option></select></label></div><label>Notes<textarea rows={4} placeholder="What should the team know?"/></label><div className="drawer-actions"><button className="secondary" type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit">Save lead</button></div></form></aside></div>; }
