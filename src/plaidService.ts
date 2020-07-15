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

export async function getTransactions(): Promise<ITransactionPreInsertED[]> {
    const transactionResponses: TransactionsResponse[] = await Promise.all(process.env.PLAID_ACCESS_TOKENS!
        .split(",")
        .map((accessToken: string) =>
            plaidClient.getTransactions(
                accessToken,
                addDays(new Date(), -18)
                    .toISOString()
                    .slice(0, 10),
                addDays(new Date(), 2)
                    .toISOString()
                    .slice(0, 10),
            )));

    const importantTransFields: ITransactionPreInsertED[] = []

    transactionResponses.forEach((transactionResponse: TransactionsResponse) => {
        importantTransFields.push(...transactionResponse.transactions.map((trans: Transaction) => {
            return {
                date: new Date(trans.date),
                name: trans.name,
                source_transaction_id: trans.transaction_id,
                amount: Math.abs(trans.amount!),
                transaction_type: trans.amount! > 0 ? TransactionType.expense : TransactionType.income,
                account_id: trans.account_id,
                source_pending_transaction_id: trans.pending_transaction_id,
                source_pending: trans.pending ?? false
            }
        }));
    });

    return importantTransFields;
}