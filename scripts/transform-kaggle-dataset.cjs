#!/usr/bin/env node
/**
 * transform-kaggle-dataset.js
 * 
 * Reads the IBM Telco Customer Churn CSV (fetched from GitHub),
 * maps it to SubVault Subscription + Invoice schema,
 * and outputs initialSubscriptions + initialInvoices TypeScript arrays.
 * 
 * Run: node transform-kaggle-dataset.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CSV_URL = 'https://raw.githubusercontent.com/treselle-systems/customer_churn_analysis/master/WA_Fn-UseC_-Telco-Customer-Churn.csv';

function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  });
}

// Map Telco contract type → SubVault billing interval
function mapInterval(contract) {
  if (contract === 'Two year' || contract === 'One year') return 'yearly';
  return 'monthly';
}

// Map Telco monthly charges → SubVault plan tier
function mapPlan(monthlyCharge) {
  const charge = parseFloat(monthlyCharge) || 0;
  if (charge >= 85) return 'Enterprise';
  if (charge >= 45) return 'Pro';
  return 'Basic';
}

// Map plan+interval → INR amount
function mapAmount(plan, interval) {
  const prices = {
    Basic:      { monthly: 1500,  yearly: 15000  },
    Pro:        { monthly: 4000,  yearly: 40000  },
    Enterprise: { monthly: 25000, yearly: 250000 },
  };
  return prices[plan][interval];
}

// Map Telco Churn field + contract → SubVault status
function mapStatus(churn, contract, tenure) {
  if (churn === 'Yes') return 'Cancelled';
  if (parseInt(tenure) <= 2 && contract === 'Month-to-month') return 'Trialing';
  return 'Active';
}

// Generate a billing date offset by tenure months back
function pastDate(monthsAgo) {
  const d = new Date();
  d.setMonth(d.getMonth() - parseInt(monthsAgo));
  return d.toISOString().split('T')[0];
}

function nextDate(interval) {
  const d = new Date();
  if (interval === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log('Fetching Kaggle / IBM Telco churn dataset...');
  const csv = await fetchCSV(CSV_URL);
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} customer records.`);

  // Take first 60 rows for a rich but manageable seed dataset
  const sample = rows.slice(0, 60);

  const subscriptions = [];
  const invoices = [];

  sample.forEach((row, i) => {
    const customerId = row['customerID'] || `cust_${i}`;
    const email = `${customerId.toLowerCase().replace('-', '.')}@telco-saas.in`;
    const interval = mapInterval(row['Contract']);
    const plan = mapPlan(row['MonthlyCharges']);
    const amount = mapAmount(plan, interval);
    const status = mapStatus(row['Churn'], row['Contract'], row['tenure']);
    const tenure = parseInt(row['tenure']) || 1;
    const createdAt = pastDate(tenure);
    const nextBillingDate = status === 'Cancelled' ? pastDate(0) : nextDate(interval);

    const sub = {
      id: `sub_tlc_${customerId.replace('-', '_')}`,
      userId: `usr_tlc_${i.toString().padStart(4, '0')}`,
      userEmail: email,
      plan,
      status,
      amount,
      interval,
      createdAt,
      nextBillingDate,
      ...(status === 'Trialing' ? { trialDaysLeft: Math.floor(Math.random() * 12) + 3 } : {}),
    };
    subscriptions.push(sub);

    // Generate 1-3 invoices per subscription based on tenure
    const invoiceCount = Math.min(Math.ceil(tenure / 12), 3);
    for (let j = 0; j < invoiceCount; j++) {
      const monthsAgo = j * (interval === 'yearly' ? 12 : 1);
      const invStatus = (status === 'Cancelled' && j === 0) ? 'Failed' : 'Paid';
      invoices.push({
        id: `inv_tlc_${customerId.replace('-', '_')}_${j}`,
        subscriptionId: sub.id,
        userEmail: email,
        plan,
        amount,
        status: invStatus,
        createdAt: pastDate(monthsAgo),
      });
    }
  });

  // Generate TypeScript output
  const subLines = subscriptions.map(s => {
    const trialPart = s.trialDaysLeft ? `, trialDaysLeft: ${s.trialDaysLeft}` : '';
    return `  { id: '${s.id}', userId: '${s.userId}', userEmail: '${s.userEmail}', plan: '${s.plan}', status: '${s.status}', amount: ${s.amount}, interval: '${s.interval}'${trialPart}, createdAt: '${s.createdAt}', nextBillingDate: '${s.nextBillingDate}' },`;
  }).join('\n');

  const invLines = invoices.map(inv => 
    `  { id: '${inv.id}', subscriptionId: '${inv.subscriptionId}', userEmail: '${inv.userEmail}', plan: '${inv.plan}', amount: ${inv.amount}, status: '${inv.status}', createdAt: '${inv.createdAt}' },`
  ).join('\n');

  const output = `// AUTO-GENERATED from IBM Telco Customer Churn Dataset (Kaggle)
// Source: https://www.kaggle.com/datasets/blastchar/telco-customer-churn
// ${subscriptions.length} subscriptions, ${invoices.length} invoices

export const kaggleSubscriptions = [
${subLines}
];

export const kaggleInvoices = [
${invLines}
];
`;

  const outPath = path.join(__dirname, 'src', 'data', 'kaggleDataset.ts');
  require('fs').mkdirSync(path.join(__dirname, 'src', 'data'), { recursive: true });
  require('fs').writeFileSync(outPath, output, 'utf8');
  console.log(`\n✅ Written ${subscriptions.length} subscriptions + ${invoices.length} invoices to:\n   ${outPath}`);

  // Print stats
  const plans = { Basic: 0, Pro: 0, Enterprise: 0 };
  const statuses = {};
  subscriptions.forEach(s => {
    plans[s.plan]++;
    statuses[s.status] = (statuses[s.status] || 0) + 1;
  });
  console.log('\nPlan distribution:', plans);
  console.log('Status distribution:', statuses);
  console.log('Total invoices:', invoices.length);
}

main().catch(console.error);
