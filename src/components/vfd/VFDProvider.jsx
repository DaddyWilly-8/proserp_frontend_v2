import { createContext, useContext, useRef, useState, useEffect } from "react";

const VFDContext = createContext(null);

export function VFDProvider({ children }) {
    const [connected, setConnected] = useState(false);

    const portRef = useRef(null);
    const writerRef = useRef(null);
    const readerRef = useRef(null);
    const reconnectTimer = useRef(null);

    async function sendZero() {
        await sendLine("0.00");
    }

    /* --- CLEANUP --- */
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
        } catch (_) {}
    }

    /* --- CONNECT --- */
    async function connect() {
        try {
            const port = await navigator.serial.requestPort();
            await openPort(port);
        } catch (e) {
            console.error("VFD Connect Error:", e);
        }
    }

    async function openPort(port) {
        try {
            await cleanup();
            await port.open({ baudRate: 9600 });

            portRef.current = port;
            writerRef.current = port.writable.getWriter();
            readerRef.current = port.readable.getReader();

            listenForDisconnect(port);
            readLoop(readerRef.current);

            setConnected(true);

        } catch (e) {
            console.error("Open Port Error:", e);
        }
    }

    async function readLoop(reader) {
        try {
            while (true) {
                const { done } = await reader.read();
                if (done) break;
            }
        } catch (_) {}
    }

    async function sendLine(text) {
        try {
            if (!connected || !writerRef.current) return;
            const encoder = new TextEncoder();
            await writerRef.current.write(encoder.encode(text + "\r\n"));
        } catch (_) {}
    }

    async function disconnect() {
        setConnected(false);
        await cleanup();
    }

    function listenForDisconnect(port) {
        port.addEventListener("disconnect", async () => {
            setConnected(false);
            await cleanup();
            autoReconnect();
        });
    }

    function autoReconnect() {
        if (reconnectTimer.current) return;

        reconnectTimer.current = setInterval(async () => {
            const ports = await navigator.serial.getPorts();
            if (ports.length > 0) {
                clearInterval(reconnectTimer.current);
                reconnectTimer.current = null;
                await openPort(ports[0]);
            }
        }, 1500);
    }

    useEffect(() => {
        return () => cleanup();
    }, []);

    return (
        <VFDContext.Provider value={{ connected, connect, disconnect, sendLine, sendZero }}>
            {children}
        </VFDContext.Provider>
    );
}

export function useVFD() {
    return useContext(VFDContext);
}
