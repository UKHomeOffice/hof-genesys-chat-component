const formatDate = (dateToFormat) => {
  const time = new Date(dateToFormat);
  if (Number.isNaN(time.getTime())) {
    return 'Invalid Date';
  }
  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(time);

  return formattedTime;
};

const stringsAreEqualIgnoringCase = (str1, str2) => {
  return str1.toLowerCase() === str2.toLowerCase();
};

export {
  formatDate,
  stringsAreEqualIgnoringCase
};
