"use client";

import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

// Most common VFD USB-serial chips
const DEVICE_FILTERS = [
  { usbVendorId: 0x067B }, // Prolific PL2303 - MOST COMMON
  { usbVendorId: 0x0403 }, // FTDI
  { usbVendorId: 0x1A86 }, // CH340/CH341
  { usbVendorId: 0x10C4 }, // CP210x Silicon Labs
];

export function VFDProvider({ children }) {
  const [connected, setConnected] = useState(false);

  const portRef = useRef(null);
  const writerRef = useRef(null);
  const readerRef = useRef(null);
  const autoConnectEnabled = useRef(true);
  const displayTimeoutRef = useRef(null);

  // ────── DISPLAY TOTAL (SAFE + DEBOUNCED) ──────
  async function displayTotal(amount = 0, currency = "TZS") {
    if (!writerRef.current || !connected) return;

    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
    }

    displayTimeoutRef.current = setTimeout(async () => {
      if (!writerRef.current || !connected) {
        displayTimeoutRef.current = null;
        return;
      }

      try {
        const encoder = new TextEncoder();

        // Clear screen
        await writerRef.current.write(encoder.encode("\x0C"));
        await new Promise(r => setTimeout(r, 80));

        const formatted = Number(amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        const line1 = "TOTAL:";
        const line2 = `${currency} ${formatted}`.padStart(20, " ");

        await writerRef.current.write(encoder.encode(line1 + "\r\n"));
        await writerRef.current.write(encoder.encode(line2 + "\r\n"));

      } catch (e) {
        console.warn("VFD write failed (cable unplugged?)", e);
        setConnected(false);
        await cleanup();
      } finally {
        displayTimeoutRef.current = null;
      }
    }, 100);
  }

  async function sendZero(currency = "TZS") {
    await displayTotal(0, currency);
  }

  // ────── SAFE CLEANUP (NO TAB CRASH!) ──────
  async function cleanup() {
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }

    try {
      if (readerRef.current) {
        try { await readerRef.current.cancel(); } catch {}
        try { readerRef.current.releaseLock(); } catch {}
        readerRef.current = null;
      }
      if (writerRef.current) {
        try { writerRef.current.releaseLock(); } catch {}
        writerRef.current = null;
      }
      if (portRef.current) {
        try { await portRef.current.close(); } catch {}
        portRef.current = null;
      }
    } catch (e) {
      console.warn("cleanup safe error:", e);
    }
  }

  // ────── CONNECT (FORCES USER TO SELECT DEVICE ON WINDOWS) ──────
  async function connect() {
    try {
      const port = await navigator.serial.requestPort({
        filters: DEVICE_FILTERS
      });

      autoConnectEnabled.current = true;
      await openPort(port);

    } catch (e) {
      if (e.name !== "NotFoundError") {
        console.error("VFD Connect Error:", e);
      }
    }
  }

  // ────── OPEN PORT (WINDOWS SAFE) ──────
  async function openPort(port) {
    await cleanup();

    try {
      // On Windows, always open — even if readable/writable exist
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      writerRef.current = port.writable.getWriter();
      readerRef.current = port.readable.getReader();

      setConnected(true);
      port.addEventListener("disconnect", handleDisconnect);
      await sendZero("TZS");

      console.log("VFD Connected & Ready!");

    } catch (e) {
      console.error("Failed to open VFD:", e.message);
      setConnected(false);
    }
  }

  const handleDisconnect = () => {
    console.log("VFD Cable Unplugged");
    setConnected(false);
    cleanup();
    autoConnectEnabled.current = true;
  };

  // ────── AUTO RECONNECT WHEN RE-PLUGGED ──────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!autoConnectEnabled.current || connected) return;

      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          await openPort(ports[0]);
        }
      } catch (e) {
        // ignore
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [connected]);

  // ────── MANUAL DISCONNECT ──────
  async function disconnect() {
    autoConnectEnabled.current = false;
    await sendZero();
    await cleanup();
    setConnected(false);
  }

  // ────── AUTO CONNECT ON PAGE LOAD (IF PERMISSION ALREADY GRANTED) ──────
  useEffect(() => {
    autoConnectEnabled.current = true;

    navigator.serial.getPorts().then(async (ports) => {
      if (ports.length > 0) {
        console.log("Auto-connecting to saved VFD...");
        await openPort(ports[0]);
      }
    });

    return () => cleanup();
  }, []);

  return (
    <VFDContext.Provider
      value={{
        connected,
        connect,
        disconnect,
        displayTotal,
        sendZero,
      }}
    >
      {children}
    </VFDContext.Provider>
  );
}

export const useVFD = () => useContext(VFDContext);