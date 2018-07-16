const readXlsxFile = require('read-excel-file/node');
const excel = require('excel4node');
require('es6-promise').polyfill();
const fetch = require('isomorphic-fetch');

exports.mbuProcess = async function (event, context) {
  const filePath = process.argv[2];
  const bufferPath = [];
  const hostStatus = [];

  if (!filePath) {
    console.log('Missing: File Path');
    return;
  }

  await readXlsxFile(filePath).then((rows) => {
    rows.forEach((row) => {
      bufferPath.push(row[0]);
    });
  });

  Promise.all(bufferPath.map(host => fetch(host)
    .then(
      (response) => {
        const { status } = response;

        const obj = {
          host, status,
        };
        hostStatus.push(obj);
      },
      (error) => {
        const { code } = error;

        const obj = {
          host, status: code,
        };
        hostStatus.push(obj);
      },
    ))).then(() => {
    // Create a new instance of a Workbook class
    const workbook = new excel.Workbook();

    // Add Worksheets to the workbook
    const worksheet = workbook.addWorksheet('Sheet 1');

    hostStatus.forEach((host, idx) => {
      worksheet.cell(idx + 1, 1).string(host.host);
      if (Number.isInteger(host.status)) {
        worksheet.cell(idx + 1, 2).number(host.status);
      } else {
        worksheet.cell(idx + 1, 2).string(host.status);
      }
    });

    workbook.write('destinations.xlsx');
  });
};


exports.mbuProcess();
