import React, { useEffect, useState } from "react";
import { socket } from "./socket";

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    socket.connect();
    socket.on("test", (data) => {
      console.log("Received data:", data);
      if (pageNumber === 1) {
        setLogs(data);
      } else {
        setLogs((prevLogs) => {
          // Check if received data is an array of length 1
          if (Array.isArray(data) && data.length === 1) {
            // Add new log to existing logs
            return [...prevLogs, ...data];
          } else {
            // Replace existing logs with the new data
            return data;
          }
        });
      }
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNextPage = () => {
    setPageNumber((prevPageNumber) => {
      const nextPageNumber = prevPageNumber + 1;

      socket.emit("pagination", { pageNumber: nextPageNumber, pageSize });
      return nextPageNumber;
    });
  };

  return (
    <div>
      <h1>Log Viewer</h1>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>
      <button onClick={handleNextPage}>Next Page</button>
    </div>
  );
};

export default LogViewer;
