import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
    const [connected, setConnected] = useState(false);

    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);

    const autoConnectEnabled = useRef(true);
    const displayTimeoutRef = useRef(null);

    /* ----------------------------------------------------------------
       USB DEVICE FILTER (IMPORTANT FOR WINDOWS!)
       Replace vendorId/productId with yours if different.
    ------------------------------------------------------------------ */
    const DEVICE_FILTER = [
        { usbVendorId: 0x067B }, // Prolific PL2303 common VFD USB adapters
    ];

    function isVFD(port) {
        const info = port.getInfo();
        return DEVICE_FILTER.some(
            f => (!f.usbVendorId || f.usbVendorId === info.usbVendorId)
        );
    }

    /* ----------------------------------------------------------------
       DISPLAY TOTAL
    ------------------------------------------------------------------ */
    async function displayTotal(amount = 0, currency = "TZS") {
        if (!writerRef.current || !connected) return;

        if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);

        displayTimeoutRef.current = setTimeout(async () => {
            if (!writerRef.current || !connected) return;

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

    async function sendZero(currency = "TZS") {
        await displayTotal(0, currency);
    }

    async function sendLine(text) {
        if (!connected || !writerRef.current) return;
        try {
            const encoder = new TextEncoder();
            await writerRef.current.write(encoder.encode(text + "\r\n"));
        } catch (e) {
            console.warn("sendLine error:", e);
        }
    }

    /* ----------------------------------------------------------------
       CLEANUP (NO CRASHES)
    ------------------------------------------------------------------ */
    async function cleanup() {
        if (displayTimeoutRef.current) {
            clearTimeout(displayTimeoutRef.current);
            displayTimeoutRef.current = null;
        }

        try {
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
        } catch (err) {
            console.warn("cleanup error:", err);
        }
    }

    /* ----------------------------------------------------------------
       CONNECT (WINDOWS SAFE)
    ------------------------------------------------------------------ */
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

    /* ----------------------------------------------------------------
       OPEN PORT (FIXED FOR WINDOWS)
    ------------------------------------------------------------------ */
    async function openPort(port) {
        await cleanup();

        try {
            // On Windows, readable/writable are undefined
            if (!port.readable || !port.writable) {
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
            console.warn("openPort failed:", e);
            setConnected(false);
        }
    }

    /* ----------------------------------------------------------------
       READ LOOP (NO FREEZE, NO CRASH)
    ------------------------------------------------------------------ */
    async function readLoop(reader) {
        try {
            while (connected && reader) {
                const { done } = await reader.read().catch(() => ({ done: true }));
                if (done) break;
            }
        } catch (_) {
            // ignore
        } finally {
            try { reader.releaseLock(); } catch (_) {}
            readerRef.current = null;
        }
    }

    /* ----------------------------------------------------------------
       DISCONNECT EVENT (USB UNPLUG)
    ------------------------------------------------------------------ */
    function listenForDisconnect(port) {
        port.addEventListener("disconnect", async () => {
            console.log("VFD unplugged");
            setConnected(false);
            await cleanup();

            if (autoConnectEnabled.current) {
                setTimeout(() => tryAutoReconnect(), 600);
            }
        });
    }

    /* ----------------------------------------------------------------
       AUTO RECONNECT WHEN RE-PLUGGED
    ------------------------------------------------------------------ */
    async function tryAutoReconnect() {
        if (!autoConnectEnabled.current || connected) return;

        const ports = await navigator.serial.getPorts();
        const vfdPort = ports.find(isVFD);

        if (!vfdPort) return;

        try {
            await openPort(vfdPort);
            console.log("VFD auto-reconnected!");
        } catch (err) {
            console.warn("Auto reconnect error:", err);
        }
    }

    useEffect(() => {
        const timer = setInterval(tryAutoReconnect, 1500);
        return () => clearInterval(timer);
    }, [connected]);

    /* ----------------------------------------------------------------
       MANUAL DISCONNECT (NO AUTO RECONNECT)
    ------------------------------------------------------------------ */
    async function disconnect() {
        autoConnectEnabled.current = false;
        await sendZero();
        await cleanup();
        setConnected(false);
    }

    /* ----------------------------------------------------------------
       AUTO CONNECT ON PAGE LOAD (ONLY IF ALREADY GRANTED)
    ------------------------------------------------------------------ */
    useEffect(() => {
        autoConnectEnabled.current = true;

        navigator.serial.getPorts().then(async ports => {
            const vfdPort = ports.find(isVFD);
            if (vfdPort) await openPort(vfdPort);
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
