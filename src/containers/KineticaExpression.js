const functions = {
  logical: ["CASE", "IF"],
};

const sanitize = (formula) => {
  let f = formula.replace(/\s+/g, " ").trim();
  f = f.replace(/(\(|\))/g, " $1 ");
  f = f.replace(/{/g, " { ");
  f = f.replace(/}/g, " } ");
  f = f.replace(/,/g, " , ");
  f = f.replace(/\r/g, "");
  f = f.replace(/\n/g, "");
  return f;
};

const getNextExpression = (tokens, stopTokens) => {
  console.log("getNextExpression: ", tokens, stopTokens);
  const expression = [];
  while (stopTokens.indexOf(tokens[0]?.toUpperCase()) === -1) {
    let v = tokens.shift();
    // // remove starting and trailing double quotes
    // if (v?.startsWith('"') && v?.endsWith('"')) {
    //   v = v.slice(1, -1);
    // }
    // // single quotes
    // if (v?.startsWith('\'') && v?.endsWith('\'')) {
    //   v = v.slice(1, -1);
    // }
    expression.push(v);
    if (tokens.length === 0) {
      break;
    }
  }
  const r = { expression, remainingTokens: tokens, stopToken: tokens.shift() };
  console.log("getNextExpression: ", r);
  return r;
};

const getParseFunction = (token) => {
  console.log(">>>getParseFunction: ", token);
  const types = Object.keys(functions);
  for (let j = 0; j < types.length; j++) {
    const type = types[j];
    if (functions[type].includes(token.toUpperCase())) {
      console.log(
        "<<<getParseFunction: ",
        type,
        parseFunctions[token.toUpperCase()]
      );
      return {
        type: type,
        functionName: token.toUpperCase(),
        parseFunction: parseFunctions[token.toUpperCase()],
      };
    }
  }
};

const parseIF = async (tokens) => {
  console.log(">>>parseIF: ", tokens);

  if (tokens[0].toUpperCase() !== "IF") {
    throw new Error("Invalid IF statement");
  }

  if (tokens.lastIndexOf(")") === -1) {
    throw new Error("Invalid IF statement: Did not find END");
  }

  let _tokens = tokens.slice();
  _tokens.shift();

  let ifExpression;
  let valueIfTrue;
  let valueIfFalse;
  let e = {};
  e = getNextExpression(_tokens, ["("]);
  e = getNextExpression(e.remainingTokens, [","]);
  if (e.expression) {
    ifExpression = e.expression;
  }

  e = getNextExpression(e.remainingTokens, [",", "IF", "CASE"]);
  if (
    e.stopToken.toUpperCase() === "IF" ||
    e.stopToken.toUpperCase() === "CASE"
  ) {
    let e1 = {};
    e1 = getNextExpression(e.remainingTokens, [")"]);
    if (e1.expression) {
      valueIfTrue = e1.expression;
      valueIfTrue.unshift(e.stopToken);
      valueIfTrue.push(")");
    }
  } else if (e.expression) {
    valueIfTrue = e.expression;
  }

  e = getNextExpression(e.remainingTokens, [")", "IF", "CASE"]);
  if (
    e.stopToken.toUpperCase() === "IF" ||
    e.stopToken.toUpperCase() === "CASE"
  ) {
    let e1 = {};
    e1 = getNextExpression(e.remainingTokens, [")"]);
    if (e1.expression) {
      valueIfFalse = e1.expression;
      valueIfFalse.unshift(e.stopToken);
      valueIfFalse.push(")");
    }
  } else if (e.expression) {
    valueIfFalse = e.expression;
  }

  // cleanup true and false nodes
  // this should be revisited and cleaned up in the lower-level parsing code
  if (
    (valueIfTrue[0]?.toUpperCase() === "IF" ||
      valueIfTrue[1]?.toUpperCase() === "IF" ||
      valueIfTrue[0]?.toUpperCase() === "CASE" ||
      valueIfTrue[1]?.toUpperCase() === "CASE") &&
    valueIfTrue[valueIfFalse.length - 1] !== ")"
  ) {
    valueIfTrue.push(" ");
    valueIfTrue.push(")");
    valueIfTrue.push(" ");
  }
  if (
    (valueIfFalse[0]?.toUpperCase() === "IF" ||
      valueIfFalse[1]?.toUpperCase() === "IF" ||
      valueIfFalse[0]?.toUpperCase() === "CASE" ||
      valueIfFalse[1]?.toUpperCase() === "CASE") &&
    valueIfFalse[valueIfFalse.length - 1] !== ")"
  ) {
    valueIfFalse.push(" ");
    valueIfFalse.push(")");
    valueIfFalse.push(" ");
  }

  // convert to nodes
  console.log("Expressions: ", ifExpression, valueIfTrue, valueIfFalse);
  const ifExprNode = await parseFormula(ifExpression.join(" "));
  const trueNode = await parseFormula(valueIfTrue.join(" "));
  const falseNode = await parseFormula(valueIfFalse.join(" "));
  console.log("Nodes: ", ifExprNode, trueNode, falseNode);

  // build the return node
  const N = {
    type: "logical",
    functionName: "IF",
    //children: [ifExprNode, trueNode, falseNode],
    children: [trueNode, falseNode],
  };
  return N;
};

const parseCase = async (tokens) => {
  console.log(">>>parseCase: ", tokens);

  if (tokens[0].toUpperCase() !== "CASE") {
    throw new Error("Invalid CASE statement");
  }

  if (tokens.lastIndexOf(")") === -1) {
    throw new Error("Invalid CASE statement: Did not find END");
  }

  let _tokens = tokens.slice();
  _tokens.shift();

  let caseExpr;
  let matches = [];
  let values = [];
  let valueIfNoMatch;

  let e = {};
  e = getNextExpression(_tokens, ["("]);
  e = getNextExpression(e.remainingTokens, [","]);
  if (e.expression) {
    caseExpr = e.expression;
  }

  // matches = { 1,2,3 }
  //  skip to beginning of matches
  e = getNextExpression(e.remainingTokens, ["{"]);
  e = getNextExpression(e.remainingTokens, ["}"]);
  if (e.expression) {
    matches = e.expression;
  }

  // values = { 'a', 'b', 'c' }
  //  skip to beginning of values
  e = getNextExpression(e.remainingTokens, ["{"]);
  e = getNextExpression(e.remainingTokens, ["}"]);
  if (e.expression) {
    values = e.expression;
  }

  // valueIfNoMatch = 'd'
  //  skip to beginning of valueIfNoMatch
  e = getNextExpression(e.remainingTokens, [","]);
  e = getNextExpression(e.remainingTokens, [")"]);
  if (e.expression) {
    valueIfNoMatch = e.expression;
  }

  // convert to nodes
  console.log("caseExpr: ", caseExpr, matches, values, valueIfNoMatch);
  const caseNode = await parseFormula(caseExpr.join(" "));
  const matchNodes = [];
  matches = matches.join(" ").split(",");
  for (let i = 0; i < matches.length; i++) {
    const matchNode = await parseFormula(matches[i]);
    matchNodes.push(matchNode);
  }
  const valueNodes = [];
  values = values.join(" ").split(",");
  for (let i = 0; i < values.length; i++) {
    const valueNode = await parseFormula(values[i]);
    valueNodes.push(valueNode);
  }
  const valueIfNoMatchNode = await parseFormula(valueIfNoMatch.join(" "));
  console.log(
    "caseNode: ",
    caseNode,
    matchNodes,
    valueNodes,
    valueIfNoMatchNode
  );

  // build the return node
  const N = {
    type: "logical",
    functionName: "CASE",
    children: [matchNodes, valueNodes, valueIfNoMatchNode],
  };
  return N;
};

const quoteLiteralValue = (value) => {
  if (value) {
    let arr = value.split(" ");
    // if array contains an equals, and the next element is not single quoted, then quote it
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === "=") {
        if (!arr[i + 1].startsWith("'") && !arr[i + 1].endsWith("'")) {
          arr[i + 1] = `'${arr[i + 1]}'`;
        }
      }
    }
    return arr.join(" ");
  } else {
    return value;
  }
};

export const getAllLiteralValues = (node, options) => {
  const values = [];

  // if node is an object, put it in an array
  let _nodes = node;
  if (typeof node === "object" && !Array.isArray(node)) {
    _nodes = [node];
  }

  _nodes.forEach((_node) => {
    if (_node.type === "literal") {
      let v = _node.value;
      if (options?.stripSingleQuotes) {
        v = v.replace(/'/g, "");
      }
      values.push(v);
    } else if (_node.type === "logical") {
      for (let i = 0; i < _node.children.length; i++) {
        values.push(...getAllLiteralValues(_node.children[i], options));
      }
    }
  });

  if (node.functionName === "CASE") {
    if (node.children?.[0].length) {
      //remove the first N elements from the values array
      values.splice(0, node.children[0].length);
    }
  }

  return Array.from(new Set(values));
};

export const parseFormula = async (formula) => {
  console.log(">>>parseFormula: ", formula);
  const sanitizedFormula = sanitize(formula);
  console.log(">>>parseFormula: sanitized: ", sanitizedFormula);
  const tokens = sanitizedFormula.split(" ");
  let N;

  const token = tokens[0];
  const f = getParseFunction(token);
  if (f?.parseFunction) {
    N = await f.parseFunction(tokens);
  } else {
    if (f && f.type !== "literal") {
      console.error("UNSUPPORTED FUNCTION TYPE: ", f.type, token);
    }
    return {
      type: "literal",
      value: quoteLiteralValue(tokens.join(" ").replace(/\[|\]/g, "")),
    };
  }

  console.log("<<<parseFormula: ", N);
  return N;
};

const parseFunctions = {
  IF: parseIF,
  CASE: parseCase,
};
