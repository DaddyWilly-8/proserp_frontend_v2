import { useState, useCallback } from "react";

export default function useVFD() {
    const [port, setPort] = useState(null);
    const [writer, setWriter] = useState(null);
    const [connected, setConnected] = useState(false);

    // -------------------
    // WRITE TO VFD
    // -------------------
    const write = useCallback(async (text) => {
        try {
            if (!writer) return;
            await writer.write(text + "\r\n");
        } catch (err) {
            console.log("VFD Write Error:", err);
        }
    }, [writer]);

    // -------------------
    // SEND 0.00
    // -------------------
    const sendZero = useCallback(async () => {
        try {
            await write("0.00");
        } catch (err) {
            console.log("VFD: failed to send zero:", err);
        }
    }, [write]);

    // -------------------
    // CONNECT
    // -------------------
    const connect = useCallback(async () => {
        try {
            // Already connected?
            if (port && writer) return;

            // Request serial port
            const selectedPort = await navigator.serial.requestPort();
            await selectedPort.open({ baudRate: 9600 });

            // Create writer safely
            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(selectedPort.writable);
            const newWriter = textEncoder.writable.getWriter();

            // Save refs
            setPort(selectedPort);
            setWriter(newWriter);
            setConnected(true);

            // Handle device unplug
            selectedPort.ondisconnect = async () => {
                console.log("VFD: device unplugged");
                await sendZero();

                setConnected(false);
                setPort(null);
                setWriter(null);
            };

            // Clear screen first
            await sendZero();
        } catch (err) {
            console.log("VFD Connection Error:", err);
        }
    }, [port, writer, sendZero]);

    // -------------------
    // DISCONNECT
    // -------------------
    const disconnect = useCallback(async () => {
        try {
            await sendZero();  // clear screen

            if (writer) {
                await writer.close().catch(() => {});
            }

            if (port) {
                await port.close().catch(() => {});
            }

        } catch (err) {
            console.log("VFD Disconnect Error:", err);
        } finally {
            setConnected(false);
            setPort(null);
            setWriter(null);
        }
    }, [writer, port, sendZero]);

    return {
        connected,
        connect,
        disconnect,
        write
    };
}
