export const validateRecordCards = (cards) => {
  for (let i = 0; i < cards.length; i++) {
    const card  = cards[i];
    const label = `Card #${i + 1}`;

    if (!card.regNo && card.regNo !== 0) return { message: `${label}: Equipment Reg No required`, type: 'error',   textColor: '#ffffff' };
    if (!card.machine)                   return { message: `${label}: Equipment Name required`,   type: 'error',   textColor: '#ffffff' };
    if (!card.date)                      return { message: `${label}: Date required`,              type: 'error',   textColor: '#ffffff' };
    if (!card.location)                  return { message: `${label}: Location required`,          type: 'warning', textColor: '#000000' };
    if (!card.mechanics)                 return { message: `${label}: Mechanics required`,         type: 'warning', textColor: '#000000' };
  }

  return null;
};