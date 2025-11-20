"use client";

import { useState } from "react";
import { formatFor20x2 } from "../../lib/vfdUtils";
import UseVFD from "./useVFD";

export default function VFDDisplayClient() {
  const { connect, disconnect, sendLine, sendText, clear, connected } = UseVFD();
  const [messageLine1, setMessageLine1] = useState("WELCOME");
  const [messageLine2, setMessageLine2] = useState("TOTAL: 0.00");

  const handleConnect = async () => {
    try {
      await connect({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" });
      // small warmup text
      await sendLine("CONNECTED");
      setTimeout(() => clear().catch(()=>{}), 600);
    } catch (err) {
      alert("Could not connect to VFD: " + (err?.message||err));
    }
  };

  const handleShow = async () => {
    // Format into two 20-char lines (pads/truncates)
    const [l1, l2] = formatFor20x2(messageLine1, messageLine2);
    // Many VFDs accept CRLF to print lines - write first then second
    await clear();
    await sendText(l1); // don't add extra CRLF if format includes positions; simple devices accept this
    await sendLine(l2); // newline after second
  };

  return (
    <div className="p-4 border rounded">
      <div className="flex gap-2 items-center mb-3">
        <button
          onClick={handleConnect}
          className="px-3 py-1 bg-blue-600 text-white rounded"
          disabled={connected}
        >
          {connected ? "Connected" : "Connect VFD"}
        </button>

        <button
          onClick={() => disconnect()}
          className="px-3 py-1 bg-gray-600 text-white rounded"
          disabled={!connected}
        >
          Disconnect
        </button>

        <button
          onClick={() => clear()}
          className="px-3 py-1 bg-red-600 text-white rounded"
          disabled={!connected}
        >
          Clear
        </button>
      </div>

      <div className="mb-2">
        <input
          value={messageLine1}
          onChange={(e) => setMessageLine1(e.target.value)}
          placeholder="Line 1 (20 chars)"
          className="border p-2 mr-2 w-64"
        />
        <input
          value={messageLine2}
          onChange={(e) => setMessageLine2(e.target.value)}
          placeholder="Line 2 (20 chars)"
          className="border p-2 w-64"
        />
      </div>

      <div>
        <button
          onClick={handleShow}
          className="px-3 py-1 bg-green-600 text-white rounded"
          disabled={!connected}
        >
          Display on VFD
        </button>
      </div>
    </div>
  );
}
