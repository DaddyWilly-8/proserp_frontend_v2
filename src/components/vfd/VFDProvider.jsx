import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
    const [connected, setConnected] = useState(false);

    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const openingRef = useRef(false);
    const reconnectTimeout = useRef(null);
    const displayTimeoutRef = useRef(null);
    const autoConnectEnabled = useRef(true);

    const DEVICE_FILTER = [
        { usbVendorId: 0x067B }, // Prolific PL2303 common VFD USB adapters
    ];

    const isVFD = (port) => {
        const info = port.getInfo();
        return DEVICE_FILTER.some(f => !f.usbVendorId || f.usbVendorId === info.usbVendorId);
    };

    /* ---------------------------- WRITE TO DISPLAY ---------------------------- */
    const displayTotal = useCallback(async (amount = 0, currency = "TZS") => {
        if (!writerRef.current || !connected) return;

        if (displayTimeoutRef.current) clearTimeout(displayTimeoutRef.current);

        displayTimeoutRef.current = setTimeout(async () => {
            if (!writerRef.current || !connected) return;

            try {
                const encoder = new TextEncoder();
                await writerRef.current.write(encoder.encode("\x0C")); // Clear display
                await new Promise(r => setTimeout(r, 60));

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
    }, [connected]);

    const sendZero = useCallback((currency = "TZS") => displayTotal(0, currency), [displayTotal]);

    const sendLine = useCallback(async (text) => {
        if (!connected || !writerRef.current) return;
        try {
            const encoder = new TextEncoder();
            await writerRef.current.write(encoder.encode(text + "\r\n"));
        } catch (e) {
            console.warn("sendLine error:", e);
        }
    }, [connected]);

    /* ---------------------------- CLEANUP ---------------------------- */
    const cleanup = useCallback(async () => {
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

        setConnected(false);
    }, []);

    /* ---------------------------- OPEN PORT ---------------------------- */
    const openPort = useCallback(async (existingPort) => {
        if (openingRef.current || connected) return;
        openingRef.current = true;

        try {
            const port = existingPort || await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });

            portRef.current = port;
            writerRef.current = port.writable.getWriter();

            // Optional read loop
            if (port.readable) {
                const reader = port.readable.getReader();
                readerRef.current = reader;
                (async () => {
                    while (true) {
                        try {
                            const { done, value } = await reader.read();
                            if (done) break;
                            if (value) console.log("VFD data:", value);
                        } catch {
                            break;
                        }
                    }
                })();
            }

            setConnected(true);

            // Listen for disconnect
            port.addEventListener("disconnect", async () => {
                console.log("VFD unplugged");
                await cleanup();
                if (autoConnectEnabled.current) scheduleReconnect();
            });

        } catch (err) {
            console.error("Failed to open VFD port:", err);
            scheduleReconnect();
        } finally {
            openingRef.current = false;
        }
    }, [connected, cleanup]);

    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeout.current) return;
        reconnectTimeout.current = setTimeout(async () => {
            reconnectTimeout.current = null;
            const ports = await navigator.serial.getPorts();
            const vfdPort = ports.find(isVFD);
            if (vfdPort) await openPort(vfdPort);
        }, 1500);
    }, [openPort]);

    /* ---------------------------- DISCONNECT ---------------------------- */
    const disconnect = useCallback(async () => {
        autoConnectEnabled.current = false;
        await sendZero();
        await cleanup();
    }, [cleanup, sendZero]);

    /* ---------------------------- AUTO CONNECT ON LOAD ---------------------------- */
    useEffect(() => {
        autoConnectEnabled.current = true;

        (async () => {
            const ports = await navigator.serial.getPorts();
            const vfdPort = ports.find(isVFD);
            if (vfdPort) await openPort(vfdPort);
        })();

        return () => cleanup();
    }, [openPort, cleanup]);

    return (
        <VFDContext.Provider value={{
            connected,
            openPort,
            disconnect,
            displayTotal,
            sendZero,
            sendLine,
        }}>
            {children}
        </VFDContext.Provider>
    );
}

export function useVFD() {
    return useContext(VFDContext);
}
