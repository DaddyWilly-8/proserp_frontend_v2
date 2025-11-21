import { useEffect, useState, useRef } from "react";

export function UseVFD() {
  const [connected, setConnected] = useState(false);
  const portRef = useRef(null);
  const writerRef = useRef(null);

  // 🔥 AUTO-RECONNECT IF PORT WAS PREVIOUSLY ALLOWED
  useEffect(() => {
    (async () => {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        const port = ports[0];
        try {
          await port.open({ baudRate: 9600 });
          const writer = port.writable.getWriter();

          portRef.current = port;
          writerRef.current = writer;
          setConnected(true);
        } catch (e) {
          console.log("Failed auto-reconnect:", e);
        }
      }
    })();
  }, []);

  // ➕ Manual connect (first time only)
  async function connect() {
    try {
      // If already connected, skip
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
      return true;
    } catch (err) {
      console.error("VFD Connection Error:", err);
      return false;
    }
  }

  async function send(text) {
    if (!writerRef.current) return;
    const encoder = new TextEncoder();
    await writerRef.current.write(encoder.encode(text));
  }

  async function sendLine(text) {
    await send(text + "\r\n");
  }

  async function clear() {
    await send("\x0C");
  }

  async function disconnect() {
    try {
      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } finally {
      setConnected(false);
    }
  }

  return { connect, send, sendLine, clear, disconnect, connected };
}