export const getAvailableThemes = (tableData, adjectivesTableData) => {
  const nounsThemes = new Set();
  tableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) nounsThemes.add(v);
  });

  const adjThemes = new Set();
  adjectivesTableData.forEach(row => {
    const v = row['Урок название'];
    if (v && v.trim()) adjThemes.add(v);
  });

  const allThemes = new Set([...nounsThemes, ...adjThemes]);
  return Array.from(allThemes).sort();
};