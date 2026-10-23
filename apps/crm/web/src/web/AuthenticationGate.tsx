import { useEffect, useState, type ReactNode } from "react";
import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";
import "./authentication.css";

type EntraConfiguration = {
  tenantId: string;
  clientId: string;
  scope: string;
};

type Session = {
  authenticated: true;
  tenantId: string;
  userId: string;
  displayName?: string;
  username?: string;
};

type AuthenticationGateProps = { children: ReactNode };

export function AuthenticationGate({ children }: AuthenticationGateProps) {
  const [configuration, setConfiguration] = useState<EntraConfiguration>();
  const [client, setClient] = useState<PublicClientApplication>();
  const [account, setAccount] = useState<AccountInfo>();
  const [session, setSession] = useState<Session>();
  const [status, setStatus] = useState("Preparing secure sign-in…");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/v1/config", { cache: "no-store" });
        if (!response.ok) throw new Error("CRM sign-in has not been configured.");
        const nextConfiguration = await response.json() as EntraConfiguration;
        const nextClient = new PublicClientApplication({
          auth: {
            clientId: nextConfiguration.clientId,
            authority: `https://login.microsoftonline.com/${nextConfiguration.tenantId}`,
            redirectUri: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            navigateToLoginRequestUrl: false,
          },
          cache: { cacheLocation: "localStorage" },
        });
        await nextClient.initialize();
        const existingAccount = nextClient.getAllAccounts()[0];
        if (!active) return;
        setConfiguration(nextConfiguration);
        setClient(nextClient);
        setAccount(existingAccount);
        setStatus(existingAccount ? "Confirming your CRM access…" : "Microsoft sign-in is required.");
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "CRM sign-in could not be prepared.");
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!client || !configuration || !account || session) return;
    void authenticate(client, configuration, account)
      .then(setSession)
      .catch((caught) => {
        setAccount(undefined);
        setStatus("Microsoft sign-in is required.");
        setError(caught instanceof Error ? caught.message : "CRM access could not be confirmed.");
      });
  }, [account, client, configuration, session]);

  const signIn = async () => {
    if (!client || !configuration) return;
    setError("");
    setStatus("Waiting for Microsoft sign-in…");
    try {
      const result = await client.loginPopup({
        scopes: [configuration.scope],
        prompt: "select_account",
      });
      setAccount(result.account);
      setStatus("Confirming your CRM access…");
    } catch (caught) {
      setStatus("Microsoft sign-in is required.");
      setError(caught instanceof Error ? caught.message : "Microsoft sign-in did not complete.");
    }
  };

  if (session) return children;

  return (
    <main className="authentication-shell">
      <section className="authentication-card" aria-live="polite">
        <p className="authentication-eyebrow">The Lenders App Toolkit</p>
        <h1>Sign in to your CRM.</h1>
        <p>
          Use an account from the Microsoft Entra organization that owns this CRM deployment.
          Accounts from other organizations cannot access its data.
        </p>
        <button type="button" onClick={signIn} disabled={!client || Boolean(account)}>
          {account ? "Confirming access…" : "Sign in with Microsoft"}
        </button>
        <small>{status}</small>
        {error && <p className="authentication-error" role="alert">{friendlyError(error)}</p>}
      </section>
    </main>
  );
}

async function authenticate(
  client: PublicClientApplication,
  configuration: EntraConfiguration,
  account: AccountInfo,
): Promise<Session> {
  const token = await client.acquireTokenSilent({ account, scopes: [configuration.scope] });
  const response = await fetch("/api/v1/session", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });
  const body = await response.json() as Session | { error?: string };
  if (!response.ok || !("authenticated" in body)) {
    throw new Error("error" in body && body.error ? body.error : "The CRM rejected this Microsoft account.");
  }
  return body;
}

function friendlyError(message: string) {
  if (message.includes("AADSTS50020") || message.toLowerCase().includes("tenant")) {
    return "This Microsoft account does not belong to the Entra organization that owns this CRM.";
  }
  if (message.includes("user_cancelled") || message.includes("popup_window_error")) {
    return "Microsoft sign-in was closed before it finished. Try again when ready.";
  }
  return message;
}
