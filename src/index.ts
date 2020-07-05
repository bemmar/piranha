import express, { Application } from 'express';
import bodyParser from 'body-parser'
import { setupClient, getTransactions } from './plaidService';
import { insertTransactions, deleteTransactions } from './dbService';

setupClient();

const app: Application = express();

app.use(bodyParser.json());

app.post("*", async (req, res) => {
    if (req.body.webook_type === 'TRANSACTIONS') {
        if (req.body.webhook_code === 'DEFAULT_UPDATE') {
            const transactions = await getTransactions();
            await insertTransactions(transactions);
        } else if (req.body.webhook_code === 'TRANSACTIONS_REMOVED') {
            const { removed_transactions } = req.body;
            await deleteTransactions(removed_transactions);
        }
    }

    res.sendStatus(200);
});

app.listen(process.env.PORT);