import { DBTable, ITransactionPreInsertED } from '@bjemo/budget-utils';
import { RowDataPacket, format } from 'mysql2';
import dbPool from './dbPool';

export async function insertTransactions(transactions: (ITransactionPreInsertED & { budget_item_id?: number })[]): Promise<void> {
    console.log('transactions.length', transactions.length);
    const pool = await dbPool();
    const allTransIds: string[] = transactions.map((transaction) => transaction.source_transaction_id);
    const allPendingTransIds: string[] = transactions
        .filter((transaction) => typeof transaction.source_pending_transaction_id === "string")
        .map((transaction) => transaction.source_pending_transaction_id) as string[];

    const [dbExistingIdRows] = await pool
        .query(`SELECT source_transaction_id
                      FROM ${DBTable.transaction}
                     WHERE source_transaction_id in (?)`,
            [allTransIds]
        );

    const [dbExistingPendingRows] = await pool
        .query(`SELECT source_transaction_id, budget_item_id
                    FROM ${DBTable.transaction}
                    WHERE source_transaction_id in (?)
                      AND is_deleted = 0`,
            [allPendingTransIds]
        );

    (dbExistingPendingRows as RowDataPacket[]).forEach((pendingRow) => {
        const trans = transactions.find((t) => t.source_pending_transaction_id === pendingRow.source_transaction_id);

        if (trans !== undefined) {
            trans.budget_item_id = pendingRow.budget_item_id;
        }
    })

    console.log('dbExistingIdRows.length', (dbExistingIdRows as RowDataPacket[]).length);
    console.log('dbExistingPendingRows.length', (dbExistingPendingRows as RowDataPacket[]).length);

    const now = new Date();

    const transactionsToInsert: any[] = transactions
        .filter((transaction) => (dbExistingIdRows as RowDataPacket[]).every((existing) =>
            existing.source_transaction_id !== transaction.source_transaction_id))
        .map((transaction) => {
            return [
                transaction.name,
                transaction.amount,
                transaction.date,
                transaction.source_transaction_id,
                transaction.transaction_type,
                transaction.account_id,
                now,
                now,
                transaction.source_pending_transaction_id,
                transaction.source_pending,
                transaction.budget_item_id ?? null];
        });

    console.log('transactionsToInsert.length', transactionsToInsert.length);

    const transactionsToUpdate: any[] = transactions
        .filter((transaction) => (dbExistingIdRows as RowDataPacket[]).some((existing) =>
            existing.source_transaction_id === transaction.source_transaction_id))
        .map((transaction) => {
            return [transaction.name, transaction.amount, transaction.date, transaction.source_transaction_id, transaction.transaction_type, transaction.account_id, now, now, transaction.source_pending_transaction_id, transaction.source_pending];
        });

    if (transactionsToInsert.length > 0) {
        const result = await pool.query({
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
                            source_pending,
                            budget_item_id
                        )
                      VALUES ?`,
            values: [transactionsToInsert]
        });

        console.log(JSON.stringify(result, null, 2));
    }

    console.log('transactionsToUpdate.length', transactionsToUpdate.length);

    if (transactionsToUpdate.length > 0) {
        await pool.query(buildTransactionUpdate(transactionsToUpdate));
    }

    if ((dbExistingPendingRows as RowDataPacket[]).length > 0) {
        await pool.query(buildPendingTransactionUpdate((dbExistingPendingRows as RowDataPacket[])
            .map((r) => r.source_transaction_id)));
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

function buildPendingTransactionUpdate(pendingTransactionIds: string[]): string {
    let queryArray: string[] = [];

    pendingTransactionIds.forEach((id) => {
        queryArray.push(
            format(`UPDATE ${DBTable.transaction}
                       SET is_deleted = ?
                     WHERE source_transaction_id = ?`,
                [
                    1,
                    id
                ]));
    });

    console.log(JSON.stringify(queryArray, null, 2));

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