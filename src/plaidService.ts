import { addDays } from "date-fns";
import { Client as PlaidClient, environments, Transaction, TransactionsResponse } from "plaid";

let plaidClient: PlaidClient;

export function setupClient(): PlaidClient {
  try {
    plaidClient = new PlaidClient(
      process.env.PLAID_CLIENT_ID!,
      process.env.PLAID_SECRET!,
      process.env.PLAID_PUBLIC_KEY!,
      environments[process.env.PLAID_ENV!],
      {
        version: "2019-05-29"
      }
    );
  } catch (error) {
    console.error("setupClient", error);
  }

  return plaidClient;
}

export interface TransactionPlus extends Transaction {
  fiscal_year: number;
  month: number;
  quarter: number;
}

export async function getTransactions(): Promise<TransactionPlus[]> {
  const transactionResponse: TransactionsResponse = await plaidClient.getTransactions(
    process.env.PLAID_ACCESS_TOKEN!,
    addDays(new Date(), -30).toISOString().slice(0, 10),
    addDays(new Date(), 2).toISOString().slice(0, 10)
  );

  return transactionResponse.transactions
    .filter((t) => t.pending === false)
    .map((t) => {
      const date = new Date(t.date);
      const fiscal_year = date.getMonth() === 0 && date.getDate() < 15 ? date.getFullYear() - 1 : date.getFullYear();
      let quarter = 1;

      if (fiscal_year < date.getFullYear()) {
        quarter = 4;
      } else if ([0, 1, 2, 3].includes(date.getMonth())) {
        if (date.getMonth() === 3) {
          if (date.getDate() < 15) {
            quarter = 1;
          } else {
            quarter = 2;
          }
        } else {
          quarter = 1;
        }
      } else if ([3, 4, 5, 6].includes(date.getMonth())) {
        if (date.getMonth() === 6) {
          if (date.getDate() < 15) {
            quarter = 2;
          } else {
            quarter = 3;
          }
        } else {
          quarter = 2;
        }
      } else if ([6, 7, 8, 9].includes(date.getMonth())) {
        if (date.getMonth() === 9) {
          if (date.getDate() < 15) {
            quarter = 3;
          } else {
            quarter = 4;
          }
        } else {
          quarter = 3;
        }
      } else if ([9, 10, 11, 0].includes(date.getMonth())) {
        if (date.getMonth() === 0) {
          if (date.getDate() < 15) {
            quarter = 4;
          } else {
            quarter = 1;
          }
        } else {
          quarter = 4;
        }
      }

      return {
        ...t,
        fiscal_year,
        month: date.getMonth() + 1,
        quarter
      };
    });
}
