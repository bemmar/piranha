import { DBTable, ITransactionPreInsertED } from '@bjemo/budget-utils';
import { RowDataPacket, format } from 'mysql2';
import dbPool from './dbPool';

export async function insertTransactions(transactions: ITransactionPreInsertED[]): Promise<void> {
    console.log('transactions.length', transactions.length);
    const allTransIds: string[] = transactions.map((transaction) => transaction.source_transaction_id);

    const [dbExistingIdRows] = await (await dbPool())
        .query(`SELECT source_transaction_id
                      FROM ${DBTable.transaction}
                     WHERE source_transaction_id in (?)`,
            [allTransIds]
        );

    console.log('dbExistingIdRows.length', (dbExistingIdRows as RowDataPacket[]).length);

    const now = new Date();

    const transactionsToInsert: any[] = transactions
        .filter((transaction) => (dbExistingIdRows as RowDataPacket[]).every((existing) =>
            existing.source_transaction_id !== transaction.source_transaction_id))
        .map((transaction) => {
            return [transaction.name, transaction.amount, transaction.date, transaction.source_transaction_id, transaction.transaction_type, transaction.account_id, now, now, transaction.source_pending_transaction_id, transaction.source_pending];
        });

    console.log('transactionsToInsert.length', transactionsToInsert.length);

    const transactionsToUpdate: any[] = transactions
        .filter((transaction) => (dbExistingIdRows as RowDataPacket[]).some((existing) =>
            existing.source_transaction_id === transaction.source_transaction_id))
        .map((transaction) => {
            return [transaction.name, transaction.amount, transaction.date, transaction.source_transaction_id, transaction.transaction_type, transaction.account_id, now, now, transaction.source_pending_transaction_id, transaction.source_pending];
        });

    if (transactionsToInsert.length > 0) {
        const result = await (await dbPool()).query({
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

        console.log(JSON.stringify(result, null, 2));
    }

    console.log('transactionsToUpdate.length', transactionsToUpdate.length);

    if (transactionsToUpdate.length > 0) {
        await (await dbPool()).query(buildTransactionUpdate(transactionsToUpdate));
    }
}

function buildTransactionUpdate(transactions: ITransactionPreInsertED[]): string {
    let queryArray: string[] = [];

    transactions.forEach((transaction) => {
        queryArray.push(
            format(`UPDATE ${DBTable.transaction}
                       SET name = ?,
                           amount = ?,
                           date = ?,
                           transaction_type = ?,
                           account_id = ?,
                           updated_at = curdate(),
                           is_deleted = 0,
                           source_pending = ?,
                           source_pending_transaction_id = ?
                     WHERE source_transaction_id = ?`,
                [transaction.name,
                transaction.amount,
                transaction.date,
                transaction.transaction_type,
                transaction.account_id,
                transaction.source_pending,
                transaction.source_pending_transaction_id,
                transaction.source_transaction_id
                ]));
    });

    return queryArray.join("; ");
}

export async function deleteTransactions(transactionIds: string[]): Promise<void> {
    const pool = await dbPool();

    await pool.query({
        sql: `UPDATE ${DBTable.transaction}
                 SET is_deleted = 1
               WHERE source_transaction_id in (?)`,
        values: [transactionIds]
    });
}


export async function runRules(): Promise<void> {
    const pool = await dbPool();

    await pool.query(`
        update transaction t
                inner join rule r on lower(t.name) like lower(concat('%', r.check, '%'))
                inner join budget_item bi on r.category_id = bi.category_id
                inner join budget b on bi.budget_id = b.budget_id
        set t.budget_item_id = bi.budget_item_id
            where month(t.date) = month(curdate())
            and t.budget_item_id is null
            and b.month = month(curdate()) - 1`
    );
}