// src/log/log.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Server } from 'socket.io';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

@Controller('log')
export class AppController {
  private readonly logFilePath: string;

  constructor() {
    this.logFilePath = path.join(__dirname, 'file.log');
  }

  @Post()
  async writeToLog(@Body() logEntry: LogEntry) {
    try {
      const logEntryString = `${logEntry.timestamp} - ${logEntry.level.toUpperCase()} - ${logEntry.message}`;

      // Check if the file exists and is empty
      const fileExists = fs.existsSync(this.logFilePath);
      const isFileEmpty = fileExists
        ? fs.statSync(this.logFilePath).size === 0
        : true;

      // Append data to the log file
      fs.appendFileSync(
        this.logFilePath,
        isFileEmpty ? logEntryString : `\n${logEntryString}`,
      );

      return { message: 'Data written to log file' };
    } catch (error) {
      console.error('Error writing to log file:', error);
      throw error;
    }
  }
}
