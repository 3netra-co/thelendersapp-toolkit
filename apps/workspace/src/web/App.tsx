import { FormEvent, useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  async function refresh() {
    const [contactResponse, eventResponse] = await Promise.all([
      fetch("/api/v1/contacts"),
      fetch("/api/v1/events/count"),
    ]);
    const contactData = await contactResponse.json();
    const eventData = await eventResponse.json();
    setContacts(contactData.contacts);
    setEventCount(eventData.count);
  }

  useEffect(() => {
    refresh().catch(() => {
      setMessageType("error");
      setMessage(window.location.hostname === "localhost"
        ? "The local service is unavailable."
        : "The Azure contact service is not connected yet.");
    });
  }, []);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage("");
    setMessageType("");
    const form = new FormData(event.currentTarget);
    const submittedForm = event.currentTarget;

    try {
      const response = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Contact could not be saved.");

      submittedForm.reset();
      await refresh();
      setMessageType("success");
      setMessage(`${result.contact.firstName} ${result.contact.lastName} was saved successfully.`);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Contact could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main>
      <header>
        <p className="eyebrow">THE LENDERS APP TOOLKIT</p>
        <h1>Workspace foundation</h1>
        <p className="lede">The first CRM slice for contacts, durable records, and application events.</p>
        {installPrompt && (
          <button className="install" type="button" onClick={installApp}>Install this app</button>
        )}
      </header>

      <section className="grid">
        <form onSubmit={submit}>
          <h2>Add a contact</h2>
          <label>First name<input name="firstName" required /></label>
          <label>Last name<input name="lastName" required /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Phone<input name="phone" type="tel" /></label>
          <button type="submit" disabled={isSaving} aria-busy={isSaving}>
            {isSaving ? "Saving…" : "Save contact"}
          </button>
          {message && (
            <p className={`message ${messageType}`} role={messageType === "error" ? "alert" : "status"}>
              {messageType === "success" && <span aria-hidden="true">✓ </span>}
              {message}
            </p>
          )}
        </form>

        <section className="contacts">
          <div className="section-heading">
            <h2>Contacts</h2>
            <span>{eventCount} recorded event{eventCount === 1 ? "" : "s"}</span>
          </div>
          {contacts.length === 0 ? <p className="empty">No contacts yet. Add the first contact.</p> : (
            <ul>{contacts.map((contact) => (
              <li key={contact.id}>
                <strong>{contact.firstName} {contact.lastName}</strong>
                <span>{contact.email || contact.phone || "No contact details"}</span>
              </li>
            ))}</ul>
          )}
        </section>
      </section>
      <footer>Pre-production — do not enter confidential borrower information.</footer>
    </main>
  );
}
