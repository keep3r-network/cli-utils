import { PopulatedTransaction, providers } from 'ethers';
import Ganache, { Provider } from 'ganache';
import { firstValueFrom, Subject } from 'rxjs';

interface GanacheForkOptions {
  fork: string;
  port: number;
  fork_block_number: number;
  gasLimit: string;
  unlocked_accounts: string[];
  gasPrice: string;
}

export class GanacheFork {
  private constructor(public ganacheProvider: Provider, public ethersProvider: providers.JsonRpcProvider) {}

  static async start(options: GanacheForkOptions, chainId: number, logId?: string): Promise<GanacheFork> {
    return new Promise((resolve, reject) => {
      console.log(`Fork started`, { port: options.port, block: options.fork_block_number, logId });
      const server = Ganache.server({
        ...options,
        chainId,
        logger: {
          log: () => {},
        },
      });

      server.listen(options.port, (err) => {
        if (err) return reject(err);

        console.log(`Fork initialized`, { port: options.port, block: options.fork_block_number, logId });

        const ethersProvider = new providers.JsonRpcProvider({ url: `http://127.0.0.1:${options.port}` }, chainId);

        resolve(new GanacheFork(server.provider, ethersProvider));
      });
    });
  }

  async sendTransactions(txs: PopulatedTransaction[]): Promise<providers.TransactionReceipt[]> {
    const txReceipts: providers.TransactionReceipt[] = [];

    for (const tx of txs) {
      txReceipts.push(await this.sendTransaction(tx));
    }

    return txReceipts;
  }

  async sendTransaction(tx: PopulatedTransaction): Promise<providers.TransactionReceipt> {
    const params: any[] = [
      {
        ...tx,
        value: tx.value?.toHexString(),
        gasPrice: tx.gasPrice?.toHexString(),
        gasLimit: tx.gasLimit?.toHexString(),
        maxFeePerGas: tx.maxFeePerGas?.toHexString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toHexString(),
      },
    ];

    const txHash: string = (await this.ganacheProvider.request({
      method: 'eth_sendTransaction',
      params,
    })) as string;

    const subscriptionId = await this.ganacheProvider.request({ method: 'eth_subscribe', params: ['newHeads'] });

    const message$ = new Subject<void>();
    this.ganacheProvider.on('message', () => message$.next());

    await firstValueFrom(message$);

    await this.ganacheProvider.request({ method: 'eth_unsubscribe', params: [subscriptionId] });

    // get transaction receipt
    const receipt = await this.ethersProvider.getTransactionReceipt(txHash);

    if (receipt.status === 0) {
      throw new Error('Transaction in fork reverted');
    }

    console.log('Transaction sent to fork', {
      hash: txHash,
      receipt,
    });

    return receipt;
  }
}
