// import transactionCollection from './dbPool'

// /**
//  * Needs:
//  *      next month's income
//  *      tax dates
//  *      group income, taxes, net by month & by quater
//  */

// enum Month {
//     JAN = 1,
//     FEB,
//     MAR,
//     APR,
//     MAY,
//     JUN,
//     JUL,
//     AUG,
//     SEP,
//     OCT,
//     NOV,
//     DEC
// }

// export async function getIncomeByYear(year: number) {
//     const collection = await transactionCollection();

//     const transactions = (await collection.find<TransactionPlus>()
//         .toArray())
//         .filter((t: TransactionPlus) => {
//             const date = new Date(t.date).getTime();
//             const startOfTaxYear = Date.parse(`1/15/${year}`);
//             const endOfTaxYear = Date.parse(`1/15/${year + 1}`);

//             return date >= startOfTaxYear && date < endOfTaxYear;
//         });

//     const result: Record<string, { income: number | string, expense: number | string, running: number | string }> = {};

//     [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach((num) => {
//         const yearForKey = num === 13 ? year + 1 : year;
//         const monthForKey = num === 13 ? Month[1] : Month[num];

//         const key = `${monthForKey} ${yearForKey}`;

//         result[key] = {
//             income: 0,
//             expense: 0,
//             running: 0
//         };
//     });

//     transactions.forEach((trans) => {
//         const income = (trans?.amount ?? 0) < 0;
//         const amount: number = Math.abs(trans?.amount ?? 0);

//         const month = new Date(trans.date).getMonth() + 1;

//         if (income === true) {
//             if (month in result) {
//                 result[month].income = result[month].income as number + amount;
//             } else {
//                 result[month].income = amount;
//             }
//         } else {
//             if (month in result) {
//                 result[month].expense = result[month].expense as number + amount;
//             } else {
//                 result[month].expense = amount;
//             }
//         }
//     });

//     for (const key in result) {
//         result[key].running = (result[key].income as number - (result[key].expense as number)).toFixed(2);

//         result[key].income = (result[key].income as number).toFixed(2)
//         result[key].expense = (result[key].expense as number).toFixed(2)
//     }

//     return result;
// }

// export async function getIncomeByQuarter(year: number) {
//     const collection = await transactionCollection();

//     const transactions = (await collection.find<TransactionPlus>()
//         .toArray())
//         .filter((t: TransactionPlus) => {
//             if (year !== undefined) {
//                 return new Date(t.date).getFullYear() === year;
//             } else {
//                 return;
//             }
//         });

//     const result: Record<number, { startDate: string, endDate: string, income: number | string, expense: number | string, running: number | string }> = {};

//     [1, 2, 3, 4].forEach((num) => {
//         result[num] = {
//             startDate: `${1 + (num - 1) * 3}/15/${year}`
//             income: 0,
//             expense: 0,
//             running: 0
//         };
//     });

//     transactions.forEach((trans) => {
//         const income = (trans?.amount ?? 0) < 0;
//         const amount: number = Math.abs(trans?.amount ?? 0);

//         const month = new Date(trans.date).getMonth() + 1;

//         if (income === true) {
//             if (month in result) {
//                 result[month].income = result[month].income as number + amount;
//             } else {
//                 result[month].income = amount;
//             }
//         } else {
//             if (month in result) {
//                 result[month].expense = result[month].expense as number + amount;
//             } else {
//                 result[month].expense = amount;
//             }
//         }
//     });

//     for (const key in result) {
//         result[key].running = (result[key].income as number - (result[key].expense as number)).toFixed(2);

//         result[key].income = (result[key].income as number).toFixed(2)
//         result[key].expense = (result[key].expense as number).toFixed(2)
//     }

//     return result;
// }