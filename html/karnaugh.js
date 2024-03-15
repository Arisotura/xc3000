
/**
 * Return "nice" formula of three variables corresponding to truth table n.
 * v0 is low-order bit in n.
 */

function formula4(n, labels)
{
  return formulaString(n | (n << 16), labels);
}

function formula5(n, labels)
{
  return formulaString(n, labels);
}

// Generate a formula given a truth table of five variables.
// Uses a greedy Karnaugh map algorithm. I.e. grab single-variable terms that work, then two-variable terms, three-variable terms, four-variable terms, finally five-variable terms.
// Data structure to hold truth table: 16-bit number where bit 1<<n indicates the output value (0, 1) for input EDCBA (converted to a binary index)
// E.g. 0000000000000001 indicates the only 1 output is for f(0, 0, 0, 0, 0)
// 10101010101010101010101010101010 indicates 1 output if V0 is set, i.e. f(V0, V1, V2, V3, v4) = V0.

function formulaString(table, labels) {
  // Handle special cases (constant output)
  if (table == 0xffff) {
    return "1";
  } else if (table == 0) {
    return "0";
  }

  function chkinput(lut, inp)
  {
    var mask = [0x55555555, 0x33333333, 0x0F0F0F0F, 0x00FF00FF, 0x0000FFFF][inp];
    return ((lut & mask) != ((lut >> (1<<inp)) & mask));
  }

  let relevant = [];
  for (let i = 0; i < 5; i++)
    relevant[i] = chkinput(table, i);

  let ones = table; // Bits that must be 1, diminishing as terms set bits
  let zeros = ~table; // Bits that must be 0
  result = []; // Collection of terms
  let done = false;

  function apply(query) {
    potential_table = generatePotentialTable(query);
    if (potential_table & zeros) {
      // Reject this option as it sets a bit that must be 0
    } else if (potential_table & ones) {
      // This term matches a 1 that we need to set.
      ones &= ~potential_table; // Remove the 1's that this term handles
      result.push(queryToTerm(query, labels));
      if (ones == 0) {
        done = true;
      }
    } else {
      // This term doesn't set any 1's that need to be set so it is redundant
    }
  }

  // Recursive function to try terms
  // Inputs: query: [V0, V1, V2, V3, V4] values 1, 0, or -1 (don't care)
  //   terms: number of terms to add
  //   index: the position in query to start updating. E.e. index == 2 indicates that V0 and V1 are set but V2 and V3 can be modified
  function testQueries(query, terms, index) { 
    if (done) {
      return;
    }
    if (terms + index > 5) {
      return; // Not enough space left
    }
    if (terms == 0) {
      // Query is complete, so evaluate
      apply(query);
    } else {
      for (let i = index; i < 5; i++) {
        if (relevant[i])
        {
          query[i] = 0; // Try a 0 in position i
          testQueries(query, terms - 1, index + 1);
          query[i] = 1; // Try a 1 in position i
          testQueries(query, terms - 1, index + 1);
          query[i] = -1; // Reset
        }
        else
        {
          query[i] = -1;
          testQueries(query, terms - 1, index + 1);
        }
      }
    }
  }

  for (let terms = 1; terms <= 5; terms++) {
    testQueries([-1, -1, -1, -1, -1], terms, 0);
  }

  return result.join(" + ");
}

// Generate the truth table for a product term specified by "query".
// V0 query is a vector [V0, V1, V2, V3, V4] where 1 indicates the variable must be 1, 0 indicates the variable must be 0, and -1 indicates don't care.
function generatePotentialTable(query) {
  const V0 = 0xaaaaaaaa; // Truth table for f(V0, V1, V2, V3, V4) = V0
  const V1 = 0xcccccccc; // Truth table for f(V0, V1, V2, V3, V4) = V1
  const V2 = 0xf0f0f0f0; // Truth table for f(V0, V1, V2, V3, V4) = V2
  const V3 = 0xff00ff00; // Truth table for f(V0, V1, V2, V3, V4) = V3
  const V4 = 0xffff0000; // Truth table for f(V0, V1, V2, V3, V4) = V4
  const terms = [V0, V1, V2, V3, V4];

  let table = 0xffffffff;
  for (let i = 0; i < 5; i++) {
    if (query[i] == 1) {
      table &= terms[i]; // Only use terms where that variable is 1
    } else if (query[i] == 0) {
      table &= ~terms[i]; // Only use terms where that variable is 0
    }
  }
  return table;
}

// Converts a query into a term
// E.g. [0, 1, -1, -1] -> "~V0 * V1"
function queryToTerm(query, labels) {
  let parts = [];
  for (let i = 0; i < 5; i++) {
    if (query[i] == 0) {
      parts.push("~" + labels[i]);
    } else if (query[i] == 1) {
      parts.push(labels[i]);
    }
  }
  return parts.join(" * ");
}
