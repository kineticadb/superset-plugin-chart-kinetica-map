/*
IF ( [Connection_Category] = '5G' ) THEN '5G'
ELSEIF ( [Connection_Category] = '5G NSA' ) THEN '5G'
ELSE 'OTHER'
END

{
  "type": "number | string | date | type_conversion | logical | aggregate | passthrough | user | table_calculation | spatial",
  "function": "function_name",
  "expressions": [],
  "children": [],
}
*/

const functions = {
  logical: [
    "AND",
    "CASE",
    "IF",
    "IFNULL",
    "IIF",
    "IN",
    "ISNULL",
    "NOT",
    "OR",
    "ZN",
  ],
  number: [
    "ABS",
    "ACOS",
    "ASIN",
    "ATAN",
    "ATAN2",
    "COS",
    "COT",
    "DEGREES",
    "DIV",
    "EXP",
    "HEXBINX",
    "HEXBINY",
    "LN",
    "LOG",
    "MIN",
    "MAX",
    "POWER",
    "RADIANS",
    "ROUND",
    "SIGN",
    "SIN",
    "SQRT",
    "TAN",
  ],
  string: [
    "ASCII",
    "CHAR",
    "CONTAINS",
    "ENDSWITH",
    "FIND",
    "ISDATE",
    "LEFT",
    "LEN",
    "LOWER",
    "LTRIM",
    "MID",
    "REPLACE",
    "RIGHT",
    "RTRIM",
    "SPACE",
    "STARTSWITH",
    "TRIM",
    "UPPER",
  ],
  date: [
    "DATEADD",
    "DATEDIFF",
    "DATEPART",
    "DATETRUNC",
    "DAY",
    "MONTH",
    "NOW",
    "QUARTER",
    "TODAY",
    "WEEK",
    "YEAR",
  ],
  type_conversion: [
    "DATE",
    "DATETIME",
    "FLOAT",
    "INT",
    "MAKELINE",
    "MAKEPOINT",
    "STR",
  ],
  aggregate: [
    "ATTR",
    "AVG",
    "COLLECT",
    "COUNT",
    "COUNTD",
    "EXCLUDE",
    "FIXED",
    "INCLUDE",
    "SUM",
  ],
  passthrough: [
    "RAWSQLAGG_BOOL",
    "RAWSQLAGG_DATE",
    "RAWSQLAGG_DATETIME",
    "RAWSQLAGG_INT",
    "RAWSQLAGG_REAL",
    "RAWSQLAGG_STR",
    "RAWSQL_BOOL",
    "RAWSQL_DATE",
    "RAWSQL_DATETIME",
    "RAWSQL_INT",
    "RAWSQL_REAL",
    "RAWSQL_STR",
  ],
  user: [
    "FULLNAME",
    "ISFULLNAME",
    "ISMEMBEROF",
    "ISUSERNAME",
    "USERDOMAIN",
    "USERNAME",
  ],
  table_calculation: [
    "FIRST",
    "INDEX",
    "LAST",
    "LOOKUP",
    "MODEL_EXTENSION_BOOL",
    "MODEL_EXTENSION_INT",
    "MODEL_EXTENSION_REAL",
    "MODEL_EXTENSION_STR",
    "MODEL_PERCENTILE",
    "MODEL_QUANTILE",
    "PREVIOUS_VALUE",
    "RANK",
    "RANK_DENSE",
    "RANK_MODIFIED",
    "RANK_PERCENTILE",
    "RANK_UNIQUE",
    "RUNNING_AVG",
    "RUNNING_COUNT",
    "RUNNING_MAX",
    "RUNNING_MIN",
    "RUNNING_SUM",
    "SCRIPT_BOOL",
    "SCRIPT_INT",
    "SCRIPT_REAL",
    "SCRIPT_STR",
    "SIZE",
    "TOTAL",
    "WINDOW_AVG",
    "WINDOW_CORR",
    "WINDOW_COUNT",
    "WINDOW_COVAR",
    "WINDOW_COVARP",
    "WINDOW_MAX",
    "WINDOW_MEDIAN",
    "WINDOW_MIN",
    "WINDOW_PERCENTILE",
    "WINDOW_STDEV",
    "WINDOW_STDEVP",
    "WINDOW_SUM",
    "WINDOW_VAR",
    "WINDOW_VARP",
  ],
  spatial: ["AREA", "BUFFER", "DISTANCE", "MAKELINE", "MAKEPOINT"],
};

const sanitize = (formula) => {
  let f = formula.replace(/\s+/g, " ").trim();
  f = f.replace(/(\(|\))/g, " $1 ");
  return f;
};

const isUniqueArray = (arr, arrOfArrs) => {
  for (let i = 0; i < arrOfArrs.length; i++) {
    if (
      arrOfArrs[i].length === arr.length &&
      arrOfArrs[i].every((val, index) => val === arr[index])
    ) {
      return false;
    }
  }
  return true;
};

const nextIndex = (arr, token, idx) => {
  for (let i = idx; i < arr.length; i++) {
    if (arr[i].toUpperCase() === token.toUpperCase()) {
      return i;
    }
  }
  return -1;
};

const getNextExpression = (tokens, stopTokens) => {
  console.log("getNextExpression: ", tokens, stopTokens);

  let mixedCaseStopTokens = stopTokens;
  if (stopTokens.length > 0) {
    mixedCaseStopTokens = stopTokens.map((t) =>
      [t.toLowerCase(), t.toUpperCase()].flat()
    );
    mixedCaseStopTokens = mixedCaseStopTokens.flat();
  }

  const expression = [];
  if (tokens && tokens.length > 0) {
    console.log("mixedCaseStopTokens: ", mixedCaseStopTokens);
    while (mixedCaseStopTokens.indexOf(tokens[0].toUpperCase()) === -1) {
      let v = tokens.shift();
      // remove starting and trailing double quotes
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      // single quotes
      if (v.startsWith("'") && v.endsWith("'")) {
        v = v.slice(1, -1);
      }
      expression.push(v);
    }
  }
  const r = {
    expression,
    remainingTokens: tokens,
    stopToken: tokens?.shift()?.toUpperCase(),
  };
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

const parseCountDistinct = async (tokens) => {
  console.log(">>>parseCountDistinct: ", tokens);
  const tokensUppercased = tokens.map((t) => t.toUpperCase());
  if (tokensUppercased[0] !== "COUNTD") {
    throw new Error("Invalid COUNTD statement");
  }

  // Since COUNTD requires a select count(distinct column) from table, we will bypass
  // and just return a 1 which will allow the rest of the calculated field to be parsed
  // Handling it (even in this way), instead of having no handler function will result in a
  // warning in the UI.
  const N = {
    type: "aggregate",
    functionName: "COUNTD",
    children: [],
    sql: "1",
  };
  console.log("<<<parseCountDistinct:  ", N);
  return N;
};

const parseContains = async (tokens) => {
  console.log(">>>parseContains: ", tokens);
  if (tokens[0] !== "CONTAINS") {
    throw new Error("Invalid CONTAINS statement");
  }
  const N = {
    type: "string",
    function: "CONTAINS",
    children: [],
  };

  let startIdx = nextIndex(tokens, "(", 1);
  let endIdx = nextIndex(tokens, ")", startIdx + 1);
  let expr = tokens
    .slice(startIdx + 1, endIdx)
    .filter((t) => t !== ",")
    .filter((t) => t !== "");
  console.log("expr: ", expr);

  let arg1;
  if (expr[0].endsWith(",")) {
    arg1 = expr[0].slice(0, -1);
  } else {
    arg1 = expr[0];
  }

  let arg2 = expr[1];

  let n1 = await parseFormula(arg1);
  let n2 = await parseFormula(arg2);

  if (n1 && n2) {
    N.sql = `( ${n1.value} LIKE '%${n2.value.replaceAll('"', "")}%' )`;
  }

  N.children.push(n1);
  N.children.push(n2);
  console.log("<<<parseContains:  ", N);
  return N;
};

const parseIfNull = async (tokens) => {
  console.log(">>>parseIfNull: ", tokens);
  if (tokens[0] !== "IFNULL") {
    throw new Error("Invalid IFNULL statement");
  }
  const N = {
    type: "string",
    function: "IFNULL",
    children: [],
  };

  let startIdx = nextIndex(tokens, "(", 1);
  let endIdx = nextIndex(tokens, ")", startIdx + 1);
  let expr = tokens
    .slice(startIdx + 1, endIdx)
    .filter((t) => t !== ",")
    .filter((t) => t !== "");
  console.log("expr: ", expr);

  let arg1;
  if (expr[0].endsWith(",")) {
    arg1 = expr[0].slice(0, -1);
  } else {
    arg1 = expr[0];
  }

  let arg2 = expr[1];

  let n1 = await parseFormula(arg1);
  let n2 = await parseFormula(arg2);

  if (n1 && n2) {
    N.sql = `IFNULL( ${n1.sql ? n1.sql : n1.value}, ${
      n2.sql ? n2.sql : n2.value
    } )`;
  }

  N.children.push(n1);
  N.children.push(n2);
  console.log("<<<parseIfNull:  ", N);
  return N;
};

const parseIF = async (tokens) => {
  console.log(">>>parseIF: ", tokens);

  if (tokens[0].toUpperCase() !== "IF") {
    throw new Error("Invalid IF statement");
  }

  if (tokens.indexOf("END") === -1) {
    throw new Error("Invalid IF statement: Did not find END");
  }

  let _tokens = tokens.slice();
  _tokens.shift();

  let elseIfExprs = [];
  let thenExprs = [];
  let elseExpr;
  const { expression, remainingTokens, stopToken } = getNextExpression(
    _tokens,
    ["THEN"]
  );
  if (expression) {
    elseIfExprs.push(expression);
  }

  let e = { stopToken: stopToken };
  while (true) {
    if (e.stopToken === "THEN") {
      e = getNextExpression(remainingTokens, ["ELSEIF", "ELSE", "END"]);
      thenExprs.push(e.expression);
    } else if (e.stopToken === "ELSEIF") {
      e = getNextExpression(remainingTokens, ["THEN"]);
      elseIfExprs.push(e.expression);
    } else if (e.stopToken === "ELSE") {
      e = getNextExpression(remainingTokens, ["END"]);
      elseExpr = e.expression;
    } else {
      break;
    }
  }

  // convert to nodes
  console.log("Expressions: ", elseIfExprs, thenExprs, elseExpr);
  const elseIfNodes = [];
  for (let i = 0; i < elseIfExprs.length; i++) {
    const elseIfNode = await parseFormula(elseIfExprs[i].join(" "));
    elseIfNodes.push(elseIfNode);
  }
  const thenNodes = [];
  for (let i = 0; i < thenExprs.length; i++) {
    const thenNode = await parseFormula(thenExprs[i].join(" "));
    thenNodes.push(thenNode);
  }
  const elseNode = await parseFormula(elseExpr.join(" "));
  console.log("Nodes: ", elseIfNodes, thenNodes, elseNode);

  // build sql map
  const sqlMap = thenNodes.map((thenNode, i) => {
    return {
      [thenNode.value]: `${
        elseIfNodes[i].sql ? elseIfNodes[i].sql : elseIfNodes[i].value
      }`,
    };
  });

  if (elseNode) {
    const elseIfValues = elseIfNodes.map((w) => {
      return w.sql ? w.sql : w.value;
    });
    sqlMap.push({ [elseNode.value]: `NOT (${elseIfValues.join(" OR ")})` });
  }

  // build the return node
  const N = {
    type: "logical",
    functionName: "IF",
    children: [elseIfNodes, thenNodes, elseNode],
    sql: sqlMap,
  };
  return N;
};

const parseCase = async (tokens) => {
  console.log(">>>parseCase: ", tokens);

  if (tokens[0].toUpperCase() !== "CASE") {
    throw new Error("Invalid CASE statement");
  }

  if (tokens.indexOf("END") === -1) {
    throw new Error("Invalid CASE statement: Did not find END");
  }

  let _tokens = tokens.slice();
  _tokens.shift();

  let caseExpr;
  const { expression, remainingTokens, stopToken } = getNextExpression(
    _tokens,
    ["WHEN"]
  );
  if (expression) {
    caseExpr = expression;
  }

  let whenExprs = [];
  let thenExprs = [];
  let elseExpr;
  let e = { stopToken: stopToken };
  while (true) {
    if (e.stopToken === "WHEN") {
      e = getNextExpression(remainingTokens, ["THEN"]);
      whenExprs.push(e.expression);
    } else if (e.stopToken === "THEN") {
      e = getNextExpression(remainingTokens, ["WHEN", "ELSE", "END"]);
      thenExprs.push(e.expression);
    } else if (e.stopToken === "ELSE") {
      e = getNextExpression(remainingTokens, ["END"]);
      elseExpr = e.expression;
    } else {
      break;
    }
  }

  // convert to nodes
  console.log("caseExpr: ", caseExpr, whenExprs, thenExprs, elseExpr);
  const caseNode = await parseFormula(caseExpr.join(" "));
  const whenNodes = [];
  for (let i = 0; i < whenExprs.length; i++) {
    const whenNode = await parseFormula(whenExprs[i].join(" "));
    whenNodes.push(whenNode);
  }
  const thenNodes = [];
  for (let i = 0; i < thenExprs.length; i++) {
    const thenNode = await parseFormula(thenExprs[i].join(" "));
    thenNodes.push(thenNode);
  }
  const elseNode = await parseFormula(elseExpr.join(" "));
  console.log("caseNode: ", caseNode, whenNodes, thenNodes, elseNode);

  // build sql map
  const sqlMap = thenNodes.map((thenNode, i) => {
    return {
      [thenNode.value]: `${caseNode.value} = '${
        whenNodes[i].sql ? whenNodes[i].sql : whenNodes[i].value
      }'`,
    };
  });

  if (elseNode) {
    const whenValues = whenNodes.map((w) => {
      return `'${w.sql ? w.sql : w.value}'`;
    });
    sqlMap.push({
      [elseNode.value]: `${caseNode.value} NOT IN (${whenValues.join(", ")})`,
    });
  }

  // build the return node
  const N = {
    type: "logical",
    functionName: "CASE",
    children: [caseNode, whenNodes, thenNodes, elseNode],
    sql: sqlMap,
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

export const parseFormula = async (formula) => {
  console.log(">>>parseFormula: ", formula);
  const sanitizedFormula = sanitize(formula);
  console.log(">>>parseFormula: sanitized: ", sanitizedFormula);
  const tokens = sanitizedFormula.split(" ");
  let N;

  const token = tokens[0];
  const f = getParseFunction(token);
  console.log(">>>parseFormula: token: ", token, f);
  if (f?.parseFunction) {
    N = await f.parseFunction(tokens);
  } else {
    let _error = undefined;
    if (f && f.type !== "literal") {
      console.error("UNSUPPORTED FUNCTION TYPE: ", f.type, token);
      _error = "UNSUPPORTED FUNCTION TYPE: " + f.type + " " + token;
    }
    console.log(
      "returning quoteLiteralValue: ",
      tokens.join(" ").replace(/\[|\]/g, "")
    );
    N = {
      type: "literal",
      value: quoteLiteralValue(tokens.join(" ").replace(/\[|\]/g, "")),
    };
    if (_error) {
      N.error = _error;
    }
    console.log("<<<parseFormula: ", N);
    return N;
  }

  console.log("<<<parseFormula: ", N);
  return N;
};

const parseFunctions = {
  IF: parseIF,
  IFNULL: parseIfNull,
  CASE: parseCase,
  CONTAINS: parseContains,
  COUNTD: parseCountDistinct,
};
