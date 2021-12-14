import { BigNumber } from 'ethers';
import { GanacheFork } from './ganache-fork';
import { advanceToTimeAndBlock, getAvailablePort } from './misc';
import { JobWorkableArgs } from './types';

export async function createForks(amount: number, args: JobWorkableArgs): Promise<GanacheFork[]> {
  const ports: number[] = [];

  for (let index = 0; index < amount; index++) {
    ports.push(await getAvailablePort(args.coreMessage$));
  }

  const timestamp = (await args.fork.ethersProvider.getBlock(args.block.number)).timestamp;

  const forkPromises = new Array(amount).fill(null).map(async (_, index) => {
    const fork = await GanacheFork.start(
      {
        fork: args.rpcUrl,
        port: ports[index],
        fork_block_number: args.block.number,
        gasLimit: args.block.gasLimit.toHexString(),
        unlocked_accounts: [args.keeperAddress],
        gasPrice: BigNumber.from(0).toHexString(),
      },
      args.chainId
    );

    await advanceToTimeAndBlock(fork.ganacheProvider, timestamp + args.timeToAdvance);
    return fork;
  });

  return Promise.all(forkPromises);
}
