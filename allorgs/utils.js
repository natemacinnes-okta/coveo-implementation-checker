module.exports = {
  caseInsensitiveSort: function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  },
  htmlize: function (str) {
    return str.normalize('NFKD').replace(/[^\w]/g, '');
  }
}