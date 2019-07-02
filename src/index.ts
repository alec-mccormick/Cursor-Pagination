import { PreciseDate } from '@google-cloud/precise-date';
import { loadSync } from 'protobufjs';
import { join } from 'path';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';



// ===========================================================================================
// --- Constants/Interfaces
// ===========================================================================================
const root = loadSync(join(__dirname, 'index.proto'));
const PayloadType = root.lookupType('sommaht.cursor.v1.PageTokenPayload');

const protoOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: false,
  oneofs: true
};

export interface PageTokenPayload {
  entries: PageTokenEntry[]
}

export interface PageTokenEntry {
  key: string;
  value: number | string | Date | PreciseDate | boolean;
  asc?: boolean;
}

interface ProtoPageTokenEntry {
  key: string;
  asc: boolean;
  sValue?: string;
  nValue?: number;
  bValue?: boolean;
  tValue?: {
    seconds: number;
    nanos: number;
  }
}

interface ProtoPageTokenPayload {
  entries: ProtoPageTokenEntry[];
}

export interface CursorPaginationConfig {
  aesKey?: string;
  aesAlgorithm?: string;
}

// ===========================================================================================
// --- CursorPagination Class
// ===========================================================================================
export class CursorPagination {

  constructor(private readonly config?: CursorPaginationConfig) {
    this.config = Object.assign({ aesAlgorithm: 'aes-128-ctr' }, config);
  }

  // ===========================================================================================
  // --- Public API
  // ===========================================================================================
  createToken(payload: PageTokenPayload): Buffer {
    const protoPayload = this.convertPageTokenPayloadToProto(payload);
    const data = this.encode(protoPayload);

    return this.config.aesKey ? this.encrypt(data, this.config.aesKey, this.config.aesAlgorithm) : data;
  }

  parseToken(input: Buffer): PageTokenPayload {
    const data = this.config.aesKey ? this.decrypt(input, this.config.aesKey, this.config.aesAlgorithm) : input;

    const protoPayload = this.decode(data);
    return this.convertPageTokenPayloadFromProto(protoPayload);
  }

  // ===========================================================================================
  // --- Conversion Functions
  // ===========================================================================================
  private convertPageTokenPayloadToProto(payload: PageTokenPayload): ProtoPageTokenPayload {
    return {
      entries: payload.entries.map(this.convertPageTokenEntryToProto)
    }
  }

  private convertPageTokenEntryToProto(entry: PageTokenEntry): ProtoPageTokenEntry {
    let { key, asc, value } = entry;
    if (typeof asc === 'undefined') asc = true;

    if (typeof value === 'string') return { key, asc, sValue: value };
    if (typeof value === 'number') return { key, asc, nValue: value };
    if (typeof value === 'boolean') return { key, asc, bValue: value };

    if (value instanceof Date) {
      const date = (value instanceof PreciseDate) ? value : new PreciseDate(value);
      return { key, asc, tValue: date.toStruct() }
    }

    throw new Error('CursorPagination - Unable to determine type of value');
  }

  private convertPageTokenPayloadFromProto(payload: ProtoPageTokenPayload): PageTokenPayload {
    return {
      entries: payload.entries.map(this.convertPageTokenEntryFromProto)
    }
  }

  private convertPageTokenEntryFromProto(entry: ProtoPageTokenEntry): PageTokenEntry {
    const { key, asc } = entry;
    const value = this.parseValueFromProtoEntry(entry);

    return { key, asc, value };
  }

  private parseValueFromProtoEntry(entry: ProtoPageTokenEntry): any {
    if (typeof entry.sValue !== 'undefined') return entry.sValue;
    if (typeof entry.nValue !== 'undefined') return entry.nValue;
    if (typeof entry.bValue !== 'undefined') return entry.bValue;
    if (typeof entry.tValue !== 'undefined') return new PreciseDate(entry.tValue);
  }

  // ===========================================================================================
  // --- Helper Functions
  // ===========================================================================================
  private encode(payload: ProtoPageTokenPayload): Buffer {
    return <Buffer>PayloadType.encode(PayloadType.fromObject(payload)).finish();
  }

  private decode(data: Buffer): ProtoPageTokenPayload {
    return <any>PayloadType.toObject(PayloadType.decode(data), protoOptions);
  }

  private encrypt(input: Buffer, cipherKey: string, algorithm: string): Buffer {
    const iv = randomBytes(16);
    const cipher = createCipheriv(algorithm, cipherKey, iv);
    return Buffer.concat([iv, cipher.update(input), cipher.final()]);
  }

  private decrypt(data: Buffer, cipherKey: string, algorithm: string): Buffer {
    // first 16 bits are the initialization vector, rest is encrypted data
    const iv = data.slice(0, 16);
    const decipher = createDecipheriv(algorithm, cipherKey, iv);
    return Buffer.concat([decipher.update(data.slice(16)), decipher.final()]);
  }
}