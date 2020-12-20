import transactionCollection from "./dbPool";
import { TransactionPlus } from "./plaidService";

enum Month {
  JAN = 1,
  FEB,
  MAR,
  APR,
  MAY,
  JUN,
  JUL,
  AUG,
  SEP,
  OCT,
  NOV,
  DEC
}

export async function getIncomeByYear(year: number, showTrans: boolean) {
  const collection = await transactionCollection();

  const transactions = (await collection.find<TransactionPlus>().toArray())
    .filter((t: TransactionPlus) => {
      const date = new Date(t.date).getTime();
      const startOfTaxYear = Date.parse(`1/15/${year}`);
      const endOfTaxYear = Date.parse(`1/15/${year + 1}`);

      return date >= startOfTaxYear && date < endOfTaxYear;
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const result: Record<string, { income: number | string; expense: number | string; running: number | string; trans: any[] }> = {};

  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach((num) => {
    const yearForKey = num === 13 ? year + 1 : year;
    const monthForKey = num === 13 ? Month[1] : Month[num];

    const key = `${monthForKey} ${yearForKey}`;

    result[key] = {
      income: 0,
      expense: 0,
      running: 0,
      trans: []
    };
  });

  transactions.forEach((trans) => {
    const income = (trans?.amount ?? 0) < 0;
    const amount: number = Math.abs(trans?.amount ?? 0);

    const key = `${Month[trans.month]} ${trans.fiscal_year}`;

    if (showTrans) {
      result[key].trans.push({
        amount: (trans.amount! * -1).toFixed(2),
        date: trans.date
      });
    }

    if (income === true) {
      if (key in result) {
        result[key].income = (result[key].income as number) + amount;
      } else {
        result[key].income = amount;
      }
    } else {
      if (key in result) {
        result[key].expense = (result[key].expense as number) + amount;
      } else {
        result[key].expense = amount;
      }
    }
  });

  for (const key in result) {
    result[key].running = ((result[key].income as number) - (result[key].expense as number)).toFixed(2);

    result[key].income = (result[key].income as number).toFixed(2);
    result[key].expense = (result[key].expense as number).toFixed(2);
  }

  return result;
}

export async function getIncomeByQuarter(year: number, showTrans: boolean) {
  const collection = await transactionCollection();

  const transactions = (await collection.find<TransactionPlus>().toArray())
    .filter((t: TransactionPlus) => {
      if (year !== undefined) {
        return new Date(t.date).getFullYear() === year;
      } else {
        return;
      }
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const result: Record<
    string,
    { startDate: string; endDate: string; trans: any[]; income: number | string; expense: number | string; running: number | string }
  > = {};

  [1, 2, 3, 4].forEach((num) => {
    const key = `Q${num} ${year}`;
    result[key] = {
      startDate: `${1 + (num - 1) * 3}/15/${year}`,
      endDate: `${(1 + num * 3) % 12}/15/${1 + num * 3 > 12 ? year + 1 : year}`,
      income: 0,
      expense: 0,
      running: 0,
      trans: []
    };
  });

  transactions.forEach((trans) => {
    const income = (trans?.amount ?? 0) < 0;
    const amount: number = Math.abs(trans?.amount ?? 0);

    const key = `Q${trans.quarter} ${trans.fiscal_year}`;

    if (showTrans) {
      result[key].trans.push({
        amount: (trans.amount! * -1).toFixed(2),
        date: trans.date
      });
    }

    if (income === true) {
      if (key in result) {
        result[key].income = (result[key].income as number) + amount;
      } else {
        result[key].income = amount;
      }
    } else {
      if (key in result) {
        result[key].expense = (result[key].expense as number) + amount;
      } else {
        result[key].expense = amount;
      }
    }
  });

  for (const key in result) {
    result[key].running = ((result[key].income as number) - (result[key].expense as number)).toFixed(2);

    result[key].income = (result[key].income as number).toFixed(2);
    result[key].expense = (result[key].expense as number).toFixed(2);
  }

  return result;
}
