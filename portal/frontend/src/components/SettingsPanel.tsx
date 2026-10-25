import { useState, useEffect, useRef } from "react";
import { readConnection, writeConnection } from "../lessons/settingsStorage";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [apiBase, setApiBase] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/config")
      .then((r) => { if (!r.ok) throw new Error("Settings unavailable"); return r.json(); })
      .then((cfg) => {
        setApiBase(cfg.api_base ?? "");
        setModel(cfg.model ?? "");
        const backup = readConnection(window.localStorage);
        setApiKey(backup && backup.api_base === cfg.api_base && backup.model === cfg.model ? backup.api_key ?? "" : "");
      })
      .catch(() => { setStatus("error"); setMessage("Could not load backend settings. You can restore the browser backup below."); });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    setStatus("idle");
    setMessage("");
    try {
      const body: Record<string, string> = { api_base: apiBase, model };
      if (apiKey) body.api_key = apiKey;
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(typeof error.detail === "string" ? error.detail : `Settings rejected: HTTP ${response.status}`);
      }
      try {
        writeConnection(window.localStorage, { api_base: apiBase, model, ...(apiKey ? {api_key: apiKey} : {}) });
        setMessage(apiKey ? "Saved to .env and this browser." : "Saved to .env. Enter the key once to include it in the browser backup.");
      } catch { setMessage("Saved to .env; browser storage is unavailable."); }
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    fontSize: "0.75rem",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: 4,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    outline: "none",
  } as const;

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: 44,
        right: 16,
        width: 340,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        padding: "12px 14px",
        zIndex: 100,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        LLM Settings
      </div>

      <label htmlFor="connection-base" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
        API Base URL
      </label>
      <input id="connection-base" style={inputStyle} value={apiBase} onChange={(e) => { setApiBase(e.target.value); setApiKey(""); setStatus("idle"); setMessage("Enter the key for this endpoint; keys are not reused across endpoints."); }} placeholder="http://localhost:8000/v1" />

      <label htmlFor="connection-key" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginTop: 10, marginBottom: 4 }}>
        API Key
      </label>
      <input id="connection-key" autoComplete="off" style={inputStyle} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Leave empty to keep current (same endpoint)" />

      <label htmlFor="connection-model" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginTop: 10, marginBottom: 4 }}>
        Model
      </label>
      <input id="connection-model" style={inputStyle} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Qwen3.8-27B" />
      <p style={{fontSize: 12, marginTop: 10, color: "var(--text-secondary)"}}>Save persists to .env and browser storage. Browser storage is not encrypted; use a trusted local profile.</p>
      <button style={{fontSize: 12, marginTop: 8}} onClick={() => {
        const backup = readConnection(window.localStorage);
        if (!backup) { setMessage("No valid browser backup found."); return; }
        setApiBase(backup.api_base); setModel(backup.model); setApiKey(backup.api_key ?? "");
        setMessage("Browser backup loaded into form. Click Save to apply it to the backend."); setStatus("idle");
      }}>Restore browser backup</button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "5px 16px",
            fontSize: "0.75rem",
            fontWeight: 600,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {status === "saved" && (
          <span style={{ fontSize: "0.7rem", color: "var(--node-agent)" }}>Saved</span>
        )}
        {status === "error" && (
          <span style={{ fontSize: "0.7rem", color: "var(--node-error)" }}>Failed</span>
        )}
      </div>
      {message && <p role="status" style={{fontSize: 12, marginTop: 10, color: status === "error" ? "var(--node-error)" : "var(--text-secondary)"}}>{message}</p>}
    </div>
  );
}
