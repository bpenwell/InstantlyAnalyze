document.addEventListener('DOMContentLoaded', () => {
    // Retrieve the stored properties
    chrome.storage.local.get('properties', (result) => {
      const properties = result.properties || [];
      const tableBody = document.querySelector('#properties-table-body');
  
      // Populate the table with row numbers
      properties.forEach((property, index) => {
        const row = document.createElement('tr');
  
        // Add 'is-pro' class for properties beyond the 25th
        if (index >= 25) {
          row.classList.add('is-pro');
        }
  
        row.innerHTML = `
          <td class="has-text-right">${index + 1}</td>
          <td>
            <a target="_blank" href="${property.property_url || '#'}">
              ${property.zpid || ''}
            </a>
          </td>
          <td>
            <a target="_blank" href="${property.property_url || '#'}">
              <figure class="image is-128x128" style="width: 128px; height: 100px;">
                <img src="${property.img_src || ''}" style="width: 160px; height: auto;">
              </figure>
            </a>
          </td>
          <td>${property.status_type || ''}</td>
          <td>${property.status_text || ''}</td>
          <td>${property.time_on_zillow || ''}</td>
          <td class="has-text-right">${property.beds || ''}</td>
          <td class="has-text-right">${property.baths || ''}</td>
          <td class="has-text-right">${property.price || ''}</td>
          <td class="has-text-right">${property.area || ''}</td>
          <td class="has-text-right">${property.price_per_sqft || ''}</td>
          <td class="has-text-right">${property.lot_area || ''}</td>
          <td class="has-text-right">${property.zestimate || ''}</td>
          <td class="has-text-right">${property.zestimate_price_per_sqft || ''}</td>
          <td class="has-text-right">${property.rent_zestimate || ''}</td>
          <td>${property.address || ''}</td>
          <td>${property.street || ''}</td>
          <td>${property.city || ''}</td>
          <td>${property.state || ''}</td>
          <td>${property.zipcode || ''}</td>
          <td class="has-text-right">${property.latitude || ''}</td>
          <td class="has-text-right">${property.longitude || ''}</td>
          <td>${property.is_zillow_owned || ''}</td>
          <td>${property.broker_name || ''}</td>
          <td>${property.sold_date || ''}</td>
          <td>${property.sold_price || ''}</td>
          <td>
            <a target="_blank" href="${property.search_page_url || '#'}">
              Search Page URL
            </a>
          </td>
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
  
      // CSV header
      let csvContent =
        '#,zpid,Image,Status Type,Status Text,Time On Zillow,Beds,Bathrooms,Price,Area,Price Per Sqft,Lot Area,Zestimate,Zestimate Price Per Sqft,Rent Zestimate,Address,Street,City,State,Zipcode,Latitude,Longitude,Is Zillow Owned,Broker Name,Sold Date,Sold Price,Search Page URL\n';
  
      properties.forEach((property, index) => {
        const row = [
          index + 1, // Row number
          property.zpid || '',
          property.img_src || '',
          property.status_type || '',
          property.status_text || '',
          property.time_on_zillow || '',
          property.beds || '',
          property.baths || '',
          property.price || '',
          property.area || '',
          property.price_per_sqft || '',
          property.lot_area || '',
          property.zestimate || '',
          property.zestimate_price_per_sqft || '',
          property.rent_zestimate || '',
          `"${property.address || ''}"`, // Enclose in quotes to handle commas
          `"${property.street || ''}"`,
          property.city || '',
          property.state || '',
          property.zipcode || '',
          property.latitude || '',
          property.longitude || '',
          property.is_zillow_owned || '',
          `"${property.broker_name || ''}"`,
          property.sold_date || '',
          property.sold_price || '',
          property.search_page_url || '',
        ].join(',');
  
        csvContent += row + '\n';
      });
  
      // Create a blob and trigger download
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
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