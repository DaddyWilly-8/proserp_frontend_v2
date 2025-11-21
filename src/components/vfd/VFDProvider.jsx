import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
    const [connected, setConnected] = useState(false);

    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);

    const autoConnectEnabled = useRef(true);
    const displayTimeoutRef = useRef(null);

    /* ----------------------------------------------------
       FORMAT + DISPLAY TOTAL
    ---------------------------------------------------- */
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
                const formatted = Number(amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });

                const line1 = "TOTAL:";
                const line2 = `${currency} ${formatted}`;

                await writerRef.current.write(encoder.encode("\x0C"));
                await new Promise(r => setTimeout(r, 50));

                await writerRef.current.write(encoder.encode(line1 + "\r\n"));
                await writerRef.current.write(encoder.encode(line2 + "\r\n"));

            } catch (e) {
                console.warn("VFD write error:", e);
                await cleanup();
                setConnected(false);
            } finally {
                displayTimeoutRef.current = null;
            }
        }, 80);
    }

    async function sendZero(currency = "TZS") {
        await displayTotal(0, currency);
    }

    /* ----------------------------------------------------
       SEND LINE
    ---------------------------------------------------- */
    async function sendLine(text) {
        if (!writerRef.current || !connected) return;

        try {
            await writerRef.current.write(new TextEncoder().encode(text + "\r\n"));
        } catch (e) {
            console.warn("Send error:", e);
        }
    }

    /* ----------------------------------------------------
       CLEANUP (Windows-safe)
    ---------------------------------------------------- */
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
            await new Promise(r => setTimeout(r, 150)); // important on Windows!
            portRef.current = null;
        }
    }

    /* ----------------------------------------------------
       MANUAL CONNECT
    ---------------------------------------------------- */
    async function connect() {
        try {
            const port = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x1A86 }, // CH340
                    { usbVendorId: 0x0403 }, // FTDI
                    { usbVendorId: 0x067B }, // PL2303 Prolific
                ]
            });

            autoConnectEnabled.current = true;
            await openPort(port);

        } catch (e) {
            if (e.name !== "NotFoundError") {
                console.error("VFD Connect Error:", e);
            }
        }
    }

    /* ----------------------------------------------------
       OPEN PORT (Windows fixed)
    ---------------------------------------------------- */
    async function openPort(port) {
        await cleanup();

        try {
            // Windows sometimes reports readable/writable but still requires open()
            if (!port.readable || !port.writable) {
                await port.open({
                    baudRate: 9600,
                    dataBits: 8,
                    stopBits: 1,
                    parity: "none",
                    bufferSize: 255
                });
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
            await cleanup();
            setConnected(false);
        }
    }

    /* ----------------------------------------------------
       READ LOOP
    ---------------------------------------------------- */
    async function readLoop(reader) {
        try {
            while (connected && reader) {
                const { done } = await reader.read();
                if (done) break;
            }
        } catch (e) {
            console.warn("Read loop error:", e);
        } finally {
            try { reader.releaseLock(); } catch (_) {}
            readerRef.current = null;
        }
    }

    /* ----------------------------------------------------
       USB DISCONNECT
    ---------------------------------------------------- */
    function listenForDisconnect(port) {
        port.addEventListener("disconnect", async () => {
            console.log("VFD disconnected!");
            await cleanup();
            setConnected(false);

            if (autoConnectEnabled.current) {
                setTimeout(() => tryAutoReconnect(), 500);
            }
        });
    }

    /* ----------------------------------------------------
       AUTO-RECONNECT
    ---------------------------------------------------- */
    async function tryAutoReconnect() {
        if (!autoConnectEnabled.current || connected) return;

        const ports = await navigator.serial.getPorts();
        if (ports.length === 0) return;

        try {
            await openPort(ports[0]);
            console.log("VFD auto-reconnected!");
        } catch (e) {
            console.warn("Auto reconnect failed:", e);
        }
    }

    useEffect(() => {
        const interval = setInterval(tryAutoReconnect, 1500);
        return () => clearInterval(interval);
    }, [connected]);

    /* ----------------------------------------------------
       MANUAL DISCONNECT (no auto reconnect)
    ---------------------------------------------------- */
    async function disconnect() {
        autoConnectEnabled.current = false;
        await sendZero();
        await cleanup();
        setConnected(false);
    }

    /* ----------------------------------------------------
       AUTO CONNECT ON PAGE LOAD / FORM OPEN
    ---------------------------------------------------- */
    useEffect(() => {
        autoConnectEnabled.current = true;

        navigator.serial.getPorts().then(async (ports) => {
            if (ports.length > 0) {
                await openPort(ports[0]);
            }
        });

        return () => {
            sendZero();
            cleanup();
        };
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
