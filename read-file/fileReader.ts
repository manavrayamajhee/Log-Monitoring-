import * as fs from "fs";

async function readLastLines(
  filePath: string,
  numLines: number
): Promise<string[]> {
  const lines: string[] = [];
  let buffer: Buffer;
  let bytesRead: number;

  // Open the file
  const fileDescriptor = fs.openSync(filePath, "r");

  try {
    let fileSize = fs.statSync(filePath).size;
    let position = fileSize;
    let nlCount = 0; // Count of newline characters encountered

    while (position > 0 && lines.length < numLines) {
      const chunkSize = Math.min(position, 1024); // Read 1KB at a time from the end

      buffer = Buffer.alloc(chunkSize);
      position -= chunkSize;

      // Read a chunk from the file
      bytesRead = fs.readSync(fileDescriptor, buffer, 0, chunkSize, position);

      let start = 0;
      // Process the chunk in reverse order
      for (let i = bytesRead - 1; i >= 0; i--) {
        if (buffer[i] === 10) {
          // ASCII code for newline character '\n'
          nlCount++;
          if (nlCount >= numLines) {
            console.log(nlCount, i, bytesRead);
            start = i + 1;
            // If required number of lines is found, break the loop
            break;
          }
        }
      }

      // Push lines from buffer into array
      buffer
        .toString("utf-8", start, bytesRead)
        .split("\n")
        .map((line) => lines.push(line));
    }
  } catch (error) {
    console.error("Error reading file:", error);
  } finally {
    // Close the file descriptor
    fs.closeSync(fileDescriptor);
  }

  return lines;
}

// Usage
const filePath = "file.log";
const numLinesToRead = 2;

readLastLines(filePath, numLinesToRead)
  .then((lastLines) => {
    console.log("Last lines:", lastLines);
  })
  .catch((error) => {
    console.error("Error reading last lines:", error);
  });
