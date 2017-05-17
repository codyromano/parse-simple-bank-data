'use strict';

const json = require('./transactions');
const records = json.transactions;

function getAmount(record) {
  // Convert amount to USD
  return record.amounts.amount / 10000;
}

function getCategory(record) {
  return record.categories[0].name;
}

function parseAmount(amount) {
  return parseFloat(
    amount.toPrecision(4)
  );
}

function formatCash(number) {
    const withCommas = number.toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return '$' + withCommas;
}

function getTimestamp(record) {
  return new Date(
    record.times.when_recorded_local
  ).getTime();
}

function filterByDate(startDate, endDate, records) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return records.filter(record => {
    const time = getTimestamp(record);
    return time >= startTime && time <= endTime;
  });
}

function filterByBookType(type, records) {
  type = type.toLowerCase();

  return records.filter(record => {
    const recordType = record.bookkeeping_type.toLowerCase();
    return recordType === type;
  });
}

function filterByCategory(category, records) {
  return records.filter(record => {
    return getCategory(record) === category
  });
}

function groupSpendingByKey(keyFn, records) {
  return records.reduce((result, record) => {
    const key = keyFn(record);

    result[key] = parseAmount(
      (result[key] || 0) +
      getAmount(record)
    );
    return result;
  }, {});
}

const getTotalSpendByDesc = groupSpendingByKey.bind(
  null,
  record => record.description
);

const getTotalSpendByCategory = groupSpendingByKey.bind(
  null,
  record => getCategory(record)
);

function sortByValues(obj) {
  let sortable = [];
  for (const key in obj) {
    const value = obj[key];
    sortable.push({key, value});
  }
  return sortable.sort((a, b) => b.value - a.value);
}

const debits = filterByBookType(
  'debit',
  records
);

let lastMonth = new Date();
lastMonth.setDate(lastMonth.getMonth() - 1);

// Transactions in the last month
const recent = filterByDate(
  lastMonth,
  new Date(),
  debits
);

const values = sortByValues(
  getTotalSpendByCategory(recent)
).map(obj => {
  const cash = formatCash(
    Math.round(obj.value)
  );
  return `${cash}...${obj.key}`
});

console.log(
  values.join('\n')
);


