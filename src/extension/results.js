document.addEventListener('DOMContentLoaded', () => {
  // Retrieve the stored properties
  chrome.storage.local.get('properties', (result) => {
      const properties = result.properties || [];
      const tableBody = document.querySelector('#properties-table tbody');

      // Populate the table with row numbers
      properties.forEach((property, index) => {
          const row = document.createElement('tr');
          
          row.innerHTML = `
              <td>${index + 1}</td> <!-- Row number -->
              <td>${property.price || ''}</td>
              <td>${property.address || ''}</td>
              <td>${property.beds || ''}</td>
              <td>${property.baths || ''}</td>
              <td>${property.area || ''}</td>
              <td><a href="${property.link}" target="_blank">View</a></td>
          `;

          tableBody.appendChild(row);
      });
  });

  // Add event listener for CSV download
  document.getElementById('download-btn').addEventListener('click', downloadCSV);
});

// Function to convert data to CSV and trigger download
function downloadCSV() {
  chrome.storage.local.get('properties', (result) => {
      const properties = result.properties || [];
      if (properties.length === 0) {
          alert('No data to download.');
          return;
      }

      let csvContent = '#,Price,Address,Beds,Baths,Area,Link\n'; // Add row number column
      properties.forEach((property, index) => {
          const row = [
              index + 1, // Row number
              property.price,
              `"${property.address}"`, // Enclose in quotes to handle commas
              property.beds,
              property.baths,
              property.area,
              property.link
          ].join(',');
          csvContent += row + '\n';
      });

      // Create a blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'properties.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  });
}