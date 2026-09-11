const repositoryUrl = "https://github.com/3netra-co/thelendersapp-toolkit";

const offerings = [
  {
    name: "Toolkit CRM",
    status: "Installation test in progress",
    description: "An installable mortgage CRM owned and operated inside the user’s own cloud account.",
    platform: "Azure reference implementation",
  },
  {
    name: "AWS deployment",
    status: "Contributors wanted",
    description: "An AWS-compatible implementation following the same open deployment and data contracts.",
    platform: "Community contribution",
  },
] as const;

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="The Lenders App Toolkit home">
        <img src="/thelenders-app-logo.png" alt="The Lenders App" />
        <span>Toolkit</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/#offerings">Offerings</a>
        <a href="/#contributors">Contributors</a>
        <a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>
  );
}

function InstallPage() {
  return (
    <main className="page-shell">
      <Header />
      <section className="install-layout">
        <div>
          <p className="eyebrow">Azure reference deployment</p>
          <h1>Install the Toolkit in your Azure account.</h1>
          <p className="introduction">
            Your application, infrastructure, identities, data, and Azure bill remain in your account.
            The Lenders App does not host your deployed CRM.
          </p>
        </div>
        <div className="install-panel" aria-labelledby="install-status">
          <p className="status-pill">Private installation test</p>
          <h2 id="install-status">Browser installation is being verified.</h2>
          <p>
            The installer will show every proposed Azure resource and expected cost before asking for approval.
            Do not enter confidential borrower information during this test.
          </p>
          <ol>
            <li>Sign in or create an Azure account.</li>
            <li>Review the proposed resources and cost.</li>
            <li>Approve deployment into your subscription.</li>
            <li>Receive and install your customer-owned PWA.</li>
          </ol>
          <button type="button" disabled>Start Azure installation</button>
          <p className="small-note">The button will open after the clean-account installation test passes.</p>
        </div>
      </section>
      <footer><a href="/">Return to Toolkit home</a></footer>
    </main>
  );
}

function HomePage() {
  return (
    <main className="page-shell">
      <Header />
      <section className="hero">
        <div>
          <p className="eyebrow">Open mortgage technology</p>
          <h1>Tools you can inspect, deploy, and own.</h1>
          <p className="introduction">
            The Lenders App Toolkit is an open-source home for practical mortgage software and cloud deployment
            patterns. The Azure implementation is first; compatible community implementations can follow.
          </p>
          <div className="actions">
            <a className="button primary" href="/install">View installation</a>
            <a className="button secondary" href={repositoryUrl} target="_blank" rel="noreferrer">Explore the code</a>
          </div>
        </div>
        <aside className="ownership-card">
          <p className="card-label">The ownership promise</p>
          <strong>Your cloud. Your application. Your data.</strong>
          <p>The public portal helps with installation; normal CRM use runs in the customer’s cloud account.</p>
        </aside>
      </section>

      <section className="section" id="offerings">
        <div className="section-heading">
          <p className="eyebrow">Offerings</p>
          <h2>Available work and what comes next</h2>
          <p>Status is published honestly. An offering becomes available only after its clean installation test passes.</p>
        </div>
        <div className="offering-grid">
          {offerings.map((offering) => (
            <article className="offering-card" key={offering.name}>
              <div className="card-topline">
                <span>{offering.platform}</span>
                <span className="status-pill">{offering.status}</span>
              </div>
              <h3>{offering.name}</h3>
              <p>{offering.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section contributors" id="contributors">
        <div className="section-heading">
          <p className="eyebrow">Contributors</p>
          <h2>Built openly, credited clearly</h2>
          <p>
            Release contributions will be acknowledged here and in the repository. Architecture-compatible Azure,
            AWS, and other cloud implementations are welcome.
          </p>
        </div>
        <a className="button secondary" href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
          Contribution guide
        </a>
      </section>

      <footer>
        <span>Open-source mortgage technology.</span>
        <a href="mailto:support@thelenders.app">support@thelenders.app</a>
      </footer>
    </main>
  );
}

function App() {
  return window.location.pathname === "/install" ? <InstallPage /> : <HomePage />;
}

export default App;
