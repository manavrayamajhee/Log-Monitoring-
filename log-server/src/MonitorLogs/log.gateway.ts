import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway()
export class LogGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private watcher: chokidar.FSWatcher | null = null;

  constructor() {
    const filePath = path.join(__dirname, 'file.log');
    this.createFileIfNotExists(filePath) // Ensure file exists first
      .then(() => {
        this.setupWatcher(filePath); // Then set up the watcher
      })
      .catch((error) => {
        console.error('Error creating file:', error);
      });
  }

  async setupWatcher(filePath: string) {
    this.watcher = chokidar.watch(filePath);
    console.log('Setting up watcher', filePath);
    this.watcher.on('change', async () => {
      const updatedContent = await this.readLinesByPage(filePath, 1, 1);
      console.log('sending to topic test');
      this.server.emit('test', updatedContent);
    });
  }

  async handleConnection() {
    console.log(`Client connected`);
    const filePath = path.join(__dirname, 'file.log');
    const initialContent = await this.readLinesByPage(filePath, 1, 5);
    console.log(initialContent);
    this.server.emit('test', initialContent);
  }

  async readLastLines(filePath: string, linesCount: number): Promise<string[]> {
    const stream = fs.createReadStream(filePath);
    let data = '';
    let lines: string[] = [];
    let lineCount = 0;

    for await (const chunk of stream) {
      data += chunk;
      lines = data.split('\n');
      lineCount = lines.length;

      if (lineCount > linesCount) {
        lines = lines.slice(lineCount - linesCount);
      }
    }

    return lines;
  }

  async createFileIfNotExists(filePath: string) {
    try {
      // Check if the file exists
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      // File doesn't exist, create it
      await fs.promises.writeFile(filePath, '');
      //console.log('File created successfully.');
    }
  }

  async readLinesInRange(
    filePath: string,
    startLine: number,
    endLine: number,
    pageNumber: number,
  ): Promise<string[]> {
    const lines: string[] = [];
    let buffer: Buffer, bytesRead: number;

    const fileDescriptor = fs.openSync(filePath, 'r');
    // have to check if startLine and endLine are even present in the file.
    // another safety check is pagesize is greater than no of available lines
    // bug is after a while file watcher stops simply working

    try {
      let fileSize = fs.statSync(filePath).size,
        position = fileSize,
        lineCount = 0,
        endBytes = 0;

      // Loop through file content in reverse
      while (position > 0 && lineCount < endLine) {
        const chunkSize = Math.min(position, 1024);
        buffer = Buffer.alloc(chunkSize);
        position -= chunkSize;
        bytesRead = fs.readSync(fileDescriptor, buffer, 0, chunkSize, position);
        endBytes = bytesRead;

        // Process the chunk in reverse order
        for (let i = bytesRead - 1; i >= 0; i--) {
          // checking for endofline character
          if (buffer[i] === 10) {
            lineCount++;
            if (pageNumber > 1 && lineCount === startLine - 1) {
              endBytes = i;
            }
            // 8 14
            if (lineCount >= startLine && lineCount === endLine) {
              const startBytes = i + 1;
              console.log(lineCount, startLine, endLine, startBytes, endBytes);
              buffer
                .toString('utf-8', startBytes, endBytes)
                .split('\n')
                .map((line) => lines.push(line));
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
    } finally {
      fs.closeSync(fileDescriptor);
    }

    return lines.reverse();
  }

  async readLinesByPage(
    filePath: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<string[]> {
    const startLine = (pageNumber - 1) * pageSize + 1; //8
    const endLine = pageNumber * pageSize; // 14, 2
    return this.readLinesInRange(filePath, startLine, endLine, pageNumber);
  }

  handleDisconnect(client: WebSocket) {
    console.log(`Client disconnected: oh shit`);
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  @SubscribeMessage('pagination') // Listen to pagination topic
  async handlePagination(
    @MessageBody() data: { pageNumber: number; pageSize: number },
  ) {
    const { pageNumber, pageSize } = data;
    console.log(data);
    const filePath = path.join(__dirname, 'file.log');
    const content = await this.readLinesByPage(filePath, pageNumber, pageSize);
    this.server.emit('test', content); // Emit data to the client instead of server-wide
  }
}
