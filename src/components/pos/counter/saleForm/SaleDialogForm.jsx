// VFDProvider.jsx
import React, { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
  const [connected, setConnected] = useState(false);

  const portRef = useRef(null);
  const writerControllerRef = useRef(null); // TextEncoderStream writable side (getWriter)
  const writerPipeRef = useRef(null); // promise for pipeTo (so we can await closing)
  const readerRef = useRef(null);

  const autoConnectEnabled = useRef(true);
  const displayTimeoutRef = useRef(null);

  // ---------- Display helpers ----------
  async function displayTotal(amount = 0, currency = "TZS") {
    // Must have an active writer
    if (!writerControllerRef.current || !connected) return;

    // debounce writes to avoid flooding
    if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);

    displayTimeoutRef.current = setTimeout(async () => {
      if (!writerControllerRef.current || !connected) {
        displayTimeoutRef.current = null;
        return;
      }

      try {
        const encoder = new TextEncoder();
        await writerControllerRef.current.write(encoder.encode("\x0C")); // clear
        await new Promise((r) => setTimeout(r, 50));
        const formatted = Number(amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        await writerControllerRef.current.write(encoder.encode("TOTAL:\r\n"));
        await writerControllerRef.current.write(encoder.encode(`${currency} ${formatted}\r\n`));
      } catch (e) {
        console.warn("displayTotal write failed:", e);
        // cleanup on serious failure
        await _cleanup();
        setConnected(false);
      } finally {
        displayTimeoutRef.current = null;
      }
    }, 60);
  }

  async function sendZero(currency = "TZS") {
    await displayTotal(0, currency);
  }

  async function sendLine(text) {
    if (!writerControllerRef.current || !connected) return;
    try {
      const encoder = new TextEncoder();
      await writerControllerRef.current.write(encoder.encode(text + "\r\n"));
    } catch (e) {
      console.warn("sendLine failed:", e);
    }
  }

  // ---------- Safe cleanup ----------
  async function _cleanup() {
    // cancel pending display timeout
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }

    // close reader
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (_) {}
      try {
        readerRef.current.releaseLock();
      } catch (_) {}
      readerRef.current = null;
    }

    // close writer controller (the TextEncoderStream's writable.getWriter())
    if (writerControllerRef.current) {
      try {
        await writerControllerRef.current.close(); // attempt to close writer
      } catch (_) {}
      try {
        writerControllerRef.current.releaseLock();
      } catch (_) {}
      writerControllerRef.current = null;
    }

    // wait for any pipeTo to finish / then abort
    if (writerPipeRef.current) {
      try {
        await writerPipeRef.current.catch(() => {});
      } catch (_) {}
      writerPipeRef.current = null;
    }

    // close the port
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (_) {
        // it's expected that close can fail if cable was unplugged
      }
      portRef.current = null;
    }
  }

  // ---------- Reader loop (non-blocking) ----------
  async function _readLoop(reader) {
    try {
      while (true) {
        const r = await reader.read().catch(() => ({ done: true }));
        if (r.done) break;
        // We don't need any data; read() just keeps the port responsive.
      }
    } catch (e) {
      // ignore
    } finally {
      try {
        reader.releaseLock();
      } catch (_) {}
      readerRef.current = null;
    }
  }

  // ---------- Open port using TextEncoderStream (recommended) ----------
  async function _openPortWithTextEncoder(port) {
    // cleanup previous state
    await _cleanup();

    // ensure port open (some implementations require open())
    try {
      if (!port.readable || !port.writable) {
        await port.open({ baudRate: 9600 });
      }
    } catch (e) {
      console.warn("port.open() failed:", e);
      throw e;
    }

    portRef.current = port;

    // Reader: use raw readable and getReader()
    try {
      if (port.readable) {
        readerRef.current = port.readable.getReader();
        _readLoop(readerRef.current);
      }
    } catch (e) {
      console.warn("reader setup failed:", e);
      // continue — some devices may not support readable
      readerRef.current = null;
    }

    // Writer: use TextEncoderStream -> pipeTo(port.writable)
    try {
      const textEncoder = new TextEncoderStream();
      // pipe the encoder's readable to the physical port writable
      writerPipeRef.current = textEncoder.readable.pipeTo(port.writable).catch((err) => {
        // pipeTo can reject on unplug; swallow here
        console.warn("pipeTo rejected:", err);
      });
      // the writable side from encoder gives us getWriter()
      writerControllerRef.current = textEncoder.writable.getWriter();
    } catch (e) {
      console.warn("writer setup failed:", e);
      // fallback: try direct getWriter (less robust)
      try {
        writerControllerRef.current = port.writable.getWriter();
      } catch (err) {
        console.warn("fallback getWriter failed:", err);
        throw err;
      }
    }

    setConnected(true);
    // write zero to initialize
    try { await sendZero(); } catch (_) {}
    // listen for 'disconnect' event on the port (if supported)
    try {
      port.addEventListener && port.addEventListener("disconnect", async () => {
        console.log("VFD 'disconnect' event");
        setConnected(false);
        await _cleanup();
        if (autoConnectEnabled.current) {
          // try reconnect shortly after
          setTimeout(() => tryAutoReconnect(), 600);
        }
      });
    } catch (e) {
      // ignore
    }
  }

  // ---------- Exposed connect() to ask user for a port ----------
  async function connect() {
    try {
      // First try with a practical filter for USB-serial adapters
      let port;
      try {
        port = await navigator.serial.requestPort({
          // Windows: sometimes filter helps, but letting user choose is safest
          filters: []
        });
      } catch (err) {
        // If user cancels or API not available, rethrow
        throw err;
      }

      // user intent -> allow auto reconnect after manual connect
      autoConnectEnabled.current = true;
      await _openPortWithTextEncoder(port);
    } catch (e) {
      if (e && e.name !== "NotFoundError") console.error("Connect error:", e);
      throw e;
    }
  }

  // ---------- Auto-reconnect attempt when device appears ----------
  async function tryAutoReconnect() {
    if (!autoConnectEnabled.current) return;
    if (connected) return;

    try {
      const ports = await navigator.serial.getPorts();
      if (!ports || ports.length === 0) return;

      // We let the first available port be used (you can refine selection)
      const port = ports[0];
      await _openPortWithTextEncoder(port);
      console.log("VFD auto-reconnected to available port");
    } catch (e) {
      // ignore; we'll try again later
      // console.warn("tryAutoReconnect err:", e);
    }
  }

  // ---------- Manual disconnect (user intention) ----------
  async function disconnect() {
    autoConnectEnabled.current = false; // user disabled auto-reconnect
    try {
      await sendZero();
    } catch (_) {}
    await _cleanup();
    setConnected(false);
  }

  // ---------- Periodically try auto-reconnect ----------
  useEffect(() => {
    const id = setInterval(() => tryAutoReconnect(), 1500);
    return () => clearInterval(id);
  }, [connected]);

  // ---------- On mount: attempt to open any already-granted port ----------
  useEffect(() => {
    async function init() {
      try {
        const ports = await navigator.serial.getPorts();
        if (ports && ports.length > 0) {
          // try to open the first one (granted previously by user)
          await _openPortWithTextEncoder(ports[0]);
        }
      } catch (e) {
        console.warn("initial auto-open failed:", e);
      }
    }
    init();
    // cleanup on unmount
    return () => {
      _cleanup().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VFDContext.Provider
      value={{
        connected,
        connect,
        disconnect,
        displayTotal,
        sendZero,
        sendLine,
      }}
    >
      {children}
    </VFDContext.Provider>
  );
}

export function useVFD() {
  return useContext(VFDContext);
}
