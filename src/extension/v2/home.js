chrome.storage.sync.get(['allPages', 'pageCount', 'interval'], (result) => {
  if (result.allPages) {
    console.log('All pages selected');
  } else {
    console.log(`Page count: ${result.pageCount}`);
  }
  console.log(`Interval: ${result.interval} seconds`);
});
