import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
    const [connected, setConnected] = useState(false);

    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const autoConnectEnabled = useRef(true); // allow auto reconnect
    const displayTimeoutRef = useRef(null);

    /* ----------------------------
       DISPLAY TOTAL
    ----------------------------- */
    async function displayTotal(amount = 0, currency = "TZS") {
        if (!writerRef.current || !connected) return;

        if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);

        displayTimeoutRef.current = setTimeout(async () => {
            if (!writerRef.current || !connected) {
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
                console.warn("VFD write failed:", e);
                await cleanup();
                setConnected(false);
            } finally {
                displayTimeoutRef.current = null;
            }
        }, 80);
    }

    /* ----------------------------
       SEND ZERO
    ----------------------------- */
    async function sendZero(currency = "TZS") {
        await displayTotal(0, currency);
    }

    /* ----------------------------
       SEND ARBITRARY LINE
    ----------------------------- */
    async function sendLine(text) {
        try {
            if (!connected || !writerRef.current) return;
            const encoder = new TextEncoder();
            await writerRef.current.write(encoder.encode(text + "\r\n"));
        } catch (e) {
            console.warn("Send error:", e);
        }
    }

    /* ----------------------------
       CLEANUP
    ----------------------------- */
    async function cleanup() {
        if (displayTimeoutRef.current) {
            clearTimeout(displayTimeoutRef.current);
            displayTimeoutRef.current = null;
        }

        if (readerRef.current) {
            try { await readerRef.current.cancel(); } catch (_) {}
            try { readerRef.current.releaseLock(); } catch (_) {}
            readerRef.current = null;
        }

        if (writerRef.current) {
            try { writerRef.current.releaseLock(); } catch (_) {}
            writerRef.current = null;
        }

        if (portRef.current) {
            try { await portRef.current.close(); } catch (_) {}
            portRef.current = null;
        }
    }

    /* ----------------------------
       MANUAL CONNECT
    ----------------------------- */
    async function connect() {
        try {
            let port;
            const existingPorts = await navigator.serial.getPorts();
            if (existingPorts.length > 0) {
                port = existingPorts[0];
            } else {
                port = await navigator.serial.requestPort(); // prompts first time
            }

            autoConnectEnabled.current = true;
            await openPort(port);

        } catch (e) {
            if (e.name !== "NotFoundError") {
                console.error("VFD Connect Error:", e);
            }
        }
    }

    async function openPort(port) {
        await cleanup(); // ALWAYS cleanup before opening

        try {
            if (!port.readable && !port.writable) {
                await port.open({ baudRate: 9600 });
            }

            portRef.current = port;
            writerRef.current = port.writable.getWriter();
            readerRef.current = port.readable.getReader();

            setConnected(true);
            listenForDisconnect(port);
            readLoop(readerRef.current);
            await sendZero();

        } catch (e) {
            console.warn("Open port failed:", e);
            setConnected(false);

            // Required for Windows
            await cleanup();

            // Avoid connect-spam
            autoConnectEnabled.current = false;
        }
    }

    /* ----------------------------
       READ LOOP
    ----------------------------- */
    async function readLoop(reader) {
        try {
            while (connected && reader) {
                const { done } = await reader.read();
                if (done) break;
            }
        } catch (e) {
            console.warn("Read loop error:", e);
        } finally {
            if (readerRef.current) {
                try { readerRef.current.releaseLock(); } catch (_) {}
                readerRef.current = null;
            }
        }
    }

    /* ----------------------------
       LISTEN FOR USB DISCONNECT
    ----------------------------- */
    function listenForDisconnect(port) {
        port.addEventListener("disconnect", async () => {
            console.log("VFD disconnected!");
            setConnected(false);
            await cleanup();

            // auto reconnect if not manually disabled
            if (autoConnectEnabled.current) {
                setTimeout(() => tryAutoReconnect(), 500);
            }
        });
    }

    /* ----------------------------
       AUTO RECONNECT
    ----------------------------- */
    async function tryAutoReconnect() {
        if (!autoConnectEnabled.current || connected) return;

        const ports = await navigator.serial.getPorts();
        if (ports.length === 0) return;

        try {
            await openPort(ports[0]);
            console.log("VFD reconnected automatically!");
        } catch (e) {
            console.warn("Auto-reconnect failed:", e);
        }
    }

    useEffect(() => {
        const interval = setInterval(tryAutoReconnect, 1500);
        return () => clearInterval(interval);
    }, [connected]);

    /* ----------------------------
       MANUAL DISCONNECT
    ----------------------------- */
    async function disconnect() {
        autoConnectEnabled.current = false; // disable auto reconnect
        await sendZero();
        await cleanup();
        setConnected(false);
    }

    /* ----------------------------
       AUTO CONNECT ON PAGE LOAD
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
                sendLine
            }}
        >
            {children}
        </VFDContext.Provider>
    );
}

export function useVFD() {
    return useContext(VFDContext);
}
