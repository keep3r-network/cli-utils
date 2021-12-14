import { Block } from '@ethersproject/abstract-provider';
import { TransactionRequest } from '@ethersproject/providers';
import { PopulatedTransaction } from 'ethers';
import { Observable, Subject } from 'rxjs';
import { GanacheFork } from './ganache-fork';

export interface TransactionErrorResult {
  error: string;
  program_counter: number;
  return: string;
  reason: string;
}

export interface TransactionError {
  name: string;
  message: string;
  hashes: string[];
  results: { [hash: string]: TransactionErrorResult };
}

export interface JobWorkableArgs {
  subject: Subject<JobBurst>;
  block: Block;
  advancedBlock: number;
  timeToAdvance: number;
  targetBlock: number;
  bundleBurst: number;
  aheadAmount: number;
  keeperAddress: string;
  rpcUrl: string;
  coreMessage$: Observable<CoreMessage>;
  keeperNonce: number;
  fork: GanacheFork;
  block$: Observable<Block>;
  retryId?: string;
  skipIds: string[];
  chainId: number;
}

export interface JobWorkableGroup {
  targetBlock: number;
  txs: PopulatedTransaction[];
  logId: string;
}

export interface JobBurst {
  correlationId: string;
  workableGroups: JobWorkableGroup[];
}

export interface Job {
  getWorkableTxs: (args: JobWorkableArgs) => Promise<void>;
}

export interface JobMessageBase {
  type: string;
}

export interface WorkRequest extends JobMessageBase {
  type: 'WorkRequest';
  job: string;
  correlationId: string;
  burst: {
    targetBlock: number;
    unsignedTxs: TransactionRequest[];
    logId: string;
  }[];
}

export interface PortRequest extends JobMessageBase {
  type: 'PortRequest';
}

export interface AvailablePort extends JobMessageBase {
  type: 'AvailablePort';
  port: number;
}

export type JobMessage = WorkRequest | PortRequest;

export type CoreMessage = AvailablePort;
