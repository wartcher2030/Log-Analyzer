
// Formula compilation cache
const formulaCache = new Map<string, Function>();

/**
 * Safely compile a formula expression
 * Caches compiled formulas to avoid recompilation
 */
const compileFormula = (expression: string): Function => {
  if (formulaCache.has(expression)) {
    return formulaCache.get(expression)!;
  }
  
  try {
    // Validate expression safety (basic check)
    if (!isValidExpression(expression)) {
      throw new Error('Invalid formula syntax');
    }
    
    const compiled = new Function(`return (${expression})`);
    formulaCache.set(expression, compiled);
    return compiled;
  } catch (e) {
    console.error(`Failed to compile formula: ${expression}`, e);
    throw new Error(`Formula compilation failed: ${String(e).substring(0, 50)}`);
  }
};

/**
 * Basic expression validation to prevent code injection
 */
const isValidExpression = (expr: string): boolean => {
  // Allow: letters, numbers, operators, brackets, parentheses, spaces, dots, underscores
  // Disallow: semicolons, eval, Function constructor, etc.
  const disallowed = /[();]|eval|Function|constructor|prototype|__proto__/i;
  return !disallowed.test(expr);
};

export const applyFormulas = (rows: Record<string, any>[], formulas: { name: string, expression: string }[]) => {
  if (!rows || rows.length === 0) return rows;

  // Compile all formulas once
  const compiledFormulas = formulas.map(f => ({
    name: f.name,
    compiled: compileFormula(f.expression),
    original: f.expression
  })).filter(f => f.compiled);

  // Track historical values for LPF across rows
  const lpfStates: Record<string, number> = {};

  return rows.map((row, rowIndex) => {
    const newRow = { ...row };

    compiledFormulas.forEach(f => {
      try {
        let expr = f.original;

        // 1. Handle LPF(column, alpha) - pre-compile
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
