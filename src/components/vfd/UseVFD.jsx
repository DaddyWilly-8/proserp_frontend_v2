import { useEffect, useState, useRef } from "react";

export function UseVFD() {
  const [connected, setConnected] = useState(false);
  const portRef = useRef(null);
  const writerRef = useRef(null);

  // 🔹 Connect manually via user gesture
  async function connect() {
    try {
      // If port already connected
      if (portRef.current && portRef.current.readable) {
        setConnected(true);
        return true;
      }

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      const writer = port.writable.getWriter();

      portRef.current = port;
      writerRef.current = writer;
      setConnected(true);
      console.log("VFD Connected");

      return true;
    } catch (err) {
      console.error("VFD Connection Error:", err);
      setConnected(false);
      return false;
    }
  }

  // 🔹 Send raw text
  async function send(text) {
    if (!writerRef.current) return;
    try {
      const encoder = new TextEncoder();
      await writerRef.current.write(encoder.encode(text));
    } catch (err) {
      console.error("VFD send error:", err);
      await disconnect();
    }
  }

  // 🔹 Send line with newline
  async function sendLine(text) {
    await send(text + "\r\n");
  }

  // 🔹 Clear display
  async function clear() {
    await send("\x0C");
  }

  // 🔹 Send zero total
  async function sendZero(currency = "TZS") {
    const formatted = `${currency} 0.00`.padStart(20, " ");
    await clear();
    await sendLine("TOTAL:");
    await sendLine(formatted);
  }

  // 🔹 Disconnect and cleanup safely
  async function disconnect() {
    try {
      if (writerRef.current) {
        try { await writerRef.current.close(); } catch (_) {}
        writerRef.current = null;
      }
      if (portRef.current) {
        try { await portRef.current.close(); } catch (_) {}
        portRef.current = null;
      }
    } catch (err) {
      console.warn("VFD disconnect error:", err);
    } finally {
      setConnected(false);
      console.log("VFD Disconnected");
    }
  }

  // 🔹 Optional: check if VFD is already allowed by browser (no auto-open)
  useEffect(() => {
    (async () => {
      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          console.log("VFD port already granted, waiting for manual connect...");
        }
      } catch (err) {
        console.warn("VFD port check error:", err);
      }
    })();
  }, []);

  return { connect, disconnect, send, sendLine, clear, sendZero, connected };
}
