function App() {
  return (
    <main className="page-shell">
      <section className="coming-soon" aria-labelledby="page-title">
        <img
          className="brand-logo"
          src="/thelenders-app-logo.png"
          alt="The Lenders App"
        />

        <div className="message">
          <p className="eyebrow">Open mortgage toolkit</p>
          <h1 id="page-title">Coming soon.</h1>
          <p className="introduction">
            We’re building an open-source platform for mortgage professionals,
            developers, and contributors.
          </p>
        </div>

        <p className="contact">
          Questions? <a href="mailto:support@thelenders.app">support@thelenders.app</a>
        </p>
      </section>
    </main>
  );
}

export default App;
