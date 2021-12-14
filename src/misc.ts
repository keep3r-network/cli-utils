import { ethers, Wallet } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { Provider } from 'ganache';
import { filter, firstValueFrom, fromEvent, map, Observable, share } from 'rxjs';
import { randomHex } from 'web3-utils';
import { GanacheFork } from './ganache-fork';
import { CoreMessage, PortRequest } from './types';

export function getStealthHash(): string {
  return ethers.utils.solidityKeccak256(['string'], [makeid(32)]);
}

export async function advanceBlocks(provider: Provider, amount: number): Promise<void> {
  for (let i = 0; i < amount; i++) {
    await advanceBlock(provider);
  }
}

export function advanceBlock(provider: Provider): Promise<unknown> {
  return provider.request({
    method: 'evm_mine',
    params: [],
  });
}

export const advanceTime = async (provider: Provider, time: number): Promise<void> => {
  await provider.request({
    method: 'evm_increaseTime',
    params: [time],
  });
};

export const advanceToTimeAndBlock = async (provider: Provider, time: number): Promise<unknown> => {
  return provider.request({
    method: 'evm_mine',
    params: [time],
  });
};

export const advanceTimeAndBlock = async (provider: Provider, time: number): Promise<void> => {
  await advanceTime(provider, time);
  await advanceBlock(provider);
};

export const generateRandomWallet = async (fork: GanacheFork): Promise<Wallet> => {
  return (await Wallet.createRandom()).connect(fork.ethersProvider);
};

export const generateRandomAddress = (): string => {
  return getAddress(randomHex(20));
};

export function makeid(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function getCoreMessages(): Observable<CoreMessage> {
  return fromEvent(process, 'message').pipe(
    map((message) => (message as [CoreMessage])[0]),
    share()
  );
}

export function getAvailablePort(message$: Observable<CoreMessage>): Promise<number> {
  const port$ = message$.pipe(
    filter(({ type }) => type === 'AvailablePort'),
    map(({ port }) => port)
  );
  if (!process.send) throw new Error('Not a child process');
  process.send({ type: 'PortRequest' } as PortRequest);

  return firstValueFrom(port$);
}

export function prelog(metadata: Record<string, unknown>): Console {
  return {
    log: (...args: any) => console.log(args[0], { ...metadata, ...args[1] }),
    info: (...args: any) => console.info(args[0], { ...metadata, ...args[1] }),
    warn: (...args: any) => console.warn(args[0], { ...metadata, ...args[1] }),
    error: (...args: any) => console.error(args[0], { ...metadata, ...args[1] }),
    debug: (...args: any) => console.debug(args[0], { ...metadata, ...args[1] }),
  } as Console;
}

export function toKebabCase(str: string): string {
  return str.replace(/\s+/g, '-').toLowerCase();
}
