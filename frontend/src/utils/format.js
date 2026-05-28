export function formatMoney(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮';
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('mn-MN').format(n);
}
