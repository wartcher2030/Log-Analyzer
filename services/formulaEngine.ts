
export const applyFormulas = (rows: Record<string, any>[], formulas: { name: string, expression: string }[]) => {
  if (!rows || rows.length === 0) return rows;

  // Track historical values for LPF across rows
  const lpfStates: Record<string, number> = {};

  return rows.map((row, rowIndex) => {
    const newRow = { ...row };

    formulas.forEach(f => {
      try {
        let expr = f.expression;

        // 1. Handle LPF(column, alpha)
        const lpfRegex = /LPF\(\s*\[([^\]]+)\]\s*,\s*([\d.]+)\s*\)/gi;
        expr = expr.replace(lpfRegex, (_, colName, alphaStr) => {
          const val = Number(newRow[colName]) || 0;
          const alpha = parseFloat(alphaStr);
          const stateKey = `${f.name}_${colName}_${alphaStr}`;
          
          if (rowIndex === 0) {
            lpfStates[stateKey] = val;
          } else {
            lpfStates[stateKey] = lpfStates[stateKey] + alpha * (val - lpfStates[stateKey]);
          }
          return lpfStates[stateKey].toString();
        });

        // 2. Replace [ColumnName] with current row values
        // If the value is a string, wrap it in quotes for the JS evaluator
        const colRegex = /\[([^\]]+)\]/g;
        expr = expr.replace(colRegex, (_, colName) => {
          const val = newRow[colName];
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "\\'")}'`;
          }
          return typeof val === 'number' ? val.toString() : '0';
        });

        // 3. Handle standard math functions
        expr = expr.replace(/ABS\(([^)]+)\)/gi, 'Math.abs($1)');
        
        // Handle IF logic (Regex improved for nested commas)
        // IF(condition, trueVal, falseVal)
        expr = expr.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, '($1 ? $2 : $3)');

        // 4. Final Evaluation
        const result = new Function(`return (${expr})`)();
        newRow[f.name] = (typeof result === 'number' && isNaN(result)) ? 0 : result;
      } catch (e) {
        console.error(`Error in formula ${f.name}:`, e);
        newRow[f.name] = 0;
      }
    });

    return newRow;
  });
};
