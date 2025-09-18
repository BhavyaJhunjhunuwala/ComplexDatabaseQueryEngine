const fs = require('fs').promises;
const { Parser } = require('json2csv');

async function exportToCSV(data, filename) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }
  const parser = new Parser({ fields: Object.keys(data[0]) });
  const csv = parser.parse(data);
  await fs.writeFile(filename, csv);
}

module.exports = { exportToCSV };