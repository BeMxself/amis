function reduceSdkCssCalc(code) {
  return reduceCalcFunctions(code);
}

function reduceCalcFunctions(code) {
  let result = '';

  for (let index = 0; index < code.length; ) {
    const char = code[index];

    if (char === '/' && code[index + 1] === '*') {
      const commentEnd = code.indexOf('*/', index + 2);

      if (commentEnd === -1) {
        result += code.slice(index);
        break;
      }

      result += code.slice(index, commentEnd + 2);
      index = commentEnd + 2;
      continue;
    }

    if (char === '"' || char === "'") {
      const stringEnd = findStringEnd(code, index);

      result += code.slice(index, stringEnd + 1);
      index = stringEnd + 1;
      continue;
    }

    if (!isCalcStart(code, index)) {
      result += char;
      index++;
      continue;
    }

    const expressionStart = index + 'calc('.length;
    const expressionEnd = findMatchingParen(code, expressionStart - 1);

    if (expressionEnd === -1) {
      result += code.slice(index);
      break;
    }

    result += reduceCalcExpression(code.slice(expressionStart, expressionEnd));
    index = expressionEnd + 1;
  }

  return result;
}

function isCalcStart(code, index) {
  return (
    /^calc\(/i.test(code.slice(index, index + 'calc('.length)) &&
    isIdentifierBoundary(code, index - 1)
  );
}

function isIdentifierBoundary(code, index) {
  return index < 0 || !/[a-z0-9_-]/i.test(code[index]);
}

function findMatchingParen(code, openParenIndex) {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = openParenIndex; index < code.length; index++) {
    const char = code[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function findStringEnd(code, startIndex) {
  const quote = code[startIndex];
  let escaped = false;

  for (let index = startIndex + 1; index < code.length; index++) {
    const char = code[index];

    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === quote) {
      return index;
    }
  }

  return code.length - 1;
}

function reduceCalcExpression(expression) {
  const reduced = reduceArithmetic(expression);

  if (isSingleNumericTerm(reduced)) {
    return reduced;
  }

  return `calc(${reduced})`;
}

function reduceArithmetic(expression) {
  let previous;
  let next = normalizeExpression(expression);

  do {
    previous = next;
    next = reduceParenthesizedNumber(next);
    next = reduceDivision(next);
    next = reduceMultiplication(next);
    next = reduceAdditionSubtraction(next);
    next = normalizeExpression(next);
  } while (next !== previous);

  return next;
}

function normalizeExpression(expression) {
  return expression
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s*([*/])\s*/g, ' $1 ')
    .replace(/\s*([+])\s*/g, ' $1 ')
    .replace(/\s+-\s+/g, ' - ')
    .trim();
}

function reduceParenthesizedNumber(expression) {
  return expression.replace(
    /(^|[^a-z0-9_-])\(\s*([+-]?(?:\d+\.\d+|\d+|\.\d+)(?:[a-z%]+)?)\s*\)/gi,
    (_, prefix, value) => prefix + value
  );
}

function reduceDivision(expression) {
  return expression.replace(
    /([+-]?(?:\d+\.\d+|\d+|\.\d+))([a-z%]+)?\s*\/\s*([+-]?(?:\d+\.\d+|\d+|\.\d+))(?![a-z%])/gi,
    (_, left, unit, right) => formatNumericTerm(Number(left) / Number(right), unit)
  );
}

function reduceMultiplication(expression) {
  return expression
    .replace(
      /([+-]?(?:\d+\.\d+|\d+|\.\d+))([a-z%]+)?\s*\*\s*([+-]?(?:\d+\.\d+|\d+|\.\d+))(?![a-z%])/gi,
      (_, left, unit, right) =>
        formatNumericTerm(Number(left) * Number(right), unit)
    )
    .replace(
      /([+-]?(?:\d+\.\d+|\d+|\.\d+))(?![a-z%])\s*\*\s*([+-]?(?:\d+\.\d+|\d+|\.\d+))([a-z%]+)/gi,
      (_, left, right, unit) =>
        formatNumericTerm(Number(left) * Number(right), unit)
    );
}

function reduceAdditionSubtraction(expression) {
  return expression
    .replace(
      /([+-]?(?:\d+\.\d+|\d+|\.\d+))([a-z%]+)\s*([+-])\s*([+-]?(?:\d+\.\d+|\d+|\.\d+))\2/gi,
      (_, left, unit, operator, right) =>
        formatNumericTerm(applyOperator(left, operator, right), unit)
    )
    .replace(
      /([+-]?(?:\d+\.\d+|\d+|\.\d+))(?![a-z%])\s*([+-])\s*([+-]?(?:\d+\.\d+|\d+|\.\d+))(?![a-z%])/gi,
      (_, left, operator, right) =>
        formatNumber(applyOperator(left, operator, right))
    );
}

function applyOperator(left, operator, right) {
  return operator === '+'
    ? Number(left) + Number(right)
    : Number(left) - Number(right);
}

function isSingleNumericTerm(value) {
  return /^[+-]?(?:\d+\.\d+|\d+|\.\d+)(?:[a-z%]+)?$/i.test(value);
}

function formatNumericTerm(value, unit) {
  return formatNumber(value) + (unit || '');
}

function formatNumber(value) {
  return Number(value.toFixed(10)).toString();
}

module.exports = {
  reduceSdkCssCalc
};
