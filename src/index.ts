import bodyParser from 'body-parser';
import express, { Application } from 'express';
import { deleteTransactions, insertTransactions, runRules } from './dbService';
import { getTransactions, setupClient } from './plaidService';

setupClient();

const app: Application = express();

app.use(bodyParser.json());

app.post("*", async (req, res) => {
    console.log(req.url, req.body);
    try {
        if (req.body.webhook_type === 'TRANSACTIONS') {
            console.log("is transactions")
            if (req.body.webhook_code === 'DEFAULT_UPDATE') {
                console.log('is default update')
                const transactions = await getTransactions();
                await insertTransactions(transactions);

                await runRules();
            } else if (req.body.webhook_code === 'TRANSACTIONS_REMOVED') {
                console.log('is transactions removed')
                const { removed_transactions } = req.body;
                console.log(removed_transactions);
                await deleteTransactions(removed_transactions);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        res.status(500).json(error);
    }
});

app.listen(process.env.PORT);