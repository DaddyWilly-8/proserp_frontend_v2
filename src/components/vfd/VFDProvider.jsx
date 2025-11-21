import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
    const [connected, setConnected] = useState(false);

    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const autoConnectEnabled = useRef(true);

    /* ----------------------------
       DISPLAY TOTAL (consistent format)
    ----------------------------- */
    const displayTimeoutRef = useRef(null);

    async function displayTotal(amount = 0, currency = "TZS") {
        if (!writerRef.current || !connected) {
            return;
        }

        // Cancel previous pending write
        if (displayTimeoutRef.current) {
            clearTimeout(displayTimeoutRef.current);
        }

        displayTimeoutRef.current = setTimeout(async () => {
            // ────── RE-CHECK writer (in case disconnect happened in the meantime) ──────
            if (!writerRef.current) {
                displayTimeoutRef.current = null;
                return;
            }

            try {
                const encoder = new TextEncoder();

                // Clear + write atomically
                await writerRef.current.write(encoder.encode("\x0C"));
                await new Promise(r => setTimeout(r, 60)); // tiny delay for cheap displays

                const formatted = Number(amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                const line1 = "TOTAL:";
                const line2 = `${currency} ${formatted}`.padStart(20, " ");

                await writerRef.current.write(encoder.encode(line1 + "\r\n"));
                await writerRef.current.write(encoder.encode(line2 + "\r\n"));

            } catch (e) {
                // Only trigger disconnect if it's a real port error
                if (e.name !== "AbortError" && e.name !== "NetworkError") {
                    setConnected(false);
                    await cleanup();
                }
            } finally {
                displayTimeoutRef.current = null;
            }
        }, 80);
    }

    // ────── SAFE sendZero ──────
    async function sendZero(currency = "TZS") {
        // Only call displayTotal if we have a writer
        if (writerRef.current && connected) {
            await displayTotal(0, currency);
        }
    }

    /* ----------------------------
       SAFE WRITE (kept for future use if needed)
    ----------------------------- */
    async function sendLine(text) {
        try {
            if (!connected || !writerRef.current) return;
            const encoder = new TextEncoder();
            await writerRef.current.write(encoder.encode(text + "\r\n"));
        } catch (e) {
            console.error("Send Error:", e);
        }
    }

    /* ----------------------------
       CLEANUP
    ----------------------------- */
    async function cleanup() {
        try {
            if (readerRef.current) {
                await readerRef.current.cancel().catch(() => {});
                readerRef.current.releaseLock();
                readerRef.current = null;
            }

            if (writerRef.current) {
                writerRef.current.releaseLock();
                writerRef.current = null;
            }

            if (portRef.current) {
                await portRef.current.close().catch(() => {});
                portRef.current = null;
            }

        } catch (e) {
            console.error("Cleanup error:", e);
        }
    }

    /* ----------------------------
       MANUAL CONNECT – use already granted port if available (no prompt)
    ----------------------------- */
    async function connect() {
        try {
            let port;

            const existingPorts = await navigator.serial.getPorts();
            if (existingPorts.length > 0) {
                port = existingPorts[0];
            } else {
                port = await navigator.serial.requestPort(); // only prompts first time
            }

            autoConnectEnabled.current = true;
            await openPort(port);
        } catch (e) {
            if (e.name !== "NotFoundError") {
                console.error("VFD Connect Error:", e);
            }
        }
    }

    /* ----------------------------
       OPEN PORT
    ----------------------------- */
    async function openPort(port) {
        // Always cleanup first
        await cleanup();

        try {
            // Double-check if port is already open
            if (port.readable !== null || port.writable !== null) {
                console.log("Port already open, skipping open()");
            } else {
                await port.open({ baudRate: 9600 });
            }

            portRef.current = port;
            writerRef.current = port.writable.getWriter();
            readerRef.current = port.readable.getReader();

            setConnected(true);
            listenForDisconnect(port);
            await sendZero();

        } catch (e) {
            setConnected(false);
        }
    }

    /* ----------------------------
       USB DISCONNECT LISTENER
    ----------------------------- */
    function listenForDisconnect(port) {
        port.addEventListener("disconnect", async () => {
            setConnected(false);
            await cleanup();

            autoConnectEnabled.current = true; // allow auto-reconnect when replugged
        });
    }

    /* ----------------------------
    AUTO RECONNECT ON RE-PLUG (FIXED!)
    ----------------------------- */
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!autoConnectEnabled.current || connected) return;

            try {
                const ports = await navigator.serial.getPorts();
                if (ports.length === 0) return;

                const port = ports[0];

                // CRITICAL: Only try to open if the port is NOT already open
                if (port.readable || port.writable) {
                    // Port is already open → just re-use it
                    portRef.current = port;
                    writerRef.current = port.writable.getWriter();
                    readerRef.current = port.readable.getReader();
                    setConnected(true);
                    listenForDisconnect(port);
                    await sendZero();
                    return;
                }

                // Port exists but is closed → safe to open
                await openPort(port);

            } catch (e) {
                console.error("Auto-reconnect failed:", e);
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [connected]);

    /* ----------------------------
       MANUAL DISCONNECT (NO RECONNECT!)
    ----------------------------- */
    async function disconnect() {
        autoConnectEnabled.current = false; // <-- disables auto reconnect

        await sendZero(); // clear to 0.00 before closing
        await cleanup();

        setConnected(false);
    }

    /* ----------------------------
       AUTO CONNECT ON PAGE LOAD (if already granted)
    ----------------------------- */
    useEffect(() => {
        autoConnectEnabled.current = true;

        navigator.serial.getPorts().then(async (ports) => {
            if (ports.length > 0) {
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