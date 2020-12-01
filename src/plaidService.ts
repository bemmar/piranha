import { ITransactionPreInsertED, TransactionType } from '@bjemo/budget-utils';
import { addDays } from 'date-fns';
import { Client as PlaidClient, environments, Transaction, TransactionsResponse } from 'plaid';

let plaidClient: PlaidClient;

export function setupClient(): PlaidClient {
    try {
        plaidClient = new PlaidClient(
            process.env.PLAID_CLIENT_ID!,
            process.env.PLAID_SECRET!,
            process.env.PLAID_PUBLIC_KEY!,
            environments[process.env.PLAID_ENV!],
            {
                version: '2019-05-29'
            }
        );
    } catch (error) {
        console.error("setupClient", error);
    }


    return plaidClient;
}

export async function getTransactions(): Promise<Transaction[]> {
    const transactionResponse: TransactionsResponse = await plaidClient.getTransactions(
        process.env.PLAID_ACCESS_TOKEN!,
        addDays(new Date(), -18)
            .toISOString()
            .slice(0, 10),
        addDays(new Date(), 2)
            .toISOString()
            .slice(0, 10),
        {
            account_ids: [process.env.ACCOUNT_FILTER!]
        }
    );

    return transactionResponse.transactions.filter((t) => t.pending === false)
}