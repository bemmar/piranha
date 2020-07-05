import { DBTable, ITransactionPreInsertED } from '@bjemo/budget-utils';
import dbPool from './dbPool';

export async function insertTransactions(transactions: ITransactionPreInsertED[]): Promise<void> {
    const allTransIds: string[] = transactions.map((transaction) => transaction.source_transaction_id);

    const [dbExistingIdRows] = await (await dbPool())
        .query(`SELECT source_transaction_id
                      FROM ${DBTable.transaction}
                     WHERE source_transaction_id in (?)`,
            [allTransIds]
        );

    const now = new Date();

    const transactionsToInsert: any[] = transactions
        .filter((transaction) => !(dbExistingIdRows as any[] as string[]).includes(transaction.source_transaction_id))
        .map((transaction) => {
            return [transaction.name, transaction.amount, transaction.date, transaction.source_transaction_id, transaction.transaction_type, transaction.account_id, now, now, transaction.source_pending_transaction_id, transaction.source_pending];
        });

    if (transactionsToInsert.length > 0) {
        await (await dbPool()).query({
            sql: `INSERT INTO ${DBTable.transaction}
                        (
                            name,
                            amount,
                            date,
                            source_transaction_id,
                            transaction_type,
                            account_id,
                            created_at,
                            updated_at,
                            source_pending_transaction_id,
                            source_pending
                        )
                      VALUES ?`,
            values: [transactionsToInsert]
        });
    }
}

export async function deleteTransactions(transactionIds: string[]): Promise<void> {
    await (await dbPool()).query({
        sql: `DELETE ${DBTable.transaction}
               WHERE source_transaction_id in (?)`,
        values: [transactionIds]
    });
}