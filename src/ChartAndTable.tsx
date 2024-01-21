import React from 'react';
import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper } from '@material-ui/core';
//import { Bar } from 'react-chartjs-2';

export const GraphAndTable = () => {
  // Example data for the chart
  const chartData = {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [
      {
        label: 'Monthly Sales',
        data: [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
    ],
  };

  // Example data for the table
  const tableData = [
    { month: 'January', sales: 12 },
    { month: 'February', sales: 19 },
    { month: 'March', sales: 3 },
    { month: 'April', sales: 5 },
    { month: 'May', sales: 2 },
  ];

  return (
    <div>
      <h1>Graph and Table Example</h1>
      
      {/* Material-UI Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Sales</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.sales}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Chart.js Bar Chart */}
      {/*<Bar data={chartData} />*/}

    </div>
  );
};

export default GraphAndTable;
