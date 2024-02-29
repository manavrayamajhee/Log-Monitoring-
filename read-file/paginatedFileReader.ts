import * as fs from "fs";

async function readLinesInRange(
  filePath: string,
  startLine: number,
  endLine: number,
  pageNumber: number
): Promise<string[]> {
  const lines: string[] = [];
  let buffer: Buffer, bytesRead: number;

  const fileDescriptor = fs.openSync(filePath, "r");

  try {
    let fileSize = fs.statSync(filePath).size;
    let position = fileSize;
    let lineCount = 0;
    let endBytes = 0;

    // Loop through file content in reverse
    while (position > 0 && lineCount < endLine) {
      const chunkSize = Math.min(position, 1024);
      buffer = Buffer.alloc(chunkSize);
      position -= chunkSize;
      bytesRead = fs.readSync(fileDescriptor, buffer, 0, chunkSize, position);
      endBytes = bytesRead;

      const avgLineLength = Math.ceil(fileSize / endLine);
      position = Math.max(0, fileSize - endLine * avgLineLength * 1.5);

      // Process the chunk in reverse order
      for (let i = bytesRead - 1; i >= 0; i--) {
        if (buffer[i] === 10) {
          lineCount++;
          if (pageNumber > 1 && lineCount === startLine - 1) {
            endBytes = i;
          }
          if (lineCount >= startLine && lineCount === endLine) {
            const startBytes = i + 1;
            buffer
              .toString("utf-8", startBytes, endBytes)
              .split("\n")
              .map((line) => lines.push(line));
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading file:", error);
  } finally {
    fs.closeSync(fileDescriptor);
  }

  return lines;
}

async function readLinesByPage(
  filePath: string,
  pageNumber: number,
  pageSize: number
): Promise<string[]> {
  // 3, 4
  const startLine = (pageNumber - 1) * pageSize + 1;
  const endLine = pageNumber * pageSize;
  return readLinesInRange(filePath, startLine, endLine, pageNumber);
}

// Usage
const filePath = "file.log";
const pageSize = 2;
const pageNumber = 5;

readLinesByPage(filePath, pageNumber, pageSize)
  .then((lines) => {
    console.log(`Lines for page ${pageNumber}:`, lines);
  })
  .catch((error) => {
    console.error("Error reading lines:", error);
  });

//
