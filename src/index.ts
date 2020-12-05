import bodyParser from 'body-parser';
import express, { Application } from 'express';
import transactionCollection from './dbPool';
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

                const collection = await transactionCollection();

                const existing = await collection.find({ transaction_id: { $in: [transactions.map((t) => t.transaction_id)] } }).toArray();
                const existingIds = existing.map((e) => e.transaction_id);

                const newOnes = transactions.filter((t) => !existingIds.includes(t.transaction_id));

                const insertResult = await collection.insertMany(newOnes);
            } else if (req.body.webhook_code === 'TRANSACTIONS_REMOVED') {
                console.log('is transactions removed')
                const { removed_transactions } = req.body;
                console.log(removed_transactions);

                const collection = await transactionCollection();

                await collection.deleteMany({ transaction_id: { $in: removed_transactions } });
            }
        }

        res.sendStatus(200);
    } catch (error) {
        res.status(500).json(error);
    }
});

// app.get('/incomeByYear/:year', async (req, res, _next) => {
//     const year = parseInt(req.params.year as string);
//     const income = await getIncomeByYear(year);

//     res.json(income);
// });

// app.get('/incomeByQuarter/:year', async (req, res, _next) => {
//     const year = parseInt(req.params.year as string);
//     const income = await getIncomeByYear(year);

//     res.json(income);
// });

app.listen(process.env.PORT);